const XLSX = require('xlsx');
const prisma = require('../../config/prisma');
const { v4: uuidv4 } = require('uuid');

// Helper to normalize keys from Excel headers
const normalizeKey = (key) => {
  if (!key) return '';
  return String(key)
    .toLowerCase()
    .replace(/\*/g, '')
    .replace(/\(.*?\)/g, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();
};

// Helper to parse dates safely from Excel strings, numbers, or Date objects
const parseExcelDate = (val) => {
  if (!val) return null;
  if (val instanceof Date) {
    return isNaN(val.getTime()) ? null : val;
  }
  
  if (typeof val === 'number') {
    // Excel serial date to JS Date
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));
    const jsDate = new Date(excelEpoch.getTime() + val * 86400000);
    return isNaN(jsDate.getTime()) ? null : jsDate;
  }

  const str = String(val).trim();
  if (!str || str === 'Invalid Date') return null;

  // Try YYYY-MM-DD
  const isoMatch = str.match(/^(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})$/);
  if (isoMatch) {
    const d = new Date(parseInt(isoMatch[1]), parseInt(isoMatch[2]) - 1, parseInt(isoMatch[3]));
    return isNaN(d.getTime()) ? null : d;
  }

  // Try DD-MM-YYYY or DD/MM/YYYY
  const dmyMatch = str.match(/^(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})$/);
  if (dmyMatch) {
    const d = new Date(parseInt(dmyMatch[3]), parseInt(dmyMatch[2]) - 1, parseInt(dmyMatch[1]));
    return isNaN(d.getTime()) ? null : d;
  }

  const parsed = new Date(str);
  return isNaN(parsed.getTime()) ? null : parsed;
};

// Helper to parse decimals/numbers
const parseDecimal = (val) => {
  if (val === undefined || val === null || val === '') return null;
  const num = parseFloat(String(val).replace(/,/g, '').trim());
  return isNaN(num) ? null : num;
};

// Helper to parse boolean from Excel YES/NO or true/false
const parseBoolean = (val) => {
  if (!val) return false;
  const s = String(val).trim().toUpperCase();
  return s === 'YES' || s === 'TRUE' || s === '1' || s === 'Y';
};

// Helper to resolve active farmId dynamically from req or employee profile
const getFarmId = async (req) => {
  if (req.farmId) return req.farmId;
  const headerId = req.header('X-Farm-ID') || req.header('x-farm-id');
  if (headerId) return headerId;
  if (req.employee?.id) {
    const membership = await prisma.farm_employees.findFirst({
      where: { employee_id: req.employee.id }
    });
    if (membership) return membership.farm_id;
  }
  return null;
};

// 1. GENERATE & DOWNLOAD EXCEL TEMPLATE
exports.downloadAnimalTemplate = async (req, res) => {
  try {
    const farmId = await getFarmId(req);

    // Fetch farm's active breeds & default breeds
    const breeds = await prisma.breeds.findMany({
      where: farmId ? {
        OR: [{ farm_id: farmId }, { is_default: true }]
      } : { is_default: true },
      select: { name: true, animal_type: true }
    });

    // Fetch farm's locations
    const locations = farmId ? await prisma.locations.findMany({
      where: { farm_id: farmId },
      select: { code: true, name: true, type: true }
    }) : [];

    // Sheet 1: Template Data (Headers + Sample Rows)
    // Headers specified: Sn, Teg. No., Breed, Gender, color, Batch, Born at farm, purchased, shed No., Age, Birth type, Teeth Stage, Purchase Date, Rate, Landing Cost, Purchase Wight, Remark
    const headers = [
      'Sn',
      'Teg. No.',
      'Breed',
      'Gender',
      'color',
      'Batch',
      'Born at farm',
      'purchased',
      'shed No.',
      'Age',
      'Birth type',
      'Teeth Stage',
      'Purchase Date',
      'Rate',
      'Landing Cost',
      'Purchase Wight',
      'Remark'
    ];

    const sampleBreed1 = breeds[0]?.name || 'Sirohi';
    const sampleBreed2 = breeds[1]?.name || 'Barbari';
    const sampleLoc1 = locations[0]?.name || 'Shed A';
    const sampleLoc2 = locations[1]?.name || 'Shed B';

    const sampleRows = [
      [
        1, 'GB-101', sampleBreed1, 'FEMALE', 'Brown', 'BATCH-1', 'YES', 'NO', sampleLoc1, 12, 'SINGLE', '2 Teeth', '', '', '', '', 'Healthy doe'
      ],
      [
        2, 'GB-102', sampleBreed2, 'MALE', 'White', 'BATCH-1', 'NO', 'YES', sampleLoc2, 18, 'TWIN', '4 Teeth', '2024-02-10', 9500, 500, 22.5, 'Purchased breeder buck'
      ]
    ];

    const animalWsData = [headers, ...sampleRows];
    const animalWs = XLSX.utils.aoa_to_sheet(animalWsData);

    // Set column widths for layout
    animalWs['!cols'] = [
      { wch: 6 },  // Sn
      { wch: 16 }, // Teg. No.
      { wch: 18 }, // Breed
      { wch: 14 }, // Gender
      { wch: 14 }, // color
      { wch: 14 }, // Batch
      { wch: 16 }, // Born at farm
      { wch: 14 }, // purchased
      { wch: 16 }, // shed No.
      { wch: 10 }, // Age
      { wch: 16 }, // Birth type
      { wch: 16 }, // Teeth Stage
      { wch: 18 }, // Purchase Date
      { wch: 14 }, // Rate
      { wch: 16 }, // Landing Cost
      { wch: 18 }, // Purchase Wight
      { wch: 26 }  // Remark
    ];

    // Sheet 2: Reference & Guidelines
    const refHeaders = ['Available Breeds', 'Breed Type', '', 'Available Locations (shed No.)', 'Location Code', '', 'Header Field', 'Allowed Values & Rules'];
    const maxLen = Math.max(breeds.length, locations.length, 12);
    const refRows = [];

    const fieldRules = [
      { field: 'Sn', rule: 'Serial Number (1, 2, 3...). Used for row reference in error reports.' },
      { field: 'Teg. No.', rule: 'Tag Number. Must be unique across farm and spreadsheet. Required.' },
      { field: 'Breed', rule: 'Must match an existing breed name in your farm (e.g. Sirohi, Barbari). Required.' },
      { field: 'Gender', rule: 'MALE or FEMALE. Required.' },
      { field: 'color', rule: 'Color description (e.g. Brown, White).' },
      { field: 'Batch', rule: 'Batch identifier (e.g. BATCH-1).' },
      { field: 'Born at farm', rule: 'YES or NO. (YES sets acquisition method to BORN).' },
      { field: 'purchased', rule: 'YES or NO. (YES sets acquisition method to PURCHASED).' },
      { field: 'shed No.', rule: 'Must match an existing location/shed name or code in your farm.' },
      { field: 'Age', rule: 'Age in months (numeric value, e.g. 12).' },
      { field: 'Birth type', rule: 'SINGLE, TWIN, TRIPLET, QUADRUPLET, OTHERS.' },
      { field: 'Teeth Stage', rule: 'Milk teeth, 2 Teeth, 4 Teeth, 6 Teeth, 8 Teeth.' },
      { field: 'Purchase Date', rule: 'YYYY-MM-DD or DD/MM/YYYY format.' },
      { field: 'Rate', rule: 'Purchase price/rate per animal.' },
      { field: 'Landing Cost', rule: 'Landing/transport cost.' },
      { field: 'Purchase Wight', rule: 'Purchase weight in kg.' },
      { field: 'Remark', rule: 'Additional notes or remarks.' }
    ];

    for (let i = 0; i < maxLen; i++) {
      const b = breeds[i];
      const l = locations[i];
      const r = fieldRules[i];
      refRows.push([
        b ? b.name : '',
        b ? (b.animal_type || 'Goat') : '',
        '',
        l ? l.name : '',
        l ? (l.code || '') : '',
        '',
        r ? r.field : '',
        r ? r.rule : ''
      ]);
    }

    const refWsData = [refHeaders, ...refRows];
    const refWs = XLSX.utils.aoa_to_sheet(refWsData);
    refWs['!cols'] = [
      { wch: 22 },
      { wch: 16 },
      { wch: 4 },
      { wch: 30 },
      { wch: 16 },
      { wch: 4 },
      { wch: 20 },
      { wch: 55 }
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, animalWs, 'Animals Template');
    XLSX.utils.book_append_sheet(wb, refWs, 'Reference & Guidelines');

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    if (req.query.format === 'base64') {
      return res.json({
        filename: 'goatbook_animals_template.xlsx',
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        base64: buffer.toString('base64')
      });
    }

    res.setHeader('Content-Disposition', 'attachment; filename="goatbook_animals_template.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    return res.send(buffer);
  } catch (err) {
    console.error('BULK TEMPLATE ERROR:', err);
    res.status(500).json({ message: 'Failed to generate template', error: err.message });
  }
};

// 2. EXPORT CURRENT ANIMALS TO EXCEL
exports.exportAnimals = async (req, res) => {
  try {
    const farmId = await getFarmId(req);
    if (!farmId) return res.status(400).json({ message: 'No farm selected' });

    const where = { farm_id: farmId };
    if (req.query.status) {
      where.status = req.query.status.toUpperCase();
    }
    if (req.query.gender) {
      where.gender = req.query.gender.toUpperCase();
    }

    const animals = await prisma.animals.findMany({
      where,
      include: {
        breeds: true,
        locations: true
      },
      orderBy: { created_at: 'desc' }
    });

    const headers = [
      'Sn',
      'Teg. No.',
      'Breed',
      'Gender',
      'color',
      'Batch',
      'Born at farm',
      'purchased',
      'shed No.',
      'Age',
      'Birth type',
      'Teeth Stage',
      'Purchase Date',
      'Rate',
      'Landing Cost',
      'Purchase Wight',
      'Remark'
    ];

    const rows = animals.map((a, idx) => [
      idx + 1,
      a.tag_number || '',
      a.breeds?.name || '',
      a.gender || '',
      a.color || '',
      a.batch_no || '',
      a.acquisition_method === 'BORN' ? 'YES' : 'NO',
      a.acquisition_method === 'PURCHASED' ? 'YES' : 'NO',
      a.locations?.name || a.locations?.code || '',
      a.age_in_months !== null && a.age_in_months !== undefined ? a.age_in_months : '',
      a.birth_type || '',
      a.teeth_stage || '',
      a.purchase_date ? new Date(a.purchase_date).toISOString().split('T')[0] : '',
      a.purchase_price ? parseFloat(a.purchase_price) : '',
      a.landing_cost ? parseFloat(a.landing_cost) : '',
      a.purchase_weight ? parseFloat(a.purchase_weight) : '',
      a.remark || ''
    ]);

    const wsData = [headers, ...rows];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    ws['!cols'] = headers.map(() => ({ wch: 18 }));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Animals Inventory');

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    const filename = `goatbook_animals_${new Date().toISOString().split('T')[0]}.xlsx`;

    if (req.query.format === 'base64') {
      return res.json({
        filename,
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        base64: buffer.toString('base64'),
        totalExported: animals.length
      });
    }

    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    return res.send(buffer);
  } catch (err) {
    console.error('BULK EXPORT ERROR:', err);
    res.status(500).json({ message: 'Failed to export animals', error: err.message });
  }
};

// 3. PARSE & VALIDATE ROWS FUNCTION (Reused for validate & import)
const parseAndValidateSheet = async (buffer, farmId, userSubscription) => {
  const wb = XLSX.read(buffer, { type: 'buffer', cellDates: true });
  const firstSheetName = wb.SheetNames[0];
  if (!firstSheetName) {
    throw new Error('The uploaded file does not contain any sheets.');
  }

  const ws = wb.Sheets[firstSheetName];
  const rawRows = XLSX.utils.sheet_to_json(ws, { defval: '', raw: false });

  if (!rawRows || rawRows.length === 0) {
    return {
      totalRows: 0,
      validRecords: [],
      errors: [{ sn: 1, row: 1, tagNumber: '-', column: 'File', error: 'No data rows found in the sheet.' }]
    };
  }

  // Pre-fetch farm metadata for fast lookups
  const existingAnimals = await prisma.animals.findMany({
    where: { farm_id: farmId },
    select: { tag_number: true }
  });
  const existingTagsSet = new Set(existingAnimals.map(a => a.tag_number.toLowerCase().trim()));

  const breeds = await prisma.breeds.findMany({
    where: {
      OR: [{ farm_id: farmId }, { is_default: true }]
    },
    select: { id: true, name: true, animal_type: true }
  });
  const breedMap = new Map();
  breeds.forEach(b => {
    breedMap.set(b.name.toLowerCase().trim(), b);
  });
  const validBreedsList = Array.from(new Set(breeds.map(b => b.name))).join(', ');

  const locations = await prisma.locations.findMany({
    where: { farm_id: farmId },
    select: { id: true, name: true, code: true }
  });
  const locationMap = new Map();
  locations.forEach(l => {
    if (l.code) locationMap.set(l.code.toLowerCase().trim(), l);
    if (l.name) locationMap.set(l.name.toLowerCase().trim(), l);
  });
  const validLocationsList = locations.map(l => l.name || l.code).filter(Boolean).join(', ') || 'No locations created yet';

  const errors = [];
  const validRecords = [];
  const sheetTagsSet = new Map(); // tagLower -> snVal

  for (let i = 0; i < rawRows.length; i++) {
    const raw = rawRows[i];
    const rowNum = i + 2; // Excel row number (Row 1 is header)

    // Map keys to normalized object
    const row = {};
    for (const [k, v] of Object.entries(raw)) {
      const norm = normalizeKey(k);
      if (norm) row[norm] = v;
    }

    // Sn (Serial Number) - for reporting
    const snRaw = row.sn || row.sno || row.srno || row.serial || (i + 1);
    const snVal = parseInt(snRaw, 10) || (i + 1);

    // Header extraction
    const tagNumberRaw = row.tegno || row.tagnumber || row.tagno || row.tag || '';
    const tagNumber = String(tagNumberRaw).trim();

    const breedNameRaw = row.breed || row.breedname || '';
    const breedName = String(breedNameRaw).trim();

    const genderRaw = row.gender || '';
    const gender = String(genderRaw).trim().toUpperCase();

    const color = String(row.color || row.colour || '').trim() || null;
    const batchNo = String(row.batch || row.batchno || '').trim() || null;

    const bornAtFarmRaw = row.bornatfarm || row.bornonfarm || row.born || '';
    const purchasedRaw = row.purchased || row.purchase || '';

    const shedNoRaw = row.shedno || row.shed || row.location || row.locationcode || row.locationname || '';
    const shedNo = String(shedNoRaw).trim();

    const ageRaw = row.age || row.ageinmonths || '';
    const birthTypeRaw = row.birthtype || row.birth_type || '';
    const teethStageRaw = row.teethstage || row.teeth || '';
    const teethStage = String(teethStageRaw).trim() || null;

    const purchaseDateRaw = row.purchasedate || row.purchase_date || '';
    const rateRaw = row.rate || row.purchaseprice || row.price || '';
    const landingCostRaw = row.landingcost || row.landing_cost || '';
    const purchaseWeightRaw = row.purchasewight || row.purchaseweight || row.purchase_weight || '';
    const remark = String(row.remark || row.remarks || row.notes || '').trim() || null;

    const rowErrors = [];

    // 1. Tag Number Validation (Column: Teg. No.)
    if (!tagNumber) {
      rowErrors.push({
        sn: snVal,
        row: rowNum,
        tagNumber: '-',
        column: 'Teg. No.',
        error: 'Tag Number (Teg. No.) is required and cannot be empty.'
      });
    } else {
      const tagLower = tagNumber.toLowerCase();
      if (sheetTagsSet.has(tagLower)) {
        const prevSn = sheetTagsSet.get(tagLower);
        rowErrors.push({
          sn: snVal,
          row: rowNum,
          tagNumber,
          column: 'Teg. No.',
          error: `Duplicate Tag Number "${tagNumber}" found in this spreadsheet (already used at Sn ${prevSn}).`
        });
      } else {
        sheetTagsSet.set(tagLower, snVal);
      }

      if (existingTagsSet.has(tagLower)) {
        rowErrors.push({
          sn: snVal,
          row: rowNum,
          tagNumber,
          column: 'Teg. No.',
          error: `Tag Number "${tagNumber}" already exists in your farm inventory.`
        });
      }
    }

    // 2. Breed Validation (Column: Breed)
    let matchedBreed = null;
    if (!breedName) {
      rowErrors.push({
        sn: snVal,
        row: rowNum,
        tagNumber: tagNumber || '-',
        column: 'Breed',
        error: 'Breed is required and cannot be empty.'
      });
    } else {
      matchedBreed = breedMap.get(breedName.toLowerCase());
      if (!matchedBreed) {
        rowErrors.push({
          sn: snVal,
          row: rowNum,
          tagNumber: tagNumber || '-',
          column: 'Breed',
          error: `Breed "${breedName}" does not exist in farm breeds. Available options: [${validBreedsList}].`
        });
      }
    }

    // 3. Gender Validation (Column: Gender)
    if (!gender || (gender !== 'MALE' && gender !== 'FEMALE')) {
      rowErrors.push({
        sn: snVal,
        row: rowNum,
        tagNumber: tagNumber || '-',
        column: 'Gender',
        error: `Invalid Gender "${genderRaw}". Must be either "MALE" or "FEMALE".`
      });
    }

    // 4. Acquisition Method Validation (Columns: Born at farm & purchased)
    const isBornAtFarm = parseBoolean(bornAtFarmRaw);
    const isPurchased = parseBoolean(purchasedRaw);
    let acquisitionMethod = 'BORN';

    if (bornAtFarmRaw && purchasedRaw && isBornAtFarm && isPurchased) {
      rowErrors.push({
        sn: snVal,
        row: rowNum,
        tagNumber: tagNumber || '-',
        column: 'Born at farm / purchased',
        error: 'Animal cannot be marked as both "Born at farm" = YES and "purchased" = YES. Select YES for one and NO for the other.'
      });
    } else if (isPurchased || (bornAtFarmRaw && !isBornAtFarm)) {
      acquisitionMethod = 'PURCHASED';
    } else {
      acquisitionMethod = 'BORN';
    }

    // 5. Shed No. / Location Validation (Column: shed No.)
    let locationId = null;
    if (shedNo) {
      const matchedLoc = locationMap.get(shedNo.toLowerCase());
      if (matchedLoc) {
        locationId = matchedLoc.id;
      } else {
        rowErrors.push({
          sn: snVal,
          row: rowNum,
          tagNumber: tagNumber || '-',
          column: 'shed No.',
          error: `Location/Shed "${shedNo}" does not exist in your farm locations. Available options: [${validLocationsList}].`
        });
      }
    }

    // 6. Age Validation (Column: Age)
    let ageInMonths = null;
    if (ageRaw !== '') {
      const numAge = parseDecimal(ageRaw);
      if (numAge === null || numAge < 0) {
        rowErrors.push({
          sn: snVal,
          row: rowNum,
          tagNumber: tagNumber || '-',
          column: 'Age',
          error: `Invalid Age "${ageRaw}". Must be a valid non-negative number of months (e.g. 12).`
        });
      } else {
        ageInMonths = Math.round(numAge);
      }
    }

    // 7. Birth Type Validation (Column: Birth type)
    let birthType = null;
    if (birthTypeRaw !== '') {
      const btUpper = String(birthTypeRaw).trim().toUpperCase();
      const validBirthTypes = ['SINGLE', 'TWIN', 'TRIPLET', 'QUADRUPLET', 'OTHERS'];
      if (!validBirthTypes.includes(btUpper)) {
        rowErrors.push({
          sn: snVal,
          row: rowNum,
          tagNumber: tagNumber || '-',
          column: 'Birth type',
          error: `Invalid Birth type "${birthTypeRaw}". Allowed values: ${validBirthTypes.join(', ')}.`
        });
      } else {
        birthType = btUpper;
      }
    }

    // 8. Purchase Date Validation (Column: Purchase Date)
    let purchaseDate = null;
    if (purchaseDateRaw !== '') {
      purchaseDate = parseExcelDate(purchaseDateRaw);
      if (!purchaseDate) {
        rowErrors.push({
          sn: snVal,
          row: rowNum,
          tagNumber: tagNumber || '-',
          column: 'Purchase Date',
          error: `Invalid Purchase Date "${purchaseDateRaw}". Format must be YYYY-MM-DD or DD/MM/YYYY.`
        });
      }
    }

    // 9. Rate / Purchase Price Validation (Column: Rate)
    let purchasePrice = null;
    if (rateRaw !== '') {
      purchasePrice = parseDecimal(rateRaw);
      if (purchasePrice === null || purchasePrice < 0) {
        rowErrors.push({
          sn: snVal,
          row: rowNum,
          tagNumber: tagNumber || '-',
          column: 'Rate',
          error: `Invalid Rate "${rateRaw}". Must be a valid numeric amount.`
        });
      }
    }

    // 10. Landing Cost Validation (Column: Landing Cost)
    let landingCost = null;
    if (landingCostRaw !== '') {
      landingCost = parseDecimal(landingCostRaw);
      if (landingCost === null || landingCost < 0) {
        rowErrors.push({
          sn: snVal,
          row: rowNum,
          tagNumber: tagNumber || '-',
          column: 'Landing Cost',
          error: `Invalid Landing Cost "${landingCostRaw}". Must be a valid numeric amount.`
        });
      }
    }

    // 11. Purchase Weight Validation (Column: Purchase Wight)
    let purchaseWeight = null;
    if (purchaseWeightRaw !== '') {
      purchaseWeight = parseDecimal(purchaseWeightRaw);
      if (purchaseWeight === null || purchaseWeight < 0) {
        rowErrors.push({
          sn: snVal,
          row: rowNum,
          tagNumber: tagNumber || '-',
          column: 'Purchase Wight',
          error: `Invalid Purchase Weight "${purchaseWeightRaw}". Must be a valid numeric weight in kg.`
        });
      }
    }

    // If row has any errors, collect them all and skip building valid record
    if (rowErrors.length > 0) {
      errors.push(...rowErrors);
    } else if (matchedBreed) {
      validRecords.push({
        sn: snVal,
        tagNumber,
        breedId: matchedBreed.id,
        breedName: matchedBreed.name,
        gender,
        animalType: matchedBreed.animal_type || 'Goat',
        color,
        batchNo,
        acquisitionMethod,
        locationId,
        ageInMonths,
        birthType,
        teethStage,
        purchaseDate,
        purchasePrice,
        landingCost,
        purchaseWeight,
        remark,
        rowNum
      });
    }
  }

  // Subscription plan limit check
  if (userSubscription && userSubscription.plan_name === 'BASIC') {
    const currentCount = existingAnimals.length;
    if (currentCount + validRecords.length > 50) {
      errors.push({
        sn: '-',
        row: 1,
        tagNumber: '-',
        column: 'Subscription Limit',
        error: `Importing ${validRecords.length} animals would exceed your BASIC plan limit of 50 animals (Current: ${currentCount}). Please upgrade.`
      });
    }
  }

  return {
    totalRows: rawRows.length,
    validRecords,
    errors
  };
};

// 4. VALIDATE UPLOADED EXCEL (Dry Run / Preview)
exports.validateAnimalsImport = async (req, res) => {
  try {
    const farmId = await getFarmId(req);
    if (!farmId) return res.status(400).json({ message: 'No farm selected' });

    let buffer = null;
    if (req.file) {
      buffer = req.file.buffer;
    } else if (req.body.fileBase64) {
      buffer = Buffer.from(req.body.fileBase64, 'base64');
    }

    if (!buffer) {
      return res.status(400).json({ message: 'No Excel file provided' });
    }

    const { totalRows, validRecords, errors } = await parseAndValidateSheet(buffer, farmId, req.subscription);

    return res.json({
      success: errors.length === 0,
      totalRows,
      validCount: validRecords.length,
      errorCount: errors.length,
      errors,
      preview: validRecords.slice(0, 10)
    });
  } catch (err) {
    console.error('BULK VALIDATE ERROR:', err);
    res.status(500).json({ message: 'Failed to validate file', error: err.message });
  }
};

// 5. IMPORT ANIMALS (Commit to Database)
exports.importAnimals = async (req, res) => {
  try {
    const farmId = await getFarmId(req);
    if (!farmId) return res.status(400).json({ message: 'No farm selected' });

    let buffer = null;
    if (req.file) {
      buffer = req.file.buffer;
    } else if (req.body.fileBase64) {
      buffer = Buffer.from(req.body.fileBase64, 'base64');
    }

    if (!buffer) {
      return res.status(400).json({ message: 'No Excel file provided' });
    }

    const { totalRows, validRecords, errors } = await parseAndValidateSheet(buffer, farmId, req.subscription);

    // If there are validation errors, block import and return detailed report
    if (errors.length > 0) {
      return res.status(422).json({
        success: false,
        message: `Validation failed for ${errors.length} issue(s). Please fix the errors in your Excel file and try again.`,
        totalRows,
        validCount: validRecords.length,
        errorCount: errors.length,
        errors
      });
    }

    if (validRecords.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid animal rows found to import.'
      });
    }

    const userId = req.user?.id || null;
    const now = new Date();

    // Prepare batch creation in database
    const createdAnimals = [];
    const weightEntries = [];

    for (const rec of validRecords) {
      const animalId = uuidv4();

      createdAnimals.push({
        id: animalId,
        tag_number: rec.tagNumber,
        breed_id: rec.breedId,
        gender: rec.gender,
        animal_type: rec.animalType || 'Goat',
        color: rec.color,
        batch_no: rec.batchNo,
        acquisition_method: rec.acquisitionMethod,
        location_id: rec.locationId,
        age_in_months: rec.ageInMonths,
        birth_type: rec.birthType,
        teeth_stage: rec.teethStage,
        purchase_date: rec.purchaseDate,
        purchase_price: rec.purchasePrice,
        landing_cost: rec.landingCost,
        purchase_weight: rec.purchaseWeight,
        current_weight: rec.purchaseWeight || null,
        status: 'LIVE',
        remark: rec.remark,
        farm_id: farmId,
        created_by_user_id: userId,
        updated_by_user_id: userId,
        created_at: now,
        updated_at: now
      });

      // If initial purchase weight is recorded, log it in weights table as well
      if (rec.purchaseWeight) {
        weightEntries.push({
          id: uuidv4(),
          animal_id: animalId,
          farm_id: farmId,
          weight: rec.purchaseWeight,
          tag_number: rec.tagNumber,
          date: rec.purchaseDate || now,
          remark: 'Initial bulk import purchase weight',
          created_by_user_id: userId,
          updated_by_user_id: userId,
          created_at: now,
          updated_at: now
        });
      }
    }

    // Execute batch insert in Prisma transaction
    await prisma.$transaction(async (tx) => {
      await tx.animals.createMany({
        data: createdAnimals
      });

      if (weightEntries.length > 0) {
        await tx.weights.createMany({
          data: weightEntries
        });
      }
    });

    return res.json({
      success: true,
      message: `Successfully imported ${createdAnimals.length} animal(s) into your farm!`,
      importedCount: createdAnimals.length,
      totalProcessed: totalRows
    });
  } catch (err) {
    console.error('BULK IMPORT COMMIT ERROR:', err);
    res.status(500).json({ message: 'Failed to import animals', error: err.message });
  }
};

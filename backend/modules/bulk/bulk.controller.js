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
    const headers = [
      'Tag Number *',
      'Breed Name *',
      'Gender (MALE/FEMALE) *',
      'Animal Type (Goat/Sheep)',
      'Color',
      'Birth Date (YYYY-MM-DD)',
      'Birth Weight (kg)',
      'Acquisition (BORN/PURCHASED)',
      'Purchase Date (YYYY-MM-DD)',
      'Purchase Price',
      'Purchase Weight (kg)',
      'Current Weight (kg)',
      'Female Condition (PREGNANT/NONE/KID/EMPTY)',
      'Location Code or Name',
      'Is Breeder (YES/NO)',
      'Is Qurbani (YES/NO)',
      'Mother Tag',
      'Father Tag',
      'Batch No',
      'Teeth Stage',
      'Status (LIVE/SOLD/DEAD)',
      'Remark'
    ];

    const sampleBreed1 = breeds[0]?.name || 'Sirohi';
    const sampleBreed2 = breeds[1]?.name || 'Barbari';
    const sampleLoc1 = locations[0]?.name || 'Shed A';
    const sampleLoc2 = locations[1]?.name || 'Shed B';

    const sampleRows = [
      [
        'GB-101', sampleBreed1, 'FEMALE', 'Goat', 'Brown', '2024-01-15', 3.2,
        'BORN', '', '', '', 28.5, 'NONE', sampleLoc1, 'NO', 'NO',
        'GB-M01', 'GB-F01', 'BATCH-1', '2 Teeth', 'LIVE', 'Healthy doe'
      ],
      [
        'GB-102', sampleBreed2, 'MALE', 'Goat', 'White', '2023-11-20', 2.8,
        'PURCHASED', '2024-02-10', 9500, 22.0, 34.0, '', sampleLoc2, 'YES', 'NO',
        '', '', 'BATCH-1', '4 Teeth', 'LIVE', 'Active breeder buck'
      ]
    ];

    const animalWsData = [headers, ...sampleRows];
    const animalWs = XLSX.utils.aoa_to_sheet(animalWsData);

    // Set column widths for layout
    animalWs['!cols'] = [
      { wch: 16 }, // Tag Number
      { wch: 18 }, // Breed Name
      { wch: 22 }, // Gender
      { wch: 22 }, // Animal Type
      { wch: 14 }, // Color
      { wch: 22 }, // Birth Date
      { wch: 18 }, // Birth Weight
      { wch: 26 }, // Acquisition
      { wch: 24 }, // Purchase Date
      { wch: 16 }, // Purchase Price
      { wch: 20 }, // Purchase Weight
      { wch: 18 }, // Current Weight
      { wch: 38 }, // Female Condition
      { wch: 22 }, // Location
      { wch: 18 }, // Is Breeder
      { wch: 18 }, // Is Qurbani
      { wch: 16 }, // Mother Tag
      { wch: 16 }, // Father Tag
      { wch: 16 }, // Batch No
      { wch: 16 }, // Teeth Stage
      { wch: 22 }, // Status
      { wch: 26 }  // Remark
    ];

    // Sheet 2: Reference & Help
    const refHeaders = ['Available Breeds', 'Breed Type', '', 'Available Locations', 'Location Code', '', 'Field', 'Allowed Values / Format'];
    const maxLen = Math.max(breeds.length, locations.length, 8);
    const refRows = [];

    const fieldRules = [
      { field: 'Tag Number *', rule: 'Unique identifier for animal (e.g. GB-101). Required.' },
      { field: 'Breed Name *', rule: 'Must match one of the available breeds. Required.' },
      { field: 'Gender *', rule: 'MALE or FEMALE. Required.' },
      { field: 'Acquisition', rule: 'BORN or PURCHASED (Default: BORN)' },
      { field: 'Female Condition', rule: 'PREGNANT, NONE, KID, EMPTY (Only for FEMALE)' },
      { field: 'Status', rule: 'LIVE, SOLD, DEAD (Default: LIVE)' },
      { field: 'Dates', rule: 'YYYY-MM-DD format (e.g. 2024-05-15) or Excel Date' },
      { field: 'Is Breeder / Qurbani', rule: 'YES or NO (Only valid for MALE)' }
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
      { wch: 24 },
      { wch: 16 },
      { wch: 4 },
      { wch: 24 },
      { wch: 45 }
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, animalWs, 'Animals');
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
      'Tag Number',
      'Breed',
      'Gender',
      'Animal Type',
      'Color',
      'Birth Date',
      'Birth Weight (kg)',
      'Acquisition',
      'Purchase Date',
      'Purchase Price',
      'Purchase Weight (kg)',
      'Current Weight (kg)',
      'Female Condition',
      'Location',
      'Location Code',
      'Is Breeder',
      'Is Qurbani',
      'Mother Tag',
      'Father Tag',
      'Batch No',
      'Teeth Stage',
      'Status',
      'Remark',
      'Created Date'
    ];

    const rows = animals.map(a => [
      a.tag_number || '',
      a.breeds?.name || '',
      a.gender || '',
      a.animal_type || 'Goat',
      a.color || '',
      a.birth_date ? new Date(a.birth_date).toISOString().split('T')[0] : '',
      a.birth_weight ? parseFloat(a.birth_weight) : '',
      a.acquisition_method || 'BORN',
      a.purchase_date ? new Date(a.purchase_date).toISOString().split('T')[0] : '',
      a.purchase_price ? parseFloat(a.purchase_price) : '',
      a.purchase_weight ? parseFloat(a.purchase_weight) : '',
      a.current_weight ? parseFloat(a.current_weight) : '',
      a.female_condition || '',
      a.locations?.name || '',
      a.locations?.code || '',
      a.is_breeder ? 'YES' : 'NO',
      a.is_qurbani ? 'YES' : 'NO',
      a.mother_tag_id || '',
      a.father_tag_id || '',
      a.batch_no || '',
      a.teeth_stage || '',
      a.status || 'LIVE',
      a.remark || '',
      a.created_at ? new Date(a.created_at).toISOString().split('T')[0] : ''
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
      errors: [{ row: 1, tagNumber: '-', field: 'File', error: 'No data rows found in the sheet.' }]
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

  const locations = await prisma.locations.findMany({
    where: { farm_id: farmId },
    select: { id: true, name: true, code: true }
  });
  const locationMap = new Map();
  locations.forEach(l => {
    if (l.code) locationMap.set(l.code.toLowerCase().trim(), l);
    if (l.name) locationMap.set(l.name.toLowerCase().trim(), l);
  });

  const errors = [];
  const validRecords = [];
  const sheetTagsSet = new Set();

  for (let i = 0; i < rawRows.length; i++) {
    const raw = rawRows[i];
    const rowNum = i + 2; // Excel row number (Row 1 is header)

    // Map keys to normalized object
    const row = {};
    for (const [k, v] of Object.entries(raw)) {
      const norm = normalizeKey(k);
      if (norm) row[norm] = v;
    }

    // Extract fields
    const tagNumberRaw = row.tagnumber || row.tagno || row.tag || '';
    const tagNumber = String(tagNumberRaw).trim();

    const breedNameRaw = row.breedname || row.breed || '';
    const breedName = String(breedNameRaw).trim();

    const genderRaw = row.gender || '';
    let gender = String(genderRaw).trim().toUpperCase();

    const animalTypeRaw = row.animaltype || row.type || 'Goat';
    const animalType = String(animalTypeRaw).trim() || 'Goat';

    const color = String(row.color || '').trim() || null;
    const batchNo = String(row.batchno || row.batch || '').trim() || null;
    const teethStage = String(row.teethstage || row.teeth || '').trim() || null;
    const remark = String(row.remark || row.notes || row.note || '').trim() || null;
    const motherTagId = String(row.mothertag || row.mothertagid || row.mother || '').trim() || null;
    const fatherTagId = String(row.fathertag || row.fathertagid || row.father || '').trim() || null;

    // 1. Check Tag Number
    if (!tagNumber) {
      errors.push({
        row: rowNum,
        tagNumber: '-',
        field: 'Tag Number',
        error: 'Tag Number is required and cannot be empty.'
      });
      continue;
    }

    const tagLower = tagNumber.toLowerCase();
    if (sheetTagsSet.has(tagLower)) {
      errors.push({
        row: rowNum,
        tagNumber,
        field: 'Tag Number',
        error: `Duplicate Tag Number "${tagNumber}" found within this spreadsheet.`
      });
      continue;
    }
    sheetTagsSet.add(tagLower);

    if (existingTagsSet.has(tagLower)) {
      errors.push({
        row: rowNum,
        tagNumber,
        field: 'Tag Number',
        error: `Tag Number "${tagNumber}" already exists in your farm inventory.`
      });
      continue;
    }

    // 2. Check Breed
    if (!breedName) {
      errors.push({
        row: rowNum,
        tagNumber,
        field: 'Breed Name',
        error: 'Breed Name is required.'
      });
      continue;
    }

    const matchedBreed = breedMap.get(breedName.toLowerCase());
    if (!matchedBreed) {
      const sampleBreeds = breeds.slice(0, 5).map(b => b.name).join(', ');
      errors.push({
        row: rowNum,
        tagNumber,
        field: 'Breed Name',
        error: `Breed "${breedName}" not found. Available breeds: ${sampleBreeds}${breeds.length > 5 ? '...' : ''}`
      });
      continue;
    }

    // 3. Check Gender
    if (!gender || (gender !== 'MALE' && gender !== 'FEMALE')) {
      errors.push({
        row: rowNum,
        tagNumber,
        field: 'Gender',
        error: `Invalid Gender "${genderRaw}". Must be either MALE or FEMALE.`
      });
      continue;
    }

    // 4. Check Dates
    const birthDate = parseExcelDate(row.birthdate || row.dob);
    const purchaseDate = parseExcelDate(row.purchasedate);

    // 5. Acquisition Method
    let acquisitionMethod = 'BORN';
    const acqRaw = String(row.acquisition || row.acquisitionmethod || '').trim().toUpperCase();
    if (acqRaw === 'PURCHASED' || acqRaw === 'PURCHASE') {
      acquisitionMethod = 'PURCHASED';
    } else if (acqRaw && acqRaw !== 'BORN') {
      errors.push({
        row: rowNum,
        tagNumber,
        field: 'Acquisition Method',
        error: `Invalid Acquisition "${acqRaw}". Must be BORN or PURCHASED.`
      });
      continue;
    }

    // 6. Numbers
    const birthWeight = parseDecimal(row.birthweight || row.weightatbirth);
    const purchasePrice = parseDecimal(row.purchaseprice || row.price);
    const purchaseWeight = parseDecimal(row.purchaseweight);
    const currentWeight = parseDecimal(row.currentweight || row.weight);

    // 7. Female Condition
    let femaleCondition = null;
    const condRaw = String(row.femalecondition || row.condition || '').trim().toUpperCase();
    if (condRaw) {
      if (gender === 'MALE') {
        errors.push({
          row: rowNum,
          tagNumber,
          field: 'Female Condition',
          error: 'Female Condition can only be specified for FEMALE animals.'
        });
        continue;
      }
      const validConditions = ['PREGNANT', 'NONE', 'KID', 'EMPTY'];
      if (!validConditions.includes(condRaw)) {
        errors.push({
          row: rowNum,
          tagNumber,
          field: 'Female Condition',
          error: `Invalid condition "${condRaw}". Must be one of: ${validConditions.join(', ')}.`
        });
        continue;
      }
      femaleCondition = condRaw;
    }

    // 8. Location match
    let locationId = null;
    const locRaw = String(row.location || row.locationcode || row.locationname || '').trim();
    if (locRaw) {
      const matchedLoc = locationMap.get(locRaw.toLowerCase());
      if (matchedLoc) {
        locationId = matchedLoc.id;
      } else {
        errors.push({
          row: rowNum,
          tagNumber,
          field: 'Location',
          error: `Location "${locRaw}" not found in your farm.`
        });
        continue;
      }
    }

    // 9. Pedigree check
    if (motherTagId && motherTagId.toLowerCase() === tagLower) {
      errors.push({
        row: rowNum,
        tagNumber,
        field: 'Mother Tag',
        error: 'Mother Tag cannot be the same as the animal\'s Tag Number.'
      });
      continue;
    }
    if (fatherTagId && fatherTagId.toLowerCase() === tagLower) {
      errors.push({
        row: rowNum,
        tagNumber,
        field: 'Father Tag',
        error: 'Father Tag cannot be the same as the animal\'s Tag Number.'
      });
      continue;
    }

    // 10. Breeder / Qurbani flags
    const isBreeder = gender === 'MALE' ? parseBoolean(row.isbreeder || row.breeder) : false;
    const isQurbani = gender === 'MALE' ? (!isBreeder && parseBoolean(row.isqurbani || row.qurbani)) : false;

    // 11. Status
    let status = 'LIVE';
    const statusRaw = String(row.status || '').trim().toUpperCase();
    if (statusRaw) {
      if (['LIVE', 'SOLD', 'DEAD'].includes(statusRaw)) {
        status = statusRaw;
      } else {
        errors.push({
          row: rowNum,
          tagNumber,
          field: 'Status',
          error: `Invalid Status "${statusRaw}". Must be LIVE, SOLD, or DEAD.`
        });
        continue;
      }
    }

    validRecords.push({
      tagNumber,
      breedId: matchedBreed.id,
      breedName: matchedBreed.name,
      gender,
      animalType,
      color,
      birthDate,
      birthWeight,
      acquisitionMethod,
      purchaseDate,
      purchasePrice,
      purchaseWeight,
      currentWeight,
      femaleCondition,
      locationId,
      isBreeder,
      isQurbani,
      motherTagId,
      fatherTagId,
      batchNo,
      teethStage,
      status,
      remark,
      rowNum
    });
  }

  // Subscription plan limit check
  if (userSubscription && userSubscription.plan_name === 'BASIC') {
    const currentCount = existingAnimals.length;
    if (currentCount + validRecords.length > 50) {
      errors.push({
        row: 1,
        tagNumber: '-',
        field: 'Subscription Limit',
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
        animal_type: rec.animalType,
        color: rec.color,
        birth_date: rec.birthDate,
        birth_weight: rec.birthWeight,
        acquisition_method: rec.acquisitionMethod,
        purchase_date: rec.purchaseDate,
        purchase_price: rec.purchasePrice,
        purchase_weight: rec.purchaseWeight,
        current_weight: rec.currentWeight || rec.purchaseWeight || rec.birthWeight,
        female_condition: rec.femaleCondition,
        location_id: rec.locationId,
        is_breeder: rec.isBreeder,
        is_qurbani: rec.isQurbani,
        mother_tag_id: rec.motherTagId,
        father_tag_id: rec.fatherTagId,
        batch_no: rec.batchNo,
        teeth_stage: rec.teethStage,
        status: rec.status,
        remark: rec.remark,
        farm_id: farmId,
        created_by_user_id: userId,
        updated_by_user_id: userId,
        created_at: now,
        updated_at: now
      });

      // If initial weight is recorded, log it in weights table as well
      const initialWeight = rec.currentWeight || rec.purchaseWeight || rec.birthWeight;
      if (initialWeight) {
        weightEntries.push({
          id: uuidv4(),
          animal_id: animalId,
          farm_id: farmId,
          weight: initialWeight,
          tag_number: rec.tagNumber,
          date: rec.purchaseDate || rec.birthDate || now,
          remark: 'Initial bulk import weight',
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

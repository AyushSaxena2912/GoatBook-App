const XLSX = require('xlsx');
const prisma = require('../../config/prisma');
const { v4: uuidv4 } = require('uuid');

// Helper to normalize keys from Excel headers
const normalizeKey = (key) => {
  if (!key) return '';
  // Clean linebreaks from multiline header cells in Excel
  const firstLine = String(key).split(/[\r\n]+/)[0];
  return firstLine
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
  if (req.query?.farmId) return req.query.farmId;
  if (req.body?.farmId) return req.body.farmId;
  const headerId = typeof req.header === 'function' ? (req.header('X-Farm-ID') || req.header('x-farm-id')) : null;
  if (headerId) return headerId;
  if (req.user?.farm_id) return req.user.farm_id;
  if (req.employee?.id) {
    const membership = await prisma.farm_employees.findFirst({
      where: { employee_id: req.employee.id }
    });
    if (membership) return membership.farm_id;
  }
  if (req.user?.id) {
    const primaryFarm = await prisma.farms.findFirst({
      where: { created_by_user_id: req.user.id }
    });
    if (primaryFarm) return primaryFarm.id;
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
    // 27 Headers supported:
    // Tag Number *, Breed Name *, Gender (MALE/FEMALE) *, Animal Type (Goat/Sheep), Color, Birth Date (YYYY-MM-DD), Birth Weight (kg), Acquisition (BORN/PURCHASED), Purchase Date (YYYY-MM-DD), Purchase Price, Purchase Weight (kg), Current Weight (kg), Female Condition (PREGNANT/NONE/KID/EMPTY), shed No., Is Breeder (YES/NO), Is Qurbani (YES/NO), Mother Tag, Father Tag, Batch No, Teeth Stage, Status (LIVE/SOLD/DEAD), Remark, Insurance Company, Policy Number, Policy Start Date (YYYY-MM-DD), Policy Expiry Date (YYYY-MM-DD), Treatment Record
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
      'shed No.',
      'Is Breeder (YES/NO)',
      'Is Qurbani (YES/NO)',
      'Mother Tag',
      'Father Tag',
      'Batch No',
      'Teeth Stage',
      'Status (LIVE/SOLD/DEAD)',
      'Remark',
      'Insurance Company',
      'Policy Number',
      'Policy Start Date (YYYY-MM-DD)',
      'Policy Expiry Date (YYYY-MM-DD)',
      'Treatment Record'
    ];

    const sampleBreed1 = breeds[0]?.name || 'Sirohi';
    const sampleBreed2 = breeds[1]?.name || 'Barbari';
    const sampleLoc1 = locations[0]?.name || locations[0]?.code || 'Shed A';
    const sampleLoc2 = locations[1]?.name || locations[1]?.code || 'Shed B';

    const sampleRows = [
      [
        'GB-101', sampleBreed1, 'FEMALE', 'Goat', 'Brown', '2024-01-15', 3.2,
        'BORN', '', '', '', 28.5, 'NONE', sampleLoc1, 'NO', 'NO',
        'GB-M01', 'GB-F01', 'BATCH-1', '2 Teeth', 'LIVE', 'Healthy doe',
        'National Insurance', 'POL-998811', '2024-01-20', '2025-01-19', 'Annual PPR Deworming & Vaccination done'
      ],
      [
        'GB-102', sampleBreed2, 'MALE', 'Goat', 'White', '2023-11-20', 2.8,
        'PURCHASED', '2024-02-10', 9500, 22.0, 34.0, '', sampleLoc2, 'YES', 'NO',
        '', '', 'BATCH-1', '4 Teeth', 'LIVE', 'Purchased breeder buck',
        'ICICI Lombard', 'POL-772244', '2024-02-15', '2025-02-14', 'Routine checkup completed'
      ]
    ];

    const animalWsData = [headers, ...sampleRows];
    const animalWs = XLSX.utils.aoa_to_sheet(animalWsData);

    // Set column widths for layout
    animalWs['!cols'] = [
      { wch: 18 }, // Tag Number *
      { wch: 18 }, // Breed Name *
      { wch: 24 }, // Gender (MALE/FEMALE) *
      { wch: 24 }, // Animal Type (Goat/Sheep)
      { wch: 14 }, // Color
      { wch: 24 }, // Birth Date (YYYY-MM-DD)
      { wch: 18 }, // Birth Weight (kg)
      { wch: 28 }, // Acquisition (BORN/PURCHASED)
      { wch: 26 }, // Purchase Date (YYYY-MM-DD)
      { wch: 18 }, // Purchase Price
      { wch: 20 }, // Purchase Weight (kg)
      { wch: 20 }, // Current Weight (kg)
      { wch: 42 }, // Female Condition (PREGNANT/NONE/KID/EMPTY)
      { wch: 18 }, // shed No.
      { wch: 20 }, // Is Breeder (YES/NO)
      { wch: 20 }, // Is Qurbani (YES/NO)
      { wch: 16 }, // Mother Tag
      { wch: 16 }, // Father Tag
      { wch: 16 }, // Batch No
      { wch: 16 }, // Teeth Stage
      { wch: 24 }, // Status (LIVE/SOLD/DEAD)
      { wch: 28 }, // Remark
      { wch: 22 }, // Insurance Company
      { wch: 20 }, // Policy Number
      { wch: 28 }, // Policy Start Date (YYYY-MM-DD)
      { wch: 28 }, // Policy Expiry Date (YYYY-MM-DD)
      { wch: 40 }  // Treatment Record
    ];

    // Sheet 2: Reference & Guidelines
    const refHeaders = ['Available Breeds', 'Breed Type', '', 'Available Locations (shed No.)', 'Location Code', '', 'Header Field', 'Allowed Values & Rules'];
    const maxLen = Math.max(breeds.length, locations.length, 18);
    const refRows = [];

    const fieldRules = [
      { field: 'Tag Number *', rule: 'Unique identifier for animal (e.g. GB-101). Required.' },
      { field: 'Breed Name *', rule: 'Must match an existing breed name in your farm (e.g. Sirohi, Barbari). Required.' },
      { field: 'Gender (MALE/FEMALE) *', rule: 'MALE or FEMALE. Required.' },
      { field: 'Animal Type', rule: 'Goat or Sheep (Default: Goat).' },
      { field: 'Color', rule: 'Color description (e.g. Brown, White, Black).' },
      { field: 'Birth Date', rule: 'YYYY-MM-DD format (e.g. 2024-05-15).' },
      { field: 'Birth Weight', rule: 'Birth weight in kg (numeric).' },
      { field: 'Acquisition', rule: 'BORN or PURCHASED (Default: BORN).' },
      { field: 'Purchase Date', rule: 'YYYY-MM-DD or DD/MM/YYYY format.' },
      { field: 'Purchase Price', rule: 'Purchase price / rate.' },
      { field: 'Purchase Weight', rule: 'Purchase weight in kg.' },
      { field: 'Current Weight', rule: 'Current weight in kg.' },
      { field: 'Female Condition', rule: 'PREGNANT, NONE, KID, EMPTY (Only valid for FEMALE).' },
      { field: 'shed No.', rule: 'Must match an existing location/shed name or code in your farm.' },
      { field: 'Is Breeder / Is Qurbani', rule: 'YES or NO.' },
      { field: 'Mother Tag / Father Tag', rule: 'Pedigree tag numbers (must exist in farm or this file).' },
      { field: 'Batch No', rule: 'Batch identifier (e.g. BATCH-1).' },
      { field: 'Teeth Stage', rule: 'Milk teeth, 2 Teeth, 4 Teeth, 6 Teeth, 8 Teeth.' },
      { field: 'Status', rule: 'LIVE, SOLD, DEAD (Default: LIVE).' },
      { field: 'Remark', rule: 'Additional notes or remarks.' },
      { field: 'Insurance Company', rule: 'Insurance provider name (e.g. National Insurance).' },
      { field: 'Policy Number', rule: 'Insurance policy number or plan name.' },
      { field: 'Policy Start Date', rule: 'YYYY-MM-DD format (e.g. 2024-01-20).' },
      { field: 'Policy Expiry Date', rule: 'YYYY-MM-DD format (e.g. 2025-01-19).' },
      { field: 'Treatment Record', rule: 'Medical and treatment notes or history.' }
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
      { wch: 28 },
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
      'shed No.',
      'Is Breeder (YES/NO)',
      'Is Qurbani (YES/NO)',
      'Mother Tag',
      'Father Tag',
      'Batch No',
      'Teeth Stage',
      'Status (LIVE/SOLD/DEAD)',
      'Remark',
      'Insurance Company',
      'Policy Number',
      'Policy Start Date (YYYY-MM-DD)',
      'Policy Expiry Date (YYYY-MM-DD)',
      'Treatment Record'
    ];

    const rows = animals.map((a) => [
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
      a.locations?.name || a.locations?.code || '',
      a.is_breeder ? 'YES' : 'NO',
      a.is_qurbani ? 'YES' : 'NO',
      a.mother_tag_id || '',
      a.father_tag_id || '',
      a.batch_no || '',
      a.teeth_stage || '',
      a.status || 'LIVE',
      a.remark || '',
      a.insurance_company || '',
      a.insurance_policy_no || '',
      a.insurance_start_date ? new Date(a.insurance_start_date).toISOString().split('T')[0] : '',
      a.insurance_expiry_date ? new Date(a.insurance_expiry_date).toISOString().split('T')[0] : '',
      a.treatment_record || ''
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
  const existingTagsSet = new Set(existingAnimals.map(a => a.tag_number.trim()));

  // Pre-pass: collect all tag numbers present in this uploaded spreadsheet (Case Sensitive)
  const allSheetTagsSet = new Set();
  for (const raw of rawRows) {
    let tRaw = raw['Tag Number *'] || raw['Teg. No.'] || raw.tagnumber || raw.tag || '';
    if (!tRaw) {
      for (const [k, v] of Object.entries(raw)) {
        const kClean = normalizeKey(k);
        if ((kClean === 'tagnumber' || kClean === 'tegno' || kClean === 'tagno' || kClean === 'tag') && String(v).trim()) {
          tRaw = v;
          break;
        }
      }
    }
    if (tRaw) allSheetTagsSet.add(String(tRaw).trim());
  }

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
  const sheetTagsSet = new Map(); // exactTag -> snVal

  const now = new Date();

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

    // Dynamic field extractions with fallbacks for header variations
    let tagNumberRaw = row.tagnumber || row.tegno || row.tagno || row.tag || '';
    if (!tagNumberRaw) {
      for (const [k, v] of Object.entries(raw)) {
        const kClean = normalizeKey(k);
        if ((kClean === 'tagnumber' || kClean === 'tegno' || kClean === 'tagno' || kClean === 'tag') && String(v).trim()) {
          tagNumberRaw = v;
          break;
        }
      }
    }
    const tagNumber = String(tagNumberRaw).trim();

    let breedNameRaw = row.breedname || row.breed || '';
    if (!breedNameRaw) {
      for (const [k, v] of Object.entries(raw)) {
        const kClean = normalizeKey(k);
        if (kClean.includes('breed') && String(v).trim()) {
          breedNameRaw = v;
          break;
        }
      }
    }
    const breedName = String(breedNameRaw).trim();

    const genderRaw = row.gender || '';
    const gender = String(genderRaw).trim().toUpperCase();

    const animalTypeRaw = row.animaltype || row.animal_type || '';
    let animalType = String(animalTypeRaw).trim();

    const color = String(row.color || row.colour || '').trim() || null;

    const birthDateRaw = row.birthdate || row.dob || '';
    const birthWeightRaw = row.birthweight || '';

    const acquisitionRaw = row.acquisition || '';
    const bornAtFarmRaw = row.bornatfarm || row.bornonfarm || row.born || '';
    const purchasedRaw = row.purchased || row.purchase || '';

    const purchaseDateRaw = row.purchasedate || row.purchase_date || '';
    const purchasePriceRaw = row.purchaseprice || row.rate || row.price || '';
    const purchaseWeightRaw = row.purchaseweight || row.purchasewight || '';
    const currentWeightRaw = row.currentweight || '';

    const femaleConditionRaw = row.femalecondition || '';

    // Dynamic extraction for shed No. / location
    let shedNoRaw = row.shedno || row.shed || row.location || row.locationcode || row.locationname || row.locationshed || '';
    if (!shedNoRaw) {
      for (const [k, v] of Object.entries(raw)) {
        const kClean = normalizeKey(k);
        if ((kClean.includes('shed') || kClean.includes('location')) && String(v).trim()) {
          shedNoRaw = v;
          break;
        }
      }
    }
    const shedNo = String(shedNoRaw).trim();

    const isBreederRaw = row.isbreeder || '';
    const isQurbaniRaw = row.isqurbani || '';

    let motherTagRaw = row.mothertag || row.mother || '';
    if (!motherTagRaw) {
      for (const [k, v] of Object.entries(raw)) {
        const kClean = normalizeKey(k);
        if (kClean.includes('mother') && String(v).trim()) {
          motherTagRaw = v;
          break;
        }
      }
    }
    const motherTag = String(motherTagRaw).trim() || null;

    let fatherTagRaw = row.fathertag || row.father || '';
    if (!fatherTagRaw) {
      for (const [k, v] of Object.entries(raw)) {
        const kClean = normalizeKey(k);
        if (kClean.includes('father') && String(v).trim()) {
          fatherTagRaw = v;
          break;
        }
      }
    }
    const fatherTag = String(fatherTagRaw).trim() || null;

    const batchNo = String(row.batchno || row.batch || '').trim() || null;

    const ageRaw = row.age || row.ageinmonths || '';
    const birthTypeRaw = row.birthtype || row.birth_type || '';

    const teethStageRaw = row.teethstage || row.teeth || '';
    const teethStage = String(teethStageRaw).trim() || null;

    const statusRaw = row.status || '';
    const remark = String(row.remark || row.remarks || row.notes || '').trim() || null;

    // Dynamic extractions for Insurance & Treatment fields with fallback header scanning
    let insuranceCompanyRaw = row.insurancecompany || row.insurancecompanyname || row.insuranceprovider || row.companyname || row.insurance || '';
    if (!insuranceCompanyRaw) {
      for (const [k, v] of Object.entries(raw)) {
        const kClean = normalizeKey(k);
        if ((kClean.includes('insurance') && (kClean.includes('company') || kClean.includes('provider') || kClean.includes('name'))) && String(v).trim()) {
          insuranceCompanyRaw = v;
          break;
        }
      }
    }
    const insuranceCompany = String(insuranceCompanyRaw).trim() || null;

    let insurancePolicyNoRaw = row.policynumber || row.insurancepolicyno || row.policyno || row.insurancepolicy || row.policy || row.planname || '';
    if (!insurancePolicyNoRaw) {
      for (const [k, v] of Object.entries(raw)) {
        const kClean = normalizeKey(k);
        if ((kClean.includes('policy') && (kClean.includes('no') || kClean.includes('num') || kClean.includes('number'))) && String(v).trim()) {
          insurancePolicyNoRaw = v;
          break;
        }
      }
    }
    const insurancePolicyNo = String(insurancePolicyNoRaw).trim() || null;

    let insuranceStartDateRaw = row.policystartdate || row.insurancestartdate || row.startdate || row.policystart || row.insurancestart || '';
    if (!insuranceStartDateRaw) {
      for (const [k, v] of Object.entries(raw)) {
        const kClean = normalizeKey(k);
        if ((kClean.includes('start') && (kClean.includes('date') || kClean.includes('policy') || kClean.includes('insurance'))) && String(v).trim()) {
          insuranceStartDateRaw = v;
          break;
        }
      }
    }

    let insuranceExpiryDateRaw = row.policyexpirydate || row.insuranceexpirydate || row.expirydate || row.policyexpiry || row.insuranceexpiry || '';
    if (!insuranceExpiryDateRaw) {
      for (const [k, v] of Object.entries(raw)) {
        const kClean = normalizeKey(k);
        if ((kClean.includes('expir') || kClean.includes('end')) && (kClean.includes('date') || kClean.includes('policy') || kClean.includes('insurance')) && String(v).trim()) {
          insuranceExpiryDateRaw = v;
          break;
        }
      }
    }

    let treatmentRecordRaw = row.treatmentrecord || row.treatment || row.treatments || row.treatmentnotes || '';
    if (!treatmentRecordRaw) {
      for (const [k, v] of Object.entries(raw)) {
        const kClean = normalizeKey(k);
        if ((kClean.includes('treatment') || kClean.includes('medical')) && String(v).trim()) {
          treatmentRecordRaw = v;
          break;
        }
      }
    }
    const treatmentRecord = String(treatmentRecordRaw).trim() || null;

    const rowErrors = [];

    // 1. Tag Number Validation - CASE SENSITIVE (Column: Tag Number *)
    if (!tagNumber) {
      rowErrors.push({
        sn: snVal,
        row: rowNum,
        tagNumber: '-',
        column: 'Tag Number *',
        error: 'Tag Number is required and cannot be empty.'
      });
    } else {
      if (sheetTagsSet.has(tagNumber)) {
        const prevSn = sheetTagsSet.get(tagNumber);
        rowErrors.push({
          sn: snVal,
          row: rowNum,
          tagNumber,
          column: 'Tag Number *',
          error: `Duplicate Tag Number "${tagNumber}" found in this spreadsheet (already used at Sn ${prevSn}).`
        });
      } else {
        sheetTagsSet.set(tagNumber, snVal);
      }

      if (existingTagsSet.has(tagNumber)) {
        rowErrors.push({
          sn: snVal,
          row: rowNum,
          tagNumber,
          column: 'Tag Number *',
          error: `Tag Number "${tagNumber}" already exists in your farm inventory.`
        });
      }
    }

    // 2. Breed Validation (Column: Breed Name *)
    let matchedBreed = null;
    if (!breedName) {
      rowErrors.push({
        sn: snVal,
        row: rowNum,
        tagNumber: tagNumber || '-',
        column: 'Breed Name *',
        error: 'Breed Name is required and cannot be empty.'
      });
    } else {
      matchedBreed = breedMap.get(breedName.toLowerCase());
      if (!matchedBreed) {
        rowErrors.push({
          sn: snVal,
          row: rowNum,
          tagNumber: tagNumber || '-',
          column: 'Breed Name *',
          error: `Breed "${breedName}" does not exist in farm breeds. Available options: [${validBreedsList}].`
        });
      }
    }

    // 3. Gender Validation (Column: Gender (MALE/FEMALE) *)
    if (!gender || (gender !== 'MALE' && gender !== 'FEMALE')) {
      rowErrors.push({
        sn: snVal,
        row: rowNum,
        tagNumber: tagNumber || '-',
        column: 'Gender (MALE/FEMALE) *',
        error: `Invalid Gender "${genderRaw}". Must be either "MALE" or "FEMALE".`
      });
    }

    // 4. Animal Type Validation (Column: Animal Type (Goat/Sheep))
    if (animalType) {
      const atUpper = animalType.toUpperCase();
      if (atUpper === 'GOAT') animalType = 'Goat';
      else if (atUpper === 'SHEEP') animalType = 'Sheep';
      else {
        rowErrors.push({
          sn: snVal,
          row: rowNum,
          tagNumber: tagNumber || '-',
          column: 'Animal Type (Goat/Sheep)',
          error: `Invalid Animal Type "${animalTypeRaw}". Must be "Goat" or "Sheep".`
        });
      }
    } else if (matchedBreed) {
      animalType = matchedBreed.animal_type || 'Goat';
    } else {
      animalType = 'Goat';
    }

    // 5. Birth Date Validation (Column: Birth Date (YYYY-MM-DD))
    let birthDate = null;
    if (birthDateRaw !== '') {
      birthDate = parseExcelDate(birthDateRaw);
      if (!birthDate) {
        rowErrors.push({
          sn: snVal,
          row: rowNum,
          tagNumber: tagNumber || '-',
          column: 'Birth Date (YYYY-MM-DD)',
          error: `Invalid Birth Date "${birthDateRaw}". Format must be YYYY-MM-DD or DD/MM/YYYY.`
        });
      } else if (birthDate > now) {
        rowErrors.push({
          sn: snVal,
          row: rowNum,
          tagNumber: tagNumber || '-',
          column: 'Birth Date (YYYY-MM-DD)',
          error: 'Birth Date cannot be in the future.'
        });
      }
    }

    // 6. Birth Weight Validation (Column: Birth Weight (kg))
    let birthWeight = null;
    if (birthWeightRaw !== '') {
      birthWeight = parseDecimal(birthWeightRaw);
      if (birthWeight === null || birthWeight < 0) {
        rowErrors.push({
          sn: snVal,
          row: rowNum,
          tagNumber: tagNumber || '-',
          column: 'Birth Weight (kg)',
          error: `Invalid Birth Weight "${birthWeightRaw}". Must be a valid non-negative number.`
        });
      }
    }

    // 7. Acquisition Validation (Column: Acquisition (BORN/PURCHASED))
    let acquisitionMethod = 'BORN';
    if (acquisitionRaw !== '') {
      const acqUpper = String(acquisitionRaw).trim().toUpperCase();
      if (acqUpper === 'BORN' || acqUpper === 'PURCHASED') {
        acquisitionMethod = acqUpper;
      } else {
        rowErrors.push({
          sn: snVal,
          row: rowNum,
          tagNumber: tagNumber || '-',
          column: 'Acquisition (BORN/PURCHASED)',
          error: `Invalid Acquisition "${acquisitionRaw}". Allowed values: "BORN" or "PURCHASED".`
        });
      }
    } else {
      // Legacy fallback
      const isBornAtFarm = parseBoolean(bornAtFarmRaw);
      const isPurchased = parseBoolean(purchasedRaw);
      if (bornAtFarmRaw && purchasedRaw && isBornAtFarm && isPurchased) {
        rowErrors.push({
          sn: snVal,
          row: rowNum,
          tagNumber: tagNumber || '-',
          column: 'Acquisition (BORN/PURCHASED)',
          error: 'Animal cannot be marked as both Born at farm and Purchased. Select BORN or PURCHASED.'
        });
      } else if (isPurchased || (bornAtFarmRaw && !isBornAtFarm)) {
        acquisitionMethod = 'PURCHASED';
      } else {
        acquisitionMethod = 'BORN';
      }
    }

    // 8. Purchase Date Validation (Column: Purchase Date (YYYY-MM-DD))
    let purchaseDate = null;
    if (purchaseDateRaw !== '') {
      purchaseDate = parseExcelDate(purchaseDateRaw);
      if (!purchaseDate) {
        rowErrors.push({
          sn: snVal,
          row: rowNum,
          tagNumber: tagNumber || '-',
          column: 'Purchase Date (YYYY-MM-DD)',
          error: `Invalid Purchase Date "${purchaseDateRaw}". Format must be YYYY-MM-DD or DD/MM/YYYY.`
        });
      }
    }

    // 9. Purchase Price Validation (Column: Purchase Price)
    let purchasePrice = null;
    if (purchasePriceRaw !== '') {
      purchasePrice = parseDecimal(purchasePriceRaw);
      if (purchasePrice === null || purchasePrice < 0) {
        rowErrors.push({
          sn: snVal,
          row: rowNum,
          tagNumber: tagNumber || '-',
          column: 'Purchase Price',
          error: `Invalid Purchase Price "${purchasePriceRaw}". Must be a valid numeric amount.`
        });
      }
    }

    // 10. Purchase Weight Validation (Column: Purchase Weight (kg))
    let purchaseWeight = null;
    if (purchaseWeightRaw !== '') {
      purchaseWeight = parseDecimal(purchaseWeightRaw);
      if (purchaseWeight === null || purchaseWeight < 0) {
        rowErrors.push({
          sn: snVal,
          row: rowNum,
          tagNumber: tagNumber || '-',
          column: 'Purchase Weight (kg)',
          error: `Invalid Purchase Weight "${purchaseWeightRaw}". Must be a valid non-negative weight in kg.`
        });
      }
    }

    // 11. Current Weight Validation (Column: Current Weight (kg))
    let currentWeight = null;
    if (currentWeightRaw !== '') {
      currentWeight = parseDecimal(currentWeightRaw);
      if (currentWeight === null || currentWeight < 0) {
        rowErrors.push({
          sn: snVal,
          row: rowNum,
          tagNumber: tagNumber || '-',
          column: 'Current Weight (kg)',
          error: `Invalid Current Weight "${currentWeightRaw}". Must be a valid non-negative weight in kg.`
        });
      }
    }

    // 12. Female Condition Validation (Column: Female Condition (PREGNANT/NONE/KID/EMPTY))
    let femaleCondition = null;
    if (femaleConditionRaw !== '') {
      const fcUpper = String(femaleConditionRaw).trim().toUpperCase();
      if (gender === 'MALE' && fcUpper !== 'NONE' && fcUpper !== '') {
        rowErrors.push({
          sn: snVal,
          row: rowNum,
          tagNumber: tagNumber || '-',
          column: 'Female Condition (PREGNANT/NONE/KID/EMPTY)',
          error: `Female Condition can only be set for FEMALE animals.`
        });
      } else if (fcUpper !== '' && fcUpper !== 'NONE') {
        const validFC = ['PREGNANT', 'NONE', 'KID', 'EMPTY'];
        if (!validFC.includes(fcUpper)) {
          rowErrors.push({
            sn: snVal,
            row: rowNum,
            tagNumber: tagNumber || '-',
            column: 'Female Condition (PREGNANT/NONE/KID/EMPTY)',
            error: `Invalid Female Condition "${femaleConditionRaw}". Allowed values: PREGNANT, NONE, KID, EMPTY.`
          });
        } else {
          femaleCondition = fcUpper;
        }
      }
    }

    // 13. Shed No. / Location Relational Validation (Column: shed No.)
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

    // 14. Is Breeder Validation (Column: Is Breeder (YES/NO))
    const isBreeder = parseBoolean(isBreederRaw);

    // 15. Is Qurbani Validation (Column: Is Qurbani (YES/NO))
    const isQurbani = parseBoolean(isQurbaniRaw);

    // 16. Mother Tag & Father Tag Relational & Self-Reference Validation - CASE SENSITIVE
    if (motherTag) {
      if (tagNumber && motherTag === tagNumber) {
        rowErrors.push({
          sn: snVal,
          row: rowNum,
          tagNumber,
          column: 'Mother Tag',
          error: `Mother Tag cannot be the same as animal's own Tag Number ("${tagNumber}").`
        });
      } else if (!existingTagsSet.has(motherTag) && !allSheetTagsSet.has(motherTag)) {
        rowErrors.push({
          sn: snVal,
          row: rowNum,
          tagNumber: tagNumber || '-',
          column: 'Mother Tag',
          error: `Mother Tag "${motherTag}" does not exist in your farm inventory or in this import file.`
        });
      }
    }

    if (fatherTag) {
      if (tagNumber && fatherTag === tagNumber) {
        rowErrors.push({
          sn: snVal,
          row: rowNum,
          tagNumber,
          column: 'Father Tag',
          error: `Father Tag cannot be the same as animal's own Tag Number ("${tagNumber}").`
        });
      } else if (!existingTagsSet.has(fatherTag) && !allSheetTagsSet.has(fatherTag)) {
        rowErrors.push({
          sn: snVal,
          row: rowNum,
          tagNumber: tagNumber || '-',
          column: 'Father Tag',
          error: `Father Tag "${fatherTag}" does not exist in your farm inventory or in this import file.`
        });
      }
    }

    // 17. Status Validation (Column: Status (LIVE/SOLD/DEAD))
    let status = 'LIVE';
    if (statusRaw !== '') {
      const stUpper = String(statusRaw).trim().toUpperCase();
      const validStatus = ['LIVE', 'SOLD', 'DEAD'];
      if (!validStatus.includes(stUpper)) {
        rowErrors.push({
          sn: snVal,
          row: rowNum,
          tagNumber: tagNumber || '-',
          column: 'Status (LIVE/SOLD/DEAD)',
          error: `Invalid Status "${statusRaw}". Allowed values: LIVE, SOLD, DEAD.`
        });
      } else {
        status = stUpper;
      }
    }

    // 18. Policy Start Date Validation (Column: Policy Start Date (YYYY-MM-DD))
    let insuranceStartDate = null;
    if (insuranceStartDateRaw !== '') {
      insuranceStartDate = parseExcelDate(insuranceStartDateRaw);
      if (!insuranceStartDate) {
        rowErrors.push({
          sn: snVal,
          row: rowNum,
          tagNumber: tagNumber || '-',
          column: 'Policy Start Date (YYYY-MM-DD)',
          error: `Invalid Policy Start Date "${insuranceStartDateRaw}". Format must be YYYY-MM-DD or DD/MM/YYYY.`
        });
      }
    }

    // 19. Policy Expiry Date Validation (Column: Policy Expiry Date (YYYY-MM-DD))
    let insuranceExpiryDate = null;
    if (insuranceExpiryDateRaw !== '') {
      insuranceExpiryDate = parseExcelDate(insuranceExpiryDateRaw);
      if (!insuranceExpiryDate) {
        rowErrors.push({
          sn: snVal,
          row: rowNum,
          tagNumber: tagNumber || '-',
          column: 'Policy Expiry Date (YYYY-MM-DD)',
          error: `Invalid Policy Expiry Date "${insuranceExpiryDateRaw}". Format must be YYYY-MM-DD or DD/MM/YYYY.`
        });
      }
    }

    // 20. Age calculation or override
    let ageInMonths = null;
    if (ageRaw !== '') {
      const numAge = parseDecimal(ageRaw);
      if (numAge !== null && numAge >= 0) {
        ageInMonths = Math.round(numAge);
      }
    } else if (birthDate) {
      ageInMonths = Math.max(0, Math.floor((now.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24 * 30.4375)));
    }

    // 21. Birth Type validation (legacy)
    let birthType = null;
    if (birthTypeRaw !== '') {
      const btUpper = String(birthTypeRaw).trim().toUpperCase();
      const validBirthTypes = ['SINGLE', 'TWIN', 'TRIPLET', 'QUADRUPLET', 'OTHERS'];
      if (validBirthTypes.includes(btUpper)) {
        birthType = btUpper;
      }
    }

    // Collect errors or store valid record
    if (rowErrors.length > 0) {
      errors.push(...rowErrors);
    } else if (matchedBreed) {
      validRecords.push({
        sn: snVal,
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
        motherTag,
        fatherTag,
        batchNo,
        ageInMonths,
        birthType,
        teethStage,
        status,
        remark,
        insuranceCompany,
        insurancePolicyNo,
        insuranceStartDate,
        insuranceExpiryDate,
        treatmentRecord,
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
      const finalWeight = rec.currentWeight || rec.purchaseWeight || rec.birthWeight || null;

      createdAnimals.push({
        id: animalId,
        tag_number: rec.tagNumber,
        breed_id: rec.breedId,
        gender: rec.gender,
        animal_type: rec.animalType || 'Goat',
        color: rec.color,
        birth_date: rec.birthDate,
        birth_weight: rec.birthWeight,
        acquisition_method: rec.acquisitionMethod || 'BORN',
        purchase_date: rec.purchaseDate,
        purchase_price: rec.purchasePrice,
        purchase_weight: rec.purchaseWeight,
        current_weight: finalWeight,
        female_condition: rec.femaleCondition || null,
        location_id: rec.locationId,
        is_breeder: rec.isBreeder || false,
        is_qurbani: rec.isQurbani || false,
        mother_tag_id: rec.motherTag || null,
        father_tag_id: rec.fatherTag || null,
        batch_no: rec.batchNo,
        age_in_months: rec.ageInMonths,
        birth_type: rec.birthType,
        teeth_stage: rec.teethStage,
        status: rec.status || 'LIVE',
        remark: rec.remark,
        insurance_company: rec.insuranceCompany,
        insurance_policy_no: rec.insurancePolicyNo,
        insurance_start_date: rec.insuranceStartDate,
        insurance_expiry_date: rec.insuranceExpiryDate,
        treatment_record: rec.treatmentRecord,
        farm_id: farmId,
        created_by_user_id: userId,
        updated_by_user_id: userId,
        created_at: now,
        updated_at: now
      });

      // If initial weight recorded, log it in weights table as well
      if (finalWeight) {
        weightEntries.push({
          id: uuidv4(),
          animal_id: animalId,
          farm_id: farmId,
          weight: finalWeight,
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


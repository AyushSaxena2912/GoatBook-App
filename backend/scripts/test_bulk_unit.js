const XLSX = require('xlsx');

// Mock Prisma for unit testing validation logic
const mockFarmId = 'farm-123-abc';

// Override prisma module methods for test
const prisma = require('../config/prisma');

prisma.animals = {
  findMany: async () => [
    { tag_number: 'GB-EXISTING-01' },
    { tag_number: 'GB-M01' },
    { tag_number: 'GB-F01' }
  ]
};

prisma.breeds = {
  findMany: async () => [
    { id: 'breed-1', name: 'Sirohi', animal_type: 'Goat' },
    { id: 'breed-2', name: 'Barbari', animal_type: 'Goat' }
  ]
};

prisma.locations = {
  findMany: async () => [
    { id: 'loc-1', name: 'Shed A', code: 'SHED-A' },
    { id: 'loc-2', name: 'Shed B', code: 'SHED-B' }
  ]
};

const bulkController = require('../modules/bulk/bulk.controller');

async function testUnit() {
  console.log('--- STARTING BULK UNIT TESTS ---');

  // 1. Download Template Test
  console.log('\n[TEST 1] Testing Template Header Generation...');
  let templateData = null;
  const mockReqTemplate = {
    farmId: mockFarmId,
    query: { format: 'base64' }
  };
  const mockResTemplate = {
    json: (d) => { templateData = d; }
  };

  await bulkController.downloadAnimalTemplate(mockReqTemplate, mockResTemplate);
  if (!templateData || !templateData.base64) {
    throw new Error('Template download returned empty base64 data');
  }

  const templateWb = XLSX.read(Buffer.from(templateData.base64, 'base64'), { type: 'buffer' });
  const sheet = templateWb.Sheets['Animals Template'];
  const headers = XLSX.utils.sheet_to_json(sheet, { header: 1 })[0];

  console.log('Generated Template Headers (Total 27):');
  console.log(headers);

  const expectedHeaders = [
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

  if (headers.length !== expectedHeaders.length) {
    throw new Error(`Header count mismatch. Expected ${expectedHeaders.length}, got ${headers.length}`);
  }

  for (let i = 0; i < expectedHeaders.length; i++) {
    if (headers[i] !== expectedHeaders[i]) {
      throw new Error(`Header index ${i} mismatch. Expected "${expectedHeaders[i]}", got "${headers[i]}"`);
    }
  }
  console.log('✓ Template headers match exact 27 specifications!');

  // 2. Validation Test with Invalid Excel (including "Tttt" non-existent location & missing parents)
  console.log('\n[TEST 2] Testing Validation Logic on Excel Data with Errors...');
  const invalidSheetData = [
    expectedHeaders,
    // Row 2 (Sn 1): Missing Tag Number
    ['', 'Sirohi', 'FEMALE', 'Goat', 'Brown', '2024-01-01', 3.0, 'BORN', '', '', '', 25.0, 'NONE', 'Shed A', 'NO', 'NO', '', '', 'B-1', 'Milk', 'LIVE', '', '', '', '', '', ''],
    // Row 3 (Sn 2): Invalid Breed
    ['GB-102', 'UnknownBreed', 'MALE', 'Goat', 'White', '', '', 'BORN', '', '', '', 30.0, '', 'Shed B', 'YES', 'NO', '', '', '', '', 'LIVE', '', '', '', '', '', ''],
    // Row 4 (Sn 3): Non-existent Location ("Tttt")
    ['GB-103', 'Sirohi', 'FEMALE', 'Goat', 'Black', '', '', 'BORN', '', '', '', 20.0, 'NONE', 'Tttt', 'NO', 'NO', '', '', '', '', 'LIVE', '', '', '', '', '', ''],
    // Row 5 (Sn 4): Female condition on MALE animal
    ['GB-104', 'Barbari', 'MALE', 'Goat', 'White', '', '', 'BORN', '', '', '', 35.0, 'PREGNANT', 'Shed A', 'NO', 'NO', '', '', '', '', 'LIVE', '', '', '', '', '', ''],
    // Row 6 (Sn 5): Existing tag in database
    ['GB-EXISTING-01', 'Barbari', 'FEMALE', 'Goat', 'White', '', '', 'BORN', '', '', '', 28.0, 'NONE', 'Shed A', 'NO', 'NO', '', '', '', '', 'LIVE', '', '', '', '', '', ''],
    // Row 7 (Sn 6): Non-existent Mother Tag & Father Tag & Invalid Policy Date
    ['GB-106', 'Sirohi', 'FEMALE', 'Goat', 'White', '', '', 'BORN', '', '', '', 20.0, 'NONE', 'Shed A', 'NO', 'NO', 'GB-M99-MISSING', 'GB-F99-MISSING', '', '', 'LIVE', '', 'National Insurance', 'POL-123', 'INVALID-DATE', '', 'Dewormed']
  ];

  const invalidWs = XLSX.utils.aoa_to_sheet(invalidSheetData);
  const invalidWb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(invalidWb, invalidWs, 'Animals Template');
  const invalidBuf = XLSX.write(invalidWb, { type: 'buffer', bookType: 'xlsx' });

  let validateRes = null;
  const mockReqValidate = {
    farmId: mockFarmId,
    body: { fileBase64: invalidBuf.toString('base64') }
  };
  const mockResValidate = {
    json: (d) => { validateRes = d; },
    status: (code) => ({ json: (d) => { validateRes = { ...d, statusCode: code }; } })
  };

  await bulkController.validateAnimalsImport(mockReqValidate, mockResValidate);
  console.log('Validation Output:');
  console.log(JSON.stringify(validateRes, null, 2));

  if (!validateRes || validateRes.success !== false) {
    throw new Error('Validation should have failed for invalid rows');
  }

  // Find location error for "Tttt"
  const ttttErr = validateRes.errors.find(e => e.column === 'shed No.' && e.error.includes('Tttt'));
  if (!ttttErr) {
    throw new Error('FAIL: Location "Tttt" did not trigger validation error!');
  }
  console.log('✓ Location "Tttt" correctly raised validation error:', ttttErr.error);

  const policyDateErr = validateRes.errors.find(e => e.column.includes('Policy Start Date'));
  if (!policyDateErr) {
    throw new Error('FAIL: Invalid Policy Start Date did not trigger validation error!');
  }
  console.log('✓ Invalid Policy Start Date correctly raised validation error:', policyDateErr.error);

  console.log('✓ Validation error detection PASSED!');

  // 3. Validation Test with Valid Excel including Insurance & Treatment Record
  console.log('\n[TEST 3] Testing Validation Logic on Valid Excel Data (with Insurance & Treatment)...');
  const validSheetData = [
    expectedHeaders,
    ['GB-201', 'Sirohi', 'FEMALE', 'Goat', 'Brown', '2024-01-15', 3.2, 'BORN', '', '', '', 28.5, 'NONE', 'Shed A', 'NO', 'NO', 'GB-M01', 'GB-F01', 'BATCH-1', '2 Teeth', 'LIVE', 'Healthy doe', 'National Insurance', 'POL-100200', '2024-01-20', '2025-01-19', 'Vaccination PPR done'],
    ['GB-202', 'Barbari', 'MALE', 'Goat', 'White', '2023-11-20', 2.8, 'PURCHASED', '2024-02-10', 9500, 22.0, 34.0, '', 'Shed B', 'YES', 'NO', '', '', 'BATCH-1', '4 Teeth', 'LIVE', 'Purchased breeder buck', 'ICICI Lombard', 'POL-300400', '2024-02-15', '2025-02-14', 'Routine health checkup']
  ];

  const validWs = XLSX.utils.aoa_to_sheet(validSheetData);
  const validWb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(validWb, validWs, 'Animals Template');
  const validBuf = XLSX.write(validWb, { type: 'buffer', bookType: 'xlsx' });

  let validRes = null;
  const mockReqValid = {
    farmId: mockFarmId,
    body: { fileBase64: validBuf.toString('base64') }
  };
  const mockResValid = {
    json: (d) => { validRes = d; },
    status: (code) => ({ json: (d) => { validRes = { ...d, statusCode: code }; } })
  };

  await bulkController.validateAnimalsImport(mockReqValid, mockResValid);
  console.log('Valid Sheet Validation Output:');
  console.log(JSON.stringify(validRes, null, 2));

  if (!validRes || !validRes.success || validRes.validCount !== 2) {
    throw new Error('Valid sheet failed validation');
  }

  if (validRes.preview[0].insuranceCompany !== 'National Insurance' || validRes.preview[0].treatmentRecord !== 'Vaccination PPR done') {
    throw new Error('Insurance Company or Treatment Record not parsed correctly into preview record!');
  }

  console.log('✓ Valid sheet validation with Insurance & Treatment PASSED!');
  console.log('\nALL BULK UNIT TESTS PASSED SUCCESSFULLY!');
}

testUnit().catch((err) => {
  console.error('TEST FAILED:', err);
  process.exit(1);
});

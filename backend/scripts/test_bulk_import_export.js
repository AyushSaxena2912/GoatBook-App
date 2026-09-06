require('dotenv').config();
const XLSX = require('xlsx');
const prisma = require('../config/prisma');
const bulkController = require('../modules/bulk/bulk.controller');

async function runTests() {
  console.log('--- STARTING BULK IMPORT & EXPORT TESTS ---');

  // 1. Find a test farm and user
  const farm = await prisma.farms.findFirst({
    include: {
      breeds: true,
      locations: true
    }
  });

  if (!farm) {
    console.error('No farm found in DB to test with.');
    process.exit(1);
  }

  console.log(`Using Farm: "${farm.name}" (${farm.id})`);

  // Ensure farm has at least one breed
  let breed = await prisma.breeds.findFirst({
    where: { OR: [{ farm_id: farm.id }, { is_default: true }] }
  });

  if (!breed) {
    console.log('Creating a test breed...');
    breed = await prisma.breeds.create({
      data: {
        id: require('uuid').v4(),
        name: 'Test Sirohi',
        farm_id: farm.id,
        animal_type: 'Goat'
      }
    });
  }

  console.log(`Using Breed: "${breed.name}" (${breed.id})`);

  const mockUser = await prisma.users.findFirst();

  // ----------------------------------------------------
  // TEST 1: Download Template
  // ----------------------------------------------------
  console.log('\n[TEST 1] Testing Template Generation...');
  let templateResult = null;
  const mockReqTemplate = {
    farmId: farm.id,
    query: { format: 'base64' }
  };
  const mockResTemplate = {
    json: (data) => { templateResult = data; },
    setHeader: () => {},
    send: (buf) => { templateResult = { buffer: buf }; }
  };

  await bulkController.downloadAnimalTemplate(mockReqTemplate, mockResTemplate);
  if (!templateResult || !templateResult.base64) {
    throw new Error('Template generation failed or returned empty base64');
  }

  const templateWb = XLSX.read(Buffer.from(templateResult.base64, 'base64'), { type: 'buffer' });
  console.log('Template Sheet Names:', templateWb.SheetNames);
  if (!templateWb.SheetNames.includes('Animals') || !templateWb.SheetNames.includes('Reference & Guidelines')) {
    throw new Error('Template missing expected sheets');
  }
  console.log('✓ Template generation test PASSED!');

  // ----------------------------------------------------
  // TEST 2: Export Animals
  // ----------------------------------------------------
  console.log('\n[TEST 2] Testing Animals Export...');
  let exportResult = null;
  const mockReqExport = {
    farmId: farm.id,
    query: { format: 'base64' }
  };
  const mockResExport = {
    json: (data) => { exportResult = data; },
    setHeader: () => {},
    send: (buf) => { exportResult = { buffer: buf }; }
  };

  await bulkController.exportAnimals(mockReqExport, mockResExport);
  if (!exportResult || !exportResult.base64) {
    throw new Error('Export animals failed or returned empty base64');
  }

  const exportWb = XLSX.read(Buffer.from(exportResult.base64, 'base64'), { type: 'buffer' });
  console.log('Exported Animals Sheet Names:', exportWb.SheetNames, '| Total Count:', exportResult.totalExported);
  console.log('✓ Animals export test PASSED!');

  // ----------------------------------------------------
  // TEST 3: Validation Error Handling on Invalid Excel
  // ----------------------------------------------------
  console.log('\n[TEST 3] Testing Error Diagnostics on Invalid Excel...');
  const invalidSheetData = [
    ['Tag Number *', 'Breed Name *', 'Gender *', 'Birth Date', 'Birth Weight', 'Female Condition'],
    ['', breed.name, 'FEMALE', '2024-01-01', 3.0, 'NONE'], // Row 2: Missing Tag
    ['GB-ERR-02', 'NonExistentBreed12345', 'MALE', '2024-01-01', 3.0, ''], // Row 3: Invalid Breed
    ['GB-ERR-03', breed.name, 'INVALID_GENDER', '2024-01-01', 3.0, ''], // Row 4: Invalid Gender
    ['GB-ERR-04', breed.name, 'MALE', '2024-01-01', 3.0, 'PREGNANT'], // Row 5: Female condition on male
  ];

  const invalidWs = XLSX.utils.aoa_to_sheet(invalidSheetData);
  const invalidWb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(invalidWb, invalidWs, 'Animals');
  const invalidBuffer = XLSX.write(invalidWb, { type: 'buffer', bookType: 'xlsx' });

  let validateResult = null;
  const mockReqValidate = {
    farmId: farm.id,
    body: { fileBase64: invalidBuffer.toString('base64') },
    subscription: null
  };
  const mockResValidate = {
    json: (data) => { validateResult = data; },
    status: (code) => ({
      json: (data) => { validateResult = { ...data, statusCode: code }; }
    })
  };

  await bulkController.validateAnimalsImport(mockReqValidate, mockResValidate);
  console.log('Validation Result with Errors:', JSON.stringify(validateResult, null, 2));

  if (validateResult.success !== false || validateResult.errorCount < 4) {
    throw new Error(`Expected at least 4 errors, got: ${validateResult.errorCount}`);
  }
  console.log('✓ Validation error reporting test PASSED!');

  // ----------------------------------------------------
  // TEST 4: Valid Import of Animals
  // ----------------------------------------------------
  console.log('\n[TEST 4] Testing Valid Animal Bulk Import...');
  const testTag1 = `TEST-IMP-${Date.now()}-1`;
  const testTag2 = `TEST-IMP-${Date.now()}-2`;

  const validSheetData = [
    ['Tag Number *', 'Breed Name *', 'Gender *', 'Birth Date', 'Birth Weight (kg)', 'Current Weight (kg)', 'Color', 'Remark'],
    [testTag1, breed.name, 'FEMALE', '2024-02-01', 3.2, 25.4, 'White', 'Bulk test doe'],
    [testTag2, breed.name, 'MALE', '2023-12-15', 2.9, 32.0, 'Brown', 'Bulk test buck']
  ];

  const validWs = XLSX.utils.aoa_to_sheet(validSheetData);
  const validWb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(validWb, validWs, 'Animals');
  const validBuffer = XLSX.write(validWb, { type: 'buffer', bookType: 'xlsx' });

  let importResult = null;
  const mockReqImport = {
    farmId: farm.id,
    user: mockUser,
    body: { fileBase64: validBuffer.toString('base64') },
    subscription: null
  };
  const mockResImport = {
    json: (data) => { importResult = data; },
    status: (code) => ({
      json: (data) => { importResult = { ...data, statusCode: code }; }
    })
  };

  await bulkController.importAnimals(mockReqImport, mockResImport);
  console.log('Import Result:', JSON.stringify(importResult, null, 2));

  if (!importResult.success || importResult.importedCount !== 2) {
    throw new Error('Bulk import failed to import 2 animals');
  }

  // Verify created animals in DB
  const dbAnimal1 = await prisma.animals.findFirst({
    where: { tag_number: testTag1, farm_id: farm.id }
  });
  const dbAnimal2 = await prisma.animals.findFirst({
    where: { tag_number: testTag2, farm_id: farm.id }
  });

  if (!dbAnimal1 || !dbAnimal2) {
    throw new Error('Animals not found in DB after import');
  }

  // Verify weights table entries
  const weights1 = await prisma.weights.findFirst({
    where: { animal_id: dbAnimal1.id }
  });
  if (!weights1) {
    throw new Error('Initial weight not created for animal 1');
  }

  console.log(`Verified DB Animal 1: ${dbAnimal1.tag_number}, Weight: ${weights1.weight}`);
  console.log(`Verified DB Animal 2: ${dbAnimal2.tag_number}`);
  console.log('✓ Bulk import test PASSED!');

  // Clean up test animals
  await prisma.weights.deleteMany({
    where: { animal_id: { in: [dbAnimal1.id, dbAnimal2.id] } }
  });
  await prisma.animals.deleteMany({
    where: { id: { in: [dbAnimal1.id, dbAnimal2.id] } }
  });
  console.log('✓ Cleaned up test records');

  console.log('\n========================================');
  console.log('ALL BULK IMPORT & EXPORT TESTS PASSED SUCCESSFULLY!');
  console.log('========================================');
}

runTests()
  .catch(err => {
    console.error('TEST RUN FAILED:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

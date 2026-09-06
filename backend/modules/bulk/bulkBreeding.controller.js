const XLSX = require('xlsx');
const prisma = require('../../config/prisma');
const { v4: uuidv4 } = require('uuid');
const { normalizeKey, parseExcelDate, parseDecimal, getFarmId } = require('./bulkUtils');

// 1. GENERATE & DOWNLOAD BREEDING EXCEL TEMPLATE
exports.downloadBreedingTemplate = async (req, res) => {
  try {
    const farmId = await getFarmId(req);
    const animals = farmId ? await prisma.animals.findMany({
      where: { farm_id: farmId, status: 'LIVE' },
      select: { tag_number: true, gender: true }
    }) : [];

    const headers = [
      'Tag Number *',
      'Delivery Date (YYYY-MM-DD) *',
      'Birth Type (SINGLE/TWIN/TRIPLET/QUADRUPLET/OTHERS) *',
      'Male Kids Count',
      'Female Kids Count',
      'Remark'
    ];

    const sampleTag = animals[0]?.tag_number || 'GB-101';
    const sampleRows = [
      [sampleTag, '2024-05-10', 'TWIN', 1, 1, 'Healthy twin delivery'],
      ['GB-102', '2024-05-15', 'SINGLE', 0, 1, 'Single doe kid']
    ];

    const wsData = [headers, ...sampleRows];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    ws['!cols'] = [
      { wch: 18 }, { wch: 28 }, { wch: 45 },
      { wch: 18 }, { wch: 18 }, { wch: 30 }
    ];

    const refHeaders = ['Available Female Animals (Tag Numbers)', 'Gender'];
    const refRows = animals.map(a => [a.tag_number, a.gender]);
    const refWs = XLSX.utils.aoa_to_sheet([refHeaders, ...refRows]);
    refWs['!cols'] = [{ wch: 25 }, { wch: 12 }];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Breeding Template');
    XLSX.utils.book_append_sheet(wb, refWs, 'Available Female Animals');

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    if (req.query.format === 'base64') {
      return res.json({
        filename: 'goatbook_breeding_template.xlsx',
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        base64: buffer.toString('base64')
      });
    }

    res.setHeader('Content-Disposition', 'attachment; filename="goatbook_breeding_template.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    return res.send(buffer);
  } catch (err) {
    console.error('BULK BREEDING TEMPLATE ERROR:', err);
    res.status(500).json({ message: 'Failed to generate breeding template', error: err.message });
  }
};

// 2. EXPORT BREEDING RECORDS
exports.exportBreedings = async (req, res) => {
  try {
    const farmId = await getFarmId(req);
    if (!farmId) return res.status(400).json({ message: 'No farm selected' });

    const breedings = await prisma.breedings.findMany({
      where: { farm_id: farmId },
      include: { animals: { select: { tag_number: true } } },
      orderBy: { delivery_date: 'desc' }
    });

    const headers = [
      'Tag Number *',
      'Delivery Date (YYYY-MM-DD) *',
      'Birth Type (SINGLE/TWIN/TRIPLET/QUADRUPLET/OTHERS) *',
      'Male Kids Count',
      'Female Kids Count',
      'Remark'
    ];

    const rows = breedings.map(b => [
      b.animals?.tag_number || '',
      b.delivery_date ? new Date(b.delivery_date).toISOString().split('T')[0] : '',
      b.birth_type || 'SINGLE',
      b.num_male || 0,
      b.num_female || 0,
      b.remark || ''
    ]);

    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    ws['!cols'] = headers.map(() => ({ wch: 22 }));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Breeding Records');

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    const filename = `goatbook_breeding_${new Date().toISOString().split('T')[0]}.xlsx`;

    if (req.query.format === 'base64') {
      return res.json({
        filename,
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        base64: buffer.toString('base64'),
        totalExported: breedings.length
      });
    }

    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    return res.send(buffer);
  } catch (err) {
    console.error('EXPORT BREEDINGS ERROR:', err);
    res.status(500).json({ message: 'Failed to export breeding records', error: err.message });
  }
};

// 3. PARSE & VALIDATE BREEDING SHEET
const parseAndValidateBreedingSheet = async (buffer, farmId) => {
  const wb = XLSX.read(buffer, { type: 'buffer', cellDates: true });
  const firstSheetName = wb.SheetNames[0];
  if (!firstSheetName) throw new Error('Uploaded file has no sheets.');

  const ws = wb.Sheets[firstSheetName];
  const rawRows = XLSX.utils.sheet_to_json(ws, { defval: '', raw: false });

  if (!rawRows || rawRows.length === 0) {
    return {
      totalRows: 0,
      validRecords: [],
      errors: [{ sn: 1, row: 1, tagNumber: '-', column: 'File', error: 'No data rows found in spreadsheet.' }]
    };
  }

  const animals = await prisma.animals.findMany({
    where: { farm_id: farmId },
    select: { id: true, tag_number: true, gender: true }
  });
  const animalMap = new Map();
  animals.forEach(a => animalMap.set(a.tag_number.trim(), a));

  const validBirthTypes = ['SINGLE', 'TWIN', 'TRIPLET', 'QUADRUPLET', 'OTHERS'];
  const errors = [];
  const validRecords = [];
  const now = new Date();

  for (let i = 0; i < rawRows.length; i++) {
    const raw = rawRows[i];
    const rowNum = i + 2;
    const row = {};
    for (const [k, v] of Object.entries(raw)) {
      const norm = normalizeKey(k);
      if (norm) row[norm] = v;
    }

    const snVal = parseInt(row.sn || row.sno || (i + 1), 10) || (i + 1);

    let tagNumberRaw = row.tagnumber || row.tagno || row.tag || '';
    if (!tagNumberRaw) {
      for (const [k, v] of Object.entries(raw)) {
        const kClean = normalizeKey(k);
        if (kClean.includes('tag') && String(v).trim()) {
          tagNumberRaw = v;
          break;
        }
      }
    }
    const tagNumber = String(tagNumberRaw).trim();

    const deliveryDateRaw = row.deliverydate || row.date || '';
    const birthTypeRaw = row.birthtype || '';
    const numMaleRaw = row.malekidscount || row.nummale || row.malecount || row.male || '';
    const numFemaleRaw = row.femalekidscount || row.numfemale || row.femalecount || row.female || '';
    const remark = String(row.remark || row.notes || '').trim() || null;

    const rowErrors = [];

    // Tag Number Validation
    let matchedAnimal = null;
    if (!tagNumber) {
      rowErrors.push({ sn: snVal, row: rowNum, tagNumber: '-', column: 'Tag Number *', error: 'Tag Number is required.' });
    } else {
      matchedAnimal = animalMap.get(tagNumber);
      if (!matchedAnimal) {
        rowErrors.push({
          sn: snVal, row: rowNum, tagNumber, column: 'Tag Number *',
          error: `Animal Tag Number "${tagNumber}" does not exist in your farm inventory.`
        });
      }
    }

    // Delivery Date Validation
    let deliveryDate = null;
    if (!deliveryDateRaw) {
      rowErrors.push({ sn: snVal, row: rowNum, tagNumber: tagNumber || '-', column: 'Delivery Date *', error: 'Delivery Date is required.' });
    } else {
      deliveryDate = parseExcelDate(deliveryDateRaw);
      if (!deliveryDate) {
        rowErrors.push({ sn: snVal, row: rowNum, tagNumber: tagNumber || '-', column: 'Delivery Date *', error: `Invalid Delivery Date "${deliveryDateRaw}". Must be YYYY-MM-DD or DD/MM/YYYY.` });
      } else if (deliveryDate > now) {
        rowErrors.push({ sn: snVal, row: rowNum, tagNumber: tagNumber || '-', column: 'Delivery Date *', error: 'Delivery Date cannot be in the future.' });
      }
    }

    // Birth Type Validation
    let birthType = 'SINGLE';
    if (!birthTypeRaw) {
      rowErrors.push({ sn: snVal, row: rowNum, tagNumber: tagNumber || '-', column: 'Birth Type *', error: 'Birth Type is required.' });
    } else {
      const btUpper = String(birthTypeRaw).trim().toUpperCase();
      if (!validBirthTypes.includes(btUpper)) {
        rowErrors.push({ sn: snVal, row: rowNum, tagNumber: tagNumber || '-', column: 'Birth Type *', error: `Invalid Birth Type "${birthTypeRaw}". Allowed values: [SINGLE, TWIN, TRIPLET, QUADRUPLET, OTHERS].` });
      } else {
        birthType = btUpper;
      }
    }

    const numMale = parseDecimal(numMaleRaw) !== null ? Math.max(0, parseInt(numMaleRaw, 10)) : 0;
    const numFemale = parseDecimal(numFemaleRaw) !== null ? Math.max(0, parseInt(numFemaleRaw, 10)) : 0;

    if (rowErrors.length > 0) {
      errors.push(...rowErrors);
    } else if (matchedAnimal) {
      validRecords.push({
        sn: snVal,
        rowNum,
        animalId: matchedAnimal.id,
        tagNumber: matchedAnimal.tag_number,
        deliveryDate,
        birthType,
        numMale,
        numFemale,
        remark
      });
    }
  }

  return { totalRows: rawRows.length, validRecords, errors };
};

// 4. VALIDATE BREEDING IMPORT
exports.validateBreedingsImport = async (req, res) => {
  try {
    const farmId = await getFarmId(req);
    if (!farmId) return res.status(400).json({ message: 'No farm selected' });

    let buffer = req.file ? req.file.buffer : (req.body.fileBase64 ? Buffer.from(req.body.fileBase64, 'base64') : null);
    if (!buffer) return res.status(400).json({ message: 'No Excel file provided' });

    const { totalRows, validRecords, errors } = await parseAndValidateBreedingSheet(buffer, farmId);
    return res.json({
      success: errors.length === 0,
      totalRows,
      validCount: validRecords.length,
      errorCount: errors.length,
      errors,
      preview: validRecords.slice(0, 10)
    });
  } catch (err) {
    console.error('VALIDATE BREEDING ERROR:', err);
    res.status(500).json({ message: 'Failed to validate breeding spreadsheet', error: err.message });
  }
};

// 5. IMPORT BREEDINGS
exports.importBreedings = async (req, res) => {
  try {
    const farmId = await getFarmId(req);
    if (!farmId) return res.status(400).json({ message: 'No farm selected' });

    let buffer = req.file ? req.file.buffer : (req.body.fileBase64 ? Buffer.from(req.body.fileBase64, 'base64') : null);
    if (!buffer) return res.status(400).json({ message: 'No Excel file provided' });

    const { totalRows, validRecords, errors } = await parseAndValidateBreedingSheet(buffer, farmId);
    if (errors.length > 0) {
      return res.status(422).json({
        success: false,
        message: `Validation failed for ${errors.length} issue(s). Please fix and retry.`,
        totalRows, validCount: validRecords.length, errorCount: errors.length, errors
      });
    }

    if (validRecords.length === 0) {
      return res.status(400).json({ success: false, message: 'No valid breeding records found.' });
    }

    const userId = req.user?.id || null;
    const now = new Date();
    const createdData = validRecords.map(rec => ({
      id: uuidv4(),
      animal_id: rec.animalId,
      farm_id: farmId,
      delivery_date: rec.deliveryDate,
      birth_type: rec.birthType,
      num_male: rec.numMale,
      num_female: rec.numFemale,
      remark: rec.remark,
      created_by_user_id: userId,
      updated_by_user_id: userId,
      created_at: now,
      updated_at: now
    }));

    await prisma.breedings.createMany({ data: createdData });

    return res.json({
      success: true,
      message: `Successfully imported ${createdData.length} breeding record(s)!`,
      importedCount: createdData.length,
      totalProcessed: totalRows
    });
  } catch (err) {
    console.error('IMPORT BREEDING ERROR:', err);
    res.status(500).json({ message: 'Failed to import breeding records', error: err.message });
  }
};

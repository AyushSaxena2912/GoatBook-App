const XLSX = require('xlsx');
const prisma = require('../../config/prisma');
const { v4: uuidv4 } = require('uuid');
const { normalizeKey, parseExcelDate, parseDecimal, getFarmId } = require('./bulkUtils');

// 1. GENERATE & DOWNLOAD WEIGHT EXCEL TEMPLATE
exports.downloadWeightTemplate = async (req, res) => {
  try {
    const farmId = await getFarmId(req);
    const animals = farmId ? await prisma.animals.findMany({
      where: { farm_id: farmId, status: 'LIVE' },
      select: { tag_number: true }
    }) : [];

    const headers = [
      'Tag Number *',
      'Date (YYYY-MM-DD) *',
      'Weight (kg) *',
      'Height (cm)',
      'Remark'
    ];

    const sampleTag1 = animals[0]?.tag_number || 'GB-101';
    const sampleTag2 = animals[1]?.tag_number || 'GB-102';

    const sampleRows = [
      [sampleTag1, '2024-06-01', 32.5, 68.0, 'Monthly weight check'],
      [sampleTag2, '2024-06-01', 24.0, '', 'Routine checkup']
    ];

    const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleRows]);
    ws['!cols'] = headers.map(() => ({ wch: 22 }));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Weight Template');

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    if (req.query.format === 'base64') {
      return res.json({
        filename: 'goatbook_weight_template.xlsx',
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        base64: buffer.toString('base64')
      });
    }

    res.setHeader('Content-Disposition', 'attachment; filename="goatbook_weight_template.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    return res.send(buffer);
  } catch (err) {
    console.error('BULK WEIGHT TEMPLATE ERROR:', err);
    res.status(500).json({ message: 'Failed to generate weight template', error: err.message });
  }
};

// 2. EXPORT WEIGHT RECORDS
exports.exportWeights = async (req, res) => {
  try {
    const farmId = await getFarmId(req);
    if (!farmId) return res.status(400).json({ message: 'No farm selected' });

    const weights = await prisma.weights.findMany({
      where: { farm_id: farmId },
      orderBy: { date: 'desc' }
    });

    const headers = [
      'Tag Number *',
      'Date (YYYY-MM-DD) *',
      'Weight (kg) *',
      'Height (cm)',
      'Remark'
    ];

    const rows = weights.map(w => [
      w.tag_number || '',
      w.date ? new Date(w.date).toISOString().split('T')[0] : '',
      w.weight ? parseFloat(w.weight) : '',
      w.height ? parseFloat(w.height) : '',
      w.remark || ''
    ]);

    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    ws['!cols'] = headers.map(() => ({ wch: 22 }));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Weight Records');

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    const filename = `goatbook_weights_${new Date().toISOString().split('T')[0]}.xlsx`;

    if (req.query.format === 'base64') {
      return res.json({
        filename,
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        base64: buffer.toString('base64'),
        totalExported: weights.length
      });
    }

    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    return res.send(buffer);
  } catch (err) {
    console.error('EXPORT WEIGHTS ERROR:', err);
    res.status(500).json({ message: 'Failed to export weight records', error: err.message });
  }
};

// 3. PARSE & VALIDATE WEIGHT SHEET
const parseAndValidateWeightSheet = async (buffer, farmId) => {
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
    select: { id: true, tag_number: true }
  });
  const animalMap = new Map();
  animals.forEach(a => animalMap.set(a.tag_number.trim(), a));

  const errors = [];
  const validRecords = [];

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

    const dateRaw = row.date || row.weightdate || '';
    const weightRaw = row.weight || row.weightkg || '';
    const heightRaw = row.height || row.heightcm || '';
    const remark = String(row.remark || row.notes || '').trim() || null;

    const rowErrors = [];

    // Tag Number Validation
    let matchedAnimal = null;
    if (!tagNumber) {
      rowErrors.push({ sn: snVal, row: rowNum, tagNumber: '-', column: 'Tag Number *', error: 'Tag Number is required.' });
    } else {
      matchedAnimal = animalMap.get(tagNumber);
      if (!matchedAnimal) {
        rowErrors.push({ sn: snVal, row: rowNum, tagNumber, column: 'Tag Number *', error: `Tag Number "${tagNumber}" does not exist in your farm inventory.` });
      }
    }

    // Date Validation
    let date = null;
    if (!dateRaw) {
      rowErrors.push({ sn: snVal, row: rowNum, tagNumber: tagNumber || '-', column: 'Date *', error: 'Date is required.' });
    } else {
      date = parseExcelDate(dateRaw);
      if (!date) {
        rowErrors.push({ sn: snVal, row: rowNum, tagNumber: tagNumber || '-', column: 'Date *', error: `Invalid Date "${dateRaw}". Must be YYYY-MM-DD or DD/MM/YYYY.` });
      }
    }

    // Weight Validation
    let weight = null;
    if (weightRaw === '') {
      rowErrors.push({ sn: snVal, row: rowNum, tagNumber: tagNumber || '-', column: 'Weight (kg) *', error: 'Weight (kg) is required.' });
    } else {
      weight = parseDecimal(weightRaw);
      if (weight === null || weight <= 0) {
        rowErrors.push({ sn: snVal, row: rowNum, tagNumber: tagNumber || '-', column: 'Weight (kg) *', error: `Invalid Weight "${weightRaw}". Must be a positive number.` });
      }
    }

    const height = heightRaw !== '' ? parseDecimal(heightRaw) : null;

    if (rowErrors.length > 0) {
      errors.push(...rowErrors);
    } else if (matchedAnimal) {
      validRecords.push({
        sn: snVal,
        rowNum,
        animalId: matchedAnimal.id,
        tagNumber: matchedAnimal.tag_number,
        date,
        weight,
        height,
        remark
      });
    }
  }

  return { totalRows: rawRows.length, validRecords, errors };
};

// 4. VALIDATE WEIGHT IMPORT
exports.validateWeightsImport = async (req, res) => {
  try {
    const farmId = await getFarmId(req);
    if (!farmId) return res.status(400).json({ message: 'No farm selected' });

    let buffer = req.file ? req.file.buffer : (req.body.fileBase64 ? Buffer.from(req.body.fileBase64, 'base64') : null);
    if (!buffer) return res.status(400).json({ message: 'No Excel file provided' });

    const { totalRows, validRecords, errors } = await parseAndValidateWeightSheet(buffer, farmId);
    return res.json({
      success: errors.length === 0,
      totalRows,
      validCount: validRecords.length,
      errorCount: errors.length,
      errors,
      preview: validRecords.slice(0, 10)
    });
  } catch (err) {
    console.error('VALIDATE WEIGHT ERROR:', err);
    res.status(500).json({ message: 'Failed to validate weight spreadsheet', error: err.message });
  }
};

// 5. IMPORT WEIGHTS
exports.importWeights = async (req, res) => {
  try {
    const farmId = await getFarmId(req);
    if (!farmId) return res.status(400).json({ message: 'No farm selected' });

    let buffer = req.file ? req.file.buffer : (req.body.fileBase64 ? Buffer.from(req.body.fileBase64, 'base64') : null);
    if (!buffer) return res.status(400).json({ message: 'No Excel file provided' });

    const { totalRows, validRecords, errors } = await parseAndValidateWeightSheet(buffer, farmId);
    if (errors.length > 0) {
      return res.status(422).json({
        success: false,
        message: `Validation failed for ${errors.length} issue(s). Please fix and retry.`,
        totalRows, validCount: validRecords.length, errorCount: errors.length, errors
      });
    }

    if (validRecords.length === 0) {
      return res.status(400).json({ success: false, message: 'No valid weight records found.' });
    }

    const userId = req.user?.id || null;
    const now = new Date();

    const createdData = validRecords.map(rec => ({
      id: uuidv4(),
      animal_id: rec.animalId,
      farm_id: farmId,
      tag_number: rec.tagNumber,
      weight: rec.weight,
      height: rec.height,
      date: rec.date,
      remark: rec.remark,
      created_by_user_id: userId,
      updated_by_user_id: userId,
      created_at: now,
      updated_at: now
    }));

    await prisma.$transaction(async (tx) => {
      await tx.weights.createMany({ data: createdData });

      // Update current_weight on animals for latest weight records
      for (const rec of validRecords) {
        await tx.animals.update({
          where: { id: rec.animalId },
          data: { current_weight: rec.weight }
        });
      }
    });

    return res.json({
      success: true,
      message: `Successfully imported ${createdData.length} weight record(s)!`,
      importedCount: createdData.length,
      totalProcessed: totalRows
    });
  } catch (err) {
    console.error('IMPORT WEIGHT ERROR:', err);
    res.status(500).json({ message: 'Failed to import weight records', error: err.message });
  }
};

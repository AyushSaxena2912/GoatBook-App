const XLSX = require('xlsx');
const prisma = require('../../config/prisma');
const { v4: uuidv4 } = require('uuid');
const { normalizeKey, parseExcelDate, getFarmId } = require('./bulkUtils');

// 1. GENERATE & DOWNLOAD MATING EXCEL TEMPLATE
exports.downloadMatingTemplate = async (req, res) => {
  try {
    const farmId = await getFarmId(req);
    const females = farmId ? await prisma.animals.findMany({
      where: { farm_id: farmId, gender: 'FEMALE', status: 'LIVE' },
      select: { tag_number: true }
    }) : [];

    const males = farmId ? await prisma.animals.findMany({
      where: { farm_id: farmId, gender: 'MALE', status: 'LIVE' },
      select: { tag_number: true }
    }) : [];

    const headers = [
      'Female Tag Number *',
      'Mating Date (YYYY-MM-DD) *',
      'Mating Type (NATURAL/AI/ET) *',
      'Male Tag Number',
      'Male Breed',
      'Technician',
      'Status (NOT_SUCCESSFUL/PREGNANT/MISCARRIAGE)',
      'Expected Delivery Date (YYYY-MM-DD)',
      'Remark'
    ];

    const sampleFemale = females[0]?.tag_number || 'GB-F10';
    const sampleMale = males[0]?.tag_number || 'GB-M01';

    const sampleRows = [
      [sampleFemale, '2024-01-10', 'NATURAL', sampleMale, 'Sirohi', 'John Doe', 'PREGNANT', '2024-06-09', 'Successful natural mating'],
      ['GB-F11', '2024-01-15', 'AI', '', 'Barbari', 'Dr. Smith', 'PREGNANT', '2024-06-14', 'Artificial Insemination']
    ];

    const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleRows]);
    ws['!cols'] = headers.map(() => ({ wch: 26 }));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Mating Template');

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    if (req.query.format === 'base64') {
      return res.json({
        filename: 'goatbook_mating_template.xlsx',
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        base64: buffer.toString('base64')
      });
    }

    res.setHeader('Content-Disposition', 'attachment; filename="goatbook_mating_template.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    return res.send(buffer);
  } catch (err) {
    console.error('BULK MATING TEMPLATE ERROR:', err);
    res.status(500).json({ message: 'Failed to generate mating template', error: err.message });
  }
};

// 2. EXPORT MATING RECORDS
exports.exportMatings = async (req, res) => {
  try {
    const farmId = await getFarmId(req);
    if (!farmId) return res.status(400).json({ message: 'No farm selected' });

    const matings = await prisma.matings.findMany({
      where: { farm_id: farmId },
      include: { animals: { select: { tag_number: true } } },
      orderBy: { mating_date: 'desc' }
    });

    const headers = [
      'Female Tag Number *',
      'Mating Date (YYYY-MM-DD) *',
      'Mating Type (NATURAL/AI/ET) *',
      'Male Tag Number',
      'Male Breed',
      'Technician',
      'Status (NOT_SUCCESSFUL/PREGNANT/MISCARRIAGE)',
      'Expected Delivery Date (YYYY-MM-DD)',
      'Remark'
    ];

    const rows = matings.map(m => [
      m.animals?.tag_number || '',
      m.mating_date ? new Date(m.mating_date).toISOString().split('T')[0] : '',
      m.mating_type || 'NATURAL',
      m.male_tag_id || '',
      m.male_breed || '',
      m.technician || '',
      m.status || 'PREGNANT',
      m.expected_delivery_date ? new Date(m.expected_delivery_date).toISOString().split('T')[0] : '',
      m.remark || ''
    ]);

    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    ws['!cols'] = headers.map(() => ({ wch: 24 }));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Mating Records');

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    const filename = `goatbook_mating_${new Date().toISOString().split('T')[0]}.xlsx`;

    if (req.query.format === 'base64') {
      return res.json({
        filename,
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        base64: buffer.toString('base64'),
        totalExported: matings.length
      });
    }

    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    return res.send(buffer);
  } catch (err) {
    console.error('EXPORT MATINGS ERROR:', err);
    res.status(500).json({ message: 'Failed to export mating records', error: err.message });
  }
};

// 3. PARSE & VALIDATE MATING SHEET
const parseAndValidateMatingSheet = async (buffer, farmId) => {
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

  const validTypes = ['NATURAL', 'AI', 'ET'];
  const validStatuses = ['NOT_SUCCESSFUL', 'PREGNANT', 'MISCARRIAGE'];

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

    let femaleTagRaw = row.femaletagnumber || row.femaletag || row.tagnumber || row.tag || '';
    if (!femaleTagRaw) {
      for (const [k, v] of Object.entries(raw)) {
        const kClean = normalizeKey(k);
        if (kClean.includes('female') || kClean.includes('tag')) {
          if (String(v).trim()) { femaleTagRaw = v; break; }
        }
      }
    }
    const femaleTag = String(femaleTagRaw).trim();

    const matingDateRaw = row.matingdate || row.date || '';
    const matingTypeRaw = row.matingtype || row.type || '';
    const maleTag = String(row.maletagnumber || row.maletag || row.male || '').trim() || null;
    const maleBreed = String(row.malebreed || '').trim() || null;
    const technician = String(row.technician || row.doctor || '').trim() || null;
    const statusRaw = row.status || '';
    const expDelDateRaw = row.expecteddeliverydate || row.deliverydate || row.expdelivery || '';
    const remark = String(row.remark || row.notes || '').trim() || null;

    const rowErrors = [];

    // Female Tag Validation
    let matchedAnimal = null;
    if (!femaleTag) {
      rowErrors.push({ sn: snVal, row: rowNum, tagNumber: '-', column: 'Female Tag Number *', error: 'Female Tag Number is required.' });
    } else {
      matchedAnimal = animalMap.get(femaleTag);
      if (!matchedAnimal) {
        rowErrors.push({ sn: snVal, row: rowNum, tagNumber: femaleTag, column: 'Female Tag Number *', error: `Female Tag Number "${femaleTag}" does not exist in your farm inventory.` });
      }
    }

    // Mating Date Validation
    let matingDate = null;
    if (!matingDateRaw) {
      rowErrors.push({ sn: snVal, row: rowNum, tagNumber: femaleTag || '-', column: 'Mating Date *', error: 'Mating Date is required.' });
    } else {
      matingDate = parseExcelDate(matingDateRaw);
      if (!matingDate) {
        rowErrors.push({ sn: snVal, row: rowNum, tagNumber: femaleTag || '-', column: 'Mating Date *', error: `Invalid Mating Date "${matingDateRaw}". Format must be YYYY-MM-DD or DD/MM/YYYY.` });
      }
    }

    // Mating Type Validation
    let matingType = 'NATURAL';
    if (!matingTypeRaw) {
      rowErrors.push({ sn: snVal, row: rowNum, tagNumber: femaleTag || '-', column: 'Mating Type *', error: 'Mating Type is required.' });
    } else {
      const mtUpper = String(matingTypeRaw).trim().toUpperCase();
      if (!validTypes.includes(mtUpper)) {
        rowErrors.push({ sn: snVal, row: rowNum, tagNumber: femaleTag || '-', column: 'Mating Type *', error: `Invalid Mating Type "${matingTypeRaw}". Allowed values: [NATURAL, AI, ET].` });
      } else {
        matingType = mtUpper;
      }
    }

    // Status Validation
    let status = 'PREGNANT';
    if (statusRaw !== '') {
      const stUpper = String(statusRaw).trim().toUpperCase();
      if (validStatuses.includes(stUpper)) {
        status = stUpper;
      }
    }

    let expectedDeliveryDate = null;
    if (expDelDateRaw !== '') {
      expectedDeliveryDate = parseExcelDate(expDelDateRaw);
    } else if (matingDate && status === 'PREGNANT') {
      // Auto-calculate expected delivery date (~150 days for goats/sheep)
      expectedDeliveryDate = new Date(matingDate.getTime() + (150 * 86400000));
    }

    if (rowErrors.length > 0) {
      errors.push(...rowErrors);
    } else if (matchedAnimal) {
      validRecords.push({
        sn: snVal,
        rowNum,
        animalId: matchedAnimal.id,
        femaleTag: matchedAnimal.tag_number,
        matingDate,
        matingType,
        maleTag,
        maleBreed,
        technician,
        status,
        expectedDeliveryDate,
        remark
      });
    }
  }

  return { totalRows: rawRows.length, validRecords, errors };
};

// 4. VALIDATE MATING IMPORT
exports.validateMatingsImport = async (req, res) => {
  try {
    const farmId = await getFarmId(req);
    if (!farmId) return res.status(400).json({ message: 'No farm selected' });

    let buffer = req.file ? req.file.buffer : (req.body.fileBase64 ? Buffer.from(req.body.fileBase64, 'base64') : null);
    if (!buffer) return res.status(400).json({ message: 'No Excel file provided' });

    const { totalRows, validRecords, errors } = await parseAndValidateMatingSheet(buffer, farmId);
    return res.json({
      success: errors.length === 0,
      totalRows,
      validCount: validRecords.length,
      errorCount: errors.length,
      errors,
      preview: validRecords.slice(0, 10)
    });
  } catch (err) {
    console.error('VALIDATE MATING ERROR:', err);
    res.status(500).json({ message: 'Failed to validate mating spreadsheet', error: err.message });
  }
};

// 5. IMPORT MATINGS
exports.importMatings = async (req, res) => {
  try {
    const farmId = await getFarmId(req);
    if (!farmId) return res.status(400).json({ message: 'No farm selected' });

    let buffer = req.file ? req.file.buffer : (req.body.fileBase64 ? Buffer.from(req.body.fileBase64, 'base64') : null);
    if (!buffer) return res.status(400).json({ message: 'No Excel file provided' });

    const { totalRows, validRecords, errors } = await parseAndValidateMatingSheet(buffer, farmId);
    if (errors.length > 0) {
      return res.status(422).json({
        success: false,
        message: `Validation failed for ${errors.length} issue(s). Please fix and retry.`,
        totalRows, validCount: validRecords.length, errorCount: errors.length, errors
      });
    }

    if (validRecords.length === 0) {
      return res.status(400).json({ success: false, message: 'No valid mating records found.' });
    }

    const userId = req.user?.id || null;
    const now = new Date();

    const createdData = validRecords.map(rec => ({
      id: uuidv4(),
      animal_id: rec.animalId,
      farm_id: farmId,
      mating_date: rec.matingDate,
      mating_type: rec.matingType,
      male_tag_id: rec.maleTag,
      male_breed: rec.maleBreed,
      technician: rec.technician,
      status: rec.status,
      expected_delivery_date: rec.expectedDeliveryDate,
      remark: rec.remark,
      created_by_user_id: userId,
      updated_by_user_id: userId,
      created_at: now,
      updated_at: now
    }));

    await prisma.$transaction(async (tx) => {
      await tx.matings.createMany({ data: createdData });

      // Update female animal conditions if PREGNANT
      for (const rec of validRecords) {
        if (rec.status === 'PREGNANT') {
          await tx.animals.update({
            where: { id: rec.animalId },
            data: {
              female_condition: 'PREGNANT',
              expected_delivery_date: rec.expectedDeliveryDate,
              mating_date: rec.matingDate
            }
          });
        }
      }
    });

    return res.json({
      success: true,
      message: `Successfully imported ${createdData.length} mating record(s)!`,
      importedCount: createdData.length,
      totalProcessed: totalRows
    });
  } catch (err) {
    console.error('IMPORT MATING ERROR:', err);
    res.status(500).json({ message: 'Failed to import mating records', error: err.message });
  }
};

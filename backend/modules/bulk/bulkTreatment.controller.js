const XLSX = require('xlsx');
const prisma = require('../../config/prisma');
const { v4: uuidv4 } = require('uuid');
const { normalizeKey, parseExcelDate, parseDecimal, getFarmId } = require('./bulkUtils');

// 1. GENERATE & DOWNLOAD TREATMENT EXCEL TEMPLATE
exports.downloadTreatmentTemplate = async (req, res) => {
  try {
    const farmId = await getFarmId(req);
    const animals = farmId ? await prisma.animals.findMany({
      where: { farm_id: farmId, status: 'LIVE' },
      select: { tag_number: true }
    }) : [];

    const headers = [
      'Tag Number *',
      'Treatment Date (YYYY-MM-DD) *',
      'Treatment Type / Disease',
      'Medicine Name',
      'Dosage',
      'Cost',
      'Remark'
    ];

    const sampleTag1 = animals[0]?.tag_number || 'GB-101';
    const sampleTag2 = animals[1]?.tag_number || 'GB-102';

    const sampleRows = [
      [sampleTag1, '2024-06-15', 'Fever & Cold', 'Paracetamol / Antibiotic', '2 ml', 150.00, 'Routine medical treatment'],
      [sampleTag2, '2024-06-18', 'Deworming', 'Albendazole', '5 ml', 50.00, 'Quarterly deworming dose']
    ];

    const wsData = [headers, ...sampleRows];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    ws['!cols'] = headers.map(() => ({ wch: 25 }));

    const refHeaders = ['Available Animals (Tag Numbers)'];
    const refRows = animals.map(a => [a.tag_number]);
    const refWs = XLSX.utils.aoa_to_sheet([refHeaders, ...refRows]);
    refWs['!cols'] = [{ wch: 30 }];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Treatment Template');
    XLSX.utils.book_append_sheet(wb, refWs, 'Available Animals');

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    if (req.query.format === 'base64') {
      return res.json({
        filename: 'goatbook_treatment_template.xlsx',
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        base64: buffer.toString('base64')
      });
    }

    res.setHeader('Content-Disposition', 'attachment; filename="goatbook_treatment_template.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    return res.send(buffer);
  } catch (err) {
    console.error('BULK TREATMENT TEMPLATE ERROR:', err);
    res.status(500).json({ message: 'Failed to generate treatment template', error: err.message });
  }
};

// 2. EXPORT TREATMENT RECORDS
exports.exportTreatments = async (req, res) => {
  try {
    const farmId = await getFarmId(req);
    if (!farmId) return res.status(400).json({ message: 'No farm selected' });

    const records = await prisma.treatment_records.findMany({
      where: { farm_id: farmId },
      include: {
        animals: { select: { tag_number: true } }
      },
      orderBy: { date: 'desc' }
    });

    const headers = [
      'Tag Number *',
      'Treatment Date (YYYY-MM-DD) *',
      'Treatment Type / Disease',
      'Medicine Name',
      'Dosage',
      'Cost',
      'Remark'
    ];

    const rows = records.map(r => [
      r.animals?.tag_number || '',
      r.date ? new Date(r.date).toISOString().split('T')[0] : '',
      r.treatment_type || r.disease_name || '',
      r.medicine_name || '',
      r.dosage || '',
      r.cost !== null && r.cost !== undefined ? parseFloat(r.cost) : '',
      r.remark || ''
    ]);

    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    ws['!cols'] = headers.map(() => ({ wch: 25 }));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Treatment Records');

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    const filename = `goatbook_treatments_${new Date().toISOString().split('T')[0]}.xlsx`;

    if (req.query.format === 'base64') {
      return res.json({
        filename,
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        base64: buffer.toString('base64'),
        totalExported: records.length
      });
    }

    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    return res.send(buffer);
  } catch (err) {
    console.error('EXPORT TREATMENTS ERROR:', err);
    res.status(500).json({ message: 'Failed to export treatment records', error: err.message });
  }
};

// 3. PARSE & VALIDATE TREATMENT SHEET
const parseAndValidateTreatmentSheet = async (buffer, farmId) => {
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

    const dateRaw = row.treatmentdate || row.date || '';
    const treatmentTypeRaw = row.treatmenttype || row.disease || row.diseasename || row.treatment || '';
    const medicineNameRaw = row.medicinename || row.medicine || '';
    const dosageRaw = row.dosage || row.dose || '';
    const costRaw = row.cost || row.amount || row.price || '';
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

    // Treatment Date Validation
    let date = null;
    if (!dateRaw) {
      rowErrors.push({ sn: snVal, row: rowNum, tagNumber: tagNumber || '-', column: 'Treatment Date *', error: 'Treatment Date is required.' });
    } else {
      date = parseExcelDate(dateRaw);
      if (!date) {
        rowErrors.push({ sn: snVal, row: rowNum, tagNumber: tagNumber || '-', column: 'Treatment Date *', error: `Invalid Treatment Date "${dateRaw}". Must be YYYY-MM-DD or DD/MM/YYYY.` });
      }
    }

    // Cost Validation
    let cost = null;
    if (costRaw !== '') {
      cost = parseDecimal(costRaw);
      if (cost === null || cost < 0) {
        rowErrors.push({ sn: snVal, row: rowNum, tagNumber: tagNumber || '-', column: 'Cost', error: `Invalid Cost "${costRaw}". Must be a non-negative number.` });
      }
    }

    if (rowErrors.length > 0) {
      errors.push(...rowErrors);
    } else if (matchedAnimal) {
      validRecords.push({
        sn: snVal,
        rowNum,
        animalId: matchedAnimal.id,
        tagNumber: matchedAnimal.tag_number,
        date,
        treatmentType: String(treatmentTypeRaw).trim() || 'General Treatment',
        diseaseName: String(treatmentTypeRaw).trim() || null,
        medicineName: String(medicineNameRaw).trim() || null,
        dosage: String(dosageRaw).trim() || null,
        cost,
        remark
      });
    }
  }

  return { totalRows: rawRows.length, validRecords, errors };
};

// 4. VALIDATE TREATMENT IMPORT
exports.validateTreatmentsImport = async (req, res) => {
  try {
    const farmId = await getFarmId(req);
    if (!farmId) return res.status(400).json({ message: 'No farm selected' });

    let buffer = req.file ? req.file.buffer : (req.body.fileBase64 ? Buffer.from(req.body.fileBase64, 'base64') : null);
    if (!buffer) return res.status(400).json({ message: 'No Excel file provided' });

    const { totalRows, validRecords, errors } = await parseAndValidateTreatmentSheet(buffer, farmId);
    return res.json({
      success: errors.length === 0,
      totalRows,
      validCount: validRecords.length,
      errorCount: errors.length,
      errors,
      preview: validRecords.slice(0, 10)
    });
  } catch (err) {
    console.error('VALIDATE TREATMENT ERROR:', err);
    res.status(500).json({ message: 'Failed to validate treatment spreadsheet', error: err.message });
  }
};

// 5. IMPORT TREATMENTS
exports.importTreatments = async (req, res) => {
  try {
    const farmId = await getFarmId(req);
    if (!farmId) return res.status(400).json({ message: 'No farm selected' });

    let buffer = req.file ? req.file.buffer : (req.body.fileBase64 ? Buffer.from(req.body.fileBase64, 'base64') : null);
    if (!buffer) return res.status(400).json({ message: 'No Excel file provided' });

    const { totalRows, validRecords, errors } = await parseAndValidateTreatmentSheet(buffer, farmId);
    if (errors.length > 0) {
      return res.status(422).json({
        success: false,
        message: `Validation failed for ${errors.length} issue(s). Please fix and retry.`,
        totalRows, validCount: validRecords.length, errorCount: errors.length, errors
      });
    }

    if (validRecords.length === 0) {
      return res.status(400).json({ success: false, message: 'No valid treatment records found.' });
    }

    const userId = req.user?.id || null;
    const now = new Date();

    const createdData = validRecords.map(rec => ({
      id: uuidv4(),
      animal_id: rec.animalId,
      farm_id: farmId,
      date: rec.date,
      treatment_type: rec.treatmentType,
      disease_name: rec.diseaseName,
      medicine_name: rec.medicineName,
      dosage: rec.dosage,
      cost: rec.cost,
      remark: rec.remark,
      created_by_user_id: userId,
      updated_by_user_id: userId,
      created_at: now,
      updated_at: now
    }));

    await prisma.treatment_records.createMany({ data: createdData });

    return res.json({
      success: true,
      message: `Successfully imported ${createdData.length} treatment record(s)!`,
      importedCount: createdData.length,
      totalProcessed: totalRows
    });
  } catch (err) {
    console.error('IMPORT TREATMENT ERROR:', err);
    res.status(500).json({ message: 'Failed to import treatment records', error: err.message });
  }
};

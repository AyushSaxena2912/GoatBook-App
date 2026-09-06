const XLSX = require('xlsx');
const prisma = require('../../config/prisma');
const { v4: uuidv4 } = require('uuid');
const { normalizeKey, parseExcelDate, getFarmId } = require('./bulkUtils');

// 1. GENERATE & DOWNLOAD VACCINATION EXCEL TEMPLATE
exports.downloadVaccinationTemplate = async (req, res) => {
  try {
    const farmId = await getFarmId(req);

    const vaccines = await prisma.vaccines.findMany({
      where: farmId ? { OR: [{ farm_id: farmId }, { is_default: true }] } : { is_default: true },
      select: { name: true, disease_name: true }
    });

    const animals = farmId ? await prisma.animals.findMany({
      where: { farm_id: farmId, status: 'LIVE' },
      select: { tag_number: true }
    }) : [];

    const headers = [
      'Tag Number *',
      'Vaccine Name *',
      'Vaccination Date (YYYY-MM-DD) *',
      'Next Due Date (YYYY-MM-DD)',
      'Valid Till (YYYY-MM-DD)',
      'Remark'
    ];

    const sampleTag = animals[0]?.tag_number || 'GB-101';
    const sampleVaccine1 = vaccines[0]?.name || 'PPR Vaccine';
    const sampleVaccine2 = vaccines[1]?.name || 'FMD Vaccine';

    const sampleRows = [
      [sampleTag, sampleVaccine1, '2024-01-15', '2025-01-15', '2025-01-15', 'Annual PPR vaccination'],
      ['GB-102', sampleVaccine2, '2024-02-10', '2024-08-10', '2024-08-10', 'FMD booster shot']
    ];

    const wsData = [headers, ...sampleRows];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    ws['!cols'] = headers.map(() => ({ wch: 25 }));

    const refHeaders = ['Available Vaccines in Farm', 'Disease Name'];
    const refRows = vaccines.map(v => [v.name, v.disease_name || '']);
    const refWs = XLSX.utils.aoa_to_sheet([refHeaders, ...refRows]);
    refWs['!cols'] = [{ wch: 30 }, { wch: 25 }];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Vaccination Template');
    XLSX.utils.book_append_sheet(wb, refWs, 'Available Vaccines');

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    if (req.query.format === 'base64') {
      return res.json({
        filename: 'goatbook_vaccination_template.xlsx',
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        base64: buffer.toString('base64')
      });
    }

    res.setHeader('Content-Disposition', 'attachment; filename="goatbook_vaccination_template.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    return res.send(buffer);
  } catch (err) {
    console.error('BULK VACCINATION TEMPLATE ERROR:', err);
    res.status(500).json({ message: 'Failed to generate vaccination template', error: err.message });
  }
};

// 2. EXPORT VACCINATION RECORDS
exports.exportVaccinations = async (req, res) => {
  try {
    const farmId = await getFarmId(req);
    if (!farmId) return res.status(400).json({ message: 'No farm selected' });

    const records = await prisma.vaccination_records.findMany({
      where: { farm_id: farmId },
      include: {
        animals: { select: { tag_number: true } },
        vaccines: { select: { name: true } }
      },
      orderBy: { date: 'desc' }
    });

    const headers = [
      'Tag Number *',
      'Vaccine Name *',
      'Vaccination Date (YYYY-MM-DD) *',
      'Next Due Date (YYYY-MM-DD)',
      'Valid Till (YYYY-MM-DD)',
      'Remark'
    ];

    const rows = records.map(r => [
      r.animals?.tag_number || '',
      r.vaccines?.name || '',
      r.date ? new Date(r.date).toISOString().split('T')[0] : '',
      r.next_due_date ? new Date(r.next_due_date).toISOString().split('T')[0] : '',
      r.valid_till ? new Date(r.valid_till).toISOString().split('T')[0] : '',
      r.remark || ''
    ]);

    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    ws['!cols'] = headers.map(() => ({ wch: 24 }));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Vaccination Records');

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    const filename = `goatbook_vaccinations_${new Date().toISOString().split('T')[0]}.xlsx`;

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
    console.error('EXPORT VACCINATIONS ERROR:', err);
    res.status(500).json({ message: 'Failed to export vaccination records', error: err.message });
  }
};

// 3. PARSE & VALIDATE VACCINATION SHEET
const parseAndValidateVaccinationSheet = async (buffer, farmId) => {
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

  const vaccines = await prisma.vaccines.findMany({
    where: { OR: [{ farm_id: farmId }, { is_default: true }] },
    select: { id: true, name: true }
  });
  const vaccineMap = new Map();
  vaccines.forEach(v => vaccineMap.set(v.name.toLowerCase().trim(), v));
  const validVaccinesList = Array.from(new Set(vaccines.map(v => v.name))).join(', ');

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

    let vaccineNameRaw = row.vaccinename || row.vaccine || '';
    if (!vaccineNameRaw) {
      for (const [k, v] of Object.entries(raw)) {
        const kClean = normalizeKey(k);
        if (kClean.includes('vaccine') && String(v).trim()) {
          vaccineNameRaw = v;
          break;
        }
      }
    }
    const vaccineName = String(vaccineNameRaw).trim();

    const dateRaw = row.vaccinationdate || row.date || '';
    const nextDueDateRaw = row.nextduedate || row.duedate || '';
    const validTillRaw = row.validtill || row.validdate || '';
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

    // Vaccine Name Validation
    let matchedVaccine = null;
    if (!vaccineName) {
      rowErrors.push({ sn: snVal, row: rowNum, tagNumber: tagNumber || '-', column: 'Vaccine Name *', error: 'Vaccine Name is required.' });
    } else {
      matchedVaccine = vaccineMap.get(vaccineName.toLowerCase());
      if (!matchedVaccine) {
        rowErrors.push({
          sn: snVal, row: rowNum, tagNumber: tagNumber || '-', column: 'Vaccine Name *',
          error: `Vaccine "${vaccineName}" does not exist in your farm vaccines. Available options: [${validVaccinesList}].`
        });
      }
    }

    // Vaccination Date Validation
    let date = null;
    if (!dateRaw) {
      rowErrors.push({ sn: snVal, row: rowNum, tagNumber: tagNumber || '-', column: 'Vaccination Date *', error: 'Vaccination Date is required.' });
    } else {
      date = parseExcelDate(dateRaw);
      if (!date) {
        rowErrors.push({ sn: snVal, row: rowNum, tagNumber: tagNumber || '-', column: 'Vaccination Date *', error: `Invalid Vaccination Date "${dateRaw}". Must be YYYY-MM-DD or DD/MM/YYYY.` });
      }
    }

    const nextDueDate = nextDueDateRaw !== '' ? parseExcelDate(nextDueDateRaw) : null;
    const validTill = validTillRaw !== '' ? parseExcelDate(validTillRaw) : null;

    if (rowErrors.length > 0) {
      errors.push(...rowErrors);
    } else if (matchedAnimal && matchedVaccine) {
      validRecords.push({
        sn: snVal,
        rowNum,
        animalId: matchedAnimal.id,
        vaccineId: matchedVaccine.id,
        tagNumber: matchedAnimal.tag_number,
        vaccineName: matchedVaccine.name,
        date,
        nextDueDate,
        validTill,
        remark
      });
    }
  }

  return { totalRows: rawRows.length, validRecords, errors };
};

// 4. VALIDATE VACCINATION IMPORT
exports.validateVaccinationsImport = async (req, res) => {
  try {
    const farmId = await getFarmId(req);
    if (!farmId) return res.status(400).json({ message: 'No farm selected' });

    let buffer = req.file ? req.file.buffer : (req.body.fileBase64 ? Buffer.from(req.body.fileBase64, 'base64') : null);
    if (!buffer) return res.status(400).json({ message: 'No Excel file provided' });

    const { totalRows, validRecords, errors } = await parseAndValidateVaccinationSheet(buffer, farmId);
    return res.json({
      success: errors.length === 0,
      totalRows,
      validCount: validRecords.length,
      errorCount: errors.length,
      errors,
      preview: validRecords.slice(0, 10)
    });
  } catch (err) {
    console.error('VALIDATE VACCINATION ERROR:', err);
    res.status(500).json({ message: 'Failed to validate vaccination spreadsheet', error: err.message });
  }
};

// 5. IMPORT VACCINATIONS
exports.importVaccinations = async (req, res) => {
  try {
    const farmId = await getFarmId(req);
    if (!farmId) return res.status(400).json({ message: 'No farm selected' });

    let buffer = req.file ? req.file.buffer : (req.body.fileBase64 ? Buffer.from(req.body.fileBase64, 'base64') : null);
    if (!buffer) return res.status(400).json({ message: 'No Excel file provided' });

    const { totalRows, validRecords, errors } = await parseAndValidateVaccinationSheet(buffer, farmId);
    if (errors.length > 0) {
      return res.status(422).json({
        success: false,
        message: `Validation failed for ${errors.length} issue(s). Please fix and retry.`,
        totalRows, validCount: validRecords.length, errorCount: errors.length, errors
      });
    }

    if (validRecords.length === 0) {
      return res.status(400).json({ success: false, message: 'No valid vaccination records found.' });
    }

    const userId = req.user?.id || null;
    const now = new Date();

    const createdData = validRecords.map(rec => ({
      id: uuidv4(),
      animal_id: rec.animalId,
      vaccine_id: rec.vaccineId,
      farm_id: farmId,
      date: rec.date,
      next_due_date: rec.nextDueDate,
      valid_till: rec.validTill,
      remark: rec.remark,
      creation_mode: 'SINGLE',
      created_by_user_id: userId,
      updated_by_user_id: userId,
      created_at: now,
      updated_at: now
    }));

    await prisma.vaccination_records.createMany({ data: createdData });

    return res.json({
      success: true,
      message: `Successfully imported ${createdData.length} vaccination record(s)!`,
      importedCount: createdData.length,
      totalProcessed: totalRows
    });
  } catch (err) {
    console.error('IMPORT VACCINATION ERROR:', err);
    res.status(500).json({ message: 'Failed to import vaccination records', error: err.message });
  }
};

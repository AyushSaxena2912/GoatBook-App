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
      'Kid 1 Tag Number',
      'Kid 1 Gender (MALE/FEMALE)',
      'Kid 1 Birth Weight (kg)',
      'Kid 1 Notes',
      'Kid 2 Tag Number',
      'Kid 2 Gender (MALE/FEMALE)',
      'Kid 2 Birth Weight (kg)',
      'Kid 2 Notes',
      'Kid 3 Tag Number',
      'Kid 3 Gender (MALE/FEMALE)',
      'Kid 3 Birth Weight (kg)',
      'Kid 3 Notes',
      'Kid 4 Tag Number',
      'Kid 4 Gender (MALE/FEMALE)',
      'Kid 4 Birth Weight (kg)',
      'Kid 4 Notes',
      'Remark'
    ];

    const sampleTag = animals[0]?.tag_number || 'GB-101';
    const sampleRows = [
      [sampleTag, '2024-05-10', 'TWIN', 1, 1, 'GB-K101', 'MALE', 3.2, 'Healthy male kid', 'GB-K102', 'FEMALE', 2.9, 'Active doe kid', '', '', '', '', '', '', '', '', 'Healthy twin delivery'],
      ['GB-102', '2024-05-15', 'SINGLE', 0, 1, 'GB-K103', 'FEMALE', 3.0, 'Single doe kid', '', '', '', '', '', '', '', '', '', '', '', '', 'Single delivery']
    ];

    const wsData = [headers, ...sampleRows];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    ws['!cols'] = [
      { wch: 18 }, { wch: 28 }, { wch: 45 },
      { wch: 18 }, { wch: 18 },
      { wch: 18 }, { wch: 24 }, { wch: 22 }, { wch: 22 },
      { wch: 18 }, { wch: 24 }, { wch: 22 }, { wch: 22 },
      { wch: 18 }, { wch: 24 }, { wch: 22 }, { wch: 22 },
      { wch: 18 }, { wch: 24 }, { wch: 22 }, { wch: 22 },
      { wch: 30 }
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
      'Kid 1 Tag Number',
      'Kid 1 Gender (MALE/FEMALE)',
      'Kid 1 Birth Weight (kg)',
      'Kid 1 Notes',
      'Kid 2 Tag Number',
      'Kid 2 Gender (MALE/FEMALE)',
      'Kid 2 Birth Weight (kg)',
      'Kid 2 Notes',
      'Kid 3 Tag Number',
      'Kid 3 Gender (MALE/FEMALE)',
      'Kid 3 Birth Weight (kg)',
      'Kid 3 Notes',
      'Kid 4 Tag Number',
      'Kid 4 Gender (MALE/FEMALE)',
      'Kid 4 Birth Weight (kg)',
      'Kid 4 Notes',
      'Remark'
    ];

    const rows = breedings.map(b => {
      const kids = Array.isArray(b.kids_details) ? b.kids_details : [];
      const k1 = kids[0] || {};
      const k2 = kids[1] || {};
      const k3 = kids[2] || {};
      const k4 = kids[3] || {};

      return [
        b.animals?.tag_number || '',
        b.delivery_date ? new Date(b.delivery_date).toISOString().split('T')[0] : '',
        b.birth_type || 'SINGLE',
        b.num_male || 0,
        b.num_female || 0,
        k1.tag_number || '',
        k1.gender || '',
        k1.birth_weight !== undefined && k1.birth_weight !== '' ? parseFloat(k1.birth_weight) : '',
        k1.remark || '',
        k2.tag_number || '',
        k2.gender || '',
        k2.birth_weight !== undefined && k2.birth_weight !== '' ? parseFloat(k2.birth_weight) : '',
        k2.remark || '',
        k3.tag_number || '',
        k3.gender || '',
        k3.birth_weight !== undefined && k3.birth_weight !== '' ? parseFloat(k3.birth_weight) : '',
        k3.remark || '',
        k4.tag_number || '',
        k4.gender || '',
        k4.birth_weight !== undefined && k4.birth_weight !== '' ? parseFloat(k4.birth_weight) : '',
        k4.remark || '',
        b.remark || ''
      ];
    });

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

// 3. PARSE & VALIDATE BREEDING SHEET (WITH KID NOTES & CONFLICT CHECK)
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

  // Fetch all existing animals in farm for tag conflict verification
  const existingAnimals = await prisma.animals.findMany({
    where: { farm_id: farmId },
    select: { id: true, tag_number: true, gender: true }
  });
  const animalMap = new Map();
  const existingTagsSet = new Set();
  existingAnimals.forEach(a => {
    animalMap.set(a.tag_number.trim(), a);
    existingTagsSet.add(a.tag_number.trim());
  });

  const validBirthTypes = ['SINGLE', 'TWIN', 'TRIPLET', 'QUADRUPLET', 'OTHERS'];
  const errors = [];
  const validRecords = [];
  const sheetTagsSet = new Map(); // Track all mother and kid tags across spreadsheet for duplicate checks
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
        if (kClean.includes('tag') && !kClean.includes('kid') && !kClean.includes('child') && String(v).trim()) {
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

    // Tag Number Validation (Mother Doe)
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

      if (sheetTagsSet.has(tagNumber)) {
        const prevLoc = sheetTagsSet.get(tagNumber);
        rowErrors.push({
          sn: snVal, row: rowNum, tagNumber, column: 'Tag Number *',
          error: `Duplicate Tag Number "${tagNumber}" found in this spreadsheet (already used at row ${prevLoc.rowNum} as ${prevLoc.type}).`
        });
      } else {
        sheetTagsSet.set(tagNumber, { sn: snVal, rowNum, type: 'Mother Tag' });
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

    // Child / Kid Details Validation & Tag Conflict Verification (including Kid Notes)
    const rowKids = [];
    const rowKidTagsSet = new Set();

    for (let k = 1; k <= 4; k++) {
      let kTagRaw = row[`kid${k}tagnumber`] || row[`kid${k}tag`] || row[`kid${k}tagno`] || row[`child${k}tag`] || row[`kid${k}`] || '';
      if (!kTagRaw) {
        for (const [key, val] of Object.entries(raw)) {
          const kClean = normalizeKey(key);
          if ((kClean.includes(`kid${k}`) || kClean.includes(`child${k}`)) && (kClean.includes('tag') || kClean.includes('id') || kClean.includes('no')) && String(val).trim()) {
            kTagRaw = val;
            break;
          }
        }
      }
      const kTag = String(kTagRaw).trim();

      let kGenderRaw = row[`kid${k}gender`] || row[`kid${k}sex`] || row[`child${k}gender`] || '';
      const kGender = String(kGenderRaw).trim().toUpperCase();

      let kWeightRaw = row[`kid${k}birthweight`] || row[`kid${k}weight`] || row[`kid${k}weightkg`] || row[`child${k}weight`] || '';
      const kWeight = kWeightRaw !== '' ? parseDecimal(kWeightRaw) : null;

      let kRemarkRaw = row[`kid${k}notes`] || row[`kid${k}remark`] || row[`kid${k}note`] || row[`child${k}notes`] || row[`child${k}remark`] || '';
      if (!kRemarkRaw) {
        for (const [key, val] of Object.entries(raw)) {
          const kClean = normalizeKey(key);
          if ((kClean.includes(`kid${k}`) || kClean.includes(`child${k}`)) && (kClean.includes('note') || kClean.includes('remark') || kClean.includes('comment')) && String(val).trim()) {
            kRemarkRaw = val;
            break;
          }
        }
      }
      const kRemark = String(kRemarkRaw).trim() || '';

      if (kTag || kGender || kWeight !== null || kRemark !== '') {
        if (!kTag) {
          rowErrors.push({
            sn: snVal, row: rowNum, tagNumber: tagNumber || '-', column: `Kid ${k} Tag Number`,
            error: `Kid ${k} Tag Number is required when kid details are provided.`
          });
        } else {
          // Check conflict with existing farm animals
          if (existingTagsSet.has(kTag)) {
            rowErrors.push({
              sn: snVal, row: rowNum, tagNumber: kTag, column: `Kid ${k} Tag Number`,
              error: `Child Tag Number "${kTag}" conflicts with an existing animal in your farm inventory.`
            });
          }

          // Check conflict with mother tag in same row
          if (tagNumber && kTag === tagNumber) {
            rowErrors.push({
              sn: snVal, row: rowNum, tagNumber: kTag, column: `Kid ${k} Tag Number`,
              error: `Child Tag Number "${kTag}" cannot be the same as Mother Tag Number "${tagNumber}".`
            });
          }

          // Check duplicate within same row
          if (rowKidTagsSet.has(kTag)) {
            rowErrors.push({
              sn: snVal, row: rowNum, tagNumber: kTag, column: `Kid ${k} Tag Number`,
              error: `Child Tag Number "${kTag}" is duplicated in row ${rowNum}.`
            });
          } else {
            rowKidTagsSet.add(kTag);
          }

          // Check duplicate across entire spreadsheet
          if (sheetTagsSet.has(kTag)) {
            const prevLoc = sheetTagsSet.get(kTag);
            rowErrors.push({
              sn: snVal, row: rowNum, tagNumber: kTag, column: `Kid ${k} Tag Number`,
              error: `Duplicate Child Tag Number "${kTag}" found in spreadsheet (already used at row ${prevLoc.rowNum} as ${prevLoc.type}).`
            });
          } else {
            sheetTagsSet.set(kTag, { sn: snVal, rowNum, type: `Kid ${k} Tag` });
          }
        }

        // Gender validation
        let validGender = 'MALE';
        if (kGender) {
          if (kGender !== 'MALE' && kGender !== 'FEMALE') {
            rowErrors.push({
              sn: snVal, row: rowNum, tagNumber: kTag || '-', column: `Kid ${k} Gender`,
              error: `Invalid Gender "${kGenderRaw}" for Kid ${k}. Allowed values: [MALE, FEMALE].`
            });
          } else {
            validGender = kGender;
          }
        }

        // Weight validation
        if (kWeightRaw !== '' && (kWeight === null || kWeight < 0)) {
          rowErrors.push({
            sn: snVal, row: rowNum, tagNumber: kTag || '-', column: `Kid ${k} Birth Weight`,
            error: `Invalid Birth Weight "${kWeightRaw}" for Kid ${k}. Must be a valid positive number.`
          });
        }

        if (kTag) {
          rowKids.push({
            tag_number: kTag,
            gender: validGender,
            birth_weight: kWeight !== null ? kWeight : '',
            remark: kRemark
          });
        }
      }
    }

    // Male / Female Counts Calculation
    let numMale = parseDecimal(numMaleRaw) !== null ? Math.max(0, parseInt(numMaleRaw, 10)) : null;
    let numFemale = parseDecimal(numFemaleRaw) !== null ? Math.max(0, parseInt(numFemaleRaw, 10)) : null;

    if (numMale === null || numFemale === null) {
      let mCount = 0;
      let fCount = 0;
      rowKids.forEach(k => {
        if (k.gender === 'MALE') mCount++;
        if (k.gender === 'FEMALE') fCount++;
      });
      if (numMale === null) numMale = mCount;
      if (numFemale === null) numFemale = fCount;
    }

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
        kidsDetails: rowKids.length > 0 ? rowKids : null,
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
      kids_details: rec.kidsDetails ? rec.kidsDetails : null,
      remark: rec.remark,
      created_by_user_id: userId,
      updated_by_user_id: userId,
      created_at: now,
      updated_at: now
    }));

    await prisma.$transaction(async (tx) => {
      await tx.breedings.createMany({ data: createdData });

      // Reset female condition on mother animal if applicable
      for (const rec of validRecords) {
        await tx.animals.update({
          where: { id: rec.animalId },
          data: { female_condition: 'NONE' }
        });
      }
    });

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

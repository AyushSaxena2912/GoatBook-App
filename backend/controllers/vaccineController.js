const prisma = require('../config/prisma');
const { v4: uuidv4 } = require('uuid');

// --- Vaccine Definitions (Master Data) ---

// @desc    Get all available vaccine types for the farm (includes system defaults)
// @route   GET /api/vaccines
exports.getVaccines = async (req, res) => {
  try {
    if (!req.farmId) return res.status(400).json({ message: 'No farm selected' });
    
    // Fetch vaccines that:
    // 1. Are marked as global defaults (available to everyone)
    // 2. Are custom-created for this specific farm
    const vaccines = await prisma.vaccines.findMany({
      where: {
        OR: [
          { farm_id: req.farmId },
          { is_default: true }
        ]
      },
      include: { users_vaccines_created_by_user_idTousers: { select: { name: true } } },
      orderBy: { name: 'asc' }
    });

    res.json(vaccines.map(v => ({
      id: v.id, 
      name: v.name, 
      diseaseName: v.disease_name,
      doseMl: v.dose_ml,
      applicationRoute: v.application_route,
      immunityDurationDays: v.immunity_duration_days,
      nextDueDurationDays: v.next_due_duration_days,
      daysBetween: v.days_between, 
      remark: v.remark,
      farmId: v.farm_id, 
      isDefault: v.is_default,
      createdAt: v.created_at,
      creator: v.users_vaccines_created_by_user_idTousers
    })));
  } catch (err) {
    console.error('GET VACCINES ERROR:', err);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Create a custom vaccine definition for the farm
// @route   POST /api/vaccines
exports.createVaccine = async (req, res) => {
  const { name, daysBetween, remark } = req.body;
  try {
    if (!req.farmId) return res.status(400).json({ message: 'No farm selected' });
    if (!name) return res.status(400).json({ message: 'Vaccine name is required' });
    
    const now = new Date();
    const vaccine = await prisma.vaccines.create({
      data: { 
        id: uuidv4(), 
        name, 
        days_between: daysBetween || 0, // Interval for the next dose
        remark, 
        farm_id: req.farmId, 
        created_by_user_id: req.user.id, 
        created_at: now, 
        updated_at: now 
      }
    });

    res.status(201).json({ id: vaccine.id, name: vaccine.name });
  } catch (err) {
    console.error('CREATE VACCINE ERROR:', err);
    res.status(500).json({ message: 'Server Error' });
  }
};

// --- Vaccination Records (Operations) ---

// @desc    Fetch historical vaccination journals
// @route   GET /api/vaccination-records
exports.getVaccinationRecords = async (req, res) => {
  const { animalId, creationMode } = req.query;
  try {
    if (!req.farmId) return res.status(400).json({ message: 'No farm selected' });
    
    const where = { farm_id: req.farmId };
    if (animalId) where.animal_id = animalId;
    if (creationMode) where.creation_mode = creationMode; // Filter by SINGLE or MASS entry

    const records = await prisma.vaccination_records.findMany({
      where,
      include: {
        vaccines: { select: { name: true, days_between: true } },
        animals: { select: { tag_number: true } },
        users_vaccination_records_created_by_user_idTousers: { select: { name: true } }
      },
      orderBy: { date: 'desc' }
    });

    res.json(records.map(r => ({
      id: r.id, vaccineId: r.vaccine_id, animalId: r.animal_id,
      date: r.date, validTill: r.valid_till, nextDueDate: r.next_due_date,
      remark: r.remark, farmId: r.farm_id, creationMode: r.creation_mode,
      createdAt: r.created_at,
      vaccine: r.vaccines ? { name: r.vaccines.name, daysBetween: r.vaccines.days_between } : null,
      animal: r.animals ? { tagNumber: r.animals.tag_number } : null,
      creator: r.users_vaccination_records_created_by_user_idTousers
    })));
  } catch (err) {
    console.error('GET RECORDS ERROR:', err);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Record a vaccination event (supports single animal or multiple animals at once)
// @route   POST /api/vaccination-records
exports.createVaccinationRecord = async (req, res) => {
  const { vaccineId, animalIds, date, validTill, remark, creationMode } = req.body;
  try {
    if (!req.farmId) return res.status(400).json({ message: 'No farm selected' });
    if (!vaccineId || !animalIds || !Array.isArray(animalIds) || animalIds.length === 0 || !date) {
      return res.status(400).json({ message: 'Missing required fields (vaccineId, animalIds, date)' });
    }

    const vaccine = await prisma.vaccines.findUnique({ where: { id: vaccineId } });
    if (!vaccine) return res.status(404).json({ message: 'Vaccine not found' });

    // Logical Check: Auto-calculate next due date if the vaccine has a defined interval
    let nextDueDate = null;
    if (vaccine.days_between > 0) {
      const baseDate = new Date(date);
      baseDate.setDate(baseDate.getDate() + vaccine.days_between);
      nextDueDate = baseDate;
    }

    const now = new Date();
    // Prepare bulk insert data for all selected animals
    const recordsData = animalIds.map(aId => ({
      id: uuidv4(), 
      vaccine_id: vaccineId, 
      animal_id: aId, 
      date: new Date(date),
      valid_till: validTill ? new Date(validTill) : null, 
      next_due_date: nextDueDate,
      remark, 
      creation_mode: creationMode || (animalIds.length > 1 ? 'MASS' : 'SINGLE'),
      farm_id: req.farmId, 
      created_by_user_id: req.user.id, 
      created_at: now, 
      updated_at: now
    }));

    const count = await prisma.vaccination_records.createMany({ data: recordsData });
    res.status(201).json({ message: `Successfully recorded ${count.count} vaccination(s)` });
  } catch (err) {
    console.error('CREATE RECORD ERROR:', err);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Update an existing vaccination record
// @route   PUT /api/vaccination-records/:id
exports.updateVaccinationRecord = async (req, res) => {
  const { date, validTill, remark } = req.body;
  try {
    const record = await prisma.vaccination_records.findUnique({
      where: { id: req.params.id },
      include: { vaccines: true }
    });

    if (!record) return res.status(404).json({ message: 'Record not found' });
    if (record.farm_id !== req.farmId) return res.status(403).json({ message: 'Not authorized' });

    const updateData = { updated_by_user_id: req.user.id, updated_at: new Date() };
    if (date) updateData.date = new Date(date);
    if (validTill !== undefined) updateData.valid_till = validTill ? new Date(validTill) : null;
    if (remark !== undefined) updateData.remark = remark;

    // Recalculate next due date if the administration date changed
    if (date && record.vaccines?.days_between > 0) {
      const baseDate = new Date(date);
      baseDate.setDate(baseDate.getDate() + record.vaccines.days_between);
      updateData.next_due_date = baseDate;
    }

    const updated = await prisma.vaccination_records.update({ where: { id: req.params.id }, data: updateData });
    res.json(updated);
  } catch (err) {
    console.error('UPDATE RECORD ERROR:', err);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Delete a vaccination record
// @route   DELETE /api/vaccination-records/:id
exports.deleteVaccinationRecord = async (req, res) => {
  try {
    const record = await prisma.vaccination_records.findUnique({ where: { id: req.params.id } });
    if (!record) return res.status(404).json({ message: 'Record not found' });
    if (record.farm_id !== req.farmId) return res.status(403).json({ message: 'Not authorized' });
    
    await prisma.vaccination_records.delete({ where: { id: req.params.id } });
    res.json({ message: 'Record removed successfully' });
  } catch (err) {
    console.error('DELETE RECORD ERROR:', err);
    res.status(500).json({ message: 'Server Error' });
  }
};

// --- Vaccination Schedules (Reference Data) ---

// @desc    Get system-wide vaccination protocols/schedules (e.g., when to vaccinate newborns)
// @route   GET /api/vaccination-schedules
exports.getVaccinationSchedules = async (req, res) => {
  try {
    const schedules = await prisma.vaccination_schedules.findMany({
      where: {
        OR: [
          { is_default: true },
          // Custom farm-specific schedules can be added here in future updates
        ]
      },
      include: {
        vaccines: {
          select: { name: true }
        }
      }
    });

    res.json(schedules.map(s => ({
      id: s.id,
      vaccineId: s.vaccine_id,
      vaccineName: s.vaccines?.name,
      startDay: s.start_day,      // Age in days to start vaccination
      repetitionDays: s.repetition_days, // Days after which to repeat
      durationDays: s.duration_days,     // Time the vaccine remains valid
      isDefault: s.is_default
    })));
  } catch (err) {
    console.error('GET SCHEDULES ERROR:', err);
    res.status(500).json({ message: 'Server Error' });
  }
};

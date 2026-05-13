const { v4: uuidv4 } = require('uuid');
const prisma = require('../config/prisma');
const { scheduleVaccinationReminders } = require('../utils/notificationHelper');

// --- Vaccine Definitions (Master Data) ---

// @desc    Get all available vaccine types for the farm (includes system defaults)
// @route   GET /api/vaccines
exports.getVaccines = async (req, res) => {
  try {
    if (!req.farmId) return res.status(400).json({ message: 'No farm selected' });
    
    // Fetch vaccines that belong explicitly to this farm
    const vaccines = await prisma.vaccines.findMany({
      where: {
        farm_id: req.farmId
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
  const { 
    name, diseaseName, doseMl, applicationRoute, 
    immunityDurationDays, nextDueDurationDays, daysBetween, remark 
  } = req.body;
  
  try {
    if (!req.farmId) return res.status(400).json({ message: 'No farm selected' });
    if (!name) return res.status(400).json({ message: 'Vaccine name is required' });
    
    const now = new Date();
    const vaccine = await prisma.vaccines.create({
      data: { 
        id: uuidv4(), 
        name, 
        disease_name: diseaseName || null,
        dose_ml: doseMl || null,
        application_route: applicationRoute || null,
        immunity_duration_days: immunityDurationDays ? parseInt(immunityDurationDays) : null,
        next_due_duration_days: nextDueDurationDays ? parseInt(nextDueDurationDays) : null,
        days_between: daysBetween ? parseInt(daysBetween) : 0, 
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
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};

// @desc    Update a vaccine definition
// @route   PUT /api/vaccines/:id
exports.updateVaccine = async (req, res) => {
  const { 
    name, diseaseName, doseMl, applicationRoute, 
    immunityDurationDays, nextDueDurationDays, daysBetween, remark 
  } = req.body;

  try {
    const vaccine = await prisma.vaccines.findUnique({ where: { id: req.params.id } });
    if (!vaccine) return res.status(404).json({ message: 'Vaccine not found' });
    if (vaccine.farm_id !== req.farmId) return res.status(403).json({ message: 'Not authorized' });

    const updated = await prisma.vaccines.update({
      where: { id: req.params.id },
      data: {
        name: name || vaccine.name,
        disease_name: diseaseName !== undefined ? diseaseName : vaccine.disease_name,
        dose_ml: doseMl !== undefined ? parseFloat(doseMl) : vaccine.dose_ml,
        application_route: applicationRoute !== undefined ? applicationRoute : vaccine.application_route,
        immunity_duration_days: immunityDurationDays !== undefined ? parseInt(immunityDurationDays) : vaccine.immunity_duration_days,
        next_due_duration_days: nextDueDurationDays !== undefined ? parseInt(nextDueDurationDays) : vaccine.next_due_duration_days,
        days_between: daysBetween !== undefined ? parseInt(daysBetween) : vaccine.days_between,
        remark: remark !== undefined ? remark : vaccine.remark,
        updated_at: new Date()
      }
    });

    res.json(updated);
  } catch (err) {
    console.error('UPDATE VACCINE ERROR:', err);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Delete a vaccine definition
// @route   DELETE /api/vaccines/:id
exports.deleteVaccine = async (req, res) => {
  try {
    const vaccine = await prisma.vaccines.findUnique({ where: { id: req.params.id } });
    
    if (!vaccine) {
      console.log(`[DELETE] Vaccine not found: ${req.params.id}`);
      return res.status(404).json({ message: 'Vaccine not found' });
    }
    
    if (vaccine.farm_id !== req.farmId) {
      console.log(`[DELETE] Unauthorized access attempt for vaccine: ${req.params.id} by farm: ${req.farmId}`);
      return res.status(403).json({ message: 'Not authorized' });
    }

    // GUARD: Block deletion of system default vaccines
    if (vaccine.is_default) {
      return res.status(400).json({ 
        message: 'System default vaccines are mandatory and cannot be deleted.' 
      });
    }

    // Delete associated vaccination records first, then the vaccine itself
    const deletedRecords = await prisma.vaccination_records.deleteMany({ where: { vaccine_id: req.params.id } });
    console.log(`[DELETE] Removed ${deletedRecords.count} vaccination records for vaccine: ${vaccine.name}`);

    // Delete any associated vaccination schedules
    const deletedSchedules = await prisma.vaccination_schedules.deleteMany({ where: { vaccine_id: req.params.id } });
    console.log(`[DELETE] Removed ${deletedSchedules.count} schedules for vaccine: ${vaccine.name}`);

    await prisma.vaccines.delete({ where: { id: req.params.id } });
    res.json({ message: `Vaccine "${vaccine.name}" removed along with ${deletedRecords.count} related record(s).` });
  } catch (err) {
    console.error('DELETE VACCINE ERROR:', err);
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};

// @desc    Get upcoming boosters (due in next 30 days)
// @route   GET /api/vaccines/upcoming
exports.getUpcomingBoosters = async (req, res) => {
  try {
    if (!req.farmId) return res.status(400).json({ message: 'No farm selected' });

    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);

    const upcoming = await prisma.vaccination_records.findMany({
      where: {
        farm_id: req.farmId,
        next_due_date: {
          gte: today,
          lte: thirtyDaysFromNow
        }
      },
      include: {
        animals: { select: { tag_number: true } },
        vaccines: { select: { name: true } }
      },
      orderBy: { next_due_date: 'asc' }
    });

    res.json(upcoming.map(r => ({
      id: r.id,
      tagNumber: r.animals?.tag_number,
      vaccineName: r.vaccines?.name,
      dueDate: r.next_due_date,
      daysRemaining: Math.ceil((new Date(r.next_due_date) - today) / (1000 * 60 * 60 * 24))
    })));
  } catch (err) {
    console.error('GET UPCOMING BOOSTERS ERROR:', err);
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
        animals: { 
          select: { 
            tag_number: true,
            gender: true,
            birth_date: true,
            breeds: { select: { name: true } },
            locations: { select: { name: true } }
          } 
        },
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
      animal: r.animals ? { 
        tagNumber: r.animals.tag_number,
        gender: r.animals.gender,
        breedName: r.animals.breeds?.name,
        currentLocationName: r.animals.locations?.name,
        ageInMonths: r.animals.birth_date ? Math.floor((new Date() - new Date(r.animals.birth_date)) / (1000 * 60 * 60 * 24 * 30.44)) : 'N/A'
      } : null,
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
    
    // Schedule Reminders for all created records
    // We pass the recordsData which contains the calculated nextDueDate
    // Enriched with vaccine name for notifications
    const enrichedRecords = recordsData.map(r => ({
      ...r,
      vaccine_name: vaccine.name
    }));
    
    // Fire and forget reminder scheduling
    scheduleVaccinationReminders(enrichedRecords).catch(e => console.error('Schedule Error:', e));

    res.status(201).json({ message: `Successfully recorded ${count.count} vaccination(s)` });
  } catch (err) {
    console.error('CREATE RECORD ERROR:', err);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Update an existing vaccination record
// @route   PUT /api/vaccination-records/:id
exports.updateVaccinationRecord = async (req, res) => {
  const { date, validTill, nextDueDate, remark } = req.body;
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
    if (nextDueDate !== undefined) updateData.next_due_date = nextDueDate ? new Date(nextDueDate) : null;
    if (remark !== undefined) updateData.remark = remark;

    // Recalculate next due date if the administration date changed AND manual nextDueDate wasn't provided
    if (date && !nextDueDate && record.vaccines?.days_between > 0) {
      const baseDate = new Date(date);
      baseDate.setDate(baseDate.getDate() + record.vaccines.days_between);
      updateData.next_due_date = baseDate;
    }

    const updated = await prisma.vaccination_records.update({ where: { id: req.params.id }, data: updateData });

    // If next_due_date changed, reschedule reminders
    if (updateData.next_due_date) {
      await prisma.reminders.deleteMany({
        where: { vaccine_record_id: req.params.id, status: 'PENDING' }
      });
      
      scheduleVaccinationReminders({
        ...updated,
        vaccine_name: record.vaccines?.name
      }).catch(e => console.error('Reschedule Error:', e));
    }

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
    
    // Clean up pending reminders
    await prisma.reminders.deleteMany({
      where: { vaccine_record_id: req.params.id, status: 'PENDING' }
    });
    
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

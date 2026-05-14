const prisma = require('../config/prisma');
const { v4: uuidv4 } = require('uuid');

// @desc    Get ALL matings for the farm
// @route   GET /api/matings
exports.getAllMatings = async (req, res) => {
  try {
    if (!req.farmId) return res.status(400).json({ message: 'No farm selected' });

    const matings = await prisma.matings.findMany({
      where: { farm_id: req.farmId },
      orderBy: { mating_date: 'desc' },
      include: {
        animals: {
          select: { tag_number: true, gender: true }
        }
      }
    });

    res.json(matings);
  } catch (err) {
    console.error('FETCH ALL MATINGS ERROR:', err);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get all matings for an animal
// @route   GET /api/matings/animal/:animalId
exports.getMatingsByAnimal = async (req, res) => {
  try {
    if (!req.farmId) return res.status(400).json({ message: 'No farm selected' });

    const matings = await prisma.matings.findMany({
      where: { animal_id: req.params.animalId, farm_id: req.farmId },
      orderBy: { created_at: 'desc' }
    });

    res.json(matings);
  } catch (err) {
    console.error('FETCH MATINGS ERROR:', err);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Add a mating record
// @route   POST /api/matings
exports.addMating = async (req, res) => {
  const { 
    animal_id, mating_date, mating_type, remark, 
    male_tag_id, male_breed, semen_id, dose, 
    technician, time, embryo_id, status, 
    expected_delivery_date, miscarriage_date, miscarriage_reason 
  } = req.body;

  try {
    if (!req.farmId) return res.status(400).json({ message: 'No farm selected' });

    const mating = await prisma.matings.create({
      data: {
        id: uuidv4(),
        animal_id,
        farm_id: req.farmId,
        mating_date: new Date(mating_date),
        mating_type,
        remark,
        male_tag_id,
        male_breed,
        semen_id,
        dose,
        technician,
        time,
        embryo_id,
        status: status || 'NOT_SUCCESSFUL',
        expected_delivery_date: expected_delivery_date ? new Date(expected_delivery_date) : null,
        miscarriage_date: miscarriage_date ? new Date(miscarriage_date) : null,
        miscarriage_reason,
        created_by_user_id: req.user.id
      }
    });

    if (status === 'PREGNANT') {
      await prisma.animals.update({
        where: { id: animal_id },
        data: { female_condition: 'PREGNANT' }
      });
    }

    res.status(201).json(mating);
  } catch (err) {
    console.error('ADD MATING ERROR:', err);
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};

// @desc    Update a mating record
// @route   PUT /api/matings/:id
exports.updateMating = async (req, res) => {
  const { 
    mating_date, mating_type, male_tag_id, male_breed, semen_id, dose, 
    technician, time, embryo_id, status, 
    expected_delivery_date, miscarriage_date, miscarriage_reason, remark
  } = req.body;

  try {
    const existing = await prisma.matings.findFirst({
      where: { id: req.params.id, farm_id: req.farmId }
    });
    
    if (!existing) return res.status(404).json({ message: 'Mating record not found' });

    const updated = await prisma.matings.update({
      where: { id: req.params.id },
      data: {
        mating_date: mating_date ? new Date(mating_date) : existing.mating_date,
        mating_type: mating_type || existing.mating_type,
        male_tag_id: male_tag_id !== undefined ? male_tag_id : existing.male_tag_id,
        male_breed: male_breed !== undefined ? male_breed : existing.male_breed,
        semen_id: semen_id !== undefined ? semen_id : existing.semen_id,
        dose: dose !== undefined ? dose : existing.dose,
        technician: technician !== undefined ? technician : existing.technician,
        time: time !== undefined ? time : existing.time,
        embryo_id: embryo_id !== undefined ? embryo_id : existing.embryo_id,
        status: status || existing.status,
        expected_delivery_date: expected_delivery_date ? new Date(expected_delivery_date) : null,
        miscarriage_date: miscarriage_date ? new Date(miscarriage_date) : null,
        miscarriage_reason: miscarriage_reason !== undefined ? miscarriage_reason : existing.miscarriage_reason,
        remark: remark !== undefined ? remark : existing.remark,
        updated_by_user_id: req.user.id
      }
    });

    if (status === 'PREGNANT') {
      await prisma.animals.update({
        where: { id: existing.animal_id },
        data: { female_condition: 'PREGNANT' }
      });
    } else if (status === 'NOT_SUCCESSFUL' || status === 'MISCARRIAGE') {
      await prisma.animals.update({
        where: { id: existing.animal_id },
        data: { female_condition: 'NONE' } // Reset condition on miscarriage or unsuccessful
      });
    }

    res.json(updated);
  } catch (err) {
    console.error('UPDATE MATING ERROR:', err);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Delete a mating record
// @route   DELETE /api/matings/:id
exports.deleteMating = async (req, res) => {
  try {
    const mating = await prisma.matings.findFirst({
      where: { id: req.params.id, farm_id: req.farmId }
    });

    if (!mating) return res.status(404).json({ message: 'Mating record not found' });

    await prisma.matings.delete({ where: { id: req.params.id } });
    res.json({ message: 'Mating record deleted successfully' });
  } catch (err) {
    console.error('DELETE MATING ERROR:', err);
    res.status(500).json({ message: 'Server Error' });
  }
};

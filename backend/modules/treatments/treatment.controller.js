const prisma = require('../../config/prisma');
const { v4: uuidv4 } = require('uuid');

// @desc    Get ALL treatment records for the farm
// @route   GET /api/treatments
exports.getAllTreatments = async (req, res) => {
  try {
    if (!req.farmId) return res.status(400).json({ message: 'No farm selected' });

    const treatments = await prisma.treatment_records.findMany({
      where: { farm_id: req.farmId },
      orderBy: { date: 'desc' },
      include: {
        animals: {
          select: { tag_number: true, gender: true, animal_type: true }
        }
      }
    });

    res.json(treatments);
  } catch (err) {
    console.error('FETCH ALL TREATMENTS ERROR:', err);
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};

// @desc    Get treatment records for a specific animal
// @route   GET /api/treatments/animal/:animalId
exports.getTreatmentsByAnimal = async (req, res) => {
  try {
    if (!req.farmId) return res.status(400).json({ message: 'No farm selected' });

    const treatments = await prisma.treatment_records.findMany({
      where: { animal_id: req.params.animalId, farm_id: req.farmId },
      orderBy: { date: 'desc' }
    });

    res.json(treatments);
  } catch (err) {
    console.error('FETCH ANIMAL TREATMENTS ERROR:', err);
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};

// @desc    Add a treatment record
// @route   POST /api/treatments
exports.addTreatment = async (req, res) => {
  const { animal_id, tag_number, date, treatment_type, disease_name, medicine_name, dosage, cost, remark } = req.body;
  try {
    if (!req.farmId) return res.status(400).json({ message: 'No farm selected' });

    let targetAnimalId = animal_id;

    if (!targetAnimalId && tag_number) {
      const animal = await prisma.animals.findFirst({
        where: { farm_id: req.farmId, tag_number: tag_number.trim() }
      });
      if (!animal) {
        return res.status(404).json({ message: `Animal with Tag Number "${tag_number}" not found.` });
      }
      targetAnimalId = animal.id;
    }

    if (!targetAnimalId) {
      return res.status(400).json({ message: 'Animal ID or Tag Number is required.' });
    }

    const treatment = await prisma.treatment_records.create({
      data: {
        id: uuidv4(),
        animal_id: targetAnimalId,
        farm_id: req.farmId,
        date: date ? new Date(date) : new Date(),
        treatment_type: treatment_type || disease_name || 'General Treatment',
        disease_name: disease_name || null,
        medicine_name: medicine_name || null,
        dosage: dosage || null,
        cost: cost !== undefined && cost !== '' && cost !== null ? parseFloat(cost) : null,
        remark: remark || null,
        created_by_user_id: req.user?.id || null,
        updated_by_user_id: req.user?.id || null
      }
    });

    res.status(201).json(treatment);
  } catch (err) {
    console.error('ADD TREATMENT ERROR:', err);
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};

// @desc    Update a treatment record
// @route   PUT /api/treatments/:id
exports.updateTreatment = async (req, res) => {
  const { date, treatment_type, disease_name, medicine_name, dosage, cost, remark } = req.body;
  try {
    const existing = await prisma.treatment_records.findFirst({
      where: { id: req.params.id, farm_id: req.farmId }
    });

    if (!existing) return res.status(404).json({ message: 'Treatment record not found' });

    const updated = await prisma.treatment_records.update({
      where: { id: req.params.id },
      data: {
        date: date ? new Date(date) : existing.date,
        treatment_type: treatment_type !== undefined ? treatment_type : existing.treatment_type,
        disease_name: disease_name !== undefined ? disease_name : existing.disease_name,
        medicine_name: medicine_name !== undefined ? medicine_name : existing.medicine_name,
        dosage: dosage !== undefined ? dosage : existing.dosage,
        cost: cost !== undefined && cost !== '' && cost !== null ? parseFloat(cost) : (cost === null ? null : existing.cost),
        remark: remark !== undefined ? remark : existing.remark,
        updated_by_user_id: req.user?.id || null
      }
    });

    res.json(updated);
  } catch (err) {
    console.error('UPDATE TREATMENT ERROR:', err);
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};

// @desc    Delete a treatment record
// @route   DELETE /api/treatments/:id
exports.deleteTreatment = async (req, res) => {
  try {
    const existing = await prisma.treatment_records.findFirst({
      where: { id: req.params.id, farm_id: req.farmId }
    });

    if (!existing) return res.status(404).json({ message: 'Treatment record not found' });

    await prisma.treatment_records.delete({ where: { id: req.params.id } });
    res.json({ message: 'Treatment record deleted successfully' });
  } catch (err) {
    console.error('DELETE TREATMENT ERROR:', err);
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};

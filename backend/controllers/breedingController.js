const prisma = require('../config/prisma');
const { v4: uuidv4 } = require('uuid');

// @desc    Get all breedings (deliveries) for an animal
// @route   GET /api/breedings/animal/:animalId
exports.getBreedingsByAnimal = async (req, res) => {
  try {
    if (!req.farmId) return res.status(400).json({ message: 'No farm selected' });

    const breedings = await prisma.breedings.findMany({
      where: { animal_id: req.params.animalId, farm_id: req.farmId },
      orderBy: { created_at: 'desc' }
    });

    res.json(breedings);
  } catch (err) {
    console.error('FETCH BREEDINGS ERROR:', err);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Add a breeding (delivery) record
// @route   POST /api/breedings
exports.addBreeding = async (req, res) => {
  const { animal_id, delivery_date, birth_type, num_male, num_female, remark } = req.body;
  try {
    if (!req.farmId) return res.status(400).json({ message: 'No farm selected' });

    const breeding = await prisma.breedings.create({
      data: {
        id: uuidv4(),
        animal_id,
        farm_id: req.farmId,
        delivery_date: new Date(delivery_date),
        birth_type,
        num_male: num_male || 0,
        num_female: num_female || 0,
        remark,
        created_by_user_id: req.user.id
      }
    });

    // Reset female condition to NONE after a successful delivery
    await prisma.animals.update({
      where: { id: animal_id },
      data: { female_condition: 'NONE' }
    });

    res.status(201).json(breeding);
  } catch (err) {
    console.error('ADD BREEDING ERROR:', err);
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};

// @desc    Delete a breeding record
// @route   DELETE /api/breedings/:id
exports.deleteBreeding = async (req, res) => {
  try {
    const breeding = await prisma.breedings.findFirst({
      where: { id: req.params.id, farm_id: req.farmId }
    });

    if (!breeding) return res.status(404).json({ message: 'Breeding record not found' });

    await prisma.breedings.delete({ where: { id: req.params.id } });
    res.json({ message: 'Breeding record deleted successfully' });
  } catch (err) {
    console.error('DELETE BREEDING ERROR:', err);
    res.status(500).json({ message: 'Server Error' });
  }
};

const prisma = require('../../config/prisma');
const { v4: uuidv4 } = require('uuid');

// @desc    Get ALL breedings for the farm
// @route   GET /api/breedings
exports.getAllBreedings = async (req, res) => {
  try {
    if (!req.farmId) return res.status(400).json({ message: 'No farm selected' });

    const breedings = await prisma.breedings.findMany({
      where: { farm_id: req.farmId },
      orderBy: { delivery_date: 'desc' },
      include: {
        animals: {
          select: { tag_number: true, gender: true }
        }
      }
    });

    res.json(breedings);
  } catch (err) {
    console.error('FETCH ALL BREEDINGS ERROR:', err);
    res.status(500).json({ message: 'Server Error' });
  }
};

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

exports.addBreeding = async (req, res) => {
  const { animal_id, delivery_date, birth_type, num_male, num_female, remark, kids } = req.body;
  try {
    if (!req.farmId) return res.status(400).json({ message: 'No farm selected' });

    const dateToCheck = new Date(delivery_date);
    dateToCheck.setHours(0, 0, 0, 0);

    // 1. Same date check
    const sameDateRecord = await prisma.breedings.findFirst({
      where: {
        animal_id,
        delivery_date: {
          gte: dateToCheck,
          lte: new Date(dateToCheck.getTime() + 24 * 60 * 60 * 1000 - 1)
        }
      }
    });
    if (sameDateRecord) {
      return res.status(400).json({ message: 'A delivery record already exists for this date.' });
    }

    // 2. 150-day gap constraint
    const existingDeliveries = await prisma.breedings.findMany({
      where: { animal_id }
    });

    for (const record of existingDeliveries) {
      const recDate = new Date(record.delivery_date);
      recDate.setHours(0, 0, 0, 0);
      const diffTime = Math.abs(dateToCheck.getTime() - recDate.getTime());
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays < 150) {
        return res.status(400).json({
          message: `Gap constraint violated: Another delivery was recorded on ${recDate.toLocaleDateString()} (${diffDays} days gap, minimum 150 days required).`
        });
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create breeding record and save kids_details
      const breeding = await tx.breedings.create({
        data: {
          id: uuidv4(),
          animal_id,
          farm_id: req.farmId,
          delivery_date: new Date(delivery_date),
          birth_type,
          num_male: num_male || 0,
          num_female: num_female || 0,
          kids_details: kids ? kids : null,
          remark,
          created_by_user_id: req.user.id
        }
      });

      // 2. Reset female condition
      await tx.animals.update({
        where: { id: animal_id },
        data: { female_condition: 'NONE' }
      });

      return breeding;
    });

    res.status(201).json(result);
  } catch (err) {
    console.error('ADD BREEDING ERROR:', err);
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};

// @desc    Update a breeding record
// @route   PUT /api/breedings/:id
exports.updateBreeding = async (req, res) => {
  const { delivery_date, birth_type, num_male, num_female, remark, kids } = req.body;
  try {
    const existing = await prisma.breedings.findFirst({
      where: { id: req.params.id, farm_id: req.farmId }
    });

    if (!existing) return res.status(404).json({ message: 'Breeding record not found' });
    
    if (delivery_date) {
      const dateToCheck = new Date(delivery_date);
      dateToCheck.setHours(0, 0, 0, 0);

      // Same date check
      const sameDateRecord = await prisma.breedings.findFirst({
        where: {
          id: { not: req.params.id },
          animal_id: existing.animal_id,
          delivery_date: {
            gte: dateToCheck,
            lte: new Date(dateToCheck.getTime() + 24 * 60 * 60 * 1000 - 1)
          }
        }
      });
      if (sameDateRecord) {
        return res.status(400).json({ message: 'A delivery record already exists for this date.' });
      }

      // 150-day gap constraint
      const existingDeliveries = await prisma.breedings.findMany({
        where: {
          id: { not: req.params.id },
          animal_id: existing.animal_id
        }
      });

      for (const record of existingDeliveries) {
        const recDate = new Date(record.delivery_date);
        recDate.setHours(0, 0, 0, 0);
        const diffTime = Math.abs(dateToCheck.getTime() - recDate.getTime());
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays < 150) {
          return res.status(400).json({
            message: `Gap constraint violated: Another delivery exists on ${recDate.toLocaleDateString()} (${diffDays} days gap, minimum 150 days required).`
          });
        }
      }
    }
    
    const updated = await prisma.breedings.update({
      where: { id: req.params.id },
      data: {
        delivery_date: delivery_date ? new Date(delivery_date) : existing.delivery_date,
        birth_type: birth_type || existing.birth_type,
        num_male: num_male !== undefined ? num_male : existing.num_male,
        num_female: num_female !== undefined ? num_female : existing.num_female,
        kids_details: kids !== undefined ? kids : existing.kids_details,
        remark: remark !== undefined ? remark : existing.remark,
        updated_by_user_id: req.user.id
      }
    });

    res.json(updated);
  } catch (err) {
    console.error('UPDATE BREEDING ERROR:', err);
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

const prisma = require('../config/prisma');
const { v4: uuidv4 } = require('uuid');

// @desc    Fetch weight history for a specific animal or the entire farm
// @route   GET /api/weights
exports.getWeights = async (req, res) => {
  try {
    const { animalId, tagNumber } = req.query;
    const where = { farm_id: req.farmId };
    
    // Allow filtering by either internal ID or the human-readable Tag Number
    if (animalId) where.animal_id = animalId;
    if (tagNumber) where.tag_number = tagNumber;

    const weights = await prisma.weights.findMany({
      where,
      orderBy: [{ date: 'desc' }, { created_at: 'desc' }]
    });

    res.json(weights.map(w => ({
      id: w.id, 
      animalId: w.animal_id, 
      farmId: w.farm_id,
      weight: w.weight, 
      height: w.height, 
      date: w.date,
      tagNumber: w.tag_number, 
      remark: w.remark,
      createdAt: w.created_at, 
      updatedAt: w.updated_at
    })));
  } catch (err) {
    console.error('FETCH WEIGHTS ERROR:', err);
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};

// @desc    Record a new weight observation for an animal
// @route   POST /api/weights
exports.addWeight = async (req, res) => {
  const { tagNumber, weight, height, date, remark } = req.body;
  try {
    if (!tagNumber || weight === undefined || weight === null) {
      return res.status(400).json({ message: 'Tag Number and Weight value are required' });
    }

    const numericWeight = parseFloat(weight);
    if (isNaN(numericWeight)) {
      return res.status(400).json({ message: 'Weight must be a valid number' });
    }

    // 1. Verify that an animal with this tag exists in the current farm's inventory
    const animal = await prisma.animals.findFirst({
      where: { tag_number: tagNumber, farm_id: req.farmId }
    });
    if (!animal) {
      return res.status(404).json({ message: 'No animal found with this Tag Number in your farm' });
    }

    const now = new Date();
    // 2. Create the weight record linked to the animal internal ID
    const weightRecord = await prisma.weights.create({
      data: {
        id: uuidv4(), 
        animal_id: animal.id, 
        farm_id: req.farmId || animal.farm_id, 
        tag_number: tagNumber, 
        weight: numericWeight, 
        height: height ? parseFloat(height) : null,
        date: date ? new Date(date) : now, 
        remark,
        created_by_user_id: req.user.id, 
        created_at: now, 
        updated_at: now
      }
    });

    res.status(201).json(weightRecord);
  } catch (err) {
    console.error('ADD WEIGHT ERROR:', err);
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};

// @desc    Correct or update an existing weight entry
// @route   PUT /api/weights/:id
exports.updateWeight = async (req, res) => {
  const { weight, height, date, remark } = req.body;
  try {
    const record = await prisma.weights.findFirst({
      where: { id: req.params.id, farm_id: req.farmId }
    });
    if (!record) {
      return res.status(404).json({ message: 'Weight record not found' });
    }

    const data = {
      remark,
      updated_by_user_id: req.user.id,
      updated_at: new Date()
    };

    if (weight !== undefined && weight !== null) {
      const numericWeight = parseFloat(weight);
      if (isNaN(numericWeight)) {
        return res.status(400).json({ message: 'Weight must be a valid number' });
      }
      data.weight = numericWeight;
    }

    if (height !== undefined) {
      if (height === null || height === '') {
        data.height = null;
      } else {
        const numericHeight = parseFloat(height);
        if (!isNaN(numericHeight)) {
          data.height = numericHeight;
        }
      }
    }

    if (date) {
      data.date = new Date(date);
    }

    const updated = await prisma.weights.update({
      where: { id: req.params.id },
      data
    });

    res.json(updated);
  } catch (err) {
    console.error('UPDATE WEIGHT ERROR:', err);
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};

// @desc    Delete a weight entry
// @route   DELETE /api/weights/:id
exports.deleteWeight = async (req, res) => {
  try {
    const record = await prisma.weights.findFirst({
      where: { id: req.params.id, farm_id: req.farmId }
    });
    if (!record) {
      return res.status(404).json({ message: 'Weight record not found' });
    }
    
    await prisma.weights.delete({ where: { id: req.params.id } });
    res.json({ message: 'Weight record removed successfully' });
  } catch (err) {
    console.error('DELETE WEIGHT ERROR:', err);
    res.status(500).json({ message: 'Server Error' });
  }
};

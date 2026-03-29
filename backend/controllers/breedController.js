const prisma = require('../config/prisma');
const { v4: uuidv4 } = require('uuid');

// @desc    Get all breeds available for the current farm (includes global defaults)
// @route   GET /api/breeds
exports.getBreeds = async (req, res) => {
  try {
    if (!req.farmId) {
      return res.status(400).json({ message: 'No farm selected' });
    }

    // Fetch breeds that:
    // a) belong explicitly to this farm
    // b) are marked as default/global (available to all users)
    const breeds = await prisma.breeds.findMany({
      where: {
        OR: [
          { farm_id: req.farmId },
          { is_default: true }
        ]
      },
      orderBy: { name: 'asc' }
    });

    // Transform database records to API standard (camelCase)
    res.json(breeds.map(b => ({
      id: b.id,
      name: b.name,
      animalType: b.animal_type,
      category: b.category,
      farmId: b.farm_id,
      isDefault: b.is_default,
      createdAt: b.created_at,
      updatedAt: b.updated_at
    })));
  } catch (err) {
    console.error('FETCH BREEDS ERROR:', err);
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};

// @desc    Register a new custom breed for a specific farm
// @route   POST /api/breeds
exports.addBreed = async (req, res) => {
  const { name, animalType } = req.body;
  try {
    if (!req.farmId) {
      return res.status(400).json({ message: 'No farm selected' });
    }

    const now = new Date();
    // Create new breed record private to the current farm
    const breed = await prisma.breeds.create({
      data: {
        id: uuidv4(),
        name,
        animal_type: animalType || 'Goat', // Default to Goat if not specified
        farm_id: req.farmId,
        created_by_user_id: req.user.id,
        created_at: now,
        updated_at: now
      }
    });

    res.status(201).json({
      id: breed.id,
      name: breed.name,
      animalType: breed.animal_type,
      farmId: breed.farm_id,
      createdAt: breed.created_at
    });
  } catch (err) {
    console.error('ADD BREED ERROR:', err);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Update custom breed details
// @route   PUT /api/breeds/:id
exports.updateBreed = async (req, res) => {
  const { name, animalType } = req.body;
  try {
    // 1. Ensure the breed exists and belongs to the current farm (cannot edit defaults)
    const breed = await prisma.breeds.findFirst({
      where: { id: req.params.id, farm_id: req.farmId }
    });

    if (!breed) {
      return res.status(404).json({ message: 'Breed not found in this farm' });
    }

    const updated = await prisma.breeds.update({
      where: { id: req.params.id },
      data: { name, animal_type: animalType, updated_by_user_id: req.user.id, updated_at: new Date() }
    });

    res.json({
      id: updated.id,
      name: updated.name,
      animalType: updated.animal_type,
      farmId: updated.farm_id,
      updatedAt: updated.updated_at
    });
  } catch (err) {
    console.error('UPDATE BREED ERROR:', err);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Safely remove a custom breed from a farm
// @route   DELETE /api/breeds/:id
exports.deleteBreed = async (req, res) => {
  try {
    const breed = await prisma.breeds.findFirst({
      where: { id: req.params.id, farm_id: req.farmId }
    });

    if (!breed) {
      return res.status(404).json({ message: 'Breed not found in this farm' });
    }

    // Integrity Check: Do not delete if any animals are currently assigned to this breed
    const animalCount = await prisma.animals.count({ where: { breed_id: breed.id } });
    if (animalCount > 0) {
      return res.status(400).json({ message: 'Cannot delete breed that is assigned to animals' });
    }

    await prisma.breeds.delete({ where: { id: req.params.id } });
    res.json({ message: 'Breed removed successfully' });
  } catch (err) {
    console.error('DELETE BREED ERROR:', err);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get detailed statistics for a specific breed within the farm
// @route   GET /api/breeds/:id/stats
exports.getBreedStats = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if breed exists and belongs to farm (or is a default global breed)
    const breed = await prisma.breeds.findFirst({ 
      where: { 
        id,
        OR: [
          { farm_id: req.farmId },
          { is_default: true }
        ]
      } 
    });
    if (!breed) return res.status(404).json({ message: 'Breed not found' });

    // Fetch all animals belonging to this breed in the current farm context
    const animals = await prisma.animals.findMany({
      where: { breed_id: id, farm_id: req.farmId },
      include: { locations: { select: { name: true, code: true, type: true } } }
    });

    // Grouping Logic: Distribute counts and lists based on physical location (e.g., Shed A, Shed B)
    const distribution = {};
    animals.forEach(animal => {
      const locName = animal.locations?.name || 'Unassigned';
      if (!distribution[locName]) {
        distribution[locName] = {
          locationName: locName,
          count: 0,
          animals: []
        };
      }
      distribution[locName].count += 1;
      distribution[locName].animals.push({
          id: animal.id,
          tagNumber: animal.tag_number,
          gender: animal.gender,
          Location: animal.locations
      });
    });

    res.json({
      breed: { id: breed.id, name: breed.name, animalType: breed.animal_type },
      totalAnimals: animals.length,
      distribution: Object.values(distribution)
    });
  } catch (err) {
    console.error('GET BREED STATS ERROR:', err);
    res.status(500).json({ message: 'Server Error' });
  }
};

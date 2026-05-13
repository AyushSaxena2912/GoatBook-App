const prisma = require('../config/prisma');
const { v4: uuidv4 } = require('uuid');

// @desc    Get all breeds available for the current farm (includes global defaults)
// @route   GET /api/breeds
exports.getBreeds = async (req, res) => {
  try {
    if (!req.farmId) {
      return res.status(400).json({ message: 'No farm selected' });
    }

    // Fetch breeds that belong explicitly to this farm
    const breeds = await prisma.breeds.findMany({
      where: {
        OR: [
          { farm_id: req.farmId },
          { is_default: true }
        ]
      },
      include: {
        _count: {
          select: {
            animals: {
              where: { farm_id: req.farmId }
            }
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    // Transform database records to API standard (camelCase)
    res.json(breeds.map(b => ({
      id: b.id,
      name: b.name,
      animalType: b.animal_type,
      category: b.category,
      origin: b.origin || 'indian',
      farmId: b.farm_id,
      isDefault: b.is_default,
      animalCount: b._count?.animals || 0,
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
  const { name, animalType, origin } = req.body;
  try {
    if (!req.farmId) {
      return res.status(400).json({ message: 'No farm selected' });
    }

    // Check for duplicate breed name (case-insensitive) in both system breeds and this farm
    const duplicate = await prisma.breeds.findFirst({
      where: {
        name: { equals: name, mode: 'insensitive' },
        OR: [
          { is_default: true },
          { farm_id: req.farmId }
        ]
      }
    });

    if (duplicate) {
      if (duplicate.is_default) {
        return res.status(400).json({ message: 'A system breed with this name already exists. Please choose a different name.' });
      } else {
        return res.status(400).json({ message: 'A breed with this name already exists in your farm.' });
      }
    }

    const now = new Date();
    // Create new breed record private to the current farm
    const breed = await prisma.breeds.create({
      data: {
        id: uuidv4(),
        name,
        animal_type: animalType || 'Goat', // Default to Goat if not specified
        origin: origin || 'indian',
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
      origin: breed.origin,
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
  const { name, animalType, origin } = req.body;
  try {
    // 1. Ensure the breed exists and is not a protected system breed
    const breed = await prisma.breeds.findFirst({
      where: { id: req.params.id }
    });

    if (!breed) {
      return res.status(404).json({ message: 'Breed not found' });
    }

    if (breed.is_default) {
      return res.status(403).json({ message: 'System breeds cannot be modified. Please create a custom breed for your farm.' });
    }

    if (breed.farm_id !== req.farmId) {
      return res.status(404).json({ message: 'Breed does not belong to your farm' });
    }

    // Check for duplicate breed name (case-insensitive) excluding the current breed
    const duplicate = await prisma.breeds.findFirst({
      where: {
        name: { equals: name, mode: 'insensitive' },
        id: { not: req.params.id },
        OR: [
          { is_default: true },
          { farm_id: req.farmId }
        ]
      }
    });

    if (duplicate) {
      if (duplicate.is_default) {
        return res.status(400).json({ message: 'A system breed with this name already exists. Please choose a different name.' });
      } else {
        return res.status(400).json({ message: 'A breed with this name already exists in your farm.' });
      }
    }

    const updated = await prisma.breeds.update({
      where: { id: req.params.id },
      data: { 
        name, 
        animal_type: animalType, 
        origin: origin || 'indian',
        updated_by_user_id: req.user.id, 
        updated_at: new Date() 
      }
    });

    res.json({
      id: updated.id,
      name: updated.name,
      animalType: updated.animal_type,
      origin: updated.origin,
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
      where: { id: req.params.id }
    });

    if (!breed) {
      return res.status(404).json({ message: 'Breed not found' });
    }

    if (breed.is_default) {
      return res.status(403).json({ message: 'System breeds cannot be deleted.' });
    }

    if (breed.farm_id !== req.farmId) {
      return res.status(404).json({ message: 'Breed does not belong to your farm' });
    }

    // Integrity Check: Do not delete if any animals are currently assigned to this breed
    const animalCount = await prisma.animals.count({ where: { breed_id: breed.id } });
    if (animalCount > 0) {
      return res.status(400).json({ 
        message: `Cannot delete — this breed is used by ${animalCount} animals`
      });
    }

    await prisma.breeds.delete({ where: { id: req.params.id } });
    res.json({ message: 'Breed removed successfully' });
  } catch (err) {
    console.error('DELETE BREED ERROR:', err);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Bulk delete breeds
// @route   DELETE /api/breeds/bulk
exports.bulkDeleteBreeds = async (req, res) => {
  const { ids } = req.body;
  
  if (!req.farmId) {
    return res.status(400).json({ message: 'No farm selected' });
  }

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ message: 'No breed IDs provided' });
  }

  try {
    // 1. Fetch requested breeds including animal counts
    const requestedBreeds = await prisma.breeds.findMany({
      where: {
        id: { in: ids },
        farm_id: req.farmId
      },
      include: {
        _count: {
          select: { animals: true }
        }
      }
    });

    if (requestedBreeds.length === 0) {
      return res.status(400).json({ message: 'No manageable breeds found' });
    }

    const skippedIds = [];
    const deletableIds = [];

    // 2. Filter: Skip system breeds AND breeds with animals
    requestedBreeds.forEach(breed => {
      if (breed.is_default || breed._count.animals > 0) {
        skippedIds.push(breed.id);
      } else {
        deletableIds.push(breed.id);
      }
    });

    if (deletableIds.length === 0) {
      return res.status(400).json({ 
        message: 'No breeds were eligible for deletion (either system breeds or assigned to animals).',
        skippedIds 
      });
    }

    // 3. Bulk Delete
    await prisma.breeds.deleteMany({
      where: { id: { in: deletableIds } }
    });

    res.json({ 
      success: true, 
      message: `Successfully deleted ${deletableIds.length} breeds. ${skippedIds.length > 0 ? `${skippedIds.length} skipped.` : ''}`,
      deletedCount: deletableIds.length,
      skippedCount: skippedIds.length,
      skippedIds
    });
  } catch (err) {
    console.error('BULK DELETE BREEDS ERROR:', err);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get detailed statistics for a specific breed within the farm
// @route   GET /api/breeds/:id/stats
exports.getBreedStats = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if breed exists and belongs to farm
    const breed = await prisma.breeds.findFirst({ 
      where: { 
        id,
        farm_id: req.farmId
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
          status: animal.status,
          imageUrl: animal.image_url,
          Location: animal.locations
      });
    });

    res.json({
      breed: { id: breed.id, name: breed.name, animalType: breed.animal_type, isDefault: breed.is_default },
      totalAnimals: animals.length,
      distribution: Object.values(distribution)
    });
  } catch (err) {
    console.error('GET BREED STATS ERROR:', err);
    res.status(500).json({ message: 'Server Error' });
  }
};

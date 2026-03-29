const prisma = require('../config/prisma');
const { v4: uuidv4 } = require('uuid');

/**
 * Utility: Build a breadcrumb-style hierarchical name for a location
 * Example: 'Internal Pen 1 / Shed A / North Block'
 * Useful for frontend dropdowns and lists to distinguish locations with same simple names
 */
const buildHierarchicalName = (location, allLocations) => {
  let name = location.name;
  let current = location;
  const visited = new Set([location.id]);
  
  while (current.parent_location_id) {
    if (visited.has(current.parent_location_id)) break; // Prevent infinite loops from circular parentage
    const parent = allLocations.find(l => l.id === current.parent_location_id);
    if (!parent) break;
    name += ` / ${parent.name}`;
    current = parent;
    visited.add(current.id);
  }
  return name;
};

// @desc    Get all locations for a farm with hierarchical paths
// @route   GET /api/locations
exports.getLocations = async (req, res) => {
  try {
    const allLocations = await prisma.locations.findMany({
      where: { farm_id: req.farmId }
    });

    const locationsWithPaths = allLocations.map(loc => ({
      id: loc.id,
      code: loc.code,
      name: loc.name,
      type: loc.type,
      parentLocationId: loc.parent_location_id,
      farmId: loc.farm_id,
      createdAt: loc.created_at,
      updatedAt: loc.updated_at,
      displayName: buildHierarchicalName(loc, allLocations) // Add the breadcrumb name
    }));

    // Sort alphabetically by the full hierarchical name
    locationsWithPaths.sort((a, b) => a.displayName.localeCompare(b.displayName));

    res.json(locationsWithPaths);
  } catch (err) {
    console.error('FETCH LOCATIONS ERROR:', err);
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};

// @desc    Create a new location (shed, pen, or sub-location)
// @route   POST /api/locations
exports.addLocation = async (req, res) => {
  const { code, name, type, parentLocationId } = req.body;
  try {
    const now = new Date();
    const location = await prisma.locations.create({
      data: {
        id: uuidv4(),
        code,
        name,
        type: type || 'Internal Location',
        parent_location_id: parentLocationId || null,
        farm_id: req.farmId,
        created_by_user_id: req.user.id,
        created_at: now,
        updated_at: now
      }
    });

    res.status(201).json(location);
  } catch (err) {
    console.error('ADD LOCATION ERROR:', err);
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};

// @desc    Update location attributes
// @route   PUT /api/locations/:id
exports.updateLocation = async (req, res) => {
  const { code, name, type, parentLocationId } = req.body;
  try {
    const location = await prisma.locations.findFirst({
      where: { id: req.params.id, farm_id: req.farmId }
    });

    if (!location) {
      return res.status(404).json({ message: 'Location not found' });
    }

    // Integrity Check: Prevent location from being its own parent (leads to infinite recursion)
    if (parentLocationId === req.params.id) {
        return res.status(400).json({ message: 'Location cannot be its own parent' });
    }

    const updated = await prisma.locations.update({
      where: { id: req.params.id },
      data: {
        code,
        name,
        type,
        parent_location_id: parentLocationId || null,
        updated_by_user_id: req.user.id,
        updated_at: new Date()
      }
    });

    res.json(updated);
  } catch (err) {
    console.error('UPDATE LOCATION ERROR:', err);
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};

// @desc    Safely remove a location
// @route   DELETE /api/locations/:id
exports.deleteLocation = async (req, res) => {
  try {
    const location = await prisma.locations.findFirst({
      where: { id: req.params.id, farm_id: req.farmId }
    });

    if (!location) {
      return res.status(404).json({ message: 'Location not found' });
    }

    // Integrity Check 1: Prevent deletion if animals are currently parked here
    const animalCount = await prisma.animals.count({ where: { location_id: location.id } });
    if (animalCount > 0) {
      return res.status(400).json({ message: 'Cannot delete location with animals present' });
    }

    // Integrity Check 2: Prevent deletion if this is a parent to other sub-locations
    const childCount = await prisma.locations.count({ where: { parent_location_id: location.id } });
    if (childCount > 0) {
        return res.status(400).json({ message: 'Cannot delete location that has sub-locations' });
    }

    await prisma.locations.delete({ where: { id: req.params.id } });
    res.json({ message: 'Location removed successfully' });
  } catch (err) {
    console.error('DELETE LOCATION ERROR:', err);
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};

// @desc    Get report of animal distribution within a specific location grouped by breed
// @route   GET /api/locations/:id/stats
exports.getLocationStats = async (req, res) => {
  try {
    const { id } = req.params;
    
    const location = await prisma.locations.findFirst({ where: { id, farm_id: req.farmId } });
    if (!location) return res.status(404).json({ message: 'Location not found' });

    // Fetch animals residing at this physical location
    const animals = await prisma.animals.findMany({
      where: { location_id: id, farm_id: req.farmId },
      include: { breeds: { select: { name: true, animal_type: true } } }
    });

    // Grouping Logic: Categorize animals by their breed to show variety in the shed
    const distribution = {};
    animals.forEach(animal => {
      const breedName = animal.breeds?.name || 'Unknown Breed';
      const breedId = animal.breed_id;
      
      if (!distribution[breedId]) {
        distribution[breedId] = {
          breedId,
          breedName,
          count: 0,
          animals: []
        };
      }
      
      distribution[breedId].count += 1;
      distribution[breedId].animals.push({
          id: animal.id,
          tagNumber: animal.tag_number,
          gender: animal.gender
      });
    });

    res.json({
      location: {
        id: location.id,
        code: location.code,
        name: location.name,
        type: location.type
      },
      totalAnimals: animals.length,
      distribution: Object.values(distribution)
    });
  } catch (err) {
    console.error('GET LOCATION STATS ERROR:', err);
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};

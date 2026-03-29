const prisma = require('../config/prisma');

// @desc    Get profile details for the active farm
// @route   GET /api/farms/current
exports.getFarmDetails = async (req, res) => {
  try {
    // req.farmId is populated by the auth middleware based on the 'x-farm-id' header
    if (!req.farmId) {
      return res.status(400).json({ message: 'No farm selected' });
    }

    const farm = await prisma.farms.findUnique({ where: { id: req.farmId } });
    if (!farm) {
      return res.status(404).json({ message: 'Farm database record not found' });
    }

    // Return sanitized farm details
    res.json({
      id: farm.id,
      name: farm.name,
      location: farm.location,
      ownerEmployeeId: farm.owner_employee_id,
      createdAt: farm.created_at,
      updatedAt: farm.updated_at
    });
  } catch (err) {
    console.error('GET FARM ERROR:', err);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Edit main farm settings (Name, Location)
// @route   PUT /api/farms/current
exports.updateFarmDetails = async (req, res) => {
  const { name, location } = req.body;
  try {
    if (!req.farmId) {
      return res.status(400).json({ message: 'No farm selected' });
    }

    // RBAC Security: Only users with 'OWNER' role across the farm record are permitted to edit it
    // req.employee is populated by the auth middleware
    if (req.employee.employee_type !== 'OWNER') {
      return res.status(403).json({ message: 'Access Denied: Only farm owners can modify global settings' });
    }

    const farm = await prisma.farms.findUnique({ where: { id: req.farmId } });
    if (!farm) {
      return res.status(404).json({ message: 'Farm record not found' });
    }

    // Apply partial updates while preserving existing values if not provided
    const updated = await prisma.farms.update({
      where: { id: req.farmId },
      data: {
        name: name || farm.name,
        location: location !== undefined ? location : farm.location,
        updated_by_user_id: req.user.id,
        updated_at: new Date()
      }
    });

    res.json({
      id: updated.id,
      name: updated.name,
      location: updated.location,
      updatedAt: updated.updated_at
    });
  } catch (err) {
    console.error('UPDATE FARM ERROR:', err);
    res.status(500).json({ message: 'Server Error' });
  }
};

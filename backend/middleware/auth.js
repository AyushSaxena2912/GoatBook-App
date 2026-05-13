const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');

module.exports = async (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  const farmId = req.header('X-Farm-ID');

  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    
    // Fetch user and their employee identity
    const user = await prisma.users.findUnique({
      where: { id: decoded.id },
      include: { employees: true }
    });

    const employeeProfile = user?.employees?.[0];

    if (!user || !employeeProfile) {
      return res.status(401).json({ message: 'User or Employee profile not found' });
    }

    // Security Check: Block terminated employees immediately
    if (employeeProfile.state === 'Terminated') {
      return res.status(403).json({ message: 'Access Revoked: Your account has been terminated by the Farm Owner.' });
    }

    req.user = user;
    req.employee = employeeProfile;

    // If a farmId is provided, verify the employee belongs to that farm
    if (farmId) {
      // Basic UUID validation to prevent Prisma crashes on invalid header values
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(farmId)) {
        console.warn(`AUTH: Invalid Farm ID provided in header: ${farmId}`);
        return res.status(400).json({ message: 'Invalid Farm ID format' });
      }

      const membership = await prisma.farm_employees.findFirst({
        where: { farm_id: farmId, employee_id: employeeProfile.id }
      });

      if (!membership) {
        return res.status(403).json({ message: 'Access denied: You do not belong to this farm' });
      }
      req.farmId = farmId;
    }

    next();
  } catch (err) {
    console.error('AUTH MIDDLEWARE ERROR:', err);
    
    // Distinguish between JWT errors and Database/Internal errors
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Session expired or invalid, please login again' });
    }
    
    // If it's a Prisma connection error or other internal issue, return 500
    res.status(500).json({ 
      message: 'Server connectivity issue, please try again in a moment', 
      error: err.message 
    });
  }
};

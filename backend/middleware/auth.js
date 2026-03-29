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

    req.user = user;
    req.employee = employeeProfile;

    // If a farmId is provided, verify the employee belongs to that farm
    if (farmId) {
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
    res.status(401).json({ message: 'Token is not valid' });
  }
};

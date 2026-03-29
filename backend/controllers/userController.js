const prisma = require('../config/prisma');
const { hashPassword, comparePassword } = require('../utils/password');
const { v4: uuidv4 } = require('uuid');

// @desc    Get complete identity overview for the logged-in user
// @route   GET /api/users/profile
exports.getProfile = async (req, res) => {
  try {
    const user = await prisma.users.findUnique({
      where: { id: req.user.id },
      include: {
        employees: {
          include: {
            // Traverse through the junction table to get all farms this user works on
            farm_employees: { include: { farms: true } }
          }
        }
      }
    });

    const ep = user?.employees?.[0]; // Get the primary employee profile
    const farms = ep?.farm_employees?.map(fe => fe.farms) || []; // Extract farm objects

    res.json({
      id: user.id, 
      name: user.name, 
      email: user.email, 
      phone: user.phone,
      employeeProfile: ep ? { id: ep.id, employeeType: ep.employee_type, farms } : null
    });
  } catch (err) {
    console.error('FETCH PROFILE ERROR:', err);
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};

// @desc    Update personal contact information for the user
// @route   PUT /api/users/profile
exports.updateProfile = async (req, res) => {
  const { name, email, phone } = req.body;
  try {
    const user = await prisma.users.findUnique({ where: { id: req.user.id } });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const updated = await prisma.users.update({
      where: { id: req.user.id },
      data: {
        name: name || user.name, 
        email: email || user.email,
        phone: phone !== undefined ? phone : user.phone,
        updated_by_user_id: req.user.id, 
        updated_at: new Date()
      }
    });

    res.json({ id: updated.id, name: updated.name, email: updated.email, phone: updated.phone });
  } catch (err) {
    console.error('PROFILE UPDATE ERROR:', err);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Onboarding: Owner creates a new staff/employee account
// @route   POST /api/users/employees
exports.createEmployee = async (req, res) => {
  const { name, email, password, role } = req.body;
  try {
    // 1. Authorization: Only 'OWNER' role can hire/create new employee accounts
    if (req.employee.employee_type !== 'OWNER') return res.status(403).json({ message: 'Only farm owners can create employees' });
    
    if (!email || !password) return res.status(400).json({ message: 'Email and temporary password are required' });
    
    // 2. Uniqueness Check: Email must not already be in out system
    const existingUser = await prisma.users.findUnique({ where: { email } });
    if (existingUser) return res.status(400).json({ message: 'A user with this email already exists' });
    
    if (!req.farmId) return res.status(400).json({ message: 'No active farm context' });

    const hashedPassword = await hashPassword(password);
    const now = new Date();

    // 3. Atomicity: Perform a multi-step registration (User -> Employee -> Farm Link) in one transaction
    await prisma.$transaction(async (tx) => {
      // Create global user record
      const user = await tx.users.create({ 
        data: { id: uuidv4(), name, email, password: hashedPassword, created_by_user_id: req.user.id, created_at: now, updated_at: now } 
      });
      // Create employee identity record
      const employee = await tx.employees.create({ 
        data: { id: uuidv4(), user_id: user.id, employee_type: role || 'EMPLOYEE', created_by_user_id: req.user.id, created_at: now, updated_at: now } 
      });
      // Link the new employee to the current farm context
      await tx.farm_employees.create({ 
        data: { id: uuidv4(), farm_id: req.farmId, employee_id: employee.id, created_by_user_id: req.user.id, created_at: now, updated_at: now } 
      });
    });

    res.status(201).json({ message: 'Employee account created and linked to farm successfully' });
  } catch (err) {
    console.error('CREATE EMPLOYEE ERROR:', err);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Modify staff details (Owner only)
// @route   PUT /api/users/employees/:id
exports.updateEmployee = async (req, res) => {
  const { name, role } = req.body;
  try {
    if (req.employee.employee_type !== 'OWNER') return res.status(403).json({ message: 'Permission denied' });
    
    const employee = await prisma.employees.findUnique({ where: { id: req.params.id }, include: { users: true } });
    if (!employee) return res.status(404).json({ message: 'Employee not found' });

    // Business Rule: A primary owner's role cannot be downgraded to 'EMPLOYEE' via this endpoint
    const ownedFarm = await prisma.farms.findFirst({ where: { owner_employee_id: employee.id } });
    if (ownedFarm && role && role !== 'OWNER') return res.status(403).json({ message: 'The primary owner role cannot be changed' });

    // Update the functional role
    await prisma.employees.update({ 
      where: { id: req.params.id }, 
      data: { employee_type: role || employee.employee_type, updated_by_user_id: req.user.id, updated_at: new Date() } 
    });

    // Update the human name if provided
    if (name) {
      await prisma.users.update({ 
        where: { id: employee.user_id }, 
        data: { name, updated_by_user_id: req.user.id, updated_at: new Date() } 
      });
    }

    res.json({ message: 'Staff profile updated' });
  } catch (err) {
    console.error('UPDATE EMPLOYEE ERROR:', err);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Administrative Password Override (Owner only)
// @route   POST /api/users/employees/:id/reset-password
exports.resetEmployeePassword = async (req, res) => {
  const { newPassword } = req.body;
  try {
    if (req.employee.employee_type !== 'OWNER') return res.status(403).json({ message: 'Only owners can reset staff passwords' });
    
    const employee = await prisma.employees.findUnique({ where: { id: req.params.id } });
    if (!employee) return res.status(404).json({ message: 'Employee record not found' });
    
    const hashed = await hashPassword(newPassword);
    await prisma.users.update({ 
      where: { id: employee.user_id }, 
      data: { password: hashed, updated_by_user_id: req.user.id, updated_at: new Date() } 
    });
    
    res.json({ message: 'Staff password has been reset successfully' });
  } catch (err) { 
    res.status(500).json({ message: 'Server Error' }); 
  }
};

// @desc    List all staff members currently working on this farm
// @route   GET /api/users/employees
exports.getEmployees = async (req, res) => {
  try {
    if (!req.farmId) return res.status(400).json({ message: 'No farm selected' });
    
    // Fetch all staff members linked to the active farm ID
    const farmEmployees = await prisma.farm_employees.findMany({
      where: { farm_id: req.farmId },
      include: { 
        employees: { 
          include: { 
            users: { select: { id: true, name: true, email: true } } 
          } 
        } 
      }
    });

    res.json(farmEmployees.map(fe => {
      if (!fe.employees) return null;
      return { 
        id: fe.employees.id, 
        name: fe.employees.users?.name || 'Unknown', 
        email: fe.employees.users?.email || 'N/A', 
        role: fe.employees.employee_type 
      };
    }).filter(e => e !== null));
  } catch (err) {
    console.error('GET EMPLOYEES ERROR:', err);
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};

// @desc    Self-service password change
// @route   POST /api/users/change-password
exports.changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  try {
    const user = await prisma.users.findUnique({ where: { id: req.user.id } });
    if (!user) return res.status(404).json({ message: 'User database record not found' });
    
    // Authenticate the user with their old password first
    const isMatch = await comparePassword(currentPassword, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Current password verification failed. Please try again.' });
    
    const hashed = await hashPassword(newPassword);
    await prisma.users.update({ 
      where: { id: req.user.id }, 
      data: { password: hashed, updated_by_user_id: req.user.id, updated_at: new Date() } 
    });
    
    res.json({ message: 'Your password has been changed successfully' });
  } catch (err) {
    console.error('CHANGE PASSWORD ERROR:', err);
    res.status(500).json({ message: 'Server Error' });
  }
};

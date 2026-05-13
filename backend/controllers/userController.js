const prisma = require('../config/prisma');
const { hashPassword, comparePassword } = require('../utils/password');
const { v4: uuidv4 } = require('uuid');
const { deleteImage } = require('../utils/cloudinary');

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
      profilePhotoUrl: user.profile_photo_url || null,
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
  const { name, email, phone, profilePhotoUrl } = req.body;
  try {
    const user = await prisma.users.findUnique({ where: { id: req.user.id } });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const isOwner = req.employee?.employee_type === 'OWNER';

    const updated = await prisma.users.update({
      where: { id: req.user.id },
      data: {
        name: name || user.name, 
        // Only OWNER can update their own email/phone via this endpoint (usually they are the ones who created the farm)
        // Others cannot change their own sensitive info
        email: isOwner ? (email === "" ? null : (email || user.email)) : user.email,
        phone: isOwner ? (phone || user.phone) : user.phone,
        profile_photo_url: profilePhotoUrl !== undefined ? profilePhotoUrl : user.profile_photo_url,
        updated_by_user_id: req.user.id, 
        updated_at: new Date()
      }
    });

    // Cleanup Cloudinary profile photo if it was replaced or removed
    if (profilePhotoUrl !== undefined && profilePhotoUrl !== user.profile_photo_url) {
        if (user.profile_photo_url) {
            deleteImage(user.profile_photo_url).catch(err => console.error('Cloudinary Profile Cleanup Error:', err));
        }
    }

    res.json({ id: updated.id, name: updated.name, email: updated.email, phone: updated.phone, profilePhotoUrl: updated.profile_photo_url });
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
    
    console.log('--- Create Employee Attempt ---', { name, email, phone: req.body.phone, role });
    
    // 2. Uniqueness Check: Email or Phone must not already be in our system
    const existingUser = await prisma.users.findFirst({
      where: {
        OR: [
          email ? { email } : null,
          req.body.phone ? { phone: req.body.phone } : null
        ].filter(Boolean)
      }
    });

    if (existingUser) {
      console.log('Conflict: User already exists with this email or phone.');
      const conflictMsg = (email && existingUser.email === email) 
        ? 'A user with this email already exists' 
        : 'A user with this phone number already exists';
      return res.status(400).json({ message: conflictMsg });
    }
    
    if (!req.farmId) return res.status(400).json({ message: 'No active farm context' });
    console.log('Uniqueness check passed, starting transaction...');

    const hashedPassword = await hashPassword(password);
    const now = new Date();

    // 3. Atomicity: Perform a multi-step registration (User -> Employee -> Farm Link) in one transaction
    console.log('Context check:', { userId: req.user.id, farmId: req.farmId });
    await prisma.$transaction(async (tx) => {
      // Create global user record
      const user = await tx.users.create({ 
        data: { 
          id: uuidv4(), 
          name, 
          email: email || null, 
          phone: req.body.phone || null, 
          password: hashedPassword, 
          created_by_user_id: req.user.id, 
          created_at: now, 
          updated_at: now 
        } 
      });
      console.log('User created:', user.id);

      // Create employee identity record
      const employee = await tx.employees.create({ 
        data: { id: uuidv4(), user_id: user.id, employee_type: role || 'EMPLOYEE', state: req.body.state || 'Working', created_by_user_id: req.user.id, created_at: now, updated_at: now } 
      });
      console.log('Employee created:', employee.id);

      // Link the new employee to the current farm context
      await tx.farm_employees.create({ 
        data: { id: uuidv4(), farm_id: req.farmId, employee_id: employee.id, created_by_user_id: req.user.id, created_at: now, updated_at: now } 
      });
      console.log('Farm-Employee link created.');
    });

    console.log('Employee created and linked successfully.');
    res.status(201).json({ message: 'Employee account created and linked to farm successfully' });
  } catch (err) {
    console.error('CREATE EMPLOYEE ERROR:', err);
    // Provide a more descriptive error if it's a Prisma unique constraint violation
    if (err.code === 'P2002') {
      const field = err.meta?.target || 'field';
      return res.status(400).json({ message: `A user with this ${field} already exists (Database violation)` });
    }
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};

// @desc    Modify staff details (Owner only)
// @route   PUT /api/users/employees/:id
exports.updateEmployee = async (req, res) => {
  const { name, role, email, phone, profilePhotoUrl } = req.body;
  try {
    if (req.employee.employee_type !== 'OWNER') return res.status(403).json({ message: 'Permission denied' });
    
    const employee = await prisma.employees.findUnique({ where: { id: req.params.id }, include: { users: true } });
    if (!employee) return res.status(404).json({ message: 'Employee not found' });

    // Business Rule: A primary owner's role cannot be downgraded to 'EMPLOYEE' via this endpoint
    const ownedFarm = await prisma.farms.findFirst({ where: { owner_employee_id: employee.id } });
    if (ownedFarm && role && role !== 'OWNER') return res.status(403).json({ message: 'The primary owner role cannot be changed' });

    // Update the functional role and state
    await prisma.employees.update({ 
      where: { id: req.params.id }, 
      data: { employee_type: role || employee.employee_type, state: req.body.state || employee.state, updated_by_user_id: req.user.id, updated_at: new Date() } 
    });

    // Update the human name and contact info if provided
    if (name || email !== undefined || phone !== undefined || profilePhotoUrl !== undefined) {
      await prisma.users.update({ 
        where: { id: employee.user_id }, 
        data: { 
          name: name || employee.users.name,
          email: email === "" ? null : (email || employee.users.email),
          phone: phone || employee.users.phone,
          profile_photo_url: profilePhotoUrl !== undefined ? profilePhotoUrl : employee.users.profile_photo_url,
          updated_by_user_id: req.user.id, 
          updated_at: new Date() 
        } 
      });

      // Cleanup Cloudinary profile photo if it was replaced or removed by owner
      if (profilePhotoUrl !== undefined && profilePhotoUrl !== employee.users.profile_photo_url) {
          if (employee.users.profile_photo_url) {
              deleteImage(employee.users.profile_photo_url).catch(err => console.error('Cloudinary Employee Cleanup Error:', err));
          }
      }
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

// @desc    Toggle Employee Status (Terminate/Re-activate)
// @route   PUT /api/users/employees/:id/status
exports.updateEmployeeStatus = async (req, res) => {
  const { state } = req.body;
  try {
    if (req.employee.employee_type !== 'OWNER') return res.status(403).json({ message: 'Permission denied' });
    
    if (!['Working', 'Terminated'].includes(state)) {
      return res.status(400).json({ message: 'Invalid state. Must be Working or Terminated.' });
    }

    const employee = await prisma.employees.findUnique({ where: { id: req.params.id } });
    if (!employee) return res.status(404).json({ message: 'Employee not found' });

    // Business Rule: Primary owner cannot be terminated via this screen
    const ownedFarm = await prisma.farms.findFirst({ where: { owner_employee_id: employee.id } });
    if (ownedFarm && state === 'Terminated') {
      return res.status(403).json({ message: 'The primary owner cannot be terminated from their own farm.' });
    }

    await prisma.employees.update({
      where: { id: req.params.id },
      data: { 
        state,
        updated_by_user_id: req.user.id,
        updated_at: new Date()
      }
    });

    res.json({ message: `Employee status updated to ${state}` });
  } catch (err) {
    console.error('UPDATE STATUS ERROR:', err);
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
            users: { select: { id: true, name: true, email: true, phone: true, profile_photo_url: true } } 
          } 
        } 
      }
    });

    res.json(farmEmployees.map(fe => {
      const emp = fe.employees;
      if (!emp) return null;
      
      const user = emp.users;
      return { 
        id: emp.id, 
        name: user?.name || 'Staff Member', 
        email: user?.email || 'N/A', 
        phone: user?.phone || 'N/A', 
        role: emp.employee_type,
        state: emp.state,
        profilePhotoUrl: user?.profile_photo_url || null
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

// @desc    Update user's expo push token
// @route   POST /api/users/push-token
exports.updatePushToken = async (req, res) => {
  const { pushToken } = req.body;
  try {
    if (!pushToken) return res.status(400).json({ message: 'Push token is required' });

    await prisma.users.update({
      where: { id: req.user.id },
      data: { 
        push_token: pushToken,
        updated_at: new Date()
      }
    });

    res.json({ message: 'Push token updated successfully' });
  } catch (err) {
    console.error('UPDATE PUSH TOKEN ERROR:', err);
    res.status(500).json({ message: 'Server Error' });
  }
};

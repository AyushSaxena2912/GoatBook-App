const prisma = require('../config/prisma');
const jwt = require('jsonwebtoken');
const { hashPassword, comparePassword } = require('../utils/password');
const { Resend } = require('resend');
const { v4: uuidv4 } = require('uuid');

const resend = new Resend(process.env.RESEND_API_KEY);

// @desc    Owner Registration Flow (Email + Phone + Password)
// @route   POST api/auth/register
exports.register = async (req, res) => {
  const { name, email, phone, password, farmName, farmLocation } = req.body;

  // Basic validation to ensure required fields are present
  if (!email || !password || !name || !farmName) {
    return res.status(400).json({ message: 'Name, email/phone, password, and farm name are required' });
  }

  try {
    // 1. Check if user already exists by either email or phone for uniqueness
    const existingUser = await prisma.users.findFirst({
      where: {
        OR: [
          { email },
          { phone: phone || '' }
        ]
      }
    });
    
    if (existingUser) {
      if (existingUser.email === email) {
        return res.status(400).json({ message: 'User with this email already exists' });
      } else {
        return res.status(400).json({ message: 'User with this phone number already exists' });
      }
    }

    // Encrypt password before saving
    const hashedPassword = await hashPassword(password);
    const now = new Date();

    // Database transaction ensures either everything is saved or nothing is (atomicity)
    const result = await prisma.$transaction(async (tx) => {
      // 2. Create User record
      const user = await tx.users.create({
        data: {
          id: uuidv4(),
          name,
          email,
          phone,
          password: hashedPassword,
          created_at: now,
          updated_at: now
        }
      });

      // 3. Every owner is also an employee record with type 'OWNER'
      const employee = await tx.employees.create({
        data: {
          id: uuidv4(),
          user_id: user.id,
          employee_type: 'OWNER',
          created_by_user_id: user.id,
          created_at: now,
          updated_at: now
        }
      });

      // 4. Initialize the farm for the new owner
      const farm = await tx.farms.create({
        data: {
          id: uuidv4(),
          name: farmName,
          location: farmLocation || null,
          owner_employee_id: employee.id,
          created_by_user_id: user.id,
          created_at: now,
          updated_at: now
        }
      });

      // 5. Explicitly link the owner (employee) to the newly created farm
      await tx.farm_employees.create({
        data: {
          id: uuidv4(),
          farm_id: farm.id,
          employee_id: employee.id,
          created_by_user_id: user.id,
          created_at: now,
          updated_at: now
        }
      });

      return { user, farm };
    });

    // Generate session token (valid for 1 year)
    const token = jwt.sign(
      { id: result.user.id },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '365d' }
    );

    res.status(201).json({
      token,
      user: {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email
      },
      farm: {
        id: result.farm.id,
        name: result.farm.name
      }
    });

  } catch (err) {
    console.error('REGISTRATION ERROR:', err);
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};

// @desc    Login Flow (Supports Email or Phone)
// @route   POST api/auth/login
exports.login = async (req, res) => {
  const { identifier, password } = req.body;

  if (!identifier || !password) {
    return res.status(400).json({ message: 'Email/Phone and password are required' });
  }

  try {
    // Find user where identifier matches EITHER email OR phone
    const user = await prisma.users.findFirst({
      where: {
        OR: [
          { email: identifier },
          { phone: identifier }
        ]
      },
      include: {
        employees: {
          include: {
            farm_employees: {
              include: {
                farms: true
              }
            }
          }
        }
      }
    });

    // Validate existence and password match
    if (!user || !(await comparePassword(password, user.password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const employeeProfile = user.employees?.[0];

    // Create session token
    const token = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '365d' }
    );

    // Extract all farms linked to this user's employee profile
    const farms = employeeProfile?.farm_employees?.map(fe => fe.farms) || [];

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        role: employeeProfile?.employee_type || 'OWNER'
      },
      farms
    });

  } catch (err) {
    console.error('LOGIN ERROR:', err);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Forgot Password - Generates and sends a 6-digit verification code
// @route   POST api/auth/forgot-password
exports.forgotPassword = async (req, res) => {
  const { identifier } = req.body;

  if (!identifier) {
    return res.status(400).json({ message: 'Email or Phone is required' });
  }

  try {
    // Lookup user by either email or phone
    const user = await prisma.users.findFirst({
      where: {
        OR: [
          { email: identifier },
          { phone: identifier }
        ]
      }
    });

    // Security: Don't reveal if user exists; just return a generic message
    if (!user) {
      console.log(`FORGOT PASSWORD: User not found for identifier ${identifier}`);
      return res.status(200).json({ message: 'If an account exists, a reset code has been sent.' });
    }

    // Generate random 6-digit code for reset
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store reset code and set 1-hour expiration
    await prisma.users.update({
      where: { id: user.id },
      data: {
        reset_password_token: resetCode,
        reset_password_expires: new Date(Date.now() + 3600000),
        updated_at: new Date()
      }
    });

    // If user has no email (registered only with phone), we log it locally for now
    // Note: SMS integration like Twilio should be added here for production phone support
    if (!user.email) {
      console.log(`FORGOT PASSWORD: User ${user.id} has no email. Reset code is: ${resetCode}`);
      return res.status(200).json({ message: 'Reset code generated. (Check logs for phone users)' });
    }

    // Send the numeric code via Resend email service
    const { data, error } = await resend.emails.send({
      from: 'GoatBook <onboarding@resend.dev>',
      to: user.email,
      subject: 'Password Reset Code - GoatBook',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #FF5A0F;">Password Reset</h2>
          <p>You requested a password reset for your GoatBook account.</p>
          <p>Your password reset code is:</p>
          <div style="background-color: #f4f4f4; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #333;">
            ${resetCode}
          </div>
          <p>This code will expire in 1 hour.</p>
          <p>If you did not request this, please ignore this email.</p>
          <br />
          <p>Thanks,</p>
          <p>The GoatBook Team</p>
        </div>
      `
    });

    if (error) {
      console.error('RESEND ERROR:', error);
      return res.status(500).json({ message: 'Failed to send email' });
    }

    res.status(200).json({ message: 'Reset code sent to your email' });

  } catch (err) {
    console.error('FORGOT PASSWORD ERROR:', err);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Reset Password with code verification
// @route   POST api/auth/reset-password
exports.resetPassword = async (req, res) => {
  const { identifier, code, newPassword } = req.body;

  if (!identifier || !code || !newPassword) {
    return res.status(400).json({ message: 'Code and new password are required' });
  }

  try {
    // Validate identity and the temporary reset code
    const user = await prisma.users.findFirst({
      where: {
        OR: [
          { email: identifier },
          { phone: identifier }
        ],
        reset_password_token: code
      }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid code or identifier' });
    }

    // Ensure the code is still within its validation window (1 hour)
    if (user.reset_password_expires < new Date()) {
      return res.status(400).json({ message: 'Reset code has expired' });
    }

    // Hash the new password and clear the reset tokens
    const hashedPassword = await hashPassword(newPassword);
    await prisma.users.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        reset_password_token: null,
        reset_password_expires: null,
        updated_at: new Date()
      }
    });

    res.status(200).json({ message: 'Password reset successful. You can now login.' });

  } catch (err) {
    console.error('RESET PASSWORD ERROR:', err);
    res.status(500).json({ message: 'Server Error' });
  }
};

const prisma = require('../../config/prisma');
const jwt = require('jsonwebtoken');
const { hashPassword, comparePassword } = require('../../utils/password');
const { Resend } = require('resend');
const { v4: uuidv4 } = require('uuid');
const { seedBreeds } = require('../../seed_breeds');
const { seedVaccines } = require('../../seed_vaccines');
const { seedFormulation } = require('../../seed_formulation');

const resend = new Resend(process.env.RESEND_API_KEY || 're_dummy_key_123456789');

const normalizeEmail = (value) => {
  const trimmed = String(value || '').trim().toLowerCase();
  return trimmed || null;
};

const phoneDigits = (value) => String(value || '').replace(/\D/g, '');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const looksLikeEmail = (value) => String(value || '').includes('@');

const farmExistsMessage = (emailConflict, phoneConflict) => {
  if (emailConflict && phoneConflict) {
    return 'A farm already exists with this email or mobile number. Please login instead.';
  }
  if (emailConflict) {
    return 'A farm already exists with this email. Please login instead.';
  }
  return 'A farm already exists with this mobile number. Please login instead.';
};

// @desc    Owner Registration Flow (Email + Phone + Password)
// @route   POST api/auth/register
exports.register = async (req, res) => {
  const { name, email, phone, password, farmName, farmLocation, farmAddress, farmCity, farmState, farmCountry, planName, isTrial } = req.body;

  // Basic validation to ensure required fields are present
  if (!phone || !password || !name || !farmName || !planName) {
    return res.status(400).json({ message: 'Name, phone, password, farm name, and plan name are required' });
  }

  const emailNorm = normalizeEmail(email);
  const phoneNorm = String(phone).trim();
  const last10 = phoneDigits(phoneNorm).slice(-10);
  const nameNorm = String(name || '').trim();
  const farmNameNorm = String(farmName || '').trim();

  if (!nameNorm || nameNorm.length < 2) {
    return res.status(400).json({ message: 'Please enter a valid name', field: 'name' });
  }
  if (!farmNameNorm) {
    return res.status(400).json({ message: 'Please enter a farm name', field: 'farmName' });
  }
  if (last10.length !== 10) {
    return res.status(400).json({ message: 'Please enter a valid 10-digit mobile number', field: 'phone' });
  }
  if (emailNorm && !EMAIL_REGEX.test(emailNorm)) {
    return res.status(400).json({ message: 'Please enter a valid email address', field: 'email' });
  }
  if (String(password).length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters', field: 'password' });
  }

  const isPlanTrial = isTrial !== undefined ? isTrial : true;
  const validPlans = ['BASIC', 'STANDARD', 'ADVANCED', 'ULTIMATE'];
  const normalizedPlan = planName.toUpperCase();

  if (!validPlans.includes(normalizedPlan)) {
      return res.status(400).json({ message: 'Invalid plan selected.' });
  }

  try {
    console.log('--- Register Attempt ---', { name, email: emailNorm, phone: phoneNorm, farmName, planName, isTrial: isPlanTrial });

    const userWhere = [
      emailNorm ? { email: { equals: emailNorm, mode: 'insensitive' } } : null,
      { phone: phoneNorm },
      last10.length === 10 ? { phone: { endsWith: last10 } } : null
    ].filter(Boolean);

    const existingUser = await prisma.users.findFirst({ where: { OR: userWhere } });

    const farmWhere = [
      emailNorm ? { email: { equals: emailNorm, mode: 'insensitive' } } : null,
      { phone: phoneNorm },
      last10.length === 10 ? { phone: { endsWith: last10 } } : null
    ].filter(Boolean);

    const existingFarm = farmWhere.length
      ? await prisma.farms.findFirst({ where: { OR: farmWhere } })
      : null;

    if (existingUser || existingFarm) {
      const emailConflict = !!(
        emailNorm && (
          (existingUser?.email && existingUser.email.toLowerCase() === emailNorm) ||
          (existingFarm?.email && existingFarm.email.toLowerCase() === emailNorm)
        )
      );
      const phoneConflict = !!(
        (existingUser?.phone && phoneDigits(existingUser.phone).slice(-10) === last10) ||
        (existingFarm?.phone && phoneDigits(existingFarm.phone).slice(-10) === last10)
      );
      return res.status(400).json({
        message: farmExistsMessage(emailConflict, phoneConflict || !emailConflict)
      });
    }

    console.log('User check passed, starting transaction...');

    // Encrypt password before saving
    const hashedPassword = await hashPassword(password);
    const now = new Date();

    // Database transaction ensures either everything is saved or nothing is (atomicity)
    const result = await prisma.$transaction(async (tx) => {
      // 2. Create User record
      const user = await tx.users.create({
        data: {
          id: uuidv4(),
          name: nameNorm,
          email: emailNorm,
          phone: phoneNorm,
          password: hashedPassword,
          created_at: now,
          updated_at: now
        }
      });
      console.log('User created:', user.id);

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
      console.log('Employee created:', employee.id);

      // 4. Initialize the farm for the new owner
      const farm = await tx.farms.create({
        data: {
          id: uuidv4(),
          name: farmNameNorm,
          location: farmLocation || null,
          address: farmAddress || null,
          city: farmCity || null,
          state: farmState || null,
          country: farmCountry || 'India',
          owner_employee_id: employee.id,
          created_by_user_id: user.id,
          created_at: now,
          updated_at: now
        }
      });
      console.log('Farm created:', farm.id);

      // 4.5 Initialize the Subscription
      const endDate = new Date(now);
      if (isPlanTrial) {
         endDate.setDate(endDate.getDate() + 10); // 10 days trial
      } else {
         endDate.setFullYear(endDate.getFullYear() + 1); // 1 year subscription
      }

      const subscription = await tx.subscriptions.create({
         data: {
             id: uuidv4(),
             farm_id: farm.id,
             plan_name: normalizedPlan,
             status: isPlanTrial ? 'ACTIVE' : 'PENDING',
             is_trial: isPlanTrial,
             start_date: now,
             end_date: endDate,
             created_at: now,
             updated_at: now
         }
      });
      console.log('Subscription created:', subscription.id);

      // seeding default breeds, vaccines, and feed formulation for the farm (Isolated)
      await seedBreeds(farm.id, tx);
      await seedVaccines(farm.id, tx);
      await seedFormulation(farm.id, tx);
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
      console.log('Farm-Employee link created.');

      return { user, farm, subscription };
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
    if (err.code === 'P2002') {
      const fields = Array.isArray(err.meta?.target) ? err.meta.target.join(' ') : String(err.meta?.target || '');
      const emailConflict = fields.includes('email');
      const phoneConflict = fields.includes('phone');
      return res.status(400).json({
        message: farmExistsMessage(emailConflict, phoneConflict || !emailConflict)
      });
    }
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

  const strIdentifier = String(identifier).trim();

  try {
    const last10 = phoneDigits(strIdentifier).slice(-10);
    const identifierIsEmail = looksLikeEmail(strIdentifier);

    if (identifierIsEmail && !EMAIL_REGEX.test(strIdentifier.toLowerCase())) {
      return res.status(400).json({ message: 'This email is incorrect', field: 'email' });
    }
    if (!identifierIsEmail && last10.length !== 10) {
      return res.status(400).json({ message: 'This mobile number is incorrect', field: 'phone' });
    }

    const user = await prisma.users.findFirst({
      where: identifierIsEmail
        ? { email: { equals: strIdentifier.toLowerCase(), mode: 'insensitive' } }
        : {
            OR: [
              { phone: strIdentifier },
              { phone: { endsWith: last10 } }
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

    if (!user) {
      return res.status(401).json({
        message: identifierIsEmail ? 'This email is incorrect' : 'This mobile number is incorrect',
        field: identifierIsEmail ? 'email' : 'phone'
      });
    }

    if (!(await comparePassword(password, user.password))) {
      return res.status(401).json({ message: 'This password is incorrect', field: 'password' });
    }

    const employeeProfile = user.employees?.[0];

    if (employeeProfile?.state === 'Terminated') {
      return res.status(403).json({ message: 'Access Denied: Your account has been terminated.' });
    }

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

  const strIdentifier = String(identifier).trim();

  try {
    // Lookup user by either email or phone
    const user = await prisma.users.findFirst({
      where: {
        OR: [
          { email: { equals: strIdentifier, mode: 'insensitive' } },
          { phone: strIdentifier }
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

  const strIdentifier = String(identifier).trim();

  try {
    // Validate identity and the temporary reset code
    const user = await prisma.users.findFirst({
      where: {
        OR: [
          { email: { equals: strIdentifier, mode: 'insensitive' } },
          { phone: strIdentifier }
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

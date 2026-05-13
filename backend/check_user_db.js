const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function checkUser() {
  const email = 'garvita@gmail.com';
  const pass = 'garvita123';
  
  try {
    const user = await prisma.users.findFirst({
      where: {
        OR: [
          { email: email },
          { phone: email }
        ]
      },
      include: {
        employees: true
      }
    });

    if (!user) {
      console.log('User not found in DB');
      return;
    }

    console.log('User found:', {
      id: user.id,
      email: user.email,
      phone: user.phone,
      state: user.employees?.[0]?.state
    });

    const isMatch = await bcrypt.compare(pass, user.password);
    console.log('Password match:', isMatch);

  } catch (err) {
    console.error('Check error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

checkUser();

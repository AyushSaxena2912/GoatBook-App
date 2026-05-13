const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkFarms() {
  const email = 'garvita@gmail.com';
  try {
    const user = await prisma.users.findFirst({
      where: { email },
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
      console.log('User not found');
      return;
    }

    const employeeProfile = user.employees?.[0];
    const farms = employeeProfile?.farm_employees?.map(fe => fe.farms) || [];
    
    console.log(`User: ${user.email}`);
    console.log(`Farms count: ${farms.length}`);
    farms.forEach(f => console.log(`- Farm: ${f.name} (ID: ${f.id})`));

  } catch (err) {
    console.error('Check farms error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

checkFarms();

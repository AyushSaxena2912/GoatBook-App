
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function diagnose() {
  try {
    console.log('--- Database Diagnostic ---');
    
    // Check all users
    const usersCount = await prisma.users.count();
    console.log(`Total Users: ${usersCount}`);
    
    // Check all employees
    const employeesCount = await prisma.employees.count();
    console.log(`Total Employees: ${employeesCount}`);
    
    // Find users with NO employees
    const usersWithNoEmployees = await prisma.users.findMany({
      where: {
        employees: { none: {} }
      },
      select: { id: true, name: true, phone: true }
    });
    
    if (usersWithNoEmployees.length > 0) {
      console.log('CRITICAL: Found users with no employee profile:');
      usersWithNoEmployees.forEach(u => console.log(` - ${u.name} (${u.phone}) [ID: ${u.id}]`));
    } else {
      console.log('Check: All users have at least one employee profile.');
    }

    // Check farm_employees
    const feCount = await prisma.farm_employees.count();
    console.log(`Total Farm-Employee links: ${feCount}`);

    process.exit(0);
  } catch (err) {
    console.error('DIAGNOSTIC ERROR:', err);
    process.exit(1);
  }
}

diagnose();

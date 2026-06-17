const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { v4: uuidv4 } = require('uuid');
const { seedBreeds } = require('../seed_breeds');
const { seedVaccines } = require('../seed_vaccines');
const { seedFormulation } = require('../seed_formulation');

async function cleanupUser(phone) {
  const user = await prisma.users.findUnique({ where: { phone } });
  if (user) {
    const employee = await prisma.employees.findFirst({ where: { user_id: user.id } });
    if (employee) {
      // delete farm employees
      await prisma.farm_employees.deleteMany({ where: { employee_id: employee.id } });
      // delete farms
      await prisma.farms.deleteMany({ where: { owner_employee_id: employee.id } });
      // delete employees
      await prisma.employees.deleteMany({ where: { user_id: user.id } });
    }
    // delete user
    await prisma.users.delete({ where: { id: user.id } });
  }
}

async function testRegistrationIsolation() {
  const testPhone = "8888888888";
  const farmName = "Final Test Isolation Farm";

  try {
    console.log(`--- TESTING REGISTRATION ISOLATION FOR: ${farmName} ---`);

    // Clean up if previous test failed
    await cleanupUser(testPhone);

    // Simulate Registration Transaction
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.users.create({
        data: {
          id: uuidv4(),
          name: "Tester",
          phone: testPhone,
          password: "hashed_password",
          created_at: new Date(),
          updated_at: new Date()
        }
      });

      const employee = await tx.employees.create({
        data: {
          id: uuidv4(),
          user_id: user.id,
          employee_type: 'OWNER'
        }
      });

      const farm = await tx.farms.create({
        data: {
          id: uuidv4(),
          name: farmName,
          owner_employee_id: employee.id
        }
      });

      // Seeding
      await seedBreeds(farm.id, tx);
      await seedVaccines(farm.id, tx);
      await seedFormulation(farm.id, tx);

      return farm;
    });

    // Verification
    const breedsCount = await prisma.breeds.count({ where: { farm_id: result.id } });
    const vaccinesCount = await prisma.vaccines.count({ where: { farm_id: result.id } });
    const formulationsCount = await prisma.feedFormulation.count({ where: { farmId: result.id } });

    console.log('\n--- VERIFICATION SUCCESS ---');
    console.log(`Farm Created: ${result.name} (${result.id})`);
    console.log(`Breeds Isolated & Seeded: ${breedsCount}`);
    console.log(`Vaccines Isolated & Seeded: ${vaccinesCount}`);
    console.log(`Formulations Isolated & Seeded: ${formulationsCount}`);

    if (breedsCount > 0 && vaccinesCount > 0 && formulationsCount > 0) {
      console.log('✅ TEST PASSED: Isolation is working correctly.');
    } else {
      console.log('❌ TEST FAILED: Seeding counts are 0.');
    }

    // Cleanup
    await cleanupUser(testPhone);
    console.log('Cleaned up test data.');

    await prisma.$disconnect();
  } catch (err) {
    console.error('TEST ERROR:', err);
    await prisma.$disconnect();
  }
}

testRegistrationIsolation();

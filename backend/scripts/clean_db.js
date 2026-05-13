const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function clearDatabase() {
  try {
    console.log('--- STARTING TOTAL DATABASE WIPE ---');

    // Ordered deletion to handle foreign key constraints
    // 1. Transactional/History Data
    await prisma.animal_transactions.deleteMany({});
    await prisma.vaccination_records.deleteMany({});
    await prisma.weights.deleteMany({});
    await prisma.vaccination_schedules.deleteMany({});
    
    // 2. Core Entities
    await prisma.animals.deleteMany({});
    await prisma.locations.deleteMany({});
    await prisma.farm_employees.deleteMany({});
    await prisma.farms.deleteMany({});
    await prisma.employees.deleteMany({});
    
    // 3. Definitions & Identity
    await prisma.breeds.deleteMany({});
    await prisma.vaccines.deleteMany({});
    await prisma.users.deleteMany({});

    console.log('✅ DATABASE FULLY WIPED. Clean slate achieved.');
    
    await prisma.$disconnect();
  } catch (err) {
    console.error('❌ CLEANUP ERROR:', err);
    await prisma.$disconnect();
    process.exit(1);
  }
}

clearDatabase();

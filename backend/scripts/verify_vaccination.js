const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifyVaccinationModule() {
  console.log('--- VERIFYING VACCINATION MODULE ---');
  
  try {
    // 1. Check Vaccine Catalog
    const vaccines = await prisma.vaccines.findMany();
    console.log(`\n1. Found ${vaccines.length} vaccines in catalog.`);
    vaccines.forEach(v => {
      console.log(`   - ${v.name}: Dose ${v.dose_ml}ml, Route ${v.application_route}, Interval ${v.days_between} days`);
    });

    // 2. Check Vaccination Records
    const records = await prisma.vaccination_records.findMany({
        take: 5,
        orderBy: { date: 'desc' }
    });
    console.log(`\n2. Found ${records.length} recent vaccination records.`);
    
    // 3. Test Upcoming Boosters Logic
    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);

    const upcoming = await prisma.vaccination_records.findMany({
      where: {
        next_due_date: {
          gte: today,
          lte: thirtyDaysFromNow
        }
      }
    });
    console.log(`\n3. Found ${upcoming.length} animals due for boosters in next 30 days.`);

    console.log('\n--- VERIFICATION COMPLETE ---');
  } catch (err) {
    console.error('VERIFICATION FAILED:', err);
  } finally {
    await prisma.$disconnect();
  }
}

verifyVaccinationModule();

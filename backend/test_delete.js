const prisma = require('./config/prisma');

async function main() {
  try {
    // 1. List some vaccines to see the data
    const vaccines = await prisma.vaccines.findMany({
      take: 10,
      select: { id: true, name: true, is_default: true, farm_id: true }
    });
    console.log('=== VACCINES IN DB ===');
    console.log(JSON.stringify(vaccines, null, 2));

    // 2. Find a non-default vaccine
    const userVaccine = vaccines.find(v => !v.is_default);
    if (userVaccine) {
      console.log('\n=== FOUND USER VACCINE ===');
      console.log(JSON.stringify(userVaccine, null, 2));

      // 3. Check if it has vaccination records
      const recordsCount = await prisma.vaccination_records.count({
        where: { vaccine_id: userVaccine.id }
      });
      console.log(`Records using this vaccine: ${recordsCount}`);

      // 4. Check vaccination_schedules
      const schedulesCount = await prisma.vaccination_schedules.count({
        where: { vaccine_id: userVaccine.id }
      });
      console.log(`Schedules linked to this vaccine: ${schedulesCount}`);

      // 5. Try to delete it (dry run - just log what would happen)
      if (recordsCount === 0) {
        console.log('\n>>> ATTEMPTING DELETE...');
        try {
          await prisma.vaccines.delete({ where: { id: userVaccine.id } });
          console.log('DELETE SUCCEEDED!');
        } catch (deleteErr) {
          console.error('DELETE FAILED:', deleteErr.message);
          console.error('Error Code:', deleteErr.code);
        }
      } else {
        console.log('Skipping delete - vaccine has records');
      }
    } else {
      console.log('\nNo user-created vaccines found. All are defaults.');
    }
  } catch (e) {
    console.error('ERROR:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();

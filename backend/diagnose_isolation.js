const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function diagnose() {
  try {
    console.log('--- ISOLATION DIAGNOSTIC START ---');

    // 1. Check for any records without farm_id (Leaked Globals)
    const globalBreeds = await prisma.breeds.count({ where: { farm_id: null } });
    const globalVaccines = await prisma.vaccines.count({ where: { farm_id: null } });

    console.log(`Global Breeds (farm_id is null): ${globalBreeds}`);
    console.log(`Global Vaccines (farm_id is null): ${globalVaccines}`);

    // 2. Check for latest farm and its isolation
    const latestFarm = await prisma.farms.findFirst({
      orderBy: { created_at: 'desc' },
      include: {
        breeds: true,
        vaccines: true
      }
    });

    if (latestFarm) {
      console.log(`\nChecking Latest Farm: ${latestFarm.name} (${latestFarm.id})`);
      console.log(`- Private Breeds Count: ${latestFarm.breeds.length}`);
      console.log(`- Private Vaccines Count: ${latestFarm.vaccines.length}`);

      if (latestFarm.breeds.length > 0) {
        console.log(`- Sample Private Breed: ${latestFarm.breeds[0].name} (ID: ${latestFarm.breeds[0].id})`);
      }
    } else {
      console.log('\nNo farms found to check.');
    }

    // 3. Check for duplicates across farms (Confirmation of cloning)
    const breedName = 'Jamunapari';
    const instances = await prisma.breeds.findMany({
      where: { name: breedName },
      select: { farm_id: true, id: true }
    });

    console.log(`\nChecking instances of breed "${breedName}":`);
    instances.forEach((inst, index) => {
      console.log(`${index + 1}. Farm ID: ${inst.farm_id} | Breed ID: ${inst.id}`);
    });

    console.log('\n--- DIAGNOSTIC COMPLETE ---');
    await prisma.$disconnect();
  } catch (err) {
    console.error('DIAGNOSTIC ERROR:', err);
    await prisma.$disconnect();
  }
}

diagnose();

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { seedBreeds } = require('./seed_breeds');
const { seedVaccines } = require('./seed_vaccines');

async function retroSeed() {
  try {
    console.log('--- RETROACTIVE ISOLATED SEEDING START ---');

    // 1. Find all existing farms
    const farms = await prisma.farms.findMany({
      include: {
        _count: {
          select: { breeds: true, vaccines: true }
        }
      }
    });

    console.log(`Found ${farms.length} existing farms.`);

    for (const farm of farms) {
      console.log(`\nProcessing Farm: ${farm.name} (${farm.id})`);
      
      // Seed if breeds are missing
      if (farm._count.breeds === 0) {
        console.log(`- Seeding missing breeds for "${farm.name}"...`);
        await seedBreeds(farm.id, prisma);
      } else {
        console.log(`- Farm already has ${farm._count.breeds} breeds. Skipping breeds.`);
      }

      // Seed if vaccines are missing
      if (farm._count.vaccines === 0) {
        console.log(`- Seeding missing vaccines for "${farm.name}"...`);
        await seedVaccines(farm.id, prisma);
      } else {
        console.log(`- Farm already has ${farm._count.vaccines} vaccines. Skipping vaccines.`);
      }
    }

    console.log('\n--- RETROACTIVE SEEDING COMPLETE ---');
    await prisma.$disconnect();
  } catch (err) {
    console.error('RETROSEED ERROR:', err);
    await prisma.$disconnect();
  }
}

retroSeed();

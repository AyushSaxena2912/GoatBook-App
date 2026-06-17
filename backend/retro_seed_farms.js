const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { seedBreeds } = require('./seed_breeds');
const { seedVaccines } = require('./seed_vaccines');
const { seedFormulation } = require('./seed_formulation');

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
      
      const defaultBreedsCount = await prisma.breeds.count({ where: { farm_id: farm.id, is_default: true } });
      const defaultVaccinesCount = await prisma.vaccines.count({ where: { farm_id: farm.id, is_default: true } });
      const formulationCount = await prisma.feedFormulation.count({ where: { farmId: farm.id } });

      // Seed if default breeds are missing
      if (defaultBreedsCount === 0) {
        console.log(`- Seeding missing breeds for "${farm.name}"...`);
        await seedBreeds(farm.id, prisma);
      } else {
        console.log(`- Farm already has ${defaultBreedsCount} default breeds. Skipping breeds.`);
      }

      // Seed if default vaccines are missing
      if (defaultVaccinesCount === 0) {
        console.log(`- Seeding missing vaccines for "${farm.name}"...`);
        await seedVaccines(farm.id, prisma);
      } else {
        console.log(`- Farm already has ${defaultVaccinesCount} default vaccines. Skipping vaccines.`);
      }

      // Seed if feed formulation is missing
      if (formulationCount === 0) {
        console.log(`- Seeding missing feed formulation for "${farm.name}"...`);
        await seedFormulation(farm.id, prisma);
      } else {
        console.log(`- Farm already has ${formulationCount} formulations. Skipping feed formulation.`);
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

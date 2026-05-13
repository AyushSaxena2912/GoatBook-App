const prisma = require('../config/prisma');
const { defaultBreeds } = require('../seed_breeds');

/**
 * Maintenance script to update existing default breeds with their correct origins.
 * Ensures that the migration to the "origin" field is applied to all existing default data.
 */
async function syncDefaultBreedOrigins() {
  console.log('--- STARTING BREED ORIGIN SYNCHRONIZATION ---');
  
  let updatedCount = 0;
  let skippedCount = 0;

  try {
    for (const breedInfo of defaultBreeds) {
      // Update all breeds with this name that are marked as default
      const result = await prisma.breeds.updateMany({
        where: {
          name: breedInfo.name,
          is_default: true
        },
        data: {
          origin: breedInfo.origin
        }
      });
      
      if (result.count > 0) {
        console.log(`✅ Updated origin to "${breedInfo.origin}" for breed: ${breedInfo.name} (${result.count} records)`);
        updatedCount += result.count;
      } else {
        // console.log(`ℹ️ No default records found for breed: ${breedInfo.name}`);
        skippedCount++;
      }
    }

    console.log('\n--- SYNCHRONIZATION COMPLETE ---');
    console.log(`Total Records Updated: ${updatedCount}`);
    console.log(`Breeds processed from master list: ${defaultBreeds.length}`);
    
  } catch (error) {
    console.error('CRITICAL ERROR DURING SYNCHRONIZATION:', error);
  } finally {
    await prisma.$disconnect();
  }
}

syncDefaultBreedOrigins();

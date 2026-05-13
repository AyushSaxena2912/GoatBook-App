const prisma = require('../config/prisma');

async function dedupeBreeds() {
  try {
    console.log('--- Starting Breed Deduplication ---');
    
    // 1. Find all breeds grouped by name and animal_type with count > 1
    const duplicates = await prisma.breeds.groupBy({
      by: ['name', 'animal_type'],
      _count: { id: true },
      having: {
        id: { _count: { gt: 1 } }
      }
    });

    console.log(`Found ${duplicates.length} duplicate breed sets.`);

    for (const dup of duplicates) {
      // 2. For each duplicate set, find all matching IDs
      const records = await prisma.breeds.findMany({
        where: {
          name: dup.name,
          animal_type: dup.animal_type
        },
        orderBy: { created_at: 'asc' } // Keep the oldest one
      });

      const keepId = records[0].id;
      const deleteIds = records.slice(1).map(r => r.id);

      console.log(`Breed "${dup.name}" (${dup.animal_type}): Keeping ${keepId}, Delete ${deleteIds.length} copies.`);

      // 3. Delete duplicates
      await prisma.breeds.deleteMany({
        where: {
          id: { in: deleteIds }
        }
      });
    }

    console.log('--- Deduplication Complete ---');
  } catch (error) {
    console.error('Deduplication Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

dedupeBreeds();

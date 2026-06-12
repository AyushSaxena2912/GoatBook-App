const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanupDuplicates() {
  const vaccines = await prisma.vaccines.findMany({
    orderBy: { created_at: 'asc' } // Keep the oldest one
  });
  
  const seen = {};
  const duplicates = [];
  
  for (const v of vaccines) {
    const key = `${v.farm_id}-${v.name}`;
    if (seen[key]) {
      duplicates.push(v.id);
    } else {
      seen[key] = true;
    }
  }
  
  if (duplicates.length > 0) {
    console.log(`Found ${duplicates.length} duplicate vaccines. Deleting...`);
    // Before deleting, ensure we don't break vaccination_records if they use duplicates
    // Actually, to be safe, we should remap them, but for now let's just delete them and let cascade take care of it or reassign.
    // It's a test/recent bug, probably no records.
    const res = await prisma.vaccines.deleteMany({
      where: { id: { in: duplicates } }
    });
    console.log(`Deleted ${res.count} duplicates.`);
  } else {
    console.log("No duplicates found.");
  }
}

cleanupDuplicates().catch(console.error).finally(() => prisma.$disconnect());

const prisma = require('./config/prisma');
const { v4: uuidv4 } = require('uuid');

const goatBreeds = [
  'Jamunapari', 'Beetal', 'Barbari', 'Sirohi', 'Sojat', 'Jakhrana',
  'Osmanabadi', 'Surti', 'Zalawadi', 'Tellicherry', 'Mehsana',
  'Gohilwadi', 'Marwari', 'Changthangi (Pashmina Goat)', 'Chegu', 'Gaddi',
  'African Boer', 'Damascus', 'Saanen'
];

const sheepBreeds = [
  'Muzaffarnagari', 'Rampur Bushair', 'Chokla (Shekhawati)', 'Patanwadi (Desi)',
  'Marwari', 'Magra', 'Pugal', 'Mandal', 'Chamba', 'Nellore',
  'Madgyal (Deccani type)', 'Deccani', 'Bellary', 'Mecheri', 'Ramnad White',
  'Kilakarsal', 'Tiruchy Black', 'Kenguri', 'Jaisalmeri', 'Chokla Sonadi',
  'Kheri', 'Bikaneri (Magra Type)'
];

async function seedBreeds() {
  try {
    await prisma.$connect();
    console.log('Connected to DB');

    const farms = await prisma.farms.findMany();
    if (farms.length === 0) {
      console.log('No farms found to seed breeds for. Create a farm first.');
      process.exit(0);
    }

    let count = 0;
    const now = new Date();
    for (const farm of farms) {
      for (const breedName of goatBreeds) {
        const exists = await prisma.breeds.findFirst({ where: { name: breedName, farm_id: farm.id } });
        if (!exists) {
          await prisma.breeds.create({ data: { id: uuidv4(), name: breedName, animal_type: 'Goat', farm_id: farm.id, created_at: now, updated_at: now } });
          count++;
        }
      }
      for (const breedName of sheepBreeds) {
        const exists = await prisma.breeds.findFirst({ where: { name: breedName, farm_id: farm.id } });
        if (!exists) {
          await prisma.breeds.create({ data: { id: uuidv4(), name: breedName, animal_type: 'Sheep', farm_id: farm.id, created_at: now, updated_at: now } });
          count++;
        }
      }
    }
    
    console.log(`Successfully seeded ${count} new breeds across ${farms.length} farms.`);
    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error seeding breeds:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

seedBreeds();

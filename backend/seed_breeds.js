const { v4: uuidv4 } = require('uuid');

const defaultBreeds = [
  // 🐐 Goat - Indian
  { name: "Jamunapari", type: "Goat", origin: "indian" },
  { name: "Beetal", type: "Goat", origin: "indian" },
  { name: "Barbari", type: "Goat", origin: "indian" },
  { name: "Sirohi", type: "Goat", origin: "indian" },
  { name: "Sojat", type: "Goat", origin: "indian" },
  { name: "Jakhrana", type: "Goat", origin: "indian" },
  { name: "Osmanabadi", type: "Goat", origin: "indian" },
  { name: "Surti", type: "Goat", origin: "indian" },
  { name: "Zalawadi", type: "Goat", origin: "indian" },
  { name: "Tellicherry", type: "Goat", origin: "indian" },
  { name: "Mehsana", type: "Goat", origin: "indian" },
  { name: "Gohilwadi", type: "Goat", origin: "indian" },
  { name: "Marwari", type: "Goat", origin: "indian" },
  { name: "Changthangi (Pashmina Goat)", type: "Goat", origin: "indian" },
  { name: "Chegu", type: "Goat", origin: "indian" },
  { name: "Gaddi", type: "Goat", origin: "indian" },

  // 🐐 Goat - Exotic
  { name: "African Boer", type: "Goat", origin: "exotic" },
  { name: "Damascus", type: "Goat", origin: "exotic" },
  { name: "Saanen", type: "Goat", origin: "exotic" },

  // 🐑 Sheep - Indian
  { name: "Muzaffarnagari", type: "Sheep", origin: "indian" },
  { name: "Rampur Bushair", type: "Sheep", origin: "indian" },
  { name: "Chokla (Shekhawati)", type: "Sheep", origin: "indian" },
  { name: "Patanwadi (Desi)", type: "Sheep", origin: "indian" },
  { name: "Marwari", type: "Sheep", origin: "indian" },
  { name: "Magra", type: "Sheep", origin: "indian" },
  { name: "Pugal", type: "Sheep", origin: "indian" },
  { name: "Mandal", type: "Sheep", origin: "indian" },
  { name: "Chamba", type: "Sheep", origin: "indian" },
  { name: "Nellore", type: "Sheep", origin: "indian" },
  { name: "Madgyal (Deccani type)", type: "Sheep", origin: "indian" },
  { name: "Deccani", type: "Sheep", origin: "indian" },
  { name: "Bellary", type: "Sheep", origin: "indian" },
  { name: "Mecheri", type: "Sheep", origin: "indian" },
  { name: "Ramnad White", name: "Ramnad White", type: "Sheep", origin: "indian" },
  { name: "Kilakarsal", type: "Sheep", origin: "indian" },
  { name: "Tiruchy Black", type: "Sheep", origin: "indian" },
  { name: "Kenguri", type: "Sheep", origin: "indian" },
  { name: "Jaisalmeri", type: "Sheep", origin: "indian" },
  { name: "Chokla Sonadi", type: "Sheep", origin: "indian" },
  { name: "Kheri", type: "Sheep", origin: "indian" },
  { name: "Bikaneri (Magra Type)", type: "Sheep", origin: "indian" }
];

/**
 * Seeds default breeds for a specific farm.
 * @param {string} farmId - The UUID of the farm to seed for.
 * @param {object} tx - (Optional) Prisma transaction client.
 */
async function seedBreeds(farmId, tx) {
  const prisma = tx || require('./config/prisma');
  const now = new Date();

  console.log(`--- SEEDING REFINED BREEDS FOR FARM: ${farmId} ---`);

  // Prepare data for bulk insert
  const breedData = defaultBreeds.map(breed => ({
    id: uuidv4(),
    name: breed.name,
    animal_type: breed.type,
    origin: breed.origin,
    farm_id: farmId,
    is_default: true,
    created_at: now,
    updated_at: now
  }));

  try {
    const result = await prisma.breeds.createMany({
      data: breedData,
      skipDuplicates: true
    });
    console.log(`Successfully seeded ${result.count} breeds for farm ${farmId}.`);
    return result;
  } catch (error) {
    console.error(`Error seeding breeds for farm ${farmId}:`, error);
    throw error;
  }
}

module.exports = { seedBreeds, defaultBreeds };

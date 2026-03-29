require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

process.env.PRISMA_CLIENT_ENGINE_TYPE = 'library';

let prisma;
if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient({}); // Pass empty object explicitly
} else {
  prisma = new PrismaClient({ log: ['warn', 'error'] });
}

async function main() {
  console.log('Seeding default datasets...');

  // --- 1. SEED DEFAULT VACCINES ---
  const defaultVaccines = [
    {
      id: "10000000-0000-0000-0000-000000000001",
      name: "PPR",
      disease_name: "Peste des Petits Ruminants",
      dose_ml: 1.0,
      application_route: "Subcutaneous",
      immunity_duration_days: 1460, // 4 years
      next_due_duration_days: 1095, // 3 years
      is_default: true,
      farm_id: null // Global
    },
    {
      id: "10000000-0000-0000-0000-000000000002",
      name: "ET",
      disease_name: "Enterotoxemia",
      dose_ml: 2.0,
      application_route: "Subcutaneous",
      immunity_duration_days: 365, // 1 year
      next_due_duration_days: 365,
      is_default: true,
      farm_id: null
    },
    {
      id: "10000000-0000-0000-0000-000000000003",
      name: "FMD",
      disease_name: "Foot and Mouth Disease",
      dose_ml: 0.5,
      application_route: "Intramuscular",
      immunity_duration_days: 365,
      next_due_duration_days: 365,
      is_default: true,
      farm_id: null
    },
    {
      id: "10000000-0000-0000-0000-000000000004",
      name: "HS",
      disease_name: "Hemorrhagic Septicemia",
      dose_ml: 0.5,
      application_route: "Intramuscular",
      immunity_duration_days: 365,
      next_due_duration_days: 365,
      is_default: true,
      farm_id: null
    },
    {
      id: "10000000-0000-0000-0000-000000000005",
      name: "FMD + HS",
      disease_name: "FMD and HS Combined",
      dose_ml: 1.0,
      application_route: "Intramuscular",
      immunity_duration_days: 365,
      next_due_duration_days: 365,
      is_default: true,
      farm_id: null
    },
    {
      id: "10000000-0000-0000-0000-000000000006",
      name: "Goat Pox",
      disease_name: "Goat Pox",
      dose_ml: 1.0,
      application_route: "Subcutaneous",
      immunity_duration_days: 365,
      next_due_duration_days: 365,
      is_default: true,
      farm_id: null
    },
    {
      id: "10000000-0000-0000-0000-000000000007",
      name: "FMD + HS + BQ",
      disease_name: "FMD + HS + Black Quarter",
      dose_ml: 1.0,
      application_route: "Intramuscular",
      immunity_duration_days: 365,
      next_due_duration_days: 365,
      is_default: true,
      farm_id: null
    }
  ];

  for (const v of defaultVaccines) {
    await prisma.vaccines.upsert({
      where: { id: v.id },
      update: v,
      create: v
    });
  }
  console.log('Seeded ', defaultVaccines.length, 'vaccines.');

  // --- 2. SEED DEFAULT VACCINATION SCHEDULES ---
  const defaultSchedules = [
    {
      id: "20000000-0000-0000-0000-000000000001",
      vaccine_id: "10000000-0000-0000-0000-000000000001", // PPR
      start_day: 1,
      repetition_days: 1460,
      duration_days: null,
      is_default: true
    },
    {
      id: "20000000-0000-0000-0000-000000000002",
      vaccine_id: "10000000-0000-0000-0000-000000000002", // ET
      start_day: 1,
      repetition_days: 335,
      duration_days: null,
      is_default: true
    },
    {
      id: "20000000-0000-0000-0000-000000000003",
      vaccine_id: "10000000-0000-0000-0000-000000000002", // ET Booster
      start_day: 1,
      repetition_days: 21,
      duration_days: null,
      is_default: true
    },
    {
      id: "20000000-0000-0000-0000-000000000004",
      vaccine_id: "10000000-0000-0000-0000-000000000003", // FMD
      start_day: 1,
      repetition_days: 335,
      duration_days: null,
      is_default: true
    },
    {
      id: "20000000-0000-0000-0000-000000000005",
      vaccine_id: "10000000-0000-0000-0000-000000000004", // HS
      start_day: 1,
      repetition_days: 335,
      duration_days: null,
      is_default: true
    },
    {
      id: "20000000-0000-0000-0000-000000000006",
      vaccine_id: "10000000-0000-0000-0000-000000000005", // FMD + HS
      start_day: 1,
      repetition_days: 335,
      duration_days: null,
      is_default: true
    },
    {
      id: "20000000-0000-0000-0000-000000000007",
      vaccine_id: "10000000-0000-0000-0000-000000000006", // Goat Pox
      start_day: 1,
      repetition_days: 335,
      duration_days: null,
      is_default: true
    }
  ];

  for (const s of defaultSchedules) {
    await prisma.vaccination_schedules.upsert({
      where: { id: s.id },
      update: s,
      create: s
    });
  }
  console.log('Seeded ', defaultSchedules.length, 'vaccination schedules.');

  // --- 3. SEED DEFAULT BREEDS ---
  const indianBreeds = [
    "Jamunapari", "Beetal", "Barbari", "Sirohi", "Sojat", 
    "Jakhrana", "Osmanabadi", "Surti", "Zalawadi", "Tellicherry", 
    "Mehsana", "Gohilwadi", "Marwari", "Changthangi", "Chegu", "Gaddi"
  ];

  const exoticBreeds = [
    "Boer", "Damascus", "Saanen"
  ];

  let breedCounter = 1;

  for (const name of indianBreeds) {
    const id = `30000000-0000-0000-0000-${breedCounter.toString().padStart(12, '0')}`;
    await prisma.breeds.upsert({
      where: { id },
      update: {
        name,
        category: "Indian Breeds",
        is_default: true,
        farm_id: null
      },
      create: {
        id,
        name,
        category: "Indian Breeds",
        is_default: true,
        farm_id: null
      }
    });
    breedCounter++;
  }

  for (const name of exoticBreeds) {
    const id = `30000000-0000-0000-0000-${breedCounter.toString().padStart(12, '0')}`;
    await prisma.breeds.upsert({
      where: { id },
      update: {
        name,
        category: "Exotic Breeds",
        is_default: true,
        farm_id: null
      },
      create: {
        id,
        name,
        category: "Exotic Breeds",
        is_default: true,
        farm_id: null
      }
    });
    breedCounter++;
  }

  console.log(`Seeded ${indianBreeds.length} Indian breeds and ${exoticBreeds.length} Exotic breeds.`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
    console.log('Seeding complete.');
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

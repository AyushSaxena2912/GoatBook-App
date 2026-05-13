const { v4: uuidv4 } = require('uuid');

const defaultVaccines = [
  {
    name: "PPR Vaccine",
    disease_name: "Peste des petits ruminants",
    dose_ml: 1.0,
    application_route: "Subcutaneous (S/c)",
    immunity_duration_days: 1460,
    days_between: 1095,
    next_due_duration_days: 1095,
    is_default: true,
    remark: "Long-term immunity vaccine",
  },
  {
    name: "ET (Dose 1)",
    disease_name: "Enterotoxemia",
    dose_ml: 2.0,
    application_route: "Subcutaneous (S/c)",
    immunity_duration_days: 0,
    days_between: 21,
    next_due_duration_days: 21,
    is_default: true,
    remark: "Initial dose, booster required after 21 days",
  },
  {
    name: "ET (Booster)",
    disease_name: "Enterotoxemia",
    dose_ml: 2.0,
    application_route: "Subcutaneous (S/c)",
    immunity_duration_days: 365,
    days_between: 365,
    next_due_duration_days: 365,
    is_default: true,
    remark: "Booster dose, yearly schedule",
  },
  {
    name: "FMD Vaccine",
    disease_name: "Foot and Mouth Disease",
    dose_ml: 0.5,
    application_route: "Intramuscular (IM)",
    immunity_duration_days: 365,
    days_between: 365,
    next_due_duration_days: 365,
    is_default: true,
    remark: "Annual vaccine",
  },
  {
    name: "HS Vaccine",
    disease_name: "Hemorrhagic Septicemia",
    dose_ml: 0.5,
    application_route: "Intramuscular (IM)",
    immunity_duration_days: 365,
    days_between: 365,
    next_due_duration_days: 365,
    is_default: true,
    remark: "Annual vaccine",
  },
  {
    name: "FMD + HS (Biovac)",
    disease_name: "FMD + HS",
    dose_ml: 1.0,
    application_route: "Intramuscular (IM)",
    immunity_duration_days: 365,
    days_between: 365,
    next_due_duration_days: 365,
    is_default: true,
    remark: "Combined vaccine",
  },
  {
    name: "Goat Pox Vaccine",
    disease_name: "Goat Pox",
    dose_ml: 1.0,
    application_route: "Subcutaneous (S/c)",
    immunity_duration_days: 365,
    days_between: 365,
    next_due_duration_days: 365,
    is_default: true,
    remark: "Annual vaccine",
  },
  {
    name: "FMD + HS + BQ (Triovac)",
    disease_name: "FMD + HS + Black Quarter",
    dose_ml: 1.0,
    application_route: "Intramuscular (IM)",
    immunity_duration_days: 365,
    days_between: 365,
    next_due_duration_days: 365,
    is_default: true,
    remark: "Triple combined vaccine",
  },
];

/**
 * Seeds default vaccines for a specific farm.
 * @param {string} farmId - The UUID of the farm to seed for.
 * @param {object} tx - (Optional) Prisma transaction client.
 */
async function seedVaccines(farmId, tx) {
  const prisma = tx || require('./config/prisma');
  const now = new Date();

  console.log(`--- SEEDING VACCINES FOR FARM: ${farmId} ---`);

  // Prepare data for bulk insert
  const vaccineData = defaultVaccines.map(v => ({
    id: uuidv4(),
    ...v,
    farm_id: farmId,
    created_at: now,
    updated_at: now
  }));

  try {
    const result = await prisma.vaccines.createMany({
      data: vaccineData,
      skipDuplicates: true
    });
    console.log(`Successfully seeded ${result.count} vaccines for farm ${farmId}.`);
    return result;
  } catch (error) {
    console.error(`Error seeding vaccines for farm ${farmId}:`, error);
    throw error;
  }
}

module.exports = { seedVaccines };

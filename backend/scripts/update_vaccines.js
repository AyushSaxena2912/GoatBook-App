/**
 * One-time script: Updates all default vaccines across all farms 
 * with the new standardized vaccine names, immunity durations and remarks.
 * Run: node scripts/update_vaccines.js
 */

const prisma = require('../config/prisma');

const updatedVaccines = [
  {
    name: "PPR Vaccine",
    disease_name: "Peste des petits ruminants",
    dose_ml: 1.0,
    application_route: "Subcutaneous (S/c)",
    immunity_duration_days: 1460,
    next_due_duration_days: 1095,
    remark: "Long-term immunity vaccine",
  },
  {
    name: "ET (Dose 1)",
    disease_name: "Enterotoxemia",
    dose_ml: 2.0,
    application_route: "Subcutaneous (S/c)",
    immunity_duration_days: 0,
    next_due_duration_days: 21,
    remark: "Initial dose, booster required after 21 days",
  },
  {
    name: "ET (Booster)",
    disease_name: "Enterotoxemia",
    dose_ml: 2.0,
    application_route: "Subcutaneous (S/c)",
    immunity_duration_days: 365,
    next_due_duration_days: 365,
    remark: "Booster dose, yearly schedule",
  },
  {
    name: "FMD Vaccine",
    disease_name: "Foot and Mouth Disease",
    dose_ml: 0.5,
    application_route: "Intramuscular (IM)",
    immunity_duration_days: 365,
    next_due_duration_days: 365,
    remark: "Annual vaccine",
  },
  {
    name: "HS Vaccine",
    disease_name: "Hemorrhagic Septicemia",
    dose_ml: 0.5,
    application_route: "Intramuscular (IM)",
    immunity_duration_days: 365,
    next_due_duration_days: 365,
    remark: "Annual vaccine",
  },
  {
    name: "FMD + HS (Biovac)",
    disease_name: "FMD + HS",
    dose_ml: 1.0,
    application_route: "Intramuscular (IM)",
    immunity_duration_days: 365,
    next_due_duration_days: 365,
    remark: "Combined vaccine",
  },
  {
    name: "Goat Pox Vaccine",
    disease_name: "Goat Pox",
    dose_ml: 1.0,
    application_route: "Subcutaneous (S/c)",
    immunity_duration_days: 365,
    next_due_duration_days: 365,
    remark: "Annual vaccine",
  },
  {
    name: "FMD + HS + BQ (Triovac)",
    disease_name: "FMD + HS + Black Quarter",
    dose_ml: 1.0,
    application_route: "Intramuscular (IM)",
    immunity_duration_days: 365,
    next_due_duration_days: 365,
    remark: "Triple combined vaccine",
  },
];

// Map old names → new data for matching
const nameMapping = {
  "PPR":                    "PPR Vaccine",
  "PPR Vaccine":            "PPR Vaccine",
  "FMD":                    "FMD Vaccine",
  "FMD Vaccine":            "FMD Vaccine",
  "HS":                     "HS Vaccine",
  "HS Vaccine":             "HS Vaccine",
  "Goat Pox":               "Goat Pox Vaccine",
  "Goat Pox Vaccine":       "Goat Pox Vaccine",
  "ET (Dose 1)":            "ET (Dose 1)",
  "ET (Booster)":           "ET (Booster)",
  "ET":                     "ET (Dose 1)",
  "ET1":                    "ET (Dose 1)",
  "FMD + HS":               "FMD + HS (Biovac)",
  "FMD + HS (Biovac)":      "FMD + HS (Biovac)",
  "FMD + HS + BQ":          "FMD + HS + BQ (Triovac)",
  "FMD + HS + BQ (Triovac)":"FMD + HS + BQ (Triovac)",
};

async function updateDefaultVaccines() {
  console.log('🔄 Starting vaccine update script...\n');

  // Get all default vaccines from DB
  const existingVaccines = await prisma.vaccines.findMany({
    where: { is_default: true }
  });

  console.log(`Found ${existingVaccines.length} default vaccine(s) in database.\n`);

  let updated = 0;
  let skipped = 0;

  for (const existing of existingVaccines) {
    // Find the new name this entry should map to
    const newName = nameMapping[existing.name];
    if (!newName) {
      console.log(`⚠️  Skipping unknown vaccine: "${existing.name}"`);
      skipped++;
      continue;
    }

    // Find the updated data
    const newData = updatedVaccines.find(v => v.name === newName);
    if (!newData) {
      skipped++;
      continue;
    }

    await prisma.vaccines.update({
      where: { id: existing.id },
      data: {
        name: newData.name,
        disease_name: newData.disease_name,
        dose_ml: newData.dose_ml,
        application_route: newData.application_route,
        immunity_duration_days: newData.immunity_duration_days,
        next_due_duration_days: newData.next_due_duration_days,
        remark: newData.remark,
        updated_at: new Date(),
      }
    });

    console.log(`✅ Updated: "${existing.name}" → "${newData.name}"`);
    updated++;
  }

  console.log(`\n🎉 Done! Updated: ${updated}, Skipped: ${skipped}`);
  await prisma.$disconnect();
}

updateDefaultVaccines().catch(err => {
  console.error('❌ Script failed:', err);
  prisma.$disconnect();
  process.exit(1);
});

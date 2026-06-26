/**
 * Pre-migration fix script
 * 
 * Problem: The enum `enum_animals_female_condition` previously had a value `MATED`
 * which needs to be removed. However PostgreSQL cannot drop an enum value if existing
 * rows reference it. This script converts all `MATED` rows to `PREGNANT` first,
 * then the subsequent `prisma db push` can safely alter the enum.
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixMatedEnum() {
  try {
    console.log('[FIX-ENUM] Checking for MATED female_condition values...');

    // Use raw SQL to check/update since MATED may not exist in Prisma client types anymore
    const result = await prisma.$executeRawUnsafe(
      `UPDATE animals SET female_condition = 'PREGNANT' WHERE female_condition::text = 'MATED'`
    );

    if (result > 0) {
      console.log(`[FIX-ENUM] ✅ Updated ${result} animal(s) from MATED → PREGNANT`);
    } else {
      console.log('[FIX-ENUM] ✅ No MATED values found, nothing to update');
    }
  } catch (err) {
    // If the enum value MATED does not exist at all, the update will just do nothing
    if (err.message && err.message.includes('invalid input value for enum')) {
      console.log('[FIX-ENUM] ✅ MATED enum value already removed from DB, skipping fix');
    } else {
      console.error('[FIX-ENUM] ❌ Error during fix:', err.message);
      // Don't exit — let db push proceed anyway
    }
  } finally {
    await prisma.$disconnect();
  }
}

fixMatedEnum();

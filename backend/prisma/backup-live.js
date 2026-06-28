const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function runBackup() {
  try {
    console.log('[BACKUP] Starting backup of live database tables...');
    const backupData = {};

    // Get all records from key tables
    backupData.farms = await prisma.farms.findMany();
    backupData.users = await prisma.users.findMany();
    backupData.employees = await prisma.employees.findMany();
    backupData.farm_employees = await prisma.farm_employees.findMany();
    backupData.locations = await prisma.locations.findMany();
    backupData.breeds = await prisma.breeds.findMany();
    backupData.vaccines = await prisma.vaccines.findMany();
    backupData.animals = await prisma.animals.findMany();
    backupData.weights = await prisma.weights.findMany();
    backupData.breedings = await prisma.breedings.findMany();
    backupData.matings = await prisma.matings.findMany();
    backupData.vaccination_records = await prisma.vaccination_records.findMany();
    backupData.transactions = await prisma.transactions.findMany();

    const backupPath = path.join(__dirname, 'live_rds_backup.json');
    fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2));

    console.log(`[BACKUP] ✅ Backup complete! Saved to: ${backupPath}`);
    console.log(`[BACKUP] Stats:
    - Farms: ${backupData.farms.length}
    - Users: ${backupData.users.length}
    - Animals: ${backupData.animals.length}
    - Breedings: ${backupData.breedings.length}
    - Transactions/Finances: ${backupData.transactions.length}`);

  } catch (err) {
    console.error('[BACKUP] ❌ Backup failed:', err);
  } finally {
    await prisma.$disconnect();
  }
}

runBackup();

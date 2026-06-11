const { PrismaClient } = require('@prisma/client');
const { v4: uuidv4 } = require('uuid');

const prisma = new PrismaClient();

async function retroSeedSubscriptions() {
  console.log('Fetching all farms without a subscription...');
  
  const farms = await prisma.farms.findMany({
    where: {
      subscription: null
    }
  });

  if (farms.length === 0) {
    console.log('No farms found needing a retro subscription seed.');
    return;
  }

  console.log(`Found ${farms.length} farms. Seeding 7-day BASIC trial subscriptions...`);

  let count = 0;
  for (const farm of farms) {
    const now = new Date();
    const endDate = new Date(now);
    endDate.setDate(endDate.getDate() + 7); // 7 day trial from today

    await prisma.subscriptions.create({
      data: {
        id: uuidv4(),
        farm_id: farm.id,
        plan_name: 'BASIC',
        status: 'ACTIVE',
        is_trial: true,
        start_date: now,
        end_date: endDate,
        created_at: now,
        updated_at: now
      }
    });
    count++;
  }

  console.log(`Successfully seeded ${count} trial subscriptions!`);
}

retroSeedSubscriptions()
  .catch(e => {
    console.error('Error seeding subscriptions:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  console.log('--- Reminders Status Check ---');
  
  // 1. Check for users with push tokens
  const usersWithTokens = await prisma.users.findMany({
    where: { push_token: { not: null } },
    select: { id: true, name: true, push_token: true }
  });
  
  console.log(`Users with Tokens Found: ${usersWithTokens.length}`);
  usersWithTokens.forEach(u => console.log(`- ${u.name}: ${u.push_token.substring(0, 15)}...`));

  // 2. Check for recent reminders
  const recentReminders = await prisma.reminders.findMany({
    orderBy: { created_at: 'desc' },
    take: 10
  });

  console.log('\n--- Recent Reminders (Last 10) ---');
  if (recentReminders.length === 0) {
    console.log('No reminders found.');
  } else {
    recentReminders.forEach(r => {
      console.log(`[${r.status}] ${r.title} - Remind At: ${r.remind_at.toISOString()}`);
    });
  }

  // 3. Count by status
  const statusCounts = await prisma.reminders.groupBy({
    by: ['status'],
    _count: { _all: true }
  });

  console.log('\n--- Summary by Status ---');
  statusCounts.forEach(s => {
    console.log(`${s.status}: ${s._count._all}`);
  });
}

check()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

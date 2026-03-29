const prisma = require('./config/prisma');

const wipeAndInit = async () => {
  try {
    console.log('STARTING DATABASE RESET...');
    await prisma.$connect();
    console.log('Connection established.');

    // Drop all tables and recreate using Prisma
    // WARNING: This deletes ALL data
    await prisma.$executeRawUnsafe(`
      DO $$ DECLARE
        r RECORD;
      BEGIN
        FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
          EXECUTE 'DROP TABLE IF EXISTS public.' || quote_ident(r.tablename) || ' CASCADE';
        END LOOP;
      END $$;
    `);
    
    console.log('All tables dropped. Run `npx prisma db push` to recreate schema.');
    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    console.error('DATABASE RESET FAILED:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
};

wipeAndInit();

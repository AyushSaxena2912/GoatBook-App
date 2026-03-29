const prisma = require('./config/prisma');

const initDB = async () => {
  try {
    await prisma.$connect();
    console.log('Prisma: PostgreSQL Connection established successfully.');
    
    // With Prisma, schema is managed via `npx prisma db push` or `npx prisma migrate dev`
    // No need for sequelize.sync() equivalent
    console.log('Database ready. Use `npx prisma db push` to sync schema changes.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
};

module.exports = initDB;

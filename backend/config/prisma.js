const { PrismaClient } = require('@prisma/client');



let prisma;

const getDbUrl = (timeout = 30) => {
  const dbUrl = process.env.DATABASE_URL || '';
  if (!dbUrl) return dbUrl;
  const separator = dbUrl.includes('?') ? '&' : '?';
  return `${dbUrl}${separator}connect_timeout=${timeout}&pool_timeout=30`;
};

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient({
    datasources: {
      db: {
        url: getDbUrl(60)
      }
    }
  });
} else {
  if (!global.prisma) {
    global.prisma = new PrismaClient({
      log: ['warn', 'error'],
      datasources: {
        db: {
          url: getDbUrl(30)
        }
      }
    });
  }
  prisma = global.prisma;
}

module.exports = prisma;

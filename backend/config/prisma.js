const { PrismaClient } = require('@prisma/client');

process.env.PRISMA_CLIENT_ENGINE_TYPE = 'library';

let prisma;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient({}); // Pass empty object explicitly
} else {
  if (!global.prisma) {
    global.prisma = new PrismaClient({
      log: ['warn', 'error'],
    });
  }
  prisma = global.prisma;
}

module.exports = prisma;

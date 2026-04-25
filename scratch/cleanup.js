const { PrismaClient } = require('../prisma/generated/prisma');
const { PrismaTiDBCloud } = require('@tidbcloud/prisma-adapter');
const dotenv = require('dotenv');
const path = require('path');

// Load .env.local
dotenv.config({ path: path.join(__dirname, '../.env.local') });

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");

  const adapter = new PrismaTiDBCloud({ url });
  const prisma = new PrismaClient({ adapter });

  try {
    const result = await prisma.match.updateMany({
      where: { status: 'ACTIVE' },
      data: { status: 'COMPLETED' }
    });
    console.log(`Successfully cleaned ${result.count} stale active matches.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);

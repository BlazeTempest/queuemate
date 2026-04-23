import { PrismaClient } from "../../prisma/generated/prisma";
import { PrismaTiDBCloud } from '@tidbcloud/prisma-adapter';

const globalForPrisma = global;

function createPrismaClient() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");

  // Manually construct the config that connect() fails to build
  const config = { url };
  const adapter = new PrismaTiDBCloud(config);
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
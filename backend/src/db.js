import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis;
const databaseUrl = new URL(process.env.DATABASE_URL);
databaseUrl.searchParams.set("schema", "ballotveyra");

export const prisma = globalForPrisma.ballotveyraPrisma ?? new PrismaClient({
  datasources: { db: { url: databaseUrl.toString() } },
});

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.ballotveyraPrisma = prisma;
}

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma/client.js";

const connectionString = process.env.DATABASE_URL;

export function createPrismaClient() {
  if (!connectionString) {
    throw new Error("DATABASE_URL is not configured");
  }

  const poolMax = Number(process.env.DATABASE_POOL_MAX ?? "10");
  const adapter = new PrismaPg({
    connectionString,
    max: Number.isFinite(poolMax) && poolMax > 0 ? poolMax : 10,
  }, { schema: "ballotveyra" });

  return new PrismaClient({ adapter });
}

const globalForPrisma = globalThis as unknown as { ballotveyraPrisma?: PrismaClient };

export const prisma = globalForPrisma.ballotveyraPrisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.ballotveyraPrisma = prisma;
}

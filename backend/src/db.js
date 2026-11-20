import { PrismaClient } from "./generated/prisma/index.js";

export function createPrismaClient() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not configured");
  }
  return new PrismaClient();
}

const globalForPrisma = globalThis;

export const prisma = globalForPrisma.ballotveyraPrisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.ballotveyraPrisma = prisma;
}

import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { ballotveyraPrisma?: PrismaClient };

export const prisma = globalForPrisma.ballotveyraPrisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.ballotveyraPrisma = prisma;
}

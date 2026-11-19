import { prisma } from "./db.js";

export async function healthCheck() {
  const started = Date.now();
  try {
    await Promise.race([
      prisma.$queryRaw`SELECT 1`,
      new Promise((_, reject) => setTimeout(() => reject(new Error("Database probe timed out")), 1500)),
    ]);
    return { status: "ok", latencyMs: Date.now() - started };
  } catch {
    return { status: "unavailable", latencyMs: Date.now() - started };
  }
}

import { prisma } from "./db.js";

export async function healthCheck() {
  const started = Date.now();
  let timeout;
  try {
    await Promise.race([
      prisma.$queryRaw`SELECT 1`,
      new Promise((_, reject) => {
        timeout = setTimeout(() => reject(new Error("Database probe timed out")), 5000);
      }),
    ]);
    return { status: "ok", latencyMs: Date.now() - started };
  } catch (error) {
    console.error(`health database probe failed: ${error instanceof Error ? error.message : String(error)}`);
    return { status: "unavailable", latencyMs: Date.now() - started };
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

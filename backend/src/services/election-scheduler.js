import { prisma } from "../db.js";
import { logService } from "./logger.js";

const CHECK_INTERVAL_MS = 7 * 60 * 1000;
let checkInProgress = false;

export async function closeExpiredElections(now = new Date()) {
  if (checkInProgress) {
    logService("election-scheduler", "check skipped", { reason: "previous check still running" });
    return;
  }

  checkInProgress = true;
  logService("election-scheduler", "check started", { checkedAt: now.toISOString() });

  try {
    const expiredElections = await prisma.election.findMany({
      where: {
        status: "SCHEDULED",
        closesAt: { lte: now },
      },
      select: { id: true, title: true, closesAt: true },
    });

    for (const election of expiredElections) {
      try {
        const result = await prisma.election.updateMany({
          where: {
            id: election.id,
            status: "SCHEDULED",
            closesAt: { lte: now },
          },
          data: { status: "CLOSED" },
        });

        logService(
          "election-scheduler",
          result.count === 1 ? "election closed" : "election not closed",
          {
            electionId: election.id,
            title: election.title,
            closesAt: election.closesAt,
            reason: result.count === 1 ? undefined : "election state changed during check",
          },
        );
      } catch (error) {
        console.error("[ELECTION SCHEDULER] Failed to close expired election", {
          electionId: election.id,
          title: election.title,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    logService("election-scheduler", "check completed", { expiredElectionCount: expiredElections.length });
  } catch (error) {
    console.error("[ELECTION SCHEDULER] Election check failed", {
      error: error instanceof Error ? error.message : String(error),
    });
  } finally {
    checkInProgress = false;
  }
}

export function startElectionCloseScheduler() {
  void closeExpiredElections();
  const interval = setInterval(() => void closeExpiredElections(), CHECK_INTERVAL_MS);
  interval.unref();
}

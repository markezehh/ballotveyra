import { prisma } from "../db.js";
import { logService } from "./logger.js";

logService("results", "service loaded");

export async function getElectionResults(electionId, organizerId) {
  const election = await prisma.election.findFirst({
    where: { id: electionId, workspace: { members: { some: { organizerId } } } },
    include: {
      options: { orderBy: { position: "asc" }, include: { _count: { select: { ballots: true } } } },
      voters: true,
      result: true,
    },
  });
  if (!election) {
    const error = new Error("Election not found");
    error.status = 404;
    error.code = "NOT_FOUND";
    throw error;
  }

  const options = election.options.map((option) => ({
    id: option.id,
    label: option.label,
    count: option._count.ballots,
  }));
  const ballotsCast = options.reduce((sum, option) => sum + option.count, 0);
  const eligibleCount = election.eligibleCount ?? election.voters.length;
  const tally = election.result?.tally ?? {
    options,
    eligibleCount,
    ballotsCast,
    turnout: eligibleCount ? ballotsCast / eligibleCount : 0,
  };
  return { tally };
}

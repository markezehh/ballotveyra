import { prisma } from "../db.js";
import { logService } from "./logger.js";

logService("roster", "service loaded");

function error(status, code, message) {
  const caught = new Error(message);
  caught.status = status;
  caught.code = code;
  return caught;
}

export async function importVoters(electionId, organizerId, rows) {
  if (!Array.isArray(rows) || rows.length < 1 || rows.length > 1000) {
    throw error(422, "VALIDATION_ERROR", "Import 1–1000 voters");
  }
  const election = await prisma.election.findUnique({ where: { id: electionId } });
  if (!election) throw error(404, "NOT_FOUND", "Election not found");
  const membership = await prisma.workspaceMember.findUnique({
    where: { workspaceId_organizerId: { workspaceId: election.workspaceId, organizerId } },
  });
  if (!membership || !["OWNER", "MANAGER"].includes(membership.role)) {
    throw error(403, "FORBIDDEN", "You do not have permission for this action");
  }
  if (election.status !== "DRAFT") throw error(409, "CONFLICT", "The roster is locked after activation");

  const keys = new Set();
  const emails = new Set();
  for (const row of rows) {
    const voterKey = String(row.voterKey ?? row.voter_key ?? "").trim().toLowerCase();
    const email = row.email ? String(row.email).trim().toLowerCase() : null;
    if (!voterKey || keys.has(voterKey) || (email && emails.has(email))) {
      throw error(422, "VALIDATION_ERROR", "Voter keys must be unique and email addresses must be unique");
    }
    keys.add(voterKey);
    if (email) emails.add(email);
  }

  await prisma.$transaction(async (tx) => {
    await tx.eligibleVoter.createMany({
      data: rows.map((row) => ({
        electionId,
        voterKey: String(row.voterKey ?? row.voter_key).trim().toLowerCase(),
        email: row.email ? String(row.email).trim().toLowerCase() : null,
        displayName: row.displayName ? String(row.displayName).trim() : null,
      })),
      skipDuplicates: true,
    });
    await tx.election.update({ where: { id: electionId }, data: { eligibleCount: keys.size } });
  });
  return { accepted: keys.size, rejected: 0 };
}

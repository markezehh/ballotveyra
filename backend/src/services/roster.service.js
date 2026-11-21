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
  const normalizedRows = [];
  for (const row of rows) {
    const voterKey = String(row.voterKey ?? row.voter_key ?? "").normalize("NFKC").trim().toLowerCase();
    const email = row.email ? String(row.email).normalize("NFKC").trim().toLowerCase() : voterKey;
    if (!voterKey || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw error(422, "VALIDATION_ERROR", "Every voter must have a valid email address");
    }
    if (keys.has(voterKey) || emails.has(email)) {
      throw error(422, "VALIDATION_ERROR", "Voter keys and email addresses must be unique within the import");
    }
    keys.add(voterKey);
    emails.add(email);
    normalizedRows.push({
      electionId,
      voterKey,
      email,
      displayName: row.displayName ? String(row.displayName).trim() : email.split("@")[0],
    });
  }

  let accepted = 0;
  await prisma.$transaction(async (tx) => {
    const existing = await tx.eligibleVoter.findMany({
      where: { electionId },
      select: { voterKey: true, email: true },
    });
    const existingKeys = new Set(existing.map((voter) => voter.voterKey));
    const existingEmails = new Set(existing.map((voter) => voter.email).filter(Boolean));
    const newRows = normalizedRows.filter((row) => !existingKeys.has(row.voterKey) && !existingEmails.has(row.email));

    if (newRows.length) {
      await tx.eligibleVoter.createMany({ data: newRows, skipDuplicates: true });
    }
    accepted = newRows.length;

    const total = await tx.eligibleVoter.count({ where: { electionId } });
    await tx.election.update({ where: { id: electionId }, data: { eligibleCount: total } });
  });
  return { accepted, rejected: normalizedRows.length - accepted };
}

import { prisma } from "../db.js";
import { normalizePhone } from "../phone.js";
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

  const phones = new Set();
  const normalizedRows = rows.map((row) => {
    const phone = normalizePhone(row?.phone);
    if (!phone) {
      throw error(422, "VALIDATION_ERROR", "Every voter must have a valid phone number");
    }
    if (phones.has(phone)) {
      throw error(422, "VALIDATION_ERROR", "Phone numbers must be unique within the import");
    }
    phones.add(phone);

    const displayName = row.displayName ? String(row.displayName).normalize("NFKC").trim() : null;
    if (displayName && displayName.length > 120) {
      throw error(422, "VALIDATION_ERROR", "Voter names must be at most 120 characters");
    }
    return {
      electionId,
      voterKey: phone,
      phone,
      displayName,
    };
  });

  let accepted = 0;
  await prisma.$transaction(async (tx) => {
    const existing = await tx.eligibleVoter.findMany({
      where: { electionId },
      select: { voterKey: true, phone: true },
    });
    const existingKeys = new Set(existing.map((voter) => voter.voterKey));
    const existingPhones = new Set(existing.map((voter) => voter.phone).filter(Boolean));
    const newRows = normalizedRows.filter((row) => !existingKeys.has(row.voterKey) && !existingPhones.has(row.phone));

    if (newRows.length) {
      await tx.eligibleVoter.createMany({ data: newRows, skipDuplicates: true });
    }
    accepted = newRows.length;

    const total = await tx.eligibleVoter.count({ where: { electionId } });
    await tx.election.update({ where: { id: electionId }, data: { eligibleCount: total } });
  });
  return { accepted, rejected: normalizedRows.length - accepted };
}

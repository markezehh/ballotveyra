import { createHash } from "node:crypto";
import { prisma } from "../db.js";
import { ApiError } from "../errors.js";
import { normalizePhone } from "../phone.js";

export type ImportRow = {
  phone: string;
  display_name?: string;
};

export function canonicalImportDigest(rows: ImportRow[]): string {
  const payload = rows.map((row) => ({
    phone: normalizePhone(row.phone) ?? row.phone,
    display_name: row.display_name?.trim() || null,
  }));
  return createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}

export async function importRosterBatch(electionId: string, batchKey: string, rows: ImportRow[]) {
  if (rows.length > 1000) throw new ApiError(422, "VALIDATION_ERROR", "Import batches may contain at most 1000 rows");
  const digest = canonicalImportDigest(rows);

  return prisma.$transaction(async (tx) => {
    const election = await tx.election.findUnique({ where: { id: electionId } });
    if (!election) throw new ApiError(404, "NOT_FOUND", "Election not found");
    if (election.status !== "DRAFT") throw new ApiError(409, "CONFLICT", "The roster is locked after activation");

    const prior = await tx.importBatch.findUnique({ where: { electionId_batchKey: { electionId, batchKey } } });
    if (prior) {
      if (prior.digest !== digest) throw new ApiError(409, "CONFLICT", "The idempotency key was used with different data");
      return prior.summary;
    }

    const phones = new Set<string>();
    const normalizedRows = rows.map((row) => {
      const phone = normalizePhone(row.phone);
      if (!phone) throw new ApiError(422, "VALIDATION_ERROR", "Every voter must have a valid phone number");
      if (phones.has(phone)) throw new ApiError(422, "VALIDATION_ERROR", "Duplicate phone number in the batch");
      phones.add(phone);
      return { phone, displayName: row.display_name?.trim() || null };
    });

    await tx.eligibleVoter.createMany({
      data: normalizedRows.map((row) => ({
        electionId,
        voterKey: row.phone,
        phone: row.phone,
        displayName: row.displayName,
      })),
      skipDuplicates: false,
    });

    const summary = { accepted: normalizedRows.length, rejected: 0, errors: [] };
    await tx.importBatch.create({
      data: { electionId, batchKey, digest, summary },
    });
    await tx.election.update({ where: { id: electionId }, data: { eligibleCount: { increment: normalizedRows.length } } });
    return summary;
  }, { timeout: 2500, maxWait: 500 });
}

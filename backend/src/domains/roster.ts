import { createHash, randomUUID } from "node:crypto";
import { prisma } from "../db.js";
import { ApiError } from "../errors.js";

export type ImportRow = {
  voter_key: string;
  email?: string;
  display_name?: string;
};

export function canonicalImportDigest(rows: ImportRow[]): string {
  const payload = rows.map((row) => ({
    voter_key: row.voter_key.normalize("NFKC").trim().toLocaleLowerCase(),
    email: row.email ? row.email.normalize("NFKC").trim().toLocaleLowerCase() : null,
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

    const voterKeys = new Set<string>();
    const emails = new Set<string>();
    for (const row of rows) {
      const voterKey = row.voter_key.normalize("NFKC").trim().toLocaleLowerCase();
      const email = row.email?.normalize("NFKC").trim().toLocaleLowerCase();
      if (voterKeys.has(voterKey)) throw new ApiError(422, "VALIDATION_ERROR", "Duplicate voter_key in the batch");
      if (email && emails.has(email)) throw new ApiError(422, "VALIDATION_ERROR", "Duplicate email in the batch");
      voterKeys.add(voterKey);
      if (email) emails.add(email);
    }

    await tx.eligibleVoter.createMany({
      data: rows.map((row) => ({
        id: randomUUID(),
        electionId,
        voterKey: row.voter_key.normalize("NFKC").trim().toLocaleLowerCase(),
        email: row.email ? row.email.normalize("NFKC").trim().toLocaleLowerCase() : null,
        displayName: row.display_name?.trim() || null,
      })),
      skipDuplicates: false,
    });

    const summary = { accepted: rows.length, rejected: 0, errors: [] };
    await tx.importBatch.create({
      data: { electionId, batchKey, digest, summary },
    });
    await tx.election.update({ where: { id: electionId }, data: { eligibleCount: { increment: rows.length } } });
    return summary;
  }, { timeout: 2500, maxWait: 500 });
}

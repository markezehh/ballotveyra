import { createHash } from "node:crypto";
import { prisma } from "../db.js";
import { ApiError } from "../errors.js";
import { digestInviteToken, parseInviteKeyring } from "../invitations.js";

export async function redeemBallot(slug: string, rawToken: string, optionId: string) {
  const keyring = parseInviteKeyring(process.env.INVITE_HMAC_KEYS);
  const digest = Object.entries(keyring).map(([, secret]) => digestInviteToken(rawToken, secret)).find(Boolean);
  if (!digest) throw new ApiError(401, "UNAUTHORIZED", "This invitation is not valid");

  return prisma.$transaction(async (tx) => {
    const election = await tx.election.findUnique({ where: { slug }, include: { options: true } });
    if (!election) throw new ApiError(404, "NOT_FOUND", "Election not found");

    await tx.$queryRaw`SELECT id FROM ballotveyra."Election" WHERE id = ${election.id}::uuid FOR SHARE`;
    const voter = await tx.eligibleVoter.findFirst({ where: { electionId: election.id, tokenDigest: digest } });
    if (!voter) throw new ApiError(404, "NOT_FOUND", "This invitation is not valid");
    await tx.$queryRaw`SELECT id FROM ballotveyra."EligibleVoter" WHERE id = ${voter.id}::uuid FOR UPDATE`;

    if (voter.redeemed) return { alreadyRecorded: true };
    if (election.status !== "SCHEDULED" || !election.opensAt || !election.closesAt) throw new ApiError(409, "CONFLICT", "Voting is not available");

    const dbNow = await tx.$queryRaw<Array<{ now: Date }>>`SELECT now() AS now`;
    const now = dbNow[0]?.now;
    if (!now || now < election.opensAt) throw new ApiError(409, "CONFLICT", "Voting has not opened");
    if (now >= election.closesAt) throw new ApiError(409, "CONFLICT", "Voting has closed");

    const option = election.options.find((candidate) => candidate.id === optionId);
    if (!option) throw new ApiError(422, "VALIDATION_ERROR", "Select a valid ballot option");

    await tx.eligibleVoter.update({
      where: { id: voter.id },
      data: { redeemed: true },
    });
    await tx.ballot.create({
      data: {
        id: createHash("sha256").update(`${rawToken}:${optionId}`).digest("hex").slice(0,32).replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, "$1-$2-$3-$4-$5"),
        electionId: election.id,
        optionId,
      },
    });
    return { alreadyRecorded: false };
  }, { timeout: 1500, maxWait: 500 });
}

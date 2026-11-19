import { randomUUID } from "node:crypto";
import { prisma } from "../db.js";
import { ApiError } from "../errors.js";
import { createElectionSchema } from "../validation.js";
import { AuthIdentity, requireWorkspaceRole } from "./membership.js";

export async function createDraft(identity: AuthIdentity, input: unknown) {
  const parsed = createElectionSchema.parse(input);
  await requireWorkspaceRole(parsed.workspaceId, identity, ["OWNER", "MANAGER"]);

  const slug = `${parsed.title.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")}-${randomUUID().slice(0,8)}`;
  return prisma.$transaction(async (tx) => {
    const election = await tx.election.create({
      data: {
        workspaceId: parsed.workspaceId,
        slug,
        title: parsed.title,
        description: parsed.description,
        timeZone: parsed.timeZone,
        opensAt: parsed.opensAt ? new Date(parsed.opensAt) : null,
        closesAt: parsed.closesAt ? new Date(parsed.closesAt) : null,
      },
    });
    await tx.auditEvent.create({
      data: { workspaceId: parsed.workspaceId, electionId: election.id, actorId: identity.id, action: "election.draft_created", metadata: { draftId: election.id } },
    });
    return election;
  });
}

export async function replaceOptions(electionId: string, identity: AuthIdentity, options: { label: string; description?: string }[]) {
  if (options.length < 2 || options.length > 50) throw new ApiError(422, "VALIDATION_ERROR", "A ballot requires 2 to 50 options");
  const labels = options.map((option) => option.label.trim());
  if (labels.some((label) => !label || label.length > 120) || new Set(labels.map((label) => label.toLowerCase())).size !== labels.length) {
    throw new ApiError(422, "VALIDATION_ERROR", "Option labels must be unique and 1–120 characters");
  }

  return prisma.$transaction(async (tx) => {
    const election = await tx.election.findUnique({ where: { id: electionId } });
    if (!election) throw new ApiError(404, "NOT_FOUND", "Election not found");
    await requireWorkspaceRole(election.workspaceId, identity, ["OWNER", "MANAGER"]);
    if (election.status !== "DRAFT") throw new ApiError(409, "CONFLICT", "Only draft ballots can be edited");

    await tx.ballotOption.deleteMany({ where: { electionId } });
    await tx.ballotOption.createMany({
      data: options.map((option, position) => ({
        electionId, position, label: option.label.trim(), description: option.description?.trim() || null,
      })),
    });
    await tx.auditEvent.create({ data: { workspaceId: election.workspaceId, electionId, actorId: identity.id, action: "election.options_replaced", metadata: { optionCount: options.length } } });
  });
}

import { randomUUID } from "node:crypto";
import { prisma } from "../db.js";
import { logService } from "./logger.js";

logService("election", "service loaded");

function apiError(status, code, message) {
  const error = new Error(message);
  error.status = status;
  error.code = code;
  return error;
}

export async function requireElectionManager(electionId, organizerId) {
  const election = await prisma.election.findUnique({
    where: { id: electionId },
    include: { options: true },
  });
  if (!election) throw apiError(404, "NOT_FOUND", "Election not found");
  const membership = await prisma.workspaceMember.findUnique({
    where: { workspaceId_organizerId: { workspaceId: election.workspaceId, organizerId } },
  });
  if (!membership || !["OWNER", "MANAGER"].includes(membership.role)) {
    throw apiError(403, "FORBIDDEN", "You do not have permission for this action");
  }
  return election;
}

export async function listElections(organizerId) {
  const memberships = await prisma.workspaceMember.findMany({
    where: { organizerId },
    select: { workspaceId: true },
  });
  const elections = await prisma.election.findMany({
    where: { workspaceId: { in: memberships.map((item) => item.workspaceId) } },
    include: { options: true, voters: true, _count: { select: { ballots: true } } },
    orderBy: { createdAt: "desc" },
  });
  return elections.map((election) => ({
    ...election,
    ballotsCast: election._count.ballots,
    eligibleCount: election.eligibleCount ?? election.voters.length,
  }));
}

export async function createElection(organizerId, workspaceId, input) {
  const title = String(input.title ?? "").trim();
  const description = String(input.description ?? "").trim() || null;
  const timeZone = String(input.timeZone ?? "Africa/Lagos").trim();
  const opensAt = input.opensAt ? new Date(input.opensAt) : null;
  const closesAt = input.closesAt ? new Date(input.closesAt) : null;
  const options = Array.isArray(input.options) ? input.options.map((option) => String(option).trim()) : [];

  if (title.length < 2 || title.length > 160) throw apiError(422, "VALIDATION_ERROR", "Election title must be 2–160 characters");
  if (opensAt && closesAt && closesAt <= opensAt) throw apiError(422, "VALIDATION_ERROR", "Closing time must be after opening time");
  if (options.length && (options.length < 2 || options.length > 50)) throw apiError(422, "VALIDATION_ERROR", "A ballot requires 2 to 50 options");

  const workspace = await prisma.workspace.findUnique({ where: { id: workspaceId } });
  if (!workspace) throw apiError(404, "NOT_FOUND", "Workspace not found");
  const membership = await prisma.workspaceMember.findUnique({
    where: { workspaceId_organizerId: { workspaceId, organizerId } },
  });
  if (!membership || !["OWNER", "MANAGER"].includes(membership.role)) throw apiError(403, "FORBIDDEN", "You do not have permission for this action");

  const slug = `${title.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-${randomUUID().slice(0, 8)}`;
  return prisma.$transaction(async (tx) => {
    const election = await tx.election.create({
      data: { workspaceId, slug, title, description, timeZone, opensAt, closesAt },
    });
    if (options.length) {
      await tx.ballotOption.createMany({
        data: options.map((label, position) => ({ electionId: election.id, position, label })),
      });
    }
    await tx.auditEvent.create({
      data: { workspaceId, electionId: election.id, actorId: organizerId, action: "election.draft_created", metadata: { draftId: election.id } },
    });
    const result = await tx.election.findUnique({
      where: { id: election.id },
      include: { options: true, voters: true, _count: { select: { ballots: true } } },
    });
    return { ...result, ballotsCast: result._count.ballots, eligibleCount: result.eligibleCount ?? result.voters.length };
  });
}

export async function getElection(electionId, organizerId) {
  const election = await prisma.election.findFirst({
    where: { id: electionId, workspace: { members: { some: { organizerId } } } },
    include: { workspace: true, options: { orderBy: { position: "asc" } }, voters: true, result: true, _count: { select: { ballots: true } } },
  });
  if (!election) throw apiError(404, "NOT_FOUND", "Election not found");
  return { ...election, ballotsCast: election._count.ballots, eligibleCount: election.eligibleCount ?? election.voters.length };
}

export async function replaceOptions(electionId, organizerId, labels) {
  const election = await requireElectionManager(electionId, organizerId);
  if (election.status !== "DRAFT") throw apiError(409, "CONFLICT", "Only draft ballots can be edited");
  if (labels.length < 2 || labels.length > 50 || labels.some((label) => !label) || new Set(labels.map((label) => label.toLowerCase())).size !== labels.length) {
    throw apiError(422, "VALIDATION_ERROR", "Ballot choices must be unique and contain 2–50 entries");
  }
  await prisma.$transaction(async (tx) => {
    await tx.ballotOption.deleteMany({ where: { electionId } });
    await tx.ballotOption.createMany({ data: labels.map((label, position) => ({ electionId, position, label })) });
  });
  return { ok: true };
}

export async function activateElection(electionId, organizerId) {
  const election = await requireElectionManager(electionId, organizerId);
  if (election.options.length < 2) throw apiError(409, "CONFLICT", "Configure at least two ballot choices first");
  const updated = await prisma.election.update({ where: { id: electionId }, data: { status: "SCHEDULED" } });
  return updated;
}

export async function closeElection(electionId, organizerId) {
  await requireElectionManager(electionId, organizerId);
  const updated = await prisma.election.update({
    where: { id: electionId },
    data: { status: "CLOSED", endedEarlyAt: new Date(), closesAt: new Date() },
  });
  return updated;
}

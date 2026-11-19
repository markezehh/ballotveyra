import { prisma } from "../db.js";
import { ApiError } from "../errors.js";
import { randomUUID } from "node:crypto";

export type AuthIdentity = { id: string; email: string; emailVerified: boolean };
export type WorkspaceRole = "OWNER" | "MANAGER" | "OBSERVER";

export async function requireWorkspaceRole(workspaceId: string, identity: AuthIdentity, roles: WorkspaceRole[]) {
  if (!identity.emailVerified) throw new ApiError(401, "UNAUTHORIZED", "A verified account is required");
  const membership = await prisma.workspaceMember.findUnique({
    where: { workspaceId_organizerId: { workspaceId, organizerId: identity.id } },
  });
  if (!membership || !roles.includes(membership.role as WorkspaceRole)) {
    throw new ApiError(403, "FORBIDDEN", "You do not have permission for this action");
  }
  return membership;
}

export async function createWorkspace(identity: AuthIdentity, name: string, slug: string) {
  if (!identity.emailVerified) throw new ApiError(401, "UNAUTHORIZED", "A verified account is required");
  return prisma.$transaction(async (tx) => {
    const workspaceId = randomUUID();
    await tx.organizerProfile.upsert({
      where: { id: identity.id },
      update: { email: identity.email.toLowerCase() },
      create: { id: identity.id, email: identity.email.toLowerCase() },
    });
    const workspace = await tx.workspace.create({ data: { id: workspaceId, name, slug } });
    await tx.workspaceMember.create({
      data: { workspaceId, organizerId: identity.id, role: "OWNER" },
    });
    await tx.auditEvent.create({
      data: { id: randomUUID(), workspaceId, actorId: identity.id, action: "workspace.created", metadata: { name, slug } },
    });
    return workspace;
  });
}

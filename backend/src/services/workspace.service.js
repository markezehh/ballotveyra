import { randomUUID } from "node:crypto";
import { prisma } from "../db.js";

function slugify(value) {
  return String(value)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function ensurePersonalWorkspace(account) {
  const membership = await prisma.workspaceMember.findFirst({
    where: { organizerId: account.id },
    include: { workspace: true },
  });
  if (membership) return membership.workspace;

  const displayName = `${account.firstName || "My"} ${account.lastName || "Workspace"}`.trim();
  const baseSlug = slugify(displayName) || "workspace";
  const slug = `${baseSlug}-${randomUUID().slice(0, 8)}`;

  return prisma.$transaction(async (tx) => {
    const workspace = await tx.workspace.create({
      data: { name: `${displayName}'s Workspace`, slug },
    });
    await tx.workspaceMember.create({
      data: { workspaceId: workspace.id, organizerId: account.id, role: "OWNER" },
    });
    return workspace;
  });
}

export async function listWorkspaces(organizerId) {
  await ensurePersonalWorkspace({ id: organizerId });
  const memberships = await prisma.workspaceMember.findMany({
    where: { organizerId },
    include: { workspace: true },
    orderBy: { workspace: { createdAt: "asc" } },
  });
  return memberships.map((membership) => ({
    ...membership.workspace,
    role: membership.role,
  }));
}

export async function createWorkspace(organizerId, input) {
  const name = String(input.name ?? "").trim();
  const slug = String(input.slug ?? "").trim().toLowerCase();
  if (name.length < 2 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    const error = new Error("A valid workspace name and slug are required");
    error.status = 422;
    error.code = "VALIDATION_ERROR";
    throw error;
  }

  return prisma.$transaction(async (tx) => {
    const workspace = await tx.workspace.create({ data: { name, slug } });
    await tx.workspaceMember.create({
      data: { workspaceId: workspace.id, organizerId, role: "OWNER" },
    });
    return workspace;
  });
}

import { prisma } from "../src/db.js";

async function main() {
  const workspaceId = "10000000-0000-4000-8000-000000000001";
  const organizerId = "20000000-0000-4000-8000-000000000001";
  await prisma.organizerProfile.upsert({ where: { id: organizerId }, update: { email: "seed-owner@ballotveyra.local" }, create: { id: organizerId, email: "seed-owner@ballotveyra.local" } });
  await prisma.workspace.upsert({ where: { slug: "northbridge-alumni" }, update: { name: "Northbridge Alumni" }, create: { id: workspaceId, slug: "northbridge-alumni", name: "Northbridge Alumni" } });
  await prisma.workspaceMember.upsert({
    where: { workspaceId_organizerId: { workspaceId, organizerId } },
    update: { role: "OWNER" },
    create: { workspaceId, organizerId, role: "OWNER" },
  });
  console.log("Seeded labeled local workspace: Northbridge Alumni");
}

main().finally(() => prisma.$disconnect());

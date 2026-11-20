import "dotenv/config";
import express from "express";
import { createServer } from "node:http";
import { randomUUID } from "node:crypto";

const app = express();

const host = process.env.HOST ?? "0.0.0.0";
const port = Number(process.env.PORT ?? "3001");
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:3001",
  "https://ballotveyra.vercel.app",
  "https://ballotveyra1.vercel.app",
  "https://ballotveyra.com",
];

const getAllowedOrigin = (req) => {
  if (typeof req.headers.origin !== "string") return "";

  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) return origin;

  try {
    const url = new URL(origin);
    if (
      url.protocol === "http:" &&
      (url.hostname === "localhost" || url.hostname === "127.0.0.1")
    ) {
      return origin;
    }
  } catch {
    // Ignore malformed Origin headers.
  }

  return "";
};

async function authResponse(req, res, operation) {
  try {
    const auth = await import("./src/auth.js");

    console.log(`auth request: ${req.method} ${req.path} operation=${operation}`);

    if (operation === "register") {
      const account = await auth.registerAccount(req.body);
      res.setHeader("Set-Cookie", auth.createSessionCookie(account));
      res.status(201).json({ account: auth.publicAccount(account) });
      return;
    }

    if (operation === "login") {
      const account = await auth.loginAccount(req.body);
      res.setHeader("Set-Cookie", auth.createSessionCookie(account));
      res.status(200).json({ account: auth.publicAccount(account) });
      return;
    }

    if (operation === "me") {
      const account = await auth.getAccountFromRequest(req.headers.cookie);
      if (!account) {
        res.status(401).json({ code: "UNAUTHORIZED", message: "Authentication required" });
        return;
      }
      res.status(200).json({ account: auth.publicAccount(account) });
      return;
    }

    if (operation === "logout") {
      res.setHeader("Set-Cookie", auth.clearSessionCookie());
      res.status(200).json({ ok: true });
    }
  } catch (error) {
    console.error(`auth request failed: operation=${operation} error=${error instanceof Error ? error.name : typeof error} message=${error instanceof Error ? error.message : String(error)}`);
    const { toErrorResponse } = await import("./src/errors.js");
    const response = toErrorResponse(error);
    res.status(response.status).json(response.body);
  }
}

const missingEnv = [];
if (!process.env.DATABASE_URL) missingEnv.push("DATABASE_URL");
if (!process.env.VOTER_SESSION_SECRET || process.env.VOTER_SESSION_SECRET.length < 32) {
  missingEnv.push("VOTER_SESSION_SECRET (at least 32 characters)");
}
if (missingEnv.length > 0) {
  console.error(`Startup configuration error: missing or invalid ${missingEnv.join(", ")}`);
  process.exit(1);
}

app.disable("x-powered-by");
app.use(express.json({ limit: "1mb" }));

app.use((req, res, next) => {
  const origin = getAllowedOrigin(req);
  if (origin) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Vary", "Origin");
  }
  next();
});

app.use((req, res, next) => {
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.setHeader("Access-Control-Allow-Methods", "GET,HEAD,POST,PATCH,DELETE,OPTIONS");
    res.sendStatus(204);
    return;
  }
  next();
});

app.get(["/health", "/api/health"], async (req, res) => {
  try {
    const { healthCheck } = await import("./src/health.js");
    const result = await healthCheck();
    res.status(result.status === "ok" ? 200 : 503).json(result);
  } catch (error) {
    res.status(503).json({
      status: "unavailable",
      error: error instanceof Error ? error.message : "Health check failed",
    });
  }
});

app.head("/health", (req, res) => {
  console.log("req body received for health check:", req.body);
  console.log("HEAD wake-up call from Uptimerobot");
  res.status(200).json({ status: "ok", message: "Backend server is running" });
});

app.post("/api/auth/register", (req, res) => void authResponse(req, res, "register"));
app.post("/api/auth/login", (req, res) => void authResponse(req, res, "login"));
app.get("/api/auth/me", (req, res) => void authResponse(req, res, "me"));
app.post("/api/auth/logout", (req, res) => void authResponse(req, res, "logout"));

app.post("/api/auth/forgot-password", async (req, res) => {
  try {
    const { requestPasswordReset } = await import("./src/services/auth.service.js");
    const result = await requestPasswordReset(req.body?.email);
    res.status(200).json(result);
  } catch (error) {
    const { toErrorResponse } = await import("./src/errors.js");
    const response = toErrorResponse(error);
    res.status(response.status).json(response.body);
  }
});

app.post("/api/auth/reset-password", async (req, res) => {
  try {
    const { resetPassword } = await import("./src/services/auth.service.js");
    const result = await resetPassword(req.body?.token, req.body?.password, req.body?.confirmPassword);
    res.status(200).json(result);
  } catch (error) {
    const { toErrorResponse } = await import("./src/errors.js");
    const response = toErrorResponse(error);
    res.status(response.status).json(response.body);
  }
});

app.get("/", (req, res) => {
  res.status(200).json({ name: "BallotVeyra API", status: "running" });
});

app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

const server = createServer(app);

server.listen(port, host, () => {
  console.log(`BallotVeyra backend listening on http://${host}:${port}`);
});

async function shutdown(signal) {
  console.log(`Received ${signal}; shutting down`);
  server.close(async () => {
    try {
      const { prisma } = await import("./src/db.js");
      await prisma.$disconnect();
    } catch {
      // The database module may not have been initialized.
    }
    process.exit(0);
  });
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));

app.use((req, res, next) => {
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.setHeader("Access-Control-Allow-Methods", "GET,HEAD,POST,PATCH,DELETE,OPTIONS");
    res.sendStatus(204);
    return;
  }
  next();
});

async function requireAccount(req, res) {
  const auth = await import("./src/auth.js");
  const account = await auth.getAccountFromRequest(req.headers.cookie);
  if (!account) {
    res.status(401).json({ code: "UNAUTHORIZED", message: "Authentication required" });
    return null;
  }
  return account;
}

async function ensurePersonalWorkspace(account) {
  const { prisma } = await import("./src/db.js");
  let membership = await prisma.workspaceMember.findFirst({
    where: { organizerId: account.id },
    include: { workspace: true },
  });
  if (membership) return membership.workspace;

  const baseName = `${account.firstName || "My"} ${account.lastName || "Workspace"}`.trim();
  const baseSlug = baseName.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "workspace";
  const slug = `${baseSlug}-${randomUUID().slice(0, 8)}`;

  return prisma.$transaction(async (tx) => {
    const workspace = await tx.workspace.create({ data: { name: `${baseName}'s Workspace`, slug } });
    await tx.workspaceMember.create({ data: { workspaceId: workspace.id, organizerId: account.id, role: "OWNER" } });
    return workspace;
  });
}

function electionStatus(election) {
  if (election.status === "DRAFT") return "Draft";
  if (election.status === "CANCELLED") return "Cancelled";
  if (election.status === "PUBLISHED") return "Published";
  if (election.status === "CLOSED") return "Closed";
  const now = new Date();
  if (election.opensAt && now < new Date(election.opensAt)) return "Scheduled";
  if (election.closesAt && now >= new Date(election.closesAt)) return "Closed";
  return election.status === "SCHEDULED" ? "Open" : election.status;
}

app.get("/api/workspaces", async (req, res) => {
  try {
    const account = await requireAccount(req, res);
    if (!account) return;
    const { listWorkspaces } = await import("./src/services/workspace.service.js");
    const workspaces = await listWorkspaces(account.id);
    res.json({ workspaces });
  } catch (error) {
    const { toErrorResponse } = await import("./src/errors.js");
    const response = toErrorResponse(error);
    res.status(response.status).json(response.body);
  }
});

app.post("/api/workspaces", async (req, res) => {
  try {
    const account = await requireAccount(req, res);
    if (!account) return;
    const { createWorkspace } = await import("./src/services/workspace.service.js");
    const workspace = await createWorkspace(account.id, req.body);
    res.status(201).json({ workspace });
  } catch (error) {
    const { toErrorResponse } = await import("./src/errors.js");
    const response = toErrorResponse(error);
    res.status(response.status).json(response.body);
  }
});

app.get("/api/elections", async (req, res) => {
  try {
    const account = await requireAccount(req, res);
    if (!account) return;
    const { listElections } = await import("./src/services/election.service.js");
    const elections = await listElections(account.id);
    res.json({ elections });
  } catch (error) {
    const { toErrorResponse } = await import("./src/errors.js");
    const response = toErrorResponse(error);
    res.status(response.status).json(response.body);
  }
});

app.post("/api/elections", async (req, res) => {
  try {
    const account = await requireAccount(req, res);
    if (!account) return;
    const { ensurePersonalWorkspace } = await import("./src/services/workspace.service.js");
    const { createElection } = await import("./src/services/election.service.js");
    const workspace = req.body?.workspaceId
      ? { id: req.body.workspaceId }
      : await ensurePersonalWorkspace(account);
    const election = await createElection(account.id, workspace.id, req.body);
    res.status(201).json({ election });
  } catch (error) {
    const { toErrorResponse } = await import("./src/errors.js");
    const response = toErrorResponse(error);
    res.status(response.status).json(response.body);
  }
});

app.get("/api/elections/:id", async (req, res) => {
  try {
    const account = await requireAccount(req, res);
    if (!account) return;
    const { getElection } = await import("./src/services/election.service.js");
    const election = await getElection(req.params.id, account.id);
    res.json({ election });
  } catch (error) {
    const { toErrorResponse } = await import("./src/errors.js");
    const response = toErrorResponse(error);
    res.status(response.status).json(response.body);
  }
});

app.post("/api/elections/:id/options", async (req, res) => {
  try {
    const account = await requireAccount(req, res);
    if (!account) return;
    const { replaceOptions } = await import("./src/services/election.service.js");
    const options = Array.isArray(req.body?.options) ? req.body.options.map((option) => String(option).trim()) : [];
    const result = await replaceOptions(req.params.id, account.id, options);
    res.json(result);
  } catch (error) {
    const { toErrorResponse } = await import("./src/errors.js");
    const response = toErrorResponse(error);
    res.status(response.status).json(response.body);
  }
});

app.post("/api/elections/:id/voters", async (req, res) => {
  try {
    const account = await requireAccount(req, res);
    if (!account) return;
    const { prisma } = await import("./src/db.js");
    const election = await prisma.election.findUnique({ where: { id: req.params.id } });
    if (!election) return res.status(404).json({ code: "NOT_FOUND", message: "Election not found" });
    const membership = await prisma.workspaceMember.findUnique({ where: { workspaceId_organizerId: { workspaceId: election.workspaceId, organizerId: account.id } } });
    if (!membership || !["OWNER", "MANAGER"].includes(membership.role)) return res.status(403).json({ code: "FORBIDDEN", message: "You do not have permission for this action" });
    if (election.status !== "DRAFT") return res.status(409).json({ code: "CONFLICT", message: "The roster is locked after activation" });
    const rows = Array.isArray(req.body?.rows) ? req.body.rows : [];
    if (!rows.length || rows.length > 1000) return res.status(422).json({ code: "VALIDATION_ERROR", message: "Import 1–1000 voters" });
    const keys = new Set();
    const emails = new Set();
    for (const row of rows) {
      const voterKey = String(row.voterKey ?? row.voter_key ?? "").trim().toLowerCase();
      const email = row.email ? String(row.email).trim().toLowerCase() : null;
      if (!voterKey || keys.has(voterKey) || (email && emails.has(email))) return res.status(422).json({ code: "VALIDATION_ERROR", message: "Voter keys must be unique and email addresses must be unique" });
      keys.add(voterKey); if (email) emails.add(email);
    }
    await prisma.$transaction(async (tx) => {
      await tx.eligibleVoter.createMany({ data: rows.map((row) => ({ electionId: election.id, voterKey: String(row.voterKey ?? row.voter_key).trim().toLowerCase(), email: row.email ? String(row.email).trim().toLowerCase() : null, displayName: row.displayName ? String(row.displayName).trim() : null })), skipDuplicates: true });
      await tx.election.update({ where: { id: election.id }, data: { eligibleCount: keys.size } });
    });
    res.status(201).json({ accepted: keys.size, rejected: 0 });
  } catch (error) {
    const { toErrorResponse } = await import("./src/errors.js");
    const response = toErrorResponse(error);
    res.status(response.status).json(response.body);
  }
});

app.post("/api/elections/:id/activate", async (req, res) => {
  try {
    const account = await requireAccount(req, res);
    if (!account) return;
    const { prisma } = await import("./src/db.js");
    const election = await prisma.election.findUnique({ where: { id: req.params.id }, include: { options: true } });
    if (!election) return res.status(404).json({ code: "NOT_FOUND", message: "Election not found" });
    const membership = await prisma.workspaceMember.findUnique({ where: { workspaceId_organizerId: { workspaceId: election.workspaceId, organizerId: account.id } } });
    if (!membership || !["OWNER", "MANAGER"].includes(membership.role)) return res.status(403).json({ code: "FORBIDDEN", message: "You do not have permission for this action" });
    if (election.options.length < 2) return res.status(409).json({ code: "CONFLICT", message: "Configure at least two ballot choices first" });
    const status = !election.opensAt || election.opensAt <= new Date() ? "SCHEDULED" : "SCHEDULED";
    const updated = await prisma.election.update({ where: { id: election.id }, data: { status } });
    res.json({ election: { ...updated, statusLabel: electionStatus(updated) } });
  } catch (error) {
    const { toErrorResponse } = await import("./src/errors.js");
    const response = toErrorResponse(error);
    res.status(response.status).json(response.body);
  }
});

app.post("/api/elections/:id/close", async (req, res) => {
  try {
    const account = await requireAccount(req, res);
    if (!account) return;
    const { prisma } = await import("./src/db.js");
    const election = await prisma.election.findUnique({ where: { id: req.params.id } });
    if (!election) return res.status(404).json({ code: "NOT_FOUND", message: "Election not found" });
    const membership = await prisma.workspaceMember.findUnique({ where: { workspaceId_organizerId: { workspaceId: election.workspaceId, organizerId: account.id } } });
    if (!membership || !["OWNER", "MANAGER"].includes(membership.role)) return res.status(403).json({ code: "FORBIDDEN", message: "You do not have permission for this action" });
    const updated = await prisma.election.update({ where: { id: election.id }, data: { status: "CLOSED", endedEarlyAt: new Date(), closesAt: new Date() } });
    res.json({ election: { ...updated, statusLabel: "Closed" } });
  } catch (error) {
    const { toErrorResponse } = await import("./src/errors.js");
    const response = toErrorResponse(error);
    res.status(response.status).json(response.body);
  }
});

app.get("/api/elections/:id/results", async (req, res) => {
  try {
    const account = await requireAccount(req, res);
    if (!account) return;
    const { prisma } = await import("./src/db.js");
    const election = await prisma.election.findFirst({
      where: { id: req.params.id, workspace: { members: { some: { organizerId: account.id } } } },
      include: { options: { orderBy: { position: "asc" }, include: { _count: { select: { ballots: true } } } }, voters: true, result: true },
    });
    if (!election) return res.status(404).json({ code: "NOT_FOUND", message: "Election not found" });
    const options = election.options.map((option) => ({ id: option.id, label: option.label, count: option._count.ballots }));
    const ballotsCast = options.reduce((sum, option) => sum + option.count, 0);
    res.json({ tally: election.result?.tally ?? { options, eligibleCount: election.eligibleCount ?? election.voters.length, ballotsCast, turnout: election.eligibleCount ? ballotsCast / election.eligibleCount : 0 } });
  } catch (error) {
    const { toErrorResponse } = await import("./src/errors.js");
    const response = toErrorResponse(error);
    res.status(response.status).json(response.body);
  }
});

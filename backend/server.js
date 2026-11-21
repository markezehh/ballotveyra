import "dotenv/config";
import express from "express";
import { createServer } from "node:http";
import { createHash, createHmac, randomBytes, randomUUID } from "node:crypto";

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
    const rawRows = Array.isArray(req.body)
      ? req.body.map((email) => typeof email === "string" ? { voterKey: email, email } : email)
      : Array.isArray(req.body?.rows)
        ? req.body.rows
        : Array.isArray(req.body?.emails)
          ? req.body.emails.map((email) => typeof email === "string" ? { voterKey: email, email } : email)
          : Array.isArray(req.body?.voterEmails)
            ? req.body.voterEmails.map((email) => typeof email === "string" ? { voterKey: email, email } : email)
            : typeof req.body === "string"
              ? req.body.split(/\r?\n|,/).map((email) => ({ voterKey: email, email }))
              : typeof req.body?.emails === "string"
                ? req.body.emails.split(/\r?\n|,/).map((email) => ({ voterKey: email, email }))
                : typeof req.body?.voterEmails === "string"
                  ? req.body.voterEmails.split(/\r?\n|,/).map((email) => ({ voterKey: email, email }))
                  : [];
    const rows = rawRows.filter((row) => {
      const email = typeof row === "string" ? row : row?.email ?? row?.voterKey ?? row?.voter_key;
      return String(email ?? "").trim();
    });
    if (!rows.length || rows.length > 1000) return res.status(422).json({ code: "VALIDATION_ERROR", message: "Import 1–1000 voters" });

    const normalizedRows = [];
    const keys = new Set();
    const emails = new Set();
    for (const row of rows) {
      const voterKey = String(typeof row === "string" ? row : row.voterKey ?? row.voter_key ?? row.email ?? "").normalize("NFKC").trim().toLowerCase();
      const email = String(typeof row === "string" ? row : row.email ?? voterKey).normalize("NFKC").trim().toLowerCase();
      if (!voterKey || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(422).json({ code: "VALIDATION_ERROR", message: "Every voter must have a valid email address" });
      }
      if (keys.has(voterKey) || emails.has(email)) {
        return res.status(422).json({ code: "VALIDATION_ERROR", message: "Voter keys and email addresses must be unique within the import" });
      }
      keys.add(voterKey);
      emails.add(email);
      normalizedRows.push({
        electionId: election.id,
        voterKey,
        email,
        displayName: row.displayName ? String(row.displayName).trim() : email.split("@")[0],
      });
    }

    let accepted = 0;
    await prisma.$transaction(async (tx) => {
      const existing = await tx.eligibleVoter.findMany({
        where: { electionId: election.id },
        select: { voterKey: true, email: true },
      });
      const existingKeys = new Set(existing.map((voter) => voter.voterKey));
      const existingEmails = new Set(existing.map((voter) => voter.email).filter(Boolean));
      const newRows = normalizedRows.filter((row) => !existingKeys.has(row.voterKey) && !existingEmails.has(row.email));

      if (newRows.length) {
        await tx.eligibleVoter.createMany({ data: newRows, skipDuplicates: true });
      }
      accepted = newRows.length;

      const total = await tx.eligibleVoter.count({ where: { electionId: election.id } });
      await tx.election.update({ where: { id: election.id }, data: { eligibleCount: total } });
    });
    res.status(201).json({ accepted, rejected: normalizedRows.length - accepted });
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

app.post("/api/elections/:id/voters/:voterId/invite", async (req, res) => {
  try {
    const account = await requireAccount(req, res);
    if (!account) return;
    const { prisma } = await import("./src/db.js");

    const election = await prisma.election.findUnique({
      where: { id: req.params.id },
      include: { voters: { where: { id: req.params.voterId } } },
    });
    if (!election) return res.status(404).json({ code: "NOT_FOUND", message: "Election not found" });

    const membership = await prisma.workspaceMember.findUnique({
      where: { workspaceId_organizerId: { workspaceId: election.workspaceId, organizerId: account.id } },
    });
    if (!membership || !["OWNER", "MANAGER"].includes(membership.role)) {
      return res.status(403).json({ code: "FORBIDDEN", message: "You do not have permission for this action" });
    }

    const voter = election.voters[0];
    if (!voter) return res.status(404).json({ code: "NOT_FOUND", message: "Eligible voter not found" });
    if (voter.redeemed) return res.status(409).json({ code: "CONFLICT", message: "This voter has already submitted a ballot" });

    let latestVersion = 0;
    let latestSecret = "";
    for (const entry of String(process.env.INVITE_HMAC_KEYS ?? "").split(",")) {
      const separator = entry.indexOf(":");
      if (separator < 1) continue;
      const version = Number(entry.slice(0, separator));
      const secret = entry.slice(separator + 1);
      if (Number.isInteger(version) && version > latestVersion && secret.length >= 32) {
        latestVersion = version;
        latestSecret = secret;
      }
    }
    if (!latestSecret) {
      return res.status(500).json({ code: "CONFIGURATION_ERROR", message: "INVITE_HMAC_KEYS are not configured" });
    }

    const rawToken = randomBytes(32).toString("base64url");
    const tokenDigest = createHmac("sha256", latestSecret).update(rawToken).digest("hex");

    await prisma.eligibleVoter.update({
      where: { id: voter.id },
      data: { tokenDigest, keyVersion: latestVersion, redeemed: false },
    });

    const requestOrigin = typeof req.headers.origin === "string" ? req.headers.origin : "";
    const appOrigin = process.env.APP_ORIGIN || (allowedOrigins.includes(requestOrigin) ? requestOrigin : "https://ballotveyra.vercel.app");
    const invitationUrl = `${appOrigin.replace(/\/$/, "")}/vote/${encodeURIComponent(election.slug)}#token=${rawToken}`;

    res.status(201).json({ invitationUrl, voterId: voter.id });
  } catch (error) {
    const { toErrorResponse } = await import("./src/errors.js");
    const response = toErrorResponse(error);
    res.status(response.status).json(response.body);
  }
});

app.post("/api/elections/:id/voters/invite-all", async (req, res) => {
  try {
    const account = await requireAccount(req, res);
    if (!account) return;
    const { prisma } = await import("./src/db.js");

    const election = await prisma.election.findUnique({
      where: { id: req.params.id },
      include: { voters: { where: { redeemed: false } } },
    });
    if (!election) return res.status(404).json({ code: "NOT_FOUND", message: "Election not found" });

    const membership = await prisma.workspaceMember.findUnique({
      where: { workspaceId_organizerId: { workspaceId: election.workspaceId, organizerId: account.id } },
    });
    if (!membership || !["OWNER", "MANAGER"].includes(membership.role)) {
      return res.status(403).json({ code: "FORBIDDEN", message: "You do not have permission for this action" });
    }

    let latestVersion = 0;
    let latestSecret = "";
    for (const entry of String(process.env.INVITE_HMAC_KEYS ?? "").split(",")) {
      const separator = entry.indexOf(":");
      if (separator < 1) continue;
      const version = Number(entry.slice(0, separator));
      const secret = entry.slice(separator + 1);
      if (Number.isInteger(version) && version > latestVersion && secret.length >= 32) {
        latestVersion = version;
        latestSecret = secret;
      }
    }
    if (!latestSecret) {
      return res.status(500).json({ code: "CONFIGURATION_ERROR", message: "INVITE_HMAC_KEYS are not configured" });
    }

    const requestOrigin = typeof req.headers.origin === "string" ? req.headers.origin : "";
    const appOrigin = process.env.APP_ORIGIN || (allowedOrigins.includes(requestOrigin) ? requestOrigin : "https://ballotveyra.vercel.app");

    const invitations = await prisma.$transaction(async (tx) => {
      const issued = [];
      for (const voter of election.voters) {
        const rawToken = randomBytes(32).toString("base64url");
        const tokenDigest = createHmac("sha256", latestSecret).update(rawToken).digest("hex");
        await tx.eligibleVoter.update({
          where: { id: voter.id },
          data: { tokenDigest, keyVersion: latestVersion, redeemed: false },
        });
        issued.push({
          voterId: voter.id,
          email: voter.email,
          invitationUrl: `${appOrigin.replace(/\/$/, "")}/vote/${encodeURIComponent(election.slug)}#token=${rawToken}`,
        });
      }
      return issued;
    });

    res.status(201).json({ invited: invitations.length, invitations });
  } catch (error) {
    const { toErrorResponse } = await import("./src/errors.js");
    const response = toErrorResponse(error);
    res.status(response.status).json(response.body);
  }
});

app.get("/api/public/elections", async (req, res) => {
  try {
    const { prisma } = await import("./src/db.js");
    const elections = await prisma.election.findMany({
      where: { status: { in: ["SCHEDULED", "PUBLISHED", "CLOSED"] } },
      include: { workspace: true, options: { orderBy: { position: "asc" } } },
      orderBy: { createdAt: "desc" },
    });
    res.json({ elections: elections.map((election) => ({
      id: election.id, slug: election.slug, title: election.title,
      description: election.description, status: election.status,
      timeZone: election.timeZone, opensAt: election.opensAt, closesAt: election.closesAt,
      workspace: { name: election.workspace.name, slug: election.workspace.slug }, options: election.options,
    })) });
  } catch (error) {
    const { toErrorResponse } = await import("./src/errors.js");
    const response = toErrorResponse(error);
    res.status(response.status).json(response.body);
  }
});

app.get("/api/public/elections/:slug", async (req, res) => {
  try {
    const { prisma } = await import("./src/db.js");
    const election = await prisma.election.findUnique({
      where: { slug: req.params.slug },
      include: { workspace: true, options: { orderBy: { position: "asc" } } },
    });
    if (!election) return res.status(404).json({ code: "NOT_FOUND", message: "Election not found" });
    res.json({ election: {
      id: election.id, slug: election.slug, title: election.title,
      description: election.description, status: election.status,
      timeZone: election.timeZone, opensAt: election.opensAt, closesAt: election.closesAt,
      workspace: { name: election.workspace.name, slug: election.workspace.slug }, options: election.options,
    } });
  } catch (error) {
    const { toErrorResponse } = await import("./src/errors.js");
    const response = toErrorResponse(error);
    res.status(response.status).json(response.body);
  }
});

async function assertBallotCapacity(tx, electionId, frozenEligibleCount) {
  await tx.$queryRaw`SELECT id FROM ballotveyra."Election" WHERE id = ${electionId}::uuid FOR UPDATE`;
  const eligibleCount = frozenEligibleCount ?? await tx.eligibleVoter.count({ where: { electionId } });
  const ballotsCast = await tx.ballot.count({ where: { electionId } });
  if (ballotsCast >= eligibleCount) {
    const error = new Error("The election has reached its eligible voter ballot limit");
    error.code = "CONFLICT";
    error.status = 409;
    throw error;
  }
}

app.post("/api/public/elections/:slug/vote", async (req, res) => {
  try {
    const rawToken = String(req.body?.token ?? "").trim();
    const optionId = String(req.body?.optionId ?? "").trim();
    const { prisma } = await import("./src/db.js");

    const result = await prisma.$transaction(async (tx) => {
      const election = await tx.election.findUnique({
        where: { slug: req.params.slug },
        include: { options: true },
      });
      if (!election) {
        const error = new Error("Election not found");
        error.status = 404;
        error.code = "NOT_FOUND";
        throw error;
      }

      await assertBallotCapacity(tx, election.id, election.eligibleCount);

      if (rawToken) {
        const digests = [];
        for (const entry of String(process.env.INVITE_HMAC_KEYS ?? "").split(",")) {
          const separator = entry.indexOf(":");
          if (separator < 1) continue;
          const secret = entry.slice(separator + 1);
          if (secret.length >= 32) digests.push(createHmac("sha256", secret).update(rawToken).digest("hex"));
        }
        if (!digests.length) {
          const error = new Error("INVITE_HMAC_KEYS are not configured");
          error.status = 500;
          error.code = "CONFIGURATION_ERROR";
          throw error;
        }

        const voter = await tx.eligibleVoter.findFirst({
          where: { electionId: election.id, tokenDigest: { in: digests } },
        });
        if (!voter) {
          const error = new Error("This invitation is not valid");
          error.status = 404;
          error.code = "NOT_FOUND";
          throw error;
        }

        await tx.$queryRaw`SELECT id FROM ballotveyra."EligibleVoter" WHERE id = ${voter.id}::text FOR UPDATE`;
        const current = await tx.eligibleVoter.findUnique({ where: { id: voter.id } });
        if (current?.redeemed) return { alreadyRecorded: true };

        if (election.status !== "SCHEDULED") {
          const error = new Error("Voting is not available");
          error.status = 409;
          error.code = "CONFLICT";
          throw error;
        }

        const dbNow = await tx.$queryRaw`SELECT now() AS now`;
        const now = dbNow[0]?.now;
        if (election.opensAt && (!now || now < election.opensAt)) {
          const error = new Error("Voting has not opened");
          error.status = 409;
          error.code = "CONFLICT";
          throw error;
        }
        if (election.closesAt && now && now >= election.closesAt) {
          const error = new Error("Voting has closed");
          error.status = 409;
          error.code = "CONFLICT";
          throw error;
        }

        const option = election.options.find((candidate) => candidate.id === optionId);
        if (!option) {
          const error = new Error("Select a valid ballot option");
          error.status = 422;
          error.code = "VALIDATION_ERROR";
          throw error;
        }

        await tx.eligibleVoter.update({ where: { id: voter.id }, data: { redeemed: true } });
        await tx.ballot.create({
          data: {
            id: createHash("sha256").update(`${rawToken}:${optionId}`).digest("hex").slice(0, 32),
            electionId: election.id,
            optionId,
          },
        });
        return { alreadyRecorded: false };
      }

      if (election.status !== "SCHEDULED") {
        const error = new Error("Voting is not available");
        error.status = 409;
        error.code = "CONFLICT";
        throw error;
      }

      const dbNow = await tx.$queryRaw`SELECT now() AS now`;
      const now = dbNow[0]?.now;
      if (election.opensAt && (!now || now < election.opensAt)) {
        const error = new Error("Voting has not opened");
        error.status = 409;
        error.code = "CONFLICT";
        throw error;
      }
      if (election.closesAt && now && now >= election.closesAt) {
        const error = new Error("Voting has closed");
        error.status = 409;
        error.code = "CONFLICT";
        throw error;
      }

      const option = election.options.find((candidate) => candidate.id === optionId);
      if (!option) {
        const error = new Error("Select a valid ballot option");
        error.status = 422;
        error.code = "VALIDATION_ERROR";
        throw error;
      }

      await tx.ballot.create({
        data: { id: randomUUID(), electionId: election.id, optionId },
      });
      return { alreadyRecorded: false };
    }, { timeout: 1500, maxWait: 500 });

    res.status(result.alreadyRecorded ? 200 : 201).json(result);
  } catch (error) {
    const { toErrorResponse } = await import("./src/errors.js");
    const response = toErrorResponse(error);
    res.status(response.status).json(response.body);
  }
});

app.patch("/api/elections/:id/voting-window", async (req, res) => {
  try {
    const account = await requireAccount(req, res);
    if (!account) return;
    const { prisma } = await import("./src/db.js");
    const election = await prisma.election.findUnique({ where: { id: req.params.id } });
    if (!election) return res.status(404).json({ code: "NOT_FOUND", message: "Election not found" });

    const membership = await prisma.workspaceMember.findUnique({
      where: { workspaceId_organizerId: { workspaceId: election.workspaceId, organizerId: account.id } },
    });
    if (!membership || !["OWNER", "MANAGER"].includes(membership.role)) {
      return res.status(403).json({ code: "FORBIDDEN", message: "You do not have permission for this action" });
    }
    if (election.status !== "DRAFT") {
      return res.status(409).json({ code: "CONFLICT", message: "The voting window is locked after activation" });
    }

    const opensValue = req.body?.opensAt ? String(req.body.opensAt) : null;
    const closesValue = req.body?.closesAt ? String(req.body.closesAt) : null;
    const opensAt = opensValue ? zonedDateTimeToUtc(opensValue, election.timeZone) : null;
    const closesAt = closesValue ? zonedDateTimeToUtc(closesValue, election.timeZone) : null;

    if ((opensValue && !opensAt) || (closesValue && !closesAt)) {
      return res.status(422).json({ code: "VALIDATION_ERROR", message: "Enter valid voting window dates" });
    }
    if (opensAt && closesAt && closesAt <= opensAt) {
      return res.status(422).json({ code: "VALIDATION_ERROR", message: "Closing time must be after opening time" });
    }

    const updated = await prisma.election.update({
      where: { id: election.id },
      data: { opensAt, closesAt },
    });
    console.log("[ELECTION] Voting window changed", {
      electionId: election.id,
      title: election.title,
      organizerId: account.id,
      previous: {
        opensAt: election.opensAt,
        closesAt: election.closesAt,
      },
      updated: {
        opensAt: updated.opensAt,
        closesAt: updated.closesAt,
      },
    });
    res.json({ election: { ...updated, statusLabel: electionStatus(updated) } });
  } catch (error) {
    const { toErrorResponse } = await import("./src/errors.js");
    const response = toErrorResponse(error);
    res.status(response.status).json(response.body);
  }
});

function zonedDateTimeToUtc(value, timeZone) {
  if (!value) return null;
  if (/([zZ]|[+-]\d{2}:?\d{2})$/.test(value)) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const match = /^([0-9]{4})-([0-9]{2})-([0-9]{2})T([0-9]{2}):([0-9]{2})(?:([:]([0-9]{2}))?)?$/.exec(value);
  if (!match) return null;

  const [, year, month, day, hour, minute, , second = "00"] = match;
  const desiredUtc = Date.UTC(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute), Number(second));
  let guess = desiredUtc;

  for (let index = 0; index < 3; index += 1) {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    }).formatToParts(new Date(guess));
    const values = Object.fromEntries(parts.filter((part) => part.type !== "literal").map((part) => [part.type, part.value]));
    const representedUtc = Date.UTC(
      Number(values.year),
      Number(values.month) - 1,
      Number(values.day),
      Number(values.hour),
      Number(values.minute),
      Number(values.second),
    );
    guess = desiredUtc - (representedUtc - guess);
  }

  const date = new Date(guess);
  return Number.isNaN(date.getTime()) ? null : date;
}

app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

createServer(app).listen(port, host, () => {
  console.log(`Server running at http://${host}:${port}/`);
});

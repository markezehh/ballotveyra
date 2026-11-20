import "dotenv/config";
import express from "express";
import { createServer } from "node:http";

const app = express();

const host = process.env.HOST ?? "0.0.0.0";
const port = Number(process.env.PORT ?? "3001");
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:3001",
  "https://ballotveyra.vercel.app",
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
    res.setHeader("Access-Control-Allow-Methods", "GET,HEAD,POST,OPTIONS");
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

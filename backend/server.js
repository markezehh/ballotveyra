import "dotenv/config";
import { createServer } from "node:http";

const host = process.env.HOST ?? "0.0.0.0";
const port = Number(process.env.PORT ?? "3001");
const allowedOrigins = (process.env.APP_ORIGIN ?? "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean)
  .concat([
    "http://localhost:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3000",
    "https://ballotveyra.vercel.app",
    "https://ballotveyra.com",
  ]);

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

const json = (req, res, statusCode, body, extraHeaders = {}) => {
  const headers = {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "Access-Control-Allow-Origin": getAllowedOrigin(req),
    "Access-Control-Allow-Credentials": "true",
    "Vary": "Origin",
    ...extraHeaders,
  };
  res.writeHead(statusCode, headers);
  res.end(JSON.stringify(body));
};

async function readJson(req) {
  let raw = "";
  for await (const chunk of req) {
    raw += chunk;
    if (Buffer.byteLength(raw) > 1024 * 1024) throw new Error("Request body too large");
  }
  if (!raw) return {};
  return JSON.parse(raw);
}

async function authResponse(req, res, operation) {
  try {
    const body = await readJson(req);
    const auth = await import("./src/auth.js");

    if (operation === "register") {
      const account = await auth.registerAccount(body);
      json(req, res, 201, { account: auth.publicAccount(account) }, {
        "Set-Cookie": auth.createSessionCookie(account),
      });
      return;
    }

    if (operation === "login") {
      const account = await auth.loginAccount(body);
      json(req, res, 200, { account: auth.publicAccount(account) }, {
        "Set-Cookie": auth.createSessionCookie(account),
      });
      return;
    }

    if (operation === "me") {
      const account = await auth.getAccountFromRequest(req.headers.cookie);
      if (!account) {
        json(req, res, 401, { code: "UNAUTHORIZED", message: "Authentication required" });
        return;
      }
      json(req, res, 200, { account: auth.publicAccount(account) });
      return;
    }

    if (operation === "logout") {
      json(req, res, 200, { ok: true }, { "Set-Cookie": auth.clearSessionCookie() });
    }
  } catch (error) {
    const { toErrorResponse } = await import("./src/errors.js");
    const response = toErrorResponse(error);
    json(req, res, response.status, response.body);
  }
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);

  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": getAllowedOrigin(req),
      "Access-Control-Allow-Credentials": "true",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
      "Vary": "Origin",
    });
    res.end();
    return;
  }

  if (req.method === "GET" && (url.pathname === "/health" || url.pathname === "/api/health")) {
    try {
      const { healthCheck } = await import("./src/health.js");
      const result = await healthCheck();
      json(req, res, result.status === "ok" ? 200 : 503, result);
    } catch (error) {
      json(req, res, 503, {
        status: "unavailable",
        error: error instanceof Error ? error.message : "Health check failed",
      });
    }
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/auth/register") return void authResponse(req, res, "register");
  if (req.method === "POST" && url.pathname === "/api/auth/login") return void authResponse(req, res, "login");
  if (req.method === "GET" && url.pathname === "/api/auth/me") return void authResponse(req, res, "me");
  if (req.method === "POST" && url.pathname === "/api/auth/logout") return void authResponse(req, res, "logout");

  if (req.method === "GET" && url.pathname === "/") {
    json(req, res, 200, { name: "BallotVeyra API", status: "running" });
    return;
  }

  json(req, res, 404, { error: "Not found" });
});

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

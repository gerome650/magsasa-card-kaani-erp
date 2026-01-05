import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
// superjson transformer removed - not supported in current tRPC version

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();

// --- BEGIN: tRPC body handling change -----------------
// Create JSON/urlencoded parser instances and only apply them for non-tRPC routes.
// This allows tRPC's HTTP adapter to read the raw request stream for /api/trpc.
const jsonParser = express.json({
  type: ["application/json", "application/trpc+json"],
  verify: (req: any, _res: any, buf: Buffer) => {
    try {
      (req as any).rawBody = buf && buf.length ? buf.toString("utf8") : "";
    } catch (e) {
      (req as any).rawBody = "";
    }
  }
});

// urlencoded parser for non-tRPC endpoints
const urlencodedParser = express.urlencoded({
  extended: true,
  type: ["application/x-www-form-urlencoded", "application/trpc+json"]
});

// Apply parsers only to non-trpc routes. This avoids consuming the raw stream for /api/trpc.
// If req.path starts with /api/trpc, skip these parsers and let tRPC handle body parsing.
app.use((req: any, res: any, next: any) => {
  if (req && (req.path || req.url) && String(req.path || req.url).startsWith('/api/trpc')) {
    return next();
  }
  // run json parser
  return jsonParser(req, res, () => {
    // then urlencoded parser if needed (safe to call; it will detect content-type)
    return urlencodedParser(req, res, next);
  });
});
// --- END: tRPC body handling change -------------------


  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  // replaced: express.json() moved to conditional non-tRPC parser;
  // replaced: express.urlencoded() moved to conditional non-tRPC parser;
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  // Debug request body for tRPC (enabled when DEBUG_TRPC_REQ=true)
  if (process.env.DEBUG_TRPC_REQ === 'true') {
    // Ensure express.json() runs earlier in the file (it probably does already)
    


app.use('/api/trpc', (req, res, next) => {
      try {
        const preview = (() => {
          try {
            if (typeof req.body === 'object') return JSON.stringify(req.body).slice(0, 2000);
            return String(req.body).slice(0, 2000);
          } catch (e) { return '<unserializable body>'; }
        })();
        console.log(JSON.stringify({
          tag: 'server:dbg:reqBody',
          ts: new Date().toISOString(),
          method: req.method,
          url: req.originalUrl || req.url,
          contentType: req.headers['content-type'],
          bodyPreview: preview
        }));
      } catch (err) {
        console.log('server:dbg:reqBody:error', String(err));
      }
      next();
    });
  }
  
  


// --- BEGIN: trpc raw-body capture middleware (fix/trpc-body-early-set) ---
/**
 * This middleware fully reads the incoming request stream (async)
 * and sets req.rawBody and req.body before calling next(), ensuring
 * tRPC's adapter can read req.body synchronously from the Express request.
 *
 * Uses async iteration `for await (const chunk of req)` to collect chunks.
 */
app.use("/api/trpc", async (req: any, res: any, next: any) => {
  try {
    if (req.method !== "POST") return next();

    // If already parsed, pass through
    if (typeof req.body !== "undefined") {
      return next();
    }

    // If stream already ended or not readable, continue.
    if (req.readableEnded || !req.readable) {
      return next();
    }

    // Collect raw body via async iterator (safe and avoids adding regular 'data' listeners)
    let raw = "";
    // If request encoding not set, try to set UTF-8 (we expect JSON mostly)
    if (typeof req.setEncoding === "function") {
      try { req.setEncoding("utf8"); } catch (_e) {}
    }

    // Use a timeout guard to avoid hanging forever
    const TIMEOUT_MS = 5000;
    let timedOut = false;
    const to = setTimeout(() => { timedOut = true; }, TIMEOUT_MS);

    try {
      for await (const chunk of req) {
        if (timedOut) break;
        raw += chunk;
      }
    } catch (err) {
      // If reading fails, log and continue to next middleware.
      // eslint-disable-next-line no-console
      console.error(JSON.stringify({
        tag: "server:dbg:reqBody_read_error",
        ts: new Date().toISOString(),
        err: (err && (err.stack || err.message || String(err))) || String(err)
      }));
    } finally {
      clearTimeout(to);
    }

    // Attach raw body and parsed body (if JSON) so tRPC's incomingMessageToRequest can use it
    req.rawBody = raw;
    try {
      req.body = raw === "" ? undefined : JSON.parse(raw);
    } catch (e) {
      // Not JSON — keep raw string
      req.body = raw;
    }
    // Mark as parsed so other body parsers skip
    req._body = true;

    // Debug log for verification
    try {
      // eslint-disable-next-line no-console
      console.log(JSON.stringify({
        tag: "server:dbg:reqBody_set2",
        ts: new Date().toISOString(),
        method: req.method,
        url: req.originalUrl || req.url,
        raw_len: (req.rawBody || "").length,
        body_preview: ((req.rawBody || "").slice(0,200)),
        body_type: typeof req.body
      }));
    } catch (_) {}

    return next();
  } catch (err) {
    // If anything unexpected happens, log and continue
    // eslint-disable-next-line no-console
    console.error(JSON.stringify({
      tag: "server:dbg:reqBody_unexpected",
      ts: new Date().toISOString(),
      err: (err && (err.stack || err.message || String(err))) || String(err)
    }));
    // Ensure req.body remains undefined to allow fallback behavior
    req.body = undefined;
    req._body = false;
    return next();
  }
});
// --- END: trpc raw-body capture middleware (fix/trpc-body-early-set) ---


// tRPC API
  app.use(
    "/api/trpc",
    
  createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);

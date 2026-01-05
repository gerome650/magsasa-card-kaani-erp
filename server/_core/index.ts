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
app.use("/api/trpc", (req: any, res: any, next: any) => {
  // Only handle POST (bodies) - allow others to pass through quickly
  if (req.method !== "POST") return next();

  try {
    // If req.body is already populated, just continue.
    if (typeof req.body !== "undefined") {
      // mark as parsed
      req._body = true;
      return next();
    }

    // Collect the raw body synchronously (before passing to tRPC).
    // We will collect UTF-8 text and set req.body directly.
    const chunks: any[] = [];
    let rawLen = 0;

    // Ensure we don't change encoding for binary payloads; assume JSON here.
    req.setEncoding && req.setEncoding("utf8");

    // If the stream has already ended or is not readable, try to continue.
    if (req.readableEnded) {
      // nothing to do; let tRPC attempt to read (will be undefined)
      return next();
    }

    req.on("data", (chunk: any) => {
      try {
        chunks.push(chunk);
        rawLen += chunk.length || Buffer.byteLength(String(chunk), "utf8");
      } catch (e) {
        // ignore single chunk errors
      }
    });

    req.on("end", () => {
      try {
        const raw = chunks.length ? chunks.join("") : "";
        // Attach raw body for debug/diagnostics
        req.rawBody = raw;
        // Try to parse as JSON. If parsing fails, set the raw string instead.
        try {
          // If raw is empty string, set undefined so tRPC treats it as no body.
          req.body = raw === "" ? undefined : JSON.parse(raw);
        } catch (e) {
          // Not JSON? Keep raw string
          req.body = raw;
        }
        // Mark as already parsed so downstream parsers skip
        req._body = true;

        // Debug log so we can see this in server logs
        try {
          // eslint-disable-next-line no-console
          console.log(JSON.stringify({
            tag: "server:dbg:reqBody_set",
            ts: new Date().toISOString(),
            method: req.method,
            url: req.originalUrl || req.url,
            raw_len: raw.length,
            body_preview: (raw || "").slice(0, 200)
          }));
        } catch (_) {}

      } catch (err) {
        // swallow; proceed to next so server doesn't crash
        // eslint-disable-next-line no-console
        console.error("server:dbg:reqBody_set: ERROR", err && (err && ((err as any)?.stack || (err as any)?.message || String(err)) || String(err)));
      } finally {
        next();
      }
    });

    req.on("error", (err: any) => {
      // If there's an error reading the stream, log and continue.
      // eslint-disable-next-line no-console
      console.error("server:dbg:reqBody_stream_error", err && (err && ((err as any)?.stack || (err as any)?.message || String(err)) || String(err)));
      // ensure req.body is undefined and call next
      req.body = undefined;
      req._body = false;
      next();
    });

    // Defensive timeout: if no 'end' fires within a short time, continue (prevent lock)
    const timeoutMs = 5000;
    const t = setTimeout(() => {
      try {
        if (typeof req.body === "undefined") {
          // fall back to empty body
          req.rawBody = "";
          req.body = undefined;
          req._body = false;
          // eslint-disable-next-line no-console
          console.warn(JSON.stringify({
            tag: "server:dbg:reqBody_timeout",
            ts: new Date().toISOString(),
            method: req.method,
            url: req.originalUrl || req.url
          }));
        }
      } finally {
        next();
      }
    }, timeoutMs);

    // Clear timeout once normal flow completes
    req.on("end", () => clearTimeout(t));

  } catch (err) {
    // If anything goes wrong, log and continue
    // eslint-disable-next-line no-console
    console.error("server:dbg:reqBody_outer_error", err && (err && ((err as any)?.stack || (err as any)?.message || String(err)) || String(err)));
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

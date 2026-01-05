import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import fs from "fs";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
// superjson transformer removed - not supported in current tRPC version

// --- DEBUG: log incoming /api/trpc POST bodies (temporary) ---
const DBG_LOG = '/tmp/server_trpc_req_debug.log';

// small helper to append lines
function appendDbgLine(o: any) {
  try {
    fs.appendFileSync(DBG_LOG, JSON.stringify(o) + '\n');
  } catch (e: any) {
    console.error('dbg-append-error', e && (e.stack || e));
  }
}
// --- END DEBUG BLOCK ---

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
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  // --- DEBUG: log incoming /api/trpc POST bodies (temporary) ---
  // ensure bodyparser runs before this; if using express.json earlier, req.body should be available
  app.use('/api/trpc', (req, res, next) => {
    try {
      if (req.method === 'POST') {
        const previewBody = (() => {
          try {
            // attempt to stringify req.body safely
            if (typeof req.body === 'string') return req.body.slice(0, 4096);
            if (Buffer.isBuffer(req.body)) return req.body.toString('utf8', 0, 4096);
            return JSON.stringify(req.body).slice(0, 4096);
          } catch (e) {
            return String(req.body).slice(0, 4096);
          }
        })();

        const log: any = {
          ts: new Date().toISOString(),
          kind: 'server:req',
          method: req.method,
          url: req.originalUrl || req.url,
          headersContentType: req.headers && req.headers['content-type'],
          previewBody,
        };

        // Also capture raw incoming stream fallback if bodyparser didn't populate req.body
        if ((req.body == null || Object.keys(req.body || {}).length === 0) && (req as any)._body !== true) {
          // Attempt to collect raw body (non-blocking for safety)
          let raw = '';
          req.on('data', (chunk) => { raw += chunk.toString(); });
          req.on('end', () => {
            log.rawFallback = raw.slice(0, 4096);
            appendDbgLine(log);
            // We do NOT modify req; let further middleware proceed
          });
          // proceed to next; end handler will append the log later
          return next();
        } else {
          appendDbgLine(log);
        }
      }
    } catch (err: any) {
      appendDbgLine({ ts: new Date().toISOString(), kind: 'server:req:error', err: String(err && err.stack || err) });
    }
    next();
  });
  // --- END DEBUG BLOCK ---
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

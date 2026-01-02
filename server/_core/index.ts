import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import fs from "fs";
import superjson from "superjson";
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
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  
  // Temporary compatibility shim (temporary):
  // Capture /api/trpc outgoing responses, and if the body is a plain JSON tRPC error,
  // re-serialize it using superjson so clients configured with the superjson transformer
  // can decode error responses. This is a temporary shim — revert after upstream fix.
  app.use('/api/trpc', (req, res, next) => {
    try {
      const originalWrite = res.write.bind(res);
      const originalEnd = res.end.bind(res);
      const chunks: Buffer[] = [];

      res.write = function (chunk: any, encoding?: any, cb?: any) {
        try {
          if (chunk) {
            const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(typeof chunk === 'string' ? chunk : String(chunk), encoding || 'utf8');
            chunks.push(buf);
          }
        } catch (e) {
          console.error('shim capture write error', e && (e as Error).message ? (e as Error).message : e);
        }
        return originalWrite(chunk, encoding, cb);
      };

      res.end = function (chunk: any, encoding?: any, cb?: any) {
        try {
          if (chunk) {
            const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(typeof chunk === 'string' ? chunk : String(chunk), encoding || 'utf8');
            chunks.push(buf);
          }
          const bodyBuf = Buffer.concat(chunks);
          const contentType = (res.getHeader && res.getHeader('content-type')) || '';

          // Only operate on JSON responses
          if (bodyBuf && typeof contentType === 'string' && contentType.indexOf('application/json') !== -1) {
            let bodyText = '';
            try {
              bodyText = bodyBuf.toString('utf8');
            } catch (e) {
              bodyText = '';
            }

            // Attempt to parse as JSON
            try {
              const parsed = JSON.parse(bodyText);
              // If parsed looks like a tRPC error wrapper or array of errors,
              // and is NOT already superjson-wrapped (no 'json'|'meta' top-level from superjson),
              // then re-serialize using superjson.
              let needsReserialize = false;

              // Helper: detect if the value looks like a superjson wire (object with json/meta) 
              const looksLikeSuperjson = (v: any) => {
                return v && typeof v === 'object' && (v.json !== undefined || v.meta !== undefined);
              };

              // Handle arrays with error objects, or object shape { error: { json: ... } }
              if (Array.isArray(parsed)) {
                // If array contains objects that are not superjson-wrapped
                needsReserialize = parsed.some(item => {
                  if (!looksLikeSuperjson(item)) {
                    // If item.error && item.error.json exists, that means tRPC already wrapped error in plain JSON -> reserialize
                    if (item && typeof item === 'object' && item.error && item.error.json) {
                      return true;
                    }
                    // if item lacks superjson markers, check further
                    return true;
                  }
                  return false;
                });
              } else if (parsed && typeof parsed === 'object') {
                // If it's an object that contains tRPC error wrapper with .error.json, reserialize
                if (parsed.error && parsed.error.json) {
                  needsReserialize = true;
                } else if (!looksLikeSuperjson(parsed)) {
                  // If plain object and not superjson, consider reserialize if it contains error-like shape
                  if (parsed.error || parsed.result) {
                    needsReserialize = true;
                  }
                }
              }

              if (needsReserialize) {
                try {
                  // Use superjson to serialize. We wrap the parsed value in an object
                  // that mirrors the tRPC "shape" — but to be conservative, we serialize the parsed body directly.
                  const serialized = superjson.serialize(parsed);
                  // Overwrite response headers/body via originalEnd
                  res.setHeader('Content-Type', 'application/json');
                  return originalEnd(JSON.stringify(serialized), 'utf8', cb);
                } catch (e) {
                  console.error('shim: superjson.serialize failed', e && (e as Error).message ? (e as Error).message : e);
                  // fallback to original response below
                }
              }
            } catch (e) {
              // not JSON — do nothing
            }
          }
        } catch (e) {
          console.error('shim res.end wrapper error', e && (e as Error).message ? (e as Error).message : e);
        }
        return originalEnd(chunk, encoding, cb);
      };
    } catch (e) {
      console.error('failed to install trpc shim middleware', e && (e as Error).message ? (e as Error).message : e);
    }
    return next();
  });
  
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

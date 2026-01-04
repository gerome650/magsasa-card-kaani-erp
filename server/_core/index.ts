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

            // Try to parse JSON; if parsing fails, keep the raw text
            let parsed;
            try {
              parsed = JSON.parse(bodyText);
            } catch (e) {
              parsed = bodyText;
            }

            // Helper: detect if the value looks like a superjson wire (object with json/meta)
            const looksLikeSuperjson = (v: any) => {
              return v && typeof v === 'object' && (v.json !== undefined || v.meta !== undefined);
            };

            // Aggressive rule: if status is an error (>=400) and response is not already superjson,
            // attempt to superjson.serialize the parsed body (or the raw text fallback).
            const status = (res.statusCode && typeof res.statusCode === 'number') ? res.statusCode : 0;
            if (status >= 400 && !looksLikeSuperjson(parsed)) {
              try {
                // Ensure we send a JSON-serializable object: prefer parsed value, if it's a string wrap it.
                const toSerialize = (typeof parsed === 'string') ? { message: parsed } : parsed;
                const serialized = superjson.serialize(toSerialize);
                res.setHeader('Content-Type', 'application/json');
                return originalEnd(JSON.stringify(serialized), 'utf8', cb);
              } catch (e) {
                console.error('shim: superjson.serialize failed (aggressive)', e && (e as Error).message ? (e as Error).message : e);
                // fallthrough to original response below
              }
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

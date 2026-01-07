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
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  
  // Pre-tRPC middleware: ensure req.body is present and normalize batch inputs
  app.use("/api/trpc", async (req, res, next) => {
    try {
      // If body already set by express.json(), use it; otherwise read from stream
      if (!Object.prototype.hasOwnProperty.call(req, 'body') || typeof req.body === 'undefined') {
        const chunks: Buffer[] = [];
        if (!req.readableEnded) {
          req.on('data', (c: Buffer) => chunks.push(c));
          await new Promise<void>((resolve) => req.on('end', () => resolve()));
        }
        const rawBuf = Buffer.concat(chunks || []);
        const rawStr = rawBuf.length ? rawBuf.toString('utf8') : undefined;

        // Parse JSON if content-type is application/json
        let parsed: any;
        if (rawStr && /application\/json/.test(String(req.headers['content-type'] || ''))) {
          try {
            parsed = JSON.parse(rawStr);
          } catch (e) {
            parsed = rawStr;
          }
        } else {
          parsed = rawStr;
        }
        (req as any).body = parsed;
      }
      
      // Normalization for batch requests (ensure keyed-object format)
      const isBatch = (/\b(batch=1)\b/.test(req.originalUrl || req.url || '') || ((req.query as any)?.batch === '1'));
      if (isBatch && (req as any).body) {
        const body = (req as any).body;
        // If body is {"input": {...}} -> convert to {'0': {...}}
        if (body && typeof body === 'object' && !Array.isArray(body) && Object.keys(body).length === 1 && Object.prototype.hasOwnProperty.call(body, 'input')) {
          (req as any).body = { '0': body.input };
          console.log(JSON.stringify({
            tag: 'server:pre-trpc:normalized',
            url: req.originalUrl || req.url,
            normalizedType: 'input->keyed-for-batch',
            sample: JSON.stringify((req as any).body).slice(0, 200)
          }));
        } else if (Array.isArray(body)) {
          // Convert array to keyed object
          const out: any = {};
          for (let i = 0; i < body.length; i++) {
            const el = body[i];
            out[String(i)] = (el && typeof el === 'object' && 'input' in el) ? el.input : el;
          }
          (req as any).body = out;
          console.log(JSON.stringify({
            tag: 'server:pre-trpc:normalized',
            url: req.originalUrl || req.url,
            normalizedType: 'array->keyed-for-batch',
            sample: JSON.stringify((req as any).body).slice(0, 200)
          }));
        } else if (body && typeof body === 'object') {
          // If keyed but wrapped values have input, unwrap
          const keys = Object.keys(body);
          const allNumeric = keys.length > 0 && keys.every(k => /^\d+$/.test(k));
          if (allNumeric) {
            for (const k of keys) {
              if (body[k] && typeof body[k] === 'object' && Object.prototype.hasOwnProperty.call(body[k], 'input')) {
                body[k] = body[k].input;
              }
            }
            console.log(JSON.stringify({
              tag: 'server:pre-trpc:normalized',
              url: req.originalUrl || req.url,
              normalizedType: 'keyed-object-unwrapped',
              sample: JSON.stringify((req as any).body).slice(0, 200)
            }));
          }
        }
      }
      
      if ((req as any).body !== undefined) {
        console.log(JSON.stringify({
          tag: 'server:pre-trpc:body_set',
          url: req.originalUrl || req.url,
          body_type: Array.isArray((req as any).body) ? 'array' : typeof (req as any).body,
          preview: JSON.stringify((req as any).body).slice(0, 200)
        }));
      }
    } catch (err: any) {
      // Keep req.body undefined if we cannot parse
      console.error('server:pre-trpc:error', err?.stack || err?.message || String(err));
    }
    next();
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

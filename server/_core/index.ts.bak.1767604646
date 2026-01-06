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

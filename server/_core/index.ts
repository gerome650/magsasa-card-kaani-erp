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
  
  // DEV-only: Session probe endpoint for debugging auth issues
  if (process.env.NODE_ENV === "development") {
    app.get("/__debug/session", async (req, res) => {
      try {
        const { COOKIE_NAME } = await import("@shared/const");
        const sdkModule = await import("./sdk");
        const { parse } = await import("cookie");
        
        const cookies = parse(req.headers.cookie || "");
        const hasCookie = !!cookies[COOKIE_NAME];
        
        let sessionPayload = null;
        let sessionReason = null;
        if (hasCookie) {
          try {
            sessionPayload = await sdkModule.sdk.verifySession(cookies[COOKIE_NAME]);
            if (!sessionPayload) {
              sessionReason = "verifySession returned null";
            }
          } catch (error) {
            sessionReason = `verifySession error: ${error instanceof Error ? error.message : String(error)}`;
          }
        } else {
          sessionReason = "no cookie present";
        }
        
        let userFromAuthenticateRequest = null;
        let authError = null;
        if (hasCookie && sessionPayload) {
          try {
            userFromAuthenticateRequest = await sdkModule.sdk.authenticateRequest(req as any);
          } catch (error) {
            authError = error instanceof Error ? error.message : String(error);
          }
        }
        
        res.json({
          hasCookie,
          sessionPayload,
          sessionReason,
          userFromAuthenticateRequest: userFromAuthenticateRequest ? {
            id: userFromAuthenticateRequest.id,
            email: userFromAuthenticateRequest.email,
            role: userFromAuthenticateRequest.role,
            loginMethod: userFromAuthenticateRequest.loginMethod,
          } : null,
          authError,
        });
      } catch (error) {
        res.status(500).json({
          error: error instanceof Error ? error.message : String(error),
        });
      }
    });
  }
  
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
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

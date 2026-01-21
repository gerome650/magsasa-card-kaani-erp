import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { trpcDbg } from "./trpcDebug";
// Note: superjson transformer IS used (configured in server/_core/trpc.ts)
// The unwrapper below handles legacy { json: {...} } format but passes through superjson format

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
  
  // DEV-only: Demo auth bypass route
  if (process.env.NODE_ENV === "development" && process.env.DEMO_BYPASS_AUTH === "1") {
    const { setDemoRole } = await import("./demoBypass");
    
    app.get("/__demo/login/:role", (req, res) => {
      const role = req.params.role;
      
      // Validate role
      if (!["farmer", "field_officer", "manager", "supplier"].includes(role)) {
        res.status(400).json({ error: `Invalid role: ${role}. Must be one of: farmer, field_officer, manager, supplier` });
        return;
      }
      
      // Store role in memory
      setDemoRole(role as "farmer" | "field_officer" | "manager" | "supplier");
      
      console.log(`[DEMO_BYPASS] Role set to: ${role}, redirecting to dashboard`);
      
      // Redirect to root (will route to appropriate dashboard)
      res.redirect("/");
    });
  }
  
  // DEV-only: Cookie validation endpoint
  if (process.env.NODE_ENV === "development") {
    app.get("/__debug/cookies", async (req, res) => {
      try {
        const { COOKIE_NAME } = await import("@shared/const");
        const cookieHeader = req.headers.cookie || "";
        const { parse } = await import("cookie");
        const cookies = parse(cookieHeader);
        const cookieNames = Object.keys(cookies);
        const cookieNamePresent = !!cookies[COOKIE_NAME];
        
        res.json({
          host: req.headers.host || null,
          cookieHeaderPresent: !!cookieHeader,
          cookieHeaderLength: cookieHeader.length,
          cookieNames,
          cookieNamePresent,
          cookieName: COOKIE_NAME,
        });
      } catch (error) {
        res.status(500).json({
          error: error instanceof Error ? error.message : String(error),
        });
      }
    });
  }
  
  // DEV-only: Cookie check endpoint for debugging cookie issues (legacy, kept for compatibility)
  if (process.env.NODE_ENV === "development") {
    app.get("/__demo/cookie-check", async (req, res) => {
      try {
        const { COOKIE_NAME } = await import("@shared/const");
        const cookieHeader = req.headers.cookie || "";
        const { parse } = await import("cookie");
        const cookies = parse(cookieHeader);
        const cookieNamePresent = !!cookies[COOKIE_NAME];
        
        res.json({
          host: req.headers.host || null,
          cookieHeaderPresent: !!cookieHeader,
          cookieHeaderLength: cookieHeader.length,
          cookieNamePresent,
          cookieName: COOKIE_NAME,
        });
      } catch (error) {
        res.status(500).json({
          error: error instanceof Error ? error.message : String(error),
        });
      }
    });
  }
  
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
  
  // TRPC_DEBUG: Read-only logger for tRPC requests (NEVER mutates req.body)
  // This middleware runs AFTER express.json() but BEFORE createExpressMiddleware
  // With superjson transformer, tRPC handles deserialization automatically - no unwrapping needed
  app.use("/api/trpc", (req, res, next) => {
    // TRPC_DEBUG: Log request body structure (read-only, never modify)
    if (process.env.TRPC_DEBUG === "1" && process.env.NODE_ENV === "development" && req.method === "POST") {
      const path = req.url?.split("?")[0] || "";
      const isDemoLogin = path.includes("auth.demoLogin");
      if (isDemoLogin) {
        trpcDbg("[demoLogin] REQUEST DEBUG (read-only):");
        trpcDbg("  - typeof req.body:", typeof req.body);
        trpcDbg("  - req.body is null/undefined:", req.body == null);
        if (req.body && typeof req.body === "object") {
          trpcDbg("  - Object.keys(req.body):", Object.keys(req.body));
          trpcDbg("  - Array.isArray(req.body):", Array.isArray(req.body));
          
          // Check for keyed batch format: { "0": {...} }
          const keys = Object.keys(req.body);
          const isKeyedBatch = !Array.isArray(req.body) && keys.length > 0 && 
            keys.every(k => String(Number(k)) === k);
          trpcDbg("  - isKeyedBatch:", isKeyedBatch);
          
          if (Array.isArray(req.body)) {
            trpcDbg("  - req.body[0] keys:", req.body[0] ? Object.keys(req.body[0]) : "no [0]");
          } else if (isKeyedBatch && keys.length > 0) {
            const firstKey = keys[0];
            const firstValue = req.body[firstKey];
            trpcDbg("  - req.body[firstKey] keys:", firstValue ? Object.keys(firstValue) : "no firstValue");
            if (firstValue && typeof firstValue === "object") {
              trpcDbg("  - firstValue has 'json':", "json" in firstValue);
              trpcDbg("  - firstValue has 'id':", "id" in firstValue);
              trpcDbg("  - firstValue has 'meta':", "meta" in firstValue);
              // Log extracted input from envelope for visibility (read-only)
              if ("json" in firstValue) {
                const extracted = firstValue.json;
                if (extracted && typeof extracted === "object") {
                  trpcDbg("  - extracted.json keys:", Object.keys(extracted));
                  trpcDbg("  - extracted.json shape:", {
                    hasUsername: "username" in extracted,
                    hasPassword: "password" in extracted,
                    hasRole: "role" in extracted,
                  });
                }
              }
            }
          }
        }
        trpcDbg("  - Content-Type:", req.headers["content-type"]);
      }
    }
    // Pass through unchanged - let tRPC handle deserialization
    next();
  });
  
  // tRPC API
  // Note: superjson transformer is configured in server/_core/trpc.ts
  // createExpressMiddleware will automatically use the transformer from the router
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
      // Don't pass transformer here - it's already configured in the router via initTRPC
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

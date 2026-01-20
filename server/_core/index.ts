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
  
  // tRPC wire format unwrapper: unwraps { json, meta } to just the input object
  // This middleware runs AFTER express.json() but BEFORE createExpressMiddleware
  // tRPC sends data in { json: {...}, meta: {...} } format, but procedures expect just {...}
  app.use("/api/trpc", (req, res, next) => {
    // Only process POST requests with parsed JSON body
    if (req.method === "POST" && req.body && typeof req.body === "object") {
      // Unwrap function: if object has "json" key, extract it (ignore meta)
      const unwrapWire = (x: any): any => {
        if (!x || typeof x !== "object") return x;
        if ("json" in x) return (x as any).json;
        return x;
      };
      
      const originalBody = req.body;
      
      // Handle batch array: [{ json: {...} }, ...]
      if (Array.isArray(req.body)) {
        req.body = req.body.map(unwrapWire);
      } 
      // Handle keyed batch object: { "0": { json: {...} }, "1": { json: {...} } }
      else if (typeof req.body === "object") {
        const keys = Object.keys(req.body);
        // Only treat as keyed batch if keys look numeric (e.g., "0", "1", "2")
        const isKeyedBatch = keys.length > 0 && keys.every(k => String(Number(k)) === k);
        if (isKeyedBatch) {
          const unwrapped: any = {};
          for (const k of keys) {
            unwrapped[k] = unwrapWire(req.body[k]);
          }
          req.body = unwrapped;
        } else {
          // Single object input: { json: {...} } -> {...}
          req.body = unwrapWire(req.body);
        }
      }
      
      // DEV-only: Log normalized input for auth.demoLogin to confirm unwrapping worked (gated by TRPC_DEBUG=1)
      if (process.env.NODE_ENV === "development") {
        const path = req.url?.split("?")[0] || "";
        const isDemoLogin = path.includes("auth.demoLogin");
        const bodyHasDemoFields = Array.isArray(req.body) 
          ? req.body.some((item: any) => item && typeof item === "object" && ("username" in item || "password" in item))
          : req.body && typeof req.body === "object" && ("username" in req.body || "password" in req.body);
        
        if (isDemoLogin || bodyHasDemoFields) {
          const inputToLog = Array.isArray(req.body) ? req.body[0] : req.body;
          if (inputToLog && typeof inputToLog === "object") {
            trpcDbg("[demoLogin] normalized input keys:", Object.keys(inputToLog));
            trpcDbg("[demoLogin] input shape:", {
              hasUsername: "username" in inputToLog,
              hasPassword: "password" in inputToLog,
              hasRole: "role" in inputToLog,
              usernameType: typeof inputToLog.username,
              passwordType: typeof inputToLog.password,
              roleType: typeof inputToLog.role,
            });
            // Log if unwrapping occurred
            if (originalBody !== req.body && "json" in (Array.isArray(originalBody) ? originalBody[0] : originalBody)) {
              trpcDbg("[demoLogin] unwrapped { json } format");
            }
          }
        }
      }
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

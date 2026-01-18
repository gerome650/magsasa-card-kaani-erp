import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { InferSelectModel } from "drizzle-orm";
import { users } from "../../drizzle/schema";
import { sdk } from "./sdk";
import { ENV } from "./env";
import { getDemoRole, createDemoUser } from "./demoBypass";

type User = InferSelectModel<typeof users>;

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  // DEV-only: Auth bypass - inject demo user if enabled
  if (ENV.demoBypassAuth) {
    // Check for role in query param first (for direct requests)
    const urlParams = new URLSearchParams(opts.req.url?.split("?")[1] || "");
    const queryRole = urlParams.get("role");
    
    // Get role from query param or in-memory override
    const demoRole = (queryRole && ["farmer", "field_officer", "manager", "supplier"].includes(queryRole)
      ? queryRole
      : getDemoRole()) as "farmer" | "field_officer" | "manager" | "supplier" | null;

    if (demoRole) {
      // Inject demo user directly - bypass authenticateRequest
      user = createDemoUser(demoRole) as User;
      if (process.env.NODE_ENV === "development") {
        console.log(`[DEMO_BYPASS] Injected demo user: ${demoRole} (${user.email})`);
      }
      return {
        req: opts.req,
        res: opts.res,
        user,
      };
    }
  }

  // Normal authentication flow
  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    // Authentication is optional for public procedures.
    user = null;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}

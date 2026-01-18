/**
 * DEV-only: In-memory demo role override store for auth bypass
 * 
 * This allows bypassing authentication entirely in DEV mode when DEMO_BYPASS_AUTH=1.
 * The role is stored in memory and injected into request context.
 */

type DemoRole = "farmer" | "field_officer" | "manager" | "supplier";

let demoRoleOverride: DemoRole | null = null;

/**
 * Set the demo role override (in-memory, server-side only)
 */
export function setDemoRole(role: DemoRole | null): void {
  demoRoleOverride = role;
  if (process.env.NODE_ENV === "development") {
    console.log(`[DEMO_BYPASS] Role override set to: ${role || "null"}`);
  }
}

/**
 * Get the current demo role override
 */
export function getDemoRole(): DemoRole | null {
  return demoRoleOverride;
}

/**
 * Create a demo user object from role
 */
export function createDemoUser(role: DemoRole): {
  id: number;
  openId: string;
  name: string | null;
  email: string | null;
  role: "user" | "admin" | "farmer" | "field_officer" | "manager" | "supplier";
  loginMethod: string | null;
  createdAt: string;
  updatedAt: string;
  lastSignedIn: string;
} {
  const nameMap: Record<DemoRole, string> = {
    manager: "Roberto Garcia",
    field_officer: "Maria Santos",
    farmer: "Juan dela Cruz",
    supplier: "Supplier Demo",
  };

  const emailMap: Record<DemoRole, string> = {
    manager: "roberto.garcia@magsasa.org",
    field_officer: "maria.santos@magsasa.org",
    farmer: "juan.delacruz@example.com",
    supplier: "supplier@demo.local",
  };

  const now = new Date().toISOString();

  return {
    id: 0, // Demo user ID
    openId: `demo-${role}`,
    name: nameMap[role],
    email: emailMap[role],
    role: role as any, // Type assertion to allow client roles
    loginMethod: "demo-bypass",
    createdAt: now,
    updatedAt: now,
    lastSignedIn: now,
  };
}

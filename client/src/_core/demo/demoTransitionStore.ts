/**
 * DEV-ONLY: Reactive Demo Transition Store
 * 
 * In-memory reactive store for demo transition state with subscription support.
 * Replaces polling-based checks with immediate synchronous updates.
 * 
 * This is DEV-only and must not affect production behavior.
 */

const DEMO_TRANSITION_KEY = "demo_transition_until";

// In-memory state
let activeUntil = 0;
let currentTransitionId = 0; // Incrementing ID to prevent stale overwrites
const listeners = new Set<() => void>();

/**
 * Notify all subscribers of state changes
 */
function notify(): void {
  listeners.forEach((listener) => {
    try {
      listener();
    } catch (e) {
      if (import.meta.env.DEV) {
        console.error("[DemoTransitionStore] Listener error:", e);
      }
    }
  });
}

/**
 * Start a demo transition window.
 * During this window, the app should show a full-screen loader.
 * 
 * @param ms - Duration of transition window in milliseconds (default: 2000ms)
 * @returns Transition ID that can be used to verify the transition is still current
 */
export function startDemoTransition(ms: number = 2000): number {
  if (typeof window === "undefined" || import.meta.env.PROD) return 0;
  
  // Increment transition ID to prevent stale overwrites
  currentTransitionId += 1;
  const transitionId = currentTransitionId;
  activeUntil = Date.now() + ms;
  
  // Persist to localStorage for hydration across page reloads
  try {
    localStorage.setItem(DEMO_TRANSITION_KEY, String(activeUntil));
    if (import.meta.env.DEV) {
      console.log("[DemoTransitionStore] Started transition window until", new Date(activeUntil).toISOString(), "id:", transitionId);
    }
  } catch (e) {
    // localStorage not available (private mode, etc.)
    if (import.meta.env.DEV) {
      console.warn("[DemoTransitionStore] Failed to persist transition:", e);
    }
  }
  
  // Notify subscribers synchronously (no delay)
  notify();
  
  return transitionId;
}

/**
 * Get the current transition ID.
 * Use this to verify a transition is still current before applying results.
 * 
 * @returns Current transition ID, or 0 if no transition is active
 */
export function getCurrentTransitionId(): number {
  if (typeof window === "undefined" || import.meta.env.PROD) return 0;
  return currentTransitionId;
}

/**
 * Clear the demo transition immediately.
 * Use this when auth state has settled and transition is no longer needed.
 */
export function clearDemoTransition(): void {
  if (typeof window === "undefined" || import.meta.env.PROD) return;
  
  activeUntil = 0;
  
  // Remove from localStorage
  try {
    localStorage.removeItem(DEMO_TRANSITION_KEY);
    if (import.meta.env.DEV) {
      console.log("[DemoTransitionStore] Cleared transition window");
    }
  } catch (e) {
    // localStorage not available
  }
  
  // Notify subscribers synchronously
  notify();
}

/**
 * Check if a demo transition is currently active.
 * 
 * On first call, hydrates from localStorage if activeUntil is 0.
 * 
 * @returns true if transition is active, false otherwise
 */
export function isDemoTransitionActive(): boolean {
  if (typeof window === "undefined" || import.meta.env.PROD) return false;
  
  // Hydrate from localStorage if in-memory state is empty
  if (activeUntil === 0) {
    try {
      const stored = localStorage.getItem(DEMO_TRANSITION_KEY);
      if (stored) {
        const until = parseInt(stored, 10);
        if (!isNaN(until) && Date.now() < until) {
          activeUntil = until;
        } else {
          // Expired or invalid, clean it up
          localStorage.removeItem(DEMO_TRANSITION_KEY);
        }
      }
    } catch (e) {
      // localStorage not available
    }
  }
  
  const now = Date.now();
  const isActive = activeUntil > 0 && now < activeUntil;
  
  // Auto-cleanup if expired
  if (activeUntil > 0 && now >= activeUntil) {
    activeUntil = 0;
    try {
      localStorage.removeItem(DEMO_TRANSITION_KEY);
    } catch (e) {
      // localStorage not available
    }
  }
  
  return isActive;
}

/**
 * Subscribe to transition state changes.
 * 
 * @param callback - Function called whenever transition state changes
 * @returns Unsubscribe function
 */
export function subscribeDemoTransition(callback: () => void): () => void {
  if (typeof window === "undefined" || import.meta.env.PROD) {
    return () => {}; // No-op in production
  }
  
  listeners.add(callback);
  
  // Return unsubscribe function
  return () => {
    listeners.delete(callback);
  };
}

/**
 * Get remaining time until transition expires (in milliseconds).
 * Returns 0 if not active.
 */
export function getRemainingTransitionTime(): number {
  if (activeUntil === 0) return 0;
  const remaining = activeUntil - Date.now();
  return remaining > 0 ? remaining : 0;
}

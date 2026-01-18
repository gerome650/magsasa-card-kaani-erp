/**
 * DEV-ONLY: Demo Transition Manager
 * 
 * Manages a global transition state during demo account switching to prevent flicker.
 * Shows a full-screen loader overlay during transitions so no "Access Denied" flashes
 * or route thrash can appear.
 * 
 * This is DEV-only and must not affect production behavior.
 */

export const DEMO_TRANSITION_KEY = "demo_transition_until";

/**
 * Start a demo transition window.
 * During this window, the app should show a full-screen loader.
 * 
 * @param ms - Duration of transition window in milliseconds (default: 1500ms)
 */
export function startDemoTransition(ms: number = 1500): void {
  if (typeof window === "undefined" || import.meta.env.PROD) return;
  
  try {
    const until = Date.now() + ms;
    localStorage.setItem(DEMO_TRANSITION_KEY, String(until));
    if (import.meta.env.DEV) {
      console.log("[DemoTransition] Started transition window until", new Date(until).toISOString());
    }
  } catch (e) {
    // localStorage not available (private mode, etc.)
    if (import.meta.env.DEV) {
      console.warn("[DemoTransition] Failed to set transition:", e);
    }
  }
}

/**
 * Check if a demo transition is currently active.
 * 
 * @returns true if transition is active, false otherwise
 */
export function isDemoTransitionActive(): boolean {
  if (typeof window === "undefined" || import.meta.env.PROD) return false;
  
  try {
    const stored = localStorage.getItem(DEMO_TRANSITION_KEY);
    if (!stored) return false;
    
    const until = parseInt(stored, 10);
    if (isNaN(until)) {
      // Invalid value, clean it up
      localStorage.removeItem(DEMO_TRANSITION_KEY);
      return false;
    }
    
    const isActive = Date.now() < until;
    
    // Auto-cleanup if expired
    if (!isActive) {
      localStorage.removeItem(DEMO_TRANSITION_KEY);
    }
    
    return isActive;
  } catch (e) {
    // localStorage not available
    return false;
  }
}

/**
 * Clear the demo transition immediately.
 * Use this when auth state has settled and transition is no longer needed.
 */
export function clearDemoTransition(): void {
  if (typeof window === "undefined" || import.meta.env.PROD) return;
  
  try {
    localStorage.removeItem(DEMO_TRANSITION_KEY);
    if (import.meta.env.DEV) {
      console.log("[DemoTransition] Cleared transition window");
    }
  } catch (e) {
    // localStorage not available
  }
}

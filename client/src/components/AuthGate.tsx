import { ReactNode } from 'react';
import React from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { Loader2 } from 'lucide-react';

interface AuthGateProps {
  children: ReactNode;
}

/**
 * AuthGate: Single source of truth for auth state blocking.
 * Shows loader while auth is resolving or during demo transitions.
 * Does NOT redirect - that's ProtectedRoute's job.
 */
export function AuthGate({ children }: AuthGateProps) {
  const {
    loading,
    isAuthReady,
    isInDemoGraceWindow,
    isInRoleSwitchWindow,
    demoSessionPresent,
  } = useAuth();

  // Make this reactive with state so it updates when localStorage changes
  const [demoSessionPresentState, setDemoSessionPresentState] = React.useState(() => {
    if (typeof window === "undefined" || import.meta.env.PROD) return false;
    try {
      return localStorage.getItem('demo_session_present') === '1';
    } catch (e) {
      return false;
    }
  });

  // Poll localStorage for changes (DEV only)
  React.useEffect(() => {
    if (!import.meta.env.DEV || typeof window === "undefined") return;
    
    const checkDemoSession = () => {
      try {
        const present = localStorage.getItem('demo_session_present') === '1';
        setDemoSessionPresentState(present);
      } catch (e) {
        // localStorage not available
      }
    };

    checkDemoSession();
    const interval = setInterval(checkDemoSession, 100);
    
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'demo_session_present') {
        checkDemoSession();
      }
    };
    window.addEventListener('storage', handleStorage);

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  // DEV-only: Check localStorage directly as fallback (reactive)
  const [isInDemoGraceWindowState, setIsInDemoGraceWindowState] = React.useState(() => {
    if (typeof window === "undefined" || import.meta.env.PROD) return false;
    try {
      const stored = localStorage.getItem('demo_grace_window_end');
      if (stored) {
        return Date.now() < parseInt(stored, 10);
      }
    } catch (e) {
      // localStorage not available
    }
    return false;
  });

  const [isInRoleSwitchWindowState, setIsInRoleSwitchWindowState] = React.useState(() => {
    if (typeof window === "undefined" || import.meta.env.PROD) return false;
    try {
      const stored = localStorage.getItem('demo_role_switch_end');
      if (stored) {
        return Date.now() < parseInt(stored, 10);
      }
    } catch (e) {
      // localStorage not available
    }
    return false;
  });

  // Poll grace window and role switch window (DEV only)
  React.useEffect(() => {
    if (!import.meta.env.DEV || typeof window === "undefined") return;
    
    const checkWindows = () => {
      try {
        const graceStored = localStorage.getItem('demo_grace_window_end');
        const roleSwitchStored = localStorage.getItem('demo_role_switch_end');
        
        setIsInDemoGraceWindowState(graceStored ? Date.now() < parseInt(graceStored, 10) : false);
        setIsInRoleSwitchWindowState(roleSwitchStored ? Date.now() < parseInt(roleSwitchStored, 10) : false);
      } catch (e) {
        // localStorage not available
      }
    };

    checkWindows();
    const interval = setInterval(checkWindows, 100);
    
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'demo_grace_window_end' || e.key === 'demo_role_switch_end') {
        checkWindows();
      }
    };
    window.addEventListener('storage', handleStorage);

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const inGraceWindow = isInDemoGraceWindow || isInDemoGraceWindowState;
  const inRoleSwitch = isInRoleSwitchWindow || isInRoleSwitchWindowState;
  const hasDemoSession = demoSessionPresent || demoSessionPresentState;

  // Block rendering while:
  // - Auth is not ready (first auth.me attempt hasn't completed)
  // - Auth is loading or refetching
  // - In demo grace window (DEV only)
  // - In role switch window (DEV only)
  // - Demo session present but user not loaded yet (DEV only)
  // Note: loading already includes isRefetching from useAuth, but we block during transitions anyway
  const shouldBlock = !isAuthReady || loading || (import.meta.env.DEV && (inGraceWindow || inRoleSwitch || (hasDemoSession && !loading && !isAuthReady)));

  if (shouldBlock) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return <>{children}</>;
}

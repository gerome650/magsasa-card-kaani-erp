/**
 * LEGACY AUTH CONTEXT - ADAPTER OVER TRPC HOOK
 * 
 * This file is now a thin adapter over the TRPC-based useAuth hook.
 * It maintains the legacy AuthContext interface for backward compatibility
 * while delegating all auth state to the single source of truth: TRPC useAuth hook.
 * 
 * This ensures components using AuthContext share the same auth state as components
 * using the TRPC hook directly, eliminating flicker from dual auth systems.
 * 
 * @see client/src/_core/hooks/useAuth.ts for the underlying implementation
 */

import React, { createContext, useContext, useMemo, ReactNode } from 'react';
import { UserRole } from '@/data/usersData';
import { useAuth as useTrpcAuth } from '@/_core/hooks/useAuth';
import { getClientRole } from '@/const';

interface AuthContextType {
  user: any | null; // User from TRPC (may be server User type)
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isAuthenticated: boolean;
  hasRole: (role: UserRole | UserRole[]) => boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * AuthProvider: Thin adapter over TRPC useAuth hook.
 * 
 * This provider wraps the TRPC useAuth hook and exposes the legacy AuthContext interface.
 * All auth state comes from the TRPC hook, ensuring a single source of truth.
 * 
 * Field mappings:
 * - user: Direct from trpc.user (stabilized via placeholderData in hook)
 * - isLoading: Maps to trpc.loading (includes isRefetching to prevent flicker)
 * - isAuthenticated: Direct from trpc.isAuthenticated
 * - logout: Direct from trpc.logout
 * - hasRole: Derived from trpc.user using getClientRole helper
 * - login: Stub (Login.tsx uses trpc.auth.demoLogin directly)
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  // Use TRPC hook as single source of truth
  const trpcAuth = useTrpcAuth();

  // Map TRPC hook fields to legacy AuthContext interface
  const hasRole = useMemo(() => {
    return (role: UserRole | UserRole[]): boolean => {
      if (!trpcAuth.user) return false;
      
      // Use getClientRole to map server role to client role
      const clientRole = getClientRole(trpcAuth.user);
      if (!clientRole) return false;
      
      if (Array.isArray(role)) {
        return role.includes(clientRole);
      }
      return clientRole === role;
    };
  }, [trpcAuth.user]);

  // Stub login method - Login.tsx uses trpc.auth.demoLogin directly
  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    if (import.meta.env.DEV) {
      console.warn('[AuthContext] login() is deprecated. Use Login page with trpc.auth.demoLogin instead.');
    }
    return { success: false, error: 'Please use the Login page' };
  };

  // Map logout to TRPC logout
  const logout = async () => {
    await trpcAuth.logout();
  };

  const value: AuthContextType = useMemo(() => ({
    user: trpcAuth.user, // Direct from TRPC (stabilized via placeholderData)
    login,
    logout,
    isAuthenticated: trpcAuth.isAuthenticated, // Direct from TRPC
    hasRole,
    isLoading: trpcAuth.loading, // Maps to TRPC loading (includes isRefetching)
  }), [
    trpcAuth.user,
    trpcAuth.isAuthenticated,
    trpcAuth.loading,
    trpcAuth.logout,
    hasRole,
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

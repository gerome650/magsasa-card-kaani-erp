import { useState } from 'react';
import { useLocation } from 'wouter';
// Note: Login.tsx uses trpc.auth.demoLogin mutation directly, no useAuth hook needed
import { trpc } from '@/lib/trpc';
import { startDemoTransition, clearDemoTransition, getCurrentTransitionId } from '@/_core/demo/demoTransitionStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [, setLocation] = useLocation();
  const [location] = useLocation();

  // Get redirect path from query params or default to dashboard
  const searchParams = new URLSearchParams(location.split('?')[1]);
  const redirectTo = searchParams.get('redirect') || '/';

  const demoLoginMutation = trpc.auth.demoLogin.useMutation();
  const utils = trpc.useUtils();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Harden input validation: ensure username and password are non-empty strings
    const usernameValue = String(username || '').trim();
    const passwordValue = String(password || '').trim();
    
    if (!usernameValue || !passwordValue) {
      setError('Username and password are required');
      return;
    }
    
    setIsLoading(true);

    // Start demo transition and capture transition ID to prevent stale overwrites
    const transitionId = import.meta.env.DEV ? startDemoTransition(3000) : 0;
    
    // Fail-safe: Auto-clear transition after max timeout (prevents infinite hang)
    // This ensures transition ALWAYS ends, even if something goes wrong
    let transitionTimeoutId: NodeJS.Timeout | null = null;
    if (import.meta.env.DEV) {
      transitionTimeoutId = setTimeout(() => {
        if (getCurrentTransitionId() === transitionId) {
          console.warn("[DEMO_SWITCH] fail-safe timeout - clearing transition", { transitionId });
          clearDemoTransition();
        }
      }, 5000); // 5 second max timeout
    }
    
    // DEV-only: Get cached user before invalidation
    let cachedUserBefore: any = null;
    if (import.meta.env.DEV) {
      try {
        const cached = utils.auth.me.getData();
        cachedUserBefore = cached || null;
      } catch (e) {
        // Ignore - cache access may fail
      }
    }

    // DEV-only: Structured logging at start
    if (import.meta.env.DEV) {
      console.log("[DEMO_SWITCH] start", {
        transitionId,
        currentTransitionId: getCurrentTransitionId(),
        location: location,
        username,
        role: username === 'farmer' ? 'farmer' : username === 'officer' ? 'field_officer' : username === 'manager' ? 'manager' : undefined,
        cachedUserBefore: cachedUserBefore ? { id: cachedUserBefore.id, role: cachedUserBefore.role } : null,
      });
    }

    try {
      // Determine role from username (server will use this to set JWT role)
      // usernameValue and passwordValue are already validated and trimmed above
      let role: 'farmer' | 'field_officer' | 'manager' | undefined;
      if (usernameValue === 'farmer') {
        role = 'farmer';
      } else if (usernameValue === 'officer') {
        role = 'field_officer';
      } else if (usernameValue === 'manager') {
        role = 'manager';
      }

      // DEV-only: Log input values before mutation
      if (import.meta.env.DEV) {
        console.log("[LOGIN SUBMIT]", { 
          username: usernameValue, 
          password: passwordValue ? '***' : '', 
          role 
        });
      }

      // Step 1: Call demoLogin mutation (creates server session cookie with role embedded in JWT)
      const demoResult = await demoLoginMutation.mutateAsync({
        username: usernameValue,
        password: passwordValue,
        role, // Send role explicitly - server will embed it in JWT
      });

      // DEV-only: Log demoLogin success
      if (import.meta.env.DEV) {
        console.log("[DEMO_SWITCH] demoLogin success", {
          transitionId,
          currentTransitionId: getCurrentTransitionId(),
          demoUser: demoResult.user ? { id: demoResult.user.id, role: demoResult.user.role, email: demoResult.user.email } : null,
        });
      }

      if (demoResult.success === true && demoResult.user) {
        // Step 2: Verify transition is still current (prevent stale overwrites)
        if (import.meta.env.DEV && getCurrentTransitionId() !== transitionId) {
          // A newer transition started - abort silently
          if (import.meta.env.DEV) {
            console.log("[DEMO_SWITCH] aborted - newer transition started", { transitionId, current: getCurrentTransitionId() });
          }
          return;
        }

        // Step 3: Optimistically set auth.me cache BEFORE refetch to prevent flicker
        // This ensures user never becomes null during refetch, preventing unauthenticated render
        utils.auth.me.setData(undefined, demoResult.user);
        
        if (import.meta.env.DEV) {
          console.log("[DEMO_SWITCH] optimistic cache set", {
            transitionId,
            cachedUser: { id: demoResult.user.id, role: demoResult.user.role, email: demoResult.user.email },
          });
        }

        // Step 4: Refetch auth.me to confirm cookie (without invalidate to avoid clearing cache)
        // Use refetch() instead of invalidate() + query() to avoid cache clearing
        // This refetch will update the cache with server response, but won't clear it first
        let authMeUser: any = null;
        try {
          // Refetch without invalidating (keeps optimistic data until server responds)
          const refetchResult = await Promise.race([
            utils.auth.me.refetch(),
            new Promise<any>((_, reject) => 
              setTimeout(() => reject(new Error("auth.me refetch timeout after 3s")), 3000)
            ),
          ]);
          authMeUser = refetchResult?.data;
          
          // If refetch didn't return data, query directly
          if (!authMeUser) {
            authMeUser = await utils.client.auth.me.query();
          }
        } catch (timeoutError: any) {
          if (import.meta.env.DEV) {
            console.warn("[DEMO_SWITCH] auth.me refetch timeout", {
              transitionId,
              error: timeoutError?.message || String(timeoutError),
            });
          }
          // On timeout, try one more time without timeout (let TRPC handle it)
          authMeUser = await utils.client.auth.me.query();
        }
        
        // DEV-only: Log first refetch result
        if (import.meta.env.DEV) {
          console.log("[DEMO_SWITCH] me refetch #1", {
            transitionId,
            currentTransitionId: getCurrentTransitionId(),
            returnedUser: authMeUser ? { id: authMeUser.id, role: authMeUser.role, email: authMeUser.email } : null,
            expectedUser: { id: demoResult.user.id, role: demoResult.user.role, email: demoResult.user.email },
            matches: authMeUser && (authMeUser.id === demoResult.user.id || authMeUser.email === demoResult.user.email),
          });
        }
        
        // Step 5: Verify user matches demoLogin result (cookie race check)
        // If user doesn't match after first refetch, retry once after 150ms
        if (!authMeUser || 
            (authMeUser.id !== demoResult.user.id && 
             authMeUser.email !== demoResult.user.email)) {
          // Cookie might not be applied yet - retry once after short delay
          if (import.meta.env.DEV) {
            console.log("[DEMO_SWITCH] mismatch -> retry scheduled", {
              transitionId,
              currentTransitionId: getCurrentTransitionId(),
            });
          }
          
          await new Promise(resolve => setTimeout(resolve, 150));
          
          // Verify transition is still current before retry
          if (import.meta.env.DEV && getCurrentTransitionId() !== transitionId) {
            // A newer transition started - abort silently
            if (import.meta.env.DEV) {
              console.log("[DEMO_SWITCH] aborted during retry - newer transition started", { transitionId, current: getCurrentTransitionId() });
            }
            return;
          }
          
          // Retry with timeout protection
          try {
            authMeUser = await Promise.race([
              utils.client.auth.me.query(),
              new Promise<any>((_, reject) => 
                setTimeout(() => reject(new Error("auth.me retry timeout after 2s")), 2000)
              ),
            ]);
          } catch (timeoutError: any) {
            if (import.meta.env.DEV) {
              console.warn("[DEMO_SWITCH] auth.me retry timeout", {
                transitionId,
                error: timeoutError?.message || String(timeoutError),
              });
            }
            // On timeout, try one final time without timeout
            authMeUser = await utils.client.auth.me.query();
          }
          
          // DEV-only: Log retry result
          if (import.meta.env.DEV) {
            console.log("[DEMO_SWITCH] me refetch #2", {
              transitionId,
              currentTransitionId: getCurrentTransitionId(),
              returnedUser: authMeUser ? { id: authMeUser.id, role: authMeUser.role, email: authMeUser.email } : null,
              expectedUser: { id: demoResult.user.id, role: demoResult.user.role, email: demoResult.user.email },
              matches: authMeUser && (authMeUser.id === demoResult.user.id || authMeUser.email === demoResult.user.email),
            });
          }
        }

        // Step 6: Verify transition is still current before navigating
        if (import.meta.env.DEV && getCurrentTransitionId() !== transitionId) {
          // A newer transition started - abort silently
          if (import.meta.env.DEV) {
            console.log("[DEMO_SWITCH] aborted before navigation - newer transition started", { transitionId, current: getCurrentTransitionId() });
          }
          return;
        }

        // Step 7: Clear demo transition and navigate
        if (import.meta.env.DEV) {
          clearDemoTransition();
        }
        
        // DEV-only: Log successful completion
        if (import.meta.env.DEV) {
          console.log("[DEMO_SWITCH] done (navigating)", {
            transitionId,
            currentTransitionId: getCurrentTransitionId(),
            redirectTo,
            finalUser: authMeUser ? { id: authMeUser.id, role: authMeUser.role } : null,
          });
        }
        
        // Navigate after auth.me is synced
        setLocation(redirectTo);
        return;
      }
    } catch (demoError: any) {
      // Demo login failed - show error
      setError(demoError?.message || 'Invalid username or password. Please try again.');
      
      if (import.meta.env.DEV) {
        console.error("[DEMO_SWITCH] error", {
          transitionId,
          currentTransitionId: getCurrentTransitionId(),
          error: demoError?.message || String(demoError),
        });
      }
    } finally {
      // Always clear transition and loading state
      if (import.meta.env.DEV) {
        // Clear fail-safe timeout
        if (transitionTimeoutId) {
          clearTimeout(transitionTimeoutId);
          transitionTimeoutId = null;
        }
        
        console.log("[DEMO_SWITCH] finally (clearing transition)", {
          transitionId,
          currentTransitionId: getCurrentTransitionId(),
        });
        clearDemoTransition();
      }
      setIsLoading(false);
    }
  };

  const demoCredentials = [
    { role: 'Farmer', username: 'farmer', password: 'demo123', name: 'Juan dela Cruz', roleKey: 'farmer' as const },
    { role: 'Field Officer', username: 'officer', password: 'demo123', name: 'Maria Santos', roleKey: 'field_officer' as const },
    { role: 'Manager', username: 'manager', password: 'demo123', name: 'Roberto Garcia', roleKey: 'manager' as const }
  ];

  const fillDemoCredentials = (user: string, pass: string, roleKey: 'farmer' | 'field_officer' | 'manager') => {
    // Fill credentials and immediately submit to avoid race conditions
    // This ensures state is set before submit runs
    setUsername(user);
    setPassword(pass);
    setError('');
    
    // Submit immediately after state is set (React will batch the state updates)
    // Use setTimeout to ensure state updates are applied before submit
    setTimeout(() => {
      const form = document.querySelector('form');
      if (form) {
        form.requestSubmit();
      }
    }, 0);
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 relative"
      style={{
        backgroundImage: 'url(/rice-terraces-bg.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Dark overlay for better text contrast */}
      <div className="absolute inset-0 bg-black/40"></div>
      
      <div className="w-full max-w-md relative z-10">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <img 
            src="/sunray-logo.png" 
            alt="MAGSASA-CARD Logo" 
            className="h-24 w-24 mx-auto mb-4"
          />
          <h1 className="text-4xl font-bold text-white mb-2">MAGSASA-CARD</h1>
          <p className="text-white text-lg">Agricultural Management System</p>
        </div>

        {/* Login Card */}
        <Card>
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
          </CardHeader>
          
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Enter username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  disabled={isLoading}
                  autoComplete="username"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>

              {/* Demo Credentials */}
              <div className="pt-4 border-t">
                <p className="text-sm text-gray-600 mb-3">Demo Accounts (click to fill):</p>
                <div className="space-y-2">
                  {demoCredentials.map((cred) => (
                    <button
                      key={cred.role}
                      type="button"
                      onClick={() => fillDemoCredentials(cred.username, cred.password, cred.roleKey)}
                      className="w-full text-left px-3 py-2 text-sm bg-gray-50 hover:bg-gray-100 rounded-md transition-colors"
                      disabled={isLoading}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="font-medium text-primary">{cred.role}</span>
                          <span className="text-gray-600 ml-2">- {cred.name}</span>
                        </div>
                        <span className="text-xs text-gray-500">@{cred.username}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>

            <CardFooter>
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading || !username.trim() || !password.trim()}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>

        {/* Footer */}
        <p className="text-center text-sm text-white mt-6">
          Powered by © 2025 AgSense.ai. All rights reserved.
        </p>
      </div>
    </div>
  );
}

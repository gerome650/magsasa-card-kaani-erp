import { useState } from 'react';
import { useLocation } from 'wouter';
// Note: Login.tsx uses trpc.auth.demoLogin mutation directly, no useAuth hook needed
import { trpc } from '@/lib/trpc';
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
    setIsLoading(true);

    try {
      // First try demo login (creates server session cookie)
      const demoResult = await demoLoginMutation.mutateAsync({
        username,
        password,
      });

      if (demoResult.success) {
        // Get current override to detect role change
        const currentOverride = localStorage.getItem("demo_role_override");
        let newOverride: string | null = null;
        
        // Determine new override from username
        if (username === 'farmer') {
          newOverride = "farmer";
        } else if (username === 'officer') {
          newOverride = "field_officer";
        } else if (username === 'manager') {
          newOverride = "manager";
        }
        
        // Set new override
        if (newOverride) {
          localStorage.setItem("demo_role_override", newOverride);
          
          // If role changed, start role switch window
          if (currentOverride && currentOverride !== newOverride) {
            const roleSwitchEnd = Date.now() + 2000; // 2 second role switch window
            try {
              localStorage.setItem('demo_role_switch_end', roleSwitchEnd.toString());
              if (import.meta.env.DEV) {
                console.log("[Login] DEV: Role override changed -> starting role switch window until", new Date(roleSwitchEnd).toISOString());
              }
            } catch (e) {
              // localStorage not available
            }
          }
        } else if (!currentOverride) {
          // If no override set, try to infer from username
          if (username === 'farmer') {
            localStorage.setItem("demo_role_override", "farmer");
          } else if (username === 'officer') {
            localStorage.setItem("demo_role_override", "field_officer");
          } else if (username === 'manager') {
            localStorage.setItem("demo_role_override", "manager");
          }
        }
        
        // Force refetch auth.me to ensure user state is updated before navigating
        // This prevents flicker/redirect loops when switching accounts
        try {
          // Set demo session marker and grace window in localStorage (useAuth will read them)
          // Note: HttpOnly cookies cannot be read from JS, so we use localStorage markers
          // Increased grace window to 3000ms for more stability
          const graceWindowEnd = Date.now() + 3000; // 3 second grace window
          try {
            localStorage.setItem('demo_session_present', '1');
            localStorage.setItem('demo_grace_window_end', graceWindowEnd.toString());
            if (import.meta.env.DEV) {
              console.log("[Login] DEV: Demo session marker set, grace window until", new Date(graceWindowEnd).toISOString());
            }
          } catch (e) {
            // localStorage not available
          }
          
          // CRITICAL: Wait for state to propagate before navigating
          // This ensures AuthGate and ProtectedRoute see the demo session marker
          await new Promise(resolve => setTimeout(resolve, 200));
          
          // Small delay to ensure cookie is set by server
          await new Promise(resolve => setTimeout(resolve, 50));
          
          // Invalidate and refetch auth.me
          // placeholderData will preserve previous user data during refetch
          await utils.auth.me.invalidate();
          await utils.auth.me.refetch();
          
          // After refetch, check if we have user data and optimistically update cache
          // This prevents any flicker during the transition
          const currentUser = utils.auth.me.getData();
          if (currentUser) {
            utils.auth.me.setData(undefined, currentUser);
          }
          
          // Wait for auth.me to return a user OR timeout (1500ms)
          // AuthGate will hold UI steady during this transition
          const maxWait = 1500; // 1.5 second max wait
          const startTime = Date.now();
          
          while (Date.now() - startTime < maxWait) {
            // Check current auth.me data from query cache (refetch updates the cache)
            // placeholderData ensures this won't be undefined during refetch
            const currentUser = utils.auth.me.getData();
            
            // If we have a user, wait a bit more for state to propagate, then navigate
            if (currentUser) {
              if (import.meta.env.DEV) {
                console.log("[Login] DEV: User confirmed, waiting for state propagation before navigating");
              }
              // Small delay to ensure all reactive state has updated
              await new Promise(resolve => setTimeout(resolve, 100));
              setLocation(redirectTo);
              return;
            }
            
            // Wait a bit and check again
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Try refetching again and check cache
            try {
              await utils.auth.me.refetch();
              const retryUser = utils.auth.me.getData();
              if (retryUser) {
                if (import.meta.env.DEV) {
                  console.log("[Login] DEV: auth.me returned user after retry, waiting for state propagation before navigating");
                }
                // Small delay to ensure all reactive state has updated
                await new Promise(resolve => setTimeout(resolve, 100));
                setLocation(redirectTo);
                return;
              }
            } catch (e) {
              // Ignore refetch errors, continue checking
            }
          }
          
          // Timeout reached - wait a bit more for state propagation, then navigate
          // AuthGate will hold UI steady, grace window is active, so ProtectedRoute won't redirect
          if (import.meta.env.DEV) {
            console.log("[Login] DEV: Timeout reached, waiting for state propagation before navigating");
          }
          await new Promise(resolve => setTimeout(resolve, 100));
          setLocation(redirectTo);
        } catch (error) {
          // If refetch fails but demo marker exists, navigate anyway (AuthGate will handle stability)
          const hasDemoMarker = localStorage.getItem('demo_session_present') === '1';
          if (hasDemoMarker) {
            if (import.meta.env.DEV) {
              console.log("[Login] DEV: Demo session marker present, navigating despite refetch error");
            }
            setLocation(redirectTo);
          } else {
            console.error("[Login] auth.me refetch failed and no demo session marker found", error);
            setError("Login succeeded but could not verify session. Please try again.");
          }
        }
        return;
      }
    } catch (demoError: any) {
      // Demo login failed - show error
      setError(demoError?.message || 'Invalid username or password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const demoCredentials = [
    { role: 'Farmer', username: 'farmer', password: 'demo123', name: 'Juan dela Cruz', roleKey: 'farmer' },
    { role: 'Field Officer', username: 'officer', password: 'demo123', name: 'Maria Santos', roleKey: 'field_officer' },
    { role: 'Manager', username: 'manager', password: 'demo123', name: 'Roberto Garcia', roleKey: 'manager' }
  ];

  const fillDemoCredentials = (user: string, pass: string, roleKey: string) => {
    setUsername(user);
    setPassword(pass);
    setError('');
    // Persist demo role override for role-based UI gating
    try {
      const currentOverride = localStorage.getItem("demo_role_override");
      localStorage.setItem("demo_role_override", roleKey);
      
      // If role changed, start role switch window (DEV only)
      if (import.meta.env.DEV && currentOverride && currentOverride !== roleKey) {
        const roleSwitchEnd = Date.now() + 2000; // 2 second role switch window
        localStorage.setItem('demo_role_switch_end', roleSwitchEnd.toString());
        if (import.meta.env.DEV) {
          console.log("[Login] DEV: Role override changed in fillDemoCredentials -> starting role switch window until", new Date(roleSwitchEnd).toISOString());
        }
      }
    } catch (e) {
      // localStorage may not be available
      console.warn("Failed to set demo_role_override:", e);
    }
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
                disabled={isLoading}
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

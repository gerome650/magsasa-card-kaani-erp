import { useState } from 'react';
import { useLocation } from 'wouter';
// Note: Login.tsx uses trpc.auth.demoLogin mutation directly, no useAuth hook needed
import { trpc } from '@/lib/trpc';
import { startDemoTransition, clearDemoTransition } from '@/_core/demo/demoTransitionStore';
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
      // Determine role from username (server will use this to set JWT role)
      let role: 'farmer' | 'field_officer' | 'manager' | undefined;
      if (username === 'farmer') {
        role = 'farmer';
      } else if (username === 'officer') {
        role = 'field_officer';
      } else if (username === 'manager') {
        role = 'manager';
      }

      // First try demo login (creates server session cookie with role embedded in JWT)
      const demoResult = await demoLoginMutation.mutateAsync({
        username,
        password,
        role, // Send role explicitly - server will embed it in JWT
      });

      if (demoResult.success === true) {
        // Set demo session markers in localStorage (for useAuth grace window logic)
        // Note: HttpOnly cookies cannot be read from JS, so we use localStorage markers
        const graceWindowEnd = Date.now() + 3000; // 3 second grace window
        try {
          localStorage.setItem('demo_session_present', '1');
          localStorage.setItem('demo_grace_window_end', graceWindowEnd.toString());
        } catch (e) {
          // localStorage not available
        }
        
        // CRITICAL: Clear demo transition BEFORE refetch (synchronous, no delay)
        if (import.meta.env.DEV) {
          clearDemoTransition();
        }
        
        // Invalidate and refetch auth.me to sync with server session cookie
        // This ensures the client auth state matches the server session
        // DO NOT call legacy login() - rely solely on server session cookie + TRPC auth.me
        await utils.auth.me.invalidate();
        await utils.auth.me.refetch();
        
        // DEV-only: Log successful demo login
        if (import.meta.env.DEV) {
          console.log("[DEMO] demoLogin success; refetching auth.me and navigating", { username, redirectTo });
        }
        
        // Navigate after auth.me is synced
        setLocation(redirectTo);
        return;
      }
    } catch (demoError: any) {
      // Demo login failed - show error
      // Note: Legacy AuthContext.login() fallback is kept for backwards compatibility ONLY
      // but demo_role_override writes are removed (obsolete, cause role mismatch flicker)
      setError(demoError?.message || 'Invalid username or password. Please try again.');
      
      // Fallback legacy login (backwards compatibility only)
      // Note: AuthContext.login() is deprecated stub, but kept for compatibility
      // DO NOT write demo_role_override here - it causes role mismatch flicker
      // If fallback needed in future, use trpc.auth.demoLogin with different credentials
    } finally {
      setIsLoading(false);
    }
  };

  const demoCredentials = [
    { role: 'Farmer', username: 'farmer', password: 'demo123', name: 'Juan dela Cruz', roleKey: 'farmer' as const },
    { role: 'Field Officer', username: 'officer', password: 'demo123', name: 'Maria Santos', roleKey: 'field_officer' as const },
    { role: 'Manager', username: 'manager', password: 'demo123', name: 'Roberto Garcia', roleKey: 'manager' as const }
  ];

  const fillDemoCredentials = (user: string, pass: string, roleKey: 'farmer' | 'field_officer' | 'manager') => {
    // DEV-ONLY: Start demo transition SYNCHRONOUSLY at the very top, BEFORE any other operations
    // This prevents flicker by blocking UI rendering immediately on click (no delay)
    if (import.meta.env.DEV) {
      startDemoTransition(2000); // 2 second transition window
    }
    
    setUsername(user);
    setPassword(pass);
    setError('');
    
    // NO MORE localStorage role override - role is now server-driven via JWT
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

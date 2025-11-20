import { useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
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
  const { login } = useAuth();
  const [, setLocation] = useLocation();
  const [location] = useLocation();

  // Get redirect path from query params or default to dashboard
  const searchParams = new URLSearchParams(location.split('?')[1]);
  const redirectTo = searchParams.get('redirect') || '/';

  const demoLoginMutation = trpc.auth.demoLogin.useMutation();

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
        // Also update client-side auth state
        await login(username, password);
        setLocation(redirectTo);
        return;
      }
    } catch (demoError: any) {
      // If demo login fails, fall back to client-side auth
      // (for backwards compatibility or if server is unavailable)
      const result = await login(username, password);
      
      if (result.success) {
        setLocation(redirectTo);
      } else {
        setError(demoError?.message || result.error || 'Invalid username or password');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const demoCredentials = [
    { role: 'Farmer', username: 'farmer', password: 'demo123', name: 'Juan dela Cruz' },
    { role: 'Field Officer', username: 'officer', password: 'demo123', name: 'Maria Santos' },
    { role: 'Manager', username: 'manager', password: 'demo123', name: 'Roberto Garcia' }
  ];

  const fillDemoCredentials = (user: string, pass: string) => {
    setUsername(user);
    setPassword(pass);
    setError('');
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
                      onClick={() => fillDemoCredentials(cred.username, cred.password)}
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

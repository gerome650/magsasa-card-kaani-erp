import { useAuth } from "@/_core/hooks/useAuth";

/**
 * DEV-ONLY: tRPC connection test page.
 * Uses the unified useAuth hook (not direct trpc.auth.me.useQuery) for consistency.
 */
export default function TRPCTest() {
  const { user, loading: isLoading, error } = useAuth();

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">tRPC Connection Test</h1>
      
      <div className="border rounded-lg p-6 bg-card">
        <h2 className="text-lg font-semibold mb-3">Authentication Status</h2>
        
        {isLoading && (
          <p className="text-muted-foreground">Loading...</p>
        )}
        
        {error && (
          <div className="bg-red-50 border border-red-200 rounded p-4">
            <p className="text-red-800 font-semibold">Error:</p>
            <p className="text-red-600">{error.message}</p>
          </div>
        )}
        
        {!isLoading && !error && user && (
          <div className="bg-green-50 border border-green-200 rounded p-4">
            <p className="text-green-800 font-semibold">✅ tRPC Connection Successful!</p>
            <div className="mt-2 text-sm">
              <p><strong>User ID:</strong> {user.id}</p>
              <p><strong>Name:</strong> {user.name || "N/A"}</p>
              <p><strong>Email:</strong> {user.email || "N/A"}</p>
              <p><strong>Role:</strong> {user.role}</p>
            </div>
          </div>
        )}
        
        {!isLoading && !error && !user && (
          <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
            <p className="text-yellow-800">No user authenticated (this is expected for public access)</p>
          </div>
        )}
      </div>
    </div>
  );
}

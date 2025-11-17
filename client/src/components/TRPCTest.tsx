import { trpc } from '@/lib/trpc';

/**
 * Test component to verify tRPC API connection
 * This will be removed after verification
 */
export default function TRPCTest() {
  const { data, isLoading, error } = trpc.farms.list.useQuery();

  return (
    <div className="fixed bottom-4 right-4 bg-white border-2 border-green-600 rounded-lg p-4 shadow-lg max-w-md z-50">
      <h3 className="font-bold text-lg mb-2">🧪 tRPC API Test</h3>
      
      {isLoading && (
        <div className="text-blue-600">
          ⏳ Loading farms from database...
        </div>
      )}

      {error && (
        <div className="text-red-600">
          ❌ Error: {error.message}
        </div>
      )}

      {data && (
        <div className="text-green-600">
          ✅ Success! Loaded {data.length} farms from database
          <div className="text-sm text-gray-600 mt-2">
            {data.slice(0, 3).map((farm: any) => (
              <div key={farm.id}>• {farm.name}</div>
            ))}
            {data.length > 3 && <div>... and {data.length - 3} more</div>}
          </div>
        </div>
      )}
    </div>
  );
}

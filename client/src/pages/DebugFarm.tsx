import { trpc } from "@/lib/trpc";

export default function DebugFarm() {
  const { data, isLoading, error } = trpc.farms.getById.useQuery({ id: 1 });

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">Farm Debug Page</h1>
      
      {isLoading && <p>Loading...</p>}
      
      {error && (
        <div className="bg-red-50 border border-red-200 rounded p-4 mb-4">
          <p className="text-red-800 font-semibold">Error:</p>
          <p className="text-red-600">{error.message}</p>
        </div>
      )}
      
      {data && (
        <div className="bg-green-50 border border-green-200 rounded p-4">
          <p className="text-green-800 font-semibold mb-2">✅ Farm Data Loaded!</p>
          <pre className="text-sm bg-white p-4 rounded overflow-auto">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      )}
      
      {!isLoading && !error && !data && (
        <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
          <p className="text-yellow-800">No data returned (null/undefined)</p>
        </div>
      )}
    </div>
  );
}

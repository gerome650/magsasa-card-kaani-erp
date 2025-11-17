import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FarmsSkeleton } from "@/components/FarmsSkeleton";
import { FarmListSkeleton } from "@/components/FarmListSkeleton";
import { RefreshCw } from "lucide-react";

export default function SkeletonDemo() {
  const [showCardSkeleton, setShowCardSkeleton] = useState(false);
  const [showTableSkeleton, setShowTableSkeleton] = useState(false);

  const demonstrateCardSkeleton = () => {
    setShowCardSkeleton(true);
    setTimeout(() => setShowCardSkeleton(false), 3000);
  };

  const demonstrateTableSkeleton = () => {
    setShowTableSkeleton(true);
    setTimeout(() => setShowTableSkeleton(false), 3000);
  };

  return (
    <div className="container mx-auto p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Loading Skeleton Demo</h1>
        <p className="text-muted-foreground">
          Demonstration of loading skeletons for farm list pages
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Card-Based Layout Skeleton</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Used in <code className="bg-muted px-2 py-1 rounded">/farms</code> page with grid layout
            </p>
            <Button onClick={demonstrateCardSkeleton} className="w-full">
              <RefreshCw className="w-4 h-4 mr-2" />
              Show Card Skeleton (3s)
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Table-Based Layout Skeleton</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Alternative table layout with filters and statistics
            </p>
            <Button onClick={demonstrateTableSkeleton} className="w-full">
              <RefreshCw className="w-4 h-4 mr-2" />
              Show Table Skeleton (3s)
            </Button>
          </CardContent>
        </Card>
      </div>

      {showCardSkeleton && (
        <div className="border-2 border-dashed border-blue-300 rounded-lg p-6">
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-blue-600">Card Skeleton Preview</h2>
            <p className="text-sm text-muted-foreground">
              This skeleton matches the card-based farm list layout
            </p>
          </div>
          <FarmsSkeleton />
        </div>
      )}

      {showTableSkeleton && (
        <div className="border-2 border-dashed border-green-300 rounded-lg p-6">
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-green-600">Table Skeleton Preview</h2>
            <p className="text-sm text-muted-foreground">
              This skeleton matches the table-based farm list layout
            </p>
          </div>
          <FarmListSkeleton />
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Implementation Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Components Created:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li><code className="bg-muted px-2 py-1 rounded">FarmsSkeleton</code> - Card-based grid layout skeleton</li>
              <li><code className="bg-muted px-2 py-1 rounded">FarmListSkeleton</code> - Table-based layout skeleton</li>
              <li><code className="bg-muted px-2 py-1 rounded">Skeleton</code> - Base skeleton component from shadcn/ui</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Features:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Matches exact layout of actual content</li>
              <li>Smooth pulsing animation</li>
              <li>Proper spacing and sizing</li>
              <li>Responsive design (mobile, tablet, desktop)</li>
              <li>Accessible (respects prefers-reduced-motion)</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Usage:</h3>
            <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto">
{`// In Farms.tsx
const { data, isLoading, error } = trpc.farms.list.useQuery();

if (isLoading) {
  return <FarmsSkeleton />;
}

if (error) {
  return <ErrorState error={error} />;
}

return <FarmsList data={data} />;`}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

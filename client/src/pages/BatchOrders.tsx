import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  batchOrders,
  getActiveBatchOrders,
  getBatchOrdersByStatus,
  calculateTotalSavings,
  calculateTotalBatchValue,
  getTotalParticipatingFarmers,
  BatchOrder
} from "@/data/batchOrdersData";
import BatchOrderCard from "@/components/BatchOrderCard";
import DeliverySchedule from "@/components/DeliverySchedule";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Package,
  TrendingUp,
  Users,
  DollarSign,
  Plus,
  Filter,
  Download
} from "lucide-react";
import { toast } from "sonner";

export default function BatchOrders() {
  const { user } = useAuth();
  const [selectedTab, setSelectedTab] = useState<string>("all");
  const [view, setView] = useState<'batches' | 'delivery'>('batches');

  // Calculate metrics
  const activeBatches = getActiveBatchOrders();
  const totalValue = calculateTotalBatchValue();
  const totalSavings = calculateTotalSavings();
  const participatingFarmers = getTotalParticipatingFarmers();
  const avgSavingsPerFarmer = participatingFarmers > 0 ? Math.round(totalSavings / participatingFarmers) : 0;

  // Filter batches by tab
  const getFilteredBatches = (): BatchOrder[] => {
    switch (selectedTab) {
      case 'collecting':
        return getBatchOrdersByStatus('collecting');
      case 'ready':
        return getBatchOrdersByStatus('ready');
      case 'ordered':
        return getBatchOrdersByStatus('ordered');
      case 'in-transit':
        return getBatchOrdersByStatus('in-transit');
      case 'delivered':
        return getBatchOrdersByStatus('delivered');
      default:
        return batchOrders;
    }
  };

  const filteredBatches = getFilteredBatches();

  // Handlers
  const handleViewDetails = (batch: BatchOrder) => {
    toast.info(`Opening details for ${batch.batchNumber}`);
    // TODO: Open batch detail dialog
  };

  const handleAddFarmers = (batch: BatchOrder) => {
    toast.info(`Adding farmers to ${batch.batchNumber}`);
    // TODO: Open add farmers dialog
  };

  const handleCloseEarly = (batch: BatchOrder) => {
    toast.success(`Batch ${batch.batchNumber} closed and ready to order!`);
    // TODO: Implement close batch logic
  };

  const handleCreateBatch = () => {
    toast.info("Opening create batch dialog");
    // TODO: Open create batch dialog
  };

  const handleExportReport = () => {
    toast.success("Exporting batch orders report...");
    // TODO: Implement export functionality
  };

  // Check permissions
  const canManageBatches = user?.role === 'manager' || user?.role === 'field_officer';

  if (!canManageBatches) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-bold mb-2">Access Restricted</h2>
            <p className="text-muted-foreground mb-6">
              Batch order management is only available for Field Officers and Managers.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Batch Orders</h1>
          <p className="text-muted-foreground">
            Aggregate farmer orders to meet supplier MOQs and maximize savings
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportReport}>
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
          <Button onClick={handleCreateBatch}>
            <Plus className="w-4 h-4 mr-2" />
            Create Batch
          </Button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Package className="w-4 h-4" />
              Active Batches
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{activeBatches.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {batchOrders.length} total batches
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Total Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">₱{(totalValue / 1000000).toFixed(1)}M</div>
            <p className="text-xs text-muted-foreground mt-1">
              Across all batches
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="w-4 h-4" />
              Participating Farmers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{participatingFarmers}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Unique farmers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Total Savings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              ₱{(totalSavings / 1000).toFixed(0)}K
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              ₱{avgSavingsPerFarmer.toLocaleString()} avg per farmer
            </p>
          </CardContent>
        </Card>
      </div>

      {/* View Selector */}
      <div className="flex gap-2 mb-4">
        <Button
          variant={view === 'batches' ? 'default' : 'outline'}
          onClick={() => setView('batches')}
        >
          <Package className="w-4 h-4 mr-2" />
          Batch Orders
        </Button>
        <Button
          variant={view === 'delivery' ? 'default' : 'outline'}
          onClick={() => setView('delivery')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><rect width="16" height="16" x="3" y="4" rx="2"/><path d="M7 8h10"/><path d="M7 12h10"/><path d="M7 16h10"/></svg>
          Delivery Schedule
        </Button>
      </div>

      {view === 'delivery' ? (
        <DeliverySchedule />
      ) : (
        <>
        <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Batch Orders</CardTitle>
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="all">
                All ({batchOrders.length})
              </TabsTrigger>
              <TabsTrigger value="collecting">
                Collecting ({getBatchOrdersByStatus('collecting').length})
              </TabsTrigger>
              <TabsTrigger value="ready">
                Ready ({getBatchOrdersByStatus('ready').length})
              </TabsTrigger>
              <TabsTrigger value="ordered">
                Ordered ({getBatchOrdersByStatus('ordered').length})
              </TabsTrigger>
              <TabsTrigger value="in-transit">
                In Transit ({getBatchOrdersByStatus('in-transit').length})
              </TabsTrigger>
              <TabsTrigger value="delivered">
                Delivered ({getBatchOrdersByStatus('delivered').length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value={selectedTab} className="mt-6">
              {filteredBatches.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No batches found</h3>
                  <p className="text-muted-foreground mb-4">
                    {selectedTab === 'all' 
                      ? 'Create your first batch order to get started'
                      : `No batches with status "${selectedTab}"`
                    }
                  </p>
                  {selectedTab === 'all' && (
                    <Button onClick={handleCreateBatch}>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Batch Order
                    </Button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredBatches.map((batch) => (
                    <BatchOrderCard
                      key={batch.id}
                      batch={batch}
                      onViewDetails={handleViewDetails}
                      onAddFarmers={handleAddFarmers}
                      onCloseEarly={handleCloseEarly}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">MOQ Achievement Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {Math.round((getBatchOrdersByStatus('ready').length + getBatchOrdersByStatus('ordered').length + getBatchOrdersByStatus('in-transit').length + getBatchOrdersByStatus('delivered').length) / batchOrders.length * 100)}%
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Batches reaching MOQ
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Avg Time to MOQ</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5.2 days</div>
            <p className="text-sm text-muted-foreground mt-1">
              From creation to MOQ met
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Avg Farmers per Batch</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(batchOrders.reduce((sum, b) => sum + b.farmerCount, 0) / batchOrders.length)}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Across all batches
            </p>
          </CardContent>
        </Card>
      </div>
      </>
      )}
    </div>
  );
}

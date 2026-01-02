import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Filter, Loader2 } from "lucide-react";
import { toast } from "sonner";

const statusColors = {
  draft: "bg-gray-500",
  pending_approval: "bg-yellow-500",
  approved: "bg-green-500",
  cancelled: "bg-red-500",
  completed: "bg-blue-500",
};

const statusLabels = {
  draft: "Draft",
  pending_approval: "Pending Approval",
  approved: "Approved",
  cancelled: "Cancelled",
  completed: "Completed",
};

export default function BatchOrdersList() {
  const [, navigate] = useLocation();
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");

  const { data, isLoading, error } = trpc.batchOrder.list.useQuery({
    status: statusFilter.length > 0 ? statusFilter as any : undefined,
    fromDate: fromDate || undefined,
    toDate: toDate || undefined,
    limit: 50,
    offset: 0,
  });

  const orders = data?.items || [];

  const handleCreateBatch = () => {
    navigate("/batch-orders/new");
  };

  const handleRowClick = (orderId: string) => {
    navigate(`/batch-orders/${orderId}`);
  };

  const formatCurrency = (value: string | number) => {
    const num = typeof value === "string" ? parseFloat(value) : value;
    return `₱${num.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-PH", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (error) {
    toast.error("Failed to load batch orders");
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Batch Orders</h1>
          <p className="text-muted-foreground">
            Manage agricultural input batch orders with margin pricing
          </p>
        </div>
        <Button onClick={handleCreateBatch}>
          <Plus className="w-4 h-4 mr-2" />
          Create Batch Order
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Status</label>
              <Select
                value={statusFilter[0] || "all"}
                onValueChange={(value) => {
                  if (value === "all") {
                    setStatusFilter([]);
                  } else {
                    setStatusFilter([value]);
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="pending_approval">Pending Approval</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">From Date</label>
              <input
                type="date"
                className="w-full px-3 py-2 border rounded-md"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">To Date</label>
              <input
                type="date"
                className="w-full px-3 py-2 border rounded-md"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Batch Orders ({orders.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">No batch orders found</p>
              <Button onClick={handleCreateBatch}>
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Batch Order
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Reference</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Input Type</TableHead>
                    <TableHead>Expected Delivery</TableHead>
                    <TableHead className="text-right">Total Quantity</TableHead>
                    <TableHead className="text-right">Farmer Total</TableHead>
                    <TableHead className="text-right">AgSense Revenue</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow
                      key={order.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleRowClick(order.id)}
                    >
                      <TableCell className="font-medium">{order.referenceCode}</TableCell>
                      <TableCell>
                        <Badge className={statusColors[order.status]}>
                          {statusLabels[order.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="capitalize">
                        {order.inputType || "—"}
                      </TableCell>
                      <TableCell>{formatDate(order.expectedDeliveryDate)}</TableCell>
                      <TableCell className="text-right">
                        {parseFloat(order.totalQuantity).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(order.totalFarmerTotal)}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-green-600">
                        {formatCurrency(order.totalAgsenseRevenue)}
                      </TableCell>
                      <TableCell>{formatDate(typeof order.createdAt === 'string' ? order.createdAt : order.createdAt.toISOString())}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

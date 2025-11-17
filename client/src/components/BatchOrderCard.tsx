import { BatchOrder, calculateMOQProgress } from "@/data/batchOrdersData";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Calendar,
  MapPin,
  Package,
  TrendingUp,
  Users,
  DollarSign,
  Clock,
  CheckCircle2,
  Truck,
  AlertCircle
} from "lucide-react";

interface BatchOrderCardProps {
  batch: BatchOrder;
  onViewDetails?: (batch: BatchOrder) => void;
  onAddFarmers?: (batch: BatchOrder) => void;
  onCloseEarly?: (batch: BatchOrder) => void;
  showActions?: boolean;
}

export default function BatchOrderCard({
  batch,
  onViewDetails,
  onAddFarmers,
  onCloseEarly,
  showActions = true
}: BatchOrderCardProps) {
  const progress = calculateMOQProgress(batch);
  const remaining = batch.moq - batch.currentQuantity;
  const savingsPerUnit = batch.unitPrice - batch.bulkPrice;

  // Status badge configuration
  const statusConfig = {
    collecting: { label: 'Collecting', color: 'bg-blue-500', icon: Clock },
    ready: { label: 'Ready', color: 'bg-green-500', icon: CheckCircle2 },
    ordered: { label: 'Ordered', color: 'bg-purple-500', icon: Package },
    'in-transit': { label: 'In Transit', color: 'bg-orange-500', icon: Truck },
    delivered: { label: 'Delivered', color: 'bg-emerald-500', icon: CheckCircle2 },
    distributed: { label: 'Distributed', color: 'bg-gray-500', icon: CheckCircle2 },
    cancelled: { label: 'Cancelled', color: 'bg-red-500', icon: AlertCircle }
  };

  const status = statusConfig[batch.status];
  const StatusIcon = status.icon;

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-mono text-muted-foreground">
                {batch.batchNumber}
              </span>
              <Badge className={`${status.color} text-white`}>
                <StatusIcon className="w-3 h-3 mr-1" />
                {status.label}
              </Badge>
            </div>
            <h3 className="font-semibold text-base leading-tight mb-1">
              {batch.productName}
            </h3>
            <p className="text-sm text-muted-foreground">
              {batch.supplierName}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* MOQ Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">
              {batch.currentQuantity} / {batch.moq} {batch.unit}
            </span>
            <span className="text-muted-foreground">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
          {batch.status === 'collecting' && (
            <p className="text-xs text-muted-foreground">
              {remaining > 0 ? (
                <>
                  <span className="font-medium text-orange-600">{remaining} {batch.unit}</span> needed to reach MOQ
                </>
              ) : (
                <span className="font-medium text-green-600">MOQ reached! Ready to order</span>
              )}
            </p>
          )}
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2 text-sm">
            <Users className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="font-medium">{batch.farmerCount}</p>
              <p className="text-xs text-muted-foreground">Farmers</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <DollarSign className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="font-medium">₱{batch.totalValue.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Total Value</p>
            </div>
          </div>
        </div>

        {/* Savings Highlight */}
        <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-green-700 dark:text-green-400">
              Save ₱{savingsPerUnit.toLocaleString()}/{batch.unit}
            </span>
          </div>
          <p className="text-xs text-green-600 dark:text-green-500">
            Total savings: ₱{batch.estimatedSavings.toLocaleString()}
          </p>
        </div>

        {/* Timeline */}
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span>
              {batch.status === 'collecting' ? 'Closes' : 'Closed'}: {new Date(batch.closesAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
          {batch.deliveryDate && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Truck className="w-4 h-4" />
              <span>
                Delivery: {new Date(batch.deliveryDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
          )}
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="w-4 h-4" />
            <span className="truncate">{batch.deliveryLocation}</span>
          </div>
        </div>

        {/* Notes */}
        {batch.notes && (
          <p className="text-xs text-muted-foreground border-t pt-3">
            {batch.notes}
          </p>
        )}

        {/* Actions */}
        {showActions && (
          <div className="flex gap-2 pt-2">
            <Button
              variant="default"
              size="sm"
              className="flex-1"
              onClick={() => onViewDetails?.(batch)}
            >
              View Details
            </Button>
            {batch.status === 'collecting' && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onAddFarmers?.(batch)}
                >
                  Add Farmers
                </Button>
                {progress >= 100 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onCloseEarly?.(batch)}
                  >
                    Close Batch
                  </Button>
                )}
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

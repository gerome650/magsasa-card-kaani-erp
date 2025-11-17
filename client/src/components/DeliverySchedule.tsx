import { useState } from "react";
import { deliveryRoutes, batchOrders, DeliveryRoute } from "@/data/batchOrdersData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  MapPin,
  Truck,
  Clock,
  Package,
  Users,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";

export default function DeliverySchedule() {
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  // Group routes by date
  const routesByDate = deliveryRoutes.reduce((acc, route) => {
    const date = route.scheduledDate.split('T')[0];
    if (!acc[date]) acc[date] = [];
    acc[date].push(route);
    return acc;
  }, {} as Record<string, DeliveryRoute[]>);

  // Get upcoming dates (next 7 days)
  const upcomingDates = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() + i);
    return date.toISOString().split('T')[0];
  });

  const selectedRoutes = routesByDate[selectedDate] || [];

  const handleStartDelivery = (routeId: string) => {
    toast.success("Delivery started!", {
      description: "Driver has been notified and route tracking is active."
    });
  };

  const handleCompleteDelivery = (routeId: string) => {
    toast.success("Delivery completed!", {
      description: "All farmers have been notified to collect their orders."
    });
  };

  const getStatusColor = (status: DeliveryRoute['status']) => {
    switch (status) {
      case 'planned': return 'bg-blue-500';
      case 'in-progress': return 'bg-orange-500';
      case 'completed': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: DeliveryRoute['status']) => {
    switch (status) {
      case 'planned': return Clock;
      case 'in-progress': return Truck;
      case 'completed': return CheckCircle2;
      default: return AlertCircle;
    }
  };

  return (
    <div className="space-y-6">
      {/* Date Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Delivery Schedule
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {upcomingDates.map((date) => {
              const routeCount = routesByDate[date]?.length || 0;
              const dateObj = new Date(date);
              const isSelected = date === selectedDate;
              const isToday = date === new Date().toISOString().split('T')[0];

              return (
                <button
                  key={date}
                  onClick={() => setSelectedDate(date)}
                  className={`flex-shrink-0 border rounded-lg p-3 min-w-[100px] transition-colors ${
                    isSelected
                      ? 'bg-green-600 text-white border-green-600'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-900'
                  }`}
                >
                  <div className="text-center">
                    <p className={`text-xs font-medium mb-1 ${
                      isSelected ? 'text-white' : 'text-muted-foreground'
                    }`}>
                      {dateObj.toLocaleDateString('en-US', { weekday: 'short' })}
                    </p>
                    <p className={`text-2xl font-bold ${
                      isSelected ? 'text-white' : ''
                    }`}>
                      {dateObj.getDate()}
                    </p>
                    <p className={`text-xs ${
                      isSelected ? 'text-white' : 'text-muted-foreground'
                    }`}>
                      {dateObj.toLocaleDateString('en-US', { month: 'short' })}
                    </p>
                    {routeCount > 0 && (
                      <div className={`mt-2 text-xs font-medium ${
                        isSelected ? 'text-white' : 'text-green-600'
                      }`}>
                        {routeCount} {routeCount === 1 ? 'route' : 'routes'}
                      </div>
                    )}
                    {isToday && !isSelected && (
                      <div className="mt-1 text-xs text-blue-600 font-medium">
                        Today
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Routes for Selected Date */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">
            {selectedRoutes.length === 0 ? (
              'No deliveries scheduled'
            ) : (
              <>
                {selectedRoutes.length} {selectedRoutes.length === 1 ? 'Route' : 'Routes'} on{' '}
                {new Date(selectedDate).toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </>
            )}
          </h2>
        </div>

        {selectedRoutes.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Truck className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No Deliveries</h3>
              <p className="text-muted-foreground">
                No delivery routes scheduled for this date
              </p>
            </CardContent>
          </Card>
        ) : (
          selectedRoutes.map((route) => {
            const StatusIcon = getStatusIcon(route.status);
            const totalFarmers = route.stops.reduce((sum, stop) => sum + stop.farmerCount, 0);
            const totalQuantity = route.stops.reduce((sum, stop) => sum + stop.totalQuantity, 0);
            
            // Get batch details
            const routeBatches = route.batchOrderIds.map(id => 
              batchOrders.find(b => b.id === id)
            ).filter(Boolean);

            return (
              <Card key={route.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-mono text-sm text-muted-foreground">
                          {route.routeNumber}
                        </span>
                        <Badge className={`${getStatusColor(route.status)} text-white`}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {route.status.replace('-', ' ')}
                        </Badge>
                      </div>
                      <CardTitle className="text-lg">
                        {route.stops.map(s => s.municipality).join(' → ')}
                      </CardTitle>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Route Info */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{totalFarmers}</p>
                        <p className="text-xs text-muted-foreground">Farmers</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{totalQuantity}</p>
                        <p className="text-xs text-muted-foreground">Total Units</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{route.stops.length}</p>
                        <p className="text-xs text-muted-foreground">Stops</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{route.estimatedDuration}m</p>
                        <p className="text-xs text-muted-foreground">Est. Duration</p>
                      </div>
                    </div>
                  </div>

                  {/* Driver Info */}
                  {route.driverName && (
                    <div className="border rounded-lg p-3 bg-gray-50 dark:bg-gray-900">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">{route.driverName}</p>
                          <p className="text-xs text-muted-foreground">
                            Vehicle: {route.vehicleNumber}
                          </p>
                        </div>
                        <Truck className="w-8 h-8 text-muted-foreground" />
                      </div>
                    </div>
                  )}

                  {/* Batches */}
                  <div>
                    <p className="text-sm font-medium mb-2">Batch Orders ({route.batchOrderIds.length})</p>
                    <div className="space-y-1">
                      {routeBatches.map((batch) => (
                        <div
                          key={batch?.id}
                          className="text-sm text-muted-foreground flex items-center gap-2"
                        >
                          <Package className="w-3 h-3" />
                          <span>{batch?.batchNumber} - {batch?.productName}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Delivery Stops */}
                  <div>
                    <p className="text-sm font-medium mb-2">Delivery Stops</p>
                    <div className="space-y-2">
                      {route.stops.map((stop, index) => (
                        <div
                          key={index}
                          className="flex items-start gap-3 border-l-2 border-green-600 pl-3 py-2"
                        >
                          <div className="flex-1">
                            <p className="font-medium text-sm">
                              {stop.barangay}, {stop.municipality}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {stop.farmerCount} farmers • {stop.totalQuantity} units
                            </p>
                            {stop.notes && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {stop.notes}
                              </p>
                            )}
                            {stop.completedAt && (
                              <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" />
                                Completed at {new Date(stop.completedAt).toLocaleTimeString()}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    {route.status === 'planned' && (
                      <Button
                        className="flex-1"
                        onClick={() => handleStartDelivery(route.id)}
                      >
                        <Truck className="w-4 h-4 mr-2" />
                        Start Delivery
                      </Button>
                    )}
                    {route.status === 'in-progress' && (
                      <Button
                        className="flex-1 bg-green-600 hover:bg-green-700"
                        onClick={() => handleCompleteDelivery(route.id)}
                      >
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Complete Delivery
                      </Button>
                    )}
                    {route.status === 'completed' && (
                      <div className="flex-1 text-center py-2 text-sm text-green-600 font-medium">
                        <CheckCircle2 className="w-4 h-4 inline mr-2" />
                        Delivery Completed
                      </div>
                    )}
                    <Button variant="outline">
                      View Map
                    </Button>
                  </div>

                  {/* Notes */}
                  {route.notes && (
                    <p className="text-xs text-muted-foreground border-t pt-3">
                      {route.notes}
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}

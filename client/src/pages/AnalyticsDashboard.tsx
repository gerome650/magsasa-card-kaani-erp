import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Download, TrendingUp, DollarSign, BarChart3, PieChart } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { HarvestTrendsByRegionChart } from "@/components/charts/HarvestTrendsByRegionChart";
import { CropPerformanceChart } from "@/components/charts/CropPerformanceChart";
import { CostBreakdownChart } from "@/components/charts/CostBreakdownChart";
import { ROIByCropChart } from "@/components/charts/ROIByCropChart";
import { RegionalComparisonChart } from "@/components/charts/RegionalComparisonChart";

export default function AnalyticsDashboard() {
  const [region, setRegion] = useState<"all" | "bacolod" | "laguna">("all");
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [cropMetric, setCropMetric] = useState<"quantity" | "yield" | "revenue">("revenue");
  const [regionalMetric, setRegionalMetric] = useState<"harvest" | "yield" | "revenue" | "roi">("revenue");

  // Format dates for API
  const startDate = dateRange.from ? format(dateRange.from, "yyyy-MM-dd") : undefined;
  const endDate = dateRange.to ? format(dateRange.to, "yyyy-MM-dd") : undefined;

  // Fetch analytics data
  const harvestTrends = trpc.analytics.harvestTrendsByRegion.useQuery({
    startDate,
    endDate,
    region,
  });

  const cropPerformance = trpc.analytics.cropPerformance.useQuery({
    startDate,
    endDate,
    region,
  });

  const costAnalysis = trpc.analytics.costAnalysis.useQuery({
    startDate,
    endDate,
    region,
  });

  const regionalComparison = trpc.analytics.regionalComparison.useQuery({
    startDate,
    endDate,
  });

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    const crops = cropPerformance.data || [];
    const costs = costAnalysis.data?.costsByCategory || [];
    const roi = costAnalysis.data?.roiByCrop || [];

    const totalRevenue = crops.reduce((sum, c) => sum + (c.totalRevenue || 0), 0);
    const totalCost = costs.reduce((sum, c) => sum + (c.totalAmount || 0), 0);
    const avgROI = roi.length > 0 
      ? roi.reduce((sum, r) => sum + r.roi, 0) / roi.length 
      : 0;
    const totalHarvest = crops.reduce((sum, c) => sum + (c.totalQuantity || 0), 0);

    return {
      totalRevenue,
      totalCost,
      avgROI,
      totalHarvest,
    };
  }, [cropPerformance.data, costAnalysis.data]);

  const handleExport = () => {
    // TODO: Implement export to PDF/PNG
    console.log("Export functionality coming soon");
  };

  const clearFilters = () => {
    setRegion("all");
    setDateRange({});
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Visual Analytics Dashboard</h1>
              <p className="text-muted-foreground mt-1">
                Comprehensive insights into harvest trends, crop performance, and cost analysis
              </p>
            </div>
            <Button onClick={handleExport} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
          </div>
        </div>
      </div>

      <div className="container py-8">
        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Filters</CardTitle>
            <CardDescription>Customize your analytics view</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              {/* Region Filter */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">Region</label>
                <Select value={region} onValueChange={(v) => setRegion(v as any)}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select region" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Regions</SelectItem>
                    <SelectItem value="bacolod">Bacolod</SelectItem>
                    <SelectItem value="laguna">Laguna</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Date Range Filter */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">Date Range</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-[280px] justify-start text-left font-normal",
                        !dateRange.from && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange.from ? (
                        dateRange.to ? (
                          <>
                            {format(dateRange.from, "LLL dd, y")} -{" "}
                            {format(dateRange.to, "LLL dd, y")}
                          </>
                        ) : (
                          format(dateRange.from, "LLL dd, y")
                        )
                      ) : (
                        <span>Pick a date range</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="range"
                      selected={{ from: dateRange.from, to: dateRange.to }}
                      onSelect={(range) => setDateRange(range || {})}
                      numberOfMonths={2}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Clear Filters */}
              <div className="flex items-end">
                <Button variant="ghost" onClick={clearFilters}>
                  Clear Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ₱{summaryStats.totalRevenue.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                From all crops
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Costs</CardTitle>
              <PieChart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ₱{summaryStats.totalCost.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                All categories
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Average ROI</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {summaryStats.avgROI.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Across all crops
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Harvest</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {summaryStats.totalHarvest.toLocaleString()} MT
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Metric tons
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Harvest Trends by Region */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Harvest Trends by Region</CardTitle>
              <CardDescription>
                Monthly harvest quantities across different municipalities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <HarvestTrendsByRegionChart
                data={harvestTrends.data || []}
                loading={harvestTrends.isLoading}
              />
            </CardContent>
          </Card>

          {/* Crop Performance */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Crop Performance</CardTitle>
                  <CardDescription>Compare crops by different metrics</CardDescription>
                </div>
                <Select value={cropMetric} onValueChange={(v) => setCropMetric(v as any)}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="revenue">Revenue</SelectItem>
                    <SelectItem value="quantity">Quantity</SelectItem>
                    <SelectItem value="yield">Yield</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <CropPerformanceChart
                data={cropPerformance.data || []}
                loading={cropPerformance.isLoading}
                metric={cropMetric}
              />
            </CardContent>
          </Card>

          {/* Cost Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Cost Breakdown</CardTitle>
              <CardDescription>Distribution of costs by category</CardDescription>
            </CardHeader>
            <CardContent>
              <CostBreakdownChart
                data={costAnalysis.data?.costsByCategory || []}
                loading={costAnalysis.isLoading}
              />
            </CardContent>
          </Card>

          {/* ROI by Crop */}
          <Card>
            <CardHeader>
              <CardTitle>Return on Investment by Crop</CardTitle>
              <CardDescription>Profitability comparison across crops</CardDescription>
            </CardHeader>
            <CardContent>
              <ROIByCropChart
                data={costAnalysis.data?.roiByCrop || []}
                loading={costAnalysis.isLoading}
              />
            </CardContent>
          </Card>

          {/* Regional Comparison */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Regional Comparison</CardTitle>
                  <CardDescription>Bacolod vs Laguna performance</CardDescription>
                </div>
                <Select value={regionalMetric} onValueChange={(v) => setRegionalMetric(v as any)}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="revenue">Revenue</SelectItem>
                    <SelectItem value="harvest">Harvest</SelectItem>
                    <SelectItem value="yield">Yield</SelectItem>
                    <SelectItem value="roi">ROI</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <RegionalComparisonChart
                data={regionalComparison.data || []}
                loading={regionalComparison.isLoading}
                metric={regionalMetric}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

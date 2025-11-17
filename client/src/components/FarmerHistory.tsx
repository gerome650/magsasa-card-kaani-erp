import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getFarmerActivities, getActivityIcon, getActivityColor, type FarmerActivity } from "@/data/farmsData";
import { Calendar, TrendingUp, Search, Filter, X, Package, Wheat, Award, DollarSign, CreditCard, GraduationCap } from "lucide-react";

interface FarmerHistoryProps {
  farmerId: string;
}

export default function FarmerHistory({ farmerId }: FarmerHistoryProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [dateRange, setDateRange] = useState<string>("all");

  const allActivities = getFarmerActivities(farmerId);

  // Filter activities
  const filteredActivities = allActivities.filter((activity) => {
    const matchesSearch =
      activity.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (activity.amount && activity.amount.toString().includes(searchQuery));

    const matchesType = selectedType === "all" || activity.type === selectedType;

    let matchesDate = true;
    if (dateRange !== "all") {
      const activityDate = new Date(activity.date);
      const now = new Date();
      const daysDiff = Math.floor((now.getTime() - activityDate.getTime()) / (1000 * 60 * 60 * 24));

      switch (dateRange) {
        case "7days":
          matchesDate = daysDiff <= 7;
          break;
        case "30days":
          matchesDate = daysDiff <= 30;
          break;
        case "90days":
          matchesDate = daysDiff <= 90;
          break;
      }
    }

    return matchesSearch && matchesType && matchesDate;
  });

  // Calculate statistics
  const stats = {
    total: allActivities.length,
    orders: allActivities.filter((a) => a.type === "order").length,
    harvests: allActivities.filter((a) => a.type === "harvest").length,
    agscores: allActivities.filter((a) => a.type === "agscore").length,
    loans: allActivities.filter((a) => a.type === "loan").length,
    payments: allActivities.filter((a) => a.type === "payment").length,
    training: allActivities.filter((a) => a.type === "training").length,
    totalValue: allActivities
      .filter((a) => a.amount)
      .reduce((sum, a) => sum + (a.amount || 0), 0),
  };

  const activeFilters = [
    selectedType !== "all" && "Type",
    dateRange !== "all" && "Date",
    searchQuery && "Search",
  ].filter(Boolean).length;

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedType("all");
    setDateRange("all");
  };

  const getColorClass = (color: string) => {
    const colors: Record<string, string> = {
      blue: "bg-blue-100 text-blue-700 border-blue-200",
      green: "bg-green-100 text-green-700 border-green-200",
      purple: "bg-purple-100 text-purple-700 border-purple-200",
      orange: "bg-orange-100 text-orange-700 border-orange-200",
      teal: "bg-teal-100 text-teal-700 border-teal-200",
      pink: "bg-pink-100 text-pink-700 border-pink-200",
      gray: "bg-gray-100 text-gray-700 border-gray-200",
    };
    return colors[color] || colors.gray;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const daysDiff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (daysDiff === 0) return "Today";
    if (daysDiff === 1) return "Yesterday";
    if (daysDiff < 7) return `${daysDiff} days ago`;
    if (daysDiff < 30) return `${Math.floor(daysDiff / 7)} weeks ago`;
    if (daysDiff < 365) return `${Math.floor(daysDiff / 30)} months ago`;

    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatAmount = (amount?: number) => {
    if (!amount) return null;
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getActivityTypeIcon = (type: string) => {
    switch (type) {
      case "order":
        return Package;
      case "harvest":
        return Wheat;
      case "agscore":
        return Award;
      case "loan":
        return DollarSign;
      case "payment":
        return CreditCard;
      case "training":
        return GraduationCap;
      default:
        return Calendar;
    }
  };

  return (
    <div className="space-y-6">
      {/* Statistics Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground mt-1">Total Activities</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">{stats.harvests}</div>
            <p className="text-xs text-muted-foreground mt-1">Harvests</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">{stats.orders}</div>
            <p className="text-xs text-muted-foreground mt-1">Orders</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-purple-600">
              {formatAmount(stats.totalValue)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Total Value</p>
          </CardContent>
        </Card>
      </div>

      {/* Activity Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Activity Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 text-blue-600 mx-auto mb-2">
                <Package className="w-5 h-5" />
              </div>
              <div className="font-bold">{stats.orders}</div>
              <p className="text-xs text-muted-foreground">Orders</p>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-100 text-green-600 mx-auto mb-2">
                <Wheat className="w-5 h-5" />
              </div>
              <div className="font-bold">{stats.harvests}</div>
              <p className="text-xs text-muted-foreground">Harvests</p>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-purple-100 text-purple-600 mx-auto mb-2">
                <Award className="w-5 h-5" />
              </div>
              <div className="font-bold">{stats.agscores}</div>
              <p className="text-xs text-muted-foreground">AgScores</p>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-orange-100 text-orange-600 mx-auto mb-2">
                <DollarSign className="w-5 h-5" />
              </div>
              <div className="font-bold">{stats.loans}</div>
              <p className="text-xs text-muted-foreground">Loans</p>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-teal-100 text-teal-600 mx-auto mb-2">
                <CreditCard className="w-5 h-5" />
              </div>
              <div className="font-bold">{stats.payments}</div>
              <p className="text-xs text-muted-foreground">Payments</p>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-pink-100 text-pink-600 mx-auto mb-2">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div className="font-bold">{stats.training}</div>
              <p className="text-xs text-muted-foreground">Training</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filter Activities
              {activeFilters > 0 && (
                <Badge variant="secondary">{activeFilters} active</Badge>
              )}
            </CardTitle>
            {activeFilters > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-muted-foreground"
              >
                <X className="w-4 h-4 mr-1" />
                Clear
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search activities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger>
                <SelectValue placeholder="Activity Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="order">Orders</SelectItem>
                <SelectItem value="harvest">Harvests</SelectItem>
                <SelectItem value="agscore">AgScores</SelectItem>
                <SelectItem value="loan">Loans</SelectItem>
                <SelectItem value="payment">Payments</SelectItem>
                <SelectItem value="training">Training</SelectItem>
              </SelectContent>
            </Select>

            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger>
                <SelectValue placeholder="Date Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="7days">Last 7 Days</SelectItem>
                <SelectItem value="30days">Last 30 Days</SelectItem>
                <SelectItem value="90days">Last 90 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Activity Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Activity Timeline
            <Badge variant="secondary">{filteredActivities.length} activities</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredActivities.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {searchQuery || selectedType !== "all" || dateRange !== "all"
                  ? "No activities match your filters"
                  : "No activities recorded yet"}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredActivities.map((activity, index) => {
                const Icon = getActivityTypeIcon(activity.type);
                const color = getActivityColor(activity.type);

                return (
                  <div
                    key={index}
                    className="flex gap-4 p-4 rounded-lg border hover:bg-gray-50 transition-colors"
                  >
                    <div
                      className={`flex items-center justify-center w-10 h-10 rounded-full ${getColorClass(
                        color
                      )}`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="font-medium">{activity.description}</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {formatDate(activity.date)}
                          </p>
                        </div>
                        {activity.amount && (
                          <div className="text-right">
                            <p className="font-bold text-green-600">
                              {formatAmount(activity.amount)}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 mt-2">
                        <Badge
                          variant="secondary"
                          className={getColorClass(color)}
                        >
                          {activity.type.charAt(0).toUpperCase() +
                            activity.type.slice(1)}
                        </Badge>
                        {activity.status && (
                          <Badge variant="outline">{activity.status}</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

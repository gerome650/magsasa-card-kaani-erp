import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X, Filter, ArrowLeft } from "lucide-react";
import { DateRange } from "react-day-picker";
import { format } from "date-fns";
import { Link } from "wouter";

interface FilterBreadcrumbProps {
  searchQuery?: string;
  dateRange?: DateRange;
  selectedBarangay?: string;
  selectedCrop?: string;
  selectedStatus?: string;
  showBackToAnalytics?: boolean;
  onClearSearch?: () => void;
  onClearDateRange?: () => void;
  onClearBarangay?: () => void;
  onClearCrop?: () => void;
  onClearStatus?: () => void;
  onClearAll?: () => void;
}

export function FilterBreadcrumb({
  searchQuery,
  dateRange,
  selectedBarangay,
  selectedCrop,
  selectedStatus,
  showBackToAnalytics = false,
  onClearSearch,
  onClearDateRange,
  onClearBarangay,
  onClearCrop,
  onClearStatus,
  onClearAll,
}: FilterBreadcrumbProps) {
  const activeFilters: { label: string; value: string; onClear: () => void }[] = [];

  // Add search filter
  if (searchQuery) {
    activeFilters.push({
      label: "Search",
      value: searchQuery,
      onClear: onClearSearch || (() => {}),
    });
  }

  // Add date range filter
  if (dateRange?.from && dateRange?.to) {
    const dateLabel = `${format(dateRange.from, "MMM d, yyyy")} - ${format(dateRange.to, "MMM d, yyyy")}`;
    activeFilters.push({
      label: "Date Range",
      value: dateLabel,
      onClear: onClearDateRange || (() => {}),
    });
  } else if (dateRange?.from) {
    activeFilters.push({
      label: "Date From",
      value: format(dateRange.from, "MMM d, yyyy"),
      onClear: onClearDateRange || (() => {}),
    });
  }

  // Add barangay/municipality filter
  if (selectedBarangay && selectedBarangay !== "all") {
    activeFilters.push({
      label: "Municipality",
      value: selectedBarangay,
      onClear: onClearBarangay || (() => {}),
    });
  }

  // Add crop filter
  if (selectedCrop && selectedCrop !== "all") {
    activeFilters.push({
      label: "Crop",
      value: selectedCrop,
      onClear: onClearCrop || (() => {}),
    });
  }

  // Add status filter
  if (selectedStatus && selectedStatus !== "all") {
    activeFilters.push({
      label: "Status",
      value: selectedStatus,
      onClear: onClearStatus || (() => {}),
    });
  }

  // Don't render if no active filters
  if (activeFilters.length === 0) {
    return null;
  }

  return (
    <div className="bg-muted/50 border border-border rounded-lg p-4 mb-6">
      {/* Back to Analytics Link */}
      {showBackToAnalytics && (
        <div className="mb-3 pb-3 border-b border-border">
          <Link href="/analytics">
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground -ml-2"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Analytics Dashboard
            </Button>
          </Link>
        </div>
      )}

      <div className="flex items-center justify-between flex-wrap gap-3">
        {/* Active Filters Section */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mr-2">
            <Filter className="w-4 h-4" />
            <span className="font-medium">Active Filters:</span>
          </div>
          
          {activeFilters.map((filter, index) => (
            <Badge
              key={index}
              variant="secondary"
              className="pl-3 pr-2 py-1.5 text-sm font-normal gap-2 bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20"
            >
              <span>
                <span className="font-semibold">{filter.label}:</span>{" "}
                {filter.value}
              </span>
              <button
                type="button"
                onClick={filter.onClear}
                className="ml-1 hover:bg-primary/30 rounded-full p-0.5 transition-colors"
                aria-label={`Clear ${filter.label} filter`}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </Badge>
          ))}
        </div>

        {/* Clear All Button */}
        {activeFilters.length > 1 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClearAll}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4 mr-1" />
            Clear All
          </Button>
        )}
      </div>

      {/* Results Count */}
      <div className="mt-2 text-xs text-muted-foreground">
        {activeFilters.length} filter{activeFilters.length !== 1 ? "s" : ""} applied
      </div>
    </div>
  );
}

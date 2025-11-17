import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";

interface FilterChipsProps {
  searchQuery?: string;
  dateRange?: DateRange;
  selectedBarangay?: string;
  selectedCrop?: string;
  selectedStatus?: string;
  onClearSearch?: () => void;
  onClearDateRange?: () => void;
  onClearBarangay?: () => void;
  onClearCrop?: () => void;
  onClearStatus?: () => void;
  onClearAll?: () => void;
}

export function FilterChips({
  searchQuery,
  dateRange,
  selectedBarangay,
  selectedCrop,
  selectedStatus,
  onClearSearch,
  onClearDateRange,
  onClearBarangay,
  onClearCrop,
  onClearStatus,
  onClearAll,
}: FilterChipsProps) {
  const hasFilters =
    (searchQuery && searchQuery.trim() !== "") ||
    dateRange?.from ||
    (selectedBarangay && selectedBarangay !== "all") ||
    (selectedCrop && selectedCrop !== "all") ||
    (selectedStatus && selectedStatus !== "all");

  if (!hasFilters) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-muted-foreground">Active filters:</span>

      {searchQuery && searchQuery.trim() !== "" && (
        <Badge variant="secondary" className="gap-1">
          Search: "{searchQuery}"
          <button
            onClick={onClearSearch}
            className="ml-1 hover:text-destructive"
          >
            <X className="w-3 h-3" />
          </button>
        </Badge>
      )}

      {dateRange?.from && (
        <Badge variant="secondary" className="gap-1">
          Date: {format(dateRange.from, "MMM dd, yyyy")}
          {dateRange.to && ` - ${format(dateRange.to, "MMM dd, yyyy")}`}
          <button
            onClick={onClearDateRange}
            className="ml-1 hover:text-destructive"
          >
            <X className="w-3 h-3" />
          </button>
        </Badge>
      )}

      {selectedBarangay && selectedBarangay !== "all" && (
        <Badge variant="secondary" className="gap-1">
          Barangay: {selectedBarangay}
          <button
            onClick={onClearBarangay}
            className="ml-1 hover:text-destructive"
          >
            <X className="w-3 h-3" />
          </button>
        </Badge>
      )}

      {selectedCrop && selectedCrop !== "all" && (
        <Badge variant="secondary" className="gap-1">
          Crop: {selectedCrop}
          <button
            onClick={onClearCrop}
            className="ml-1 hover:text-destructive"
          >
            <X className="w-3 h-3" />
          </button>
        </Badge>
      )}

      {selectedStatus && selectedStatus !== "all" && (
        <Badge variant="secondary" className="gap-1">
          Status: {selectedStatus}
          <button
            onClick={onClearStatus}
            className="ml-1 hover:text-destructive"
          >
            <X className="w-3 h-3" />
          </button>
        </Badge>
      )}

      <Button
        variant="ghost"
        size="sm"
        onClick={onClearAll}
        className="h-6 text-xs"
      >
        Clear All
      </Button>
    </div>
  );
}

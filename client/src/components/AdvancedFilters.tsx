import { Filter, X } from "lucide-react";

export interface FilterOptions {
  landArea: string;
  cropType: string;
  membershipYear: string;
  performance: string;
}

interface AdvancedFiltersProps {
  filters: FilterOptions;
  onFilterChange: (filters: FilterOptions) => void;
  activeFilterCount: number;
}

export default function AdvancedFilters({ filters, onFilterChange, activeFilterCount }: AdvancedFiltersProps) {
  const handleFilterChange = (key: keyof FilterOptions, value: string) => {
    onFilterChange({ ...filters, [key]: value });
  };

  const clearAllFilters = () => {
    onFilterChange({
      landArea: "all",
      cropType: "all",
      membershipYear: "all",
      performance: "all",
    });
  };

  const hasActiveFilters = activeFilterCount > 0;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-gray-900">Advanced Filters</h3>
          {hasActiveFilters && (
            <span className="bg-primary text-white text-xs font-medium px-2 py-1 rounded-full">
              {activeFilterCount}
            </span>
          )}
        </div>
        {hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            className="flex items-center gap-1 text-sm text-gray-600 hover:text-primary transition-colors"
          >
            <X className="w-4 h-4" />
            Clear All
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Land Area Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Land Area
          </label>
          <select
            value={filters.landArea}
            onChange={(e) => handleFilterChange("landArea", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="all">All Sizes</option>
            <option value="0-2">0 - 2 ha</option>
            <option value="2-5">2 - 5 ha</option>
            <option value="5-10">5 - 10 ha</option>
            <option value="10+">10+ ha</option>
          </select>
        </div>

        {/* Crop Type Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Crop Type
          </label>
          <select
            value={filters.cropType}
            onChange={(e) => handleFilterChange("cropType", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="all">All Crops</option>
            <option value="rice">Rice</option>
            <option value="corn">Corn</option>
            <option value="vegetables">Vegetables</option>
            <option value="multiple">Multiple Crops</option>
          </select>
        </div>

        {/* Membership Year Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Member Since
          </label>
          <select
            value={filters.membershipYear}
            onChange={(e) => handleFilterChange("membershipYear", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="all">All Years</option>
            <option value="2024">2024</option>
            <option value="2023">2023</option>
            <option value="2022">2022</option>
            <option value="2021">2021</option>
            <option value="2020">2020</option>
            <option value="before-2020">Before 2020</option>
          </select>
        </div>

        {/* Harvest Performance Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Performance
          </label>
          <select
            value={filters.performance}
            onChange={(e) => handleFilterChange("performance", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="all">All Farmers</option>
            <option value="top25">Top 25%</option>
            <option value="above-avg">Above Average</option>
            <option value="below-avg">Below Average</option>
            <option value="bottom25">Bottom 25%</option>
          </select>
        </div>
      </div>
    </div>
  );
}

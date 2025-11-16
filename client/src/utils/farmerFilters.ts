import type { Farmer } from "../data/farmersData";
import type { HarvestRecord } from "../data/harvestData";
import type { FilterOptions } from "../components/AdvancedFilters";

export function applyFarmerFilters(
  farmers: Farmer[],
  harvests: HarvestRecord[],
  filters: FilterOptions,
  searchQuery: string
): Farmer[] {
  let filtered = [...farmers];

  // Apply search query
  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase();
    filtered = filtered.filter(
      (farmer) =>
        farmer.name.toLowerCase().includes(query) ||
        farmer.location.toLowerCase().includes(query) ||
        farmer.id.toLowerCase().includes(query)
    );
  }

  // Apply land area filter
  if (filters.landArea !== "all") {
    filtered = filtered.filter((farmer) => {
      const landArea = farmer.totalLandArea;
      switch (filters.landArea) {
        case "0-2":
          return landArea >= 0 && landArea < 2;
        case "2-5":
          return landArea >= 2 && landArea < 5;
        case "5-10":
          return landArea >= 5 && landArea < 10;
        case "10+":
          return landArea >= 10;
        default:
          return true;
      }
    });
  }

  // Apply crop type filter
  if (filters.cropType !== "all") {
    filtered = filtered.filter((farmer) => {
      const crops = farmer.crops.map((c) => c.toLowerCase());
      switch (filters.cropType) {
        case "rice":
          return crops.includes("rice");
        case "corn":
          return crops.includes("corn");
        case "vegetables":
          return crops.includes("vegetables");
        case "multiple":
          return crops.length > 1;
        default:
          return true;
      }
    });
  }

  // Apply membership year filter
  if (filters.membershipYear !== "all") {
    filtered = filtered.filter((farmer) => {
      const memberYear = new Date(farmer.cardMemberSince).getFullYear();
      if (filters.membershipYear === "before-2020") {
        return memberYear < 2020;
      }
      return memberYear === parseInt(filters.membershipYear);
    });
  }

  // Apply harvest performance filter
  if (filters.performance !== "all") {
    // Calculate total harvest for each farmer
    const farmerHarvests = filtered.map((farmer) => {
      const farmerHarvestRecords = harvests.filter((h) => h.farmerId === farmer.id);
      const totalHarvest = farmerHarvestRecords.reduce((sum, h) => sum + h.quantity, 0);
      return { farmer, totalHarvest };
    });

    // Sort by total harvest
    farmerHarvests.sort((a, b) => b.totalHarvest - a.totalHarvest);

    // Calculate percentiles
    const count = farmerHarvests.length;
    const top25Index = Math.floor(count * 0.25);
    const bottom25Index = Math.floor(count * 0.75);
    
    // Calculate average
    const avgHarvest = farmerHarvests.reduce((sum, fh) => sum + fh.totalHarvest, 0) / count;

    // Filter based on performance
    filtered = farmerHarvests
      .filter((fh, index) => {
        switch (filters.performance) {
          case "top25":
            return index < top25Index;
          case "above-avg":
            return fh.totalHarvest > avgHarvest;
          case "below-avg":
            return fh.totalHarvest < avgHarvest;
          case "bottom25":
            return index >= bottom25Index;
          default:
            return true;
        }
      })
      .map((fh) => fh.farmer);
  }

  return filtered;
}

export function getActiveFilterCount(filters: FilterOptions): number {
  let count = 0;
  if (filters.landArea !== "all") count++;
  if (filters.cropType !== "all") count++;
  if (filters.membershipYear !== "all") count++;
  if (filters.performance !== "all") count++;
  return count;
}

export function getFilterSummary(
  filters: FilterOptions,
  filteredCount: number,
  totalCount: number
): string {
  if (filteredCount === totalCount) {
    return `Showing all ${totalCount} farmers`;
  }

  const parts: string[] = [];

  if (filters.landArea !== "all") {
    parts.push(`${filters.landArea} ha land area`);
  }

  if (filters.cropType !== "all") {
    const cropNames: Record<string, string> = {
      rice: "Rice",
      corn: "Corn",
      vegetables: "Vegetables",
      multiple: "Multiple crops",
    };
    parts.push(`growing ${cropNames[filters.cropType]}`);
  }

  if (filters.membershipYear !== "all") {
    const year = filters.membershipYear === "before-2020" 
      ? "before 2020" 
      : filters.membershipYear;
    parts.push(`joined ${year}`);
  }

  if (filters.performance !== "all") {
    const perfNames: Record<string, string> = {
      top25: "Top 25% performers",
      "above-avg": "Above average performance",
      "below-avg": "Below average performance",
      bottom25: "Bottom 25% performers",
    };
    parts.push(perfNames[filters.performance]);
  }

  const summary = parts.length > 0 ? ` with ${parts.join(", ")}` : "";
  return `Showing ${filteredCount} of ${totalCount} farmers${summary}`;
}

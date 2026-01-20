import { Link, useRoute } from "wouter";
import { EmptyStateCompact } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  MapPin,
  User,
  Calendar,
  TrendingUp,
  Droplets,
  Mountain,
  Edit,
  Map as MapIcon,
  Satellite,
  Layers,
  X,
  Ruler,
  Calculator,
  FileDown,
  Sprout,
  Trash2,
  Coins,
  Loader2,
  Undo2,
  Redo2,
  DollarSign,
} from "lucide-react";
import { jsPDF } from "jspdf";
import { MapView } from "@/components/Map";
import { PhotoGallery } from "@/components/PhotoGallery";
import { Farm } from "@/data/farmsData";

const logDevWarn = (...args: Parameters<typeof console.warn>) => {
  if (import.meta.env.DEV) {
    console.warn(...args);
  }
};

const logDevError = (...args: Parameters<typeof console.error>) => {
  if (import.meta.env.DEV) {
    console.error(...args);
  }
};

// QA Pass 2: Memoized summary components to prevent unnecessary re-renders
const YieldSummaryStats = ({ yieldRecords, parcelAreas }: { yieldRecords: any[], parcelAreas: number[] }) => {
  // QA Pass 5: Defensive calculations with NaN/Infinity protection
  const totalYield = useMemo(() => {
    return yieldRecords.reduce((sum, r) => {
      const tons = r.unit === 'tons' ? r.quantity : r.quantity / 1000;
      // QA Pass 5: Skip invalid values
      if (!isFinite(tons) || tons < 0) return sum;
      return sum + tons;
    }, 0);
  }, [yieldRecords]);
  
  const averageYieldPerHa = useMemo(() => {
    const totalTons = yieldRecords.reduce((sum, r) => {
      const tons = r.unit === 'tons' ? r.quantity : r.quantity / 1000;
      // QA Pass 5: Skip invalid values
      if (!isFinite(tons) || tons < 0) return sum;
      return sum + tons;
    }, 0);
    const totalArea = parcelAreas.reduce((sum, a) => {
      // QA Pass 5: Skip invalid areas
      if (!isFinite(a) || a < 0) return sum;
      return sum + a;
    }, 0);
    // QA Pass 5: Prevent division by zero and ensure finite result
    return totalArea > 0 && isFinite(totalTons) && isFinite(totalArea)
      ? totalTons / totalArea 
      : 0;
  }, [yieldRecords, parcelAreas]);
  
  return (
    <div className="grid grid-cols-2 gap-4 pt-2 border-t">
      <div>
        <p className="text-sm font-medium">Total Yield</p>
        <p className="text-2xl font-bold">
          {totalYield.toFixed(2)} tons
        </p>
      </div>
      <div>
        <p className="text-sm font-medium">Average Yield per Hectare</p>
        <p className="text-2xl font-bold">
          {averageYieldPerHa.toFixed(2)} t/ha
        </p>
      </div>
    </div>
  );
};

const CostSummaryStats = ({ costRecords }: { costRecords: any[] }) => {
  // QA Pass 5: Defensive calculations with NaN/Infinity protection
  const totalCosts = useMemo(() => {
    return costRecords.reduce((sum, r) => {
      // QA Pass 5: Skip invalid amounts
      if (!isFinite(r.amount) || r.amount < 0) return sum;
      return sum + r.amount;
    }, 0);
  }, [costRecords]);
  
  return (
    <div className="pt-2 border-t">
      <p className="text-sm font-medium">Total Costs</p>
      <p className="text-2xl font-bold">
        ₱{totalCosts.toFixed(2)}
      </p>
    </div>
  );
};

// QA Pass 2: Memoized profitability analysis component
const ProfitabilityAnalysis = ({ yieldRecords, costRecords }: { yieldRecords: any[], costRecords: any[] }) => {
  const cropPrices: Record<string, number> = {
    'Rice': 20000, // PHP per ton
    'Corn': 15000,
    'Vegetables': 30000,
    'Fruits': 40000,
  };
  
  // QA Pass 5: Defensive calculations - handle NaN, Infinity, negative values
  const profitability = useMemo(() => {
    const totalRevenue = yieldRecords.reduce((sum, r) => {
      const tons = r.unit === 'tons' ? r.quantity : r.quantity / 1000;
      const price = cropPrices[r.cropType] || 25000; // default price
      const revenue = tons * price;
      // QA Pass 5: Skip invalid calculations
      if (!isFinite(revenue) || revenue < 0) return sum;
      return sum + revenue;
    }, 0);
    
    const totalCosts = costRecords.reduce((sum, r) => {
      // QA Pass 5: Skip invalid amounts
      if (!isFinite(r.amount) || r.amount < 0) return sum;
      return sum + r.amount;
    }, 0);
    
    // QA Pass 5: Ensure all values are finite and valid
    const grossProfit = isFinite(totalRevenue) && isFinite(totalCosts) 
      ? totalRevenue - totalCosts 
      : 0;
    const profitMargin = totalRevenue > 0 && isFinite(grossProfit) && isFinite(totalRevenue)
      ? (grossProfit / totalRevenue) * 100 
      : 0;
    const roi = totalCosts > 0 && isFinite(grossProfit) && isFinite(totalCosts)
      ? (grossProfit / totalCosts) * 100 
      : 0;
    
    // QA Pass 5: Clamp values to reasonable ranges
    return { 
      totalRevenue: Math.max(0, isFinite(totalRevenue) ? totalRevenue : 0),
      totalCosts: Math.max(0, isFinite(totalCosts) ? totalCosts : 0),
      grossProfit: isFinite(grossProfit) ? grossProfit : 0,
      profitMargin: Math.max(-100, Math.min(100, isFinite(profitMargin) ? profitMargin : 0)),
      roi: isFinite(roi) ? roi : 0,
    };
  }, [yieldRecords, costRecords]);
  
  const { totalRevenue, totalCosts, grossProfit, profitMargin, roi } = profitability;
  
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm font-medium text-green-700">Total Revenue</p>
          <p className="text-xl font-bold text-green-900">₱{totalRevenue.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-red-700">Total Costs</p>
          <p className="text-xl font-bold text-red-900">₱{totalCosts.toFixed(2)}</p>
        </div>
      </div>
      <div className="pt-4 border-t border-green-200">
        <div className="space-y-2">
          <div>
            <p className="text-sm font-medium">Gross Profit</p>
            <p className="text-2xl font-bold" style={{ color: grossProfit >= 0 ? '#16a34a' : '#dc2626' }}>
              ₱{grossProfit.toFixed(2)}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium">Profit Margin</p>
              <p className="text-lg font-bold">{profitMargin.toFixed(1)}%</p>
            </div>
            <div>
              <p className="text-sm font-medium">ROI</p>
              <p className="text-lg font-bold">{roi.toFixed(1)}%</p>
            </div>
          </div>
        </div>
      </div>
      <p className="text-xs text-muted-foreground mt-4">
        * Revenue calculated using average market prices. Actual prices may vary.
      </p>
    </div>
  );
};

export default function FarmDetail() {
  const [, params] = useRoute("/farms/:id");
  // QA: Validate farmId is a valid number before using it
  const farmId = params?.id && !isNaN(parseInt(params.id)) ? parseInt(params.id) : null;
  
  // Load farm data from database
  const { data: dbFarm, isLoading: farmLoading, error: farmError, refetch: refetchFarm } = trpc.farms.getById.useQuery(
    { id: farmId! },
    { enabled: !!farmId }
  );
  
  // Transform database format to frontend format
  // QA: Safe parsing with error handling to prevent crashes
  const farm = dbFarm ? (() => {
    try {
      // Safe parseFloat with fallback
      const safeParseFloat = (value: unknown, fallback: number = 0): number => {
        if (value === null || value === undefined) return fallback;
        const parsed = typeof value === 'string' ? parseFloat(value) : Number(value);
        return isNaN(parsed) ? fallback : parsed;
      };

      // Safe JSON parse for crops
      let crops: string[] = [];
      try {
        if (Array.isArray(dbFarm.crops)) {
          crops = dbFarm.crops;
        } else if (typeof dbFarm.crops === 'string') {
          crops = JSON.parse(dbFarm.crops);
        }
      } catch (e) {
        logDevWarn('[FarmDetail] Failed to parse crops, using empty array:', e);
        crops = [];
      }

      // Safe coordinate parsing
      const lat = safeParseFloat(dbFarm.latitude);
      const lng = safeParseFloat(dbFarm.longitude);

      return {
        ...dbFarm,
        location: {
          barangay: dbFarm.barangay || '',
          municipality: dbFarm.municipality || '',
          coordinates: {
            lat,
            lng,
          },
        },
        size: safeParseFloat(dbFarm.size, 0),
        crops,
        averageYield: dbFarm.averageYield ? safeParseFloat(dbFarm.averageYield) : undefined,
        // Add default values for fields that might be missing
        soilType: dbFarm.soilType || 'Unknown',
        irrigationType: dbFarm.irrigationType || 'Rainfed',
        dateRegistered: dbFarm.registrationDate ? new Date(dbFarm.registrationDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        photoUrls: Array.isArray(dbFarm.photoUrls) ? dbFarm.photoUrls : (dbFarm.photoUrls ? [dbFarm.photoUrls] : []),
        lastHarvest: (dbFarm as any).lastHarvest,
        boundary: (dbFarm as any).boundary,
      } as unknown as Farm;
    } catch (error) {
      logDevError('[FarmDetail] Error transforming farm data:', error);
      return undefined;
    }
  })() : undefined;
  
  // Load boundaries from database
  const { data: dbBoundaries, error: boundariesError, refetch: refetchBoundaries } = trpc.boundaries.getByFarmId.useQuery(
    { farmId: farmId! },
    { enabled: !!farmId }
  );
  
  // Load yields from database
  const { data: dbYields, error: yieldsError, refetch: refetchYields } = trpc.yields.getByFarmId.useQuery(
    { farmId: farmId! },
    { enabled: !!farmId }
  );
  
  // Load costs from database
  const { data: dbCosts, error: costsError, refetch: refetchCosts } = trpc.costs.getByFarmId.useQuery(
    { farmId: farmId! },
    { enabled: !!farmId }
  );
  
  // Get tRPC utils for cache manipulation
  const utils = trpc.useContext();
  
  // Mutations for saving data with optimistic updates
  const saveBoundariesMutation = trpc.boundaries.save.useMutation({
    onMutate: async (newBoundaries) => {
      // Cancel outgoing refetches
      await utils.boundaries.getByFarmId.cancel({ farmId: farmId! });
      
      // Snapshot previous value
      const previousBoundaries = utils.boundaries.getByFarmId.getData({ farmId: farmId! });
      
      // Optimistically update cache
      utils.boundaries.getByFarmId.setData({ farmId: farmId! }, () => {
        return newBoundaries.boundaries.map(b => ({
          id: 0,
          farmId: farmId!,
          ...b,
          area: typeof b.area === 'number' ? b.area.toString() : b.area,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }));
      });
      
      toast.success("Saving boundaries...", { duration: 1000 });
      
      return { previousBoundaries };
    },
    onSuccess: () => {
      toast.success("Boundaries saved successfully");
      utils.boundaries.getByFarmId.invalidate({ farmId: farmId! });
    },
    onError: (error, newBoundaries, context) => {
      // Rollback on error
      if (context?.previousBoundaries) {
        utils.boundaries.getByFarmId.setData({ farmId: farmId! }, context.previousBoundaries);
      }
      toast.error(`Failed to save boundaries: ${error.message}`);
    },
    onSettled: () => {
      utils.boundaries.getByFarmId.invalidate({ farmId: farmId! });
    },
  });
  
  const createYieldMutation = trpc.yields.create.useMutation({
    onMutate: async (newYield) => {
      await utils.yields.getByFarmId.cancel({ farmId: farmId! });
      
      const previousYields = utils.yields.getByFarmId.getData({ farmId: farmId! });
      
      // Create optimistic yield record
      const optimisticYield = {
        id: Date.now(),
        farmId: farmId!,
        parcelIndex: newYield.parcelIndex,
        cropType: newYield.cropType,
        harvestDate: newYield.harvestDate,
        quantity: newYield.quantity.toString(),
        unit: newYield.unit,
        qualityGrade: newYield.qualityGrade || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      utils.yields.getByFarmId.setData({ farmId: farmId! }, (old) => {
        return old ? [...old, optimisticYield] : [optimisticYield];
      });
      
      toast.success("Adding harvest record...", { duration: 1000 });
      
      return { previousYields };
    },
    onSuccess: () => {
      toast.success("Harvest record saved");
      utils.yields.getByFarmId.invalidate({ farmId: farmId! });
    },
    onError: (error, newYield, context) => {
      if (context?.previousYields) {
        utils.yields.getByFarmId.setData({ farmId: farmId! }, context.previousYields);
      }
      toast.error(`Failed to save harvest: ${error.message}`);
    },
    onSettled: () => {
      utils.yields.getByFarmId.invalidate({ farmId: farmId! });
    },
  });
  
  const deleteYieldMutation = trpc.yields.delete.useMutation({
    onMutate: async (variables) => {
      await utils.yields.getByFarmId.cancel({ farmId: farmId! });
      
      const previousYields = utils.yields.getByFarmId.getData({ farmId: farmId! });
      
      // Optimistically remove the yield
      utils.yields.getByFarmId.setData({ farmId: farmId! }, (old) => {
        return old ? old.filter(y => y.id !== variables.id) : [];
      });
      
      toast.success("Deleting harvest record...", { duration: 1000 });
      
      return { previousYields };
    },
    onSuccess: () => {
      toast.success("Harvest record deleted");
      utils.yields.getByFarmId.invalidate({ farmId: farmId! });
    },
    onError: (error, variables, context) => {
      if (context?.previousYields) {
        utils.yields.getByFarmId.setData({ farmId: farmId! }, context.previousYields);
      }
      toast.error(`Failed to delete harvest: ${error.message}`);
    },
    onSettled: () => {
      utils.yields.getByFarmId.invalidate({ farmId: farmId! });
    },
  });
  
  const createCostMutation = trpc.costs.create.useMutation({
    onMutate: async (newCost) => {
      await utils.costs.getByFarmId.cancel({ farmId: farmId! });
      
      const previousCosts = utils.costs.getByFarmId.getData({ farmId: farmId! });
      
      // Create optimistic cost record
      const optimisticCost = {
        id: Date.now(),
        farmId: farmId!,
        parcelIndex: newCost.parcelIndex ?? null,
        category: newCost.category,
        amount: newCost.amount.toString(),
        date: newCost.date,
        description: newCost.description || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      utils.costs.getByFarmId.setData({ farmId: farmId! }, (old) => {
        return old ? [...old, optimisticCost] : [optimisticCost];
      });
      
      toast.success("Adding cost record...", { duration: 1000 });
      
      return { previousCosts };
    },
    onSuccess: () => {
      toast.success("Cost record saved");
      utils.costs.getByFarmId.invalidate({ farmId: farmId! });
    },
    onError: (error, newCost, context) => {
      if (context?.previousCosts) {
        utils.costs.getByFarmId.setData({ farmId: farmId! }, context.previousCosts);
      }
      toast.error(`Failed to save cost: ${error.message}`);
    },
    onSettled: () => {
      utils.costs.getByFarmId.invalidate({ farmId: farmId! });
    },
  });
  
  const deleteCostMutation = trpc.costs.delete.useMutation({
    onMutate: async (variables) => {
      await utils.costs.getByFarmId.cancel({ farmId: farmId! });
      
      const previousCosts = utils.costs.getByFarmId.getData({ farmId: farmId! });
      
      // Optimistically remove the cost
      utils.costs.getByFarmId.setData({ farmId: farmId! }, (old) => {
        return old ? old.filter(c => c.id !== variables.id) : [];
      });
      
      toast.success("Deleting cost record...", { duration: 1000 });
      
      return { previousCosts };
    },
    onSuccess: () => {
      toast.success("Cost record deleted");
      utils.costs.getByFarmId.invalidate({ farmId: farmId! });
    },
    onError: (error, variables, context) => {
      if (context?.previousCosts) {
        utils.costs.getByFarmId.setData({ farmId: farmId! }, context.previousCosts);
      }
      toast.error(`Failed to delete cost: ${error.message}`);
    },
    onSettled: () => {
      utils.costs.getByFarmId.invalidate({ farmId: farmId! });
    },
  });
  
  // QA Pass 2: Memoized delete handler
  const handleDeleteCost = useCallback((recordId: string) => {
    deleteCostMutation.mutate({ id: parseInt(recordId) });
  }, [deleteCostMutation]);
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [drawnBoundaries, setDrawnBoundaries] = useState<google.maps.Polygon[]>([]);
  const [parcelAreas, setParcelAreas] = useState<number[]>([]);
  const [calculatedArea, setCalculatedArea] = useState<number | null>(null);
  const [mapType, setMapType] = useState<'roadmap' | 'satellite' | 'hybrid'>('roadmap');
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);
  const [terrainEnabled, setTerrainEnabled] = useState(false);
  const [terrainLayer, setTerrainLayer] = useState<google.maps.ImageMapType | null>(null);
  const [isMeasuring, setIsMeasuring] = useState(false);
  const [measurementMarkers, setMeasurementMarkers] = useState<google.maps.Marker[]>([]);
  const [measurementLine, setMeasurementLine] = useState<google.maps.Polyline | null>(null);
  const [measuredDistance, setMeasuredDistance] = useState<number | null>(null);
  const [isCalculatingArea, setIsCalculatingArea] = useState(false);
  const [tempAreaPolygon, setTempAreaPolygon] = useState<google.maps.Polygon | null>(null);
  const [tempCalculatedArea, setTempCalculatedArea] = useState<number | null>(null);
  const [isMapLoading, setIsMapLoading] = useState(true);
  
  // Undo/Redo history
  type HistoryState = {
    boundaries: google.maps.Polygon[];
    areas: number[];
  };
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [currentHistoryIndex, setCurrentHistoryIndex] = useState(-1);
  
  // QA Pass 2: Memoize expensive transformations to avoid recalculating on every render
  // QA Pass 5: Enhanced defensive parsing for corrupted/weird data
  // Transform backend yields to display format
  type YieldRecord = {
    id: string;
    parcelIndex: number;
    cropType: string;
    harvestDate: string;
    quantity: number;
    unit: 'kg' | 'tons';
    qualityGrade: 'Premium' | 'Standard' | 'Below Standard';
  };
  
  const yieldRecords = useMemo((): YieldRecord[] => {
    if (!dbYields) return [];
    const validRecords: YieldRecord[] = [];
    
    dbYields.forEach((yieldRow, index) => {
      try {
        // QA Pass 5: Safe numeric parsing with clamping
        let quantity = parseFloat(yieldRow.quantity?.toString() || '0');
        if (isNaN(quantity) || !isFinite(quantity) || quantity < 0) {
          if (import.meta.env.DEV) {
            logDevWarn(`[FarmDetail] Invalid yield quantity at index ${index} for farm ${farmId}: ${yieldRow.quantity}, defaulting to 0`);
          }
          quantity = 0;
        }
        
        // QA Pass 5: Safe date parsing
        const harvestDate = yieldRow.harvestDate || '';
        if (!harvestDate || harvestDate === 'Invalid Date') {
          if (import.meta.env.DEV) {
            logDevWarn(`[FarmDetail] Invalid harvest date at index ${index} for farm ${farmId}: ${harvestDate}, skipping record`);
          }
          return; // Skip invalid records
        }
        
        validRecords.push({
          id: yieldRow.id.toString(),
          parcelIndex: yieldRow.parcelIndex,
          cropType: yieldRow.cropType || '',
          harvestDate,
          quantity,
          unit: (yieldRow.unit === 'tons' || yieldRow.unit === 'kg' ? yieldRow.unit : 'kg') as 'kg' | 'tons',
          qualityGrade: (yieldRow.qualityGrade || 'Standard') as 'Premium' | 'Standard' | 'Below Standard',
        });
      } catch (error) {
        // QA Pass 5: Skip records that fail parsing, log warning in dev
        if (import.meta.env.DEV) {
          logDevWarn(`[FarmDetail] Failed to parse yield record at index ${index} for farm ${farmId}:`, error);
        }
      }
    });
    
    return validRecords;
  }, [dbYields, farmId]);

  // Transform backend costs to display format
  // QA Pass 5: Enhanced defensive parsing for corrupted/weird data
  type CostRecord = {
    id: string;
    date: string;
    category: 'Fertilizer' | 'Pesticides' | 'Seeds' | 'Labor' | 'Equipment' | 'Other';
    description: string;
    amount: number;
    parcelIndex: number | null;
  };
  
  const costRecords = useMemo((): CostRecord[] => {
    if (!dbCosts) return [];
    const validRecords: CostRecord[] = [];
    
    dbCosts.forEach((cost, index) => {
      try {
        // QA Pass 5: Safe numeric parsing with clamping
        let amount = parseFloat(cost.amount?.toString() || '0');
        if (isNaN(amount) || !isFinite(amount) || amount < 0) {
          if (import.meta.env.DEV) {
            logDevWarn(`[FarmDetail] Invalid cost amount at index ${index} for farm ${farmId}: ${cost.amount}, defaulting to 0`);
          }
          amount = 0;
        }
        
        // QA Pass 5: Safe date parsing
        const date = cost.date || '';
        if (!date || date === 'Invalid Date') {
          if (import.meta.env.DEV) {
            logDevWarn(`[FarmDetail] Invalid cost date at index ${index} for farm ${farmId}: ${date}, skipping record`);
          }
          return; // Skip invalid records
        }
        
        validRecords.push({
          id: cost.id.toString(),
          date,
          category: cost.category as 'Fertilizer' | 'Pesticides' | 'Seeds' | 'Labor' | 'Equipment' | 'Other',
          description: cost.description || '',
          amount,
          parcelIndex: cost.parcelIndex ?? null,
        });
      } catch (error) {
        // QA Pass 5: Skip records that fail parsing, log warning in dev
        if (import.meta.env.DEV) {
          logDevWarn(`[FarmDetail] Failed to parse cost record at index ${index} for farm ${farmId}:`, error);
        }
      }
    });
    
    return validRecords;
  }, [dbCosts, farmId]);

  const [isYieldDialogOpen, setIsYieldDialogOpen] = useState(false);
  const [isCostDialogOpen, setIsCostDialogOpen] = useState(false);
  
  // QA Pass 2: Pagination for large lists (show first 50, then "Show More")
  const [yieldRecordsLimit, setYieldRecordsLimit] = useState(50);
  const [costRecordsLimit, setCostRecordsLimit] = useState(50);
  
  // QA Pass 2: Memoize paginated lists
  const displayedYieldRecords = useMemo(() => {
    return yieldRecords.slice(0, yieldRecordsLimit);
  }, [yieldRecords, yieldRecordsLimit]);
  
  const displayedCostRecords = useMemo(() => {
    return costRecords.slice(0, costRecordsLimit);
  }, [costRecords, costRecordsLimit]);
  
  const hasMoreYields = yieldRecords.length > yieldRecordsLimit;
  const hasMoreCosts = costRecords.length > costRecordsLimit;
  
  // QA Pass 3: Fetch farm from list endpoint for consistency comparison
  const { data: farmFromList } = trpc.farms.list.useQuery(
    {},
    { enabled: !!farmId && !!farm }
  );
  
  // QA Pass 3: Integrity checks (non-breaking, logs warnings only)
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    if (!farm || !farmFromList || farmLoading) return;
    
    // Find this farm in the list
    const listFarm = farmFromList.find((f: any) => f.id === farm.id);
    if (!listFarm) {
      logDevWarn(`[FarmDetailIntegrity] Farm ${farm.id} not found in list query response`);
      return;
    }
    
    // Check 1: Coordinates consistency with Map View
    const listLat = typeof listFarm.latitude === 'string' ? parseFloat(listFarm.latitude) : Number(listFarm.latitude);
    const listLng = typeof listFarm.longitude === 'string' ? parseFloat(listFarm.longitude) : Number(listFarm.longitude);
    const detailLat = farm.location.coordinates.lat;
    const detailLng = farm.location.coordinates.lng;
    
    if (Math.abs(listLat - detailLat) > 0.0001 || Math.abs(listLng - detailLng) > 0.0001) {
      logDevWarn(`[FarmDetailIntegrity] Coordinate mismatch detected for farm ${farm.id}`);
    }
    
    // Check 2: Status consistency
    if (listFarm.status !== farm.status) {
      logDevWarn(`[FarmDetailIntegrity] Status mismatch detected for farm ${farm.id}`);
    }
    
    // Check 3: Crop types consistency
    const listCrops = Array.isArray(listFarm.crops) ? listFarm.crops : (typeof listFarm.crops === 'string' ? JSON.parse(listFarm.crops) : []);
    const detailCrops = Array.isArray(farm.crops) ? farm.crops : [];
    const listCropsSet = new Set(listCrops);
    const detailCropsSet = new Set(detailCrops);
    
    if (listCropsSet.size !== detailCropsSet.size || 
        !Array.from(listCropsSet as Set<string>).every((c: string) => detailCropsSet.has(c))) {
      logDevWarn(`[FarmDetailIntegrity] Crop list mismatch detected for farm ${farm.id}`);
    }
    
    // Check 4: Barangay/Municipality consistency
    if (listFarm.barangay !== farm.location.barangay || listFarm.municipality !== farm.location.municipality) {
      logDevWarn(`[FarmDetailIntegrity] Location mismatch detected for farm ${farm.id}`);
    }
    
    // Check 5: Size consistency (allow small floating point differences)
    const listSize = typeof listFarm.size === 'string' ? parseFloat(listFarm.size) : Number(listFarm.size);
    if (Math.abs(listSize - farm.size) > 0.01) {
      logDevWarn(`[FarmDetailIntegrity] Size mismatch detected between list and detail data for farm ${farm.id}`);
    }
  }, [farm, farmFromList, farmLoading]);
  
  // QA Pass 3: Data completeness checks
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    if (!farm || farmLoading) return;
    
    // Check 1: Active farm with no yields
    if (farm.status === 'active' && yieldRecords.length === 0) {
      logDevWarn(`[FarmDetailIntegrity] Active farm ${farm.id} has 0 yields recorded`);
    }
    
    // Check 2: Missing coordinates
    const hasValidCoordinates = farm.location.coordinates.lat !== 0 && 
                                farm.location.coordinates.lng !== 0 &&
                                !isNaN(farm.location.coordinates.lat) &&
                                !isNaN(farm.location.coordinates.lng);
    if (!hasValidCoordinates) {
      logDevWarn(`[FarmDetailIntegrity] Farm ${farm.id} has invalid or missing coordinates`);
    }
    
    // Check 3: Size vs parcel areas (if boundaries exist)
    if (parcelAreas.length > 0 && calculatedArea !== null) {
      const totalParcelArea = parcelAreas.reduce((sum, a) => sum + a, 0);
      const sizeDiff = Math.abs(totalParcelArea - farm.size);
      const sizeDiffPercent = (sizeDiff / farm.size) * 100;
      
      if (sizeDiffPercent > 20) {
        logDevWarn(`[FarmDetailIntegrity] Farm ${farm.id} has significant size mismatch (${sizeDiffPercent.toFixed(1)}% difference)`);
      }
    }
    
    // Check 4: Empty crops array
    if (Array.isArray(farm.crops) && farm.crops.length === 0) {
      logDevWarn(`[FarmDetailIntegrity] Farm ${farm.id} has no crops listed`);
    }
  }, [farm, yieldRecords, parcelAreas, calculatedArea, farmLoading]);

  // Undo/Redo functions
  const saveToHistory = (boundaries: google.maps.Polygon[], areas: number[]) => {
    const newHistory = history.slice(0, currentHistoryIndex + 1);
    newHistory.push({ boundaries: [...boundaries], areas: [...areas] });
    setHistory(newHistory);
    setCurrentHistoryIndex(newHistory.length - 1);
  };

  const undo = () => {
    if (currentHistoryIndex > 0) {
      const prevState = history[currentHistoryIndex - 1];
      
      // Clear current polygons from map
      drawnBoundaries.forEach(p => p.setMap(null));
      
      // Restore previous state
      setDrawnBoundaries(prevState.boundaries);
      setParcelAreas(prevState.areas);
      
      // Recalculate total area
      if (prevState.areas.length > 0) {
        const totalArea = prevState.areas.reduce((sum, a) => sum + a, 0);
        setCalculatedArea(totalArea);
      } else {
        setCalculatedArea(null);
      }
      
      setCurrentHistoryIndex(currentHistoryIndex - 1);
    }
  };

  const redo = () => {
    if (currentHistoryIndex < history.length - 1) {
      const nextState = history[currentHistoryIndex + 1];
      
      // Clear current polygons from map
      drawnBoundaries.forEach(p => p.setMap(null));
      
      // Restore next state
      setDrawnBoundaries(nextState.boundaries);
      setParcelAreas(nextState.areas);
      
      // Recalculate total area
      if (nextState.areas.length > 0) {
        const totalArea = nextState.areas.reduce((sum, a) => sum + a, 0);
        setCalculatedArea(totalArea);
      } else {
        setCalculatedArea(null);
      }
      
      setCurrentHistoryIndex(currentHistoryIndex + 1);
    }
  };

  // Handle farm query error
  if (farmError) {
    return (
      <div className="space-y-6">
        <Link href="/farms">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Farms
          </Button>
        </Link>
        <ErrorState
          title="Failed to load farm details"
          message={farmError.message || "Unable to fetch farm data from the database. Please check your connection and try again."}
          onRetry={() => refetchFarm()}
        />
      </div>
    );
  }

  if (!farm) {
    return (
      <div className="space-y-6">
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">Farm not found</p>
          <Link href="/farms">
            <Button className="mt-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Farms
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-700";
      case "inactive":
        return "bg-gray-100 text-gray-700";
      case "fallow":
        return "bg-yellow-100 text-yellow-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getIrrigationColor = (type: string) => {
    switch (type) {
      case "Irrigated":
        return "bg-blue-100 text-blue-700";
      case "Rainfed":
        return "bg-cyan-100 text-cyan-700";
      case "Upland":
        return "bg-amber-100 text-amber-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link href="/farms">
            <Button variant="ghost" size="sm" className="mb-2">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Farms
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">{farm.name}</h1>
          <div className="flex items-center gap-3 mt-2">
            <Badge className={getStatusColor(farm.status)}>{farm.status}</Badge>
            <Badge className={getIrrigationColor(farm.irrigationType)}>
              {farm.irrigationType}
            </Badge>
          </div>
        </div>
        <Button>
          <Edit className="w-4 h-4 mr-2" />
          Edit Farm
        </Button>
      </div>

      {/* Farm Information Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info Card */}
          <Card>
            <CardHeader>
              <CardTitle>Farm Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Farm ID</p>
                  <p className="font-semibold">{farm.id}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Size</p>
                  <p className="font-semibold">{farm.size} hectares</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Soil Type</p>
                  <p className="font-semibold">{farm.soilType}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Irrigation</p>
                  <p className="font-semibold">{farm.irrigationType}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Date Registered</p>
                  <p className="font-semibold">{formatDate(farm.dateRegistered)}</p>
                </div>
                {farm.lastHarvest && (
                  <div>
                    <p className="text-sm text-muted-foreground">Last Harvest</p>
                    <p className="font-semibold">{formatDate(farm.lastHarvest)}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Location Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Location
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Address</p>
                <p className="font-semibold">
                  Barangay {farm.location.barangay}, {farm.location.municipality}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-2">Coordinates</p>
                <p className="text-sm">
                  Latitude: {farm.location.coordinates.lat.toFixed(6)}
                </p>
                <p className="text-sm">
                  Longitude: {farm.location.coordinates.lng.toFixed(6)}
                </p>
              </div>

              {/* Map with Drawing Tools */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Farm Location & Boundary</h4>
                  <div className="flex gap-2">
                    <input
                      type="file"
                      id="boundary-upload"
                      accept=".kml,.geojson,.json"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            try {
                              const content = event.target?.result as string;
                              let coordinates: { lat: number; lng: number }[] = [];

                              if (file.name.endsWith('.geojson') || file.name.endsWith('.json')) {
                                // Parse GeoJSON
                                const geojson = JSON.parse(content);
                                if (geojson.type === 'FeatureCollection' && geojson.features?.[0]) {
                                  const coords = geojson.features[0].geometry.coordinates[0];
                                  coordinates = coords.map((c: number[]) => ({ lng: c[0], lat: c[1] }));
                                } else if (geojson.type === 'Feature') {
                                  const coords = geojson.geometry.coordinates[0];
                                  coordinates = coords.map((c: number[]) => ({ lng: c[0], lat: c[1] }));
                                }
                              } else if (file.name.endsWith('.kml')) {
                                // Parse KML
                                const parser = new DOMParser();
                                const xmlDoc = parser.parseFromString(content, 'text/xml');
                                const coordsText = xmlDoc.querySelector('coordinates')?.textContent?.trim();
                                if (coordsText) {
                                  coordinates = coordsText.split(/\s+/).map(coord => {
                                    const [lng, lat] = coord.split(',').map(Number);
                                    return { lat, lng };
                                  });
                                }
                              }

                              if (coordinates.length > 0) {
                                // Store for later use when map is ready
                                (window as any).pendingBoundaryCoordinates = coordinates;
                                alert(`Successfully imported ${coordinates.length} coordinates from ${file.name}`);
                                // Trigger page reload to render boundary
                                window.location.reload();
                              } else {
                                alert('No valid coordinates found in file');
                              }
                            } catch (error) {
                              alert('Error parsing file: ' + (error as Error).message);
                            }
                          };
                          reader.readAsText(file);
                        }
                      }}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById('boundary-upload')?.click()}
                    >
                      Upload KML/GeoJSON
                    </Button>
                    <Button
                      variant={isDrawingMode ? "default" : "outline"}
                      size="sm"
                      onClick={() => setIsDrawingMode(!isDrawingMode)}
                    >
                      {isDrawingMode ? "Stop Drawing" : "Draw Boundary"}
                    </Button>
                    <Button
                      variant={isMeasuring ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        setIsMeasuring(!isMeasuring);
                        if (isMeasuring) {
                          // Clear measurement when exiting
                          measurementMarkers.forEach(marker => marker.setMap(null));
                          if (measurementLine) measurementLine.setMap(null);
                          setMeasurementMarkers([]);
                          setMeasurementLine(null);
                          setMeasuredDistance(null);
                        }
                      }}
                    >
                      <Ruler className="w-4 h-4 mr-1" />
                      {isMeasuring ? "Stop Measuring" : "Measure Distance"}
                    </Button>
                    <Button
                      variant={isCalculatingArea ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        setIsCalculatingArea(!isCalculatingArea);
                        if (isCalculatingArea) {
                          // Clear temporary polygon when exiting
                          if (tempAreaPolygon) {
                            tempAreaPolygon.setMap(null);
                            setTempAreaPolygon(null);
                            setTempCalculatedArea(null);
                          }
                        }
                      }}
                    >
                      <Calculator className="w-4 h-4 mr-1" />
                      {isCalculatingArea ? "Stop Calculating" : "Calculate Area"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={undo}
                      disabled={currentHistoryIndex <= 0}
                      title="Undo (Ctrl+Z)"
                    >
                      <Undo2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={redo}
                      disabled={currentHistoryIndex >= history.length - 1}
                      title="Redo (Ctrl+Y)"
                    >
                      <Redo2 className="w-4 h-4" />
                    </Button>
                    {drawnBoundaries.length > 0 && (
                      <>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => {
                            if (drawnBoundaries.length > 0) {
                              const allParcels = drawnBoundaries.map(boundary => {
                                const path = boundary.getPath();
                                const coordinates: { lat: number; lng: number }[] = [];
                                for (let i = 0; i < path.getLength(); i++) {
                                  const point = path.getAt(i);
                                  coordinates.push({
                                    lat: point.lat(),
                                    lng: point.lng()
                                  });
                                }
                                return coordinates;
                              });
                              // Backend persistence pending (see docs/PRODUCTION-QA-FARMDETAIL.md)
                              alert(`${drawnBoundaries.length} parcel(s) saved! Total area: ${calculatedArea?.toFixed(2)} hectares`);
                            }
                          }}
                        >
                          Save {drawnBoundaries.length} Parcel{drawnBoundaries.length > 1 ? 's' : ''}
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            if (drawnBoundaries.length > 0) {
                              // Extract coordinates from all parcels
                              const allParcels = drawnBoundaries.map(boundary => {
                                const path = boundary.getPath();
                                const coordinates: { lat: number; lng: number }[] = [];
                                for (let i = 0; i < path.getLength(); i++) {
                                  const point = path.getAt(i);
                                  coordinates.push({
                                    lat: point.lat(),
                                    lng: point.lng()
                                  });
                                }
                                return coordinates;
                              });

                              // Ask user for format
                              const format = confirm('Download as GeoJSON? (Cancel for KML)') ? 'geojson' : 'kml';
                              const timestamp = new Date().toISOString().split('T')[0];
                              const filename = `${farm.name.replace(/\s+/g, '_')}_boundary_${timestamp}`;

                              let content: string;
                              let mimeType: string;
                              let extension: string;

                              if (format === 'geojson') {
                                // Generate GeoJSON with MultiPolygon
                                const geojson = {
                                  type: 'FeatureCollection',
                                  features: [
                                    {
                                      type: 'Feature',
                                      properties: {
                                        name: farm.name,
                                        farmer: farm.farmerName,
                                        size: farm.size,
                                        crops: farm.crops.join(', '),
                                        calculatedArea: calculatedArea?.toFixed(2),
                                        parcelCount: drawnBoundaries.length,
                                        parcelAreas: parcelAreas.map(a => a.toFixed(2))
                                      },
                                      geometry: {
                                        type: drawnBoundaries.length === 1 ? 'Polygon' : 'MultiPolygon',
                                        coordinates: drawnBoundaries.length === 1 
                                          ? [allParcels[0].map(c => [c.lng, c.lat])]
                                          : allParcels.map(parcel => [parcel.map(c => [c.lng, c.lat])])
                                      }
                                    }
                                  ]
                                };
                                content = JSON.stringify(geojson, null, 2);
                                mimeType = 'application/geo+json';
                                extension = 'geojson';
                              } else {
                                // Generate KML with multiple Placemarks
                                const placemarks = allParcels.map((parcel, index) => {
                                  const coordsString = parcel
                                    .map(c => `${c.lng},${c.lat},0`)
                                    .join(' ');
                                  return `    <Placemark>
      <name>${farm.name} - Parcel ${index + 1}</name>
      <description>
        Farmer: ${farm.farmerName}
        Parcel ${index + 1} of ${drawnBoundaries.length}
        Area: ${parcelAreas[index].toFixed(2)} ha
      </description>
      <Polygon>
        <outerBoundaryIs>
          <LinearRing>
            <coordinates>${coordsString}</coordinates>
          </LinearRing>
        </outerBoundaryIs>
      </Polygon>
    </Placemark>`;
                                }).join('\n');
                                
                                content = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>${farm.name}</name>
    <description>Farm boundaries for ${farm.farmerName} - ${drawnBoundaries.length} parcel(s), Total: ${calculatedArea?.toFixed(2)} ha</description>
${placemarks}
  </Document>
</kml>`;
                                mimeType = 'application/vnd.google-earth.kml+xml';
                                extension = 'kml';
                              }

                              // Trigger download
                              const blob = new Blob([content], { type: mimeType });
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = `${filename}.${extension}`;
                              document.body.appendChild(a);
                              a.click();
                              document.body.removeChild(a);
                              URL.revokeObjectURL(url);

                              alert(`${drawnBoundaries.length} parcel(s) exported as ${extension.toUpperCase()}!`);
                            }
                          }}
                        >
                          Download {drawnBoundaries.length} Parcel{drawnBoundaries.length > 1 ? 's' : ''}
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            if (drawnBoundaries.length > 0) {
                              const path = drawnBoundaries[0].getPath();
                              const coordinates: { lat: number; lng: number }[] = [];
                              for (let i = 0; i < path.getLength(); i++) {
                                const point = path.getAt(i);
                                coordinates.push({
                                  lat: point.lat(),
                                  lng: point.lng()
                                });
                              }

                              // Ask user for format
                              const format = confirm('Download as GeoJSON? (Cancel for KML)') ? 'geojson' : 'kml';
                              const timestamp = new Date().toISOString().split('T')[0];
                              const filename = `${farm.name.replace(/\s+/g, '_')}_boundary_${timestamp}`;

                              let content: string;
                              let mimeType: string;
                              let extension: string;

                              if (format === 'geojson') {
                                // Generate GeoJSON
                                const geojson = {
                                  type: 'FeatureCollection',
                                  features: [
                                    {
                                      type: 'Feature',
                                      properties: {
                                        name: farm.name,
                                        farmer: farm.farmerName,
                                        size: farm.size,
                                        crops: farm.crops.join(', '),
                                        calculatedArea: calculatedArea?.toFixed(2)
                                      },
                                      geometry: {
                                        type: 'Polygon',
                                        coordinates: [coordinates.map(c => [c.lng, c.lat])]
                                      }
                                    }
                                  ]
                                };
                                content = JSON.stringify(geojson, null, 2);
                                mimeType = 'application/geo+json';
                                extension = 'geojson';
                              } else {
                                // Generate KML
                                const coordsString = coordinates
                                  .map(c => `${c.lng},${c.lat},0`)
                                  .join(' ');
                                content = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>${farm.name}</name>
    <description>Farm boundary for ${farm.farmerName}</description>
    <Placemark>
      <name>${farm.name}</name>
      <description>
        Farmer: ${farm.farmerName}
        Size: ${farm.size} ha
        Crops: ${farm.crops.join(', ')}
        Calculated Area: ${calculatedArea?.toFixed(2)} ha
      </description>
      <Polygon>
        <outerBoundaryIs>
          <LinearRing>
            <coordinates>${coordsString}</coordinates>
          </LinearRing>
        </outerBoundaryIs>
      </Polygon>
    </Placemark>
  </Document>
</kml>`;
                                mimeType = 'application/vnd.google-earth.kml+xml';
                                extension = 'kml';
                              }

                              // Trigger download
                              const blob = new Blob([content], { type: mimeType });
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = `${filename}.${extension}`;
                              document.body.appendChild(a);
                              a.click();
                              document.body.removeChild(a);
                              URL.revokeObjectURL(url);

                              alert(`Boundary exported as ${extension.toUpperCase()}!`);
                            }
                          }}
                        >
                          Download Boundary
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (drawnBoundaries.length > 0) {
                              // Remove all parcels from map
                              drawnBoundaries.forEach(boundary => boundary.setMap(null));
                              setDrawnBoundaries([]);
                              setParcelAreas([]);
                              setCalculatedArea(null);
                            }
                          }}
                        >
                          Clear Boundary
                        </Button>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={async () => {
                            if (!mapInstance || drawnBoundaries.length === 0) {
                              alert('Please draw farm boundaries before generating report');
                              return;
                            }

                            // Generate PDF report
                            const pdf = new jsPDF();
                            const pageWidth = pdf.internal.pageSize.getWidth();
                            let yPos = 20;

                            // Header
                            pdf.setFontSize(20);
                            pdf.setFont('helvetica', 'bold');
                            pdf.text('Farm Report', pageWidth / 2, yPos, { align: 'center' });
                            yPos += 15;

                            // Farm Details
                            pdf.setFontSize(12);
                            pdf.setFont('helvetica', 'bold');
                            pdf.text('Farm Information', 20, yPos);
                            yPos += 8;

                            pdf.setFont('helvetica', 'normal');
                            pdf.setFontSize(10);
                            pdf.text(`Farm Name: ${farm.name}`, 20, yPos);
                            yPos += 6;
                            pdf.text(`Farmer: ${farm.farmerName}`, 20, yPos);
                            yPos += 6;
                            pdf.text(`Location: ${farm.location.barangay}, ${farm.location.municipality}`, 20, yPos);
                            yPos += 6;
                            pdf.text(`Registered Size: ${farm.size} hectares`, 20, yPos);
                            yPos += 6;
                            pdf.text(`Crops: ${Array.isArray(farm.crops) ? farm.crops.join(', ') : String(farm.crops)}`, 20, yPos);
                            yPos += 6;
                            pdf.text(`Status: ${farm.status}`, 20, yPos);
                            yPos += 6;
                            pdf.text(`Registration Date: ${farm.dateRegistered}`, 20, yPos);
                            yPos += 12;

                            // Parcel Breakdown Table
                            pdf.setFontSize(12);
                            pdf.setFont('helvetica', 'bold');
                            pdf.text('Parcel Breakdown', 20, yPos);
                            yPos += 8;

                            // Table header
                            pdf.setFontSize(10);
                            pdf.setFont('helvetica', 'bold');
                            pdf.text('Parcel #', 20, yPos);
                            pdf.text('Area (ha)', 80, yPos);
                            pdf.text('Percentage', 140, yPos);
                            yPos += 6;

                            // Table rows
                            pdf.setFont('helvetica', 'normal');
                            const totalArea = parcelAreas.reduce((sum, a) => sum + a, 0);
                            parcelAreas.forEach((area, index) => {
                              const percentage = (area / totalArea * 100).toFixed(1);
                              pdf.text(`Parcel ${index + 1}`, 20, yPos);
                              pdf.text(area.toFixed(2), 80, yPos);
                              pdf.text(`${percentage}%`, 140, yPos);
                              yPos += 6;
                            });

                            // Total
                            yPos += 2;
                            pdf.setFont('helvetica', 'bold');
                            pdf.text('Total Calculated Area:', 20, yPos);
                            pdf.text(`${totalArea.toFixed(2)} ha`, 80, yPos);
                            yPos += 10;

                            // Validation
                            pdf.setFontSize(12);
                            pdf.text('Area Validation', 20, yPos);
                            yPos += 8;

                            pdf.setFontSize(10);
                            pdf.setFont('helvetica', 'normal');
                            const difference = Math.abs(totalArea - farm.size);
                            const percentDiff = (difference / farm.size) * 100;
                            pdf.text(`Registered Size: ${farm.size} ha`, 20, yPos);
                            yPos += 6;
                            pdf.text(`Calculated Area: ${totalArea.toFixed(2)} ha`, 20, yPos);
                            yPos += 6;
                            pdf.text(`Difference: ${difference.toFixed(2)} ha (${percentDiff.toFixed(1)}%)`, 20, yPos);
                            yPos += 6;
                            
                            if (percentDiff <= 10) {
                              pdf.setTextColor(0, 128, 0);
                              pdf.text('Status: ✓ Within acceptable tolerance (±10%)', 20, yPos);
                            } else {
                              pdf.setTextColor(255, 0, 0);
                              pdf.text('Status: ⚠ Exceeds tolerance (±10%)', 20, yPos);
                            }
                            pdf.setTextColor(0, 0, 0);
                            yPos += 15;

                            // Footer
                            pdf.setFontSize(8);
                            pdf.setFont('helvetica', 'italic');
                            pdf.text(`Generated on: ${new Date().toLocaleString()}`, 20, yPos);
                            pdf.text('MAGSASA-CARD ERP System', 20, yPos + 4);

                            // Save PDF
                            const filename = `${farm.name.replace(/\s+/g, '_')}_Report_${new Date().toISOString().split('T')[0]}.pdf`;
                            pdf.save(filename);
                          }}
                        >
                          <FileDown className="w-4 h-4 mr-1" />
                          Download Report
                        </Button>
                      </>
                    )}
                  </div>
                </div>
                {measuredDistance !== null && (
                  <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Ruler className="w-4 h-4 text-purple-600" />
                      <span className="text-sm font-medium text-purple-800">
                        Measured Distance:
                      </span>
                      <span className="text-sm font-bold text-purple-900">
                        {measuredDistance < 1000 
                          ? `${measuredDistance.toFixed(2)} meters`
                          : `${(measuredDistance / 1000).toFixed(2)} kilometers`
                        }
                      </span>
                    </div>
                  </div>
                )}
                {calculatedArea && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        Calculated Area: <strong>{calculatedArea.toFixed(2)} hectares</strong>
                      </span>
                      <span className="text-sm text-muted-foreground">
                        | Entered Size: <strong>{farm.size} hectares</strong>
                      </span>
                    </div>
                    {(() => {
                      const difference = Math.abs(calculatedArea - farm.size);
                      const percentDiff = (difference / farm.size) * 100;
                      
                      if (percentDiff > 10) {
                        return (
                          <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <div className="flex-1">
                              <p className="text-sm font-medium text-yellow-800">
                                ⚠️ Area Mismatch Detected
                              </p>
                              <p className="text-xs text-yellow-700 mt-1">
                                The drawn boundary area differs by {percentDiff.toFixed(1)}% from the entered farm size.
                                {calculatedArea > farm.size 
                                  ? ` The drawn area is ${difference.toFixed(2)} hectares larger.`
                                  : ` The drawn area is ${difference.toFixed(2)} hectares smaller.`
                                }
                              </p>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs"
                              onClick={() => {
                                if (confirm(`Update farm size from ${farm.size} ha to ${calculatedArea.toFixed(2)} ha?`)) {
                                  // TODO: Update farm size in backend
                                  alert('Farm size would be updated to match drawn boundary');
                                }
                              }}
                            >
                              Update Size
                            </Button>
                          </div>
                        );
                      } else if (percentDiff > 5) {
                        return (
                          <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                            ℹ️ Minor difference: {percentDiff.toFixed(1)}% ({difference.toFixed(2)} ha)
                          </div>
                        );
                      } else {
                        return (
                          <div className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                            ✓ Area matches entered size ({percentDiff.toFixed(1)}% difference)
                          </div>
                        );
                      }
                    })()}
                  </div>
                )}
                {tempCalculatedArea !== null && (
                  <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Calculator className="w-4 h-4 text-orange-600" />
                      <span className="text-sm font-medium text-orange-800">
                        Quick Area Calculation:
                      </span>
                      <span className="text-sm font-bold text-orange-900">
                        {tempCalculatedArea.toFixed(2)} hectares
                      </span>
                      <span className="text-xs text-orange-700">
                        (Temporary - not saved)
                      </span>
                    </div>
                  </div>
                )}
                {calculatedArea && (
                  <div className="space-y-2">
                    {drawnBoundaries.length > 1 && (
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="text-sm font-medium text-blue-800 mb-2">
                          📦 {drawnBoundaries.length} Parcels (Non-contiguous Land)
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {parcelAreas.map((area, index) => {
                            const colors = [
                              'bg-green-100 text-green-700',
                              'bg-blue-100 text-blue-700',
                              'bg-orange-100 text-orange-700',
                              'bg-purple-100 text-purple-700',
                              'bg-pink-100 text-pink-700',
                            ];
                            return (
                              <div key={index} className="flex items-center justify-between gap-2 text-xs">
                                <span className={`px-2 py-1 rounded ${colors[index % colors.length]}`}>
                                  Parcel {index + 1}
                                </span>
                                <div className="flex items-center gap-1">
                                  <span className="font-medium">{area.toFixed(2)} ha</span>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <button
                                        className="p-0.5 hover:bg-red-100 rounded transition-colors"
                                        title="Delete this parcel"
                                      >
                                        <X className="w-3 h-3 text-red-600" />
                                      </button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Delete Parcel {index + 1}?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Are you sure you want to delete Parcel {index + 1} ({area.toFixed(2)} ha)? This action cannot be undone and will remove the parcel boundary from the map.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() => {
                                            // Remove polygon from map
                                            drawnBoundaries[index].setMap(null);
                                            
                                            // Remove from arrays
                                            const newBoundaries = drawnBoundaries.filter((_, i) => i !== index);
                                            const newAreas = parcelAreas.filter((_, i) => i !== index);
                                            
                                            setDrawnBoundaries(newBoundaries);
                                            setParcelAreas(newAreas);
                                            
                                            // Recalculate total area
                                            if (newAreas.length > 0) {
                                              const totalArea = newAreas.reduce((sum, a) => sum + a, 0);
                                              setCalculatedArea(totalArea);
                                            } else {
                                              setCalculatedArea(null);
                                            }
                                            
                                            // Save to history for undo/redo
                                            saveToHistory(newBoundaries, newAreas);
                                          }}
                                          className="bg-red-600 hover:bg-red-700"
                                        >
                                          Delete
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        {drawnBoundaries.length > 1 ? 'Total' : 'Calculated'} Area: <strong>{calculatedArea.toFixed(2)} hectares</strong>
                      </span>
                      <span className="text-sm text-muted-foreground">
                        | Entered Size: <strong>{farm.size} hectares</strong>
                      </span>
                    </div>
                    {(() => {
                      const difference = Math.abs(calculatedArea - farm.size);
                      const percentDiff = (difference / farm.size) * 100;
                      
                      if (percentDiff > 10) {
                        return (
                          <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <div className="flex-1">
                              <p className="text-sm font-medium text-yellow-800">
                                ⚠️ Area Mismatch Detected
                              </p>
                              <p className="text-xs text-yellow-700 mt-1">
                                The drawn boundary area differs by {percentDiff.toFixed(1)}% from the entered farm size.
                                {calculatedArea > farm.size 
                                  ? ` The drawn area is ${difference.toFixed(2)} hectares larger.`
                                  : ` The drawn area is ${difference.toFixed(2)} hectares smaller.`
                                }
                              </p>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs"
                              onClick={() => {
                                if (confirm(`Update farm size from ${farm.size} ha to ${calculatedArea.toFixed(2)} ha?`)) {
                                  // Backend size update pending (see docs/PRODUCTION-QA-FARMDETAIL.md)
                                  alert('Farm size would be updated to match drawn boundary');
                                }
                              }}
                            >
                              Update Size
                            </Button>
                          </div>
                        );
                      } else if (percentDiff > 5) {
                        return (
                          <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                            ℹ️ Minor difference: {percentDiff.toFixed(1)}% ({difference.toFixed(2)} ha)
                          </div>
                        );
                      } else {
                        return (
                          <div className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                            ✓ Area matches entered size ({percentDiff.toFixed(1)}% difference)
                          </div>
                        );
                      }
                    })()}
                  </div>
                )}
                
                {/* Map Type Switcher */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium">Map View</span>
                    <label className="flex items-center gap-2 text-sm cursor-pointer hover:text-primary transition-colors">
                      <Checkbox
                        checked={terrainEnabled}
                        onCheckedChange={(checked) => {
                          const enabled = checked === true;
                          setTerrainEnabled(enabled);
                          
                          if (mapInstance) {
                            if (enabled) {
                              // Switch to terrain map type which shows elevation and topography
                              const currentType = mapInstance.getMapTypeId();
                              if (currentType === 'roadmap') {
                                mapInstance.setMapTypeId('terrain');
                                setMapType('roadmap'); // Keep UI state as roadmap
                              } else {
                                // For satellite/hybrid, enable terrain overlay
                                mapInstance.setOptions({ 
                                  // @ts-ignore - tilt is valid
                                  tilt: 45 
                                });
                              }
                            } else {
                              // Switch back to regular roadmap if currently on terrain
                              const currentType = mapInstance.getMapTypeId();
                              if (currentType === 'terrain') {
                                mapInstance.setMapTypeId('roadmap');
                              } else {
                                mapInstance.setOptions({ 
                                  // @ts-ignore
                                  tilt: 0 
                                });
                              }
                            }
                          }
                        }}
                      />
                      <Mountain className="w-4 h-4" />
                      <span>Show Terrain</span>
                    </label>
                  </div>
                </div>
                
                <div className="h-96 rounded-lg overflow-hidden border relative">
                  {isMapLoading && (
                    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
                      <Loader2 className="w-8 h-8 animate-spin text-primary" />
                      <p className="mt-2 text-sm text-muted-foreground">Loading map...</p>
                    </div>
                  )}
                  <MapView
                    onMapReady={(map: google.maps.Map) => {
                      const google = (window as any).google;
                      if (!google) return;
                      // Hide loading overlay
                      setIsMapLoading(false);
                      
                      // Center map on farm location
                      const position = {
                        lat: farm.location.coordinates.lat,
                        lng: farm.location.coordinates.lng,
                      };
                      map.setCenter(position);
                      map.setZoom(15);
                      
                      new google.maps.Marker({
                        position,
                        map,
                        title: farm.name,
                      });

                      // Check for pending uploaded boundary coordinates
                      const pendingCoords = (window as any).pendingBoundaryCoordinates;
                      if (pendingCoords && pendingCoords.length > 0) {
                        const uploadedBoundary = new google.maps.Polygon({
                          paths: pendingCoords,
                          fillColor: '#3b82f6',
                          fillOpacity: 0.3,
                          strokeWeight: 2,
                          strokeColor: '#2563eb',
                          editable: true,
                          draggable: true,
                          map,
                        });
                        
                        // Calculate and display area
                        const area = google.maps.geometry.spherical.computeArea(uploadedBoundary.getPath());
                        const hectares = area / 10000;
                        setDrawnBoundaries([uploadedBoundary]);
                        setParcelAreas([hectares]);
                        setCalculatedArea(hectares);

                        // Update area on edit
                        google.maps.event.addListener(uploadedBoundary.getPath(), 'set_at', () => {
                          const newArea = google.maps.geometry.spherical.computeArea(uploadedBoundary.getPath());
                          const newHectares = newArea / 10000;
                          setParcelAreas([newHectares]);
                          setCalculatedArea(newHectares);
                        });
                        google.maps.event.addListener(uploadedBoundary.getPath(), 'insert_at', () => {
                          const newArea = google.maps.geometry.spherical.computeArea(uploadedBoundary.getPath());
                          const newHectares = newArea / 10000;
                          setParcelAreas([newHectares]);
                          setCalculatedArea(newHectares);
                        });

                        // Fit map to boundary
                        const bounds = new google.maps.LatLngBounds();
                        pendingCoords.forEach((coord: { lat: number; lng: number }) => {
                          bounds.extend(coord);
                        });
                        map.fitBounds(bounds);

                        // Clear pending coordinates
                        delete (window as any).pendingBoundaryCoordinates;
                      }
                      // Display existing boundary if available
                      else if (farm.boundary && farm.boundary.length > 0) {
                        const existingBoundary = new google.maps.Polygon({
                          paths: farm.boundary,
                          fillColor: '#22c55e',
                          fillOpacity: 0.3,
                          strokeWeight: 2,
                          strokeColor: '#16a34a',
                          editable: true,
                          draggable: true,
                          map,
                        });
                        
                        // Calculate and display existing area
                        const area = google.maps.geometry.spherical.computeArea(existingBoundary.getPath());
                        const hectares = area / 10000;
                        setDrawnBoundaries([existingBoundary]);
                        setParcelAreas([hectares]);
                        setCalculatedArea(hectares);

                        // Update area on edit
                        google.maps.event.addListener(existingBoundary.getPath(), 'set_at', () => {
                          const newArea = google.maps.geometry.spherical.computeArea(existingBoundary.getPath());
                          const newHectares = newArea / 10000;
                          setParcelAreas([newHectares]);
                          setCalculatedArea(newHectares);
                        });
                        google.maps.event.addListener(existingBoundary.getPath(), 'insert_at', () => {
                          const newArea = google.maps.geometry.spherical.computeArea(existingBoundary.getPath());
                          const newHectares = newArea / 10000;
                          setParcelAreas([newHectares]);
                          setCalculatedArea(newHectares);
                        });
                      }

                      // Initialize Drawing Manager
                      const drawingManager = new google.maps.drawing.DrawingManager({
                        drawingMode: null,
                        drawingControl: false,
                        polygonOptions: {
                          fillColor: '#22c55e',
                          fillOpacity: 0.3,
                          strokeWeight: 2,
                          strokeColor: '#16a34a',
                          editable: true,
                          draggable: true,
                        },
                      });
                      drawingManager.setMap(map);

                      // Color palette for different parcels
                      const parcelColors = [
                        { fill: '#22c55e', stroke: '#16a34a' }, // Green
                        { fill: '#3b82f6', stroke: '#2563eb' }, // Blue
                        { fill: '#f59e0b', stroke: '#d97706' }, // Orange
                        { fill: '#8b5cf6', stroke: '#7c3aed' }, // Purple
                        { fill: '#ec4899', stroke: '#db2777' }, // Pink
                      ];

                      // Toggle drawing mode
                      const checkDrawingMode = setInterval(() => {
                        if (isDrawingMode) {
                          drawingManager.setDrawingMode(google.maps.drawing.OverlayType.POLYGON);
                        } else {
                          drawingManager.setDrawingMode(null);
                        }
                      }, 100);

                      // Handle polygon complete
                      google.maps.event.addListener(drawingManager, 'polygoncomplete', (polygon: google.maps.Polygon) => {
                        // Get color for this parcel
                        const colorIndex = drawnBoundaries.length % parcelColors.length;
                        const color = parcelColors[colorIndex];
                        
                        // Apply color to polygon
                        polygon.setOptions({
                          fillColor: color.fill,
                          strokeColor: color.stroke,
                        });

                        // Add to boundaries array
                        setDrawnBoundaries(prev => [...prev, polygon]);
                        
                        // Calculate area for this parcel
                        const area = google.maps.geometry.spherical.computeArea(polygon.getPath());
                        const hectares = area / 10000; // Convert m² to hectares
                        setParcelAreas(prev => [...prev, hectares]);

                        // Calculate total area
                        const totalArea = [...parcelAreas, hectares].reduce((sum, a) => sum + a, 0);
                        setCalculatedArea(totalArea);
                        
                        // Save to history for undo/redo
                        const newBoundaries = [...drawnBoundaries, polygon];
                        const newAreas = [...parcelAreas, hectares];
                        saveToHistory(newBoundaries, newAreas);

                        // Update area on edit
                        const parcelIndex = drawnBoundaries.length;
                        google.maps.event.addListener(polygon.getPath(), 'set_at', () => {
                          const newArea = google.maps.geometry.spherical.computeArea(polygon.getPath());
                          const newHectares = newArea / 10000;
                          setParcelAreas(prev => {
                            const updated = [...prev];
                            updated[parcelIndex] = newHectares;
                            setCalculatedArea(updated.reduce((sum, a) => sum + a, 0));
                            return updated;
                          });
                        });
                        google.maps.event.addListener(polygon.getPath(), 'insert_at', () => {
                          const newArea = google.maps.geometry.spherical.computeArea(polygon.getPath());
                          const newHectares = newArea / 10000;
                          setParcelAreas(prev => {
                            const updated = [...prev];
                            updated[parcelIndex] = newHectares;
                            setCalculatedArea(updated.reduce((sum, a) => sum + a, 0));
                            return updated;
                          });
                        });

                        // Keep drawing mode active for adding more parcels
                        // User can click "Stop Drawing" to exit
                      });

                      // Initialize Area Calculation Drawing Manager
                      const areaCalcDrawingManager = new google.maps.drawing.DrawingManager({
                        drawingMode: null,
                        drawingControl: false,
                        polygonOptions: {
                          fillColor: '#f97316',
                          fillOpacity: 0.35,
                          strokeWeight: 3,
                          strokeColor: '#ea580c',
                          editable: true,
                          draggable: true,
                        },
                      });
                      areaCalcDrawingManager.setMap(map);

                      // Toggle area calculation drawing mode
                      const checkAreaCalcMode = setInterval(() => {
                        if (isCalculatingArea && !tempAreaPolygon) {
                          areaCalcDrawingManager.setDrawingMode(google.maps.drawing.OverlayType.POLYGON);
                        } else {
                          areaCalcDrawingManager.setDrawingMode(null);
                        }
                      }, 100);

                      // Handle area calculation polygon complete
                      google.maps.event.addListener(areaCalcDrawingManager, 'polygoncomplete', (polygon: google.maps.Polygon) => {
                        setTempAreaPolygon(polygon);
                        setIsCalculatingArea(false);
                        
                        // Calculate area
                        const area = google.maps.geometry.spherical.computeArea(polygon.getPath());
                        const hectares = area / 10000;
                        setTempCalculatedArea(hectares);

                        // Update area on edit
                        google.maps.event.addListener(polygon.getPath(), 'set_at', () => {
                          const newArea = google.maps.geometry.spherical.computeArea(polygon.getPath());
                          setTempCalculatedArea(newArea / 10000);
                        });
                        google.maps.event.addListener(polygon.getPath(), 'insert_at', () => {
                          const newArea = google.maps.geometry.spherical.computeArea(polygon.getPath());
                          setTempCalculatedArea(newArea / 10000);
                        });
                      });

                      // Add measurement click listener
                      const measurementClickListener = google.maps.event.addListener(map, 'click', (event: google.maps.MapMouseEvent) => {
                        if (!isMeasuring) return;
                        
                        const clickedLocation = event.latLng;
                        if (!clickedLocation) return;

                        if (measurementMarkers.length === 0) {
                          // First click - place start marker
                          const startMarker = new google.maps.Marker({
                            position: clickedLocation,
                            map,
                            icon: {
                              path: google.maps.SymbolPath.CIRCLE,
                              scale: 8,
                              fillColor: '#9333ea',
                              fillOpacity: 1,
                              strokeColor: '#ffffff',
                              strokeWeight: 2,
                            },
                            title: 'Start point',
                          });
                          setMeasurementMarkers([startMarker]);
                        } else if (measurementMarkers.length === 1) {
                          // Second click - place end marker and calculate distance
                          const endMarker = new google.maps.Marker({
                            position: clickedLocation,
                            map,
                            icon: {
                              path: google.maps.SymbolPath.CIRCLE,
                              scale: 8,
                              fillColor: '#9333ea',
                              fillOpacity: 1,
                              strokeColor: '#ffffff',
                              strokeWeight: 2,
                            },
                            title: 'End point',
                          });
                          
                          // Draw line between markers
                          const line = new google.maps.Polyline({
                            path: [measurementMarkers[0].getPosition()!, clickedLocation],
                            strokeColor: '#9333ea',
                            strokeOpacity: 0.8,
                            strokeWeight: 3,
                            map,
                          });
                          
                          // Calculate distance
                          const distance = google.maps.geometry.spherical.computeDistanceBetween(
                            measurementMarkers[0].getPosition()!,
                            clickedLocation
                          );
                          
                          setMeasurementMarkers([...measurementMarkers, endMarker]);
                          setMeasurementLine(line);
                          setMeasuredDistance(distance);
                          setIsMeasuring(false);
                        }
                      });

                      return () => {
                        clearInterval(checkDrawingMode);
                        clearInterval(checkAreaCalcMode);
                        google.maps.event.removeListener(measurementClickListener);
                      };
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Crops Card */}
          <Card>
            <CardHeader>
              <CardTitle>Crops</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {farm.crops.map((crop: string) => (
                  <Badge key={crop} variant="outline" className="text-sm">
                    {crop}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
          
          {/* Farm Photos Card */}
          <Card>
            <CardHeader>
              <CardTitle>Farm Photos</CardTitle>
            </CardHeader>
            <CardContent>
              <PhotoGallery photos={(farm as any).photoUrls || []} />
            </CardContent>
          </Card>

          {/* Yield Tracking Card */}
          {drawnBoundaries.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Sprout className="w-5 h-5" />
                    Yield Tracking
                  </CardTitle>
                  <Dialog open={isYieldDialogOpen} onOpenChange={setIsYieldDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm">
                        <Sprout className="w-4 h-4 mr-1" />
                        Record Harvest
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Record Harvest Yield</DialogTitle>
                      </DialogHeader>
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          const formData = new FormData(e.currentTarget);
                          // QA: Use mutation to save to backend instead of local state
                          createYieldMutation.mutate({
                            farmId: farmId!,
                            parcelIndex: parseInt(formData.get('parcel') as string),
                            cropType: formData.get('crop') as string,
                            harvestDate: formData.get('harvestDate') as string,
                            quantity: parseFloat(formData.get('quantity') as string),
                            unit: formData.get('unit') as 'kg' | 'tons',
                            qualityGrade: formData.get('qualityGrade') as 'Premium' | 'Standard' | 'Below Standard',
                          });
                          setIsYieldDialogOpen(false);
                        }}
                        className="space-y-4"
                      >
                        <div className="space-y-2">
                          <Label htmlFor="parcel">Parcel</Label>
                          <Select name="parcel" required>
                            <SelectTrigger>
                              <SelectValue placeholder="Select parcel" />
                            </SelectTrigger>
                            <SelectContent>
                              {parcelAreas.map((_, index) => (
                                <SelectItem key={index} value={index.toString()}>
                                  Parcel {index + 1} ({parcelAreas[index].toFixed(2)} ha)
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="crop">Crop Type</Label>
                          <Select name="crop" required>
                            <SelectTrigger>
                              <SelectValue placeholder="Select crop" />
                            </SelectTrigger>
                            <SelectContent>
                              {farm.crops.map((crop: string) => (
                                <SelectItem key={crop} value={crop}>
                                  {crop}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="harvestDate">Harvest Date</Label>
                          <Input
                            type="date"
                            name="harvestDate"
                            required
                            max={new Date().toISOString().split('T')[0]}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="quantity">Quantity</Label>
                            <Input
                              type="number"
                              name="quantity"
                              step="0.01"
                              min="0"
                              required
                              placeholder="0.00"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="unit">Unit</Label>
                            <Select name="unit" required>
                              <SelectTrigger>
                                <SelectValue placeholder="Unit" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="kg">Kilograms (kg)</SelectItem>
                                <SelectItem value="tons">Tons</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="qualityGrade">Quality Grade</Label>
                          <Select name="qualityGrade" required>
                            <SelectTrigger>
                              <SelectValue placeholder="Select grade" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Premium">Premium</SelectItem>
                              <SelectItem value="Standard">Standard</SelectItem>
                              <SelectItem value="Below Standard">Below Standard</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsYieldDialogOpen(false)}
                          >
                            Cancel
                          </Button>
                          <Button type="submit">Save Harvest</Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {yieldsError ? (
                  <ErrorState
                    title="Failed to load yield records"
                    message={yieldsError.message || "Unable to fetch yield data. Please try again."}
                    onRetry={() => refetchYields()}
                  />
                ) : yieldRecords.length === 0 ? (
                  <EmptyStateCompact
                    icon={Sprout}
                    title="No harvest records yet"
                    description="Start tracking your farm's productivity by recording harvest yields for each parcel."
                    actionLabel="Record First Harvest"
                    onAction={() => setIsYieldDialogOpen(true)}
                  />
                ) : (
                  <div className="space-y-4">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2">Parcel</th>
                            <th className="text-left py-2">Crop</th>
                            <th className="text-left py-2">Date</th>
                            <th className="text-right py-2">Quantity</th>
                            <th className="text-right py-2">Yield/ha</th>
                            <th className="text-left py-2">Grade</th>
                            <th className="text-right py-2">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {displayedYieldRecords.map((record) => {
                            const parcelArea = parcelAreas[record.parcelIndex] || 1; // QA: Prevent division by zero
                            const quantityInTons = record.unit === 'tons' ? record.quantity : record.quantity / 1000;
                            const yieldPerHa = parcelArea > 0 ? quantityInTons / parcelArea : 0;
                            return (
                              <tr key={record.id} className="border-b">
                                <td className="py-2">Parcel {record.parcelIndex + 1}</td>
                                <td className="py-2">{record.cropType}</td>
                                <td className="py-2">{new Date(record.harvestDate).toLocaleDateString()}</td>
                                <td className="text-right py-2">
                                  {record.quantity} {record.unit}
                                </td>
                                <td className="text-right py-2">
                                  {yieldPerHa.toFixed(2)} t/ha
                                </td>
                                <td className="py-2">
                                  <Badge
                                    variant={record.qualityGrade === 'Premium' ? 'default' : 'outline'}
                                    className="text-xs"
                                  >
                                    {record.qualityGrade}
                                  </Badge>
                                </td>
                                <td className="text-right py-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      // QA: Use mutation to delete from backend
                                      deleteYieldMutation.mutate({ id: parseInt(record.id) });
                                    }}
                                  >
                                    <Trash2 className="w-4 h-4 text-red-600" />
                                  </Button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    {/* QA Pass 2: Memoize expensive calculations */}
                    {(() => {
                      const totalYield = useMemo(() => {
                        return yieldRecords.reduce((sum, r) => {
                          const tons = r.unit === 'tons' ? r.quantity : r.quantity / 1000;
                          return sum + tons;
                        }, 0);
                      }, [yieldRecords]);
                      
                      const averageYieldPerHa = useMemo(() => {
                        const totalTons = yieldRecords.reduce((sum, r) => {
                          const tons = r.unit === 'tons' ? r.quantity : r.quantity / 1000;
                          return sum + tons;
                        }, 0);
                        const totalArea = parcelAreas.reduce((sum, a) => sum + a, 0);
                        return totalArea > 0 ? totalTons / totalArea : 0;
                      }, [yieldRecords, parcelAreas]);
                      
                      return (
                        <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                          <div>
                            <p className="text-sm font-medium">Total Yield</p>
                            <p className="text-2xl font-bold">
                              {totalYield.toFixed(2)} tons
                            </p>
                          </div>
                          <div>
                            <p className="text-sm font-medium">Average Yield per Hectare</p>
                            <p className="text-2xl font-bold">
                              {averageYieldPerHa.toFixed(2)} t/ha
                            </p>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Cost Tracking Card */}
          {drawnBoundaries.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Coins className="w-5 h-5" />
                    Input Costs
                  </CardTitle>
                  <Dialog open={isCostDialogOpen} onOpenChange={setIsCostDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm">
                        <Coins className="w-4 h-4 mr-1" />
                        Record Cost
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Record Input Cost</DialogTitle>
                      </DialogHeader>
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          const formData = new FormData(e.currentTarget);
                          const parcelValue = formData.get('parcel') as string;
                          // QA: Use mutation to save to backend instead of local state
                          createCostMutation.mutate({
                            farmId: farmId!,
                            date: formData.get('date') as string,
                            category: formData.get('category') as 'Fertilizer' | 'Pesticides' | 'Seeds' | 'Labor' | 'Equipment' | 'Other',
                            description: formData.get('description') as string || undefined,
                            amount: parseFloat(formData.get('amount') as string),
                            parcelIndex: parcelValue === 'all' ? null : parseInt(parcelValue),
                          });
                          setIsCostDialogOpen(false);
                        }}
                        className="space-y-4"
                      >
                        <div className="space-y-2">
                          <Label htmlFor="category">Category</Label>
                          <Select name="category" required>
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Fertilizer">Fertilizer</SelectItem>
                              <SelectItem value="Pesticides">Pesticides</SelectItem>
                              <SelectItem value="Seeds">Seeds</SelectItem>
                              <SelectItem value="Labor">Labor</SelectItem>
                              <SelectItem value="Equipment">Equipment</SelectItem>
                              <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="date">Date</Label>
                          <Input
                            type="date"
                            name="date"
                            required
                            max={new Date().toISOString().split('T')[0]}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="amount">Amount (PHP)</Label>
                          <Input
                            type="number"
                            name="amount"
                            step="0.01"
                            min="0"
                            required
                            placeholder="0.00"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="parcel">Applies To</Label>
                          <Select name="parcel" required>
                            <SelectTrigger>
                              <SelectValue placeholder="Select parcel" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Parcels</SelectItem>
                              {parcelAreas.map((_, index) => (
                                <SelectItem key={index} value={index.toString()}>
                                  Parcel {index + 1} ({parcelAreas[index].toFixed(2)} ha)
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="description">Description</Label>
                          <Textarea
                            name="description"
                            placeholder="e.g., NPK fertilizer application, hired 5 workers for harvest"
                            rows={3}
                          />
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsCostDialogOpen(false)}
                          >
                            Cancel
                          </Button>
                          <Button type="submit">Save Cost</Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {costsError ? (
                  <ErrorState
                    title="Failed to load cost records"
                    message={costsError.message || "Unable to fetch cost data. Please try again."}
                    onRetry={() => refetchCosts()}
                  />
                ) : costRecords.length === 0 ? (
                  <EmptyStateCompact
                    icon={DollarSign}
                    title="No cost records yet"
                    description="Track your farm expenses including seeds, fertilizers, labor, and equipment to monitor profitability."
                    actionLabel="Record First Cost"
                    onAction={() => setIsCostDialogOpen(true)}
                  />
                ) : (
                  <div className="space-y-4">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2">Date</th>
                            <th className="text-left py-2">Category</th>
                            <th className="text-left py-2">Parcel</th>
                            <th className="text-right py-2">Amount</th>
                            <th className="text-right py-2">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {displayedCostRecords.map((record) => (
                            <tr key={record.id} className="border-b">
                              <td className="py-2">{new Date(record.date).toLocaleDateString()}</td>
                              <td className="py-2">
                                <Badge variant="outline" className="text-xs">
                                  {record.category}
                                </Badge>
                              </td>
                              <td className="py-2">
                                {record.parcelIndex === null ? 'All' : `Parcel ${record.parcelIndex + 1}`}
                              </td>
                              <td className="text-right py-2">₱{record.amount.toFixed(2)}</td>
                              <td className="text-right py-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteCost(record.id)}
                                >
                                  <Trash2 className="w-4 h-4 text-red-600" />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <CostSummaryStats costRecords={costRecords} />
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Profitability Card */}
          {drawnBoundaries.length > 0 && yieldRecords.length > 0 && costRecords.length > 0 && (
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  Profitability Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ProfitabilityAnalysis yieldRecords={yieldRecords} costRecords={costRecords} />
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Farmer Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Farmer
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Link href={`/farmers/${(farm as any).userId || farm.id}`}>
                <div className="hover:bg-gray-50 p-3 rounded-lg transition-colors cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                      <span className="text-lg font-bold text-green-600">
                        {farm.farmerName
                          .split(" ")
                          .map((n: string) => n[0])
                          .join("")}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold">{farm.farmerName}</p>
                      <p className="text-xs text-muted-foreground">
                        View Profile →
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            </CardContent>
          </Card>

          {/* Production Stats */}
          {farm.averageYield && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Production
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Average Yield</p>
                  <p className="text-2xl font-bold text-green-600">
                    {farm.averageYield} MT/ha
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Total Production
                  </p>
                  <p className="text-xl font-semibold">
                    {(farm.averageYield * farm.size).toFixed(1)} MT
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <Mountain className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">
                  <strong>{farm.soilType}</strong> soil
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Droplets className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">
                  <strong>{farm.irrigationType}</strong> irrigation
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">
                  Registered {formatDate(farm.dateRegistered)}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

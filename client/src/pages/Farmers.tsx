import { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { Search, MapPin, Phone, Mail, Calendar, Eye, Plus, Edit, Layers, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { type Farmer } from '@/data/farmersData';
import { trpcClient } from '@/lib/trpcClient';
import Pagination from '@/components/Pagination';
import FarmerQuickView from '@/components/FarmerQuickView';
import AdvancedFilters, { type FilterOptions } from '@/components/AdvancedFilters';
import { applyFarmerFilters, getActiveFilterCount, getFilterSummary } from '@/utils/farmerFilters';
import AddFarmerDialog from '@/components/AddFarmerDialog';
import EditFarmerDialog from '@/components/EditFarmerDialog';

export default function Farmers() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBarangay, setSelectedBarangay] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;
  const [selectedFarmer, setSelectedFarmer] = useState<Farmer | null>(null);
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingFarmer, setEditingFarmer] = useState<Farmer | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [filters, setFilters] = useState<FilterOptions>({
    landArea: 'all',
    cropType: 'all',
    membershipYear: 'all',
    performance: 'all',
  });
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch farmers from database via tRPC
  useEffect(() => {
    const fetchFarmers = async () => {
      try {
        setIsLoading(true);
        const result = await trpcClient.farmers.list.query({
          search: searchQuery || undefined,
          barangay: selectedBarangay !== 'all' ? selectedBarangay : undefined,
        });
        
        // Map database result to Farmer interface
        const mappedFarmers: Farmer[] = result.map((f: any) => {
          const firstBarangay = f.barangays ? String(f.barangays).split(',')[0].trim() : '';
          const municipality = f.municipality || 'Calauan';
          const province = 'Laguna';
          
          return {
            id: String(f.id), // Convert number to string for compatibility
            name: f.name || 'Unknown',
            location: firstBarangay ? `Brgy. ${firstBarangay}, ${municipality}, ${province}` : `${municipality}, ${province}`,
            barangay: firstBarangay,
            municipality: municipality,
            province: province,
            contactNumber: '', // Not available in database
            email: f.email || undefined,
            cardMemberSince: f.createdAt ? new Date(f.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            totalLandArea: f.totalArea || 0,
            activeFarms: f.farmCount || 0,
            totalHarvest: f.totalHarvest || 0,
            status: 'active' as const,
            crops: f.crops || [],
            lastActivity: f.lastSignedIn || f.updatedAt || f.createdAt || new Date().toISOString(),
          };
        });
        
        setFarmers(mappedFarmers);
      } catch (error) {
        // Error logged to console for debugging, but UI shows empty state gracefully
        console.error('[Farmers] Error fetching farmers:', error);
        setFarmers([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchFarmers();
  }, [searchQuery, selectedBarangay, refreshKey]);

  // Helper function to get farmer's farms (using farmCount from API)
  const getFarmerFarms = (farmerId: string) => {
    const farmer = farmers.find(f => f.id === farmerId);
    return farmer ? Array(farmer.activeFarms).fill(null) : []; // Return array of length for display
  };
  
  // Helper function to calculate total area (using totalLandArea from API)
  const getTotalArea = (farmerId: string) => {
    const farmer = farmers.find(f => f.id === farmerId);
    return farmer ? farmer.totalLandArea : 0;
  };

  // Note: Debug logging removed for production

  const barangays = ['all', ...Array.from(new Set(farmers.map(f => f.barangay).filter(Boolean)))];

  // Apply advanced filters (landArea, cropType, etc.) - these work on the fetched data
  let filteredFarmers = applyFarmerFilters(farmers, [], filters, searchQuery);
  
  // Barangay filter is already applied in the API query, but we can filter again if needed
  if (selectedBarangay !== 'all') {
    filteredFarmers = filteredFarmers.filter(farmer => farmer.barangay === selectedBarangay);
  }

  const activeFilterCount = getActiveFilterCount(filters);
  const filterSummary = getFilterSummary(filters, filteredFarmers.length, farmers.length);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleEditClick = (farmer: Farmer, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingFarmer(farmer);
    setIsEditDialogOpen(true);
  };

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedBarangay, filters]);

  // Scroll to top when page changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPage]);

  // Wrapper function to handle page changes
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Pagination calculations
  const totalPages = Math.max(1, Math.ceil(filteredFarmers.length / itemsPerPage));
  const startIndex = Math.max(0, (currentPage - 1) * itemsPerPage);
  const endIndex = Math.min(startIndex + itemsPerPage, filteredFarmers.length);
  const paginatedFarmers = filteredFarmers.slice(startIndex, endIndex);
  
  // Ensure currentPage is within valid range
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [currentPage, totalPages]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">Farmers</h1>
          <p className="text-muted-foreground mt-1">Manage and monitor farmer information</p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Farmer
        </Button>
      </div>

      {/* Advanced Filters */}
      <AdvancedFilters
        filters={filters}
        onFilterChange={setFilters}
        activeFilterCount={activeFilterCount}
      />

      {/* Search and Barangay Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search farmers by name or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          value={selectedBarangay}
          onChange={(e) => setSelectedBarangay(e.target.value)}
          className="px-4 py-2 border rounded-md bg-background"
        >
          <option value="all">All Barangays</option>
          {barangays.slice(1).map(barangay => (
            <option key={barangay} value={barangay}>{barangay}</option>
          ))}
        </select>
      </div>

      {/* Filter Summary */}
      <div className="mb-4 text-sm text-gray-600">
        {filterSummary}
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Total Farmers</p>
          {isLoading ? (
            <Loader2 className="h-6 w-6 animate-spin mt-1" />
          ) : (
            <p className="text-2xl font-bold mt-1">{filteredFarmers.length}</p>
          )}
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Total Land Area</p>
          {isLoading ? (
            <Loader2 className="h-6 w-6 animate-spin mt-1" />
          ) : (
            <p className="text-2xl font-bold mt-1">
              {filteredFarmers.reduce((sum, f) => sum + f.totalLandArea, 0).toFixed(1)} ha
            </p>
          )}
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Total Harvest</p>
          {isLoading ? (
            <Loader2 className="h-6 w-6 animate-spin mt-1" />
          ) : (
            <p className="text-2xl font-bold mt-1">
              {filteredFarmers.reduce((sum, f) => sum + f.totalHarvest, 0).toFixed(1)} MT
            </p>
          )}
        </Card>
      </div>

      {/* Loading State */}
      {isLoading && (
        <Card className="p-12 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading farmers...</p>
        </Card>
      )}

      {/* Farmers Grid */}
      {!isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {paginatedFarmers.map((farmer) => (
          <Card key={farmer.id} className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                  <span className="text-lg font-bold text-green-600">
                    {farmer.name ? farmer.name.split(' ').map(n => n[0] || '').join('').substring(0, 2) : '??'}
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{farmer.name}</h3>
                    {getFarmerFarms(farmer.id).length >= 2 && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-700" title={`Manages ${getFarmerFarms(farmer.id).length} farms`}>
                        <Layers className="w-3 h-3" />
                        {getFarmerFarms(farmer.id).length} Farms
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{farmer.id}</p>
                </div>
              </div>
              <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                Active
              </span>
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-2 text-sm">
                <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">{farmer.location}</span>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <Phone className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <span className="text-muted-foreground">{farmer.contactNumber}</span>
              </div>

              {farmer.email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-muted-foreground truncate">{farmer.email}</span>
                </div>
              )}

              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <span className="text-muted-foreground">
                  Member since {formatDate(farmer.cardMemberSince)}
                </span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-xs text-muted-foreground">Total Area</p>
                <p className="font-semibold">{Number.isFinite(farmer.totalLandArea) ? farmer.totalLandArea.toFixed(2) : '0.00'} ha</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Farms</p>
                <p className="font-semibold">{farmer.activeFarms}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Harvest</p>
                <p className="font-semibold">{Number.isFinite(farmer.totalHarvest) ? farmer.totalHarvest.toFixed(1) : '0.0'} MT</p>
              </div>
            </div>

            {farmer.crops && farmer.crops.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-1">
                {farmer.crops.map((crop, idx) => (
                  <span key={crop || idx} className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700">
                    {crop || 'Unknown'}
                  </span>
                ))}
              </div>
            )}

            <div className="flex gap-2 mt-4">
              <button
                onClick={() => {
                  setSelectedFarmer(farmer);
                  setIsQuickViewOpen(true);
                }}
                className="flex-1 py-2 px-4 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Eye className="w-4 h-4" />
                Quick View
              </button>
              <button
                onClick={(e) => handleEditClick(farmer, e)}
                className="py-2 px-4 border border-blue-600 text-blue-600 hover:bg-blue-50 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Edit className="w-4 h-4" />
              </button>
              <Link href={`/farmers/${farmer.id}`}>
                <button className="py-2 px-4 border border-green-600 text-green-600 hover:bg-green-50 rounded-lg text-sm font-medium transition-colors">
                  Profile
                </button>
              </Link>
            </div>
          </Card>
        ))}
      </div>
      )}

      {/* Pagination */}
      {filteredFarmers.length > 0 && totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          totalItems={filteredFarmers.length}
          itemsPerPage={itemsPerPage}
        />
      )}

      {filteredFarmers.length === 0 && (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">No farmers found matching your search criteria.</p>
        </Card>
      )}

      {/* Quick View Modal */}
      <FarmerQuickView
        farmer={selectedFarmer}
        isOpen={isQuickViewOpen}
        onClose={() => {
          setIsQuickViewOpen(false);
          setSelectedFarmer(null);
        }}
      />

      {/* Add Farmer Dialog */}
      <AddFarmerDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSuccess={handleRefresh}
      />

      {/* Edit Farmer Dialog */}
      <EditFarmerDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        farmer={editingFarmer}
        onSuccess={handleRefresh}
      />
    </div>
  );
}

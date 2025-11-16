import { useState } from 'react';
import { Link } from 'wouter';
import { Search, MapPin, Phone, Mail, Calendar, Eye } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { farmersData, type Farmer } from '@/data/farmersData';

export default function Farmers() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBarangay, setSelectedBarangay] = useState<string>('all');

  const barangays = ['all', ...Array.from(new Set(farmersData.map(f => f.barangay)))];

  const filteredFarmers = farmersData.filter(farmer => {
    const matchesSearch = farmer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         farmer.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesBarangay = selectedBarangay === 'all' || farmer.barangay === selectedBarangay;
    return matchesSearch && matchesBarangay;
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Farmers</h1>
        <p className="text-muted-foreground mt-1">Manage and monitor farmer information</p>
      </div>

      {/* Filters */}
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

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Total Farmers</p>
          <p className="text-2xl font-bold mt-1">{filteredFarmers.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Total Land Area</p>
          <p className="text-2xl font-bold mt-1">
            {filteredFarmers.reduce((sum, f) => sum + f.totalLandArea, 0).toFixed(1)} ha
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Total Harvest</p>
          <p className="text-2xl font-bold mt-1">
            {filteredFarmers.reduce((sum, f) => sum + f.totalHarvest, 0).toFixed(1)} MT
          </p>
        </Card>
      </div>

      {/* Farmers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredFarmers.map((farmer) => (
          <Card key={farmer.id} className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                  <span className="text-lg font-bold text-green-600">
                    {farmer.name.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold">{farmer.name}</h3>
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
                <p className="text-xs text-muted-foreground">Land Area</p>
                <p className="font-semibold">{farmer.totalLandArea} ha</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Farms</p>
                <p className="font-semibold">{farmer.activeFarms}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Harvest</p>
                <p className="font-semibold">{farmer.totalHarvest} MT</p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-1">
              {farmer.crops.map(crop => (
                <span key={crop} className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700">
                  {crop}
                </span>
              ))}
            </div>

            <Link href={`/farmers/${farmer.id}`}>
              <button className="w-full mt-4 py-2 px-4 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2">
                <Eye className="w-4 h-4" />
                View Profile
              </button>
            </Link>
          </Card>
        ))}
      </div>

      {filteredFarmers.length === 0 && (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">No farmers found matching your search criteria.</p>
        </Card>
      )}
    </div>
  );
}

import { useState } from 'react';
import { Search, Plus, Calendar, TrendingUp, DollarSign, BarChart3, Download } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { harvestData as initialHarvestData, getHarvestSummary, getHarvestByCrop, getHarvestByQuality, getTopFarmers } from '@/data/harvestData';
import HarvestEntryForm from '@/components/HarvestEntryForm';

export default function HarvestTracking() {
  const [harvestRecords, setHarvestRecords] = useState(initialHarvestData);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCrop, setSelectedCrop] = useState<string>('all');
  const [showEntryForm, setShowEntryForm] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'analytics'>('list');

  const crops = ['all', ...Array.from(new Set(harvestRecords.map(h => h.crop)))];

  const filteredRecords = harvestRecords.filter(record => {
    const matchesSearch = 
      record.farmerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.crop.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.farmLocation.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCrop = selectedCrop === 'all' || record.crop === selectedCrop;
    return matchesSearch && matchesCrop;
  });

  const summary = getHarvestSummary();
  const cropData = getHarvestByCrop();
  const qualityData = getHarvestByQuality();
  const topFarmers = getTopFarmers();

  const handleAddHarvest = (newRecord: any) => {
    setHarvestRecords([newRecord, ...harvestRecords]);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const exportToCSV = () => {
    const headers = ['Date', 'Farmer', 'Crop', 'Quantity', 'Unit', 'Quality', 'Price/Unit', 'Total Value', 'Yield/ha'];
    const rows = filteredRecords.map(r => [
      r.harvestDate,
      r.farmerName,
      r.crop,
      r.quantity,
      r.unit,
      r.qualityGrade,
      r.pricePerUnit,
      r.totalValue,
      r.yieldPerHectare.toFixed(2),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `harvest-records-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Harvest Tracking</h1>
          <p className="text-muted-foreground mt-1">Record and analyze harvest data</p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => setViewMode(viewMode === 'list' ? 'analytics' : 'list')}
          >
            {viewMode === 'list' ? (
              <>
                <BarChart3 className="w-4 h-4 mr-2" />
                Analytics
              </>
            ) : (
              <>
                <Calendar className="w-4 h-4 mr-2" />
                Records
              </>
            )}
          </Button>
          <Button
            onClick={() => setShowEntryForm(true)}
            className="bg-green-600 hover:bg-green-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Harvest
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Harvest</p>
              <p className="text-2xl font-bold">{summary.totalQuantity} MT</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Value</p>
              <p className="text-2xl font-bold">{summary.totalValue}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Records</p>
              <p className="text-2xl font-bold">{summary.totalRecords}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Avg Yield</p>
              <p className="text-2xl font-bold">{summary.avgYield} kg/ha</p>
            </div>
          </div>
        </Card>
      </div>

      {viewMode === 'list' ? (
        <>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search by farmer, crop, or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={selectedCrop}
              onChange={(e) => setSelectedCrop(e.target.value)}
              className="px-4 py-2 border rounded-md bg-background"
            >
              <option value="all">All Crops</option>
              {crops.slice(1).map(crop => (
                <option key={crop} value={crop}>{crop}</option>
              ))}
            </select>
            <Button variant="outline" onClick={exportToCSV}>
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>

          {/* Harvest Records Table */}
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Farmer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Crop
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quality
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Value
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Yield/ha
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredRecords.map((record) => (
                    <tr key={record.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {formatDate(record.harvestDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <p className="text-sm font-medium">{record.farmerName}</p>
                          <p className="text-xs text-gray-500">{record.farmLocation}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                          {record.crop}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {record.quantity.toLocaleString()} {record.unit}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          record.qualityGrade === 'Premium' ? 'bg-purple-100 text-purple-800' :
                          record.qualityGrade === 'Grade A' ? 'bg-blue-100 text-blue-800' :
                          record.qualityGrade === 'Grade B' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {record.qualityGrade}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        ₱{record.totalValue.toLocaleString('en-PH')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {record.yieldPerHectare.toFixed(2)} {record.unit}/ha
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredRecords.length === 0 && (
              <div className="p-12 text-center">
                <p className="text-muted-foreground">No harvest records found matching your criteria.</p>
              </div>
            )}
          </Card>
        </>
      ) : (
        /* Analytics View */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Harvest by Crop */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Harvest by Crop</h3>
            <div className="space-y-4">
              {cropData.map(crop => (
                <div key={crop.crop}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">{crop.crop}</span>
                    <span className="text-sm text-muted-foreground">{crop.quantity} MT</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full"
                      style={{ width: `${(parseFloat(crop.quantity) / parseFloat(summary.totalQuantity)) * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    ₱{crop.value.toLocaleString('en-PH')} • {crop.count} records
                  </p>
                </div>
              ))}
            </div>
          </Card>

          {/* Quality Distribution */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Quality Distribution</h3>
            <div className="space-y-4">
              {qualityData.map(quality => (
                <div key={quality.grade}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">{quality.grade}</span>
                    <span className="text-sm text-muted-foreground">{quality.percentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        quality.grade === 'Premium' ? 'bg-purple-600' :
                        quality.grade === 'Grade A' ? 'bg-blue-600' :
                        quality.grade === 'Grade B' ? 'bg-yellow-600' :
                        'bg-gray-600'
                      }`}
                      style={{ width: `${quality.percentage}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{quality.count} records</p>
                </div>
              ))}
            </div>
          </Card>

          {/* Top Farmers */}
          <Card className="p-6 lg:col-span-2">
            <h3 className="text-lg font-semibold mb-4">Top Performing Farmers</h3>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {topFarmers.map((farmer, index) => (
                <div key={farmer.id} className="text-center p-4 border rounded-lg">
                  <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-2">
                    <span className="text-lg font-bold text-green-600">#{index + 1}</span>
                  </div>
                  <p className="font-medium text-sm">{farmer.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">{farmer.totalQuantity} MT</p>
                  <p className="text-sm font-semibold text-green-600 mt-1">
                    ₱{(farmer.totalValue / 1000).toFixed(0)}K
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Harvest Entry Form Modal */}
      {showEntryForm && (
        <HarvestEntryForm
          onClose={() => setShowEntryForm(false)}
          onSubmit={handleAddHarvest}
        />
      )}
    </div>
  );
}

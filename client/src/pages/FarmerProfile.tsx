import { useState } from 'react';
import { useRoute, Link } from 'wouter';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, 
  MapPin, 
  Phone, 
  Mail, 
  TrendingUp, 
  Award,
  Calendar,
  DollarSign,
  BarChart3
} from 'lucide-react';
import { farmersData } from '@/data/farmersData';
import { harvestData } from '@/data/harvestData';
import FarmerHistory from '@/components/FarmerHistory';

export default function FarmerProfile() {
  const [, params] = useRoute('/farmers/:id');
  const farmerId = params?.id;
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'analytics' | 'activity'>('overview');

  const farmer = farmersData.find(f => f.id === farmerId);
  const farmerHarvests = harvestData.filter(h => h.farmerId === farmerId);

  if (!farmer) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-lg font-medium">Farmer not found</p>
          <Link href="/farmers">
            <Button variant="outline" className="mt-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Farmers
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Calculate farmer statistics
  const totalHarvests = farmerHarvests.length;
  const totalEarnings = farmerHarvests.reduce((sum, h) => sum + h.totalValue, 0);
  const totalQuantity = farmerHarvests.reduce((sum, h) => sum + h.quantity, 0);
  const avgYield = farmerHarvests.length > 0
    ? farmerHarvests.reduce((sum, h) => sum + h.yieldPerHectare, 0) / farmerHarvests.length
    : 0;

  // Harvest by crop
  const harvestByCrop: { [key: string]: { quantity: number; value: number; count: number } } = {};
  farmerHarvests.forEach(h => {
    if (!harvestByCrop[h.crop]) {
      harvestByCrop[h.crop] = { quantity: 0, value: 0, count: 0 };
    }
    harvestByCrop[h.crop].quantity += h.quantity;
    harvestByCrop[h.crop].value += h.totalValue;
    harvestByCrop[h.crop].count += 1;
  });

  // Quality distribution
  const qualityDist: { [key: string]: number } = {};
  farmerHarvests.forEach(h => {
    qualityDist[h.qualityGrade] = (qualityDist[h.qualityGrade] || 0) + 1;
  });

  // Best performing crop
  const bestCrop = Object.entries(harvestByCrop)
    .sort((a, b) => b[1].value - a[1].value)[0];

  // Calculate ranking (simplified - based on total earnings)
  const allFarmerEarnings = farmersData.map(f => ({
    id: f.id,
    earnings: harvestData.filter(h => h.farmerId === f.id).reduce((sum, h) => sum + h.totalValue, 0)
  })).sort((a, b) => b.earnings - a.earnings);
  
  const farmerRank = allFarmerEarnings.findIndex(f => f.id === farmerId) + 1;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/farmers" className="hover:text-foreground transition-colors">
          Farmers
        </Link>
        <span>/</span>
        <span className="text-foreground font-medium">{farmer.name}</span>
      </div>

      {/* Back Button */}
      <Link href="/farmers">
        <Button variant="outline" size="sm">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Farmers
        </Button>
      </Link>

      {/* Profile Header */}
      <Card className="p-6">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Profile Photo */}
          <div className="flex-shrink-0">
            <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center">
              <span className="text-3xl font-bold text-green-600">
                {farmer.name.split(' ').map(n => n[0]).join('')}
              </span>
            </div>
          </div>

          {/* Basic Info */}
          <div className="flex-1">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold">{farmer.name}</h1>
                <p className="text-muted-foreground">Farmer ID: {farmer.id}</p>
              </div>
              {farmerRank <= 5 && (
                <div className="flex items-center gap-2 px-3 py-1 bg-yellow-100 rounded-full">
                  <Award className="w-4 h-4 text-yellow-600" />
                  <span className="text-sm font-medium text-yellow-600">
                    Top {farmerRank} Farmer
                  </span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <span>{farmer.location}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <span>{farmer.contactNumber}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <span>{farmer.id.toLowerCase()}@farmer.magsasa.ph</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <TrendingUp className="w-4 h-4 text-muted-foreground" />
                <span>Total Land: {farmer.totalLandArea} hectares</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Harvests</p>
              <p className="text-2xl font-bold">{totalHarvests}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Earnings</p>
              <p className="text-2xl font-bold">
                ₱{(totalEarnings / 1000).toFixed(0)}K
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Avg Yield</p>
              <p className="text-2xl font-bold">{avgYield.toFixed(0)} kg/ha</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
              <Award className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Ranking</p>
              <p className="text-2xl font-bold">#{farmerRank}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="border-b">
        <div className="flex gap-6">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-3 px-1 border-b-2 transition-colors ${
              activeTab === 'overview'
                ? 'border-green-600 text-green-600 font-medium'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`pb-3 px-1 border-b-2 transition-colors ${
              activeTab === 'history'
                ? 'border-green-600 text-green-600 font-medium'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Harvest History
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`pb-3 px-1 border-b-2 transition-colors ${
              activeTab === 'analytics'
                ? 'border-green-600 text-green-600 font-medium'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Analytics
          </button>
          <button
            onClick={() => setActiveTab('activity')}
            className={`pb-3 px-1 border-b-2 transition-colors ${
              activeTab === 'activity'
                ? 'border-green-600 text-green-600 font-medium'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Activity History
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Best Performing Crop */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Best Performing Crop</h3>
            {bestCrop ? (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl font-bold">{bestCrop[0]}</span>
                  <span className="text-sm text-muted-foreground">
                    {bestCrop[1].count} harvests
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Quantity</span>
                    <span className="font-medium">
                      {(bestCrop[1].quantity / 1000).toFixed(1)} MT
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Value</span>
                    <span className="font-medium text-green-600">
                      ₱{bestCrop[1].value.toLocaleString('en-PH')}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">No harvest data available</p>
            )}
          </Card>

          {/* Recent Activity */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Recent Harvests</h3>
            <div className="space-y-3">
              {farmerHarvests.slice(0, 3).map(harvest => (
                <div key={harvest.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{harvest.crop}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(harvest.harvestDate)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{harvest.quantity.toLocaleString()} {harvest.unit}</p>
                    <p className="text-xs text-green-600">
                      ₱{harvest.totalValue.toLocaleString('en-PH')}
                    </p>
                  </div>
                </div>
              ))}
              {farmerHarvests.length === 0 && (
                <p className="text-sm text-muted-foreground">No recent harvests</p>
              )}
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'history' && (
        <Card className="overflow-hidden">
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">Complete Harvest History</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Crop</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quality</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Value</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Yield/ha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {farmerHarvests.map(harvest => (
                  <tr key={harvest.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {formatDate(harvest.harvestDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                        {harvest.crop}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {harvest.quantity.toLocaleString()} {harvest.unit}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        harvest.qualityGrade === 'Premium' ? 'bg-purple-100 text-purple-800' :
                        harvest.qualityGrade === 'Grade A' ? 'bg-blue-100 text-blue-800' :
                        harvest.qualityGrade === 'Grade B' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {harvest.qualityGrade}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      ₱{harvest.totalValue.toLocaleString('en-PH')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {harvest.yieldPerHectare.toFixed(2)} {harvest.unit}/ha
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {farmerHarvests.length === 0 && (
            <div className="p-12 text-center">
              <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No harvest records found for this farmer.</p>
            </div>
          )}
        </Card>
      )}

      {activeTab === 'analytics' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Harvest by Crop */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Harvest by Crop</h3>
            <div className="space-y-4">
              {Object.entries(harvestByCrop).map(([crop, data]) => (
                <div key={crop}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">{crop}</span>
                    <span className="text-sm text-muted-foreground">
                      {(data.quantity / 1000).toFixed(1)} MT
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full"
                      style={{
                        width: `${(data.quantity / totalQuantity) * 100}%`
                      }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    ₱{data.value.toLocaleString('en-PH')} • {data.count} harvests
                  </p>
                </div>
              ))}
            </div>
          </Card>

          {/* Quality Distribution */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Quality Distribution</h3>
            <div className="space-y-4">
              {Object.entries(qualityDist).map(([grade, count]) => (
                <div key={grade}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">{grade}</span>
                    <span className="text-sm text-muted-foreground">
                      {((count / totalHarvests) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        grade === 'Premium' ? 'bg-purple-600' :
                        grade === 'Grade A' ? 'bg-blue-600' :
                        grade === 'Grade B' ? 'bg-yellow-600' :
                        'bg-gray-600'
                      }`}
                      style={{
                        width: `${(count / totalHarvests) * 100}%`
                      }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{count} harvests</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'activity' && (
        <FarmerHistory farmerId={farmerId || ''} />
      )}
    </div>
  );
}

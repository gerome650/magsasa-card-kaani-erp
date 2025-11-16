import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { farmersData, getDashboardStats } from "@/data/farmersData";
import { harvestData } from "@/data/harvestData";
import { useAuth } from "@/contexts/AuthContext";
import { Users, TrendingUp, DollarSign, Award, CheckCircle, Clock, XCircle } from "lucide-react";

export default function ManagerDashboard() {
  const { user } = useAuth();
  
  // Get system-wide statistics
  const stats = getDashboardStats();
  
  // Calculate harvest metrics
  const totalHarvest = harvestData.reduce((sum: number, h: any) => sum + h.quantity, 0);
  const totalRevenue = harvestData.reduce((sum: number, h: any) => sum + h.estimatedValue, 0);
  
  // Quality distribution
  const qualityDistribution = harvestData.reduce((acc: Record<string, number>, h: any) => {
    acc[h.quality] = (acc[h.quality] || 0) + 1;
    return acc;
  }, {});
  
  // Crop distribution
  const cropDistribution = harvestData.reduce((acc: Record<string, number>, h: any) => {
    acc[h.crop] = (acc[h.crop] || 0) + h.quantity;
    return acc;
  }, {});
  
  // Top performing farmers
  const farmerPerformance = farmersData.map((f: any) => {
    const farmerHarvests = harvestData.filter((h: any) => h.farmerId === f.id);
    const totalHarvest = farmerHarvests.reduce((sum: number, h: any) => sum + h.quantity, 0);
    const totalValue = farmerHarvests.reduce((sum: number, h: any) => sum + h.estimatedValue, 0);
    return {
      ...f,
      totalHarvest,
      totalValue,
      harvestCount: farmerHarvests.length
    };
  }).sort((a, b) => b.totalValue - a.totalValue).slice(0, 10);
  
  // Loan approvals (mock data)
  const loanApplications = [
    { id: 1, farmer: "Maria Santos", amount: 50000, purpose: "Seeds & Fertilizer", status: "pending", date: "2024-10-15", agScore: 850 },
    { id: 2, farmer: "Juan Dela Cruz", amount: 75000, purpose: "Equipment Purchase", status: "pending", date: "2024-10-14", agScore: 720 },
    { id: 3, farmer: "Pedro Garcia", amount: 30000, purpose: "Irrigation System", status: "approved", date: "2024-10-13", agScore: 680 },
    { id: 4, farmer: "Rosa Reyes", amount: 100000, purpose: "Land Expansion", status: "pending", date: "2024-10-12", agScore: 920 },
    { id: 5, farmer: "Carlos Ramos", amount: 45000, purpose: "Pest Control", status: "rejected", date: "2024-10-11", agScore: 380 },
  ];
  
  const pendingLoans = loanApplications.filter(l => l.status === 'pending');
  const approvedLoans = loanApplications.filter(l => l.status === 'approved');
  const rejectedLoans = loanApplications.filter(l => l.status === 'rejected');
  
  // AgScore distribution (mock calculation)
  const agScoreRanges = {
    excellent: farmersData.filter((f: any) => {
      const score = Math.random() * 1000; // Mock score
      return score >= 800;
    }).length,
    good: farmersData.filter((f: any) => {
      const score = Math.random() * 1000;
      return score >= 600 && score < 800;
    }).length,
    moderate: farmersData.filter((f: any) => {
      const score = Math.random() * 1000;
      return score >= 400 && score < 600;
    }).length,
    needsSupport: farmersData.filter((f: any) => {
      const score = Math.random() * 1000;
      return score < 400;
    }).length,
  };

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-800 rounded-lg p-6 text-white">
        <h1 className="text-3xl font-bold mb-2">Manager Dashboard</h1>
        <p className="text-purple-50">Welcome, {user?.name}! System-wide overview and approvals</p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Farmers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalFarmers}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeFarms} active farms
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Harvest</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalHarvest} MT</div>
            <p className="text-xs text-muted-foreground">
              +15% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₱{(stats.totalRevenue / 1000000).toFixed(2)}M</div>
            <p className="text-xs text-muted-foreground">
              +22% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingLoans.length}</div>
            <p className="text-xs text-muted-foreground">
              Loan applications
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Loan Approval Queue */}
      <Card>
        <CardHeader>
          <CardTitle>Loan Approval Queue</CardTitle>
          <CardDescription>Applications requiring manager approval</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {loanApplications.map((loan) => (
              <div key={loan.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className={`h-12 w-12 rounded-full flex items-center justify-center ${
                    loan.status === 'pending' ? 'bg-orange-100' : 
                    loan.status === 'approved' ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                    {loan.status === 'pending' ? <Clock className="h-6 w-6 text-orange-600" /> :
                     loan.status === 'approved' ? <CheckCircle className="h-6 w-6 text-green-600" /> :
                     <XCircle className="h-6 w-6 text-red-600" />}
                  </div>
                  <div>
                    <p className="font-medium">{loan.farmer}</p>
                    <p className="text-sm text-muted-foreground">{loan.purpose}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      AgScore: <span className={`font-semibold ${
                        loan.agScore >= 800 ? 'text-green-600' :
                        loan.agScore >= 600 ? 'text-blue-600' :
                        loan.agScore >= 400 ? 'text-orange-600' : 'text-red-600'
                      }`}>{loan.agScore}</span>
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold">₱{loan.amount.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">{new Date(loan.date).toLocaleDateString()}</p>
                  <span className={`text-xs px-2 py-1 rounded-full mt-1 inline-block ${
                    loan.status === 'pending' ? 'bg-orange-100 text-orange-700' :
                    loan.status === 'approved' ? 'bg-green-100 text-green-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {loan.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* AgScore Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>AgScore™ Distribution</CardTitle>
          <CardDescription>Farmer performance across 1000-point scale</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">🌟 Excellent (800-1000)</span>
                <span className="text-sm text-muted-foreground">{agScoreRanges.excellent} farmers</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-green-500 h-3 rounded-full"
                  style={{ width: `${(agScoreRanges.excellent / stats.totalFarmers) * 100}%` }}
                />
              </div>
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">✓ Good (600-799)</span>
                <span className="text-sm text-muted-foreground">{agScoreRanges.good} farmers</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-blue-500 h-3 rounded-full"
                  style={{ width: `${(agScoreRanges.good / stats.totalFarmers) * 100}%` }}
                />
              </div>
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">⚠ Moderate (400-599)</span>
                <span className="text-sm text-muted-foreground">{agScoreRanges.moderate} farmers</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-orange-500 h-3 rounded-full"
                  style={{ width: `${(agScoreRanges.moderate / stats.totalFarmers) * 100}%` }}
                />
              </div>
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">⚠ Needs Support (&lt;400)</span>
                <span className="text-sm text-muted-foreground">{agScoreRanges.needsSupport} farmers</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-red-500 h-3 rounded-full"
                  style={{ width: `${(agScoreRanges.needsSupport / stats.totalFarmers) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Performing Farmers */}
      <Card>
        <CardHeader>
          <CardTitle>Top 10 Performing Farmers</CardTitle>
          <CardDescription>Ranked by total harvest value</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {farmerPerformance.map((farmer: any, index: number) => (
              <div key={farmer.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                    index < 3 ? 'bg-yellow-100' : 'bg-gray-100'
                  }`}>
                    <span className="font-bold text-lg">
                      {index < 3 ? '🏆' : `#${index + 1}`}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium">{farmer.name}</p>
                    <p className="text-sm text-muted-foreground">{farmer.barangay}, {farmer.municipality}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold">₱{(farmer.totalValue / 1000).toFixed(1)}K</p>
                  <p className="text-xs text-muted-foreground">{farmer.totalHarvest.toFixed(1)} MT • {farmer.harvestCount} harvests</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Crop Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>System-Wide Crop Distribution</CardTitle>
          <CardDescription>Total harvest by crop type</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(cropDistribution).map(([crop, quantity]) => {
              const percentage = ((quantity as number) / totalHarvest) * 100;
              return (
                <div key={crop}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">{crop}</span>
                    <span className="text-sm text-muted-foreground">{(quantity as number).toFixed(1)} MT ({percentage.toFixed(1)}%)</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-[#00C805] h-2 rounded-full"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Manager Actions</CardTitle>
          <CardDescription>System management and oversight</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="p-4 border rounded-lg hover:bg-gray-50 text-left transition-colors">
              <p className="font-medium">✓ Approve Loans</p>
              <p className="text-sm text-muted-foreground mt-1">Review {pendingLoans.length} pending applications</p>
            </button>
            <button className="p-4 border rounded-lg hover:bg-gray-50 text-left transition-colors">
              <p className="font-medium">📊 System Reports</p>
              <p className="text-sm text-muted-foreground mt-1">Generate comprehensive analytics</p>
            </button>
            <button className="p-4 border rounded-lg hover:bg-gray-50 text-left transition-colors">
              <p className="font-medium">👥 Manage Users</p>
              <p className="text-sm text-muted-foreground mt-1">Field officers and farmer accounts</p>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

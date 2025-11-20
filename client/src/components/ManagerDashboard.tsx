import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { farmersData } from "@/data/farmersData";
import { harvestData } from "@/data/harvestData";
import { useAuth } from "@/contexts/AuthContext";
import { Users, TrendingUp, DollarSign, Award, CheckCircle, Clock, XCircle, Loader2 } from "lucide-react";
import { agScoreData, getAgScoreByFarmerId, getAgScoreDistribution } from "@/data/agScoreData";
import AgScoreBadge from "@/components/AgScoreBadge";
import { trpc } from "@/lib/trpc";

export default function ManagerDashboard() {
  const { user } = useAuth();
  
  // Get system-wide statistics from database
  const { data: farmerCount, isLoading: isLoadingFarmerCount } = trpc.farmers.count.useQuery();
  const { data: allFarmers, isLoading: isLoadingFarmers } = trpc.farmers.list.useQuery();
  
  // Calculate stats from database data
  const stats = {
    totalFarmers: farmerCount || 0,
    activeFarms: allFarmers?.reduce((sum, f) => sum + (f.farmCount || 0), 0) || 0,
    totalHarvest: allFarmers?.reduce((sum, f) => sum + (f.totalHarvest || 0), 0) || 0,
    totalRevenue: (allFarmers?.reduce((sum, f) => sum + (f.totalHarvest || 0), 0) || 0) * 25000, // Average ₱25,000 per MT
  };
  
  // Calculate harvest metrics
  const totalHarvest = harvestData.reduce((sum: number, h: any) => sum + h.quantity, 0);
  const totalRevenue = harvestData.reduce((sum: number, h: any) => sum + h.totalValue, 0);
  
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
    const totalValue = farmerHarvests.reduce((sum: number, h: any) => sum + h.totalValue, 0);
    return {
      ...f,
      totalHarvest,
      totalValue,
      harvestCount: farmerHarvests.length
    };
  }).sort((a, b) => b.totalValue - a.totalValue).slice(0, 10);
  
  // Loan approvals state (with real AgScore™)
  const initialLoans = [
    { id: 1, farmerId: "F001", farmer: "Maria Santos", amount: 50000, purpose: "Seeds & Fertilizer", status: "pending", date: "2024-10-15" },
    { id: 2, farmerId: "F002", farmer: "Juan Dela Cruz", amount: 75000, purpose: "Equipment Purchase", status: "pending", date: "2024-10-14" },
    { id: 3, farmerId: "F004", farmer: "Pedro Garcia", amount: 30000, purpose: "Irrigation System", status: "approved", date: "2024-10-13" },
    { id: 4, farmerId: "F003", farmer: "Rosa Reyes", amount: 100000, purpose: "Land Expansion", status: "pending", date: "2024-10-12" },
    { id: 5, farmerId: "F008", farmer: "Carlos Ramos", amount: 45000, purpose: "Pest Control", status: "rejected", date: "2024-10-11" },
    { id: 6, farmerId: "F015", farmer: "Roberto Villanueva", amount: 60000, purpose: "Rice Planting", status: "pending", date: "2024-10-10" },
    { id: 7, farmerId: "F042", farmer: "Elena Martinez", amount: 35000, purpose: "Corn Seeds", status: "pending", date: "2024-10-09" },
  ].map(loan => {
    const agScore = getAgScoreByFarmerId(loan.farmerId);
    return { ...loan, agScore };
  });
  
  const [loans, setLoans] = useState(initialLoans);
  const [processingLoanId, setProcessingLoanId] = useState<number | null>(null);
  
  // Loan action handlers
  const handleApproveLoan = (loanId: number) => {
    setProcessingLoanId(loanId);
    
    // Simulate API call delay
    setTimeout(() => {
      setLoans(prevLoans => 
        prevLoans.map(loan => 
          loan.id === loanId 
            ? { ...loan, status: 'approved' as const }
            : loan
        )
      );
      
      const loan = loans.find(l => l.id === loanId);
      toast.success(`Loan approved for ${loan?.farmer}`, {
        description: `₱${loan?.amount.toLocaleString()} for ${loan?.purpose}`
      });
      
      setProcessingLoanId(null);
    }, 500);
  };
  
  const handleRejectLoan = (loanId: number) => {
    setProcessingLoanId(loanId);
    
    // Simulate API call delay
    setTimeout(() => {
      setLoans(prevLoans => 
        prevLoans.map(loan => 
          loan.id === loanId 
            ? { ...loan, status: 'rejected' as const }
            : loan
        )
      );
      
      const loan = loans.find(l => l.id === loanId);
      toast.error(`Loan rejected for ${loan?.farmer}`, {
        description: `₱${loan?.amount.toLocaleString()} for ${loan?.purpose}`
      });
      
      setProcessingLoanId(null);
    }, 500);
  };
  
  const loanApplications = loans;
  
  const pendingLoans = loanApplications.filter(l => l.status === 'pending');
  const approvedLoans = loanApplications.filter(l => l.status === 'approved');
  const rejectedLoans = loanApplications.filter(l => l.status === 'rejected');
  
  // AgScore™ distribution (real data)
  const agScoreDistribution = getAgScoreDistribution();
  const totalFarmersWithScore = agScoreDistribution.reduce((sum, d) => sum + d.count, 0);
  
  // Create tier lookup for easy access
  const getTierCount = (tier: number) => {
    const tierData = agScoreDistribution.find(d => d.tier === tier);
    return tierData ? tierData.count : 0;
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
            {isLoadingFarmerCount || isLoadingFarmers ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats.totalFarmers}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.activeFarms} active farms
                </p>
              </>
            )}
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
          <CardDescription>Applications requiring manager approval with AgScore™ risk assessment</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {loanApplications.map((loan) => {
              const agScoreData = loan.agScore;
              if (!agScoreData) return null;
              
              return (
                <div key={loan.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
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
                      <div className="mt-2">
                        <AgScoreBadge 
                          score={agScoreData.baselineScore}
                          tier={agScoreData.tier}
                          qualitativeTier={agScoreData.qualitativeTier}
                          size="sm"
                          showLabel={false}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
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
                    {loan.status === 'pending' && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-red-300 text-red-700 hover:bg-red-50"
                          onClick={() => handleRejectLoan(loan.id)}
                          disabled={processingLoanId === loan.id}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-white"
                          onClick={() => handleApproveLoan(loan.id)}
                          disabled={processingLoanId === loan.id}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* AgScore™ Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>AgScore™ Distribution by Tier</CardTitle>
          <CardDescription>Farmer performance across 7-tier classification (inverted scale: higher = better)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* Tier 7 - Very High Performance (850-1000) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium flex items-center gap-2">
                  <span className="inline-block w-3 h-3 rounded-full bg-green-600"></span>
                  Tier 7 - Very High Performance (850-1000)
                </span>
                <span className="text-sm text-muted-foreground">
                  {getTierCount(7)} farmers ({((getTierCount(7) / totalFarmersWithScore) * 100).toFixed(1)}%)
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-green-600 h-3 rounded-full transition-all"
                  style={{ width: `${(getTierCount(7) / totalFarmersWithScore) * 100}%` }}
                />
              </div>
            </div>
            
            {/* Tier 6 - High Performance (700-849) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium flex items-center gap-2">
                  <span className="inline-block w-3 h-3 rounded-full bg-blue-500"></span>
                  Tier 6 - High Performance (700-849)
                </span>
                <span className="text-sm text-muted-foreground">
                  {getTierCount(6)} farmers ({((getTierCount(6) / totalFarmersWithScore) * 100).toFixed(1)}%)
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-blue-500 h-3 rounded-full transition-all"
                  style={{ width: `${(getTierCount(6) / totalFarmersWithScore) * 100}%` }}
                />
              </div>
            </div>
            
            {/* Tier 5 - Moderately High Performance (550-699) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium flex items-center gap-2">
                  <span className="inline-block w-3 h-3 rounded-full bg-teal-500"></span>
                  Tier 5 - Moderately High (550-699)
                </span>
                <span className="text-sm text-muted-foreground">
                  {getTierCount(5)} farmers ({((getTierCount(5) / totalFarmersWithScore) * 100).toFixed(1)}%)
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-teal-500 h-3 rounded-full transition-all"
                  style={{ width: `${(getTierCount(5) / totalFarmersWithScore) * 100}%` }}
                />
              </div>
            </div>
            
            {/* Tier 4 - Moderate Performance (400-549) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium flex items-center gap-2">
                  <span className="inline-block w-3 h-3 rounded-full bg-yellow-500"></span>
                  Tier 4 - Moderate (400-549)
                </span>
                <span className="text-sm text-muted-foreground">
                  {getTierCount(4)} farmers ({((getTierCount(4) / totalFarmersWithScore) * 100).toFixed(1)}%)
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-yellow-500 h-3 rounded-full transition-all"
                  style={{ width: `${(getTierCount(4) / totalFarmersWithScore) * 100}%` }}
                />
              </div>
            </div>
            
            {/* Tier 3 - Moderately Low Performance (250-399) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium flex items-center gap-2">
                  <span className="inline-block w-3 h-3 rounded-full bg-orange-500"></span>
                  Tier 3 - Moderately Low (250-399)
                </span>
                <span className="text-sm text-muted-foreground">
                  {getTierCount(3)} farmers ({((getTierCount(3) / totalFarmersWithScore) * 100).toFixed(1)}%)
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-orange-500 h-3 rounded-full transition-all"
                  style={{ width: `${(getTierCount(3) / totalFarmersWithScore) * 100}%` }}
                />
              </div>
            </div>
            
            {/* Tier 2 - Low Performance (100-249) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium flex items-center gap-2">
                  <span className="inline-block w-3 h-3 rounded-full bg-red-500"></span>
                  Tier 2 - Low Performance (100-249)
                </span>
                <span className="text-sm text-muted-foreground">
                  {getTierCount(2)} farmers ({((getTierCount(2) / totalFarmersWithScore) * 100).toFixed(1)}%)
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-red-500 h-3 rounded-full transition-all"
                  style={{ width: `${(getTierCount(2) / totalFarmersWithScore) * 100}%` }}
                />
              </div>
            </div>
            
            {/* Tier 1 - Very Low Performance (0-99) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium flex items-center gap-2">
                  <span className="inline-block w-3 h-3 rounded-full bg-red-700"></span>
                  Tier 1 - Very Low Performance (0-99)
                </span>
                <span className="text-sm text-muted-foreground">
                  {getTierCount(1)} farmers ({((getTierCount(1) / totalFarmersWithScore) * 100).toFixed(1)}%)
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-red-700 h-3 rounded-full transition-all"
                  style={{ width: `${(getTierCount(1) / totalFarmersWithScore) * 100}%` }}
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

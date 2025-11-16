import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { farmersData } from "@/data/farmersData";
import { harvestData } from "@/data/harvestData";
import { useAuth } from "@/contexts/AuthContext";
import { Users, CheckCircle, AlertCircle, TrendingUp, MapPin, Phone } from "lucide-react";
import { useState } from "react";

export default function FieldOfficerDashboard() {
  const { user } = useAuth();
  const [selectedBarangay, setSelectedBarangay] = useState<string>("All");
  
  // For demo, Field Officer is assigned to specific barangays
  // In production, this would come from the user's profile
  const assignedBarangays = ["San Pedro", "Biñan", "Santa Rosa", "Cabuyao"];
  
  // Filter farmers assigned to this field officer
  const assignedFarmers = farmersData.filter((f: any) => 
    assignedBarangays.includes(f.municipality) || selectedBarangay === "All"
  );
  
  // Get harvests for assigned farmers
  const assignedHarvests = harvestData.filter((h: any) => 
    assignedFarmers.some((f: any) => f.id === h.farmerId)
  );
  
  // Calculate metrics
  const totalFarmers = assignedFarmers.length;
  const activeFarmers = assignedFarmers.filter((f: any) => f.status === 'active').length;
  const pendingVerifications = Math.floor(assignedHarvests.length * 0.15); // 15% pending
  const totalHarvest = assignedHarvests.reduce((sum: number, h: any) => sum + h.quantity, 0);
  
  // Recent farmers needing attention
  const recentFarmers = assignedFarmers.slice(0, 8);
  
  // Pending tasks
  const pendingTasks = [
    { id: 1, type: "Harvest Verification", farmer: "Maria Santos", location: "San Pedro", priority: "high", date: "2024-10-15" },
    { id: 2, type: "Farm Visit", farmer: "Juan Dela Cruz", location: "Biñan", priority: "medium", date: "2024-10-16" },
    { id: 3, type: "Document Review", farmer: "Pedro Garcia", location: "Santa Rosa", priority: "low", date: "2024-10-17" },
    { id: 4, type: "Harvest Verification", farmer: "Rosa Reyes", location: "Cabuyao", priority: "high", date: "2024-10-18" },
  ];
  
  // Barangay performance
  const barangayStats = assignedBarangays.map(barangay => {
    const farmers = farmersData.filter((f: any) => f.municipality === barangay);
    const harvests = harvestData.filter((h: any) => 
      farmers.some((f: any) => f.id === h.farmerId)
    );
    const totalHarvest = harvests.reduce((sum: number, h: any) => sum + h.quantity, 0);
    
    return {
      barangay,
      farmers: farmers.length,
      totalHarvest: totalHarvest.toFixed(1),
      avgYield: farmers.length > 0 ? (totalHarvest / farmers.length).toFixed(1) : "0"
    };
  });

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg p-6 text-white">
        <h1 className="text-3xl font-bold mb-2">Field Officer Dashboard</h1>
        <p className="text-blue-50">Welcome, {user?.name}! Manage your assigned farmers and tasks</p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assigned Farmers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalFarmers}</div>
            <p className="text-xs text-muted-foreground">
              {activeFarmers} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Verifications</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingVerifications}</div>
            <p className="text-xs text-muted-foreground">
              Harvest records to verify
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Harvest</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalHarvest.toFixed(1)} MT</div>
            <p className="text-xs text-muted-foreground">
              From assigned farmers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Tasks</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24</div>
            <p className="text-xs text-muted-foreground">
              This month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Pending Tasks */}
      <Card>
        <CardHeader>
          <CardTitle>Pending Tasks</CardTitle>
          <CardDescription>Tasks requiring your attention</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {pendingTasks.map((task) => (
              <div key={task.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                <div className="flex items-center gap-4">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                    task.priority === 'high' ? 'bg-red-100' : task.priority === 'medium' ? 'bg-orange-100' : 'bg-blue-100'
                  }`}>
                    <AlertCircle className={`h-5 w-5 ${
                      task.priority === 'high' ? 'text-red-600' : task.priority === 'medium' ? 'text-orange-600' : 'text-blue-600'
                    }`} />
                  </div>
                  <div>
                    <p className="font-medium">{task.type}</p>
                    <p className="text-sm text-muted-foreground">{task.farmer} • {task.location}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{new Date(task.date).toLocaleDateString()}</p>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    task.priority === 'high' ? 'bg-red-100 text-red-700' : 
                    task.priority === 'medium' ? 'bg-orange-100 text-orange-700' : 
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {task.priority}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Barangay Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Barangay Performance</CardTitle>
          <CardDescription>Overview of assigned areas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {barangayStats.map((stat) => (
              <div key={stat.barangay} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{stat.barangay}</p>
                    <p className="text-sm text-muted-foreground">{stat.farmers} farmers</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{stat.totalHarvest} MT</p>
                  <p className="text-sm text-muted-foreground">{stat.avgYield} MT/farmer</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Assigned Farmers Quick View */}
      <Card>
        <CardHeader>
          <CardTitle>Assigned Farmers</CardTitle>
          <CardDescription>Quick overview of farmers in your area</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recentFarmers.map((farmer: any) => (
              <div key={farmer.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center">
                    <span className="text-lg font-semibold text-emerald-700">
                      {farmer.name.split(' ').map((n: string) => n[0]).join('')}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium">{farmer.name}</p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {farmer.barangay}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{farmer.totalLandArea} ha</p>
                  <p className="text-xs text-muted-foreground">{farmer.activeFarms} farms</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common field officer tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="p-4 border rounded-lg hover:bg-gray-50 text-left transition-colors">
              <p className="font-medium">✓ Verify Harvest</p>
              <p className="text-sm text-muted-foreground mt-1">Review and approve harvest records</p>
            </button>
            <button className="p-4 border rounded-lg hover:bg-gray-50 text-left transition-colors">
              <p className="font-medium">📋 Schedule Visit</p>
              <p className="text-sm text-muted-foreground mt-1">Plan farmer field visits</p>
            </button>
            <button className="p-4 border rounded-lg hover:bg-gray-50 text-left transition-colors">
              <p className="font-medium">📊 Generate Report</p>
              <p className="text-sm text-muted-foreground mt-1">Create area performance report</p>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

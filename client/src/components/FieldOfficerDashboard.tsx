import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { farmersData } from "@/data/farmersData";
import { harvestData } from "@/data/harvestData";
import { useAuth } from "@/contexts/AuthContext";
import { Users, CheckCircle, AlertCircle, TrendingUp, MapPin, Phone, Plus, Filter, Check, X, Edit, Trash2 } from "lucide-react";
import { useState } from "react";
import FarmerQuickView from "@/components/FarmerQuickView";
import AddTaskDialog from "@/components/AddTaskDialog";
import HarvestReviewDialog from "@/components/HarvestReviewDialog";
import { HarvestRecord } from "@/data/harvestData";
import { toast } from "sonner";

interface Task {
  id: number;
  type: string;
  farmer: string;
  location: string;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'in-progress' | 'completed';
  date: string;
  description?: string;
}

export default function FieldOfficerDashboard() {
  const { user } = useAuth();
  const [selectedBarangay, setSelectedBarangay] = useState<string>("All");
  const [selectedFarmer, setSelectedFarmer] = useState<any>(null);
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);
  
  // Task management state
  const [tasks, setTasks] = useState<Task[]>([
    { id: 1, type: "Harvest Verification", farmer: "Maria Santos", location: "San Pedro", priority: "high", status: "pending", date: "2024-10-15", description: "Verify rice harvest records" },
    { id: 2, type: "Farm Visit", farmer: "Juan Dela Cruz", location: "Biñan", priority: "medium", status: "in-progress", date: "2024-10-16", description: "Conduct quarterly farm inspection" },
    { id: 3, type: "Document Review", farmer: "Pedro Garcia", location: "Santa Rosa", priority: "low", status: "pending", date: "2024-10-17", description: "Review land title documents" },
    { id: 4, type: "Harvest Verification", farmer: "Rosa Reyes", location: "Cabuyao", priority: "high", status: "pending", date: "2024-10-18", description: "Verify corn harvest quantity" },
  ]);
  const [taskFilter, setTaskFilter] = useState<'all' | 'pending' | 'in-progress' | 'completed'>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  
  // Harvest review state
  const [harvests, setHarvests] = useState<HarvestRecord[]>(harvestData);
  const [selectedHarvest, setSelectedHarvest] = useState<HarvestRecord | null>(null);
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  
  const handleFarmerClick = (farmer: any) => {
    setSelectedFarmer(farmer);
    setIsQuickViewOpen(true);
  };
  
  // For demo, Field Officer is assigned to specific barangays
  // In production, this would come from the user's profile
  const assignedBarangays = ["San Pedro", "Biñan", "Santa Rosa", "Cabuyao"];
  
  // Filter farmers assigned to this field officer
  const assignedFarmers = farmersData.filter((f: any) => 
    assignedBarangays.includes(f.municipality) || selectedBarangay === "All"
  );
  
  // Get harvests for assigned farmers
  const assignedHarvests = harvests.filter((h: any) => 
    assignedFarmers.some((f: any) => f.id === h.farmerId)
  );
  
  // Calculate metrics
  const totalFarmers = assignedFarmers.length;
  const activeFarmers = assignedFarmers.filter((f: any) => f.status === 'active').length;
  const pendingVerifications = Math.floor(assignedHarvests.length * 0.15); // 15% pending
  const totalHarvest = assignedHarvests.reduce((sum: number, h: any) => sum + h.quantity, 0);
  
  // Recent farmers needing attention
  const recentFarmers = assignedFarmers.slice(0, 8);
  
  // Filter tasks
  const filteredTasks = tasks.filter(task => {
    const matchesStatus = taskFilter === 'all' || task.status === taskFilter;
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
    return matchesStatus && matchesPriority;
  });
  
  // Task actions
  const handleCompleteTask = (taskId: number) => {
    setTasks(tasks.map(task => 
      task.id === taskId ? { ...task, status: 'completed' as const } : task
    ));
  };
  
  const handleDeleteTask = (taskId: number) => {
    setTasks(tasks.filter(task => task.id !== taskId));
  };
  
  const handleToggleTaskStatus = (taskId: number) => {
    setTasks(tasks.map(task => {
      if (task.id === taskId) {
        const newStatus = task.status === 'pending' ? 'in-progress' : 
                         task.status === 'in-progress' ? 'completed' : 'pending';
        return { ...task, status: newStatus as Task['status'] };
      }
      return task;
    }));
  };
  
  // Count tasks by status
  const taskCounts = {
    all: tasks.length,
    pending: tasks.filter(t => t.status === 'pending').length,
    inProgress: tasks.filter(t => t.status === 'in-progress').length,
    completed: tasks.filter(t => t.status === 'completed').length,
  };
  
  // Add new task
  const handleAddTask = (newTaskData: Omit<Task, 'id' | 'status'>) => {
    const newTask: Task = {
      ...newTaskData,
      id: Math.max(...tasks.map(t => t.id), 0) + 1,
      status: 'pending',
    };
    setTasks([...tasks, newTask]);
  };
  
  // Harvest review handlers
  const handleReviewHarvest = (harvest: HarvestRecord) => {
    setSelectedHarvest(harvest);
    setIsReviewDialogOpen(true);
  };
  
  const handleApproveHarvest = (harvestId: string, comment: string) => {
    setHarvests(harvests.map(h => 
      h.id === harvestId 
        ? { 
            ...h, 
            verificationStatus: 'approved' as const,
            approvedBy: user?.name || 'Field Officer',
            approvedAt: new Date().toISOString(),
            approvalComment: comment
          }
        : h
    ));
    toast.success('Harvest approved successfully!');
  };
  
  const handleRejectHarvest = (harvestId: string, reason: string) => {
    setHarvests(harvests.map(h => 
      h.id === harvestId 
        ? { 
            ...h, 
            verificationStatus: 'rejected' as const,
            approvedBy: user?.name || 'Field Officer',
            approvedAt: new Date().toISOString(),
            rejectionReason: reason
          }
        : h
    ));
    toast.error('Harvest rejected');
  };
  
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
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Task Management</CardTitle>
              <CardDescription>Manage your field officer tasks</CardDescription>
            </div>
            <Button onClick={() => setIsAddTaskOpen(true)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Task
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filter Controls */}
          <div className="flex flex-wrap gap-2 mb-4 pb-4 border-b">
            <div className="flex gap-2">
              <Badge 
                variant={taskFilter === 'all' ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => setTaskFilter('all')}
              >
                All ({taskCounts.all})
              </Badge>
              <Badge 
                variant={taskFilter === 'pending' ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => setTaskFilter('pending')}
              >
                Pending ({taskCounts.pending})
              </Badge>
              <Badge 
                variant={taskFilter === 'in-progress' ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => setTaskFilter('in-progress')}
              >
                In Progress ({taskCounts.inProgress})
              </Badge>
              <Badge 
                variant={taskFilter === 'completed' ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => setTaskFilter('completed')}
              >
                Completed ({taskCounts.completed})
              </Badge>
            </div>
            <div className="flex gap-2 ml-auto">
              <Badge 
                variant={priorityFilter === 'all' ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => setPriorityFilter('all')}
              >
                All Priority
              </Badge>
              <Badge 
                variant={priorityFilter === 'high' ? 'default' : 'outline'}
                className="cursor-pointer bg-red-100 text-red-700 hover:bg-red-200"
                onClick={() => setPriorityFilter('high')}
              >
                High
              </Badge>
              <Badge 
                variant={priorityFilter === 'medium' ? 'default' : 'outline'}
                className="cursor-pointer bg-orange-100 text-orange-700 hover:bg-orange-200"
                onClick={() => setPriorityFilter('medium')}
              >
                Medium
              </Badge>
              <Badge 
                variant={priorityFilter === 'low' ? 'default' : 'outline'}
                className="cursor-pointer bg-blue-100 text-blue-700 hover:bg-blue-200"
                onClick={() => setPriorityFilter('low')}
              >
                Low
              </Badge>
            </div>
          </div>

          {/* Task List */}
          <div className="space-y-3">
            {filteredTasks.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No tasks found matching the selected filters.</p>
              </div>
            ) : (
              filteredTasks.map((task: Task) => (
                <div key={task.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-all">
                <div className="flex items-center gap-4 flex-1">
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
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-sm font-medium">{new Date(task.date).toLocaleDateString()}</p>
                    <div className="flex gap-1 mt-1">
                      <Badge className={`text-xs ${
                        task.priority === 'high' ? 'bg-red-100 text-red-700' : 
                        task.priority === 'medium' ? 'bg-orange-100 text-orange-700' : 
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {task.priority}
                      </Badge>
                      <Badge className={`text-xs ${
                        task.status === 'completed' ? 'bg-green-100 text-green-700' : 
                        task.status === 'in-progress' ? 'bg-yellow-100 text-yellow-700' : 
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {task.status}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleToggleTaskStatus(task.id)}
                      className="h-8 w-8 p-0"
                      title={task.status === 'completed' ? 'Reopen task' : 'Mark as complete'}
                    >
                      {task.status === 'completed' ? (
                        <X className="h-4 w-4 text-gray-600" />
                      ) : (
                        <Check className="h-4 w-4 text-green-600" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteTask(task.id)}
                      className="h-8 w-8 p-0"
                      title="Delete task"
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Pending Harvests for Verification */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Pending Harvests</CardTitle>
              <CardDescription>Review and verify harvest submissions</CardDescription>
            </div>
            <Badge variant="secondary" className="bg-orange-100 text-orange-700">
              {assignedHarvests.filter((h: any) => h.verificationStatus === 'pending').length} Pending
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {assignedHarvests
              .filter((h: any) => h.verificationStatus === 'pending')
              .slice(0, 5)
              .map((harvest: any) => (
                <div key={harvest.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center">
                      <AlertCircle className="h-6 w-6 text-orange-600" />
                    </div>
                    <div>
                      <p className="font-medium">{harvest.farmerName}</p>
                      <p className="text-sm text-muted-foreground">
                        {harvest.crop} • {harvest.quantity.toLocaleString()} {harvest.unit}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(harvest.harvestDate).toLocaleDateString()}
                        {harvest.photos && harvest.photos.length > 0 && (
                          <span className="ml-2">📷 {harvest.photos.length} photos</span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">₱{(harvest.totalValue / 1000).toFixed(1)}K</p>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="mt-2"
                      onClick={() => handleReviewHarvest(harvest)}
                    >
                      Review
                    </Button>
                  </div>
                </div>
              ))}
            {assignedHarvests.filter((h: any) => h.verificationStatus === 'pending').length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
                <p>No pending harvests to verify</p>
              </div>
            )}
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
              <div 
                key={farmer.id} 
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-all hover:shadow-md"
                onClick={() => handleFarmerClick(farmer)}
              >
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
      
      {/* Farmer Quick View Modal */}
      {selectedFarmer && (
        <FarmerQuickView
          farmer={selectedFarmer}
          isOpen={isQuickViewOpen}
          onClose={() => setIsQuickViewOpen(false)}
        />
      )}
      
      {/* Add Task Dialog */}
      <AddTaskDialog
        isOpen={isAddTaskOpen}
        onClose={() => setIsAddTaskOpen(false)}
        onAddTask={handleAddTask}
      />
      
      {/* Harvest Review Dialog */}
      <HarvestReviewDialog
        open={isReviewDialogOpen}
        onOpenChange={setIsReviewDialogOpen}
        harvest={selectedHarvest}
        onApprove={handleApproveHarvest}
        onReject={handleRejectHarvest}
      />
    </div>
  );
}

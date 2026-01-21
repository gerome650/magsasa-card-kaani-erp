import { useRoute } from 'wouter';
import { ArrowLeft, Download, MessageSquare, MapPin, Phone, Mail, UserCheck, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { Link } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// Mock data types
type AssignedFarmer = {
  id: string;
  name: string;
  location: string;
  status: 'new' | 'inReview' | 'active';
  assignedDate: string;
  lastActivity: string;
};

type Activity = {
  id: string;
  type: 'farmer_added' | 'status_change' | 'note_added' | 'meeting_scheduled';
  description: string;
  timestamp: string;
};

// Mock data
const mockOfficer = {
  id: '1',
  name: 'Maria Santos',
  region: 'Laguna',
  email: 'maria.santos@example.com',
  phone: '+63 912 345 6789',
  farmersAssigned: 45,
  activeFarmers: 32,
};

const mockFarmers: AssignedFarmer[] = [
  {
    id: '1',
    name: 'Juan dela Cruz',
    location: 'Brgy. Poblacion, Calauan, Laguna',
    status: 'active',
    assignedDate: '2024-01-15',
    lastActivity: '2024-12-20',
  },
  {
    id: '2',
    name: 'Pedro Garcia',
    location: 'Brgy. San Isidro, Calauan, Laguna',
    status: 'active',
    assignedDate: '2024-02-10',
    lastActivity: '2024-12-19',
  },
  {
    id: '3',
    name: 'Ana Martinez',
    location: 'Brgy. Bagong Silang, Calauan, Laguna',
    status: 'inReview',
    assignedDate: '2024-12-01',
    lastActivity: '2024-12-18',
  },
  {
    id: '4',
    name: 'Roberto Reyes',
    location: 'Brgy. Poblacion, Calauan, Laguna',
    status: 'new',
    assignedDate: '2024-12-15',
    lastActivity: '2024-12-15',
  },
  {
    id: '5',
    name: 'Carmen Lopez',
    location: 'Brgy. San Isidro, Calauan, Laguna',
    status: 'active',
    assignedDate: '2024-03-20',
    lastActivity: '2024-12-17',
  },
];

const mockActivities: Activity[] = [
  {
    id: '1',
    type: 'farmer_added',
    description: 'Added new farmer: Roberto Reyes',
    timestamp: '2024-12-15T10:30:00Z',
  },
  {
    id: '2',
    type: 'status_change',
    description: 'Changed Ana Martinez status to In Review',
    timestamp: '2024-12-14T14:20:00Z',
  },
  {
    id: '3',
    type: 'note_added',
    description: 'Added note to Juan dela Cruz: Follow-up on harvest schedule',
    timestamp: '2024-12-13T09:15:00Z',
  },
  {
    id: '4',
    type: 'meeting_scheduled',
    description: 'Scheduled meeting with Pedro Garcia',
    timestamp: '2024-12-12T16:45:00Z',
  },
];

export default function FieldOfficerDetail() {
  const [, params] = useRoute('/manager/officers/:id');
  const officerId = params?.id || '';

  // In a real app, fetch officer data by ID
  // For now, use mock data
  const officer = mockOfficer;
  const farmers = mockFarmers;
  const activities = mockActivities;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <Badge variant="default" className="bg-green-600">
            <CheckCircle className="w-3 h-3 mr-1" />
            Active
          </Badge>
        );
      case 'inReview':
        return (
          <Badge variant="outline" className="border-yellow-500 text-yellow-700">
            <Clock className="w-3 h-3 mr-1" />
            In Review
          </Badge>
        );
      case 'new':
        return (
          <Badge variant="outline" className="border-blue-500 text-blue-700">
            New
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link href="/manager/overview">
        <Button variant="ghost" className="mb-2">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Overview
        </Button>
      </Link>

      {/* Officer Summary Header */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-2xl">{officer.name}</CardTitle>
              <CardDescription className="mt-1 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                {officer.region}
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={() => {}}>
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
              <Button onClick={() => {}}>
                <MessageSquare className="w-4 h-4 mr-2" />
                Message Officer
              </Button>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-muted-foreground" />
              <span>{officer.email}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-muted-foreground" />
              <span>{officer.phone}</span>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* KPI Mini-Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <UserCheck className="w-4 h-4" />
              Farmers Assigned
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{officer.farmersAssigned}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Active Farmers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{officer.activeFarmers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="w-4 h-4" />
              In Review
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {farmers.filter((f) => f.status === 'inReview').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              New
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {farmers.filter((f) => f.status === 'new').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Assigned Farmers Table */}
      <Card>
        <CardHeader>
          <CardTitle>Assigned Farmers</CardTitle>
          <CardDescription>Farmers managed by this field officer</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-medium">Farmer Name</th>
                  <th className="text-left p-3 font-medium">Location</th>
                  <th className="text-left p-3 font-medium">Status</th>
                  <th className="text-left p-3 font-medium">Assigned Date</th>
                  <th className="text-left p-3 font-medium">Last Activity</th>
                </tr>
              </thead>
              <tbody>
                {farmers.map((farmer) => (
                  <tr key={farmer.id} className="border-b hover:bg-muted/50">
                    <td className="p-3 font-medium">{farmer.name}</td>
                    <td className="p-3 text-sm text-muted-foreground">{farmer.location}</td>
                    <td className="p-3">{getStatusBadge(farmer.status)}</td>
                    <td className="p-3 text-sm">{formatDate(farmer.assignedDate)}</td>
                    <td className="p-3 text-sm text-muted-foreground">
                      {formatDate(farmer.lastActivity)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest actions and updates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {activities.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3 pb-4 border-b last:border-0">
                <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm">{activity.description}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDateTime(activity.timestamp)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

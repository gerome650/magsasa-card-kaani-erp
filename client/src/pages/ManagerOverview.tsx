import { useState, useMemo } from 'react';
import { Link } from 'wouter';
import { Search, Users, UserCheck, Clock, Package, TrendingUp, AlertTriangle, Eye, MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Mock data types
type FieldOfficer = {
  id: string;
  name: string;
  region: string;
  farmersAssigned: number;
  activeFarmers: number;
  pipeline: {
    new: number;
    inReview: number;
    active: number;
  };
  production: {
    totalTons: number;
    month: string;
  };
  riskFlags: number;
};

// Mock data
const mockOfficers: FieldOfficer[] = [
  {
    id: '1',
    name: 'Maria Santos',
    region: 'Laguna',
    farmersAssigned: 45,
    activeFarmers: 32,
    pipeline: { new: 5, inReview: 8, active: 32 },
    production: { totalTons: 125.5, month: 'Dec 2024' },
    riskFlags: 2,
  },
  {
    id: '2',
    name: 'Juan dela Cruz',
    region: 'Bacolod',
    farmersAssigned: 38,
    activeFarmers: 28,
    pipeline: { new: 3, inReview: 7, active: 28 },
    production: { totalTons: 98.2, month: 'Dec 2024' },
    riskFlags: 1,
  },
  {
    id: '3',
    name: 'Ana Garcia',
    region: 'Laguna',
    farmersAssigned: 52,
    activeFarmers: 41,
    pipeline: { new: 6, inReview: 5, active: 41 },
    production: { totalTons: 156.8, month: 'Dec 2024' },
    riskFlags: 0,
  },
  {
    id: '4',
    name: 'Roberto Martinez',
    region: 'Bacolod',
    farmersAssigned: 41,
    activeFarmers: 35,
    pipeline: { new: 4, inReview: 2, active: 35 },
    production: { totalTons: 142.3, month: 'Dec 2024' },
    riskFlags: 3,
  },
  {
    id: '5',
    name: 'Carmen Reyes',
    region: 'Laguna',
    farmersAssigned: 36,
    activeFarmers: 29,
    pipeline: { new: 2, inReview: 5, active: 29 },
    production: { totalTons: 108.7, month: 'Dec 2024' },
    riskFlags: 1,
  },
];

export default function ManagerOverview() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<string>('all');

  // Calculate KPIs from mock data
  const kpis = useMemo(() => {
    const totalOfficers = mockOfficers.length;
    const totalFarmersAssigned = mockOfficers.reduce((sum, o) => sum + o.farmersAssigned, 0);
    const totalActiveFarmers = mockOfficers.reduce((sum, o) => sum + o.activeFarmers, 0);
    const totalRequestsPending = mockOfficers.reduce((sum, o) => sum + o.pipeline.inReview, 0);
    const totalOrders = 0; // Placeholder
    const avgYield = 0; // Placeholder

    return {
      totalOfficers,
      totalFarmersAssigned,
      totalActiveFarmers,
      totalRequestsPending,
      totalOrders,
      avgYield,
    };
  }, []);

  // Filter officers
  const filteredOfficers = useMemo(() => {
    return mockOfficers.filter((officer) => {
      const matchesSearch =
        officer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        officer.region.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRegion = selectedRegion === 'all' || officer.region === selectedRegion;
      return matchesSearch && matchesRegion;
    });
  }, [searchQuery, selectedRegion]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Manager Overview</h1>
        <p className="text-muted-foreground mt-1">
          Field officer performance and farmer pipeline management
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Field Officers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.totalOfficers}</div>
            <p className="text-xs text-muted-foreground mt-1">Active officers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Farmers Assigned</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.totalFarmersAssigned}</div>
            <p className="text-xs text-muted-foreground mt-1">Across all officers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Farmers</CardTitle>
            <UserCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.totalActiveFarmers}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {kpis.totalFarmersAssigned > 0
                ? ((kpis.totalActiveFarmers / kpis.totalFarmersAssigned) * 100).toFixed(0)
                : 0}
              % active rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Requests Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.totalRequestsPending}</div>
            <p className="text-xs text-muted-foreground mt-1">In review</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.totalOrders}</div>
            <p className="text-xs text-muted-foreground mt-1">Placeholder</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Yield/ha</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.avgYield.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground mt-1">Placeholder</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Field Officers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search by officer name or region..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedRegion} onValueChange={setSelectedRegion}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Filter by region" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Regions</SelectItem>
                <SelectItem value="Laguna">Laguna</SelectItem>
                <SelectItem value="Bacolod">Bacolod</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Officers Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-medium">Officer</th>
                  <th className="text-left p-3 font-medium">Farmers Assigned</th>
                  <th className="text-left p-3 font-medium">Active Farmers</th>
                  <th className="text-left p-3 font-medium">Pipeline</th>
                  <th className="text-left p-3 font-medium">Production</th>
                  <th className="text-left p-3 font-medium">Risk Flags</th>
                  <th className="text-left p-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOfficers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center p-8 text-muted-foreground">
                      No officers found matching your search criteria.
                    </td>
                  </tr>
                ) : (
                  filteredOfficers.map((officer) => (
                    <tr key={officer.id} className="border-b hover:bg-muted/50">
                      <td className="p-3">
                        <div>
                          <div className="font-medium">{officer.name}</div>
                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {officer.region}
                          </div>
                        </div>
                      </td>
                      <td className="p-3">{officer.farmersAssigned}</td>
                      <td className="p-3">
                        <span className="font-medium text-green-600">{officer.activeFarmers}</span>
                      </td>
                      <td className="p-3">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              New: {officer.pipeline.new}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              Review: {officer.pipeline.inReview}
                            </Badge>
                          </div>
                          <Badge variant="default" className="text-xs w-fit">
                            Active: {officer.pipeline.active}
                          </Badge>
                        </div>
                      </td>
                      <td className="p-3">
                        <div>
                          <div className="font-medium">{officer.production.totalTons} tons</div>
                          <div className="text-xs text-muted-foreground">
                            {officer.production.month}
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        {officer.riskFlags > 0 ? (
                          <Badge variant="destructive" className="flex items-center gap-1 w-fit">
                            <AlertTriangle className="w-3 h-3" />
                            {officer.riskFlags}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="p-3">
                        <Link href={`/manager/officers/${officer.id}`}>
                          <Button variant="outline" size="sm">
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

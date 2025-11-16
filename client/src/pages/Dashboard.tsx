import { TrendingUp, Users, MapPin, Wheat, DollarSign } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { getDashboardStats, getCropDistribution } from '@/data/farmersData';
import { getRecentActivities, getActivityTypeIcon, getStatusColor } from '@/data/activitiesData';

export default function Dashboard() {
  const stats = getDashboardStats();
  const cropDistribution = getCropDistribution();
  const recentActivities = getRecentActivities(5);

  const statCards = [
    {
      title: 'Total Farmers',
      value: stats.totalFarmers.toLocaleString(),
      change: '+12%',
      trend: 'up',
      icon: Users,
      color: 'text-blue-600'
    },
    {
      title: 'Active Farms',
      value: stats.activeFarms.toLocaleString(),
      change: '+8%',
      trend: 'up',
      icon: MapPin,
      color: 'text-green-600'
    },
    {
      title: 'Total Harvest (MT)',
      value: stats.totalHarvest.toLocaleString(),
      change: '+15%',
      trend: 'up',
      icon: Wheat,
      color: 'text-yellow-600'
    },
    {
      title: 'Revenue (₱)',
      value: `₱${(stats.totalRevenue / 1000000).toFixed(2)}M`,
      change: '+22%',
      trend: 'up',
      icon: DollarSign,
      color: 'text-emerald-600'
    }
  ];

  // Generate monthly harvest data
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  const harvestData = [240, 260, 245, 280, 295, 320];
  const targetData = [250, 260, 270, 280, 290, 300];

  const maxValue = Math.max(...harvestData, ...targetData);
  const chartHeight = 200;

  // Crop distribution colors
  const cropColors: Record<string, string> = {
    'Rice': '#10b981',
    'Corn': '#f59e0b',
    'Vegetables': '#ef4444',
    'Others': '#8b5cf6'
  };

  const totalCrops = cropDistribution.reduce((sum, crop) => sum + crop.value, 0);
  let currentAngle = 0;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <h3 className="text-2xl font-bold mt-2">{stat.value}</h3>
                  <div className="flex items-center mt-2 text-sm">
                    <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
                    <span className="text-green-600 font-medium">{stat.change}</span>
                    <span className="text-muted-foreground ml-1">from last month</span>
                  </div>
                </div>
                <div className={`p-3 rounded-full bg-gray-100 ${stat.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Harvest Trends */}
        <Card className="p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold">Monthly Harvest Trends</h3>
            <p className="text-sm text-muted-foreground">Harvest performance vs targets</p>
          </div>
          
          <div className="relative" style={{ height: chartHeight + 40 }}>
            <svg width="100%" height={chartHeight + 40} className="overflow-visible">
              {/* Grid lines */}
              {[0, 1, 2, 3, 4].map((i) => (
                <line
                  key={i}
                  x1="40"
                  y1={i * (chartHeight / 4)}
                  x2="100%"
                  y2={i * (chartHeight / 4)}
                  stroke="#e5e7eb"
                  strokeWidth="1"
                />
              ))}

              {/* Harvest line */}
              <polyline
                points={harvestData.map((value, i) => {
                  const x = 60 + (i * (100 / (months.length - 1))) + '%';
                  const y = chartHeight - (value / maxValue) * chartHeight;
                  return `${x},${y}`;
                }).join(' ')}
                fill="none"
                stroke="#10b981"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Target line */}
              <polyline
                points={targetData.map((value, i) => {
                  const x = 60 + (i * (100 / (months.length - 1))) + '%';
                  const y = chartHeight - (value / maxValue) * chartHeight;
                  return `${x},${y}`;
                }).join(' ')}
                fill="none"
                stroke="#fbbf24"
                strokeWidth="2"
                strokeDasharray="5,5"
              />

              {/* X-axis labels */}
              {months.map((month, i) => (
                <text
                  key={month}
                  x={`${60 + (i * (100 / (months.length - 1)))}%`}
                  y={chartHeight + 20}
                  textAnchor="middle"
                  className="text-xs fill-gray-600"
                >
                  {month}
                </text>
              ))}

              {/* Y-axis values */}
              {[0, 1, 2, 3, 4].map((i) => (
                <text
                  key={i}
                  x="5"
                  y={i * (chartHeight / 4) + 5}
                  className="text-xs fill-gray-600"
                >
                  {Math.round(maxValue - (i * maxValue / 4))}
                </text>
              ))}
            </svg>
          </div>

          <div className="flex items-center justify-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-sm text-muted-foreground">harvest</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-0.5 bg-yellow-500"></div>
              <span className="text-sm text-muted-foreground">target</span>
            </div>
          </div>
        </Card>

        {/* Crop Distribution */}
        <Card className="p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold">Crop Distribution</h3>
            <p className="text-sm text-muted-foreground">Current crop allocation across farms</p>
          </div>

          <div className="flex items-center justify-center">
            <svg width="200" height="200" viewBox="0 0 200 200">
              {cropDistribution.map((crop) => {
                const percentage = (crop.value / totalCrops) * 100;
                const angle = (percentage / 100) * 360;
                const startAngle = currentAngle;
                const endAngle = currentAngle + angle;
                
                const startX = 100 + 80 * Math.cos((startAngle - 90) * Math.PI / 180);
                const startY = 100 + 80 * Math.sin((startAngle - 90) * Math.PI / 180);
                const endX = 100 + 80 * Math.cos((endAngle - 90) * Math.PI / 180);
                const endY = 100 + 80 * Math.sin((endAngle - 90) * Math.PI / 180);
                
                const largeArcFlag = angle > 180 ? 1 : 0;
                
                const path = `M 100 100 L ${startX} ${startY} A 80 80 0 ${largeArcFlag} 1 ${endX} ${endY} Z`;
                
                currentAngle = endAngle;
                
                return (
                  <path
                    key={crop.name}
                    d={path}
                    fill={cropColors[crop.name] || '#8b5cf6'}
                  />
                );
              })}
            </svg>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-6">
            {cropDistribution.map((crop) => {
              const percentage = ((crop.value / totalCrops) * 100).toFixed(1);
              return (
                <div key={crop.name} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: cropColors[crop.name] || '#8b5cf6' }}
                  ></div>
                  <span className="text-sm text-muted-foreground">
                    {crop.name} ({percentage}%)
                  </span>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Recent Activities */}
      <Card className="p-6">
        <div className="mb-6">
          <h3 className="text-lg font-semibold">Recent Activities</h3>
          <p className="text-sm text-muted-foreground">Latest farm activities and updates</p>
        </div>

        <div className="space-y-4">
          {recentActivities.map((activity) => (
            <div key={activity.id} className="flex items-start gap-4 p-4 rounded-lg border">
              <div className="text-2xl">{getActivityTypeIcon(activity.type)}</div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">{activity.farmerName}</h4>
                  <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(activity.status)}`}>
                    {activity.status}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">{activity.description}</p>
                <p className="text-xs text-muted-foreground mt-2">{formatDate(activity.date)}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

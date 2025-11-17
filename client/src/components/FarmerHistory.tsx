import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getFarmerActivities, getActivityIcon, getActivityColor, type FarmerActivity } from "@/data/farmsData";
import { Calendar, TrendingUp } from "lucide-react";

interface FarmerHistoryProps {
  farmerId: string;
}

export default function FarmerHistory({ farmerId }: FarmerHistoryProps) {
  const activities = getFarmerActivities(farmerId);

  const getColorClass = (color: string) => {
    const colors: Record<string, string> = {
      blue: "bg-blue-100 text-blue-700 border-blue-200",
      green: "bg-green-100 text-green-700 border-green-200",
      purple: "bg-purple-100 text-purple-700 border-purple-200",
      orange: "bg-orange-100 text-orange-700 border-orange-200",
      teal: "bg-teal-100 text-teal-700 border-teal-200",
      pink: "bg-pink-100 text-pink-700 border-pink-200",
      gray: "bg-gray-100 text-gray-700 border-gray-200",
    };
    return colors[color] || colors.gray;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatAmount = (amount?: number) => {
    if (!amount) return null;
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Activity History
        </CardTitle>
        <CardDescription>
          Recent activities and transactions for this farmer
        </CardDescription>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No activities recorded yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => {
              const icon = getActivityIcon(activity.type);
              const color = getActivityColor(activity.type);
              const colorClass = getColorClass(color);

              return (
                <div
                  key={activity.id}
                  className="flex gap-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {/* Icon */}
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl border-2 ${colorClass}`}>
                    {icon}
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-semibold">{activity.title}</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {activity.description}
                        </p>
                      </div>
                      {activity.amount && (
                        <div className="text-right">
                          <p className="font-semibold text-green-600">
                            {formatAmount(activity.amount)}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-3 mt-3">
                      <Badge variant="outline" className="text-xs">
                        {activity.type.charAt(0).toUpperCase() + activity.type.slice(1)}
                      </Badge>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        {formatDate(activity.date)}
                      </div>
                      {activity.status && (
                        <Badge 
                          variant={activity.status === 'completed' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {activity.status}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

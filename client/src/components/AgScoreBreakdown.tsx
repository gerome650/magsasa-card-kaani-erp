import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Cloud, Sprout, Wheat } from "lucide-react";

interface AgScoreBreakdownProps {
  climateScore: number;
  soilScore: number;
  harvestScore: number;
  baselineScore: number;
}

export default function AgScoreBreakdown({
  climateScore,
  soilScore,
  harvestScore,
  baselineScore
}: AgScoreBreakdownProps) {
  // Invert scores for display (higher = better)
  const displayClimate = 1000 - climateScore;
  const displaySoil = 1000 - soilScore;
  const displayHarvest = 1000 - harvestScore;
  const displayBaseline = 1000 - baselineScore;
  
  const components = [
    {
      name: 'Climate',
      score: displayClimate,
      weight: 50,
      icon: Cloud,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      description: 'Rainfall, humidity, weather patterns'
    },
    {
      name: 'Soil',
      score: displaySoil,
      weight: 30,
      icon: Sprout,
      color: 'text-amber-600',
      bgColor: 'bg-amber-100',
      description: 'Texture, drainage, nutrient capacity'
    },
    {
      name: 'Harvest',
      score: displayHarvest,
      weight: 20,
      icon: Wheat,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      description: 'Yield vs. benchmark performance'
    }
  ];
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">AgScore™ Breakdown</CardTitle>
        <p className="text-sm text-muted-foreground">
          Overall Score: <span className="font-semibold text-foreground">{displayBaseline}/1000</span>
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {components.map((component) => {
          const Icon = component.icon;
          const percentage = (component.score / 1000) * 100;
          
          return (
            <div key={component.name} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded ${component.bgColor}`}>
                    <Icon className={`w-4 h-4 ${component.color}`} />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{component.name}</p>
                    <p className="text-xs text-muted-foreground">{component.description}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-sm">{component.score}/1000</p>
                  <p className="text-xs text-muted-foreground">{component.weight}% weight</p>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${component.bgColor} ${component.color}`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
        
        <div className="pt-4 border-t">
          <p className="text-xs text-muted-foreground">
            <strong>Note:</strong> Higher scores indicate better performance. 
            AgScore™ is calculated using GIS data (climate zones, soil maps) and 
            harvest performance vs. regional benchmarks.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

import { getAgScoreTierColor } from "@/data/agScoreData";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Award } from "lucide-react";

interface AgScoreBadgeProps {
  score: number;
  tier: number;
  qualitativeTier: string;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export default function AgScoreBadge({ 
  score, 
  tier, 
  qualitativeTier, 
  showLabel = true,
  size = 'md'
}: AgScoreBadgeProps) {
  const colorClass = getAgScoreTierColor(tier);
  
  // Size classes
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-2'
  };
  
  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };
  
  // Invert score for display (1000 - score) so higher is better
  const displayScore = 1000 - score;
  
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className={`inline-flex items-center gap-1.5 rounded-full border font-semibold ${colorClass} ${sizeClasses[size]}`}>
          <Award className={iconSizes[size]} />
          <span>{displayScore}</span>
          {showLabel && <span className="font-normal opacity-80">/ 1000</span>}
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <div className="text-sm">
          <p className="font-semibold">{qualitativeTier}</p>
          <p className="text-xs text-muted-foreground mt-1">
            Tier {tier} of 7 • Score: {displayScore}/1000
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Based on climate, soil, and harvest performance
          </p>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

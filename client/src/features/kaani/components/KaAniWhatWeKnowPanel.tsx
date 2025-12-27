import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface KaAniWhatWeKnowPanelProps {
  whatWeKnow: Array<{ label: string; value: string }>;
}

export function KaAniWhatWeKnowPanel({ whatWeKnow }: KaAniWhatWeKnowPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (whatWeKnow.length === 0) {
    return null;
  }

  return (
    <div className="border-t border-gray-200 bg-blue-50">
      <Button
        variant="ghost"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full justify-between px-4 py-2 text-sm font-medium text-blue-900 hover:bg-blue-100"
      >
        <span>What we know so far ({whatWeKnow.length})</span>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
      </Button>
      {isExpanded && (
        <div className="px-4 pb-3 space-y-2">
          {whatWeKnow.map((item, idx) => (
            <div key={idx} className="text-sm">
              <span className="font-medium text-blue-900">{item.label}:</span>{" "}
              <span className="text-blue-700">{item.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


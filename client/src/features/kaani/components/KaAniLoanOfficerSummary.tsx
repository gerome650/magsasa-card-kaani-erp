import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MarkdownMessage } from "@/components/MarkdownMessage";

interface KaAniLoanOfficerSummaryProps {
  summary: {
    summaryText: string;
    flags: string[];
    assumptions: string[];
    missingCritical: string[];
  };
}

export function KaAniLoanOfficerSummary({ summary }: KaAniLoanOfficerSummaryProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="border-t border-gray-200 bg-yellow-50">
      <Button
        variant="ghost"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full justify-between px-4 py-2 text-sm font-medium text-yellow-900 hover:bg-yellow-100"
      >
        <span>Loan Officer Summary (MVP)</span>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
      </Button>
      {isExpanded && (
        <div className="px-4 pb-3">
          <div className="bg-white rounded-lg p-4 border border-yellow-200">
            <MarkdownMessage content={summary.summaryText} />
          </div>
          {summary.flags.length > 0 && (
            <div className="mt-3 text-sm">
              <span className="font-medium text-yellow-900">Flags:</span>{" "}
              <span className="text-yellow-700">{summary.flags.join(", ")}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}


import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface LoanSuggestionData {
  suggestedAmount: number;
  currency: string;
  baseAmount: number;
  adjustments: Array<{
    reason: string;
    multiplier?: number;
    penalty?: number;
    impact: number;
  }>;
  disclaimers: string[];
  confidence: "low" | "medium" | "high";
}

interface KaAniLoanSuggestionProps {
  data: LoanSuggestionData;
}

export function KaAniLoanSuggestion({ data }: KaAniLoanSuggestionProps) {
  const confidenceColors = {
    high: "bg-green-100 text-green-800 border-green-300",
    medium: "bg-yellow-100 text-yellow-800 border-yellow-300",
    low: "bg-orange-100 text-orange-800 border-orange-300",
  };

  return (
    <Card className="bg-blue-50 border-blue-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">Suggested Loan Amount</CardTitle>
          <Badge className={confidenceColors[data.confidence]}>
            {data.confidence.toUpperCase()} CONFIDENCE
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main suggested amount */}
        <div className="bg-white rounded-lg p-4 border border-blue-300">
          <div className="text-3xl font-bold text-blue-900">
            {data.currency} {data.suggestedAmount.toLocaleString()}
          </div>
          <div className="text-sm text-gray-600 mt-1">
            Recommended loan amount based on your farm details
          </div>
        </div>

        {/* Calculation breakdown */}
        {data.adjustments.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-semibold text-gray-700">How we calculated this:</div>
            <div className="bg-white rounded-lg p-3 space-y-2 border border-gray-200">
              {data.adjustments.map((adj, idx) => (
                <div key={idx} className="flex items-start justify-between text-sm">
                  <div className="flex-1">
                    <span className="text-gray-700">{adj.reason}</span>
                    {adj.multiplier && adj.multiplier !== 1 && (
                      <span className="text-xs text-gray-500 ml-2">
                        (×{adj.multiplier.toFixed(2)})
                      </span>
                    )}
                    {adj.penalty && adj.penalty > 0 && (
                      <span className="text-xs text-orange-600 ml-2">
                        (-{(adj.penalty * 100).toFixed(0)}%)
                      </span>
                    )}
                  </div>
                  <div
                    className={`font-medium ml-2 ${
                      adj.impact >= 0 ? "text-green-700" : "text-red-700"
                    }`}
                  >
                    {adj.impact >= 0 ? "+" : ""}
                    {data.currency} {Math.abs(adj.impact).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Disclaimers */}
        {data.disclaimers.length > 0 && (
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
            <div className="text-xs font-semibold text-gray-700 mb-2">Important Notes:</div>
            <ul className="text-xs text-gray-600 space-y-1">
              {data.disclaimers.map((disclaimer, idx) => (
                <li key={idx} className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>{disclaimer}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

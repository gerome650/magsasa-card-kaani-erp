import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { KaAniArtifactBundle } from "@/features/kaani/types";
import { KaAniPromptChips } from "./KaAniPromptChips";

interface KaAniLoanPacketProps {
  bundle: KaAniArtifactBundle | null;
  audience: "loan_officer" | "farmer";
  onRefresh?: () => void;
}

export function KaAniLoanPacket({ bundle, audience, onRefresh }: KaAniLoanPacketProps) {
  if (!bundle) {
    return null;
  }

  const readinessColors = {
    ready: "bg-green-100 text-green-800 border-green-300",
    needs_info: "bg-yellow-100 text-yellow-800 border-yellow-300",
    draft: "bg-gray-100 text-gray-800 border-gray-300",
  };

  const severityColors = {
    high: "bg-red-100 text-red-800 border-red-300",
    medium: "bg-yellow-100 text-yellow-800 border-yellow-300",
    low: "bg-blue-100 text-blue-800 border-blue-300",
  };

  const loanSummary = bundle.artifacts.find(a => a.type === "loan_summary");
  const costBreakdown = bundle.artifacts.find(a => a.type === "cost_breakdown");
  const riskFlags = bundle.artifacts.find(a => a.type === "risk_flags");
  const nextQuestions = bundle.artifacts.find(a => a.type === "next_questions");

  return (
    <div className="border-t border-gray-200 bg-gray-50 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Loan Packet</h3>
        <Badge className={readinessColors[bundle.readiness]}>
          {bundle.readiness.replace("_", " ").toUpperCase()}
        </Badge>
      </div>

      {/* Missing Info Banner: Only show when needs_info, avoid redundant listing */}
      {bundle.readiness === "needs_info" && bundle.missing.length > 0 && (
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="pt-4">
            <p className="text-sm text-yellow-800">
              Waiting for more information to complete the loan packet.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Loan Summary */}
      {loanSummary && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">{loanSummary.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {loanSummary.data.crop && (
              <div><strong>Crop:</strong> {loanSummary.data.crop}</div>
            )}
            {loanSummary.data.hectares && (
              <div><strong>Hectares:</strong> {loanSummary.data.hectares}</div>
            )}
            {loanSummary.data.location && (
              <div>
                <strong>Location:</strong>{" "}
                {[
                  loanSummary.data.location.province,
                  loanSummary.data.location.municipality,
                  loanSummary.data.location.barangay,
                ]
                  .filter(Boolean)
                  .join(", ")}
              </div>
            )}
            {loanSummary.data.assumptions && loanSummary.data.assumptions.length > 0 && (
              <div className="mt-2">
                <strong>Assumptions:</strong>
                <ul className="list-disc list-inside text-sm text-gray-600">
                  {loanSummary.data.assumptions.map((a, idx) => (
                    <li key={idx}>{a}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Cost Breakdown */}
      {costBreakdown && costBreakdown.data.total.min > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">{costBreakdown.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-2">
              <strong>Total:</strong> PHP {costBreakdown.data.total.min.toLocaleString()} - {costBreakdown.data.total.max.toLocaleString()}
            </div>
            {costBreakdown.data.perHectare && (
              <div className="mb-2">
                <strong>Per Hectare:</strong> PHP {costBreakdown.data.perHectare.min.toLocaleString()} - {costBreakdown.data.perHectare.max.toLocaleString()}
              </div>
            )}
            <div className="mt-3">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-1">Category</th>
                    <th className="text-right py-1">Min</th>
                    <th className="text-right py-1">Max</th>
                  </tr>
                </thead>
                <tbody>
                  {costBreakdown.data.lineItems.map((item, idx) => (
                    <tr key={idx} className="border-b">
                      <td className="py-1">{item.label}</td>
                      <td className="text-right py-1">PHP {item.min.toLocaleString()}</td>
                      <td className="text-right py-1">PHP {item.max.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Risk Flags */}
      {riskFlags && riskFlags.data.flags.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">{riskFlags.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {riskFlags.data.flags.map((flag, idx) => (
              <div key={idx} className="border-l-4 pl-2" style={{ borderColor: flag.severity === 'high' ? '#ef4444' : flag.severity === 'medium' ? '#eab308' : '#3b82f6' }}>
                <div className="flex items-center gap-2 mb-1">
                  <Badge className={severityColors[flag.severity]}>{flag.severity.toUpperCase()}</Badge>
                  <span className="font-medium">{flag.description}</span>
                </div>
                {flag.mitigation && (
                  <div className="text-sm text-gray-600 ml-6">{flag.mitigation}</div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Next Questions */}
      {nextQuestions && nextQuestions.data.questions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">{nextQuestions.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <KaAniPromptChips
              prompts={nextQuestions.data.questions.map(q => ({ label: q, message: q }))}
              onPromptClick={(msg) => {
                // This will be handled by parent component
                if (onRefresh) onRefresh();
              }}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}


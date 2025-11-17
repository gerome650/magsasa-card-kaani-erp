import { MessageSquare, Lightbulb, Sparkles } from "lucide-react";

interface KaAniEmptyStateProps {
  role: "farmer" | "technician";
  context: "loan_matching" | "risk_scoring" | null;
}

export function KaAniEmptyState({ role, context }: KaAniEmptyStateProps) {
  const tips = role === "farmer" 
    ? [
        "Ask about rice farming techniques in your dialect",
        "Get information about CARD MRI loans and AgScore",
        "Request pest control recommendations",
        "Check market prices for your crops",
      ]
    : [
        "Analyze farmer AgScore and risk factors",
        "Match farmers with suitable loan products",
        "Get technical recommendations for crop issues",
        "Review farm performance metrics",
      ];

  return (
    <div className="flex flex-col items-center justify-center h-full py-12 px-6">
      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
        <MessageSquare className="w-10 h-10 text-green-600" />
      </div>
      
      <h2 className="text-2xl font-bold text-gray-800 mb-3">
        Welcome to KaAni AI Assistant
      </h2>
      
      <p className="text-gray-600 text-center max-w-md mb-8">
        {role === "farmer" 
          ? "Your AI companion for farming advice, loan information, and agricultural guidance in Filipino dialects."
          : "Your AI tool for farmer assessment, loan matching, and technical agricultural support."
        }
      </p>

      {context && (
        <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 mb-6 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-green-600" />
          <span className="text-green-800 font-medium">
            {context === "loan_matching" 
              ? "Loan Matching Mode Active" 
              : "Risk Scoring Mode Active"
            }
          </span>
        </div>
      )}

      <div className="w-full max-w-md">
        <div className="flex items-center gap-2 mb-4">
          <Lightbulb className="w-5 h-5 text-yellow-600" />
          <h3 className="font-semibold text-gray-700">Quick Tips:</h3>
        </div>
        <ul className="space-y-2">
          {tips.map((tip, index) => (
            <li key={index} className="flex items-start gap-2 text-gray-600">
              <span className="text-green-600 font-bold mt-0.5">•</span>
              <span>{tip}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-8 text-sm text-gray-500 text-center max-w-md">
        <p>
          💡 <strong>Pro Tip:</strong> Use the suggested prompts below or type your own question to get started!
        </p>
      </div>
    </div>
  );
}

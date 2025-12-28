export type ArtifactReadiness = "draft" | "needs_info" | "ready";

export type KaAniArtifactBase = {
  id: string;
  type: "loan_summary" | "cost_breakdown" | "risk_flags" | "next_questions" | "loan_suggestion";
  title: string;
  version: "v1";
};

export type LoanSummaryArtifact = KaAniArtifactBase & {
  type: "loan_summary";
  data: {
    crop?: string;
    hectares?: number;
    location?: { province?: string; municipality?: string; barangay?: string };
    purpose?: string;
    season?: string;
    assumptions: string[];
    confidence: "low" | "medium" | "high";
  };
};

export type CostBreakdownArtifact = KaAniArtifactBase & {
  type: "cost_breakdown";
  data: {
    currency: "PHP";
    total: { min: number; max: number };
    perHectare?: { min: number; max: number };
    lineItems: Array<{ category: string; label: string; min: number; max: number }>;
    assumptions: string[];
    confidence: "low" | "medium" | "high";
  };
};

export type RiskFlagsArtifact = KaAniArtifactBase & {
  type: "risk_flags";
  data: {
    flags: Array<{ code: string; severity: "low" | "medium" | "high"; description: string; mitigation?: string }>;
  };
};

export type NextQuestionsArtifact = KaAniArtifactBase & {
  type: "next_questions";
  data: {
    missing: string[];
    questions: string[];
  };
};

export type LoanSuggestionArtifact = KaAniArtifactBase & {
  type: "loan_suggestion";
  visibility: "off" | "internal" | "ui";
  data: {
    suggestedAmount: number;
    currency: "PHP";
    baseAmount: number;
    adjustments: Array<{
      reason: string;
      multiplier?: number;
      penalty?: number;
      impact: number;
    }>;
    disclaimers: string[];
    confidence: "low" | "medium" | "high";
  };
};

export type KaAniArtifact =
  | LoanSummaryArtifact
  | CostBreakdownArtifact
  | RiskFlagsArtifact
  | NextQuestionsArtifact
  | LoanSuggestionArtifact;

export type KaAniArtifactBundle = {
  readiness: ArtifactReadiness;
  missing: string[];
  artifacts: KaAniArtifact[];
};

export type FlowState = {
  flowId?: string;
  slots: Record<string, any>;
  progress?: {
    requiredTotal: number;
    requiredFilled: number;
    percent: number;
    missingRequired: string[];
  };
  nextStepId?: string | null;
  whatWeKnow?: Array<{ label: string; value: string }>;
  loanOfficerSummary?: any;
};

export type ArtifactBuildInput = {
  conversationId: number;
  audience: "loan_officer" | "farmer";
  dialect?: string;
  farmerProfileId?: string | null;
  flowState?: FlowState | null;
  messages?: Array<{ role: string; content: string; metadata?: any }>;
};


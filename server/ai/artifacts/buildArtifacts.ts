import { KaAniArtifactBundle, ArtifactBuildInput, NextQuestionsArtifact } from "./types";
import { buildLoanSummaryArtifact } from "./loanPacket";
import { buildCostBreakdownArtifact } from "./costBreakdown";
import { buildRiskFlagsArtifact } from "./riskFlags";

/**
 * Generate friendly questions based on missing fields and audience
 */
function generateQuestions(missing: string[], audience: "loan_officer" | "farmer", dialect?: string): string[] {
  const questions: string[] = [];
  const isTagalog = dialect === "tagalog";

  for (const field of missing) {
    if (field.toLowerCase().includes("crop")) {
      if (audience === "loan_officer") {
        questions.push("What is the primary crop?");
      } else {
        questions.push(isTagalog ? "Ano ang pangunahing pananim mo?" : "What is your primary crop?");
      }
    } else if (field.toLowerCase().includes("hectare") || field.toLowerCase().includes("farm size")) {
      if (audience === "loan_officer") {
        questions.push("What is the farm size in hectares?");
      } else {
        questions.push(isTagalog ? "Ilang ektarya ang iyong sakahan?" : "What is your farm size in hectares?");
      }
    } else if (field.toLowerCase().includes("province") || field.toLowerCase().includes("location")) {
      if (audience === "loan_officer") {
        questions.push("What province is the farm located in?");
      } else {
        questions.push(isTagalog ? "Saan ang lokasyon ng iyong sakahan? (probinsya)" : "What province is your farm located in?");
      }
    } else if (field.toLowerCase().includes("municipality")) {
      if (audience === "loan_officer") {
        questions.push("What municipality is the farm in?");
      } else {
        questions.push(isTagalog ? "Anong munisipyo?" : "What municipality?");
      }
    } else if (field.toLowerCase().includes("irrigation")) {
      if (audience === "loan_officer") {
        questions.push("What irrigation method is used? (e.g., rainfed, pump, canal)");
      } else {
        questions.push(isTagalog ? "Ano ang sistema ng patubig? (hal. rainfed, bomba, kanal)" : "What irrigation method do you use?");
      }
    } else {
      questions.push(`Please provide: ${field}`);
    }
  }

  return questions.slice(0, 5); // Limit to 5 questions
}

/**
 * Build next questions artifact
 */
function buildNextQuestionsArtifact(missing: string[], audience: "loan_officer" | "farmer", dialect?: string): NextQuestionsArtifact {
  const questions = generateQuestions(missing, audience, dialect);

  return {
    id: "next_questions_v1",
    type: "next_questions",
    title: "Next Questions",
    version: "v1",
    data: {
      missing: [...missing],
      questions,
    },
  };
}

/**
 * Determine readiness based on missing fields
 */
function determineReadiness(missing: string[]): "draft" | "needs_info" | "ready" {
  if (missing.length === 0) {
    return "ready";
  }
  if (missing.length >= 2) {
    return "needs_info";
  }
  return "draft";
}

/**
 * Build artifact bundle from input
 */
export function buildArtifacts(input: ArtifactBuildInput): KaAniArtifactBundle {
  const { flowState, messages = [], audience, dialect } = input;

  // Determine missing required fields
  const slots = flowState?.slots || {};
  const missing: string[] = [];

  // Required minimal set for underwriting MVP
  if (!slots.crop && !slots.cropPrimary && !slots.farmer_cropPrimary) {
    missing.push("crop");
  }
  
  const hectares = slots.hectares || slots.farmSize || slots.farmer_farmSize;
  if (!hectares || (typeof hectares === 'number' && hectares <= 0)) {
    missing.push("hectares");
  }

  if (!slots.location_province && !slots.province && !slots.location_municipality && !slots.municipality) {
    missing.push("province");
  }

  // Optional but recommended
  if (!slots.irrigationType && !slots.irrigation && !slots.irrigation_type) {
    // Don't add to missing, but note it in risk flags
  }

  const readiness = determineReadiness(missing);

  // Build artifacts
  const loanSummary = buildLoanSummaryArtifact(flowState, messages);
  const costBreakdown = buildCostBreakdownArtifact(flowState, loanSummary.data);
  const riskFlags = buildRiskFlagsArtifact(flowState, loanSummary.data);
  const nextQuestions = buildNextQuestionsArtifact(missing, audience, dialect);

  return {
    readiness,
    missing: [...missing],
    artifacts: [loanSummary, costBreakdown, riskFlags, nextQuestions],
  };
}


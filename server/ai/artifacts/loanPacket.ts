import { LoanSummaryArtifact } from "./types";
import { FlowState } from "./types";

/**
 * Build loan summary artifact from flow state and messages
 */
export function buildLoanSummaryArtifact(
  flowState: FlowState | null | undefined,
  messages: Array<{ role: string; content: string }> = []
): LoanSummaryArtifact {
  const slots = flowState?.slots || {};
  
  // Extract crop (try slot first, then detect from messages)
  let crop = slots.crop || slots.cropPrimary || slots.farmer_cropPrimary;
  if (!crop && messages.length > 0) {
    // Check last few user messages for crop keywords
    const recentMessages = messages.slice(-5).filter(m => m.role === 'user');
    for (const msg of recentMessages) {
      const content = msg.content.toLowerCase();
      if (content.includes('palay') || content.includes('rice')) {
        crop = 'Palay';
        break;
      } else if (content.includes('mais') || content.includes('corn')) {
        crop = 'Maize';
        break;
      }
    }
  }

  // Extract hectares/farm size
  const hectares = slots.hectares || slots.farmSize || slots.farmer_farmSize;
  const numHectares = typeof hectares === 'number' ? hectares : (typeof hectares === 'string' ? parseFloat(hectares) : undefined);

  // Extract location
  const location = {
    province: slots.location_province || slots.province,
    municipality: slots.location_municipality || slots.municipality,
    barangay: slots.location_barangay || slots.barangay,
  };

  // Determine confidence
  let confidence: "low" | "medium" | "high" = "low";
  if (crop && numHectares && location.province) {
    confidence = "high";
  } else if (crop && numHectares) {
    confidence = "medium";
  }

  // Build assumptions
  const assumptions: string[] = [];
  if (!crop) {
    assumptions.push("Crop type not specified");
  }
  if (!numHectares) {
    assumptions.push("Farm size not specified");
  }
  if (!location.province) {
    assumptions.push("Location (province) not specified");
  }
  if (numHectares && !location.province) {
    assumptions.push("Using general benchmark without location-specific adjustments");
  }

  return {
    id: "loan_summary_v1",
    type: "loan_summary",
    title: "Loan Summary",
    version: "v1",
    data: {
      crop: crop || undefined,
      hectares: numHectares || undefined,
      location: (location.province || location.municipality || location.barangay) ? location : undefined,
      purpose: slots.purpose || "working_capital",
      season: slots.season || undefined,
      assumptions: assumptions.length > 0 ? assumptions : ["All key information provided"],
      confidence,
    },
  };
}


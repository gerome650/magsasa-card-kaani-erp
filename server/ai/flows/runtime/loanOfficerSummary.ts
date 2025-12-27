/**
 * Build MVP loan officer summary from collected slots
 */
export function buildLoanOfficerMvpSummary(args: {
  slots: Record<string, any>;
  farmerProfileId?: string;
  mode: "erp" | "leadgen";
}): {
  summaryText: string;
  flags: string[];
  assumptions: string[];
  missingCritical: string[];
} {
  const { slots } = args;
  const flags: string[] = [];
  const assumptions: string[] = [];
  const missingCritical: string[] = [];
  const sections: string[] = [];

  // Extract common slot keys (normalize various naming conventions)
  const getSlot = (key: string): any => {
    // Try exact match first
    if (slots[key] !== undefined) return slots[key];
    
    // Try partial matches
    for (const [k, v] of Object.entries(slots)) {
      if (k.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(k.toLowerCase())) {
        return v;
      }
    }
    return undefined;
  };

  // Location
  const province = getSlot('location.province') || getSlot('province');
  const municipality = getSlot('location.municipality') || getSlot('municipality');
  const barangay = getSlot('location.barangay') || getSlot('barangay');
  
  if (!province && !municipality) {
    missingCritical.push('location');
    flags.push('Missing location information');
  } else {
    const locationParts = [barangay, municipality, province].filter(Boolean);
    sections.push(`**Location:** ${locationParts.join(', ') || 'Not specified'}`);
  }

  // Crop
  const crop = getSlot('farmer.cropPrimary') || getSlot('cropPrimary') || getSlot('crop');
  if (!crop) {
    missingCritical.push('crop');
    flags.push('Missing primary crop information');
  } else {
    sections.push(`**Primary Crop:** ${crop}`);
  }

  // Farm size
  const farmSize = getSlot('farmer.farmSize') || getSlot('farmSize') || getSlot('farm_size_ha');
  if (!farmSize) {
    missingCritical.push('farmSize');
    flags.push('Missing farm size');
  } else {
    sections.push(`**Farm Size:** ${farmSize} hectares`);
  }

  // Production details
  const productionDetails: string[] = [];
  
  const inputs = getSlot('inputs') || getSlot('production.inputs');
  const fertilizer = getSlot('fertilizer') || getSlot('production.fertilizer');
  const pesticide = getSlot('pesticide') || getSlot('production.pesticide');
  const seed = getSlot('seed') || getSlot('production.seed');
  
  if (inputs) productionDetails.push(`Inputs: ${inputs}`);
  if (fertilizer) productionDetails.push(`Fertilizer: ${fertilizer}`);
  if (pesticide) productionDetails.push(`Pesticide: ${pesticide}`);
  if (seed) productionDetails.push(`Seed: ${seed}`);
  
  if (productionDetails.length > 0) {
    sections.push(`**Production Needs:** ${productionDetails.join(', ')}`);
  }

  // Financing
  const loanAmount = getSlot('loanAmount') || getSlot('financing.loanAmount') || getSlot('loan_amount');
  let estimatedWorkingCapital: number | null = null;
  
  if (loanAmount) {
    sections.push(`**Loan Amount Requested:** ₱${parseFloat(loanAmount).toLocaleString()}`);
  } else if (farmSize && typeof farmSize === 'number') {
    // Estimate working capital: assume ~₱50,000 per hectare for rice (rough estimate)
    const costPerHa = getSlot('cost_per_ha') || getSlot('costPerHa');
    const estimatedCostPerHa = costPerHa ? parseFloat(costPerHa) : 50000;
    
    estimatedWorkingCapital = farmSize * estimatedCostPerHa;
    sections.push(`**Estimated Working Capital:** ₱${estimatedWorkingCapital.toLocaleString()} (${farmSize} ha × ₱${estimatedCostPerHa.toLocaleString()}/ha)`);
    assumptions.push(`Used default cost per hectare (₱${estimatedCostPerHa.toLocaleString()}) for estimation`);
  } else {
    sections.push(`**Loan Amount:** TBD`);
    flags.push('Loan amount not specified');
  }

  // Production cycle dates (if present)
  const plantingDate = getSlot('plantingDate') || getSlot('production.plantingDate');
  const harvestDate = getSlot('harvestDate') || getSlot('production.harvestDate');
  
  if (!plantingDate && !harvestDate) {
    flags.push('Missing production cycle dates');
  } else {
    const dates: string[] = [];
    if (plantingDate) dates.push(`Planting: ${plantingDate}`);
    if (harvestDate) dates.push(`Harvest: ${harvestDate}`);
    sections.push(`**Production Cycle:** ${dates.join(', ')}`);
  }

  // Build summary text
  let summaryText = `# Loan Officer Summary (MVP)\n\n`;
  summaryText += sections.join('\n\n');
  
  if (assumptions.length > 0) {
    summaryText += `\n\n## Assumptions\n`;
    assumptions.forEach(assumption => {
      summaryText += `- ${assumption}\n`;
    });
  }

  // Critical missing items
  if (missingCritical.length > 0) {
    summaryText += `\n\n## Missing Critical Information\n`;
    missingCritical.forEach(item => {
      summaryText += `- ${item}\n`;
    });
  }

  return {
    summaryText,
    flags,
    assumptions,
    missingCritical,
  };
}


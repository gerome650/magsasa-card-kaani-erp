/**
 * Client-side audit logging for loan suggestion rendering
 * Only logs when ENABLE_UI_AUDIT_LOGS is set and visibility is "ui"
 */

export function logLoanSuggestionRendered(data: {
  suggestedAmount: number;
  baseAmount: number;
  confidence: string;
}): void {
  // Gate behind environment flag
  const enableLogs = import.meta.env.VITE_ENABLE_UI_AUDIT_LOGS === "true";
  if (!enableLogs) {
    return;
  }

  try {
    const logLine = JSON.stringify({
      event: "ui.loan_suggestion.rendered.v1",
      timestamp: new Date().toISOString(),
      suggestedAmount: data.suggestedAmount,
      baseAmount: data.baseAmount,
      confidence: data.confidence,
    });
    console.info(logLine);
  } catch (error) {
    // Never crash on logging errors
    console.warn("[LoanSuggestion] Failed to log render event:", error);
  }
}


import crypto from "crypto";

/**
 * Hash farmer ID with salt for logging (never log raw farmerId)
 */
export function hashFarmerId(farmerId: string | null | undefined): string {
  if (!farmerId) {
    return "unknown";
  }

  const salt = process.env.LOG_HASH_SALT;
  if (!salt) {
    return "unknown";
  }

  try {
    const hash = crypto.createHash("sha256");
    hash.update(farmerId + salt);
    return hash.digest("hex").substring(0, 16); // Use first 16 chars for brevity
  } catch (error) {
    return "unknown";
  }
}

/**
 * Generate a correlation ID (reuse from request if available, else generate)
 */
export function getCorrelationId(req?: { headers?: Record<string, string | string[] | undefined> }): string {
  // Try to extract from request headers (common patterns: x-request-id, x-correlation-id, x-trace-id)
  if (req?.headers) {
    const requestId = 
      req.headers["x-request-id"] || 
      req.headers["x-correlation-id"] || 
      req.headers["x-trace-id"];
    
    if (requestId && typeof requestId === "string") {
      return requestId;
    }
  }

  // Generate a simple correlation ID
  return crypto.randomBytes(8).toString("hex");
}

/**
 * Log structured event as single-line JSON
 */
export function logEvent(event: string, payload: Record<string, unknown>): void {
  try {
    const logLine = JSON.stringify({
      event,
      timestamp: new Date().toISOString(),
      ...payload,
    });
    console.info(logLine);
  } catch (error) {
    // Never crash on logging errors
    console.warn("[LoanSuggestion] Failed to log event:", error);
  }
}


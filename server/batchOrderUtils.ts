/**
 * Batch Orders utility functions
 * 
 * Centralized helpers for date validation, reference code generation, and financial calculations.
 */

/**
 * Maximum number of days in the past that an expected delivery date can be.
 * Current policy: Allow dates up to 2 days in the past (e.g., for backdating orders).
 */
export const MAX_PAST_DAYS_ALLOWED = 2;

/**
 * Validates if a delivery date is acceptable for a batch order.
 * 
 * Current rule: Date must be today or within the past MAX_PAST_DAYS_ALLOWED days.
 * 
 * @param date - The expected delivery date to validate
 * @returns true if the date is valid, false otherwise
 */
export function isValidBatchOrderDeliveryDate(date: Date): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const cutoffDate = new Date(today);
  cutoffDate.setDate(cutoffDate.getDate() - MAX_PAST_DAYS_ALLOWED);
  
  return date >= cutoffDate;
}

/**
 * Gets a validation error message for an invalid delivery date, or null if valid.
 * 
 * @param date - The expected delivery date to validate
 * @returns Error message string if invalid, null if valid
 */
export function getDeliveryDateValidationError(date: Date): string | null {
  if (isValidBatchOrderDeliveryDate(date)) {
    return null;
  }
  
  return `Expected delivery date must be today or within the past ${MAX_PAST_DAYS_ALLOWED} days`;
}

/**
 * Generates a batch order reference code in the format: BATCH-YYYYMMDD-XXXX
 * 
 * @returns A reference code string
 */
export function generateBatchOrderReferenceCode(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `BATCH-${year}${month}${day}-${random}`;
}

/**
 * Maximum number of retry attempts when generating a unique reference code.
 */
const MAX_REFERENCE_CODE_RETRIES = 3;

/**
 * Generates a unique batch order reference code with retry logic.
 * 
 * Attempts to generate a reference code that doesn't conflict with existing codes.
 * If a unique constraint violation occurs, retries up to MAX_REFERENCE_CODE_RETRIES times.
 * 
 * @param checkUnique - Async function that checks if a reference code is unique (returns true if unique, false if duplicate)
 * @returns A unique reference code
 * @throws Error if unable to generate a unique code after all retries
 */
export async function generateUniqueBatchOrderReferenceCode(
  checkUnique: (code: string) => Promise<boolean>
): Promise<string> {
  for (let attempt = 1; attempt <= MAX_REFERENCE_CODE_RETRIES; attempt++) {
    const code = generateBatchOrderReferenceCode();
    const isUnique = await checkUnique(code);
    
    if (isUnique) {
      return code;
    }
    
    // If this is the last attempt, throw error
    if (attempt === MAX_REFERENCE_CODE_RETRIES) {
      throw new Error(
        `Unable to generate a unique reference code for this batch order after ${MAX_REFERENCE_CODE_RETRIES} attempts. Please try again.`
      );
    }
  }
  
  // This should never be reached, but TypeScript needs it
  throw new Error("Failed to generate reference code");
}

/**
 * Checks if a margin is negative (farmer price less than supplier price).
 * 
 * @param farmerUnitPrice - Price charged to farmer
 * @param supplierUnitPrice - Price paid to supplier
 * @returns true if margin is negative, false otherwise
 */
export function isNegativeMargin(farmerUnitPrice: number, supplierUnitPrice: number): boolean {
  return farmerUnitPrice < supplierUnitPrice;
}


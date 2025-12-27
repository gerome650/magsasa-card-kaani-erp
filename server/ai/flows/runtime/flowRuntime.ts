import { FlowPackage, Slot, Step, Condition } from "../types";

/**
 * Normalize text input (trim, lowercase, collapse whitespace)
 */
export function normalizeText(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

/**
 * Extract slots from a user message using simple heuristics.
 * This is MVP extraction - deterministic and best-effort.
 */
export function extractSlotsFromMessage(
  flow: FlowPackage,
  message: string
): Partial<Record<string, any>> {
  const extracted: Partial<Record<string, any>> = {};
  const normalized = normalizeText(message);

  for (const slot of flow.slots) {
    // Skip if already extracted
    if (extracted[slot.key] !== undefined) continue;

    if (slot.type === "number") {
      // Extract first number from message
      const numberMatch = normalized.match(/(\d+(?:\.\d+)?)/);
      if (numberMatch) {
        const value = parseFloat(numberMatch[1]);
        if (!isNaN(value)) {
          extracted[slot.key] = value;
        }
      }
    } else if (slot.type === "select" && slot.options) {
      // Match option by substring (case-insensitive)
      for (const option of slot.options) {
        const optionLabel = normalizeText(option.label);
        const optionValue = normalizeText(option.value);
        
        if (normalized.includes(optionLabel) || normalized.includes(optionValue)) {
          extracted[slot.key] = option.value;
          break;
        }
      }
    } else if (slot.type === "text") {
      // For text slots, we'll extract if there's context (e.g., label appears in message)
      // Simple heuristic: if the slot label/keyword appears, take the text after it
      const slotLabel = normalizeText(slot.label);
      const keywordMatch = normalized.indexOf(slotLabel);
      
      if (keywordMatch !== -1) {
        // Try to extract text after the label
        const afterLabel = normalized.substring(keywordMatch + slotLabel.length).trim();
        if (afterLabel.length > 0 && afterLabel.length < 200) {
          extracted[slot.key] = afterLabel;
        }
      }
    } else if (slot.type === "boolean") {
      // Extract boolean from yes/no patterns
      const yesPattern = /\b(yes|oo|opo|true|sige|oo nga|tama)\b/;
      const noPattern = /\b(no|hindi|false|hindi po|mali)\b/;
      if (yesPattern.test(normalized)) {
        extracted[slot.key] = true;
      } else if (noPattern.test(normalized)) {
        extracted[slot.key] = false;
      }
    }
  }

  return extracted;
}

/**
 * Merge new slots into existing slots (never delete existing unless new value is non-empty)
 */
export function mergeSlots(
  existingSlots: Record<string, any>,
  newSlots: Partial<Record<string, any>>
): Record<string, any> {
  const merged = { ...existingSlots };

  for (const [key, value] of Object.entries(newSlots)) {
    // Only update if new value is non-empty
    if (value !== undefined && value !== null && value !== '') {
      merged[key] = value;
    }
  }

  return merged;
}

/**
 * Compute progress: required slots filled vs total required
 */
export function computeProgress(
  flow: FlowPackage,
  slots: Record<string, any>
): {
  requiredTotal: number;
  requiredFilled: number;
  percent: number;
  missingRequired: string[];
} {
  // Find required slots (required=true)
  const requiredSlots = flow.slots.filter(slot => slot.required);
  const requiredKeys = requiredSlots.map(slot => slot.key);

  let requiredFilled = 0;
  const missingRequired: string[] = [];

  for (const key of requiredKeys) {
    const value = slots[key];
    if (value !== undefined && value !== null && value !== '') {
      requiredFilled++;
    } else {
      missingRequired.push(key);
    }
  }

  const requiredTotal = requiredKeys.length;
  const percent = requiredTotal > 0
    ? Math.round((requiredFilled / requiredTotal) * 100)
    : 100;

  return {
    requiredTotal,
    requiredFilled,
    percent,
    missingRequired,
  };
}

/**
 * Check if a condition is satisfied given current slots
 */
function checkCondition(condition: Condition, slots: Record<string, any>): boolean {
  const slotValue = slots[condition.slotKey];

  switch (condition.op) {
    case 'equals':
      return slotValue === condition.value;
    case 'notEquals':
      return slotValue !== condition.value;
    case 'exists':
      return slotValue !== undefined && slotValue !== null && slotValue !== '';
    case 'missing':
      return slotValue === undefined || slotValue === null || slotValue === '';
    case 'gt':
      return typeof slotValue === 'number' && typeof condition.value === 'number' && slotValue > condition.value;
    case 'lt':
      return typeof slotValue === 'number' && typeof condition.value === 'number' && slotValue < condition.value;
    case 'in':
      return Array.isArray(condition.value) && condition.value.includes(slotValue);
    default:
      return false;
  }
}

/**
 * Get the next step based on current slots and flow logic
 */
export function getNextStep(
  flow: FlowPackage,
  slots: Record<string, any>
): Step | null {
  // For each step, check if it should be shown
  for (const step of flow.steps) {
    // Check if step's required slots are filled
    const stepRequiredSlots = step.slotKeys || [];
    const allRequiredFilled = stepRequiredSlots.every(key => {
      const value = slots[key];
      return value !== undefined && value !== null && value !== '';
    });

    // If step has conditions, check them
    let conditionsPass = true;
    if (step.next && typeof step.next === 'object' && step.next.when) {
      conditionsPass = step.next.when.every(condition => checkCondition(condition, slots));
    }

    // If step requires slots that aren't filled, or conditions don't pass, continue to next step
    if (!allRequiredFilled || !conditionsPass) {
      continue;
    }

    // Check navigation logic
    if (step.next) {
      if (typeof step.next === 'string') {
        // Direct step ID reference - find that step
        const targetStep = flow.steps.find(s => s.id === step.next as string);
        if (targetStep) {
          return targetStep;
        }
      } else if (typeof step.next === 'object' && 'when' in step.next) {
        // Conditional navigation
        const nextObj = step.next;
        const allConditionsPass = nextObj.when.every(condition => checkCondition(condition, slots));
        if (allConditionsPass) {
          const targetStep = flow.steps.find(s => s.id === nextObj.go);
          if (targetStep) {
            return targetStep;
          }
        } else if (nextObj.elseGo) {
          const targetStep = flow.steps.find(s => s.id === nextObj.elseGo);
          if (targetStep) {
            return targetStep;
          }
        }
      }
    }

    // If we get here, this step is ready to show
    return step;
  }

  // If all steps are complete, return null
  return null;
}

/**
 * Get suggested chips for a step
 */
export function getSuggestedChipsForStep(step: Step | null): string[] {
  if (!step) return [];
  
  if (step.suggestions && step.suggestions.length > 0) {
    return step.suggestions;
  }

  return [];
}

/**
 * Build "what we know so far" display array
 */
export function buildWhatWeKnow(
  flow: FlowPackage,
  slots: Record<string, any>
): Array<{ label: string; value: string }> {
  const whatWeKnow: Array<{ label: string; value: string }> = [];

  for (const slot of flow.slots) {
    const value = slots[slot.key];
    if (value !== undefined && value !== null && value !== '') {
      whatWeKnow.push({
        label: slot.label,
        value: String(value),
      });
    }
  }

  return whatWeKnow;
}


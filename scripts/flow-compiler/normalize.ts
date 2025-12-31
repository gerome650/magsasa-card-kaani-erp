import { ParsedFlow } from './parseMarkdown';
import { FlowPackage } from '../../server/ai/flows/types';

/**
 * Convert parsed flow to normalized FlowPackage format
 * Ensures stable ordering and consistent structure
 */
export function normalizeToFlowPackage(parsed: ParsedFlow): FlowPackage {
  // Sort slots by key for stable output
  const sortedSlots = [...parsed.slots].sort((a, b) => a.key.localeCompare(b.key));

  // Sort steps by id for stable output
  const sortedSteps = [...parsed.steps].sort((a, b) => a.id.localeCompare(b.id));

  // Normalize steps (ensure slotKeys array exists, default to empty)
  const normalizedSteps = sortedSteps.map(step => {
    const normalized: any = {
      id: step.id,
      title: step.title || step.id, // Use id as title fallback
      prompt: step.prompt,
      slotKeys: Array.isArray(step.slotKeys) ? step.slotKeys.sort() : [],
    };

    if (step.suggestions && step.suggestions.length > 0) {
      normalized.suggestions = step.suggestions;
    }

    if (step.next) {
      normalized.next = step.next;
    }

    return normalized;
  });

  return {
    id: parsed.metadata.id,
    version: parsed.metadata.version,
    audience: parsed.metadata.audience,
    dialectsSupported: parsed.metadata.dialectsSupported,
    intro: parsed.metadata.intro,
    slots: sortedSlots.map(slot => {
      const normalized: any = {
        key: slot.key,
        label: slot.label,
        type: slot.type,
        required: slot.required,
      };

      // Only include optional fields if they have values
      if (slot.options && slot.options.length > 0) {
        normalized.options = slot.options.map(opt => ({
          value: opt.value,
          label: opt.label,
        }));
      }

      if (slot.validation) {
        normalized.validation = {};
        if (slot.validation.min !== undefined) normalized.validation.min = slot.validation.min;
        if (slot.validation.max !== undefined) normalized.validation.max = slot.validation.max;
        if (slot.validation.pattern) normalized.validation.pattern = slot.validation.pattern;
        if (Object.keys(normalized.validation).length === 0) {
          delete normalized.validation;
        }
      }

      if (slot.saveToProfile) {
        normalized.saveToProfile = true;
      }

      if (slot.profileField) {
        normalized.profileField = slot.profileField;
      }

      return normalized;
    }),
    steps: normalizedSteps,
  };
}


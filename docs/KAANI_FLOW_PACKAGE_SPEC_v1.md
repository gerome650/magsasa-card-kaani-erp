# KaAni Flow Package Specification v1.0

## Overview

Flow Packages are JSON files that define structured conversation flows for KaAni AI. They enable guided prompts, slot filling, and context-aware responses while maintaining backward compatibility with free-form chat.

## File Structure

Flow packages are stored in `client/src/features/kaani/flows/v1/` with naming convention:
```
{audience}.{flowId}.flow.json
```

Example:
- `loan_officer.default.flow.json`
- `farmer.default.flow.json`

## JSON Schema

### Root Object: FlowPackage

```typescript
{
  id: string;                    // Unique identifier, e.g., "loan_officer.default"
  version: string;               // Version string, e.g., "1.0"
  audience: "loan_officer" | "farmer";
  dialectsSupported: string[];   // e.g., ["tagalog", "cebuano", "english"]
  intro: {
    title: string;
    description: string;
  };
  slots: Slot[];
  steps: Step[];
  reportTemplate?: ReportTemplate;
}
```

### Slot

Defines data fields that can be collected during the conversation.

```typescript
{
  key: string;                   // Stable identifier, e.g., "location.province"
  label: string;                 // Human-readable label
  type: "select" | "text" | "number" | "date" | "boolean";
  required: boolean;
  options?: {                    // Required if type="select"
    value: string;
    label: string;
  }[];
  validation?: {
    min?: number;                // For type="number"
    max?: number;                // For type="number"
    pattern?: string;            // Regex pattern for type="text"
  };
  saveToProfile?: boolean;       // If true, save to farmer_profiles
  profileField?: string;         // Field name in farmer_profiles table
}
```

### Step

Defines a conversation step with prompts and navigation logic.

```typescript
{
  id: string;                    // Unique step identifier
  title: string;                 // Step title
  prompt: string;                // Prompt text for this step
  slotKeys: string[];            // Slots collected in this step
  suggestions?: string[];        // Suggested prompts/chips to show
  next?: string | {              // Navigation logic
    when: Condition[];
    go: string;                  // Step ID to go to if conditions match
    elseGo?: string;             // Step ID if conditions don't match
  };
}
```

### Condition

Used in step navigation logic.

```typescript
{
  slotKey: string;               // Slot key to check
  op: "equals" | "notEquals" | "exists" | "missing" | "gt" | "lt" | "in";
  value?: string | number | boolean | string[];  // Value to compare (not needed for exists/missing)
}
```

### ReportTemplate (Optional)

Defines report structure (not implemented in v1, structure only).

```typescript
{
  format: "markdown";
  sections: {
    title: string;
    body: string;                // Template string with slot placeholders
  }[];
}
```

## Profile Field Mapping

When `saveToProfile: true`, the slot value is saved to `farmer_profiles.{profileField}`.

Supported profile fields (must match schema):
- `province`
- `municipality`
- `barangay`
- `cropPrimary`
- `farmSize`
- `averageYield`
- `soilType`
- `irrigationType`
- etc.

## Runtime Behavior

1. **Flow Loading**: Flow packages are loaded from disk at runtime and cached in memory.
2. **Validation**: JSON is validated against Zod schema. Invalid flows return `null` (graceful fallback).
3. **Slot Updates**: When slots are provided in `sendLeadMessage`, slots with `saveToProfile: true` update `farmer_profiles`.
4. **Context Enhancement**: Flow intro is prepended to conversation context if available.
5. **Suggestions**: Next suggestions are derived from the current step's `suggestions` array.

## Backward Compatibility

- If flow package is missing or invalid, KaAni falls back to normal free-form chat.
- Flow packages are optional enhancements, not required for basic chat functionality.
- Existing endpoints (`kaani.sendMessage`, `kaani.sendConversationMessage`) are unchanged.

## Example

See:
- `client/src/features/kaani/flows/v1/loan_officer.default.flow.json`
- `client/src/features/kaani/flows/v1/farmer.default.flow.json`

## Future Enhancements

- Step navigation based on conditions
- Multi-step flows with branching logic
- Report generation from filled slots
- Dynamic slot options based on previous answers
- Flow versioning and migration




# Flow Authoring Guide for John (Pepoy)

This guide explains how to write KaAni flows in Markdown format.

## Quick Start

1. Copy `templates/flow_authoring_template.md` to create a new flow
2. Fill in the YAML frontmatter (metadata)
3. Define slots (fields to collect)
4. Define steps (conversation flow)
5. Run: `pnpm flow:compile your_flow.md`

## File Structure

A flow Markdown file has three parts:

1. **YAML Frontmatter** (metadata)
2. **Slots Section** (fields to collect)
3. **Steps Section** (conversation flow)

Example:
```markdown
---
id: farmer.default
version: 1.0
audience: farmer
dialectsSupported: [tagalog, cebuano, english]
title: Farmer Assistant
description: Ako si KaAni, ang iyong assistant para sa pagsasaka.
---

## Slots
... (slot definitions)

## Steps
... (step definitions)
```

## YAML Frontmatter

Required fields:
- `id`: Unique flow identifier (e.g., "farmer.default")
- `version`: Version string (e.g., "1.0")
- `audience`: Either "farmer" or "loan_officer"
- `dialectsSupported`: Array of supported dialects (e.g., [tagalog, cebuano, english])
- `title`: Display title
- `description`: Brief description shown to users

Example:
```yaml
---
id: farmer.default
version: 1.0
audience: farmer
dialectsSupported: [tagalog, cebuano, english]
title: Farmer Assistant
description: Ako si KaAni, ang iyong assistant para sa pagsasaka.
---
```

## Slots Section

Slots define the structured data fields you want to collect from users.

Format:
```markdown
## Slots

### slot.key.name

- **key**: slot.key.name
- **label**: Display Label
- **type**: text | number | select | date | boolean
- **required**: true | false
- **saveToProfile**: true | false (optional)
- **profileField**: field_name (optional, if saveToProfile is true)
```

### Slot Types

- **text**: Free-form text input
- **number**: Numeric value
- **select**: Choice from options (requires options list)
- **date**: Date value
- **boolean**: Yes/No or True/False

### Slot with Options (Select Type)

```markdown
### farmer.cropType

- **key**: farmer.cropType
- **label**: Crop Type
- **type**: select
- **required**: true
- **options**:
  - rice: Rice
  - corn: Corn
  - vegetables: Vegetables
```

### Slot with Validation

```markdown
### farmer.farmSize

- **key**: farmer.farmSize
- **label**: Farm Size (hectares)
- **type**: number
- **required**: false
- **validation**:
  - min: 0
  - max: 1000
- **saveToProfile**: true
- **profileField**: farmSize
```

## Steps Section

Steps define the conversation flow with prompts and suggested responses.

Format:
```markdown
## Steps

### Step: start

**Prompt:**
Kumusta! Ako si KaAni. Paano kita matutulungan ngayon?

**Chips:**
- Paano magtanim ng palay?
- Ano ang dapat gawin kapag may peste?
- Kailan ang tamang panahon para mag-ani?

**Required Slots:**
- (leave empty or list slot keys)

**Next:**
(optional: step ID or leave empty)
```

### Step Fields

- **Step ID**: Extracted from header (e.g., `### Step: start` -> id: "start")
- **Prompt**: The question/prompt text (can be multi-line)
- **Chips**: Suggested quick responses (optional)
- **Required Slots**: Slot keys that must be filled before this step shows (optional)
- **Next**: Next step ID (optional, for navigation)

### Step Prompt (Multi-line)

```markdown
**Prompt:**
Kumusta! Ako si KaAni.

Ako ay makakatulong sa iyong pagsasaka. Maaari akong tumulong sa:
- Pagtatanim ng palay
- Pagkontrol ng peste
- Tamang panahon ng pag-aani

Paano kita matutulungan ngayon?
```

## Complete Example

See `templates/example_farmer_flow.md` for a complete example.

## Compiling Your Flow

Once you've written your flow:

```bash
pnpm flow:compile your_flow.md
```

The compiler will:
1. Parse your Markdown
2. Validate against the schema
3. Generate `client/src/features/kaani/flows/v1/<audience>.default.flow.json`

## Validating Flows

To validate all flow JSON files:

```bash
pnpm flow:validate
```

This checks all `*.flow.json` files against the Zod schema and reports any errors.

## Common Errors and Fixes

### Error: "Missing required frontmatter field: id"
**Fix**: Add `id: your.flow.id` in the YAML frontmatter

### Error: "Invalid audience (must be 'loan_officer' or 'farmer')"
**Fix**: Set `audience: farmer` or `audience: loan_officer` (lowercase, exact match)

### Error: "Slot missing required key or label"
**Fix**: Ensure each slot block has both `- **key**:` and `- **label**:` fields

### Error: "Step missing required id or prompt"
**Fix**: Ensure each step has a valid header (`### Step: step_id`) and a `**Prompt:**` field

## Tips

1. **Start Simple**: Begin with one step and a few slots, then expand
2. **Use Templates**: Copy `templates/flow_authoring_template.md` as a starting point
3. **Test Often**: Compile frequently to catch errors early
4. **Validate**: Run `pnpm flow:validate` before committing
5. **Naming**: Use descriptive slot keys (e.g., `location.province` not `prov`)

## Need Help?

- Check `templates/example_farmer_flow.md` and `templates/example_loan_officer_flow.md` for examples
- Run `pnpm flow:validate` to see validation errors
- Check `docs/KAANI_FLOW_PACKAGE_SPEC_v1.md` for schema details


import * as fs from 'fs';
import * as path from 'path';
import { FlowCompilerError, errorAt } from './errors';

export interface ParsedFlow {
  metadata: {
    id: string;
    version: string;
    audience: 'loan_officer' | 'farmer';
    dialectsSupported: string[];
    intro: {
      title: string;
      description: string;
    };
  };
  slots: Array<{
    key: string;
    label: string;
    type: 'select' | 'text' | 'number' | 'date' | 'boolean';
    required: boolean;
    options?: Array<{ value: string; label: string }>;
    validation?: {
      min?: number;
      max?: number;
      pattern?: string;
    };
    saveToProfile?: boolean;
    profileField?: string;
  }>;
  steps: Array<{
    id: string;
    title: string;
    prompt: string;
    slotKeys: string[];
    suggestions?: string[];
    next?: string | {
      when: Array<{
        slotKey: string;
        op: 'equals' | 'notEquals' | 'exists' | 'missing' | 'gt' | 'lt' | 'in';
        value?: string | number | boolean | string[];
      }>;
      go: string;
      elseGo?: string;
    };
  }>;
}

/**
 * Simple YAML frontmatter parser (basic implementation)
 */
function parseFrontmatter(content: string): { frontmatter: Record<string, any>; body: string } {
  const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
  const match = content.match(frontmatterRegex);

  if (!match) {
    return { frontmatter: {}, body: content };
  }

  const frontmatterText = match[1];
  const body = match[2];

  // Simple YAML parser (only supports key: value pairs)
  const frontmatter: Record<string, any> = {};
  const lines = frontmatterText.split('\n');
  let lineNum = 1;

  for (const line of lines) {
    lineNum++;
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const colonIndex = trimmed.indexOf(':');
    if (colonIndex === -1) continue;

    const key = trimmed.substring(0, colonIndex).trim();
    let value = trimmed.substring(colonIndex + 1).trim();

    // Remove quotes if present
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    // Handle arrays (simple format: [item1, item2] or - item1)
    if (value.startsWith('[') && value.endsWith(']')) {
      const items = value.slice(1, -1).split(',').map(s => s.trim().replace(/^["']|["']$/g, ''));
      frontmatter[key] = items;
    } else {
      frontmatter[key] = value;
    }
  }

  return { frontmatter, body };
}

/**
 * Parse slots section
 */
function parseSlots(body: string, file: string, startLine: number): ParsedFlow['slots'] {
  const slots: ParsedFlow['slots'] = [];
  const slotsRegex = /^##\s+Slots\s*$/m;
  const slotsMatch = body.match(slotsRegex);

  if (!slotsMatch) {
    return slots;
  }

  const slotsStart = slotsMatch.index! + slotsMatch[0].length;
  const nextSection = body.indexOf('\n## ', slotsStart);
  const slotsSection = nextSection === -1
    ? body.substring(slotsStart)
    : body.substring(slotsStart, nextSection);

  const slotBlocks = slotsSection.split(/\n###\s+/).filter(Boolean);

  for (const block of slotBlocks) {
    const lines = block.split('\n');
    const titleLine = lines[0].trim();
    if (!titleLine) continue;

    const slot: any = {
      key: '',
      label: '',
      type: 'text',
      required: false,
    };

    // Parse slot definition
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      if (line.startsWith('- **key**:')) {
        slot.key = line.replace(/^-\s*\*\*key\*\*:\s*/, '').trim();
      } else if (line.startsWith('- **label**:')) {
        slot.label = line.replace(/^-\s*\*\*label\*\*:\s*/, '').trim();
      } else if (line.startsWith('- **type**:')) {
        const type = line.replace(/^-\s*\*\*type\*\*:\s*/, '').trim();
        if (['select', 'text', 'number', 'date', 'boolean'].includes(type)) {
          slot.type = type;
        }
      } else if (line.startsWith('- **required**:')) {
        const required = line.replace(/^-\s*\*\*required\*\*:\s*/, '').trim().toLowerCase();
        slot.required = required === 'true' || required === 'yes';
      } else if (line.startsWith('- **options**:')) {
        // Parse options list
        slot.options = [];
        i++;
        while (i < lines.length && lines[i].trim().startsWith('  - ')) {
          const optLine = lines[i].trim().replace(/^-\s*/, '');
          // Format: "value: Label" or just "value"
          const colonIndex = optLine.indexOf(':');
          if (colonIndex !== -1) {
            slot.options.push({
              value: optLine.substring(0, colonIndex).trim(),
              label: optLine.substring(colonIndex + 1).trim(),
            });
          } else {
            slot.options.push({ value: optLine, label: optLine });
          }
          i++;
        }
        i--; // Adjust for loop increment
      } else if (line.startsWith('- **saveToProfile**:')) {
        const save = line.replace(/^-\s*\*\*saveToProfile\*\*:\s*/, '').trim().toLowerCase();
        slot.saveToProfile = save === 'true' || save === 'yes';
      } else if (line.startsWith('- **profileField**:')) {
        slot.profileField = line.replace(/^-\s*\*\*profileField\*\*:\s*/, '').trim();
      }
    }

    if (!slot.key || !slot.label) {
      errorAt(`Slot missing required key or label in block: ${titleLine}`, file, startLine + slotsStart);
    }

    slots.push(slot);
  }

  return slots;
}

/**
 * Parse steps section
 */
function parseSteps(body: string, file: string, startLine: number): ParsedFlow['steps'] {
  const steps: ParsedFlow['steps'] = [];
  const stepsRegex = /^##\s+Steps\s*$/m;
  const stepsMatch = body.match(stepsRegex);

  if (!stepsMatch) {
    return steps;
  }

  const stepsStart = stepsMatch.index! + stepsMatch[0].length;
  const nextSection = body.indexOf('\n## ', stepsStart);
  const stepsSection = nextSection === -1
    ? body.substring(stepsStart)
    : body.substring(stepsStart, nextSection);

  // Split by ### headers (step blocks)
  const stepBlocks = stepsSection.split(/\n###\s+/).filter(Boolean);

  for (const block of stepBlocks) {
    const lines = block.split('\n');
    const titleLine = lines[0].trim();
    if (!titleLine) continue;

    const step: any = {
      id: '',
      title: '',
      prompt: '',
      slotKeys: [],
    };

    // Extract step ID from title (e.g., "### Step: start" -> id: "start")
    const idMatch = titleLine.match(/^Step:\s*(.+)$/i);
    if (idMatch) {
      step.id = idMatch[1].trim();
      step.title = idMatch[1].trim();
    } else {
      // Fallback: use title as id (sanitized)
      step.id = titleLine.toLowerCase().replace(/\s+/g, '_');
      step.title = titleLine;
    }

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line || line.startsWith('#')) continue;

      // Parse Prompt (can be multi-line)
      if (line.match(/^\*\*Prompt:\*\*/)) {
        const promptLines: string[] = [];
        i++;
        // Collect all lines until next ** field or end
        while (i < lines.length) {
          const nextLine = lines[i];
          if (nextLine.trim().startsWith('**')) {
            i--; // Back up to process this line in next iteration
            break;
          }
          promptLines.push(nextLine);
          i++;
        }
        step.prompt = promptLines.join('\n').trim();
        continue;
      }

      // Parse Chips (list items)
      if (line.match(/^\*\*Chips:\*\*/)) {
        step.suggestions = [];
        i++;
        while (i < lines.length) {
          const chipLine = lines[i].trim();
          if (!chipLine || (!chipLine.startsWith('- ') && !chipLine.startsWith('  - '))) {
            break;
          }
          const chip = chipLine.replace(/^(\s*-\s*|\s+)/, '').trim();
          if (chip) {
            step.suggestions.push(chip);
          }
          i++;
        }
        i--; // Adjust for loop increment
        continue;
      }

      // Parse Required Slots
      if (line.match(/^\*\*Required Slots:\*\*/)) {
        step.slotKeys = [];
        i++;
        while (i < lines.length) {
          const slotLine = lines[i].trim();
          if (!slotLine || (!slotLine.startsWith('- ') && !slotLine.startsWith('  - '))) {
            break;
          }
          const slotKey = slotLine.replace(/^(\s*-\s*|\s+)/, '').trim();
          if (slotKey) {
            step.slotKeys.push(slotKey);
          }
          i++;
        }
        i--; // Adjust for loop increment
        continue;
      }

      // Parse Next (simple step ID for now)
      const nextMatch = line.match(/^\*\*Next:\*\*\s*(.+)$/);
      if (nextMatch) {
        const nextText = nextMatch[1].trim();
        // For now, just store as string (conditional logic can be added later)
        if (nextText) {
          step.next = nextText;
        }
        continue;
      }
    }

    if (!step.id || !step.prompt) {
      errorAt(`Step missing required id or prompt in block: ${titleLine}`, file, startLine + stepsStart);
    }

    steps.push(step);
  }

  return steps;
}

/**
 * Parse Markdown flow file
 */
export function parseMarkdownFlow(filePath: string): ParsedFlow {
  const content = fs.readFileSync(filePath, 'utf-8');
  const { frontmatter, body } = parseFrontmatter(content);

  // Extract metadata from frontmatter
  if (!frontmatter.id) {
    errorAt('Missing required frontmatter field: id', filePath, 1);
  }
  if (!frontmatter.version) {
    errorAt('Missing required frontmatter field: version', filePath, 1);
  }
  if (!frontmatter.audience || !['loan_officer', 'farmer'].includes(frontmatter.audience)) {
    errorAt('Missing or invalid frontmatter field: audience (must be "loan_officer" or "farmer")', filePath, 1);
  }

  const dialectsSupported = Array.isArray(frontmatter.dialectsSupported)
    ? frontmatter.dialectsSupported
    : frontmatter.dialectsSupported
      ? [frontmatter.dialectsSupported]
      : ['tagalog', 'cebuano', 'english'];

  const metadata = {
    id: frontmatter.id,
    version: frontmatter.version,
    audience: frontmatter.audience as 'loan_officer' | 'farmer',
    dialectsSupported,
    intro: {
      title: frontmatter.title || frontmatter.id,
      description: frontmatter.description || '',
    },
  };

  // Parse body sections
  const slots = parseSlots(body, filePath, 1);
  const steps = parseSteps(body, filePath, 1);

  return {
    metadata,
    slots,
    steps,
  };
}


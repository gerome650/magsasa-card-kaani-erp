export type KaAniAudience = 'loan_officer' | 'farmer';
export type KaAniDialect = 'tagalog' | 'cebuano' | 'english';

export interface Slot {
  key: string;
  label: string;
  type: 'select' | 'text' | 'number' | 'date' | 'boolean';
  required: boolean;
  options?: { value: string; label: string }[];
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
  saveToProfile?: boolean;
  profileField?: string;
}

export interface Condition {
  slotKey: string;
  op: 'equals' | 'notEquals' | 'exists' | 'missing' | 'gt' | 'lt' | 'in';
  value?: string | number | boolean | string[];
}

export interface Step {
  id: string;
  title: string;
  prompt: string;
  slotKeys: string[];
  suggestions?: string[];
  next?: string | {
    when: Condition[];
    go: string;
    elseGo?: string;
  };
}

export interface ReportTemplate {
  format: 'markdown';
  sections: {
    title: string;
    body: string;
  }[];
}

export interface FlowPackage {
  id: string;
  version: string;
  audience: KaAniAudience;
  dialectsSupported: string[];
  intro: {
    title: string;
    description: string;
  };
  slots: Slot[];
  steps: Step[];
  reportTemplate?: ReportTemplate;
}




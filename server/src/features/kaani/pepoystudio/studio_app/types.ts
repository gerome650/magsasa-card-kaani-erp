export enum Audience {
  Farmer = 'farmer',
  Technician = 'technician',
  LoanMatching = 'loan_matching',
  RiskScoring = 'risk_scoring',
}

export enum Dialect {
  Tagalog = 'Tagalog',
  Cebuano = 'Cebuano',
  Ilonggo = 'Ilonggo',
  Ilocano = 'Ilocano',
  Pangalatok = 'Pangalatok',
  Kapampangan = 'Kapampangan',
  Bicolano = 'Bicolano',
  Waray = 'Waray',
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
  choices?: string[];
  originalChoices?: string[];
}

export interface GeminiResponse {
  type: 'question' | 'diagnosis';
  text: string;
  choices?: string[];
}

// New types for managing interactive flows
// FIX: Removed duplicate and conflicting type declaration for FlowType.
export type FlowType = 'chat' | 'planting_guide' | 'diagnosis_guide' | 'diagnosis_chat';

export interface FlowState {
  type: FlowType;
  stepId: string;
  answers: Record<string, string>;
}
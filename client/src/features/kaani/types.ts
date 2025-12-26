export type KaAniAudience = 'loan_officer' | 'farmer';

export type KaAniDialect = 'tagalog' | 'cebuano' | 'english';

export type KaAniRole = 'user' | 'assistant' | 'system' | 'tool';

export interface KaAniUiMessage {
  role: KaAniRole;
  content: string;
  createdAt?: string;
}

export interface KaAniFlowState {
  audience: KaAniAudience;
  dialect: KaAniDialect;
  mode: 'guided' | 'free';
}

export interface StarterPrompt {
  label: string;
  message: string;
}


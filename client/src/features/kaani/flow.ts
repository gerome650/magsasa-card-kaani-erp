import { KaAniAudience, StarterPrompt } from './types';

/**
 * Get starter prompts for the given audience.
 * Includes "Sample Formats" prompts for both audiences.
 */
export function getStarterPrompts(audience: KaAniAudience): StarterPrompt[] {
  if (audience === 'loan_officer') {
    return [
      {
        label: 'Analyze farmer risk profile',
        message: 'Analyze ang risk profile ng farmer na may sumusunod na profile...',
      },
      {
        label: 'Interpret AgScore',
        message: 'Ipaliwanag ang AgScore na ito at kung ano ang ibig sabihin para sa loan application...',
      },
      {
        label: 'Underwriting considerations',
        message: 'Ano ang mga dapat kong isaalang-alang sa underwriting para sa farmer na ito?',
      },
      {
        label: 'Sample: Risk Assessment Format',
        message: 'Ibigay ang risk assessment format para sa loan officer review.',
      },
      {
        label: 'Sample: Credit Decision Template',
        message: 'Ipakita ang template para sa credit decision documentation.',
      },
    ];
  }

  // farmer prompts
  return [
    {
      label: 'Paano magtanim ng palay?',
      message: 'Paano magtanim ng palay? Anong mga hakbang ang dapat gawin?',
    },
    {
      label: 'Pest control advice',
      message: 'Ano ang dapat gawin kapag may peste sa tanim?',
    },
    {
      label: 'Harvest timing',
      message: 'Kailan ang tamang panahon para mag-ani?',
    },
    {
      label: 'Sample: Farm Record Format',
      message: 'Ibigay ang format para sa pag-record ng farm data.',
    },
    {
      label: 'Sample: Harvest Report Template',
      message: 'Ipakita ang template para sa harvest report.',
    },
  ];
}

/**
 * Normalize user input text (trim whitespace, basic cleanup).
 */
export function normalizeUserText(text: string): string {
  return text.trim();
}

/**
 * Build guided prompt from choice path state and user input.
 * Simple implementation - just returns the user input for now.
 */
export function buildGuidedPrompt(choicePathState: unknown, userInput: string): string {
  // Simple implementation - just return normalized input
  // Can be extended later if needed for guided flows
  return normalizeUserText(userInput);
}


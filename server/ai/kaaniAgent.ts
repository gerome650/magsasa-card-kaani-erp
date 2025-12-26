import { GoogleGenerativeAI } from "@google/generative-ai";

// Default Gemini model for KaAni. Override via GOOGLE_AI_STUDIO_MODEL if needed.
function getModelName(): string {
  const raw = process.env.GOOGLE_AI_STUDIO_MODEL?.trim();

  // If nothing is set, fall back to the default
  if (!raw) {
    return "gemini-1.5-flash";
  }

  // Hardened: Never use gemini-pro (deprecated)
  if (raw === "gemini-pro") {
    return "gemini-1.5-flash";
  }

  return raw;
}

/**
 * Build system prompt based on audience and dialect.
 */
function buildSystemPrompt(
  audience: 'farmer' | 'technician' | 'loan_officer',
  dialect?: 'tagalog' | 'cebuano' | 'english'
): string {
  const dialectInstruction = dialect === 'tagalog' 
    ? 'Sumagot sa Tagalog (Filipino).'
    : dialect === 'cebuano'
    ? 'Sumagot sa Cebuano.'
    : 'Respond in English.';

  if (audience === 'loan_officer') {
    return `You are KaAni, an AI assistant for loan officers using the MAGSASA-CARD platform. You help with:
- Farmer profile analysis and risk assessment
- AgScore™ system interpretation
- Loan underwriting considerations (NOT guarantees)
- Agricultural context for credit decisions

${dialectInstruction}

IMPORTANT: All recommendations are considerations for underwriting, not guarantees. Maintain BSP-friendly posture: be clear about limitations, avoid absolute statements, and emphasize that final decisions require human review.`;
  }

  if (audience === 'technician') {
    return `You are KaAni, an agricultural technician assistant for the MAGSASA-CARD platform. You help with:
- Technical diagnostics and soil analysis
- Crop management recommendations
- Pest and disease identification
- Agricultural best practices

${dialectInstruction}

Provide technical, detailed advice suitable for agricultural professionals.`;
  }

  // Default: farmer
  return `You are KaAni, an AI assistant for Filipino farmers using the MAGSASA-CARD platform. You help with:
- Rice farming advice (pagtatanim ng palay)
- CARD MRI loan information and AgScore™ system
- Pest control recommendations
- Market prices and harvest tracking
- Weather information
- General agricultural guidance

${dialectInstruction}

Be helpful, friendly, and provide practical agricultural advice in simple language.`;
}

/**
 * Run KaAni agent with Gemini AI.
 * 
 * @param params - Agent parameters
 * @returns Promise with reply text
 */
export async function runKaAniAgent(params: {
  audience: 'farmer' | 'technician' | 'loan_officer';
  dialect?: 'tagalog' | 'cebuano' | 'english';
  farmerProfileId: string;
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
}): Promise<{ replyText: string }> {
  const apiKey = process.env.GOOGLE_AI_STUDIO_API_KEY;
  if (!apiKey) {
    throw new Error("Google AI Studio API key not configured");
  }

  const modelName = getModelName();
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: modelName });

  // Build system prompt
  const systemPrompt = buildSystemPrompt(params.audience, params.dialect);

  // Convert messages to Gemini format
  // Gemini expects: { role: 'user' | 'model', parts: [{ text: string }] }
  // Note: 'system' messages are not directly supported in Gemini chat history,
  // so we'll prepend the system prompt to the first message if needed
  const history = params.messages
    .filter(msg => msg.role !== 'system') // Filter out system messages (handled via systemPrompt)
    .map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }],
    }));

  // Start chat with history
  const chat = model.startChat({
    history,
    generationConfig: {
      maxOutputTokens: 1000,
      temperature: 0.7,
    },
  });

  // Get the latest user message (should be the last one)
  const lastUserMessage = params.messages
    .filter(msg => msg.role === 'user')
    .slice(-1)[0];

  if (!lastUserMessage) {
    throw new Error("No user message found in messages array");
  }

  // Send message with system context if this is the first message
  const fullMessage = history.length === 0
    ? `${systemPrompt}\n\nUser: ${lastUserMessage.content}`
    : lastUserMessage.content;

  const result = await chat.sendMessage(fullMessage);
  const replyText = result.response.text();

  return { replyText };
}


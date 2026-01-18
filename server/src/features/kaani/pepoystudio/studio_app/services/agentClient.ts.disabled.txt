import { createDefaultKaAniAgent, KaAniAgent } from "../agent";
import { Audience, ChatMessage, Dialect, FlowType, GeminiResponse } from "../types";

let agent: KaAniAgent | null = null;

function getAgentInstance(): KaAniAgent {
  if (!agent) {
    agent = createDefaultKaAniAgent();
  }
  return agent;
}

/**
 * Main function para sa UI:
 * - Tawagin mo ito kapag may bagong tanong si user.
 * - This will:
 *   1) Add the user message to history
 *   2) Ask Gemini via getAgronomicAdvice
 *   3) Add the model response to history
 *   4) Return the structured response
 */
export async function sendToKaAni(message: string): Promise<GeminiResponse> {
  const ag = getAgentInstance();
  return ag.send(message);
}

/**
 * Kuhanin ang buong history para sa ChatWindow.
 */
export function getKaAniHistory(): ChatMessage[] {
  const ag = getAgentInstance();
  return ag.getHistory();
}

/**
 * Reset ng agent (bagong session / bagong farmer).
 */
export function resetKaAni() {
  const ag = getAgentInstance();
  ag.reset();
}

/**
 * I-sync ang isang ChatMessage (user o model) papunta sa Agent
 * nang HINDI tumatawag sa Gemini.
 * Ginagamit ito ng decision-tree flows (planting_guide, diagnosis_guide).
 */
export function addMessageToKaAni(message: ChatMessage) {
  const ag = getAgentInstance();
  ag.addMessage(message);
}

/**
 * Palitan on-the-fly ang mode (Farmer vs Technician, dialect, flowType, etc.).
 */
export function configureKaAni(options: {
  audience?: Audience;
  dialect?: Dialect | string;
  flowType?: FlowType;
  isCondensed?: boolean;
}) {
  const ag = getAgentInstance();
  ag.configure(options);
}

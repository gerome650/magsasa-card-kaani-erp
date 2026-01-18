import { Audience, ChatMessage, Dialect, FlowType, GeminiResponse } from "../types";
import { getAgronomicAdvice, translateContent } from "../services/geminiService";

/**
 * KaAniAgent = centralized AI agent wrapper for your whole app.
 * - Maintains its own message history
 * - Knows the audience (Farmer/Technician/etc.)
 * - Knows the dialect and flow type
 * - Uses your existing getAgronomicAdvice() + translateContent()
 */
export class KaAniAgent {
  private messages: ChatMessage[] = [];

  constructor(
    private audience: Audience = Audience.Farmer,
    private dialect: Dialect | string = Dialect.Tagalog,
    private flowType: FlowType = "chat",
    private isCondensed: boolean = false
  ) {}

  /**
   * Main entry point:
   * 1) Adds the user message to history
   * 2) Calls getAgronomicAdvice(...)
   * 3) Adds the model response to history
   * 4) Returns the GeminiResponse (type + text + choices)
   */
  async send(userMessage: string): Promise<GeminiResponse> {
    const user: ChatMessage = {
      role: "user",
      content: userMessage,
    };

    this.messages.push(user);

    const response = await getAgronomicAdvice(
      this.messages,
      this.audience,
      this.dialect,
      this.isCondensed,
      this.flowType
    );

    const modelMessage: ChatMessage = {
      role: "model",
      content: response.text,
      choices: response.choices,
    };

    this.messages.push(modelMessage);

    return response;
  }

  /**
   * Used by the UI decision trees to "sync" messages
   * (both user and model) into the agent history WITHOUT
   * calling the model again.
   */
  addMessage(message: ChatMessage) {
    this.messages.push(message);
  }

  /**
   * Optional helper: translate the last model question + choices
   * to a new dialect using your existing translateContent() helper.
   */
  async translateLastQuestion(targetDialect: string): Promise<void> {
    const last = this.messages[this.messages.length - 1];
    if (!last || last.role !== "model" || !last.choices) return;

    const translated = await translateContent(
      {
        question: last.content,
        choices: last.choices,
      },
      targetDialect
    );

    last.content = translated.question;
    last.choices = translated.choices;
  }

  /**
   * Get full conversation history (for ChatWindow).
   */
  getHistory(): ChatMessage[] {
    return [...this.messages];
  }

  /**
   * Reset conversation (new farmer / new case).
   */
  reset() {
    this.messages = [];
  }

  /**
   * Change agent mode (Farmer/Technician/Loan/Risk, dialect, flow…)
   */
  configure(options: {
    audience?: Audience;
    dialect?: Dialect | string;
    flowType?: FlowType;
    isCondensed?: boolean;
  }) {
    if (options.audience !== undefined) this.audience = options.audience;
    if (options.dialect !== undefined) this.dialect = options.dialect;
    if (options.flowType !== undefined) this.flowType = options.flowType;
    if (options.isCondensed !== undefined) this.isCondensed = options.isCondensed;
  }
}

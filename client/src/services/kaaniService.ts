/**
 * KaAni AI Chat Service
 * 
 * This service handles communication with the KaAni AI assistant via tRPC.
 * Uses Google Gemini API on the backend for real AI responses.
 */

import { trpc } from "@/lib/trpc";

interface KaAniMessage {
  role: "user" | "assistant";
  content: string;
}

/**
 * Send a message to KaAni AI and get a response
 * @param message - User's message
 * @param conversationHistory - Optional conversation history for context
 * @returns AI response text
 */
export async function sendMessageToKaAni(
  message: string,
  conversationHistory?: KaAniMessage[]
): Promise<string> {
  try {
    const result = await trpc.kaani.sendMessage.mutate({
      message,
      conversationHistory,
    });
    
    return result.response;
  } catch (error) {
    console.error("[KaAni] Error sending message:", error);
    
    // User-friendly error messages
    if (error instanceof Error) {
      if (error.message.includes("API key not configured")) {
        throw new Error("KaAni AI is not configured. Please contact support.");
      }
      if (error.message.includes("UNAUTHORIZED")) {
        throw new Error("Please log in to use KaAni AI.");
      }
      if (error.message.includes("quota")) {
        throw new Error("API quota exceeded. Please try again later.");
      }
    }
    
    throw new Error("Failed to get response from KaAni. Please try again.");
  }
}

/**
 * Load chat history from database
 * @param limit - Maximum number of messages to load
 * @returns Array of chat messages
 */
export async function loadChatHistory(limit: number = 50): Promise<KaAniMessage[]> {
  try {
    const messages = await trpc.kaani.getHistory.query({ limit });
    return messages.map(msg => ({
      role: msg.role,
      content: msg.content,
    }));
  } catch (error) {
    console.error("[KaAni] Error loading chat history:", error);
    return [];
  }
}

/**
 * Clear all chat history for current user
 */
export async function clearChatHistory(): Promise<void> {
  try {
    await trpc.kaani.clearHistory.mutate();
  } catch (error) {
    console.error("[KaAni] Error clearing chat history:", error);
    throw new Error("Failed to clear chat history. Please try again.");
  }
}

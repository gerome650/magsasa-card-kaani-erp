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
 * Send a message to KaAni AI with streaming response
 * @param message - User's message
 * @param conversationHistory - Optional conversation history for context
 * @param onChunk - Callback function called for each text chunk
 * @returns Complete AI response text
 */
export async function sendMessageToKaAniStream(
  message: string,
  conversationHistory: KaAniMessage[] | undefined,
  onChunk: (chunk: string) => void
): Promise<string> {
  try {
    const result = await trpc.kaani.sendMessageStream.mutate({
      message,
      conversationHistory,
    });
    
    // Simulate streaming by displaying chunks with delay
    let displayedText = "";
    const chunks = result.chunks || [];
    
    // If we have chunks, stream them word-by-word
    if (chunks.length > 0) {
      for (const chunk of chunks) {
        // Split chunk into words for smoother streaming
        const words = chunk.split(/\s+/);
        for (let i = 0; i < words.length; i++) {
          const word = words[i];
          displayedText += (i === 0 && displayedText ? " " : "") + word;
          onChunk(displayedText);
          
          // Add small delay between words for streaming effect
          await new Promise(resolve => setTimeout(resolve, 30));
        }
      }
    } else {
      // Fallback: split response into words and stream
      const words = result.response.split(/\s+/);
      for (let i = 0; i < words.length; i++) {
        const word = words[i];
        displayedText += (i > 0 ? " " : "") + word;
        onChunk(displayedText);
        
        // Add small delay between words for streaming effect
        await new Promise(resolve => setTimeout(resolve, 30));
      }
    }
    
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
 * Send a message to KaAni AI with TRUE real-time SSE streaming
 * Uses tRPC subscriptions for genuine real-time chunk delivery
 * @param message - User's message
 * @param conversationHistory - Optional conversation history for context
 * @param onChunk - Callback function called for each text chunk as it arrives
 * @returns Complete AI response text
 */
export async function sendMessageToKaAniSSE(
  message: string,
  conversationHistory: KaAniMessage[] | undefined,
  onChunk: (chunk: string) => void
): Promise<string> {
  return new Promise((resolve, reject) => {
    let fullResponse = "";
    let category = "";

    // Create subscription for real-time streaming
    const subscription = trpc.kaani.sendMessageStreamSSE.subscribe(
      {
        message,
        conversationHistory,
      },
      {
        onData: (data) => {
          if (data.type === 'chunk') {
            // Append chunk to full response
            fullResponse += data.content;
            // Immediately update UI with new chunk
            onChunk(fullResponse);
          } else if (data.type === 'done') {
            // Stream completed
            fullResponse = data.content;
            category = data.category || "general";
            onChunk(fullResponse);
            subscription.unsubscribe();
            resolve(fullResponse);
          } else if (data.type === 'error') {
            console.error('[KaAni SSE] Error:', data.content);
            subscription.unsubscribe();
            reject(new Error(data.content));
          }
        },
        onError: (error) => {
          console.error('[KaAni SSE] Subscription error:', error);
          subscription.unsubscribe();
          
          // User-friendly error messages
          if (error instanceof Error) {
            if (error.message.includes("API key not configured")) {
              reject(new Error("KaAni AI is not configured. Please contact support."));
            } else if (error.message.includes("UNAUTHORIZED")) {
              reject(new Error("Please log in to use KaAni AI."));
            } else if (error.message.includes("quota")) {
              reject(new Error("API quota exceeded. Please try again later."));
            } else {
              reject(new Error("Failed to get response from KaAni. Please try again."));
            }
          } else {
            reject(new Error("Failed to get response from KaAni. Please try again."));
          }
        },
      }
    );
  });
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

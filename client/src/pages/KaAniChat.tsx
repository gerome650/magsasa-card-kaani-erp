import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Send, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { sendMessageToKaAniSSE } from "@/services/kaaniService";
import { toast } from "sonner";
import TypingIndicator from "@/components/TypingIndicator";

import { KaAniSubHeader } from "@/components/KaAniSubHeader";
import { SuggestedPrompts } from "@/components/SuggestedPrompts";
import { SampleFormatsDialog } from "@/components/SampleFormatsDialog";
import { ConversationManager } from "@/components/ConversationManager";
import { KaAniEmptyState } from "@/components/KaAniEmptyState";
import { MarkdownMessage } from "@/components/MarkdownMessage";
import { trpcClient } from "@/lib/trpcClient";
import { useConnectionHealth } from "@/hooks/useConnectionHealth";
import { ConnectionStatus } from "@/components/ConnectionStatus";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface Conversation {
  id: number;
  title: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

// Helper to safely convert updatedAt/createdAt to timestamp
const toTime = (value: unknown): number => {
  if (!value) return 0;
  
  if (value instanceof Date) return value.getTime();
  
  // Handle string/number timestamps like "2025-11-19T08:37:00Z" or ms
  const d = new Date(value as any);
  const t = d.getTime();
  return Number.isNaN(t) ? 0 : t;
};

export default function KaAniChat() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isWaitingForFirstChunk, setIsWaitingForFirstChunk] = useState(false);
  const [retryAttempt, setRetryAttempt] = useState<{ current: number; max: number } | null>(null);
  const [activeProfile, setActiveProfile] = useState<'farmer' | 'technician' | 'loanMatching' | 'riskScoring'>('farmer');
  const [selectedDialect, setSelectedDialect] = useState("tagalog");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Connection health monitoring
  const connectionHealth = useConnectionHealth();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auto-resize textarea as user types
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const newHeight = Math.min(textareaRef.current.scrollHeight, 200);
      textareaRef.current.style.height = `${newHeight}px`;
    }
  }, [input]);

  // Load conversations on mount
  useEffect(() => {
    const loadConversations = async () => {
      try {
        const convos = await trpcClient.conversations.list.query();
        // Sort conversations by updatedAt (most recent first) using safe toTime helper
        const sorted = [...(convos as Conversation[])].sort(
          (a, b) => toTime(b.updatedAt) - toTime(a.updatedAt)
        );
        setConversations(sorted);
        
        // Auto-select the most recent conversation if exists
        if (sorted.length > 0) {
          setActiveConversationId(sorted[0].id);
        } else {
          // Create first conversation automatically
          await handleNewConversation();
        }
      } catch (error) {
        console.error("Error loading conversations:", error);
        toast.error("Failed to load conversations");
      } finally {
        setIsLoadingConversations(false);
      }
    };

    loadConversations();
  }, []);

  // Load messages when active conversation changes
  useEffect(() => {
    if (activeConversationId) {
      loadMessages(activeConversationId);
    }
  }, [activeConversationId]);

  const loadMessages = async (conversationId: number) => {
    setIsLoadingMessages(true);
    try {
      const msgs = await trpcClient.conversations.getMessages.query({ conversationId });
      const formattedMessages: Message[] = msgs.map((msg: any) => ({
        id: msg.id.toString(),
        role: msg.role as "user" | "assistant",
        content: msg.content,
        timestamp: new Date(msg.createdAt),
      }));
      setMessages(formattedMessages);
    } catch (error) {
      console.error("Error loading messages:", error);
      toast.error("Failed to load messages");
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const handleNewConversation = async () => {
    try {
      const newConvo = await trpcClient.conversations.create.mutate({
        title: "New Conversation",
      });
      
      const conversation = newConvo as Conversation;
      setConversations((prev) => [conversation, ...prev]);
      setActiveConversationId(conversation.id);
      setMessages([]);
      
      toast.success("New conversation started");
    } catch (error) {
      console.error("Error creating conversation:", error);
      toast.error("Failed to create conversation");
    }
  };

  const handleSelectConversation = async (id: number) => {
    setActiveConversationId(id);
  };

  const handleDeleteConversation = async (id: number) => {
    try {
      await trpcClient.conversations.delete.mutate({ id });
      
      setConversations((prev) => prev.filter((c) => c.id !== id));
      
      if (activeConversationId === id) {
        const remaining = conversations.filter((c) => c.id !== id);
        if (remaining.length > 0) {
          setActiveConversationId(remaining[0].id);
        } else {
          await handleNewConversation();
        }
      }
      
      toast.success("Conversation deleted");
    } catch (error) {
      console.error("Error deleting conversation:", error);
      toast.error("Failed to delete conversation");
    }
  };

  const handleRenameConversation = async (id: number, newTitle: string) => {
    try {
      await trpcClient.conversations.updateTitle.mutate({ id, title: newTitle });
      
      setConversations((prev) =>
        prev.map((c) => (c.id === id ? { ...c, title: newTitle } : c))
      );
      
      toast.success("Conversation renamed");
    } catch (error) {
      console.error("Error renaming conversation:", error);
      toast.error("Failed to rename conversation");
    }
  };

  const handleSend = async () => {
    // Debug logging
    if (import.meta.env.DEV) {
      console.log("[KaAni UI] handleSend called", {
        input: input.trim(),
        inputLength: input.trim().length,
        isLoading,
        activeConversationId,
        canSend: input.trim().length > 0 && !isLoading,
      });
    }

    if (!input.trim() || isLoading) return;

    // Ensure we have an active conversation - create one if needed
    let conversationId = activeConversationId;
    if (!conversationId) {
      if (import.meta.env.DEV) {
        console.log("[KaAni UI] No active conversation, creating new one...");
      }
      try {
        const newConvo = await trpcClient.conversations.create.mutate({
          title: "New Conversation",
        });
        conversationId = (newConvo as Conversation).id;
        setActiveConversationId(conversationId);
        setConversations((prev) => [newConvo as Conversation, ...prev]);
      } catch (error) {
        console.error("Error creating conversation:", error);
        toast.error("Failed to create conversation. Please try again.");
        return;
      }
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const userMessageContent = input.trim();
    setInput("");
    setIsLoading(true);
    setIsWaitingForFirstChunk(true);

    // Create placeholder message for streaming
    const aiMessageId = (Date.now() + 1).toString();
    const aiMessage: Message = {
      id: aiMessageId,
      role: "assistant",
      content: "",
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, aiMessage]);

    try {
      // Build conversation history (last 10 messages for context)
      const conversationHistory = messages
        .slice(-10)
        .map(msg => ({
          role: msg.role,
          content: msg.content,
        }));

      // Call KaAni API with TRUE real-time SSE streaming and auto-reconnection
      const aiResponse = await sendMessageToKaAniSSE(
        userMessageContent,
        conversationHistory,
        activeProfile,
        selectedDialect,
        (chunk) => {
          // Hide typing indicator when first chunk arrives
          if (chunk.length > 0) {
            setIsWaitingForFirstChunk(false);
            // Mark SSE as connected when receiving data
            connectionHealth.setSSEConnected(true);
          }
          // Clear retry status when receiving data
          setRetryAttempt(null);
          // Update the AI message content with each chunk as it arrives
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === aiMessageId
                ? { ...msg, content: chunk }
                : msg
            )
          );
        },
        // Retry callback
        (attempt, maxRetries) => {
          setRetryAttempt({ current: attempt, max: maxRetries });
          connectionHealth.setReconnecting();
          toast.info(`Connection lost. Retrying (${attempt}/${maxRetries})...`);
        }
      );

      // Save both user message and AI response to database
      try {
        await trpcClient.conversations.addMessage.mutate({
          conversationId: conversationId!,
          role: "user",
          content: userMessageContent,
          profile: activeProfile,
        });
        
        await trpcClient.conversations.addMessage.mutate({
          conversationId: conversationId!,
          role: "assistant",
          content: aiResponse,
          profile: activeProfile,
        });
      } catch (dbError) {
        console.error("Error saving messages to database:", dbError);
        // Don't show error to user since messages are already displayed
      }

      // Auto-generate conversation title from first user message
      const isFirstMessage = messages.filter(m => m.role === "user").length === 0;
      if (isFirstMessage) {
        const title = userMessageContent.slice(0, 50) + (userMessageContent.length > 50 ? "..." : "");
        await handleRenameConversation(conversationId!, title);
      }

      // Update conversation's updatedAt timestamp
      setConversations((prev) =>
        [...prev.map((c) =>
          c.id === conversationId ? { ...c, updatedAt: new Date() } : c
        )].sort((a, b) => toTime(b.updatedAt) - toTime(a.updatedAt))
      );
    } catch (error) {
      console.error("Error sending message:", error);
      // Mark SSE as disconnected on error
      connectionHealth.setSSEConnected(false);
      // Remove the placeholder AI message on error
      setMessages((prev) => prev.filter((msg) => msg.id !== aiMessageId));
      
      // User-friendly error message
      let errorMessage = "KaAni had trouble replying. Please try again in a moment.";
      
      if (error instanceof Error) {
        // Prefer the backend error message we added in the router
        if (error.message.includes("KaAni backend error:")) {
          errorMessage = error.message;
        } else if (error.message.includes("API key not configured")) {
          errorMessage = "KaAni AI is not configured. Please ask the system admin to set GOOGLE_AI_STUDIO_API_KEY and restart the server.";
        } else if (error.message.includes("UNAUTHORIZED")) {
          errorMessage = "Please log in to use KaAni AI.";
        } else if (
          error.message.includes("quota") ||
          error.message.includes("Quota") ||
          error.message.includes("exceeded")
        ) {
          errorMessage = "KaAni reached its quota limit. Please try again later or update the API quota.";
        } else {
          // Fall back to the original error message in dev to help debugging
          if (import.meta.env.DEV) {
            errorMessage = `⚠️ KaAni error: ${error.message}`;
          }
        }
      }
      
      toast.error(errorMessage);
    } finally {
      // Always clear loading states
      setIsLoading(false);
      setIsWaitingForFirstChunk(false);
      setRetryAttempt(null);
      textareaRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handlePromptClick = async (prompt: string) => {
    setInput(prompt);
    textareaRef.current?.focus();
    
    // Auto-send the prompt after a brief delay to allow input to update
    // This gives a better UX - clicking a prompt immediately sends it
    setTimeout(() => {
      if (import.meta.env.DEV) {
        console.log("[KaAni UI] Auto-sending prompt after click:", prompt);
      }
      handleSend();
    }, 100);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Suggested prompts based on profile
  const suggestedPrompts = (activeProfile === "farmer" || activeProfile === "loanMatching" || activeProfile === "riskScoring")
    ? [
        "Magpatingin ng problema sa kasalukuyang tanim.",
        "Humingi ng gabay para sa bagong itatanim.",
      ]
    : [
        "Analyze soil health for this farm.",
        "Recommend fertilizer schedule for rice.",
      ];

  if (isLoadingConversations) {
    return (
      <div className="flex items-center justify-center h-screen bg-white">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading conversations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Sub-header with profile tabs and dialect selector */}
      <div className="border-b border-gray-200">
        <KaAniSubHeader
          activeProfile={activeProfile}
          onProfileChange={setActiveProfile}
          onDialectChange={setSelectedDialect}
        />
      </div>

      {/* Main Chat Container */}
      <div className="flex-1 px-4 pb-6 bg-gray-50">
        <div className="max-w-5xl mx-auto h-full flex flex-col">
          {/* Chat Container */}
          <div className="bg-white border border-gray-200 rounded-lg flex-1 flex flex-col overflow-hidden my-6">
            {/* Conversation Menu Button */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <ConversationManager
                conversations={conversations}
                activeConversationId={activeConversationId}
                onSelectConversation={handleSelectConversation}
                onNewConversation={handleNewConversation}
                onDeleteConversation={handleDeleteConversation}
              />

              <div className="flex items-center gap-4">
                {/* Connection Status Indicator */}
                <ConnectionStatus
                  status={connectionHealth.status}
                  lastConnected={connectionHealth.lastConnected}
                  lastDisconnected={connectionHealth.lastDisconnected}
                />
                
                <SampleFormatsDialog />
                <div className="text-sm text-muted-foreground">
                  {user?.role === "farmer" ? "Farmer Mode" : user?.role === "field_officer" ? "Field Officer Mode" : "Manager Mode"}
                </div>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Empty state */}
              {messages.length === 0 && !isLoadingMessages && (
                <div className="h-full">
                  <KaAniEmptyState 
                    role={activeProfile === "technician" ? "technician" : "farmer"} 
                    context={activeProfile === "loanMatching" ? "loan_matching" : activeProfile === "riskScoring" ? "risk_scoring" : null} 
                  />
                  <div className="mt-6">
                    <SuggestedPrompts prompts={suggestedPrompts} onPromptClick={handlePromptClick} />
                  </div>
                </div>
              )}

              {isLoadingMessages && (
                <div className="text-center py-12">
                  <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading messages...</p>
                </div>
              )}

              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {message.role === "assistant" && (
                    <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                      K
                    </div>
                  )}
                  <div
                    className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                      message.role === "user"
                        ? "bg-green-600 text-white"
                        : "bg-gray-200 text-gray-900"
                    }`}
                  >
                    {message.role === "assistant" ? (
                      <MarkdownMessage content={message.content} />
                    ) : (
                      <p className="whitespace-pre-wrap break-words">{message.content}</p>
                    )}
                    <p
                      className={`text-xs mt-2 ${
                        message.role === "user" ? "text-green-100" : "text-gray-500"
                      }`}
                    >
                      {formatTime(message.timestamp)}
                    </p>
                  </div>
                  {message.role === "user" && (
                    <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                      {user?.name?.charAt(0).toUpperCase() || "U"}
                    </div>
                  )}
                </div>
              ))}

              {isWaitingForFirstChunk && (
                <div className="flex gap-3 justify-start">
                  <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                    K
                  </div>
                  <div className="bg-gray-100 rounded-2xl px-4 py-3">
                    <TypingIndicator />
                  </div>
                </div>
              )}

              {/* Connection retry status indicator */}
              {retryAttempt && (
                <div className="flex gap-3 justify-center">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3 flex items-center gap-3">
                    <div className="w-5 h-5 border-2 border-yellow-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-sm text-yellow-800">
                      Connection lost. Retrying ({retryAttempt.current}/{retryAttempt.max})...
                    </p>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-gray-200 bg-white">
              <div className="flex gap-3 items-end">
                <div className="flex-1 bg-gray-800 rounded-full px-6 py-3 flex items-center gap-3">
                  <Textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Pumili ng opsyon sa itaas o i-type ang iyong sagot..."
                    className="flex-1 bg-transparent border-none text-white placeholder:text-gray-400 resize-none focus-visible:ring-0 focus-visible:ring-offset-0 min-h-0 h-auto"
                    rows={1}
                    disabled={isLoading}
                  />
                </div>
                <Button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className="w-12 h-12 rounded-full bg-green-600 hover:bg-green-700 flex items-center justify-center p-0 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-5 h-5 text-white" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect, useRef } from "react";
import { trpcClient } from "@/lib/trpcClient";
import { toast } from "sonner";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { KaAniAudienceToggle } from "./KaAniAudienceToggle";
import { KaAniDialectToggle } from "./KaAniDialectToggle";
import { KaAniPromptChips } from "./KaAniPromptChips";
import { getStarterPrompts, normalizeUserText } from "../flow";
import { KaAniAudience, KaAniDialect, KaAniUiMessage } from "../types";
import { MarkdownMessage } from "@/components/MarkdownMessage";
import { ConversationManager } from "@/components/ConversationManager";
import TypingIndicator from "@/components/TypingIndicator";
import { KaAniProgressBar } from "./KaAniProgressBar";
import { KaAniWhatWeKnowPanel } from "./KaAniWhatWeKnowPanel";
import { KaAniLoanOfficerSummary } from "./KaAniLoanOfficerSummary";

interface Conversation {
  id: number;
  title: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export function KaAniChat() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<number | null>(null);
  const [messages, setMessages] = useState<KaAniUiMessage[]>([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [audience, setAudience] = useState<KaAniAudience>("loan_officer");
  const [dialect, setDialect] = useState<KaAniDialect>("tagalog");
  const [flowState, setFlowState] = useState<{
    flowId: string;
    nextStepId: string | null;
    suggestedChips: string[];
    progress: { requiredTotal: number; requiredFilled: number; percent: number; missingRequired: string[] };
    whatWeKnow: Array<{ label: string; value: string }>;
    loanOfficerSummary?: { summaryText: string; flags: string[]; assumptions: string[]; missingCritical: string[] };
  } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      const newHeight = Math.min(textareaRef.current.scrollHeight, 200);
      textareaRef.current.style.height = `${newHeight}px`;
    }
  }, [input]);

  // Load conversations on mount
  useEffect(() => {
    const loadConversations = async () => {
      try {
        const convos = await trpcClient.conversations.list.query();
        const sorted = [...(convos as Conversation[])].sort(
          (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
        setConversations(sorted);

        if (sorted.length > 0) {
          setActiveConversationId(sorted[0].id);
        } else {
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
      const formattedMessages: KaAniUiMessage[] = (msgs as any[]).map((msg) => ({
        role: msg.role as KaAniUiMessage["role"],
        content: msg.content,
        createdAt: msg.createdAt,
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

      const conversation = newConvo as any;
      const conversationObj: Conversation = {
        id: conversation.conversationId,
        title: "New Conversation",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      setConversations((prev) => [conversationObj, ...prev]);
      setActiveConversationId(conversationObj.id);
      setMessages([]);

      toast.success("New conversation started");
    } catch (error) {
      console.error("Error creating conversation:", error);
      toast.error("Failed to create conversation");
    }
  };

  const handleSelectConversation = (id: number) => {
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

  const handleSend = async (messageText?: string) => {
    const textToSend = normalizeUserText(messageText || input);
    if (!textToSend || isLoading) return;

    let conversationId = activeConversationId;
    if (!conversationId) {
      try {
        const newConvo = await trpcClient.conversations.create.mutate({
          title: "New Conversation",
        });
        const conversation = newConvo as any;
        conversationId = conversation.conversationId;
        setActiveConversationId(conversationId);
        setConversations((prev) => [
          {
            id: conversationId!,
            title: "New Conversation",
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          ...prev,
        ]);
      } catch (error) {
        console.error("Error creating conversation:", error);
        toast.error("Failed to create conversation. Please try again.");
        return;
      }
    }

    // Add user message to UI immediately
    const userMessage: KaAniUiMessage = {
      role: "user",
      content: textToSend,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMessage]);

    if (!messageText) {
      setInput("");
    }
    setIsLoading(true);

    try {
      // Call guided message endpoint
      const result = await (trpcClient.kaani as any).sendGuidedMessage.mutate({
        conversationId: conversationId!,
        message: textToSend,
        audience,
        dialect,
      });

      // Add assistant reply to UI
      const assistantMessage: KaAniUiMessage = {
        role: "assistant",
        content: result.reply,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMessage]);

      // Update flow state if present
      if (result.flow) {
        setFlowState(result.flow);
      }

      // Refetch messages to ensure sync with backend
      await loadMessages(conversationId!);
    } catch (error: any) {
      console.error("Error sending message:", error);
      
      // Show user-friendly error (don't render raw error JSON)
      const errorMessage = error?.message || "Failed to send message. Please try again.";
      toast.error(errorMessage);

      // Remove user message from UI on error (it will be re-added when we refetch)
      setMessages((prev) => prev.filter((msg, idx) => idx < prev.length - 1));
    } finally {
      setIsLoading(false);
    }
  };

  const handlePromptClick = (message: string) => {
    handleSend(message);
  };

  const starterPrompts = getStarterPrompts(audience);

  if (isLoadingConversations) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">Loading conversations...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Top bar: Audience + Dialect */}
      <div className="border-b border-gray-200 bg-white px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center gap-6 flex-wrap">
          <KaAniAudienceToggle audience={audience} onAudienceChange={setAudience} />
          <KaAniDialectToggle dialect={dialect} onDialectChange={setDialect} />
        </div>
      </div>

      {/* Main Chat Container */}
      <div className="flex-1 px-4 pb-6 bg-gray-50">
        <div className="max-w-5xl mx-auto h-full flex flex-col">
          {/* Chat Container */}
          <div className="bg-white border border-gray-200 rounded-lg flex-1 flex flex-col overflow-hidden my-6">
            {/* Conversation Menu */}
            <div className="p-4 border-b border-gray-200">
              <ConversationManager
                conversations={conversations}
                activeConversationId={activeConversationId}
                onSelectConversation={handleSelectConversation}
                onNewConversation={handleNewConversation}
                onDeleteConversation={handleDeleteConversation}
              />
            </div>

            {/* Progress Bar */}
            {flowState && (
              <KaAniProgressBar progress={flowState.progress} />
            )}

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {isLoadingMessages ? (
                <div className="text-center text-gray-500 py-8">Loading messages...</div>
              ) : messages.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <p className="text-lg font-medium mb-2">Start a conversation with KaAni</p>
                  <p className="text-sm">Choose a prompt below or type your own message</p>
                </div>
              ) : (
                messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg px-4 py-2 ${
                        msg.role === "user"
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 text-gray-900"
                      }`}
                    >
                      <MarkdownMessage content={msg.content} />
                    </div>
                  </div>
                ))
              )}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 rounded-lg px-4 py-2">
                    <TypingIndicator />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* What We Know Panel */}
            {flowState && flowState.whatWeKnow.length > 0 && (
              <KaAniWhatWeKnowPanel whatWeKnow={flowState.whatWeKnow} />
            )}

            {/* Loan Officer Summary */}
            {flowState && flowState.loanOfficerSummary && audience === 'loan_officer' && (
              <KaAniLoanOfficerSummary summary={flowState.loanOfficerSummary} />
            )}

            {/* Prompt Chips Area */}
            {messages.length === 0 && (
              <div className="border-t border-gray-200">
                <KaAniPromptChips prompts={starterPrompts} onPromptClick={handlePromptClick} />
              </div>
            )}

            {/* Suggested Chips from Flow */}
            {flowState && flowState.suggestedChips.length > 0 && (
              <div className="border-t border-gray-200 p-4">
                <KaAniPromptChips
                  prompts={flowState.suggestedChips.map(chip => ({ label: chip, message: chip }))}
                  onPromptClick={handlePromptClick}
                />
              </div>
            )}

            {/* Input Box */}
            <div className="border-t border-gray-200 p-4">
              <div className="flex gap-2">
                <Textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="Type your message..."
                  className="flex-1 min-h-[60px] max-h-[200px] resize-none"
                  disabled={isLoading}
                />
                <Button
                  onClick={() => handleSend()}
                  disabled={isLoading || !input.trim()}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


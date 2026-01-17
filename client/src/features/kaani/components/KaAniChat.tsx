import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { trpcClient } from "@/lib/trpcClient";
import { toast } from "sonner";
import { Send, ShoppingCart, Copy, ChevronDown, ChevronUp, Home } from "lucide-react";
import { IS_LITE_MODE } from "@/const";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import { KaAniLoanPacket } from "./KaAniLoanPacket";
import { KaAniLoanSuggestion } from "./KaAniLoanSuggestion";
import type { KaAniArtifactBundle } from "../types";

interface Conversation {
  id: number;
  title: string;
  createdAt: Date;
  updatedAt: Date;
}

export function KaAniChat() {
  const [, setLocation] = useLocation();
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
  const [artifactBundle, setArtifactBundle] = useState<KaAniArtifactBundle | null>(null);
  const [showUnderwritingSummary, setShowUnderwritingSummary] = useState(true);
  const [aoMetadata, setAoMetadata] = useState({
    branch: "",
    center: "",
    memberName: "",
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load AO metadata from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('kaaniAoMetadata');
    if (saved) {
      try {
        setAoMetadata(JSON.parse(saved));
      } catch (e) {
        // Ignore parse errors
      }
    }
  }, []);

  // Save AO metadata to localStorage when changed
  useEffect(() => {
    localStorage.setItem('kaaniAoMetadata', JSON.stringify(aoMetadata));
  }, [aoMetadata]);

  // Extract budget amount from message content (optional, for demo)
  const extractBudgetFromMessage = (content: string): string | null => {
    // Look for patterns like "₱30,000", "PHP 50000", "30,000 pesos", etc.
    const patterns = [
      /₱\s*([\d,]+)/i,
      /PHP\s*([\d,]+)/i,
      /([\d,]+)\s*pesos?/i,
      /amount[:\s]+₱?\s*([\d,]+)/i,
      /loan[:\s]+₱?\s*([\d,]+)/i,
    ];
    
    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match && match[1]) {
        return match[1].replace(/,/g, '');
      }
    }
    return null;
  };

  // Extract field from text using multiple patterns (best-effort)
  const extractField = (text: string, patterns: RegExp[]): string | null => {
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    return null;
  };

  // Extract peso amount (formatted)
  const extractPesoAmount = (text: string): string => {
    const amount = extractBudgetFromMessage(text);
    if (amount) {
      return `₱${parseInt(amount).toLocaleString()}`;
    }
    return "TBD (AO to confirm)";
  };

  // Build underwriting summary from messages and AO metadata
  const buildUnderwritingSummary = (): string => {
    const now = new Date();
    const dateTime = now.toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    // Get latest assistant message
    const latestAssistant = [...messages].reverse().find(m => m.role === 'assistant');
    const assistantContent = latestAssistant?.content || "";

    // Get last 3 user messages for context
    const recentUserMessages = messages
      .filter(m => m.role === 'user')
      .slice(-3)
      .map(m => m.content)
      .join(' ');

    const combinedText = `${assistantContent} ${recentUserMessages}`;

    // Extract fields (best-effort)
    const loanAmount = extractPesoAmount(assistantContent);
    const crop = extractField(combinedText, [
      /crop[:\s]+([^,\n.]+)/i,
      /(rice|corn|vegetables|sugarcane|coconut|banana|cassava)/i,
    ]) || "—";
    
    const farmSize = extractField(combinedText, [
      /(\d+(?:\.\d+)?)\s*hectares?/i,
      /(\d+(?:\.\d+)?)\s*ha/i,
      /farm\s*size[:\s]+(\d+(?:\.\d+)?)/i,
    ]) || "—";
    
    const location = extractField(combinedText, [
      /location[:\s]+([^,\n.]+)/i,
      /(bacolod|laguna|municipality[:\s]+[^,\n.]+)/i,
    ]) || "—";
    
    const cropCycle = extractField(combinedText, [
      /crop\s*cycle[:\s]+([^,\n.]+)/i,
      /term[:\s]+(\d+\s*(?:months?|days?))/i,
    ]) || "—";

    // Extract key points from messages (bullet list)
    const keyPoints: string[] = [];
    const recentMessages = messages.slice(-5);
    recentMessages.forEach(msg => {
      if (msg.role === 'user') {
        // Extract meaningful phrases from user messages
        const sentences = msg.content.split(/[.!?]/).filter(s => s.trim().length > 20);
        sentences.slice(0, 2).forEach(s => {
          const trimmed = s.trim().substring(0, 100);
          if (trimmed) keyPoints.push(trimmed);
        });
      }
    });
    if (keyPoints.length === 0) {
      keyPoints.push("—");
    }

    // Extract KaAni rationale (excerpt from assistant message)
    const rationale = assistantContent
      .replace(/\n+/g, ' ')
      .substring(0, 400)
      .trim() || "—";

    // Build summary text
    return `CARD MRI – UNDERWRITING HANDOFF (AO)
Date/Time: ${dateTime}
Account Officer (AO): ${aoMetadata.memberName || "—"}
Branch: ${aoMetadata.branch || "—"}
Center: ${aoMetadata.center || "—"}
Member/Client: ${aoMetadata.memberName || "—"}

Loan Purpose: Crop Production Inputs
Crop / Activity: ${crop}
Farm Size (ha): ${farmSize}
Location: ${location}
Crop Cycle / Term: ${cropCycle}

Recommended Loan Amount: ${loanAmount} (KaAni)
AO Proposed Amount: ₱__________
Underwriting Approved Amount: ₱__________

Basis / Key Inputs (from AO + client interview):
${keyPoints.map(p => `- ${p}`).join('\n')}

Assumptions:
- ${flowState?.loanOfficerSummary?.assumptions?.[0] || "—"}

Flags / Missing Evidence:
- ${flowState?.loanOfficerSummary?.missingCritical?.[0] || "—"}

KaAni Rationale (excerpt):
"${rationale}"

Next Step:
- For approval / verification by Underwriting.`;
  };

  const handleCopySummary = async () => {
    try {
      const summary = buildUnderwritingSummary();
      await navigator.clipboard.writeText(summary);
      toast.success("Underwriting summary copied.");
    } catch (error) {
      toast.error("Copy failed. Please try again.");
    }
  };

  const handleApproveAndProceed = (messageContent: string) => {
    // Extract and store budget if found
    const budget = extractBudgetFromMessage(messageContent);
    if (budget) {
      localStorage.setItem('kaaniApprovedBudget', budget);
    }
    
    // Route to order calculator
    setLocation('/order-calculator');
  };

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
        // Convert API response to Conversation[] with Date objects
        const conversations: Conversation[] = (convos as any[]).map(conv => ({
          id: conv.id,
          title: conv.title,
          createdAt: typeof conv.createdAt === 'string' ? new Date(conv.createdAt) : conv.createdAt,
          updatedAt: typeof conv.updatedAt === 'string' ? new Date(conv.updatedAt) : conv.updatedAt,
        }));
        const sorted = conversations.sort(
          (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()
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

      // Refresh artifacts after successful message send
      if (conversationId) {
        try {
          // Use trpcClient directly since we need to pass dynamic conversationId
          const artifactsRes = await (trpcClient.kaani as any).getArtifacts.query({
            conversationId,
            audience,
            dialect,
          });
          if (artifactsRes?.bundle) {
            setArtifactBundle(artifactsRes.bundle);
          }
        } catch (artifactError) {
          // Log but don't fail the message send if artifacts fail
          console.warn("Failed to fetch artifacts:", artifactError);
        }
      }
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

  const handlePromptClick = async (message: string) => {
    const textToSend = normalizeUserText(message);
    if (!textToSend || isLoading) return;

    // Add user message to UI immediately
    const userMessage: KaAniUiMessage = {
      role: "user",
      content: textToSend,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Use kaani.sendMessage for starter prompts - it only requires { message: string }
      // This avoids Zod errors from undefined conversationId/audience
      const result = await trpcClient.kaani.sendMessage.mutate({
        message: textToSend,
      });

      // Add assistant reply to UI
      const assistantMessage: KaAniUiMessage = {
        role: "assistant",
        content: result.response,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMessage]);

      // Ensure we have a conversation for future messages
      if (!activeConversationId) {
        try {
          const newConvo = await trpcClient.conversations.create.mutate({
            title: "New Conversation",
          });
          const conversation = newConvo as any;
          const conversationId = conversation.conversationId;
          setActiveConversationId(conversationId);
          setConversations((prev) => [
            {
              id: conversationId,
              title: "New Conversation",
              createdAt: new Date(),
              updatedAt: new Date(),
            },
            ...prev,
          ]);
        } catch (error) {
          console.warn("Failed to create conversation after starter prompt:", error);
          // Don't fail the message send if conversation creation fails
        }
      }
    } catch (error: any) {
      console.error("Error sending starter prompt:", error);
      
      // Show user-friendly error
      const errorMessage = error?.message || "Failed to send message. Please try again.";
      toast.error(errorMessage);

      // Remove user message from UI on error
      setMessages((prev) => prev.filter((msg, idx) => idx < prev.length - 1));
    } finally {
      setIsLoading(false);
    }
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
      {/* Top bar: Audience + Dialect + Back/Home button */}
      <div className="border-b border-gray-200 bg-white px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center gap-6 flex-wrap">
          <KaAniAudienceToggle audience={audience} onAudienceChange={setAudience} />
          <KaAniDialectToggle dialect={dialect} onDialectChange={setDialect} />
          <div className="ml-auto flex items-center gap-2">
            {import.meta.env.DEV && (
              <span className="text-xs text-gray-400 mr-2">
                Mode: {IS_LITE_MODE ? 'Lite' : 'Full'}
              </span>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLocation(IS_LITE_MODE ? '/kaani' : '/')}
            >
              <Home className="w-4 h-4 mr-2" />
              {IS_LITE_MODE ? 'Home' : 'Back to Dashboard'}
            </Button>
          </div>
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
                  <div key={idx}>
                    <div
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
                    {/* Demo CTA: Show "Approve & Proceed to Inputs" button after assistant messages */}
                    {msg.role === "assistant" && (
                      <div className="flex justify-start mt-2 mb-4">
                        <Button
                          onClick={() => handleApproveAndProceed(msg.content)}
                          className="bg-green-600 hover:bg-green-700 text-white"
                          size="sm"
                        >
                          <ShoppingCart className="w-4 h-4 mr-2" />
                          Approve & Proceed to Inputs
                        </Button>
                      </div>
                    )}
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

            {/* Underwriting Summary Panel */}
            {messages.some(m => m.role === 'assistant') && (
              <div className="border-t border-gray-200 p-4 bg-gray-50">
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-semibold">
                        Underwriting Summary (AO Copy/Paste)
                      </CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowUnderwritingSummary(!showUnderwritingSummary)}
                        className="h-6 w-6 p-0"
                      >
                        {showUnderwritingSummary ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </CardHeader>
                  {showUnderwritingSummary && (
                    <CardContent className="space-y-4">
                      {/* AO Metadata Inputs */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <label className="text-xs text-gray-600 mb-1 block">Branch (optional)</label>
                          <Input
                            value={aoMetadata.branch}
                            onChange={(e) => setAoMetadata({ ...aoMetadata, branch: e.target.value })}
                            placeholder="Branch"
                            className="h-8 text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-600 mb-1 block">Center (optional)</label>
                          <Input
                            value={aoMetadata.center}
                            onChange={(e) => setAoMetadata({ ...aoMetadata, center: e.target.value })}
                            placeholder="Center"
                            className="h-8 text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-600 mb-1 block">Member/Client Name (optional)</label>
                          <Input
                            value={aoMetadata.memberName}
                            onChange={(e) => setAoMetadata({ ...aoMetadata, memberName: e.target.value })}
                            placeholder="Member/Client Name"
                            className="h-8 text-sm"
                          />
                        </div>
                      </div>

                      {/* Summary Preview */}
                      <div>
                        <label className="text-xs text-gray-600 mb-1 block">Summary Preview:</label>
                        <pre className="bg-white border border-gray-200 rounded p-3 text-xs font-mono overflow-auto max-h-64">
                          {buildUnderwritingSummary()}
                        </pre>
                      </div>

                      {/* Copy Button */}
                      <Button
                        onClick={handleCopySummary}
                        className="w-full bg-green-600 hover:bg-green-700 text-white"
                        size="sm"
                      >
                        <Copy className="w-4 h-4 mr-2" />
                        Copy Summary
                      </Button>
                    </CardContent>
                  )}
                </Card>
              </div>
            )}

            {/* What We Know Panel */}
            {flowState && flowState.whatWeKnow.length > 0 && (
              <KaAniWhatWeKnowPanel whatWeKnow={flowState.whatWeKnow} />
            )}

            {/* Loan Officer Summary */}
            {flowState && flowState.loanOfficerSummary && audience === 'loan_officer' && (
              <KaAniLoanOfficerSummary summary={flowState.loanOfficerSummary} />
            )}

            {/* Loan Suggestion: Only render when visibility === "ui" */}
            {artifactBundle && (() => {
              const loanSuggestion = artifactBundle.artifacts.find(a => a.type === "loan_suggestion");
              // Feature gate: only show if visibility is "ui"
              return loanSuggestion && loanSuggestion.visibility === "ui" ? (
                <div className="border-t border-gray-200 bg-gray-50 p-4">
                  <KaAniLoanSuggestion data={loanSuggestion.data} />
                </div>
              ) : null;
            })()}

            {/* Loan Packet: Gate rendering - only show when readiness !== "draft" */}
            {artifactBundle && artifactBundle.readiness !== "draft" && (
              <KaAniLoanPacket bundle={artifactBundle} audience={audience} />
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


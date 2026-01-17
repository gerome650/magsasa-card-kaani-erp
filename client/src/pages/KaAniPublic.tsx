import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { trpcClient } from "@/lib/trpcClient";
import { toast } from "sonner";
import { Send, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { KaAniAudienceToggle } from "@/features/kaani/components/KaAniAudienceToggle";
import { KaAniDialectToggle } from "@/features/kaani/components/KaAniDialectToggle";
import { KaAniPromptChips } from "@/features/kaani/components/KaAniPromptChips";
import { getStarterPrompts, normalizeUserText } from "@/features/kaani/flow";
import { KaAniAudience, KaAniDialect } from "@/features/kaani/types";
import { MarkdownMessage } from "@/components/MarkdownMessage";
import TypingIndicator from "@/components/TypingIndicator";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { KaAniProgressBar } from "@/features/kaani/components/KaAniProgressBar";
import { KaAniWhatWeKnowPanel } from "@/features/kaani/components/KaAniWhatWeKnowPanel";
import { KaAniLoanOfficerSummary } from "@/features/kaani/components/KaAniLoanOfficerSummary";
import { KaAniLoanPacket } from "@/features/kaani/components/KaAniLoanPacket";
import { KaAniLoanSuggestion } from "@/features/kaani/components/KaAniLoanSuggestion";
import type { KaAniArtifactBundle } from "@/features/kaani/types";
import { IS_LITE_MODE } from "@/const";

const SESSION_TOKEN_KEY = 'kaani_session_token_v1';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  createdAt?: string;
}

export default function KaAniPublic() {
  const [, setLocation] = useLocation();
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
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
  const [showCaptureForm, setShowCaptureForm] = useState(false);
  const [captureData, setCaptureData] = useState({
    name: "",
    email: "",
    phone: "",
    consentObtained: false,
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Parse UTM parameters from URL
  const getUTMParams = () => {
    const params = new URLSearchParams(window.location.search);
    return {
      source: params.get('utm_source') || undefined,
      medium: params.get('utm_medium') || undefined,
      campaign: params.get('utm_campaign') || undefined,
    };
  };

  // Initialize session on mount
  useEffect(() => {
    const initSession = async () => {
      // Check for existing session token
      const storedToken = localStorage.getItem(SESSION_TOKEN_KEY);
      if (storedToken) {
        setSessionToken(storedToken);
        // Verify token is still valid by trying to send a message
        // For now, just use it
        return;
      }

      // Create new session
      try {
        const utm = getUTMParams();
        const result = await trpcClient.kaani.startLeadSession.mutate({
          audience,
          dialect,
          landingPath: window.location.pathname,
          utm: Object.keys(utm).length > 0 ? utm : undefined,
        });

        setSessionToken(result.sessionToken);
        setConversationId(result.conversationId);
        localStorage.setItem(SESSION_TOKEN_KEY, result.sessionToken);

        // Show intro if available
        if (result.intro) {
          setMessages([{
            role: 'assistant',
            content: `${result.intro.title}\n\n${result.intro.description}`,
          }]);
        }

        // Note: Suggestions handled via flow state
      } catch (error: any) {
        console.error("Error creating session:", error);
        toast.error(error?.message || "Failed to initialize chat. Please refresh the page.");
      }
    };

    initSession();
  }, []); // Only run once on mount

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

  const handleSend = async (messageText?: string) => {
    const textToSend = normalizeUserText(messageText || input);
    if (!textToSend || isLoading || !sessionToken) return;

    // Add user message to UI immediately
    const userMessage: Message = {
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
      const result = await trpcClient.kaani.sendLeadMessage.mutate({
        sessionToken,
        message: textToSend,
        dialect,
      });

      // Add assistant reply to UI
      const assistantMessage: Message = {
        role: "assistant",
        content: result.reply,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMessage]);

      // Update flow state if present
      if (result.flow) {
        setFlowState(result.flow);
      }

      // Refresh artifacts after successful message send
      if (sessionToken) {
        try {
          // Use trpcClient directly for dynamic sessionToken
          const artifactsRes = await (trpcClient.kaani as any).getLeadArtifacts.query({
            sessionToken,
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
      
      // Show user-friendly error
      const errorMessage = error?.message || "Failed to send message. Please try again.";
      toast.error(errorMessage);

      // Remove user message from UI on error
      setMessages((prev) => prev.filter((msg, idx) => idx < prev.length - 1));
    } finally {
      setIsLoading(false);
    }
  };

  const handlePromptClick = (message: string) => {
    handleSend(message);
  };

  const handleCaptureLead = async () => {
    if (!sessionToken) return;

    try {
      await trpcClient.kaani.captureLead.mutate({
        sessionToken,
        name: captureData.name || undefined,
        email: captureData.email || undefined,
        phone: captureData.phone || undefined,
        consentObtained: captureData.consentObtained || undefined,
        consentTextVersion: "1.0",
      });

      toast.success("Thank you! Your information has been saved.");
      setShowCaptureForm(false);
    } catch (error: any) {
      console.error("Error capturing lead:", error);
      toast.error(error?.message || "Failed to save information. Please try again.");
    }
  };

  const starterPrompts = getStarterPrompts(audience);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Simple header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-2xl font-bold text-green-700">KaAni AI Assistant</h1>
          <p className="text-sm text-gray-600 mt-1">Your agricultural assistant</p>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Audience + Dialect toggles */}
        <div className="border-b border-gray-200 bg-white px-6 py-4">
          <div className="max-w-5xl mx-auto flex items-center gap-6 flex-wrap">
            <KaAniAudienceToggle audience={audience} onAudienceChange={setAudience} />
            <KaAniDialectToggle dialect={dialect} onDialectChange={setDialect} />
            <div className="ml-auto flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLocation(IS_LITE_MODE ? '/kaani' : '/')}
              >
                <Home className="w-4 h-4 mr-2" />
                {IS_LITE_MODE ? 'Home' : 'Back'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCaptureForm(!showCaptureForm)}
              >
                {showCaptureForm ? "Hide" : "Share Contact Info"}
              </Button>
            </div>
          </div>
        </div>

        {/* Capture form (optional) */}
        {showCaptureForm && (
          <div className="bg-blue-50 border-b border-blue-200 px-6 py-4">
            <div className="max-w-5xl mx-auto">
              <h3 className="text-sm font-semibold text-blue-900 mb-3">Contact Information (Optional)</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                <Input
                  placeholder="Name"
                  value={captureData.name}
                  onChange={(e) => setCaptureData({ ...captureData, name: e.target.value })}
                />
                <Input
                  type="email"
                  placeholder="Email"
                  value={captureData.email}
                  onChange={(e) => setCaptureData({ ...captureData, email: e.target.value })}
                />
                <Input
                  placeholder="Phone"
                  value={captureData.phone}
                  onChange={(e) => setCaptureData({ ...captureData, phone: e.target.value })}
                />
              </div>
              <div className="flex items-center gap-2 mb-3">
                <Checkbox
                  id="consent"
                  checked={captureData.consentObtained}
                  onCheckedChange={(checked) =>
                    setCaptureData({ ...captureData, consentObtained: checked === true })
                  }
                />
                <label htmlFor="consent" className="text-sm text-blue-900">
                  I consent to being contacted about agricultural services
                </label>
              </div>
              <Button onClick={handleCaptureLead} size="sm" className="bg-blue-600 hover:bg-blue-700">
                Save Information
              </Button>
            </div>
          </div>
        )}

        {/* Chat Container */}
        <div className="flex-1 px-4 pb-6">
          <div className="max-w-5xl mx-auto h-full flex flex-col">
            <div className="bg-white border border-gray-200 rounded-lg flex-1 flex flex-col overflow-hidden my-6">
              {/* Progress Bar */}
              {flowState && (
                <KaAniProgressBar progress={flowState.progress} />
              )}

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.length === 0 ? (
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

              {/* Prompt Chips Area */}
              {messages.length === 0 && (
                <div className="border-t border-gray-200">
                  <KaAniPromptChips prompts={starterPrompts} onPromptClick={handlePromptClick} />
                </div>
              )}

              {/* What We Know Panel */}
              {flowState && flowState.whatWeKnow.length > 0 && (
                <KaAniWhatWeKnowPanel whatWeKnow={flowState.whatWeKnow} />
              )}

              {/* Loan Officer Summary (only for loan_officer audience) */}
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
                    disabled={isLoading || !sessionToken}
                  />
                  <Button
                    onClick={() => handleSend()}
                    disabled={isLoading || !input.trim() || !sessionToken}
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
    </div>
  );
}


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
import { trpcClient } from "@/lib/trpcClient";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface Conversation {
  id: number;
  title: string;
  createdAt: Date;
  updatedAt: Date;
}

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
  const [selectedRole, setSelectedRole] = useState<"farmer" | "technician">("farmer");
  const [selectedContext, setSelectedContext] = useState<"loan_matching" | "risk_scoring" | null>(null);
  const [selectedDialect, setSelectedDialect] = useState("tagalog");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load conversations on mount
  useEffect(() => {
    const loadConversations = async () => {
      try {
        const convos = await trpcClient.conversations.list.query();
        setConversations(convos as Conversation[]);
        
        // Auto-select the most recent conversation if exists
        if (convos.length > 0) {
          setActiveConversationId(convos[0].id);
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
    if (!input.trim() || isLoading || !activeConversationId) return;

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

      // Add context from selected role and options
      let contextPrefix = "";
      if (selectedRole === "technician") {
        contextPrefix = "[As an agricultural technician] ";
      }
      if (selectedContext === "loan_matching") {
        contextPrefix += "[Focus on loan matching and financial assistance] ";
      } else if (selectedContext === "risk_scoring") {
        contextPrefix += "[Focus on risk assessment and AgScore] ";
      }
      if (selectedDialect !== "tagalog") {
        contextPrefix += `[Respond in ${selectedDialect} dialect] `;
      }

      const contextualMessage = contextPrefix + userMessageContent;

      // Call KaAni API with TRUE real-time SSE streaming
      await sendMessageToKaAniSSE(
        contextualMessage,
        conversationHistory,
        (chunk) => {
          // Hide typing indicator when first chunk arrives
          if (chunk.length > 0) {
            setIsWaitingForFirstChunk(false);
          }
          // Update the AI message content with each chunk as it arrives
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === aiMessageId
                ? { ...msg, content: chunk }
                : msg
            )
          );
        }
      );

      // Auto-generate conversation title from first user message
      const isFirstMessage = messages.filter(m => m.role === "user").length === 0;
      if (isFirstMessage) {
        const title = userMessageContent.slice(0, 50) + (userMessageContent.length > 50 ? "..." : "");
        await handleRenameConversation(activeConversationId, title);
      }

      // Update conversation's updatedAt timestamp
      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeConversationId ? { ...c, updatedAt: new Date() } : c
        ).sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
      );
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message. Please try again.");
    } finally {
      setIsLoading(false);
      setIsWaitingForFirstChunk(false);
      textareaRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handlePromptClick = (prompt: string) => {
    setInput(prompt);
    textareaRef.current?.focus();
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Suggested prompts based on role
  const suggestedPrompts = selectedRole === "farmer" 
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
      {/* Sub-header with role tabs and dialect selector */}
      <div className="border-b border-gray-200">
        <KaAniSubHeader
          onRoleChange={setSelectedRole}
          onContextChange={setSelectedContext}
          onDialectChange={setSelectedDialect}
        />
      </div>

      {/* Main Chat Container */}
      <div className="flex-1 px-4 pb-6 bg-white">
        <div className="max-w-5xl mx-auto h-full flex flex-col">
          {/* Chat Container */}
          <div className="bg-white border border-gray-200 rounded-lg flex-1 flex flex-col overflow-hidden my-6">
            {/* Conversation Menu Button */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Menu className="w-4 h-4" />
                    <span className="hidden sm:inline">
                      {conversations.find(c => c.id === activeConversationId)?.title || "Conversations"}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-64">
                  <DropdownMenuItem onClick={handleNewConversation}>
                    + New Conversation
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {conversations.slice(0, 10).map((convo) => (
                    <DropdownMenuItem
                      key={convo.id}
                      onClick={() => handleSelectConversation(convo.id)}
                      className={activeConversationId === convo.id ? "bg-green-50" : ""}
                    >
                      <div className="flex-1 truncate">{convo.title}</div>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <div className="text-sm text-muted-foreground">
                {user?.role === "farmer" ? "Farmer Mode" : user?.role === "field_officer" ? "Field Officer Mode" : "Manager Mode"}
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {messages.length === 0 && !isLoadingMessages && (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl font-bold text-green-700">K</span>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">
                    Ano po ang pangunahin ninyong kailangan ngayon?
                  </h2>
                  <p className="text-gray-600 mb-8">
                    Ask KaAni anything about farming, loans, or agricultural advice
                  </p>
                  <SuggestedPrompts prompts={suggestedPrompts} onPromptClick={handlePromptClick} />
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
                        : "bg-gray-100 text-gray-900"
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words">{message.content}</p>
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
                  className="w-12 h-12 rounded-full bg-green-600 hover:bg-green-700 flex items-center justify-center p-0"
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

import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { sendMessageToKaAniSSE } from "@/services/kaaniService";
import { toast } from "sonner";
import TypingIndicator from "@/components/TypingIndicator";
import ConversationSidebar from "@/components/ConversationSidebar";
import { trpc } from "@/lib/trpc";

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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Load conversations on mount
  useEffect(() => {
    const loadConversations = async () => {
      try {
        const convos = await trpc.conversations.list.query();
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
    if (!activeConversationId) return;

    const loadMessages = async () => {
      setIsLoadingMessages(true);
      try {
        const msgs = await trpc.conversations.getMessages.query({
          conversationId: activeConversationId,
        });
        
        if (msgs.length > 0) {
          const formattedMessages: Message[] = msgs.map((msg, idx) => ({
            id: `msg-${msg.id}`,
            role: msg.role,
            content: msg.content,
            timestamp: new Date(msg.createdAt),
          }));
          setMessages(formattedMessages);
        } else {
          // Show welcome message for new conversation
          setMessages([{
            id: "welcome",
            role: "assistant",
            content: `Kumusta ${user?.name}! Ako si KaAni, ang iyong agricultural assistant. Paano kita matutulungan ngayong araw?`,
            timestamp: new Date(),
          }]);
        }
      } catch (error) {
        console.error("Error loading messages:", error);
        toast.error("Failed to load messages");
      } finally {
        setIsLoadingMessages(false);
      }
    };

    loadMessages();
  }, [activeConversationId, user?.name]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleNewConversation = async () => {
    try {
      const result = await trpc.conversations.create.mutate({
        title: "New Conversation",
      });
      
      const newConversation: Conversation = {
        id: result.conversationId,
        title: "New Conversation",
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      setConversations((prev) => [newConversation, ...prev]);
      setActiveConversationId(result.conversationId);
      setMessages([{
        id: "welcome",
        role: "assistant",
        content: `Kumusta ${user?.name}! Ako si KaAni, ang iyong agricultural assistant. Paano kita matutulungan ngayong araw?`,
        timestamp: new Date(),
      }]);
      
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
      await trpc.conversations.delete.mutate({ id });
      
      setConversations((prev) => prev.filter((c) => c.id !== id));
      
      // If deleted conversation was active, switch to another or create new
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
      await trpc.conversations.updateTitle.mutate({ id, title: newTitle });
      
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

      // Call KaAni API with TRUE real-time SSE streaming
      await sendMessageToKaAniSSE(
        userMessageContent,
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

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoadingConversations) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading conversations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-background">
      {/* Conversation Sidebar */}
      <ConversationSidebar
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelectConversation={handleSelectConversation}
        onNewConversation={handleNewConversation}
        onDeleteConversation={handleDeleteConversation}
        onRenameConversation={handleRenameConversation}
      />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="border-b bg-card px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center text-white font-bold">
              K
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">KaAni</h1>
              <p className="text-sm text-muted-foreground">
                Agricultural AI Assistant
              </p>
            </div>
          </div>
        </div>

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {isLoadingMessages ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                <p className="text-sm text-muted-foreground">Loading messages...</p>
              </div>
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg px-4 py-3 ${
                      message.role === "user"
                        ? "bg-green-600 text-white"
                        : "bg-muted text-foreground"
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words">
                      {message.content}
                    </p>
                    <p
                      className={`text-xs mt-1 ${
                        message.role === "user"
                          ? "text-green-100"
                          : "text-muted-foreground"
                      }`}
                    >
                      {formatTime(message.timestamp)}
                    </p>
                  </div>
                </div>
              ))}

              {/* Show typing indicator while waiting for first chunk */}
              {isWaitingForFirstChunk && <TypingIndicator />}

              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input Area */}
        <div className="border-t bg-card px-6 py-4">
          <div className="flex gap-3">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message... (Shift+Enter for new line)"
              className="flex-1 min-h-[60px] max-h-[200px] resize-none"
              disabled={isLoading || !activeConversationId}
            />
            <Button
              onClick={handleSend}
              disabled={isLoading || !input.trim() || !activeConversationId}
              className="bg-green-600 hover:bg-green-700 text-white px-6"
            >
              <Send className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

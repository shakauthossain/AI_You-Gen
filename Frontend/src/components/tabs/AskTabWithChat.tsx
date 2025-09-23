import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useAuth } from "@clerk/clerk-react";
import { apiService } from "@/services/api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import {
  User,
  Bot,
  Clock,
  ExternalLink,
  Copy,
  Loader2,
  MessageSquare,
  Send,
  Sparkles,
  FileText,
  Plus,
  MessageCircle,
} from "lucide-react";
import { format } from "date-fns";
import type { SessionState } from "@/types/api";
import { useToast } from "@/hooks/use-toast";
import { VideoLoader } from "@/components/left-rail/VideoLoader";

interface ChatSession {
  session_id: number;
  created_at: string;
  title: string;
}

interface ChatMessage {
  role: "user" | "assistant";
  message: string;
  timestamp: string;
}

interface AskTabWithChatProps {
  conversations: SessionState["conversations"];
  isLoading: boolean;
  onAskQuestion: (question: string) => Promise<void>;
  canAsk: boolean;
  questions: string[];
  // Video loader props for new sessions
  url?: string;
  transcriptStatus?: SessionState["transcriptStatus"];
  error?: SessionState["error"];
  onUrlChange?: (url: string) => void;
  onLoadTranscript?: (url: string) => Promise<void>;
}

export function AskTabWithChat({
  conversations,
  isLoading,
  onAskQuestion,
  canAsk,
  questions,
  url = "",
  transcriptStatus = "idle",
  error = null,
  onUrlChange,
  onLoadTranscript,
}: AskTabWithChatProps) {
  const { toast } = useToast();
  const { getToken } = useAuth();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [question, setQuestion] = useState("");
  const [isAsking, setIsAsking] = useState(false);

  // Chat sessions state
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [currentChatSession, setCurrentChatSession] =
    useState<ChatSession | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(false);

  // Fetch chat sessions on mount
  useEffect(() => {
    (async () => {
      try {
        const token = await getToken();
        const res = await apiService.getChatSessions(token);
        setChatSessions(res);
        if (res.length > 0) setCurrentChatSession(res[0]);
      } catch (error) {
        console.error("Failed to fetch chat sessions:", error);
      }
    })();
  }, [getToken]);

  // Fetch chat messages when session changes
  useEffect(() => {
    if (!currentChatSession) return;
    (async () => {
      try {
        const token = await getToken();
        const msgs = await apiService.getChatMessages(
          currentChatSession.session_id,
          token
        );
        setChatMessages(msgs);
      } catch (error) {
        console.error("Failed to fetch chat messages:", error);
      }
    })();
  }, [currentChatSession, getToken]);

  useEffect(() => {
    // Auto-scroll to bottom when new conversations are added
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [conversations.length, isLoading, chatMessages.length]);

  const handleVideoQuestion = async () => {
    if (question.trim() && question.length >= 3 && question.length <= 2000) {
      console.log(
        "🚀 Asking video question:",
        question.substring(0, 100) + "..."
      );
      setIsAsking(true);
      try {
        await onAskQuestion(question.trim());
        setQuestion(""); // Clear after successful submission
      } finally {
        setIsAsking(false);
      }
    }
  };

  const handleChatMessage = async () => {
    if (!question.trim() || !currentChatSession) return;
    setChatLoading(true);
    const token = await getToken();

    // Add user message
    const userMessage = {
      role: "user" as const,
      message: question,
      timestamp: new Date().toISOString(),
    };
    setChatMessages((prev) => [...prev, userMessage]);
    setQuestion("");

    // Save to backend
    await apiService.addChatMessage(
      currentChatSession.session_id,
      question,
      "user",
      token
    );

    // TODO: Call your LLM/assistant backend and add assistant reply
    // For now, add a placeholder response
    setTimeout(async () => {
      const assistantMessage = {
        role: "assistant" as const,
        message:
          "This is a placeholder response. Connect your LLM backend to get real AI responses.",
        timestamp: new Date().toISOString(),
      };
      setChatMessages((prev) => [...prev, assistantMessage]);
      await apiService.addChatMessage(
        currentChatSession.session_id,
        assistantMessage.message,
        "assistant",
        token
      );
      setChatLoading(false);
    }, 1000);
  };

  const handleNewChatSession = async () => {
    const token = await getToken();
    const session = await apiService.createChatSession(token);
    setChatSessions((prev) => [session, ...prev]);
    setCurrentChatSession(session);
    setChatMessages([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      if (canAsk) {
        handleVideoQuestion();
      } else {
        handleChatMessage();
      }
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: "Content has been copied to your clipboard.",
    });
  };

  const formatTimestamp = (timestamp: string | undefined): string => {
    if (!timestamp || typeof timestamp !== "string") {
      return "0:00";
    }

    const parts = timestamp.split(":").map((p) => parseInt(p, 10));
    if (parts.length === 3) {
      const [h, m, s] = parts;
      if (h > 0) {
        return `${h}:${m.toString().padStart(2, "0")}:${s
          .toString()
          .padStart(2, "0")}`;
      } else {
        return `${m}:${s.toString().padStart(2, "0")}`;
      }
    } else if (parts.length === 2) {
      const [m, s] = parts;
      return `${m}:${s.toString().padStart(2, "0")}`;
    }
    return timestamp;
  };

  // Show initial state if no video loaded and no conversations
  if (conversations.length === 0 && !isLoading && transcriptStatus === "idle") {
    return (
      <div className="h-full flex">
        {/* Chat Sessions Sidebar */}
        <Card className="w-80 border-r rounded-none border-t-0 border-l-0 border-b-0 bg-muted/30">
          <div className="p-4 border-b">
            <Button
              onClick={handleNewChatSession}
              className="w-full gap-2"
              variant="default"
            >
              <Plus className="h-4 w-4" />
              New Chat
            </Button>
          </div>
          <ScrollArea className="flex-1 h-[calc(100vh-140px)]">
            <div className="p-4">
              {chatSessions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50 fill-black" />
                  <p className="text-sm">No chat sessions yet</p>
                  <p className="text-xs">Start a new conversation</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {chatSessions.map((s) => (
                    <Card
                      key={s.session_id}
                      className={`p-3 cursor-pointer transition-colors hover:bg-accent ${
                        currentChatSession?.session_id === s.session_id
                          ? "bg-primary/10 border-primary/20"
                          : "hover:bg-accent/50"
                      }`}
                      onClick={() => setCurrentChatSession(s)}
                    >
                      <div className="flex items-start gap-2">
                        <MessageCircle className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {s.title}
                          </p>
                          <div className="flex items-center gap-1 mt-1">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">
                              {new Date(s.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>
        </Card>

        {/* Main Content */}
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center space-y-8 max-w-lg w-full">
            {/* Hero Section */}
            <div className="space-y-4">
              <div className="w-20 h-20 mx-auto rounded-full gradient-primary flex items-center justify-center shadow-lg border-rounded border-2 border-black/5">
                <MessageSquare className="w-10 h-10 text-black" />
              </div>
              <div>
                <h1 className="text-2xl font-bold mb-2">
                  Start Your AI Conversation
                </h1>
                <p className="text-muted-foreground text-lg">
                  Load a YouTube video to unlock AI-powered insights or chat
                  freely
                </p>
              </div>
            </div>

            {/* Enhanced Video Loader */}
            {onUrlChange && onLoadTranscript && (
              <div className="w-full">
                <div className="bg-gradient-to-r from-card to-accent/5 rounded-xl border shadow-sm p-6 space-y-4">
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    <span className="text-sm font-medium text-primary">
                      Ready to analyze
                    </span>
                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  </div>

                  <VideoLoader
                    url={url}
                    status={transcriptStatus}
                    error={error}
                    onUrlChange={onUrlChange}
                    onLoadTranscript={onLoadTranscript}
                    canLoad={true}
                    isLoading={false}
                  />

                  <div className="text-xs text-muted-foreground text-center space-y-1">
                    <p>
                      ✨ Generate MCQs • 🤖 Ask questions • 📊 Get Test Result
                    </p>
                    <p>Or start chatting without loading a video</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex">
      {/* Chat Sessions Sidebar */}
      <Card className="w-80 border-r rounded-none border-t-0 border-l-0 border-b-0 bg-muted/30">
        <div className="p-4 border-b">
          <Button
            onClick={handleNewChatSession}
            className="w-full gap-2"
            variant="default"
          >
            <Plus className="h-4 w-4" />
            New Chat
          </Button>
        </div>
        <ScrollArea className="flex-1 h-[calc(100vh-140px)]">
          <div className="p-4">
            {chatSessions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-sm">No chat sessions yet</p>
                <p className="text-xs">Start a new conversation</p>
              </div>
            ) : (
              <div className="space-y-2">
                {chatSessions.map((s) => (
                  <Card
                    key={s.session_id}
                    className={`p-3 cursor-pointer transition-colors hover:bg-accent ${
                      currentChatSession?.session_id === s.session_id
                        ? "bg-primary/10 border-primary/20"
                        : "hover:bg-accent/50"
                    }`}
                    onClick={() => setCurrentChatSession(s)}
                  >
                    <div className="flex items-start gap-2">
                      <MessageCircle className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {s.title}
                        </p>
                        <div className="flex items-center gap-1 mt-1">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {new Date(s.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </Card>

      {/* Main Chat/Video Q&A Area */}
      <div className="flex-1 flex flex-col relative">
        {/* Header */}
        <div className="p-4 border-b bg-background relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-primary" />
              <h1 className="font-semibold">
                {canAsk
                  ? "Video Q&A"
                  : currentChatSession
                  ? currentChatSession.title
                  : "Select a chat"}
              </h1>
            </div>
            {canAsk && (
              <Badge variant="secondary" className="gap-1">
                <Sparkles className="h-3 w-3" />
                Video Loaded
              </Badge>
            )}
          </div>
        </div>

        {/* Messages Area */}
        <ScrollArea
          className="flex-1 p-6 max-h-[calc(100vh-300px)]"
          ref={scrollRef}
        >
          {canAsk && conversations.length > 0 ? (
            // Show video Q&A conversations
            <div className="space-y-6 max-w-4xl mx-auto">
              {conversations
                .slice()
                .reverse()
                .map((conversation, index) => (
                  <div key={index} className="space-y-4">
                    {conversation.isSystem ? (
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary/20 to-accent/20 flex items-center justify-center flex-shrink-0">
                          <Sparkles className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm text-primary">
                              System
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {format(conversation.timestamp, "MMM d, HH:mm")}
                            </span>
                          </div>
                          <Card className="bg-primary/5 border-primary/20">
                            <CardContent className="p-4">
                              <div className="prose prose-sm max-w-none dark:prose-invert">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                  {conversation.answer}
                                </ReactMarkdown>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      </div>
                    ) : (
                      <>
                        {/* User Question */}
                        <div className="flex items-start space-x-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <User className="w-4 h-4 text-primary" />
                          </div>
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">You</span>
                              <span className="text-xs text-muted-foreground">
                                {format(conversation.timestamp, "MMM d, HH:mm")}
                              </span>
                            </div>
                            <Card>
                              <CardContent className="p-4 ">
                                <p className="text-sm">
                                  {conversation.question}
                                </p>
                              </CardContent>
                            </Card>
                          </div>
                        </div>

                        {/* AI Answer */}
                        <div className="flex items-start space-x-3">
                          <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center">
                            <Bot className="w-4 h-4 text-white" />
                          </div>
                          <div className="flex-1 space-y-3">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">
                                AI Assistant
                              </span>
                            </div>
                            <Card>
                              <CardContent className="p-4">
                                <div className="prose prose-sm max-w-none dark:prose-invert">
                                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                    {conversation.answer}
                                  </ReactMarkdown>
                                </div>
                              </CardContent>
                            </Card>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ))}
            </div>
          ) : currentChatSession ? (
            // Show chat messages
            <div className="space-y-4 max-w-4xl mx-auto">
              {chatMessages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-center py-20">
                  <div className="max-w-sm">
                    <MessageSquare className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">
                      Start the conversation
                    </h3>
                    <p className="text-muted-foreground">
                      Send your first message to begin this chat session
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  {chatMessages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex gap-3 ${
                        msg.role === "user" ? "justify-end" : "justify-start"
                      }`}
                    >
                      {msg.role === "assistant" && (
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <Bot className="h-4 w-4 text-primary" />
                          </div>
                        </div>
                      )}

                      <div
                        className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                          msg.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">
                          {msg.message}
                        </p>
                        <div className="flex items-center gap-1 mt-2 opacity-70">
                          <Clock className="h-3 w-3" />
                          <span className="text-xs">
                            {new Date(msg.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>

                      {msg.role === "user" && (
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="h-4 w-4 text-primary" />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  {chatLoading && (
                    <div className="flex gap-3 justify-start">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <Bot className="h-4 w-4 text-primary" />
                        </div>
                      </div>
                      <div className="bg-muted rounded-2xl px-4 py-3">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                          <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                          <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce"></div>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-center">
              <div className="max-w-sm">
                <Bot className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">Welcome to Chat</h3>
                <p className="text-muted-foreground mb-4">
                  Select a chat session from the sidebar or start a new
                  conversation
                </p>
                <Button onClick={handleNewChatSession} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Start New Chat
                </Button>
              </div>
            </div>
          )}
        </ScrollArea>

        {/* Input Area */}
        <div className="p-4 border-t bg-background fixed bottom-0 left-80 right-0">
          <div className="flex gap-3">
            <div className="flex-1 space-y-2">
              <Textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  canAsk
                    ? "Ask a question about the video content..."
                    : currentChatSession
                    ? "Type your message..."
                    : "Select or create a chat session to start messaging"
                }
                disabled={
                  isLoading ||
                  isAsking ||
                  chatLoading ||
                  (!canAsk && !currentChatSession)
                }
                className="min-h-[60px] resize-none"
                maxLength={2000}
              />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  {canAsk
                    ? "Ctrl+Enter to send video question"
                    : "Ctrl+Enter to send chat message"}
                </span>
                <span>{question.length}/2000</span>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Button
                onClick={canAsk ? handleVideoQuestion : handleChatMessage}
                disabled={
                  !question.trim() ||
                  question.length < 3 ||
                  question.length > 2000 ||
                  isLoading ||
                  isAsking ||
                  chatLoading ||
                  (!canAsk && !currentChatSession)
                }
                className="h-[60px] px-6 gap-2"
              >
                {isLoading || isAsking || chatLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Send
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useAuth } from "@clerk/clerk-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
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
  History,
  Video,
  Plus,
} from "lucide-react";
import { format } from "date-fns";
import type { SessionState } from "@/types/api";
import { useToast } from "@/hooks/use-toast";
import { VideoLoader } from "@/components/left-rail/VideoLoader";
import { QuestionInput } from "@/components/QuestionInput";
import { apiService, type ChatSession, type ChatMessage } from "@/services/api";

interface AskTabWithHistoryProps {
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
  // Chat history management
  selectedChatSession?: ChatSession | null;
}

// Extended chat message interface for video context
interface VideoChatMessage extends ChatMessage {
  video_url?: string;
  video_title?: string;
}

// Extended chat session interface for video context
interface VideoChatSession extends ChatSession {
  video_url?: string;
  video_title?: string;
  message_count?: number;
}

export function AskTabWithHistory({
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
  selectedChatSession,
}: AskTabWithHistoryProps) {
  const { toast } = useToast();
  const { getToken } = useAuth();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [question, setQuestion] = useState("");
  const [isAsking, setIsAsking] = useState(false);

  // Chat history state
  const [chatSessions, setChatSessions] = useState<VideoChatSession[]>([]);
  const [currentSession, setCurrentSession] = useState<VideoChatSession | null>(
    null
  );
  const [chatMessages, setChatMessages] = useState<VideoChatMessage[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // ...existing code...

  // Load user's chat sessions on mount
  useEffect(() => {
    loadChatSessions();
  }, []);

  // ...existing code...

  // Auto-scroll to bottom when new conversations or chat messages are added
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [conversations.length, chatMessages.length, isLoading]);

  // Note: Session creation is handled by YouTubeQAApp.tsx to avoid duplicate sessions

  // Handle selectedChatSession from sidebar
  useEffect(() => {
    if (selectedChatSession) {
      setCurrentSession(selectedChatSession as VideoChatSession);
      loadSessionMessages(selectedChatSession.session_id);
    } else {
      // Clear current session when starting new chat
      setCurrentSession(null);
      setChatMessages([]);
      console.log("🆕 Starting new chat - cleared session and messages");
    }
  }, [selectedChatSession]);

  const loadChatSessions = async () => {
    try {
      console.log("📚 Loading chat sessions...");
      setIsLoadingHistory(true);
      const token = await getToken();

      if (!token) {
        console.log("❌ No token available for loading sessions");
        return;
      }

      console.log("🔑 Got token for loading sessions");
      const sessions = await apiService.getChatSessions(token);
      setChatSessions(sessions);
      console.log("📚 Loaded chat sessions:", sessions.length, sessions);
    } catch (error) {
      console.error("❌ Failed to load chat sessions:", error);
      toast({
        title: "Error",
        description: "Failed to load chat history",
        variant: "destructive",
      });
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const findOrCreateVideoSession = async (
    videoUrl: string
  ): Promise<VideoChatSession | null> => {
    // Look for existing session for this video
    const existingSession = chatSessions.find(
      (session) => session.video_url === videoUrl
    );

    if (existingSession) {
      setCurrentSession(existingSession);
      loadSessionMessages(existingSession.session_id);
      return existingSession;
    } else {
      // Create new session for this video
      return await createVideoSession(videoUrl);
    }
  };

  const createVideoSession = async (
    videoUrl: string
  ): Promise<VideoChatSession | null> => {
    try {
      const token = await getToken();
      const videoTitle = extractVideoTitle(videoUrl);
      const session = await apiService.createChatSession(
        token,
        videoUrl,
        videoTitle
      );

      const videoSession: VideoChatSession = {
        ...session,
        video_url: videoUrl,
        video_title: videoTitle,
        message_count: 0,
      };

      setChatSessions((prev) => [videoSession, ...prev]);
      setCurrentSession(videoSession);
      setChatMessages([]);

      console.log("📺 Created new video session:", videoSession);
      return videoSession;
    } catch (error) {
      console.error("❌ Failed to create video session:", error);
      toast({
        title: "Error",
        description: "Failed to create chat session",
        variant: "destructive",
      });
      return null;
    }
  };

  const loadSessionMessages = async (sessionId: number) => {
    try {
      const token = await getToken();
      const messages = await apiService.getChatMessages(sessionId, token);
      setChatMessages(messages);
      console.log("💬 Loaded session messages:", messages.length);
    } catch (error) {
      console.error("❌ Failed to load session messages:", error);
      toast({
        title: "Error",
        description: "Failed to load chat messages",
        variant: "destructive",
      });
    }
  };

  const extractVideoTitle = (videoUrl: string): string => {
    // Extract video ID from URL and create a default title
    const videoId = videoUrl.match(
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/
    )?.[1];
    return videoId ? `Video Chat - ${videoId}` : "Video Chat Session";
  };

  const handleAskQuestion = async () => {
    if (question.trim() && question.length >= 3 && question.length <= 2000) {
      console.log("🚀 Asking question:", question.substring(0, 100) + "...");
      console.log(
        "🔍 Current session before asking:",
        currentSession?.session_id
      );
      console.log("🔍 Selected chat session:", selectedChatSession?.session_id);
      console.log("🔍 Current URL:", url);

      setIsAsking(true);

      try {
        // Ensure we have a session to save the conversation
        const session = await ensureCurrentSession();
        console.log("✅ Ensured session:", session?.session_id);

        if (!session) {
          throw new Error("Failed to create or find chat session");
        }

        // Handle the regular YouTube Q&A
        await onAskQuestion(question.trim());

        // Save the user's question to chat history using the session we just ensured
        await saveToChatHistory(question.trim(), "user", session);
        console.log("💾 Question saved to chat history");

        setQuestion(""); // Clear after successful submission
      } catch (error) {
        console.error("❌ Error in handleAskQuestion:", error);
        toast({
          title: "Error",
          description:
            error instanceof Error
              ? error.message
              : "Failed to process question",
          variant: "destructive",
        });
      } finally {
        setIsAsking(false);
      }
    }
  };

  const ensureCurrentSession = async (): Promise<VideoChatSession | null> => {
    console.log("🔍 ensureCurrentSession called");
    console.log("🔍 currentSession:", currentSession?.session_id);
    console.log("🔍 url:", url);

    // If we already have a current session, use it
    if (currentSession) {
      console.log(
        "✅ Using existing current session:",
        currentSession.session_id
      );
      return currentSession;
    }

    // If we have a video URL, find or create a session for that video
    if (url) {
      console.log("📺 Creating/finding video session for URL:", url);
      const session = await findOrCreateVideoSession(url);
      console.log("📺 Video session result:", session?.session_id);
      return session;
    }

    // Otherwise, create a general chat session
    console.log("💬 Creating general chat session");
    const newSession = await createGeneralSession();
    console.log("💬 General session result:", newSession?.session_id);
    return newSession;
  };

  const createGeneralSession = async (): Promise<VideoChatSession | null> => {
    try {
      console.log("💬 Starting general session creation...");
      const token = await getToken();

      if (!token) {
        console.error("❌ No authentication token available");
        toast({
          title: "Authentication Error",
          description: "Please sign in to save chat history",
          variant: "destructive",
        });
        return null;
      }

      console.log(
        "🔑 Got token for general session, length:",
        token?.length || 0
      );

      const session = await apiService.createChatSession(
        token,
        undefined, // no video URL
        undefined, // no video title
        "New Chat Session"
      );
      console.log("📡 API response for general session:", session);

      const newSession: VideoChatSession = {
        ...session,
        message_count: 0,
      };

      setChatSessions((prev) => [newSession, ...prev]);
      setCurrentSession(newSession);
      setChatMessages([]);

      console.log("💬 Created new general chat session:", newSession);

      // Verify the session was actually created by checking if it has an ID
      if (!newSession.session_id) {
        throw new Error("Session created but no session_id returned");
      }

      return newSession;
    } catch (error) {
      console.error("❌ Failed to create general session:", error);

      // More specific error handling
      if (error instanceof Error) {
        if (
          error.message.includes("401") ||
          error.message.includes("Authorization")
        ) {
          toast({
            title: "Authentication Error",
            description: "Please sign in again to save chat history",
            variant: "destructive",
          });
        } else if (
          error.message.includes("503") ||
          error.message.includes("Database")
        ) {
          toast({
            title: "Database Error",
            description: "Database connection issue. Please try again.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Error",
            description: `Failed to create chat session: ${error.message}`,
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Error",
          description: "Failed to create chat session",
          variant: "destructive",
        });
      }

      return null;
    }
  };
  const saveToChatHistory = async (
    message: string,
    role: "user" | "assistant",
    session?: VideoChatSession
  ) => {
    const sessionToUse = session || currentSession;
    if (!sessionToUse) {
      console.error("❌ No session available for saving chat history");
      return;
    }

    try {
      console.log("💾 Saving to chat history:", {
        sessionId: sessionToUse.session_id,
        role,
        messageLength: message.length,
      });

      const token = await getToken();
      await apiService.addChatMessage(
        sessionToUse.session_id,
        message,
        role,
        token,
        sessionToUse.video_url // Pass video context
      );

      // Add to local state
      const newMessage: VideoChatMessage = {
        role,
        message,
        timestamp: new Date().toISOString(),
        video_context: sessionToUse.video_url,
      };

      setChatMessages((prev) => [...prev, newMessage]);

      // Update session message count
      setChatSessions((prev) =>
        prev.map((s) =>
          s.session_id === sessionToUse.session_id
            ? { ...s, message_count: (s.message_count || 0) + 1 }
            : s
        )
      );

      console.log("✅ Successfully saved to chat history:", {
        role,
        messageLength: message.length,
        sessionId: sessionToUse.session_id,
      });
    } catch (error) {
      console.error("❌ Failed to save to chat history:", error);
      toast({
        title: "Error",
        description: "Failed to save message to chat history",
        variant: "destructive",
      });
    }
  };

  const handleQuestionSelect = (selectedQuestion: string) => {
    console.log(
      "🔄 Selected previous question:",
      selectedQuestion.substring(0, 50) + "..."
    );
    setQuestion(selectedQuestion);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAskQuestion();
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: "Content has been copied to your clipboard.",
    });
    console.log("📋 Copied to clipboard");
  };

  const formatTimestamp = (timestamp: string | undefined): string => {
    if (!timestamp || typeof timestamp !== "string") {
      console.warn("⚠️ formatTimestamp received invalid timestamp:", timestamp);
      return "0:00";
    }

    try {
      return format(new Date(timestamp), "MMM d, HH:mm");
    } catch {
      return "Invalid date";
    }
  };

  // Render empty state
  if (
    conversations.length === 0 &&
    chatMessages.length === 0 &&
    !isLoading &&
    transcriptStatus === "idle"
  ) {
    return (
      <div className="flex items-center justify-center h-full p-6">
        <div className="text-center space-y-8 max-w-lg w-full">
          {/* Hero Section */}
          <div className="space-y-4">
            <div className="w-20 h-20 mx-auto rounded-full gradient-primary flex items-center justify-center shadow-lg">
              <MessageSquare
                className="w-10 h-10 !text-[#000000] stroke-black"
                strokeWidth={2}
                color="black"
              />
            </div>
            <div>
              <h1 className="text-2xl font-bold mb-2">
                Start Your AI Conversation
              </h1>
              <p className="text-muted-foreground text-lg">
                Load a YouTube video to unlock AI-powered insights and
                interactive conversations with history
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
                    Ready to analyze with history
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
                    ✨ Generate MCQs • 🤖 Ask questions • 📊 Get insights • 📚
                    Chat history
                  </p>
                  <p>
                    All conversations are saved to your personal chat history
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* History Preview */}
          {/* {chatSessions.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-sm text-muted-foreground">
                  Recent Chat Sessions
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowHistory(!showHistory)}
                  className="text-xs"
                >
                  <History className="w-3 h-3 mr-1" />
                  View All
                </Button>
              </div>
              <div className="grid gap-2">
                {chatSessions.slice(0, 3).map((session) => (
                  <div
                    key={session.session_id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card/50 hover:bg-card transition-colors cursor-pointer"
                    onClick={() => {
                      setCurrentSession(session);
                      loadSessionMessages(session.session_id);
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <Video className="w-4 h-4 text-primary" />
                      <div>
                        <p className="text-sm font-medium">
                          {session.video_title || session.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {session.message_count || 0} messages •{" "}
                          {formatTimestamp(session.created_at)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )} */}

          {/* Features Preview */}
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="space-y-2">
              <div className="w-10 h-10 mx-auto rounded-lg bg-primary/10 flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-medium text-sm">Chat</h3>
              <p className="text-xs text-muted-foreground">
                Ask questions about video content
              </p>
            </div>
            <div className="space-y-2">
              <div className="w-10 h-10 mx-auto rounded-lg bg-primary/10 flex items-center justify-center">
                <History className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-medium text-sm">History</h3>
              <p className="text-xs text-muted-foreground">
                Access previous conversations
              </p>
            </div>
            <div className="space-y-2">
              <div className="w-10 h-10 mx-auto rounded-lg bg-primary/10 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-medium text-sm">Insights</h3>
              <p className="text-xs text-muted-foreground">
                Analyze content patterns
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render ready state
  if (conversations.length === 0 && chatMessages.length === 0 && !isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-4 max-w-md">
          <div className="w-16 h-16 mx-auto rounded-full bg-muted/50 flex items-center justify-center">
            <MessageSquare className="w-8 h-8 text-muted-foreground" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">
              {selectedChatSession ? "Ready to chat!" : "🆕 New Chat Started"}
            </h3>
            <p className="text-muted-foreground">
              {selectedChatSession
                ? "Ask questions about the video content to get AI-powered answers with persistent history."
                : "Start a fresh conversation! Ask questions about the video content and your chat will be automatically saved."}
            </p>
          </div>
          {currentSession && (
            <Badge variant="secondary" className="text-xs">
              Session: {currentSession.video_title}
            </Badge>
          )}
          {!selectedChatSession && !currentSession && (
            <Badge variant="outline" className="text-xs">
              <Plus className="w-3 h-3 mr-1" />
              New Chat Mode
            </Badge>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header with session info */}
      {currentSession && (
        <div className="p-4 border-b bg-card/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Video className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">
                {currentSession.video_title}
              </span>
              <Badge variant="secondary" className="text-xs">
                {chatMessages.length} saved messages
              </Badge>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowHistory(!showHistory)}
              className="text-xs"
            >
              <History className="w-3 h-3 mr-1" />
              History
            </Button>
          </div>
        </div>
      )}

      <ScrollArea
        className="flex-1 p-6 max-h-[calc(100vh-350px)] overflow-y-auto"
        ref={scrollRef}
      >
        <div className="space-y-6 max-w-4xl mx-auto">
          {/* Render only current session messages, no Chat History heading */}
          {/* {chatMessages.length > 0 && (
            <div className="space-y-4">
              {chatMessages.map((message, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      message.role === "user"
                        ? "bg-primary/10"
                        : "gradient-primary"
                    }`}
                  >
                    {message.role === "user" ? (
                      <User className="w-4 h-4 text-primary" />
                    ) : (
                      <Bot className="w-4 h-4 text-white" />
                    )}
                  </div>
                  <div className="flex-1">
                    <Card className="bg-card/50">
                      <CardContent className="p-4">
                        <div className="prose prose-sm max-w-none dark:prose-invert">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {message.message}
                          </ReactMarkdown>
                        </div>
                        {message.role === "assistant" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(message.message)}
                            className="text-xs h-6 px-2 mt-2"
                          >
                            <Copy className="w-3 h-3 mr-1" />
                            Copy
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </div>
              ))}
            </div>
          )} */}

          {/* Render current conversation (YouTube Q&A) */}
          {conversations
            .slice()
            .reverse()
            .map((conversation, index) => (
              <div key={index} className="space-y-4">
                {/* System Messages */}
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
                          <Badge variant="outline" className="text-xs">
                            Current
                          </Badge>
                        </div>
                        <Card>
                          <CardContent className="p-4">
                            <p className="text-sm">{conversation.question}</p>
                          </CardContent>
                        </Card>
                      </div>
                    </div>

                    {/* AI Answer */}
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center ">
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">
                            AI Assistant
                          </span>
                          <Badge variant="outline" className="text-xs">
                            Current
                          </Badge>
                        </div>

                        <Card>
                          <CardContent className="p-4 space-y-3">
                            <div className="prose prose-sm max-w-none dark:prose-invert">
                              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {conversation.answer}
                              </ReactMarkdown>
                            </div>

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                copyToClipboard(conversation.answer)
                              }
                              className="text-xs h-6 px-2"
                            >
                              <Copy className="w-3 h-3 mr-1" />
                              Copy
                            </Button>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  </>
                )}

                {conversations.length - 1 - index > 0 && (
                  <Separator className="my-6" />
                )}
              </div>
            ))}

          {/* Loading indicator */}
          {isLoading && (
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1">
                <Card>
                  <CardContent className="p-4 flex items-center space-x-2">
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-primary/60 rounded-full animate-pulse" />
                      <div className="w-2 h-2 bg-primary/60 rounded-full animate-pulse delay-200" />
                      <div className="w-2 h-2 bg-primary/60 rounded-full animate-pulse delay-400" />
                    </div>
                    <span className="text-sm text-muted-foreground">
                      Thinking...
                    </span>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Question Input Section */}
      {/* <QuestionInput
        question={question}
        setQuestion={setQuestion}
        onAskQuestion={handleAskQuestion}
        canAsk={canAsk}
        isAsking={isAsking}
        isLoading={isLoading}
        currentSession={currentSession}
        questions={questions}
        onQuestionSelect={handleQuestionSelect}
        onKeyDown={handleKeyDown}
      /> */}
    </div>
  );
}

console.log("🔧 AskTabWithHistory component loaded");

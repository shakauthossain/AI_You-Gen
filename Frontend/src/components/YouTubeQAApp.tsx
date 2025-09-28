import { useState, useEffect } from "react";
import { ThemeProvider } from "next-themes";
import { NavigationHeader } from "./NavigationHeader";
import { LeftRail } from "./LeftRail";
import { ContentCanvas } from "./ContentCanvas";
import { ChatHistorySidebar } from "./ChatHistorySidebar";
import { useSessionState } from "@/hooks/useSessionState";
import { apiService, type ChatSession, type ChatMessage } from "@/services/api";
import { parseMCQResponse } from "@/utils/mcq-parser";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@clerk/clerk-react";

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

export function YouTubeQAApp() {
  const { toast } = useToast();
  const { state, actions, computed } = useSessionState();
  const [isLoading, setIsLoading] = useState(false);
  const { getToken } = useAuth();

  // Chat history state
  const [selectedChatSession, setSelectedChatSession] =
    useState<ChatSession | null>(null);

  // Question input state
  const [question, setQuestion] = useState("");
  const [isAsking, setIsAsking] = useState(false);

  // Chat session management
  const [chatSessions, setChatSessions] = useState<VideoChatSession[]>([]);
  const [currentSession, setCurrentSession] = useState<VideoChatSession | null>(
    null
  );
  const [chatMessages, setChatMessages] = useState<VideoChatMessage[]>([]);

  console.log("🚀 YouTubeQAApp rendered:", {
    url: state.url,
    status: state.transcriptStatus,
    isLoading,
    selectedChatSession: selectedChatSession?.session_id,
  });

  // Load user's chat sessions on mount
  useEffect(() => {
    loadChatSessions();
  }, []);

  // Find or create session for current video
  useEffect(() => {
    if (state.url && chatSessions.length > 0) {
      findOrCreateVideoSession(state.url);
    }
  }, [state.url, chatSessions]);

  const loadChatSessions = async () => {
    try {
      console.log("📚 Loading chat sessions...");
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

  const extractVideoTitle = (videoUrl: string): string => {
    // Extract video ID from URL and create a default title
    const videoId = videoUrl.match(
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/
    )?.[1];
    return videoId ? `Video Chat - ${videoId}` : "Video Chat Session";
  };

  const ensureCurrentSession = async (): Promise<VideoChatSession | null> => {
    console.log("🔍 ensureCurrentSession called");
    console.log("🔍 currentSession:", currentSession?.session_id);
    console.log("🔍 url:", state.url);

    // If we already have a current session, use it
    if (currentSession) {
      console.log(
        "✅ Using existing current session:",
        currentSession.session_id
      );
      return currentSession;
    }

    // If we have a video URL, find or create a session for that video
    if (state.url) {
      console.log("📺 Creating/finding video session for URL:", state.url);
      const session = await findOrCreateVideoSession(state.url);
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

      const session = await apiService.createChatSession(
        token,
        undefined, // no video URL
        undefined, // no video title
        "New Chat Session"
      );

      const newSession: VideoChatSession = {
        ...session,
        message_count: 0,
      };

      setChatSessions((prev) => [newSession, ...prev]);
      setCurrentSession(newSession);
      setChatMessages([]);

      console.log("💬 Created new general chat session:", newSession);
      return newSession;
    } catch (error) {
      console.error("❌ Failed to create general session:", error);
      toast({
        title: "Error",
        description: "Failed to create chat session",
        variant: "destructive",
      });
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

  const handleLoadTranscript = async (url: string) => {
    console.log("📺 Loading transcript for:", url);
    actions.updateUrl(url);
    actions.setTranscriptStatus("loading");
    actions.setError(null);
    setIsLoading(true);

    try {
      const token = await getToken();
      const response = await apiService.loadTranscript({ url }, token);
      console.log("✅ Transcript loaded successfully:", response);

      actions.setTranscriptStatus("loaded");
      if (response.transcript) {
        actions.setTranscript(response.transcript);
      }

      // Add system message about transcript being loaded
      actions.addSystemMessage(
        "✅ Transcript has been successfully loaded! You can now ask questions about the video content, and explore the full transcript in the Transcript tab."
      );
      if (response.summary) {
        actions.addSystemMessage(`📝 Video Summary: ${response.summary}`);
      }

      toast({
        title: "Transcript loaded",
        description: response.message,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to load transcript";
      console.error("❌ Failed to load transcript:", errorMessage);

      actions.setTranscriptStatus("error");
      actions.setError({ message: errorMessage });
      toast({
        title: "Failed to load transcript",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAskQuestion = async (question: string) => {
    console.log("❓ Asking question:", question);
    if (!state.url || state.transcriptStatus !== "loaded") {
      toast({
        title: "No transcript loaded",
        description: "Please load a transcript first.",
        variant: "destructive",
      });
      return;
    }

    actions.addQuestion(question);
    setIsAsking(true);
    setIsLoading(true);

    try {
      // Ensure we have a session to save the conversation
      const session = await ensureCurrentSession();
      console.log("✅ Ensured session:", session?.session_id);

      if (!session) {
        throw new Error("Failed to create or find chat session");
      }

      const token = await getToken();
      const response = await apiService.askQuestion(
        {
          url: state.url,
          question,
        },
        token
      );

      console.log("✅ Question answered:", {
        answerLength: response.answer.length,
        snippetsCount: response.snippets.length,
      });

      // Save the question and answer to regular conversation state
      actions.addConversation(question, response.answer, response.snippets);

      // Note: User question is already saved by AskTabWithHistory.tsx
      // Only save the AI's answer to chat history
      await saveToChatHistory(response.answer, "assistant", session);
      console.log("💾 Answer saved to chat history");

      setQuestion(""); // Clear the question input after success
      toast({
        title: "Question answered",
        description: `Found ${response.snippets.length} relevant snippets.`,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to get answer";
      console.error("❌ Failed to answer question:", errorMessage);

      toast({
        title: "Failed to answer question",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsAsking(false);
      setIsLoading(false);
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
    if (e.key === "Enter" && !isAsking && !isLoading) {
      e.preventDefault();
      if (question.trim() && question.length >= 3 && question.length <= 2000) {
        handleAskQuestion(question.trim());
      }
    }
  };

  const handleGenerateMCQs = async (numMcqs: number) => {
    console.log("📝 Generating MCQs:", numMcqs);
    if (!state.url || state.transcriptStatus !== "loaded") {
      toast({
        title: "No transcript loaded",
        description: "Please load a transcript first.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const token = await getToken();
      const response = await apiService.generateMCQs(
        {
          url: state.url,
          num_mcqs: numMcqs,
        },
        token
      );

      console.log("✅ MCQs generated:", response.mcqs);

      const parsedMCQs = parseMCQResponse(response.mcqs);

      if (!parsedMCQs || parsedMCQs.length === 0) {
        throw new Error("No MCQs could be parsed from the response");
      }

      actions.addMCQSet(parsedMCQs, numMcqs);

      toast({
        title: "MCQs generated",
        description: `Generated ${parsedMCQs.length} multiple choice questions.`,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to generate MCQs";
      console.error("❌ Failed to generate MCQs:", errorMessage);

      toast({
        title: "Failed to generate MCQs",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadFile = async (
    format: "pdf" | "docx",
    numMcqs: number
  ) => {
    console.log(
      "📄 Downloading",
      format.toUpperCase(),
      "with",
      numMcqs,
      "MCQs"
    );
    if (!state.url || state.transcriptStatus !== "loaded") {
      toast({
        title: "No transcript loaded",
        description: "Please load a transcript first.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const token = await getToken();
      const blob =
        format === "pdf"
          ? await apiService.downloadMCQsPDF(
              {
                url: state.url,
                num_mcqs: numMcqs,
              },
              token
            )
          : await apiService.downloadMCQsDOCX(
              {
                url: state.url,
                num_mcqs: numMcqs,
              },
              token
            );

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `mcqs_${numMcqs}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      console.log("✅ File downloaded successfully");
      toast({
        title: "Download complete",
        description: `MCQs downloaded as ${format.toUpperCase()}.`,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : `Failed to download ${format.toUpperCase()}`;
      console.error("❌ Failed to download file:", errorMessage);

      toast({
        title: "Download failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadPDF = async (numMcqs: number) => {
    await handleDownloadFile("pdf", numMcqs);
  };

  const handleDownloadDOCX = async (numMcqs: number) => {
    await handleDownloadFile("docx", numMcqs);
  };

  const handleClearSession = () => {
    console.log("🗑️ Clearing session");
    actions.clearSession();
    toast({
      title: "Session cleared",
      description: "All data has been reset.",
    });
  };

  const handleNewVideo = () => {
    console.log("📹 New video - resetting to load new video");
    actions.clearSession();
    toast({
      title: "Ready for new video",
      description: "Enter a new YouTube URL to get started.",
    });
  };

  // Chat history handlers
  const handleSessionSelect = async (session: ChatSession) => {
    console.log("📖 Selected chat session:", session.session_id);
    setSelectedChatSession(session);

    // If session has a video URL, load it
    if (session.video_url && session.video_url !== state.url) {
      await handleLoadTranscript(session.video_url);
    }
  };

  const handleNewChat = () => {
    console.log("➕ Starting new chat");
    setSelectedChatSession(null);

    // Clear the current conversation history but keep the video loaded
    // This allows users to start fresh questions about the same video
    actions.setError(null);

    // Reset conversations to start fresh
    const currentUrl = state.url;
    const currentTranscript = state.transcript;
    const currentTranscriptStatus = state.transcriptStatus;

    // Clear conversations but preserve video context
    if (state.conversations.length > 0) {
      actions.clearSession();

      // Restore video context if it was loaded
      if (currentUrl) {
        actions.updateUrl(currentUrl);
      }
      if (currentTranscript && currentTranscriptStatus === "loaded") {
        actions.setTranscript(currentTranscript);
        actions.setTranscriptStatus("loaded");
        actions.addSystemMessage(
          "🆕 Started new chat! You can ask fresh questions about the loaded video."
        );
      }
    }

    console.log(
      "🆕 New chat started - conversations cleared, video context preserved"
    );
  };

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange
    >
      <div className="min-h-screen bg-background flex flex-col">
        <NavigationHeader
          videoTitle={currentSession?.video_title}
          isAppContext={true}
        />

        <div className="flex-1 flex overflow-hidden border-t border-border relative">
          {/* <LeftRail state={state} /> */}

          <ChatHistorySidebar
            currentVideoUrl={state.url}
            onSessionSelect={handleSessionSelect}
            onNewChat={handleNewChat}
          />

          <ContentCanvas
            state={state}
            isLoading={isLoading}
            onAskQuestion={handleAskQuestion}
            canAsk={computed.canAskQuestions}
            onGenerateMCQs={handleGenerateMCQs}
            onDownloadPDF={handleDownloadPDF}
            onDownloadDOCX={handleDownloadDOCX}
            canGenerate={computed.canGenerateMCQs}
            onUrlChange={actions.updateUrl}
            onLoadTranscript={handleLoadTranscript}
            selectedChatSession={selectedChatSession}
            question={question}
            setQuestion={setQuestion}
            isAsking={isAsking}
            currentSession={currentSession}
            onQuestionSelect={handleQuestionSelect}
            onKeyDown={handleKeyDown}
          />
        </div>
      </div>
    </ThemeProvider>
  );
}

console.log("🔧 YouTubeQAApp component loaded");

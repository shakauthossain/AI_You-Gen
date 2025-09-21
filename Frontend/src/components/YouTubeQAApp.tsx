import { useState } from "react";
import { ThemeProvider } from "next-themes";
import { Header } from "./Header";
import { LeftRail } from "./LeftRail";
import { ContentCanvas } from "./ContentCanvas";
import { useSessionState } from "@/hooks/useSessionState";
import { apiService } from "@/services/api";
import { parseMCQResponse } from "@/utils/mcq-parser";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@clerk/clerk-react";

export function YouTubeQAApp() {
  const { toast } = useToast();
  const { state, actions, computed } = useSessionState();
  const [isLoading, setIsLoading] = useState(false);
  const { getToken } = useAuth();

  console.log("🚀 YouTubeQAApp rendered:", {
    url: state.url,
    status: state.transcriptStatus,
    isLoading,
  });

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
    setIsLoading(true);

    try {
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

      actions.addConversation(question, response.answer, response.snippets);
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
      setIsLoading(false);
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

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange
    >
      <div className="min-h-screen bg-background flex flex-col">
        <Header
          onClearSession={handleClearSession}
          onNewVideo={handleNewVideo}
        />

        <div className="flex-1 flex overflow-hidden">
          <LeftRail state={state} />

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
          />
        </div>
      </div>
    </ThemeProvider>
  );
}

console.log("🔧 YouTubeQAApp component loaded");

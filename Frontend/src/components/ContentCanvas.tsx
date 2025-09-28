import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AskTabWithHistory } from "./tabs/AskTabWithHistory";
import { ContentCreatorTab } from "./tabs/ContentCreatorTab";
import { InsightsTab } from "./tabs/InsightsTab";
import { MCQsTab } from "./tabs/MCQsTab";
import { TranscriptTab } from "./tabs/TranscriptTab";
import { QuestionInput } from "./QuestionInput";
import {
  MessageSquare,
  BarChart3,
  FileText,
  ScrollText,
  Sparkles,
} from "lucide-react";
import type { SessionState } from "@/types/api";
import type { ChatSession } from "@/services/api";

interface ContentCanvasProps {
  state: SessionState;
  isLoading: boolean;
  onAskQuestion: (question: string) => Promise<void>;
  canAsk: boolean;
  // MCQ generation props
  onGenerateMCQs: (numMcqs: number) => Promise<void>;
  onDownloadPDF: (numMcqs: number) => Promise<void>;
  onDownloadDOCX: (numMcqs: number) => Promise<void>;
  canGenerate: boolean;
  // Video loader props for ask tab
  onUrlChange: (url: string) => void;
  onLoadTranscript: (url: string) => Promise<void>;
  // Chat history props
  selectedChatSession?: ChatSession | null;
  // Question input props
  question?: string;
  setQuestion?: (question: string) => void;
  isAsking?: boolean;
  currentSession?: any;
  onQuestionSelect?: (question: string) => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
}

export function ContentCanvas({
  state,
  isLoading,
  onAskQuestion,
  canAsk,
  onGenerateMCQs,
  onDownloadPDF,
  onDownloadDOCX,
  canGenerate,
  onUrlChange,
  onLoadTranscript,
  selectedChatSession,
  question = "",
  setQuestion = () => {},
  isAsking = false,
  currentSession,
  onQuestionSelect = () => {},
  onKeyDown = () => {},
}: ContentCanvasProps) {
  console.log("🎨 ContentCanvas rendered:", {
    conversationsCount: state.conversations.length,
    mcqSetsCount: state.mcqSets.length,
    snippetsCount: state.allSnippets.length,
    transcriptLength: state.transcript.length,
    isLoading,
  });

  const handleAskQuestion = async () => {
    if (question.trim()) {
      await onAskQuestion(question.trim());
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-background relative">
      <Tabs defaultValue="ask" className="flex-1 flex flex-col">
        <div className="border-b bg-card/30 px-6 py-3 align-middle flex justify-center">
          <TabsList className="grid w-full max-w-2xl grid-cols-5">
            <TabsTrigger value="ask" className="text-xs gap-1">
              <MessageSquare className="w-3 h-3" />
              Ask
            </TabsTrigger>
            <TabsTrigger value="creator" className="text-xs gap-1">
              <Sparkles className="w-3 h-3" />
              Creator
            </TabsTrigger>
            <TabsTrigger value="mcqs" className="text-xs gap-1">
              <FileText className="w-3 h-3" />
              MCQs
            </TabsTrigger>
            <TabsTrigger value="transcript" className="text-xs gap-1">
              <ScrollText className="w-3 h-3" />
              Transcript
            </TabsTrigger>
            <TabsTrigger value="insights" className="text-xs gap-1">
              <BarChart3 className="w-3 h-3" />
              Insights
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="flex-1 overflow-hidden relative">
          <TabsContent value="ask" className="space-y-6">
            <AskTabWithHistory
              conversations={state.conversations}
              isLoading={isLoading}
              onAskQuestion={onAskQuestion}
              canAsk={canAsk}
              questions={state.questions}
              url={state.url}
              transcriptStatus={state.transcriptStatus}
              error={state.error}
              onUrlChange={onUrlChange}
              onLoadTranscript={onLoadTranscript}
              selectedChatSession={selectedChatSession}
            />
          </TabsContent>

          <TabsContent value="creator" className="h-full m-0 p-0">
            <ContentCreatorTab url={state.url} canGenerate={canGenerate} />
          </TabsContent>

          <TabsContent value="mcqs" className="h-full m-0 p-0">
            <MCQsTab
              mcqSets={state.mcqSets}
              onGenerateMCQs={onGenerateMCQs}
              onDownloadPDF={onDownloadPDF}
              onDownloadDOCX={onDownloadDOCX}
              canGenerate={canGenerate}
              isLoading={isLoading}
            />
          </TabsContent>

          <TabsContent value="transcript" className="h-full m-0 p-0">
            <TranscriptTab conversations={state.conversations} />
          </TabsContent>

          <TabsContent value="insights" className="h-full m-0 p-0">
            <InsightsTab
              snippets={state.allSnippets}
              conversations={state.conversations}
            />
          </TabsContent>
        </div>
      </Tabs>

      {/* Global Question Input - Only show when transcript is loaded */}
      {state.transcriptStatus === "loaded" && (
        <QuestionInput
          question={question}
          setQuestion={setQuestion}
          onAskQuestion={handleAskQuestion}
          canAsk={canAsk}
          isAsking={isAsking}
          isLoading={isLoading}
          currentSession={currentSession}
          questions={state.questions}
          onQuestionSelect={onQuestionSelect}
          onKeyDown={onKeyDown}
        />
      )}
    </div>
  );
}

console.log("🔧 ContentCanvas component loaded");

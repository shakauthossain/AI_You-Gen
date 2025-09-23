import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
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
} from "lucide-react";
import { format } from "date-fns";
import type { SessionState } from "@/types/api";
import { useToast } from "@/hooks/use-toast";
import { VideoLoader } from "@/components/left-rail/VideoLoader";

interface AskTabProps {
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

export function AskTab({
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
}: AskTabProps) {
  const { toast } = useToast();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [question, setQuestion] = useState("");
  const [isAsking, setIsAsking] = useState(false);

  console.log("💬 AskTab rendered:", {
    conversationsCount: conversations.length,
    isLoading,
    canAsk,
    questionLength: question.length,
  });

  useEffect(() => {
    // Auto-scroll to bottom when new conversations are added
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [conversations.length, isLoading]);

  const handleAskQuestion = async () => {
    if (question.trim() && question.length >= 3 && question.length <= 2000) {
      console.log("🚀 Asking question:", question.substring(0, 100) + "...");
      setIsAsking(true);
      try {
        await onAskQuestion(question.trim());
        setQuestion(""); // Clear after successful submission
      } finally {
        setIsAsking(false);
      }
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
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
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
    // Handle undefined or empty timestamps
    if (!timestamp || typeof timestamp !== "string") {
      console.warn("⚠️ formatTimestamp received invalid timestamp:", timestamp);
      return "0:00";
    }

    // Parse timestamps like "0:03:21" and format them nicely
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

  if (conversations.length === 0 && !isLoading && transcriptStatus === "idle") {
    return (
      <div className="flex items-center justify-center h-full p-6">
        <div className="text-center space-y-8 max-w-lg w-full">
          {/* Hero Section */}
          <div className="space-y-4">
            <div className="w-20 h-20 mx-auto rounded-full gradient-primary flex items-center justify-center shadow-lg">
              <MessageSquare />
            </div>
            <div>
              <h1 className="text-2xl font-bold mb-2">
                Start Your AI Conversation
              </h1>
              <p className="text-muted-foreground text-lg">
                Load a YouTube video to unlock AI-powered insights and
                interactive conversations
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
                  <p>✨ Generate MCQs • 🤖 Ask questions • 📊 Get insights</p>
                  <p>Supports YouTube videos with available transcripts</p>
                </div>
              </div>
            </div>
          )}

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
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-medium text-sm">MCQs</h3>
              <p className="text-xs text-muted-foreground">
                Generate quiz questions
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

  if (conversations.length === 0 && !isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-4 max-w-md">
          <div className="w-16 h-16 mx-auto rounded-full bg-muted/50 flex items-center justify-center">
            <MessageSquare className="w-8 h-8 text-muted-foreground" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">Ready to chat!</h3>
            <p className="text-muted-foreground">
              Ask questions about the video content to get AI-powered answers.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <ScrollArea className="flex-1 p-6" ref={scrollRef}>
        <div className="space-y-6 max-w-4xl mx-auto">
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
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm]}
                              components={{
                                h1: ({ node, ...props }) => (
                                  <h1
                                    className="text-lg font-bold mt-4 mb-2"
                                    {...props}
                                  />
                                ),
                                h2: ({ node, ...props }) => (
                                  <h2
                                    className="text-base font-bold mt-3 mb-2"
                                    {...props}
                                  />
                                ),
                                h3: ({ node, ...props }) => (
                                  <h3
                                    className="text-sm font-bold mt-2 mb-1"
                                    {...props}
                                  />
                                ),
                                ul: ({ node, ...props }) => (
                                  <ul
                                    className="list-disc list-inside space-y-1 my-2"
                                    {...props}
                                  />
                                ),
                                ol: ({ node, ...props }) => (
                                  <ol
                                    className="list-decimal list-inside space-y-1 my-2"
                                    {...props}
                                  />
                                ),
                                li: ({ node, ...props }) => (
                                  <li className="text-sm" {...props} />
                                ),
                                p: ({ node, ...props }) => (
                                  <p
                                    className="mb-2 last:mb-0 text-sm leading-relaxed"
                                    {...props}
                                  />
                                ),
                                strong: ({ node, ...props }) => (
                                  <strong
                                    className="font-semibold text-primary"
                                    {...props}
                                  />
                                ),
                                em: ({ node, ...props }) => (
                                  <em className="italic" {...props} />
                                ),
                                code: ({ node, ...props }) => (
                                  <code
                                    className="bg-muted px-1 py-0.5 rounded text-xs font-mono"
                                    {...props}
                                  />
                                ),
                                pre: ({ node, ...props }) => (
                                  <pre
                                    className="bg-muted p-3 rounded-lg overflow-x-auto text-xs"
                                    {...props}
                                  />
                                ),
                              }}
                            >
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
                        </div>

                        <Card>
                          <CardContent className="p-4 space-y-3">
                            <div className="prose prose-sm max-w-none dark:prose-invert">
                              <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={{
                                  h1: ({ node, ...props }) => (
                                    <h1
                                      className="text-lg font-bold mt-4 mb-2"
                                      {...props}
                                    />
                                  ),
                                  h2: ({ node, ...props }) => (
                                    <h2
                                      className="text-base font-bold mt-3 mb-2"
                                      {...props}
                                    />
                                  ),
                                  h3: ({ node, ...props }) => (
                                    <h3
                                      className="text-sm font-bold mt-2 mb-1"
                                      {...props}
                                    />
                                  ),
                                  ul: ({ node, ...props }) => (
                                    <ul
                                      className="list-disc list-inside space-y-1 my-2"
                                      {...props}
                                    />
                                  ),
                                  ol: ({ node, ...props }) => (
                                    <ol
                                      className="list-decimal list-inside space-y-1 my-2"
                                      {...props}
                                    />
                                  ),
                                  li: ({ node, ...props }) => (
                                    <li
                                      className="text-sm [&>p]:inline"
                                      {...props}
                                    />
                                  ),
                                  p: ({ node, ...props }) => (
                                    <p
                                      className="mb-2 last:mb-0 text-sm leading-relaxed"
                                      {...props}
                                    />
                                  ),
                                  strong: ({ node, ...props }) => (
                                    <strong
                                      className="font-semibold text-foreground"
                                      {...props}
                                    />
                                  ),
                                  em: ({ node, ...props }) => (
                                    <em className="italic" {...props} />
                                  ),
                                  code: ({ node, ...props }) => (
                                    <code
                                      className="bg-muted px-1 py-0.5 rounded text-xs font-mono"
                                      {...props}
                                    />
                                  ),
                                  pre: ({ node, ...props }) => (
                                    <pre
                                      className="bg-muted p-3 rounded-lg overflow-x-auto text-xs"
                                      {...props}
                                    />
                                  ),
                                }}
                              >
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
                      <div
                        className="w-2 h-2 bg-primary/60 rounded-full animate-pulse"
                        style={{ animationDelay: "0.2s" }}
                      />
                      <div
                        className="w-2 h-2 bg-primary/60 rounded-full animate-pulse"
                        style={{ animationDelay: "0.4s" }}
                      />
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
      <div className="p-6 border-t bg-card/30">
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-sm">Ask a Question</h3>
            {!canAsk && (
              <Badge variant="secondary" className="text-xs">
                Load transcript first
              </Badge>
            )}
          </div>

          <div className="space-y-3">
            <Textarea
              placeholder="Ask a question about the video content..."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={!canAsk || isAsking}
              className="min-h-[80px] text-sm resize-none"
              maxLength={2000}
            />

            <div className="flex justify-between items-center">
              <div className="text-xs text-muted-foreground">
                {question.length}/2000 characters
                {question.length > 0 && question.length < 3 && " (min 3)"}
                <span className="ml-4">Ctrl+Enter to send</span>
              </div>

              <Button
                onClick={handleAskQuestion}
                disabled={
                  !canAsk ||
                  question.length < 3 ||
                  question.length > 2000 ||
                  isAsking ||
                  isLoading
                }
                className="text-sm h-8"
                size="sm"
              >
                {isAsking ? (
                  <Loader2 className="w-3 h-3 animate-spin mr-1" />
                ) : (
                  <Send className="w-3 h-3 mr-1" />
                )}
                Ask Question
              </Button>
            </div>

            {/* Recent Questions */}
            {questions.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-medium text-muted-foreground">
                  Recent Questions
                </h4>
                <div className="flex flex-wrap gap-2">
                  {questions.slice(0, 3).map((q, index) => (
                    <button
                      key={index}
                      onClick={() => handleQuestionSelect(q)}
                      className="text-left p-2 text-xs bg-muted/50 hover:bg-muted rounded border transition-colors max-w-xs"
                      disabled={isAsking || !canAsk}
                    >
                      <p className="truncate">{q}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

console.log("🔧 AskTab component loaded");

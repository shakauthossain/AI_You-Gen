import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Send, History } from "lucide-react";

interface QuestionInputProps {
  question: string;
  setQuestion: (question: string) => void;
  onAskQuestion: () => void;
  canAsk: boolean;
  isAsking: boolean;
  isLoading: boolean;
  currentSession: any; // Replace with proper type
  questions: string[];
  onQuestionSelect: (question: string) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
}

export function QuestionInput({
  question,
  setQuestion,
  onAskQuestion,
  canAsk,
  isAsking,
  isLoading,
  currentSession,
  questions,
  onQuestionSelect,
  onKeyDown,
}: QuestionInputProps) {
  return (
    <div className="p-3 border-t bg-card/30">
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-sm">Ask a Question</h3>
          <div className="flex items-center gap-2">
            {!canAsk && (
              <Badge variant="secondary" className="text-xs">
                Load transcript first
              </Badge>
            )}
            {currentSession && (
              <Badge variant="outline" className="text-xs">
                <History className="w-3 h-3 mr-1" />
                Auto-saved
              </Badge>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Textarea
              placeholder="Ask a question about the video content... (conversation will be saved to your history)"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={onKeyDown}
              disabled={!canAsk || isAsking}
              className="min-h-[80px] text-sm resize-none flex-1"
              maxLength={2000}
            />

            <div className="flex flex-col items-center">
              <Button
                onClick={onAskQuestion}
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

              <div className="text-xs text-muted-foreground mt-1 text-center">
                {question.length > 1950 && (
                  <>
                    <span>{question.length}/2000 characters</span>
                    {question.length > 0 && question.length < 3 && " (min 3)"}
                  </>
                )}
                {/* <span className="block">Enter to send</span> */}
              </div>
            </div>
          </div>

          {/* Recent Questions (if you want to keep it later) */}
          {questions.length > 0 && <div className="space-y-2">{/* ... */}</div>}
        </div>
      </div>
    </div>
  );
}

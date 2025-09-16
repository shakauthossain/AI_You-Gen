import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Loader2, Send } from 'lucide-react';

interface QACardProps {
  questions: string[];
  onAskQuestion: (question: string) => Promise<void>;
  canAsk: boolean;
  isLoading: boolean;
}

export function QACard({ questions, onAskQuestion, canAsk, isLoading }: QACardProps) {
  const [question, setQuestion] = useState('');
  const [isAsking, setIsAsking] = useState(false);

  console.log('❓ QACard rendered:', { 
    questionsCount: questions.length, 
    canAsk, 
    isLoading,
    questionLength: question.length 
  });

  const handleAskQuestion = async () => {
    if (question.trim() && question.length >= 3 && question.length <= 2000) {
      console.log('🚀 Asking question:', question.substring(0, 100) + '...');
      setIsAsking(true);
      try {
        await onAskQuestion(question.trim());
        setQuestion(''); // Clear after successful submission
      } finally {
        setIsAsking(false);
      }
    }
  };

  const handleQuestionSelect = (selectedQuestion: string) => {
    console.log('🔄 Selected previous question:', selectedQuestion.substring(0, 50) + '...');
    setQuestion(selectedQuestion);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleAskQuestion();
    }
  };

  const characterCount = question.length;
  const isValidLength = characterCount >= 3 && characterCount <= 2000;
  const canSubmit = canAsk && isValidLength && !isAsking && !isLoading;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Q&A
          </CardTitle>
          {!canAsk && (
            <Badge variant="secondary" className="text-xs">
              Load transcript first
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          <Textarea
            placeholder="Ask a question about the video content..."
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={!canAsk || isAsking}
            className="min-h-[80px] text-sm resize-none"
            maxLength={2000}
          />
          
          <div className="flex justify-between items-center text-xs">
            <span className={`text-muted-foreground ${
              characterCount > 2000 ? 'text-destructive' : 
              characterCount < 3 && characterCount > 0 ? 'text-warning' : ''
            }`}>
              {characterCount}/2000 characters
              {characterCount > 0 && characterCount < 3 && ' (min 3)'}
            </span>
            <span className="text-muted-foreground">
              Ctrl+Enter to send
            </span>
          </div>
        </div>

        <Button
          onClick={handleAskQuestion}
          disabled={!canSubmit}
          className="w-full text-sm h-8"
          size="sm"
        >
          {isAsking ? (
            <Loader2 className="w-3 h-3 animate-spin mr-1" />
          ) : (
            <Send className="w-3 h-3 mr-1" />
          )}
          Ask Question
        </Button>

        {questions.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-muted-foreground">Recent Questions</h4>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {questions.slice(0, 5).map((q, index) => (
                <button
                  key={index}
                  onClick={() => handleQuestionSelect(q)}
                  className="w-full text-left p-2 text-xs bg-muted/50 hover:bg-muted rounded border transition-colors"
                  disabled={isAsking || !canAsk}
                >
                  <p className="truncate">{q}</p>
                </button>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

console.log('🔧 QACard component loaded');
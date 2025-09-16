import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Copy, Eye, EyeOff, CheckCircle, XCircle, RotateCcw } from 'lucide-react';
import { format } from 'date-fns';
import type { SessionState, ParsedMCQ } from '@/types/api';
import { useToast } from '@/hooks/use-toast';
import { MCQGeneratorCard } from '@/components/left-rail/MCQGeneratorCard';

interface MCQsTabProps {
  mcqSets: SessionState['mcqSets'];
  onGenerateMCQs: (numMcqs: number) => Promise<void>;
  onDownloadPDF: (numMcqs: number) => Promise<void>;
  onDownloadDOCX: (numMcqs: number) => Promise<void>;
  canGenerate: boolean;
  isLoading: boolean;
}

export function MCQsTab({ 
  mcqSets, 
  onGenerateMCQs, 
  onDownloadPDF, 
  onDownloadDOCX, 
  canGenerate, 
  isLoading 
}: MCQsTabProps) {
  const { toast } = useToast();
  const [selectedSetIndex, setSelectedSetIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, 'A' | 'B' | 'C' | 'D'>>({});
  const [showAnswers, setShowAnswers] = useState<Record<number, boolean>>({});
  const [quizMode, setQuizMode] = useState(false);

  console.log('📝 MCQsTab rendered:', { 
    mcqSetsCount: mcqSets.length,
    selectedSetIndex,
    quizMode
  });


  const currentSet = mcqSets[selectedSetIndex];

  const copyAllAsMarkdown = () => {
    if (!currentSet) return;

    const markdown = currentSet.mcqs.map((mcq, index) => {
      return `## MCQ ${index + 1}

Question: ${mcq.question}

A) ${mcq.options.A}
B) ${mcq.options.B}
C) ${mcq.options.C}
D) ${mcq.options.D}

Correct Answer: ${mcq.correctAnswer}

`;
    }).join('');

    navigator.clipboard.writeText(markdown);
    toast({
      title: "Copied to clipboard",
      description: "All MCQs have been copied as Markdown.",
    });
    console.log('📋 Copied all MCQs as markdown');
  };

  const handleAnswerChange = (mcqId: number, answer: 'A' | 'B' | 'C' | 'D') => {
    setUserAnswers(prev => ({ ...prev, [mcqId]: answer }));
    
    // In quiz mode, automatically show answer after selection for immediate feedback
    if (quizMode) {
      setShowAnswers(prev => ({ ...prev, [mcqId]: true }));
    }
    
    console.log('✏️ Answer selected:', { mcqId, answer });
  };

  const toggleShowAnswer = (mcqId: number) => {
    setShowAnswers(prev => ({ ...prev, [mcqId]: !prev[mcqId] }));
    console.log('👁️ Toggle answer visibility:', mcqId);
  };

  const resetQuiz = () => {
    setUserAnswers({});
    setShowAnswers({});
    setQuizMode(false);
    console.log('🔄 Quiz reset');
  };

  const startQuiz = () => {
    setUserAnswers({});
    setShowAnswers({});
    setQuizMode(true);
    console.log('🎯 Quiz started');
  };

  const checkAllAnswers = () => {
    if (!currentSet) return;
    
    // Show answers for all questions
    const allAnswers = currentSet.mcqs.reduce((acc, mcq) => {
      acc[mcq.id] = true;
      return acc;
    }, {} as Record<number, boolean>);
    
    setShowAnswers(allAnswers);
    console.log('👁️ All answers revealed');
  };

  const getScoreInfo = () => {
    if (!currentSet || !quizMode) return null;

    const totalAnswered = Object.keys(userAnswers).length;
    const correctAnswers = currentSet.mcqs.filter(mcq => 
      userAnswers[mcq.id] === mcq.correctAnswer
    ).length;

    return {
      total: currentSet.mcqs.length,
      answered: totalAnswered,
      correct: correctAnswers,
      percentage: totalAnswered > 0 ? Math.round((correctAnswers / totalAnswered) * 100) : 0,
      isComplete: totalAnswered === currentSet.mcqs.length,
    };
  };

  const scoreInfo = getScoreInfo();

  // Show celebration toast when quiz is completed
  useEffect(() => {
    if (scoreInfo?.isComplete && quizMode) {
      const message = scoreInfo.percentage >= 90 ? 'Outstanding! 🌟' : 
                     scoreInfo.percentage >= 70 ? 'Well done! 👏' : 
                     scoreInfo.percentage >= 50 ? 'Good effort! 💪' : 'Keep practicing! 📚';
      
      toast({
        title: "Quiz Completed! 🎉",
        description: `${message} You scored ${scoreInfo.percentage}% (${scoreInfo.correct}/${scoreInfo.total})`,
      });
      console.log('🎉 Quiz completed with score:', scoreInfo.percentage + '%');
    }
  }, [scoreInfo?.isComplete, quizMode, toast, scoreInfo?.percentage, scoreInfo?.correct, scoreInfo?.total]);

  if (mcqSets.length === 0) {
    return (
      <div className="h-full flex flex-col">
        {/* MCQ Generator */}
        <div className="p-6 border-b bg-card/30">
          <MCQGeneratorCard
            onGenerateMCQs={onGenerateMCQs}
            onDownloadPDF={onDownloadPDF}
            onDownloadDOCX={onDownloadDOCX}
            canGenerate={canGenerate}
            isLoading={isLoading}
          />
        </div>

        {/* Empty State */}
        <div className="flex items-center justify-center flex-1">
          <div className="text-center space-y-6 max-w-md">
            <div className="w-16 h-16 mx-auto rounded-full bg-muted/50 flex items-center justify-center">
              <FileText className="w-8 h-8 text-muted-foreground" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">
                {!canGenerate ? "Load transcript first" : "No MCQs generated yet"}
              </h3>
              <p className="text-muted-foreground">
                {!canGenerate 
                  ? "Please load a YouTube video transcript to generate multiple choice questions."
                  : "Use the generator above to create MCQs from the video content. You'll be able to take quizzes and download them in various formats."
                }
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* MCQ Generator */}
      <div className="p-6 border-b bg-card/30">
        <MCQGeneratorCard
          onGenerateMCQs={onGenerateMCQs}
          onDownloadPDF={onDownloadPDF}
          onDownloadDOCX={onDownloadDOCX}
          canGenerate={canGenerate}
          isLoading={isLoading}
        />
      </div>

      {/* Header with controls */}
      <div className="p-6 border-b bg-card/30">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold">Multiple Choice Questions</h2>
            <p className="text-muted-foreground">
              {mcqSets.length} set{mcqSets.length !== 1 ? 's' : ''} available
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {mcqSets.length > 1 && (
              <Select
                value={selectedSetIndex.toString()}
                onValueChange={(value) => setSelectedSetIndex(parseInt(value))}
              >
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {mcqSets.map((set, index) => (
                    <SelectItem key={index} value={index.toString()}>
                      Set {index + 1} ({set.mcqs.length} MCQs) - {format(set.timestamp, 'MMM d, HH:mm')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <Button
              variant="outline"
              onClick={copyAllAsMarkdown}
              className="gap-2"
            >
              <Copy className="w-4 h-4" />
              Copy as Markdown
            </Button>

            {!quizMode ? (
              <Button onClick={startQuiz} className="gap-2">
                <FileText className="w-4 h-4" />
                Start Quiz
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={checkAllAnswers}
                  className="gap-2"
                >
                  <Eye className="w-4 h-4" />
                  Check All Answers
                </Button>
                <Button variant="outline" onClick={resetQuiz} className="gap-2">
                  <RotateCcw className="w-4 h-4" />
                  Reset Quiz
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Quiz Score */}
        {quizMode && scoreInfo && (
          <div className="mt-4 p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="font-medium">Quiz Progress:</span>
              <div className="flex items-center gap-4 text-sm">
                <span>
                  Answered: {scoreInfo.answered}/{scoreInfo.total}
                </span>
                {scoreInfo.answered > 0 && (
                  <Badge variant={scoreInfo.percentage >= 70 ? 'default' : 'secondary'}>
                    {scoreInfo.correct}/{scoreInfo.answered} correct ({scoreInfo.percentage}%)
                  </Badge>
                )}
              </div>
            </div>
            
            {/* Quiz Completion Celebration */}
            {scoreInfo.isComplete && (
              <div className="mt-3 p-3 rounded-lg bg-gradient-to-r from-success/10 to-accent/10 border border-success/20">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-success" />
                  <div>
                    <p className="font-medium text-success">Quiz Completed! 🎉</p>
                    <p className="text-sm text-muted-foreground">
                      Final Score: {scoreInfo.correct}/{scoreInfo.total} ({scoreInfo.percentage}%)
                      {scoreInfo.percentage >= 90 ? ' - Excellent!' : 
                       scoreInfo.percentage >= 70 ? ' - Good job!' : 
                       scoreInfo.percentage >= 50 ? ' - Not bad!' : ' - Keep practicing!'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* MCQ List */}
      <ScrollArea className="flex-1">
        <div className="p-6 space-y-6 max-w-4xl mx-auto">
          {currentSet?.mcqs.map((mcq) => {
            const userAnswer = userAnswers[mcq.id];
            const showAnswer = showAnswers[mcq.id] || (quizMode && userAnswer);
            const isCorrect = userAnswer === mcq.correctAnswer;

            return (
              <Card key={mcq.id} className={`transition-colors ${
                quizMode && userAnswer
                  ? isCorrect
                    ? 'border-success/50 bg-success/5'
                    : 'border-destructive/50 bg-destructive/5'
                  : ''
              }`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">
                      MCQ #{mcq.id}
                      {quizMode && userAnswer && (
                        <span className="ml-2">
                          {isCorrect ? (
                            <CheckCircle className="w-5 h-5 text-success inline" />
                          ) : (
                            <XCircle className="w-5 h-5 text-destructive inline" />
                          )}
                        </span>
                      )}
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleShowAnswer(mcq.id)}
                      className="gap-2"
                    >
                      {showAnswer ? (
                        <>
                          <EyeOff className="w-4 h-4" />
                          Hide Answer
                        </>
                      ) : (
                        <>
                          <Eye className="w-4 h-4" />
                          Show Answer
                        </>
                      )}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-base font-medium leading-relaxed">
                    {mcq.question}
                  </div>

                  <RadioGroup
                    value={userAnswer || ''}
                    onValueChange={(value) => handleAnswerChange(mcq.id, value as 'A' | 'B' | 'C' | 'D')}
                    disabled={!quizMode}
                    className="space-y-3"
                  >
                    {(['A', 'B', 'C', 'D'] as const).map((option) => (
                      <div 
                        key={option} 
                        className={`flex items-start space-x-3 p-3 rounded-lg border transition-all duration-200 ${
                          showAnswer && mcq.correctAnswer === option
                            ? 'border-success bg-success/10 shadow-sm'
                            : quizMode && userAnswer === option && userAnswer !== mcq.correctAnswer
                            ? 'border-destructive bg-destructive/10 shadow-sm'
                            : userAnswer === option && !showAnswer
                            ? 'border-primary bg-primary/5 shadow-sm'
                            : quizMode 
                            ? 'border-border hover:border-primary/50 hover:bg-primary/5'
                            : 'border-border hover:border-primary/30'
                        }`}
                      >
                        <RadioGroupItem 
                          value={option} 
                          id={`mcq-${mcq.id}-${option}`}
                          className="mt-0.5"
                        />
                        <Label 
                          htmlFor={`mcq-${mcq.id}-${option}`}
                          className="flex-1 text-sm leading-relaxed cursor-pointer"
                        >
                          <span className="font-medium mr-2">{option})</span>
                          {mcq.options[option]}
                        </Label>
                        {showAnswer && mcq.correctAnswer === option && (
                          <CheckCircle className="w-4 h-4 text-success flex-shrink-0 mt-0.5 animate-pulse" />
                        )}
                        {showAnswer && userAnswer === option && userAnswer !== mcq.correctAnswer && (
                          <XCircle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
                        )}
                      </div>
                    ))}
                  </RadioGroup>

                  {showAnswer && (
                    <div className={`p-3 rounded-lg ${
                      userAnswer === mcq.correctAnswer 
                        ? 'bg-success/10 border border-success/20' 
                        : userAnswer && userAnswer !== mcq.correctAnswer
                        ? 'bg-destructive/10 border border-destructive/20'
                        : 'bg-muted/50'
                    }`}>
                      <div className="flex items-center gap-2 text-sm font-medium">
                        {userAnswer === mcq.correctAnswer ? (
                          <>
                            <CheckCircle className="w-4 h-4 text-success" />
                            <span className="text-success">Correct! ✨</span>
                          </>
                        ) : userAnswer && userAnswer !== mcq.correctAnswer ? (
                          <>
                            <XCircle className="w-4 h-4 text-destructive" />
                            <span className="text-destructive">Incorrect.</span>
                          </>
                        ) : (
                          <CheckCircle className="w-4 h-4 text-success" />
                        )}
                        <span className="text-muted-foreground">
                          Correct Answer: {mcq.correctAnswer}
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}

console.log('🔧 MCQsTab component loaded');
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Target, TrendingUp } from 'lucide-react';

interface ReadabilityStatsProps {
  score: number;
  totalWords: number;
  uniqueWords: number;
  avgWordsPerSentence: number;
}

export function ReadabilityStats({ 
  score, 
  totalWords, 
  uniqueWords, 
  avgWordsPerSentence 
}: ReadabilityStatsProps) {
  console.log('📖 ReadabilityStats rendered:', { 
    score, 
    totalWords, 
    uniqueWords, 
    avgWordsPerSentence 
  });

  const getReadabilityLevel = (score: number): { level: string; color: string; description: string } => {
    if (score >= 90) return { 
      level: 'Very Easy', 
      color: 'success', 
      description: '5th grade level' 
    };
    if (score >= 80) return { 
      level: 'Easy', 
      color: 'success', 
      description: '6th grade level' 
    };
    if (score >= 70) return { 
      level: 'Fairly Easy', 
      color: 'accent', 
      description: '7th grade level' 
    };
    if (score >= 60) return { 
      level: 'Standard', 
      color: 'primary', 
      description: '8th-9th grade level' 
    };
    if (score >= 50) return { 
      level: 'Fairly Difficult', 
      color: 'warning', 
      description: '10th-12th grade level' 
    };
    if (score >= 30) return { 
      level: 'Difficult', 
      color: 'destructive', 
      description: 'College level' 
    };
    return { 
      level: 'Very Difficult', 
      color: 'destructive', 
      description: 'Graduate level' 
    };
  };

  const readabilityInfo = getReadabilityLevel(score);
  const vocabularyDiversity = Math.round((uniqueWords / totalWords) * 100);

  return (
    <div className="space-y-4">
      {/* Readability Score */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-primary" />
              <span className="font-medium text-sm">Readability Score</span>
            </div>
            <Badge variant={readabilityInfo.color as any}>
              {readabilityInfo.level}
            </Badge>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Flesch Reading Ease</span>
              <span className="font-semibold">{score}/100</span>
            </div>
            <Progress value={score} className="h-2" />
            <p className="text-xs text-muted-foreground">
              {readabilityInfo.description}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Vocabulary Diversity */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-accent" />
              <span className="font-medium text-sm">Vocabulary Diversity</span>
            </div>
            <Badge variant="secondary">
              {vocabularyDiversity}%
            </Badge>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Unique words ratio</span>
              <span className="font-semibold">{uniqueWords}/{totalWords}</span>
            </div>
            <Progress value={vocabularyDiversity} className="h-2" />
            <p className="text-xs text-muted-foreground">
              Higher diversity indicates richer vocabulary
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Sentence Complexity */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-warning" />
              <span className="font-medium text-sm">Sentence Complexity</span>
            </div>
            <Badge variant="outline">
              {avgWordsPerSentence} words/sentence
            </Badge>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Average sentence length</span>
              <span className="font-semibold">{avgWordsPerSentence}</span>
            </div>
            <Progress 
              value={Math.min(100, (avgWordsPerSentence / 25) * 100)} 
              className="h-2" 
            />
            <p className="text-xs text-muted-foreground">
              {avgWordsPerSentence < 15 ? 'Simple sentences' : 
               avgWordsPerSentence < 20 ? 'Moderate complexity' : 
               'Complex sentences'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Quick insights */}
      <div className="text-xs text-muted-foreground space-y-1">
        <p>• Content is rated as "{readabilityInfo.level.toLowerCase()}" to read</p>
        <p>• Vocabulary diversity of {vocabularyDiversity}% {vocabularyDiversity > 50 ? 'suggests rich' : 'indicates focused'} content</p>
        <p>• {avgWordsPerSentence < 15 ? 'Short sentences improve readability' : 'Longer sentences may challenge readers'}</p>
      </div>
    </div>
  );
}

console.log('🔧 ReadabilityStats component loaded');
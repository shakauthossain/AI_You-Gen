import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BarChart3, TrendingUp, Target, BookOpen } from 'lucide-react';
import { KeywordChart } from '../insights/KeywordChart';
import { TopicTimeline } from '../insights/TopicTimeline';
import { SnippetHeatmap } from '../insights/SnippetHeatmap';
import { ReadabilityStats } from '../insights/ReadabilityStats';
import type { Snippet, SessionState } from '@/types/api';
import { timestampToSeconds } from '@/utils/mcq-parser';

interface InsightsTabProps {
  snippets: Snippet[];
  conversations: SessionState['conversations'];
}

export function InsightsTab({ snippets, conversations }: InsightsTabProps) {
  console.log('📊 InsightsTab rendered:', { 
    snippetsCount: snippets.length,
    conversationsCount: conversations.length
  });

  const insights = useMemo(() => {
    // Extract keywords from all snippets
    const allText = snippets.map(s => s.content).join(' ');
    const words = allText.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3);

    // Remove common stopwords
    const stopwords = new Set(['this', 'that', 'with', 'have', 'will', 'from', 'they', 'been', 'have', 'their', 'said', 'each', 'which', 'what', 'there', 'more', 'like', 'also', 'into', 'after', 'first', 'than', 'many', 'some', 'time', 'very', 'when', 'where', 'only', 'about', 'over']);
    const filteredWords = words.filter(word => !stopwords.has(word));

    // Count word frequency
    const wordCounts = filteredWords.reduce((acc, word) => {
      acc[word] = (acc[word] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Get top keywords
    const topKeywords = Object.entries(wordCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 20)
      .map(([word, count]) => ({ word, count }));

    // Process snippets for timeline
    const processedSnippets = snippets.map(snippet => ({
      ...snippet,
      seconds: timestampToSeconds(snippet.timestamp),
    })).sort((a, b) => a.seconds - b.seconds);

    // Calculate readability metrics
    const totalWords = allText.split(/\s+/).length;
    const avgWordsPerSentence = totalWords / Math.max(allText.split(/[.!?]+/).length, 1);
    const complexWords = words.filter(word => word.length > 6).length;
    const readabilityScore = Math.max(0, Math.min(100, 206.835 - (1.015 * avgWordsPerSentence) - (84.6 * (complexWords / totalWords))));

    return {
      topKeywords,
      processedSnippets,
      totalWords,
      readabilityScore: Math.round(readabilityScore),
      avgWordsPerSentence: Math.round(avgWordsPerSentence * 10) / 10,
      uniqueWords: new Set(words).size,
    };
  }, [snippets]);

  if (snippets.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-4 max-w-md">
          <div className="w-16 h-16 mx-auto rounded-full bg-muted/50 flex items-center justify-center">
            <BarChart3 className="w-8 h-8 text-muted-foreground" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">No insights yet</h3>
            <p className="text-muted-foreground">
              Ask questions to generate insights from video content. Visualizations will appear here as you interact with the transcript.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">Content Insights</h2>
          <p className="text-muted-foreground">
            Visual analysis of your YouTube video content based on {snippets.length} snippets from {conversations.length} conversations.
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">{insights.totalWords}</div>
              <div className="text-sm text-muted-foreground">Total Words</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-accent">{insights.uniqueWords}</div>
              <div className="text-sm text-muted-foreground">Unique Words</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-success">{insights.readabilityScore}</div>
              <div className="text-sm text-muted-foreground">Readability Score</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-warning">{insights.avgWordsPerSentence}</div>
              <div className="text-sm text-muted-foreground">Avg Words/Sentence</div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Keyword Frequency */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="w-5 h-5" />
                Top Keywords
              </CardTitle>
            </CardHeader>
            <CardContent>
              <KeywordChart keywords={insights.topKeywords} />
            </CardContent>
          </Card>

          {/* Readability Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Content Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ReadabilityStats 
                score={insights.readabilityScore}
                totalWords={insights.totalWords}
                uniqueWords={insights.uniqueWords}
                avgWordsPerSentence={insights.avgWordsPerSentence}
              />
            </CardContent>
          </Card>

          {/* Topic Timeline */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Content Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <TopicTimeline snippets={insights.processedSnippets} />
            </CardContent>
          </Card>

          {/* Snippet Heatmap */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Snippet Density
              </CardTitle>
            </CardHeader>
            <CardContent>
              <SnippetHeatmap snippets={insights.processedSnippets} />
            </CardContent>
          </Card>
        </div>
      </div>
    </ScrollArea>
  );
}

console.log('🔧 InsightsTab component loaded');
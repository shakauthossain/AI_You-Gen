import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { secondsToTimestamp } from '@/utils/mcq-parser';

interface TopicTimelineProps {
  snippets: Array<{ content: string; timestamp: string; seconds: number }>;
}

export function TopicTimeline({ snippets }: TopicTimelineProps) {
  console.log('📈 TopicTimeline rendered:', { snippetsCount: snippets.length });

  const timelineData = useMemo(() => {
    if (snippets.length === 0) return [];

    // Group snippets into 30-second buckets
    const maxSeconds = Math.max(...snippets.map(s => s.seconds));
    const bucketSize = 30; // 30 seconds per bucket
    const numBuckets = Math.ceil(maxSeconds / bucketSize);
    
    const buckets = Array.from({ length: numBuckets }, (_, i) => ({
      time: i * bucketSize,
      timeLabel: secondsToTimestamp(i * bucketSize),
      snippetCount: 0,
      totalWords: 0,
      avgWordLength: 0,
    }));

    // Fill buckets with snippet data
    snippets.forEach(snippet => {
      const bucketIndex = Math.floor(snippet.seconds / bucketSize);
      if (bucketIndex < buckets.length) {
        const bucket = buckets[bucketIndex];
        bucket.snippetCount += 1;
        
        const words = snippet.content.split(/\s+/);
        bucket.totalWords += words.length;
        bucket.avgWordLength = words.reduce((sum, word) => sum + word.length, 0) / words.length;
      }
    });

    return buckets.filter(bucket => bucket.snippetCount > 0);
  }, [snippets]);

  if (snippets.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-muted-foreground">
        No timeline data to display
      </div>
    );
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={timelineData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
          <XAxis 
            dataKey="timeLabel"
            tick={{ fontSize: 12 }}
            interval="preserveStartEnd"
          />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip 
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload;
                return (
                  <div className="bg-card border rounded-lg p-3 shadow-lg">
                    <p className="font-medium">Time: {label}</p>
                    <p className="text-primary">
                      Snippets: {data.snippetCount}
                    </p>
                    <p className="text-accent">
                      Total Words: {data.totalWords}
                    </p>
                    <p className="text-muted-foreground">
                      Avg Word Length: {data.avgWordLength.toFixed(1)}
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Line 
            type="monotone" 
            dataKey="snippetCount" 
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
          />
          <Line 
            type="monotone" 
            dataKey="totalWords" 
            stroke="hsl(var(--accent))"
            strokeWidth={2}
            dot={{ fill: 'hsl(var(--accent))', strokeWidth: 2, r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

console.log('🔧 TopicTimeline component loaded');
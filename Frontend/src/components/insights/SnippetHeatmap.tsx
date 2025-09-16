import { useMemo } from 'react';
import { secondsToTimestamp } from '@/utils/mcq-parser';

interface SnippetHeatmapProps {
  snippets: Array<{ content: string; timestamp: string; seconds: number }>;
}

export function SnippetHeatmap({ snippets }: SnippetHeatmapProps) {
  console.log('🔥 SnippetHeatmap rendered:', { snippetsCount: snippets.length });

  const heatmapData = useMemo(() => {
    if (snippets.length === 0) return [];

    const maxSeconds = Math.max(...snippets.map(s => s.seconds));
    const bucketSize = 30; // 30 seconds per bucket
    const numBuckets = Math.ceil(maxSeconds / bucketSize);
    
    const buckets = Array.from({ length: numBuckets }, (_, i) => ({
      index: i,
      startTime: i * bucketSize,
      endTime: (i + 1) * bucketSize,
      timeLabel: secondsToTimestamp(i * bucketSize),
      count: 0,
      intensity: 0,
    }));

    // Count snippets in each bucket
    snippets.forEach(snippet => {
      const bucketIndex = Math.floor(snippet.seconds / bucketSize);
      if (bucketIndex < buckets.length) {
        buckets[bucketIndex].count += 1;
      }
    });

    // Calculate intensity (normalize to 0-1)
    const maxCount = Math.max(...buckets.map(b => b.count));
    buckets.forEach(bucket => {
      bucket.intensity = maxCount > 0 ? bucket.count / maxCount : 0;
    });

    return buckets;
  }, [snippets]);

  if (snippets.length === 0) {
    return (
      <div className="h-32 flex items-center justify-center text-muted-foreground">
        No data for heatmap
      </div>
    );
  }

  const getIntensityColor = (intensity: number): string => {
    if (intensity === 0) return 'hsl(var(--muted))';
    if (intensity < 0.3) return 'hsl(var(--primary) / 0.3)';
    if (intensity < 0.6) return 'hsl(var(--primary) / 0.6)';
    return 'hsl(var(--primary))';
  };

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">
        Snippet density across video timeline (30-second intervals)
      </div>
      
      {/* Heatmap visualization */}
      <div className="space-y-2">
        <div className="flex flex-wrap gap-1">
          {heatmapData.map((bucket) => (
            <div
              key={bucket.index}
              className="group relative"
            >
              <div
                className="w-8 h-8 rounded border border-border/50 cursor-pointer transition-all hover:scale-110"
                style={{ backgroundColor: getIntensityColor(bucket.intensity) }}
                title={`${bucket.timeLabel}: ${bucket.count} snippets`}
              />
              
              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-card border rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                {bucket.timeLabel}: {bucket.count} snippet{bucket.count !== 1 ? 's' : ''}
              </div>
            </div>
          ))}
        </div>
        
        {/* Legend */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span>Low activity</span>
          <div className="flex gap-1">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: 'hsl(var(--muted))' }}></div>
            <div className="w-3 h-3 rounded" style={{ backgroundColor: 'hsl(var(--primary) / 0.3)' }}></div>
            <div className="w-3 h-3 rounded" style={{ backgroundColor: 'hsl(var(--primary) / 0.6)' }}></div>
            <div className="w-3 h-3 rounded" style={{ backgroundColor: 'hsl(var(--primary))' }}></div>
          </div>
          <span>High activity</span>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-4 text-center">
        <div>
          <div className="text-lg font-semibold text-primary">
            {heatmapData.filter(b => b.count > 0).length}
          </div>
          <div className="text-xs text-muted-foreground">Active Periods</div>
        </div>
        <div>
          <div className="text-lg font-semibold text-accent">
            {Math.max(...heatmapData.map(b => b.count))}
          </div>
          <div className="text-xs text-muted-foreground">Peak Activity</div>
        </div>
        <div>
          <div className="text-lg font-semibold text-success">
            {(heatmapData.reduce((sum, b) => sum + b.count, 0) / heatmapData.filter(b => b.count > 0).length || 0).toFixed(1)}
          </div>
          <div className="text-xs text-muted-foreground">Avg per Period</div>
        </div>
      </div>
    </div>
  );
}

console.log('🔧 SnippetHeatmap component loaded');
import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface KeywordChartProps {
  keywords: Array<{ word: string; count: number }>;
}

export function KeywordChart({ keywords }: KeywordChartProps) {
  console.log('📊 KeywordChart rendered:', { keywordsCount: keywords.length });

  const chartData = useMemo(() => {
    return keywords.slice(0, 10).map(item => ({
      word: item.word.length > 8 ? item.word.substring(0, 8) + '...' : item.word,
      fullWord: item.word,
      count: item.count,
    }));
  }, [keywords]);

  if (keywords.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-muted-foreground">
        No keywords to display
      </div>
    );
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
          <XAxis 
            dataKey="word" 
            tick={{ fontSize: 12 }}
            angle={-45}
            textAnchor="end"
            height={60}
          />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip 
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload;
                return (
                  <div className="bg-card border rounded-lg p-3 shadow-lg">
                    <p className="font-medium">{data.fullWord}</p>
                    <p className="text-primary">
                      Frequency: {payload[0].value}
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Bar 
            dataKey="count" 
            fill="hsl(var(--primary))"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

console.log('🔧 KeywordChart component loaded');
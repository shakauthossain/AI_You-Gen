import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Loader2, Play, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { TranscriptStatus, AppError } from '@/types/api';

interface VideoLoaderProps {
  url: string;
  status: TranscriptStatus;
  error: AppError | null;
  onUrlChange: (url: string) => void;
  onLoadTranscript: (url: string) => Promise<void>;
  canLoad: boolean;
  isLoading: boolean;
}

export function VideoLoader({
  url,
  status,
  error,
  onUrlChange,
  onLoadTranscript,
  canLoad,
  isLoading,
}: VideoLoaderProps) {
  const [inputUrl, setInputUrl] = useState(url);

  console.log('🎬 VideoLoader rendered:', { 
    url, 
    status, 
    error: error?.message, 
    canLoad, 
    isLoading 
  });

  const handleUrlChange = (value: string) => {
    setInputUrl(value);
    onUrlChange(value);
  };

  const handleLoadTranscript = async () => {
    if (inputUrl.trim()) {
      console.log('▶️ Loading transcript for URL:', inputUrl);
      await onLoadTranscript(inputUrl.trim());
    }
  };

  const getStatusBadge = () => {
    switch (status) {
      case 'idle':
        return <Badge variant="secondary">Ready</Badge>;
      case 'loading':
        return (
          <Badge variant="secondary" className="gap-1">
            <Loader2 className="w-3 h-3 animate-spin" />
            Loading
          </Badge>
        );
      case 'loaded':
        return (
          <Badge variant="default" className="bg-success text-success-foreground gap-1">
            <CheckCircle className="w-3 h-3" />
            Loaded
          </Badge>
        );
      case 'error':
        return (
          <Badge variant="destructive" className="gap-1">
            <AlertCircle className="w-3 h-3" />
            Error
          </Badge>
        );
    }
  };

  const isValidYouTubeUrl = (url: string): boolean => {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.includes('youtube.com') || urlObj.hostname.includes('youtu.be');
    } catch {
      return false;
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">Video Loader</CardTitle>
          {getStatusBadge()}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          <Input
            placeholder="Enter YouTube URL..."
            value={inputUrl}
            onChange={(e) => handleUrlChange(e.target.value)}
            disabled={isLoading}
            className="text-sm"
          />
          
          {inputUrl && !isValidYouTubeUrl(inputUrl) && (
            <p className="text-xs text-destructive">
              Please enter a valid YouTube URL
            </p>
          )}
        </div>

        <div className="flex gap-2">
          <Button
            onClick={handleLoadTranscript}
            disabled={!canLoad || !isValidYouTubeUrl(inputUrl) || isLoading}
            className="flex-1 text-sm h-8"
            size="sm"
          >
            {isLoading ? (
              <Loader2 className="w-3 h-3 animate-spin mr-1" />
            ) : (
              <Play className="w-3 h-3 mr-1" />
            )}
            {status === 'loaded' ? 'Re-index' : 'Load Transcript'}
          </Button>
          
          {status === 'loaded' && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleLoadTranscript}
              disabled={isLoading}
              className="h-8 px-2"
            >
              <RefreshCw className="w-3 h-3" />
            </Button>
          )}
        </div>

        {error && (
          <Alert variant="destructive" className="py-2">
            <AlertCircle className="h-3 w-3" />
            <AlertDescription className="text-xs">
              {error.message}
            </AlertDescription>
          </Alert>
        )}

        {status === 'loaded' && (
          <div className="text-xs text-muted-foreground">
            <p>✅ Transcript indexed successfully</p>
            <p className="mt-1">Ready for questions and MCQ generation</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

console.log('🔧 VideoLoader component loaded');
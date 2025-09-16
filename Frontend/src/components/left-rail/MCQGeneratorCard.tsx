import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { FileText, Download, Loader2, FileDown, BookOpen } from 'lucide-react';

interface MCQGeneratorCardProps {
  onGenerateMCQs: (numMcqs: number) => Promise<void>;
  onDownloadPDF: (numMcqs: number) => Promise<void>;
  onDownloadDOCX: (numMcqs: number) => Promise<void>;
  canGenerate: boolean;
  isLoading: boolean;
}

export function MCQGeneratorCard({
  onGenerateMCQs,
  onDownloadPDF,
  onDownloadDOCX,
  canGenerate,
  isLoading,
}: MCQGeneratorCardProps) {
  const [numMcqs, setNumMcqs] = useState(5);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDownloading, setIsDownloading] = useState<'pdf' | 'docx' | null>(null);

  console.log('📝 MCQGeneratorCard rendered:', { 
    numMcqs, 
    canGenerate, 
    isLoading, 
    isGenerating,
    isDownloading
  });

  const handleGenerateMCQs = async () => {
    if (numMcqs >= 1 && numMcqs <= 50) {
      console.log('🎯 Generating MCQs:', numMcqs);
      setIsGenerating(true);
      try {
        await onGenerateMCQs(numMcqs);
      } finally {
        setIsGenerating(false);
      }
    }
  };

  const handleDownloadPDF = async () => {
    console.log('📄 Downloading PDF with', numMcqs, 'MCQs');
    setIsDownloading('pdf');
    try {
      await onDownloadPDF(numMcqs);
    } finally {
      setIsDownloading(null);
    }
  };

  const handleDownloadDOCX = async () => {
    console.log('📄 Downloading DOCX with', numMcqs, 'MCQs');
    setIsDownloading('docx');
    try {
      await onDownloadDOCX(numMcqs);
    } finally {
      setIsDownloading(null);
    }
  };

  const handleNumMcqsChange = (value: string) => {
    const num = parseInt(value, 10);
    if (!isNaN(num) && num >= 1 && num <= 50) {
      setNumMcqs(num);
    }
  };

  const isValidNumber = numMcqs >= 1 && numMcqs <= 50;
  const canSubmit = canGenerate && isValidNumber && !isGenerating && !isLoading;
  const canDownload = canGenerate && isValidNumber && !isDownloading && !isLoading;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            MCQ Generator
          </CardTitle>
          {!canGenerate && (
            <Badge variant="secondary" className="text-xs">
              Load transcript first
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          <Label htmlFor="mcq-count" className="text-xs font-medium">
            Number of MCQs (1-50)
          </Label>
          <Input
            id="mcq-count"
            type="number"
            min={1}
            max={50}
            value={numMcqs}
            onChange={(e) => handleNumMcqsChange(e.target.value)}
            disabled={!canGenerate || isGenerating || isDownloading !== null}
            className="text-sm h-8"
          />
          {!isValidNumber && (
            <p className="text-xs text-destructive">
              Please enter a number between 1 and 50
            </p>
          )}
        </div>

        <Button
          onClick={handleGenerateMCQs}
          disabled={!canSubmit}
          className="w-full text-sm h-8"
          size="sm"
        >
          {isGenerating ? (
            <Loader2 className="w-3 h-3 animate-spin mr-1" />
          ) : (
            <FileText className="w-3 h-3 mr-1" />
          )}
          Generate MCQs
        </Button>

        <div className="space-y-1">
          <h4 className="text-xs font-medium text-muted-foreground">Downloads</h4>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadPDF}
              disabled={!canDownload}
              className="text-xs h-8"
            >
              {isDownloading === 'pdf' ? (
                <Loader2 className="w-3 h-3 animate-spin mr-1" />
              ) : (
                <FileDown className="w-3 h-3 mr-1" />
              )}
              PDF
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadDOCX}
              disabled={!canDownload}
              className="text-xs h-8"
            >
              {isDownloading === 'docx' ? (
                <Loader2 className="w-3 h-3 animate-spin mr-1" />
              ) : (
                <Download className="w-3 h-3 mr-1" />
              )}
              DOCX
            </Button>
          </div>
        </div>

        <div className="text-xs text-muted-foreground">
          <p>💡 Generate MCQs first, then download in your preferred format</p>
        </div>
      </CardContent>
    </Card>
  );
}

console.log('🔧 MCQGeneratorCard component loaded');
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Loader2, PenTool, Film, Copy, Check } from 'lucide-react';
import { apiService } from '@/services/api';
import { useToast } from '@/components/ui/use-toast';
import ReactMarkdown from 'react-markdown';
import type { BlogGenerateResponse, ClipsGenerateResponse } from '@/types/api';

interface ContentCreatorTabProps {
  url: string;
  canGenerate: boolean;
}

export function ContentCreatorTab({ url, canGenerate }: ContentCreatorTabProps) {
  const [blogLoading, setBlogLoading] = useState(false);
  const [clipsLoading, setClipsLoading] = useState(false);
  const [blogResult, setBlogResult] = useState<string>('');
  const [clipsResult, setClipsResult] = useState<Array<{ title: string; content: string; timestamp?: string }>>([]);
  const [blogStyle, setBlogStyle] = useState('blog');
  const [numClips, setNumClips] = useState(3);
  const [copiedStates, setCopiedStates] = useState<{ [key: string]: boolean }>({});
  const { toast } = useToast();

  const handleGenerateBlog = async () => {
    if (!url || !canGenerate) return;
    
    setBlogLoading(true);
    setBlogResult('');
    
    try {
      const response = await apiService.generateBlog({
        req: { url },
        style: blogStyle
      });
      
      console.log('Blog API Response:', response);
      
      // Handle different possible response formats
      const responseAny = response as any;
      if (responseAny.blog) {
        setBlogResult(responseAny.blog);
      } else if (typeof responseAny === 'string') {
        setBlogResult(responseAny);
      } else if (responseAny.content) {
        setBlogResult(responseAny.content);
      } else {
        // Fallback: show the entire response as JSON
        setBlogResult(JSON.stringify(responseAny, null, 2));
      }
      
      toast({
        title: "Success",
        description: "Blog generated successfully!",
      });
    } catch (error) {
      console.error('Error generating blog:', error);
      toast({
        title: "Error",
        description: "Failed to generate blog. Please try again.",
        variant: "destructive",
      });
    } finally {
      setBlogLoading(false);
    }
  };

  const handleGenerateClips = async () => {
    if (!url || !canGenerate) return;
    
    setClipsLoading(true);
    setClipsResult([]);
    
    try {
      const response = await apiService.generateClips({
        req: { url },
        num_clips: numClips
      });
      
      console.log('Clips API Response:', response);
      
      let processedClips = [];
      const responseAny = response as any;
      
      // Handle different possible response formats
      if (responseAny.clips && Array.isArray(responseAny.clips)) {
        processedClips = responseAny.clips;
      } else if (Array.isArray(responseAny)) {
        processedClips = responseAny;
      } else if (typeof responseAny === 'object' && responseAny !== null) {
        // Try to find an array in the response object
        const possibleArrays = Object.values(responseAny).filter(Array.isArray);
        if (possibleArrays.length > 0) {
          processedClips = possibleArrays[0];
        } else {
          // Convert object to a single "clip"
          processedClips = [{
            title: "Generated Content",
            content: JSON.stringify(responseAny, null, 2),
            timestamp: ""
          }];
        }
      }
      
      // Ensure each clip has the required structure
      processedClips = processedClips.map((clip: any, index: number) => ({
        title: clip.title || `Clip ${index + 1}`,
        content: clip.content || (typeof clip === 'string' ? clip : JSON.stringify(clip)),
        timestamp: clip.timestamp || ""
      }));
      
      setClipsResult(processedClips);
      toast({
        title: "Success",
        description: `${processedClips.length} clips generated successfully!`,
      });
    } catch (error) {
      console.error('Error generating clips:', error);
      toast({
        title: "Error",
        description: "Failed to generate clips. Please try again.",
        variant: "destructive",
      });
    } finally {
      setClipsLoading(false);
    }
  };

  const copyToClipboard = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedStates({ ...copiedStates, [key]: true });
      toast({
        title: "Copied!",
        description: "Content copied to clipboard",
      });
      setTimeout(() => {
        setCopiedStates({ ...copiedStates, [key]: false });
      }, 2000);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  if (!canGenerate) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <Card className="max-w-md mx-auto">
          <CardContent className="flex flex-col items-center text-center p-8">
            <div className="mb-4 p-3 rounded-full bg-primary/10">
              <PenTool className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Content Creator Tools</h3>
            <p className="text-muted-foreground mb-4">
              Load a video transcript first to access content creation features.
            </p>
            <Badge variant="outline" className="text-sm">
              Load Transcript Required
            </Badge>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-full p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2">Content Creator Studio</h2>
          <p className="text-muted-foreground">
            Transform your video content into engaging blogs and clips
          </p>
        </div>

        <Tabs defaultValue="blog" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="blog" className="flex items-center gap-2">
              <PenTool className="h-4 w-4" />
              Blog Generator
            </TabsTrigger>
            <TabsTrigger value="clips" className="flex items-center gap-2">
              <Film className="h-4 w-4" />
              Clips Generator
            </TabsTrigger>
          </TabsList>

          <TabsContent value="blog" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PenTool className="h-5 w-5" />
                  Generate Blog Content
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="blog-style">Writing Style</Label>
                    <Select value={blogStyle} onValueChange={setBlogStyle}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select style" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="blog">Blog Post</SelectItem>
                        <SelectItem value="article">Article</SelectItem>
                        <SelectItem value="casual">Casual</SelectItem>
                        <SelectItem value="professional">Professional</SelectItem>
                        <SelectItem value="tutorial">Tutorial</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end">
                    <Button 
                      onClick={handleGenerateBlog}
                      disabled={blogLoading}
                      className="w-full"
                    >
                      {blogLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <PenTool className="mr-2 h-4 w-4" />
                          Generate Blog
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {blogResult && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Generated Blog Content</Label>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(blogResult, 'blog')}
                        className="flex items-center gap-1"
                      >
                        {copiedStates.blog ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                        {copiedStates.blog ? 'Copied!' : 'Copy'}
                      </Button>
                    </div>
                    <div className="border rounded-md p-4 max-h-[400px] overflow-y-auto bg-background prose prose-sm max-w-none dark:prose-invert">
                      <ReactMarkdown>
                        {blogResult}
                      </ReactMarkdown>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="clips" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Film className="h-5 w-5" />
                  Generate Video Clips
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="num-clips">Number of Clips</Label>
                    <Select value={numClips.toString()} onValueChange={(value) => setNumClips(parseInt(value))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select number" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="3">3 Clips</SelectItem>
                        <SelectItem value="5">5 Clips</SelectItem>
                        <SelectItem value="7">7 Clips</SelectItem>
                        <SelectItem value="10">10 Clips</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end">
                    <Button 
                      onClick={handleGenerateClips}
                      disabled={clipsLoading}
                      className="w-full"
                    >
                      {clipsLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Film className="mr-2 h-4 w-4" />
                          Generate Clips
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {clipsResult.length > 0 && (
                  <div className="space-y-4">
                    <Label>Generated Clips ({clipsResult.length})</Label>
                    <div className="grid gap-4">
                      {clipsResult.map((clip, index) => (
                        <Card key={index} className="border-l-4 border-l-primary">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <Badge variant="secondary">Clip {index + 1}</Badge>
                                {clip.timestamp && (
                                  <Badge variant="outline">{clip.timestamp}</Badge>
                                )}
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard(clip.content, `clip-${index}`)}
                                className="flex items-center gap-1"
                              >
                                {copiedStates[`clip-${index}`] ? (
                                  <Check className="h-4 w-4" />
                                ) : (
                                  <Copy className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                            <h4 className="font-semibold mb-2">{clip.title}</h4>
                            <div className="text-sm text-muted-foreground leading-relaxed prose prose-sm max-w-none dark:prose-invert">
                              <ReactMarkdown>
                                {clip.content}
                              </ReactMarkdown>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
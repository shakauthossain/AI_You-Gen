import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Search, User, Bot, Copy, MessageSquare, Filter, ScrollText } from 'lucide-react';
import { format } from 'date-fns';
import type { SessionState } from '@/types/api';
import { useToast } from '@/hooks/use-toast';

interface TranscriptTabProps {
  conversations: SessionState['conversations'];
}

export function TranscriptTab({ conversations }: TranscriptTabProps) {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');

  console.log('📜 TranscriptTab rendered:', { 
    conversationsCount: conversations.length,
    searchQuery
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: "Content has been copied.",
    });
  };

  const copyAllConversations = () => {
    const allText = filteredConversations
      .filter(conv => !conv.isSystem)
      .map(conv => `Q: ${conv.question}\n\nA: ${conv.answer}`)
      .join('\n\n---\n\n');
    
    navigator.clipboard.writeText(allText);
    toast({
      title: "All conversations copied",
      description: "Complete Q&A conversations copied to clipboard.",
    });
  };

  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    
    const query = searchQuery.toLowerCase();
    return conversations.filter(conv => 
      conv.question?.toLowerCase().includes(query) || 
      conv.answer?.toLowerCase().includes(query)
    );
  }, [conversations, searchQuery]);

  if (conversations.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-4 max-w-md">
          <div className="w-16 h-16 mx-auto rounded-full bg-muted/50 flex items-center justify-center">
            <MessageSquare className="w-8 h-8 text-muted-foreground" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">No conversations yet</h3>
            <p className="text-muted-foreground">
              Ask questions in the Ask tab to see your Q&A conversations here.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header with search and controls */}
      <div className="p-6 border-b bg-card/30 space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold">Q&A Conversations</h2>
            <p className="text-muted-foreground">
              {filteredConversations.filter(c => !c.isSystem).length} conversations
              {searchQuery && ` matching "${searchQuery}"`}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={copyAllConversations}
              className="gap-2"
            >
              <Copy className="w-4 h-4" />
              Copy All Q&A
            </Button>
          </div>
        </div>

        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search questions and answers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-6 space-y-6 max-w-4xl mx-auto">
          {filteredConversations.filter(c => !c.isSystem).length === 0 ? (
            <div className="text-center py-12">
              <div className="text-muted-foreground">
                {searchQuery 
                  ? `No conversations match your search query "${searchQuery}"`
                  : 'No Q&A conversations yet. Ask questions to see them here.'
                }
              </div>
            </div>
          ) : (
            filteredConversations
              .filter(conversation => !conversation.isSystem)
              .map((conversation, index) => (
                <div key={index} className="space-y-4">
                  {/* User Question */}
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">Question</span>
                        <span className="text-xs text-muted-foreground">
                          {format(conversation.timestamp, 'MMM d, HH:mm')}
                        </span>
                      </div>
                      <Card>
                        <CardContent className="p-4">
                          <p className="text-sm leading-relaxed">
                            {searchQuery ? (
                              conversation.question.split(new RegExp(`(${searchQuery})`, 'gi')).map((part, i) => (
                                <span
                                  key={i}
                                  className={
                                    part.toLowerCase() === searchQuery.toLowerCase()
                                      ? 'bg-yellow-200 dark:bg-yellow-800 px-1 rounded'
                                      : ''
                                  }
                                >
                                  {part}
                                </span>
                              ))
                            ) : (
                              conversation.question
                            )}
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  {/* AI Answer */}
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">Answer</span>
                      </div>
                      
                      <Card>
                        <CardContent className="p-4 space-y-3">
                          <div className="prose prose-sm max-w-none dark:prose-invert">
                            {conversation.answer.split('\n').map((paragraph, pIndex) => (
                              paragraph.trim() && (
                                <p key={pIndex} className="text-sm leading-relaxed">
                                  {searchQuery ? (
                                    paragraph.split(new RegExp(`(${searchQuery})`, 'gi')).map((part, i) => (
                                      <span
                                        key={i}
                                        className={
                                          part.toLowerCase() === searchQuery.toLowerCase()
                                            ? 'bg-yellow-200 dark:bg-yellow-800 px-1 rounded'
                                            : ''
                                        }
                                      >
                                        {part}
                                      </span>
                                    ))
                                  ) : (
                                    paragraph
                                  )}
                                </p>
                              )
                            ))}
                          </div>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(`Q: ${conversation.question}\n\nA: ${conversation.answer}`)}
                            className="text-xs h-6 px-2"
                          >
                            <Copy className="w-3 h-3 mr-1" />
                            Copy Q&A
                          </Button>
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  {index < filteredConversations.filter(c => !c.isSystem).length - 1 && (
                    <Separator className="my-6" />
                  )}
                </div>
              ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

console.log('🔧 TranscriptTab component loaded');
import React, { useEffect, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Plus,
  MessageSquare,
  Video,
  Calendar,
  Clock,
  MoreVertical,
  Trash2,
  History,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import {
  format,
  isToday,
  isYesterday,
  isThisWeek,
  isThisMonth,
} from "date-fns";
import { apiService, type ChatSession } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ChatHistorySidebarProps {
  currentVideoUrl?: string;
  onSessionSelect?: (session: ChatSession) => void;
  onNewChat?: () => void;
  className?: string;
}

export function ChatHistorySidebar({
  currentVideoUrl,
  onSessionSelect,
  onNewChat,
  className = "",
}: ChatHistorySidebarProps) {
  const { getToken } = useAuth();
  const { toast } = useToast();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(
    null
  );
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<ChatSession | null>(
    null
  );

  console.log("📚 ChatHistorySidebar rendered:", {
    sessionsCount: sessions.length,
    currentVideoUrl,
    selectedSessionId,
  });

  useEffect(() => {
    loadChatSessions();
  }, []);

  const loadChatSessions = async () => {
    try {
      setIsLoading(true);
      const token = await getToken();
      const chatSessions = await apiService.getChatSessions(token);
      setSessions(chatSessions);
      console.log("📚 Loaded chat sessions:", chatSessions.length);
    } catch (error) {
      console.error("❌ Failed to load chat sessions:", error);
      toast({
        title: "Error",
        description: "Failed to load chat history",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSessionClick = (session: ChatSession) => {
    setSelectedSessionId(session.session_id);
    onSessionSelect?.(session);
    console.log("📖 Selected session:", session.session_id);
  };

  const handleNewChat = () => {
    setSelectedSessionId(null);
    onNewChat?.();
    console.log("➕ Starting new chat");
  };

  const handleDeleteSession = async (
    sessionId: number,
    event: React.MouseEvent
  ) => {
    event.stopPropagation();

    // Find the session to delete for the confirmation dialog
    const session = sessions.find((s) => s.session_id === sessionId);
    if (session) {
      setSessionToDelete(session);
      setDeleteDialogOpen(true);
    }
  };

  const confirmDeleteSession = async () => {
    if (!sessionToDelete) return;

    try {
      const token = await getToken();
      await apiService.deleteChatSession(sessionToDelete.session_id, token);

      // Remove the session from the local state
      setSessions((prev) =>
        prev.filter(
          (session) => session.session_id !== sessionToDelete.session_id
        )
      );

      // If the deleted session was selected, clear selection
      if (selectedSessionId === sessionToDelete.session_id) {
        setSelectedSessionId(null);
        onNewChat?.(); // Switch to new chat mode
      }

      toast({
        title: "Session Deleted",
        description: `Chat session "${formatSessionTitle(
          sessionToDelete
        )}" has been successfully deleted`,
      });

      console.log("🗑️ Session deleted:", sessionToDelete.session_id);
    } catch (error) {
      console.error("❌ Failed to delete session:", error);
      toast({
        title: "Error",
        description: "Failed to delete chat session",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setSessionToDelete(null);
    }
  };

  const groupSessionsByTime = (sessions: ChatSession[]) => {
    const today: ChatSession[] = [];
    const yesterday: ChatSession[] = [];
    const thisWeek: ChatSession[] = [];
    const thisMonth: ChatSession[] = [];
    const older: ChatSession[] = [];

    sessions.forEach((session) => {
      const sessionDate = new Date(session.created_at);
      if (isToday(sessionDate)) {
        today.push(session);
      } else if (isYesterday(sessionDate)) {
        yesterday.push(session);
      } else if (isThisWeek(sessionDate)) {
        thisWeek.push(session);
      } else if (isThisMonth(sessionDate)) {
        thisMonth.push(session);
      } else {
        older.push(session);
      }
    });

    return { today, yesterday, thisWeek, thisMonth, older };
  };

  const formatSessionTitle = (session: ChatSession) => {
    return session.video_title || session.title || "Untitled Chat";
  };

  const formatSessionSubtitle = (session: ChatSession) => {
    const messageCount = session.message_count || 0;
    const time = format(new Date(session.created_at), "HH:mm");
    return `${messageCount} messages • ${time}`;
  };

  const renderSessionGroup = (title: string, sessions: ChatSession[]) => {
    if (sessions.length === 0) return null;

    return (
      <div key={title} className="space-y-2">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3">
          {title}
        </h4>
        <div className="space-y-1">
          {sessions.map((session) => (
            <div
              key={session.session_id}
              onClick={() => handleSessionClick(session)}
              className={`group relative flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-all duration-200 hover:bg-accent/50 ${
                selectedSessionId === session.session_id
                  ? "bg-primary/10 border border-primary/20"
                  : "hover:bg-muted/50"
              }`}
            >
              <div className="flex-shrink-0 mt-0.5">
                {session.video_url ? (
                  <Video className="w-4 h-4 text-primary" />
                ) : (
                  <MessageSquare className="w-4 h-4 text-muted-foreground" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {formatSessionTitle(session)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatSessionSubtitle(session)}
                    </p>
                    {session.video_url && (
                      <div className="flex items-center gap-1 mt-1">
                        <Badge
                          variant="secondary"
                          className="text-xs px-1.5 py-0.5"
                        >
                          Video
                        </Badge>
                        {session.video_url === currentVideoUrl && (
                          <Badge
                            variant="default"
                            className="text-xs px-1.5 py-0.5"
                          >
                            Current
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreVertical className="w-3 h-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuItem
                        onClick={(e) =>
                          handleDeleteSession(session.session_id, e)
                        }
                        className="text-destructive"
                      >
                        <Trash2 className="w-3 h-3 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const groupedSessions = groupSessionsByTime(sessions);

  if (isCollapsed) {
    return (
      <div
        className={`w-12 bg-muted/30 border-r flex flex-col items-center py-4 ${className}`}
      >
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(false)}
          className="w-8 h-8 p-0 mb-4"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>

        <div className="flex flex-col items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleNewChat}
            className="w-8 h-8 p-0"
            title="New Chat"
          >
            <Plus className="w-4 h-4" />
          </Button>

          <div className="w-6 h-px bg-border" />

          <div title="Chat History">
            <History className="w-4 h-4 text-muted-foreground" />
          </div>

          {sessions.length > 0 && (
            <Badge
              variant="secondary"
              className="text-xs w-6 h-6 p-0 flex items-center justify-center"
            >
              {sessions.length > 99 ? "99+" : sessions.length}
            </Badge>
          )}
        </div>
      </div>
    );
  }

  return (
    <Card
      className={`w-80 bg-muted/30 border-r rounded-none border-t-0 border-l-0 border-b-0 ${className}`}
    >
      {/* Header */}
      <div className="p-4 border-b bg-card/50">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-primary" />
            <h2 className="font-semibold text-sm">Chat History</h2>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsCollapsed(true)}
              className="w-6 h-6 p-0"
            >
              <ChevronLeft className="w-3 h-3" />
            </Button>
          </div>
        </div>

        <Button
          onClick={handleNewChat}
          className="w-full gap-2 text-sm"
          variant={selectedSessionId === null ? "default" : "outline"}
        >
          <Plus className="h-4 w-4" />
          New Chat
        </Button>
      </div>

      {/* Sessions List */}
      <ScrollArea className="flex-1 h-[calc(100vh-200px)]">
        <div className="p-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                Loading history...
              </div>
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-8 px-4">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">
                No chat history yet
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Start asking questions about videos to build your history
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {renderSessionGroup("Today", groupedSessions.today)}
              {renderSessionGroup("Yesterday", groupedSessions.yesterday)}
              {renderSessionGroup("This Week", groupedSessions.thisWeek)}
              {renderSessionGroup("This Month", groupedSessions.thisMonth)}
              {renderSessionGroup("Older", groupedSessions.older)}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      {sessions.length > 0 && (
        <div className="p-3 border-t bg-card/50">
          <p className="text-xs text-muted-foreground text-center">
            {sessions.length} conversation{sessions.length === 1 ? "" : "s"}
          </p>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Chat Session</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "
              {sessionToDelete ? formatSessionTitle(sessionToDelete) : ""}"?
              This will permanently delete all messages in this conversation.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteSession}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

console.log("🔧 ChatHistorySidebar component loaded");

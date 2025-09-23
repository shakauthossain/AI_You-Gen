import React, { useEffect, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { apiService } from "@/services/api";
import { NavigationHeader } from "@/components/NavigationHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  MessageCircle,
  Plus,
  Clock,
  Send,
  User,
  Bot,
  MessageSquare,
} from "lucide-react";

interface ChatMessage {
  role: "user" | "assistant";
  message: string;
  timestamp: string;
}

interface ChatSession {
  session_id: number;
  created_at: string;
  title: string;
}

export function ChatGPTMemory() {
  const { getToken } = useAuth();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(
    null
  );
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  // Fetch sessions on mount
  useEffect(() => {
    (async () => {
      const token = await getToken();
      const res = await apiService.getChatSessions(token);
      setSessions(res);
      if (res.length > 0) setCurrentSession(res[0]);
    })();
  }, []);

  // Fetch messages when session changes
  useEffect(() => {
    if (!currentSession) return;
    (async () => {
      const token = await getToken();
      const msgs = await apiService.getChatMessages(
        currentSession.session_id,
        token
      );
      setMessages(msgs);
    })();
  }, [currentSession]);

  const handleSend = async () => {
    if (!input.trim() || !currentSession) return;
    setLoading(true);
    const token = await getToken();
    // Add user message
    setMessages((prev) => [
      ...prev,
      { role: "user", message: input, timestamp: new Date().toISOString() },
    ]);
    setInput("");
    // Save to backend
    await apiService.addChatMessage(
      currentSession.session_id,
      input,
      "user",
      token
    );
    // TODO: Call your LLM/assistant backend and add assistant reply
    setLoading(false);
  };

  const handleNewSession = async () => {
    const token = await getToken();
    const session = await apiService.createChatSession(token);
    setSessions((prev) => [session, ...prev]);
    setCurrentSession(session);
    setMessages([]);
  };

  return (
    <div className="min-h-screen bg-background">
      <NavigationHeader />
      <div className="flex h-[calc(100vh-4rem)] bg-background pt-16">
        {/* Sidebar: Sessions */}
        <Card className="w-80 border-r rounded-none border-t-0 border-l-0 border-b-0 bg-muted/30">
          <div className="p-4 border-b">
            <Button
              onClick={handleNewSession}
              className="w-full gap-2"
              variant="default"
            >
              <Plus className="h-4 w-4" />
              New Chat
            </Button>
          </div>
          <ScrollArea className="flex-1 h-[calc(100vh-80px)]">
            <div className="p-4">
              {sessions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-sm">No chat sessions yet</p>
                  <p className="text-xs">Start a new conversation</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {sessions.map((s) => (
                    <Card
                      key={s.session_id}
                      className={`p-3 cursor-pointer transition-colors hover:bg-accent ${
                        currentSession?.session_id === s.session_id
                          ? "bg-primary/10 border-primary/20"
                          : "hover:bg-accent/50"
                      }`}
                      onClick={() => setCurrentSession(s)}
                    >
                      <div className="flex items-start gap-2">
                        <MessageCircle className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {s.title}
                          </p>
                          <div className="flex items-center gap-1 mt-1">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">
                              {new Date(s.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>
        </Card>

        {/* Chat Window */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="p-4 border-b bg-background">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-primary" />
              <h1 className="font-semibold">
                {currentSession ? currentSession.title : "Select a chat"}
              </h1>
            </div>
          </div>
          {/* Messages */}
          <ScrollArea className="flex-1 p-6">
            {!currentSession ? (
              <div className="flex items-center justify-center h-full text-center">
                <div className="max-w-sm">
                  <Bot className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">
                    Welcome to Chat
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Select a chat session from the sidebar or start a new
                    conversation
                  </p>
                  <Button onClick={handleNewSession} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Start New Chat
                  </Button>
                </div>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-center">
                <div className="max-w-sm">
                  <MessageSquare className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">
                    Start the conversation
                  </h3>
                  <p className="text-muted-foreground">
                    Send your first message to begin this chat session
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex gap-3 ${
                      msg.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    {msg.role === "assistant" && (
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <Bot className="h-4 w-4 text-primary" />
                        </div>
                      </div>
                    )}

                    <div
                      className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">
                        {msg.message}
                      </p>
                      <div className="flex items-center gap-1 mt-2 opacity-70">
                        <Clock className="h-3 w-3" />
                        <span className="text-xs">
                          {new Date(msg.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>

                    {msg.role === "user" && (
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="h-4 w-4 text-primary" />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                {loading && (
                  <div className="flex gap-3 justify-start">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Bot className="h-4 w-4 text-primary" />
                      </div>
                    </div>
                    <div className="bg-muted rounded-2xl px-4 py-3">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                        <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                        <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce"></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>
          {/* Input */}
          {currentSession && (
            <div className="p-4 border-t bg-background">
              <form
                className="flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
              >
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type your message..."
                  disabled={loading}
                  className="flex-1"
                />
                <Button
                  type="submit"
                  disabled={loading || !input.trim()}
                  className="gap-2"
                >
                  <Send className="h-4 w-4" />
                  Send
                </Button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

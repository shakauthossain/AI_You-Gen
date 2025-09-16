import { Button } from '@/components/ui/button';
import { Moon, Sun, Github, RotateCcw, Video } from 'lucide-react';
import { useTheme } from 'next-themes';

interface HeaderProps {
  onClearSession: () => void;
  onNewVideo: () => void;
}

export function Header({ onClearSession, onNewVideo }: HeaderProps) {
  const { theme, setTheme } = useTheme();

  const handleClearSession = () => {
    console.log('🗑️ Clear session clicked');
    onClearSession();
  };

  const handleNewVideo = () => {
    console.log('📹 New video clicked');
    onNewVideo();
  };

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    console.log('🎨 Theme toggle:', { from: theme, to: newTheme });
    setTheme(newTheme);
  };

  return (
    <header className="h-16 border-b bg-card/50 backdrop-blur-sm flex items-center justify-between px-6 sticky top-0 z-50">
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
          <span className="text-white font-bold text-sm">YT</span>
        </div>
        <div>
          <h1 className="text-xl font-bold text-gradient-primary">
            YT Q&A + MCQ Generator
          </h1>
          <p className="text-xs text-muted-foreground">
            AI-powered YouTube content analysis
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleTheme}
          className="w-9 h-9 p-0"
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="w-9 h-9 p-0"
          asChild
        >
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Github className="h-4 w-4" />
            <span className="sr-only">GitHub</span>
          </a>
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={handleNewVideo}
          className="gap-2"
        >
          <Video className="h-4 w-4" />
          New Video
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={handleClearSession}
          className="gap-2"
        >
          <RotateCcw className="h-4 w-4" />
          Clear Session
        </Button>
      </div>
    </header>
  );
}

console.log('🔧 Header component loaded');
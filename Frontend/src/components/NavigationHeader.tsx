import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SignInButton } from "@/components/auth/SignInButton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
  Moon,
  Sun,
  Github,
  Menu,
  X,
  Play,
  Brain,
  FileText,
  BarChart3,
  ChevronDown,
  Star,
  Sparkles,
  Search,
} from "lucide-react";
import { useTheme } from "next-themes";

export function NavigationHeader() {
  const { theme, setTheme } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const features = [
    { name: "AI Q&A", href: "#features", icon: Brain },
    { name: "MCQ Generation", href: "#features", icon: FileText },
    { name: "Content Insights", href: "#features", icon: BarChart3 },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-background/95 backdrop-blur-md border-b shadow-sm"
          : "bg-transparent"
      }`}
    >
      <nav className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-primary group-hover:scale-110 transition-transform duration-300">
                <Sparkles className="w-10 h-10 text-black" />
              </div>
              <div className="absolute -top-1 -right-1">
                <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                  AI
                </Badge>
              </div>
            </div>
            {/* <img src="/logo.png" alt="Logo" className="w-[45%] h-auto" /> */}
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-8">
            {/* Features Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-1 hover:text-primary">
                  Features
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 bg-background/95 backdrop-blur-md border shadow-lg z-50">
                {features.map((feature) => (
                  <DropdownMenuItem key={feature.name} className="gap-3 p-3">
                    <feature.icon className="w-4 h-4 text-primary" />
                    <div>
                      <div className="font-medium">{feature.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {feature.name === "AI Q&A" &&
                          "Ask questions about video content"}
                        {feature.name === "MCQ Generation" &&
                          "Create educational assessments"}
                        {feature.name === "Content Insights" &&
                          "Get detailed analytics"}
                      </div>
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <a
              href="#how-it-works"
              className="text-sm font-medium hover:text-primary transition-colors"
            >
              How it Works
            </a>

            <a
              href="#pricing"
              className="text-sm font-medium hover:text-primary transition-colors"
            >
              Pricing
            </a>

            <a
              href="#contact"
              className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-2"
            >
              Contact
            </a>
          </div>

          {/* Desktop Actions */}
          <div className="hidden lg:flex items-center space-x-3">
            {/* Theme Toggle */}

            {/* Sign In */}
            <SignInButton />

            {/* Get Started */}
            <Link to="/app">
              <Button
                size="sm"
                className="!bg-primary/90 gradient-primary shadow-primary font-medium gap-2 hover:!bg-white hover:border hover:text-primary/90 hover:scale-105 transition-transform"
              >
                <Play className="w-4 h-4" />
                Get Started
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="lg:hidden flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className="w-9 h-9 p-0"
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="w-9 h-9 p-0"
            >
              {isMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="lg:hidden mt-4 pb-4 border-t animate-fade-in">
            <div className="flex flex-col space-y-4 pt-4">
              {/* Mobile Features */}
              <div className="space-y-3">
                <div className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Features
                </div>
                {features.map((feature) => (
                  <a
                    key={feature.name}
                    href={feature.href}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <feature.icon className="w-4 h-4 text-primary" />
                    <span className="font-medium">{feature.name}</span>
                  </a>
                ))}
              </div>

              {/* Mobile Links */}
              <div className="space-y-3 pt-4 border-t">
                <a
                  href="#how-it-works"
                  className="block p-2 font-medium hover:text-primary transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  How it Works
                </a>
                <a
                  href="#pricing"
                  className="block p-2 font-medium hover:text-primary transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Pricing
                </a>
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-2 font-medium hover:text-primary transition-colors"
                >
                  <Github className="w-4 h-4" />
                  GitHub
                </a>
              </div>

              {/* Mobile Actions */}
              <div className="space-y-3 pt-4 border-t">
                <div className="w-full flex justify-center">
                  <SignInButton />
                </div>
                <Link to="/app" onClick={() => setIsMenuOpen(false)}>
                  <Button className="w-full gradient-primary shadow-primary gap-2">
                    <Play className="w-4 h-4" />
                    Get Started Free
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}

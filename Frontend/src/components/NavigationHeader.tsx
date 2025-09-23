import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SignInButton } from "@/components/auth/SignInButton";
import { SignedIn, SignedOut } from "@clerk/clerk-react";
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
  MessageCircle,
} from "lucide-react";
import { useTheme } from "next-themes";

export function NavigationHeader() {
  const { theme, setTheme } = useTheme();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Check if we're on an app page (not landing page)
  const isAppPage = location.pathname !== "/";

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Update scrolled state for background blur effect
      setIsScrolled(currentScrollY > 10);

      // Only hide nav on app pages, not on landing page
      if (isAppPage) {
        if (currentScrollY < lastScrollY || currentScrollY <= 0) {
          // Scrolling up or at top - show nav
          setIsVisible(true);
        } else if (currentScrollY > lastScrollY) {
          // Scrolling down - hide nav immediately
          setIsVisible(false);
        }
      } else {
        // Always show on landing page
        setIsVisible(true);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY, isAppPage]);

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
      } ${
        isVisible ? "transform translate-y-0" : "transform -translate-y-full"
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
            <DropdownMenu
              open={isDropdownOpen}
              onOpenChange={setIsDropdownOpen}
            >
              <DropdownMenuTrigger
                asChild
                onMouseEnter={() => {
                  setIsDropdownOpen(true);
                }}
                onMouseLeave={() => {
                  // Add slight delay to prevent flickering
                  setTimeout(() => {
                    if (
                      !document.querySelector(
                        "[data-radix-popper-content-wrapper]:hover"
                      )
                    ) {
                      setIsDropdownOpen(false);
                    }
                  }, 100);
                }}
              >
                <Button
                  variant="ghost"
                  className={`gap-1 px-3 py-2 rounded-lg transition-all duration-300 ${
                    isDropdownOpen
                      ? "text-primary bg-primary/10 shadow-sm"
                      : "hover:text-primary hover:bg-primary/10 hover:shadow-sm"
                  }`}
                >
                  Features
                  <ChevronDown
                    className={`w-4 h-4 transition-transform duration-200 ${
                      isDropdownOpen ? "rotate-180" : ""
                    }`}
                  />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-56 bg-background/95 backdrop-blur-md border shadow-lg z-50"
                onMouseLeave={() => setIsDropdownOpen(false)}
                onMouseEnter={() => setIsDropdownOpen(true)}
              >
                {features.map((feature) => (
                  <DropdownMenuItem
                    key={feature.name}
                    className="gap-3 p-3 hover:bg-primary/10 transition-all duration-200 hover:scale-105"
                  >
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
              className="text-sm font-medium hover:text-primary hover:bg-primary/10 px-3 py-2 rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-sm"
            >
              How it Works
            </a>

            <a
              href="#pricing"
              className="text-sm font-medium hover:text-primary hover:bg-primary/10 px-3 py-2 rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-sm"
            >
              Pricing
            </a>

            <a
              href="#contact"
              className="text-sm font-medium hover:text-primary hover:bg-primary/10 px-3 py-2 rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-sm flex items-center gap-2"
            >
              Contact
            </a>

            {/* <Link
              to="/chat"
              className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-2"
            >
              <MessageCircle className="w-4 h-4" />
              Chat
            </Link> */}
          </div>

          {/* Desktop Actions */}
          <div className="hidden lg:flex items-center space-x-3">
            {/* Theme Toggle */}
            {/* <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className="w-9 h-9 p-0 hover:bg-primary/10 hover:scale-105 transition-all duration-300 hover:shadow-sm rounded-lg"
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </Button> */}

            {/* Sign In */}
            <SignInButton />

            {/* Get Started - Only show on landing page */}
            {!isAppPage && (
              <>
                <SignedOut>
                  <Link to="/app">
                    <Button
                      size="sm"
                      className="!bg-primary/90 gradient-primary shadow-primary font-medium gap-2 hover:!bg-white hover:border hover:text-primary/90 hover:scale-105 transition-all duration-300 hover:shadow-lg"
                    >
                      <Play className="w-4 h-4" />
                      Get Started
                    </Button>
                  </Link>
                </SignedOut>
                <SignedIn>
                  <Link to="/app">
                    <Button
                      size="sm"
                      className="!bg-primary/90 gradient-primary shadow-primary font-medium gap-2 hover:!bg-white hover:border hover:text-primary/90 hover:scale-105 transition-all duration-300 hover:shadow-lg"
                    >
                      <MessageCircle className="w-4 h-4" />
                      Let's Chat
                    </Button>
                  </Link>
                </SignedIn>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="lg:hidden flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className="w-9 h-9 p-0 hover:bg-primary/10 hover:scale-105 transition-all duration-300 hover:shadow-sm rounded-lg"
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="w-9 h-9 p-0 hover:bg-primary/10 hover:scale-105 transition-all duration-300 hover:shadow-sm rounded-lg"
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
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-primary/10 hover:text-primary hover:scale-105 transition-all duration-300 hover:shadow-sm"
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
                  className="block p-3 font-medium hover:text-primary hover:bg-primary/10 rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-sm"
                  onClick={() => setIsMenuOpen(false)}
                >
                  How it Works
                </a>
                <a
                  href="#pricing"
                  className="block p-3 font-medium hover:text-primary hover:bg-primary/10 rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-sm"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Pricing
                </a>
                <Link
                  to="/chat"
                  className="flex items-center gap-2 p-3 font-medium hover:text-primary hover:bg-primary/10 rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-sm"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <MessageCircle className="w-4 h-4" />
                  Chat
                </Link>
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-3 font-medium hover:text-primary hover:bg-primary/10 rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-sm"
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
                {/* Only show Get Started/Let's Chat buttons on landing page */}
                {!isAppPage && (
                  <>
                    <SignedOut>
                      <Link to="/app" onClick={() => setIsMenuOpen(false)}>
                        <Button className="w-full gradient-primary shadow-primary gap-2 hover:scale-105 transition-all duration-300 hover:shadow-lg">
                          <Play className="w-4 h-4" />
                          Get Started Free
                        </Button>
                      </Link>
                    </SignedOut>
                    <SignedIn>
                      <Link to="/app" onClick={() => setIsMenuOpen(false)}>
                        <Button className="w-full gradient-primary shadow-primary gap-2 hover:scale-105 transition-all duration-300 hover:shadow-lg">
                          <MessageCircle className="w-4 h-4" />
                          Let's Chat
                        </Button>
                      </Link>
                    </SignedIn>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}

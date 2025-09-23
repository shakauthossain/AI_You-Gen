import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { NavigationHeader } from "@/components/NavigationHeader";
import { SignedIn, SignedOut } from "@clerk/clerk-react";
import {
  Brain,
  FileQuestion,
  BarChart3,
  FileText,
  Download,
  Zap,
  Play,
  ArrowRight,
  CheckCircle,
  Sparkles,
  Youtube,
  Target,
  BookOpen,
  Globe,
  Shield,
  Cpu,
  Database,
  TrendingUp,
  Users,
  ChevronDown,
  ChevronUp,
  Star,
  Quote,
  ExternalLink,
  Search,
} from "lucide-react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export const LandingPage = () => {
  const heroRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const howItWorksRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);

  const [expandedFeature, setExpandedFeature] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [animatedStats, setAnimatedStats] = useState(false);

  useEffect(() => {
    // Hero section animations
    if (heroRef.current) {
      const heroElements = heroRef.current.querySelectorAll(".hero-animate");
      gsap.fromTo(
        heroElements,
        { y: 50, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 1,
          stagger: 0.2,
          ease: "power3.out",
        }
      );
    }

    // Features animation
    if (featuresRef.current) {
      const featureCards =
        featuresRef.current.querySelectorAll(".feature-card");
      gsap.fromTo(
        featureCards,
        { y: 60, opacity: 0, scale: 0.9 },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 0.8,
          stagger: 0.15,
          ease: "power3.out",
          scrollTrigger: {
            trigger: featuresRef.current,
            start: "top 80%",
            end: "bottom 20%",
          },
        }
      );
    }

    // How it works animation
    if (howItWorksRef.current) {
      const steps = howItWorksRef.current.querySelectorAll(".step-card");
      gsap.fromTo(
        steps,
        { x: -100, opacity: 0 },
        {
          x: 0,
          opacity: 1,
          duration: 1,
          stagger: 0.3,
          ease: "power3.out",
          scrollTrigger: {
            trigger: howItWorksRef.current,
            start: "top 80%",
            end: "bottom 20%",
          },
        }
      );
    }

    // CTA animation
    if (ctaRef.current) {
      gsap.fromTo(
        ctaRef.current.children,
        { y: 30, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          stagger: 0.1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ctaRef.current,
            start: "top 90%",
          },
        }
      );
    }

    // Stats counter animation
    if (statsRef.current) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !animatedStats) {
            setAnimatedStats(true);

            // Animate the counter numbers
            const counters = entry.target.querySelectorAll(".stat-counter");
            counters.forEach((counter, index) => {
              const target = parseInt(
                counter.getAttribute("data-target") || "0"
              );
              const suffix = counter.getAttribute("data-suffix") || "";

              gsap.fromTo(
                counter,
                { textContent: 0 },
                {
                  textContent: target,
                  duration: 2,
                  delay: index * 0.2,
                  ease: "power2.out",
                  snap: { textContent: 1 },
                  onUpdate: function () {
                    const value = Math.floor(this.targets()[0].textContent);
                    counter.textContent = value + suffix;
                  },
                }
              );
            });
          }
        });
      });

      observer.observe(statsRef.current);
    }

    // Floating animation for background elements
    gsap.to(".floating-element", {
      y: -20,
      duration: 3,
      repeat: -1,
      yoyo: true,
      ease: "power2.inOut",
      stagger: 0.5,
    });
  }, [animatedStats]);

  const features = [
    {
      icon: <Brain className="w-8 h-8" />,
      title: "AI-Powered Q&A",
      description:
        "Generate intelligent questions and answers from YouTube videos using advanced AI technology.",
      details:
        "Our advanced AI analyzes video transcripts with 99.9% accuracy, identifying key concepts and generating contextually relevant questions. Perfect for educational institutions, corporate training, and content creators looking to enhance engagement.",
    },
    {
      icon: <FileQuestion className="w-8 h-8" />,
      title: "MCQ Generation",
      description:
        "Automatically create multiple-choice questions for assessments and educational content.",
      details:
        "Create unlimited multiple-choice questions with customizable difficulty levels. Export to various formats including PDF, DOCX, and LMS-compatible files. Perfect for educators and training professionals.",
    },
    {
      icon: <BarChart3 className="w-8 h-8" />,
      title: "Content Insights",
      description:
        "Get detailed analytics on YouTube content including readability scores and keywords.",
      details:
        "Deep analytics including readability scores, keyword density, sentiment analysis, and engagement predictions. Visualize content performance with interactive charts and exportable reports.",
    },
    {
      icon: <FileText className="w-8 h-8" />,
      title: "Content Creation",
      description:
        "Transform YouTube videos into blog posts, social media posts, and educational content.",
      details:
        "One-click transformation of video content into blog posts, social media content, study guides, and summaries. Maintain brand voice with customizable templates and style guides.",
    },
    {
      icon: <Download className="w-8 h-8" />,
      title: "Export Options",
      description:
        "Download MCQs and content in PDF or DOCX format for easy sharing and distribution.",
      details:
        "Export in multiple formats including PDF, DOCX, HTML, and LMS packages. Batch export capabilities with custom branding and formatting options. API access for seamless integration.",
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: "Smart Analysis",
      description:
        "Advanced AI video transcript analysis to extract key concepts and generate meaningful content.",
      details:
        "Powered by cutting-edge NLP models that understand context, identify main topics, and extract actionable insights. Real-time processing with enterprise-grade security and compliance.",
    },
  ];

  const testimonials = [
    {
      name: "Dr. Sarah Chen",
      role: "Director of Digital Learning, EduTech Global",
      content:
        "This platform has revolutionized how we create educational content. The AI accuracy is remarkable, and we've reduced content creation time by 80%.",
      rating: 5,
      avatar: "SC",
    },
    {
      name: "Michael Rodriguez",
      role: "Training Manager, SecureLearn",
      content:
        "The MCQ generation feature is a game-changer. We've created thousands of assessment questions in minutes, not hours.",
      rating: 5,
      avatar: "MR",
    },
    {
      name: "Lisa Thompson",
      role: "Content Strategist, AI Institute",
      content:
        "The content insights have helped us understand our audience better and create more engaging educational materials.",
      rating: 5,
      avatar: "LT",
    },
  ];

  const steps = [
    {
      icon: <Youtube className="w-12 h-12" />,
      title: "Paste YouTube URL",
      description:
        "Simply paste your YouTube video URL, and our AI will automatically extract and process the transcript.",
    },
    {
      icon: <Brain className="w-12 h-12" />,
      title: "AI Analysis",
      description:
        "Our AI analyzes the content, extracts key concepts, and prepares intelligent responses.",
    },
    {
      icon: <Target className="w-12 h-12" />,
      title: "Generate Content",
      description:
        "Create Q&As, MCQs, blog posts, insights, and export everything in your preferred format.",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky Navigation */}
      <div className="sticky top-0 z-50 backdrop-blur-md bg-background/80 border-b border-border">
        <NavigationHeader />
      </div>

      {/* Hero Section */}
      <section
        ref={heroRef}
        className="relative min-h-auto py-24 pt-28 flex items-center justify-center px-4 overflow-hidden bg-gradient-to-br from-background via-primary-dark/5 to-background"
      >
        {/* Background Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(112,137,147,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(112,137,147,0.1)_1px,transparent_1px)] bg-[size:100px_100px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_60%,transparent_100%)]"></div>

        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center relative z-10">
          {/* Left Content */}
          <div className="space-y-8">
            <div className="hero-animate">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-sm font-medium mb-6 border border-primary/30">
                <Sparkles className="w-4 h-4 text-primary" />
                Enterprise-Grade AI Platform
              </div>
            </div>

            <h1 className="!text-shadow-lg/30 hero-animate text-2xl md:text-4xl lg:text-5xl font-black leading-tight">
              <span className="text-foreground">Enterprise-Grade</span>
              <br />
              <span className="text-foreground">YouTube Content</span>
              <br />
              <span className="text-primary">AI Transformation</span>
            </h1>

            {/* New descriptive subheading */}
            <p className="!text-shadow-lg/30 hero-animate text-xl md:text-xl font-semibold text-primary mb-4">
              Transform any YouTube video into intelligent Q&As, MCQs, and
              educational content in seconds
            </p>

            <p className="text-shadow-lg/30 hero-animate text-lg md:text-xl text-muted-foreground leading-relaxed max-w-xl">
              Transform empowers enterprises with a secure, flexible, and
              compliant platform for real-time YouTube content analysis and
              AI-driven educational content generation. Gain total control over
              your learning ecosystem.
            </p>

            <div className="hero-animate flex flex-col sm:flex-row gap-2">
              <SignedOut>
                <Button
                  size="lg"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground px-10 py-6 text-lg font-bold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 min-h-[60px] focus:ring-4 focus:ring-primary/20 hover-scale animate-float"
                  onClick={() => (window.location.href = "/app")}
                  aria-label="Get a demo of the platform"
                >
                  Get Started
                  <ArrowRight className="ml-3 w-6 h-6" />
                </Button>
              </SignedOut>
              <SignedIn>
                <Button
                  size="lg"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground px-10 py-6 text-lg font-bold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 min-h-[60px] focus:ring-4 focus:ring-primary/20 hover-scale animate-float"
                  onClick={() => (window.location.href = "/app")}
                  aria-label="Go to chat interface"
                >
                  Let's Chat
                  <ArrowRight className="ml-3 w-6 h-6" />
                </Button>
              </SignedIn>
            </div>

            {/* Enhanced call-to-action text */}
            {/* <div className="hero-animate text-center">
              <div className="flex items-center gap-2 justify-center">
                <CheckCircle className="w-5 h-5 text-primary animate-pulse" />
                <span className="text-lg font-medium text-muted-foreground">
                  Get started in 60 seconds
                </span>
              </div>
            </div> */}
          </div>

          {/* Right Visual with Enhanced Animations */}
          <div className="hero-animate relative">
            <div className="relative w-full h-96 lg:h-[500px]">
              {/* 3D-like visualization with enhanced animations */}
              <div className="absolute inset-0 flex items-center justify-center">
                {/* Central hub */}
                <div className="relative animate-float">
                  <div className="w-32 h-32 bg-gradient-to-br from-primary to-secondary rounded-2xl shadow-2xl flex items-center justify-center transform rotate-12 hover:rotate-6 transition-transform duration-500 hover-scale">
                    <Brain className="w-16 h-16 text-white animate-pulse-soft" />
                  </div>

                  {/* Enhanced connection lines with animations */}
                  <div className="absolute top-1/2 left-1/2 w-64 h-1 bg-gradient-to-r from-primary via-secondary to-transparent transform -translate-x-1/2 -translate-y-1/2 rotate-45 animate-pulse"></div>
                  <div className="absolute top-1/2 left-1/2 w-64 h-1 bg-gradient-to-r from-secondary via-accent to-transparent transform -translate-x-1/2 -translate-y-1/2 -rotate-45 animate-pulse"></div>
                  <div className="absolute top-1/2 left-1/2 w-64 h-1 bg-gradient-to-r from-accent via-primary to-transparent transform -translate-x-1/2 -translate-y-1/2 rotate-12 animate-pulse"></div>

                  {/* Enhanced floating elements with staggered animations */}
                  <div className="floating-element absolute -top-16 -right-8 w-16 h-16 bg-secondary/30 rounded-full flex items-center justify-center backdrop-blur-sm hover-scale animate-bounce">
                    <Youtube className="w-8 h-8 text-secondary" />
                  </div>
                  <div className="floating-element absolute -bottom-12 -left-12 w-20 h-20 bg-accent/30 rounded-xl flex items-center justify-center backdrop-blur-sm hover-scale animate-pulse">
                    <FileQuestion className="w-10 h-10 text-accent" />
                  </div>
                  <div className="floating-element absolute top-8 -left-16 w-14 h-14 bg-primary/30 rounded-lg flex items-center justify-center backdrop-blur-sm hover-scale animate-float">
                    <BarChart3 className="w-7 h-7 text-primary" />
                  </div>
                  <div className="floating-element absolute -bottom-8 right-12 w-18 h-18 bg-secondary/30 rounded-full flex items-center justify-center backdrop-blur-sm hover-scale animate-bounce">
                    <FileText className="w-9 h-9 text-secondary" />
                  </div>
                </div>
              </div>

              {/* Enhanced animated particles */}
              <div className="floating-element absolute top-10 left-8 w-3 h-3 bg-primary rounded-full animate-ping"></div>
              <div className="floating-element absolute bottom-16 right-12 w-4 h-4 bg-accent rounded-full animate-bounce"></div>
              <div className="floating-element absolute top-32 right-8 w-2 h-2 bg-secondary rounded-full animate-pulse"></div>
              <div className="floating-element absolute bottom-32 left-16 w-3 h-3 bg-primary rounded-full animate-ping"></div>

              {/* Orbiting elements */}
              <div
                className="absolute top-1/2 left-1/2 w-80 h-80 border border-primary/20 rounded-full transform -translate-x-1/2 -translate-y-1/2 animate-spin"
                style={{ animationDuration: "20s" }}
              ></div>
              <div
                className="absolute top-1/2 left-1/2 w-96 h-96 border border-secondary/10 rounded-full transform -translate-x-1/2 -translate-y-1/2 animate-spin"
                style={{
                  animationDuration: "30s",
                  animationDirection: "reverse",
                }}
              ></div>
            </div>
          </div>
        </div>
      </section>

      {/* Solutions Tabs Section with subtle divider */}
      <section ref={featuresRef} id="features" className="py-24 px-4 bg-card ">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black mb-6 text-foreground">
              Real-Time Content Management That's Both{" "}
              <span className="text-primary">Precise and Compliant</span>
            </h2>
          </div>

          {/* Tab Navigation - Improved accessibility */}
          <div className="flex justify-center mb-12">
            <div className="flex flex-wrap bg-muted/50 rounded-lg p-1 backdrop-blur-sm border border-border gap-2">
              {[
                "AI Q&A Generation",
                "MCQ Creation",
                "Content Analytics",
                "Smart Insights",
              ].map((tab, index) => (
                <button
                  key={tab}
                  className={`px-4 sm:px-6 py-3 rounded-md font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                    activeTab === index
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "text-muted-foreground hover:text-primary hover:bg-white hover:outline-none hover:ring-1 hover:ring-primary/20"
                  }`}
                  onClick={() => setActiveTab(index)}
                  aria-pressed={activeTab === index}
                  aria-label={`Switch to ${tab} tab`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content with Animations */}
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="relative">
              <Card className="bg-gradient-to-br from-primary/10 to-secondary/10 border border-border backdrop-blur-sm shadow-lg">
                <CardContent className="p-0">
                  <div className="aspect-video bg-gradient-to-br from-card to-muted rounded-lg flex items-center justify-center  relative overflow-hidden">
                    <div className="relative w-full h-full flex items-center justify-center">
                      {/* Dynamic content based on active tab */}
                      {activeTab === 0 && (
                        <div className="animate-fade-in">
                          <Brain className="w-24 h-24 text-primary animate-pulse-soft" />
                          <div className="absolute top-4 right-4 w-8 h-8 bg-primary/30 rounded-full animate-bounce"></div>
                          <div className="absolute bottom-8 left-8 w-6 h-6 bg-accent/30 rounded-full animate-pulse"></div>
                        </div>
                      )}
                      {activeTab === 1 && (
                        <div className="animate-fade-in">
                          <FileQuestion className="w-24 h-24 text-secondary animate-pulse-soft" />
                          <div className="absolute top-6 right-6 w-4 h-4 bg-secondary/40 rounded-full animate-ping"></div>
                          <div className="absolute bottom-6 left-6 w-5 h-5 bg-primary/40 rounded-full animate-bounce"></div>
                        </div>
                      )}
                      {activeTab === 2 && (
                        <div className="animate-fade-in">
                          <BarChart3 className="w-24 h-24 text-accent animate-pulse-soft" />
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-accent/10 to-transparent animate-[slide-in-right_2s_ease-in-out_infinite]"></div>
                        </div>
                      )}
                      {activeTab === 3 && (
                        <div className="animate-fade-in">
                          <Target className="w-24 h-24 text-primary animate-pulse-soft" />
                          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 border-2 border-primary/20 rounded-full animate-ping"></div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            <div className="space-y-6">
              {/* Dynamic content based on active tab */}
              {activeTab === 0 && (
                <div className="animate-fade-in space-y-6">
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/20 rounded-full text-sm font-medium text-primary border border-primary/30">
                    <Brain className="w-4 h-4" />
                    AI-Powered Q&A Generation
                  </div>
                  <h3 className="text-3xl font-black text-foreground">
                    Generate Intelligent Questions from Any YouTube Content
                  </h3>
                  <p className="text-muted-foreground text-lg leading-relaxed">
                    Transform any YouTube video into comprehensive Q&A sessions.
                    Our AI analyzes video transcripts, identifies key concepts,
                    and generates contextually relevant questions that enhance
                    learning outcomes and student engagement.
                  </p>
                  <Button className="bg-primary hover:bg-primary/90 text-primary-foreground hover-scale">
                    Learn More About AI Q&A
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </div>
              )}
              {activeTab === 1 && (
                <div className="animate-fade-in space-y-6">
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-secondary/20 rounded-full text-sm font-medium text-secondary border border-secondary/30">
                    <FileQuestion className="w-4 h-4" />
                    Smart MCQ Creation
                  </div>
                  <h3 className="text-3xl font-black text-foreground">
                    Create Perfect Multiple Choice Questions Instantly
                  </h3>
                  <p className="text-muted-foreground text-lg leading-relaxed">
                    Generate unlimited multiple-choice questions with
                    customizable difficulty levels. Export to various formats
                    including PDF, DOCX, and LMS-compatible files. Perfect for
                    educators and training professionals.
                  </p>
                  <Button className="bg-secondary hover:bg-secondary/90 text-secondary-foreground hover-scale">
                    Explore MCQ Features
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </div>
              )}
              {activeTab === 2 && (
                <div className="animate-fade-in space-y-6">
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent/20 rounded-full text-sm font-medium text-accent border border-accent/30">
                    <BarChart3 className="w-4 h-4" />
                    Content Analytics
                  </div>
                  <h3 className="text-3xl font-black text-foreground">
                    Deep Analytics for Better Content Understanding
                  </h3>
                  <p className="text-muted-foreground text-lg leading-relaxed">
                    Get detailed analytics including readability scores, keyword
                    density, sentiment analysis, and engagement predictions.
                    Visualize content performance with interactive charts and
                    exportable reports.
                  </p>
                  <Button className="bg-accent hover:bg-accent/90 text-accent-foreground hover-scale">
                    View Analytics Demo
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </div>
              )}
              {activeTab === 3 && (
                <div className="animate-fade-in space-y-6">
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/20 rounded-full text-sm font-medium text-primary border border-primary/30">
                    <Target className="w-4 h-4" />
                    Smart Insights
                  </div>
                  <h3 className="text-3xl font-black text-foreground">
                    AI-Powered Content Insights & Recommendations
                  </h3>
                  <p className="text-muted-foreground text-lg leading-relaxed">
                    Discover hidden patterns in your content with AI-powered
                    insights. Get personalized recommendations for improving
                    engagement, accessibility, and learning outcomes based on
                    advanced content analysis.
                  </p>
                  <Button className="bg-primary hover:bg-primary/90 text-primary-foreground hover-scale">
                    Discover Insights
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section with animation */}
      <section ref={statsRef} className="py-24 px-4 bg-background ">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-sm text-muted-foreground uppercase tracking-wider mb-8">
            Enterprise-Grade Performance You Can Trust
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="space-y-2">
              <div
                className="stat-counter text-4xl md:text-5xl font-black text-primary"
                data-target="99"
                data-suffix=".9%"
              >
                0
              </div>
              <div className="text-muted-foreground text-sm sm:text-base">
                AI Accuracy Rate
              </div>
            </div>
            <div className="space-y-2">
              <div
                className="stat-counter text-4xl md:text-5xl font-black text-secondary"
                data-target="10"
                data-suffix="M+"
              >
                0
              </div>
              <div className="text-muted-foreground text-sm sm:text-base">
                Videos Processed
              </div>
            </div>
            <div className="space-y-2">
              <div
                className="stat-counter text-4xl md:text-5xl font-black text-accent"
                data-target="500"
                data-suffix="K+"
              >
                0
              </div>
              <div className="text-muted-foreground text-sm sm:text-base">
                MCQs Generated
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl md:text-5xl font-black text-foreground">
                24/7
              </div>
              <div className="text-muted-foreground text-sm sm:text-base">
                Enterprise Support
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid with Enhanced Interactions */}
      <section ref={howItWorksRef} className="py-24 px-4 bg-white ">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
              Powerful Features for Modern Education
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Discover how our AI-powered platform transforms YouTube content
              into engaging educational materials
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="feature-card group bg-card backdrop-blur-sm border border-border hover:shadow-lg transition-all duration-300 cursor-pointer"
                onClick={() =>
                  setExpandedFeature(expandedFeature === index ? null : index)
                }
              >
                <CardContent className="p-6 md:p-8">
                  <div className="flex items-center justify-center w-16 h-16 bg-primary/10 rounded-xl mb-6 group-hover:bg-primary/20 transition-colors">
                    <div className="text-primary">{feature.icon}</div>
                  </div>
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-xl font-bold text-foreground pr-4">
                      {feature.title}
                    </h3>
                    <button
                      className="text-muted-foreground hover:text-foreground transition-colors p-1 focus:outline-none focus:ring-2 focus:ring-primary/20 rounded"
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedFeature(
                          expandedFeature === index ? null : index
                        );
                      }}
                      aria-label={
                        expandedFeature === index
                          ? "Collapse details"
                          : "Expand details"
                      }
                    >
                      {expandedFeature === index ? (
                        <ChevronUp className="w-5 h-5" />
                      ) : (
                        <ChevronDown className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    {feature.description}
                  </p>

                  {/* Expandable details */}
                  {expandedFeature === index && (
                    <div className="mt-4 pt-4  animate-fade-in">
                      <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                        {feature.details}
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.location.href = `/app?feature=${feature.title
                            .toLowerCase()
                            .replace(/\s+/g, "-")}`;
                        }}
                        className="w-full"
                      >
                        Try {feature.title}
                        <ArrowRight className="ml-2 w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section with Animations */}
      <section className="py-24 px-4 bg-background ">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
              How It Works
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Transform any YouTube video into educational content in three
              simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 md:gap-12">
            {steps.map((step, index) => (
              <div key={index} className="step-card relative text-center group">
                {/* Step connector arrow for larger screens */}
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-16 left-full w-full z-10">
                    <ArrowRight className="w-8 h-8 text-primary mx-auto transform translate-x-1/2" />
                  </div>
                )}

                <div className="relative z-20 h-full">
                  <div className="flex items-center justify-center w-24 h-24 bg-primary/10 rounded-full mb-6 mx-auto group-hover:bg-primary/20 transition-colors duration-300">
                    <div className="text-primary">{step.icon}</div>
                  </div>

                  <div className="bg-card border border-border border-red-500 h-[220px] rounded-lg p-6 hover:shadow-lg transition-shadow duration-300">
                    <div className="flex items-center justify-center w-8 h-8 bg-primary text-primary-foreground rounded-full text-sm font-bold mb-4 mx-auto">
                      {index + 1}
                    </div>
                    <h3 className="text-xl font-bold mb-4 text-foreground">
                      {step.title}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Secondary CTA in How It Works */}
          <div className="text-center mt-12">
            <SignedOut>
              <Button
                size="lg"
                onClick={() => (window.location.href = "/app")}
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-4 text-lg font-semibold"
              >
                Get Started Now
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </SignedOut>
            <SignedIn>
              <Button
                size="lg"
                onClick={() => (window.location.href = "/app")}
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-4 text-lg font-semibold"
              >
                Let's Chat
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </SignedIn>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      {/* <section className="py-24 px-4 bg-white ">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
              What Our Clients Say
            </h2>
            <p className="text-lg text-muted-foreground">
              Trusted by leading organizations worldwide
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card
                key={index}
                className="bg-card border border-border hover:shadow-lg transition-shadow duration-300"
              >
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star
                        key={i}
                        className="w-5 h-5 text-yellow-400 fill-current"
                      />
                    ))}
                  </div>

                  <div className="relative mb-6">
                    <Quote className="w-8 h-8 text-primary/20 absolute top-0 left-0" />
                    <p className="text-muted-foreground leading-relaxed pl-10 italic">
                      "{testimonial.content}"
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary font-semibold">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <div className="font-semibold text-foreground">
                        {testimonial.name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {testimonial.role}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section> */}

      {/* Call to Action Section */}
      <section ref={ctaRef} id="cta" className="py-24 px-4 bg-white ">
        <div className="max-w-4xl mx-auto text-center">
          <div className="space-y-8">
            <h2 className="text-4xl md:text-5xl font-black text-foreground leading-tight">
              Ready to Transform Your{" "}
              <span className="text-primary">Educational Content?</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Join thousands of educators and enterprises who trust our
              AI-powered platform to create engaging, compliant educational
              content from YouTube videos.
            </p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Button
                size="lg"
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-10 py-6 text-xl font-bold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 min-h-[64px] focus:ring-4 focus:ring-primary/20"
                onClick={() => (window.location.href = "/app")}
                aria-label="Start your enterprise demo"
              >
                <BookOpen className="mr-3 w-6 h-6" />
                Start Your Enterprise Demo
              </Button>
              {/* <Button
                variant="outline"
                size="lg"
                className="text-foreground hover:bg-accent px-10 py-6 text-xl font-semibold rounded-lg border-2 border-border min-h-[64px] focus:ring-4 focus:ring-accent/20"
                onClick={() =>
                  window.open(
                    "mailto:contact@aitransform.com?subject=Schedule Consultation",
                    "_blank"
                  )
                }
                aria-label="Schedule a consultation"
              >
                Schedule a Consultation
              </Button> */}
            </div>

            {/* Enhanced microcopy with animations */}
            {/* <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground pt-8">
              <div className="flex items-center gap-2 animate-fade-in">
                <CheckCircle className="w-4 h-4 text-primary animate-pulse" />
                <span>SOC 2 Compliant</span>
              </div>
              <div
                className="flex items-center gap-2 animate-fade-in"
                style={{ animationDelay: "0.2s" }}
              >
                <CheckCircle className="w-4 h-4 text-primary animate-pulse" />
                <span>GDPR Ready</span>
              </div>
              <div
                className="flex items-center gap-2 animate-fade-in"
                style={{ animationDelay: "0.4s" }}
              >
                <CheckCircle className="w-4 h-4 text-primary animate-pulse" />
                <span>Enterprise Support</span>
              </div>
            </div> */}
          </div>
        </div>
      </section>

      {/* Enhanced Footer with better accessibility and contrast */}
      <footer className="py-16 px-4 bg-card !bg-background">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 mb-8">
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-foreground">
                AI Transform
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Enterprise-grade AI platform for YouTube content transformation
                and educational content generation.
              </p>
              {/* <div className="flex gap-4">
                <button
                  className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary hover:bg-primary/20 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20"
                  aria-label="Follow us on Twitter"
                >
                  <span className="text-sm font-bold">T</span>
                </button>
                <button
                  className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary hover:bg-primary/20 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20"
                  aria-label="Follow us on LinkedIn"
                >
                  <span className="text-sm font-bold">L</span>
                </button>
                <button
                  className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary hover:bg-primary/20 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20"
                  aria-label="Follow us on GitHub"
                >
                  <span className="text-sm font-bold">G</span>
                </button>
              </div> */}
            </div>

            <div className="space-y-3 place-items-center">
              <h4 className="font-semibold text-foreground">Solutions</h4>
              <nav className="space-y-2 text-sm">
                <button
                  className="block text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 rounded text-left"
                  onClick={() =>
                    document
                      .getElementById("features")
                      ?.scrollIntoView({ behavior: "smooth" })
                  }
                >
                  AI Q&A Generation
                </button>
                <button
                  className="block text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 rounded text-left"
                  onClick={() => (window.location.href = "/app?tab=mcqs")}
                >
                  MCQ Creation
                </button>
                <button
                  className="block text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 rounded text-left"
                  onClick={() => (window.location.href = "/app?tab=insights")}
                >
                  Content Analytics
                </button>
                <button
                  className="block text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 rounded text-left"
                  onClick={() => (window.location.href = "/app?tab=insights")}
                >
                  Smart Insights
                </button>
              </nav>
            </div>

            {/* <div className="space-y-3">
              <h4 className="font-semibold text-foreground">Platform</h4>
              <nav className="space-y-2 text-sm">
                <a
                  href="#enterprise"
                  className="block text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 rounded"
                >
                  Enterprise
                </a>
                <a
                  href="#security"
                  className="block text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 rounded"
                >
                  Security
                </a>
                <a
                  href="#integrations"
                  className="block text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 rounded"
                >
                  Integrations
                </a>
                <a
                  href="#api"
                  className="block text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 rounded"
                >
                  API
                </a>
              </nav>
            </div> */}

            <div className="space-y-3 place-items-center">
              <h4 className="font-semibold text-foreground">Company</h4>
              <nav className="space-y-2 text-sm">
                <a
                  href="#about"
                  className="block text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 rounded"
                >
                  About
                </a>
                <a
                  href="#careers"
                  className="block text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 rounded"
                >
                  Careers
                </a>
                <a
                  href="#press"
                  className="block text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 rounded"
                >
                  Press
                </a>
                <a
                  href="mailto:contact@aitransform.com"
                  className="block text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 rounded"
                >
                  Contact
                </a>
              </nav>
            </div>
          </div>

          <div className=" pt-8">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <p className="text-muted-foreground text-sm">
                © 2024 AI Transform. All rights reserved. Enterprise-grade AI
                for educational content transformation.
              </p>
              <div className="flex gap-6 text-sm">
                <a
                  href="#privacy"
                  className="text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 rounded"
                >
                  Privacy Policy
                </a>
                <a
                  href="#terms"
                  className="text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 rounded"
                >
                  Terms of Service
                </a>
                <a
                  href="#cookies"
                  className="text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 rounded"
                >
                  Cookie Policy
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ClerkProvider } from "@clerk/clerk-react";
import { LandingPage } from "@/components/LandingPage";
import { YouTubeQAApp } from "@/components/YouTubeQAApp";
import { Dashboard } from "@/components/auth/Dashboard";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { ChatGPTMemory } from "@/components/ChatGPTMemory";
import NotFound from "./pages/NotFound";
import { clerkConfig } from "@/config/clerk";

const queryClient = new QueryClient();

const App = () => (
  <ClerkProvider publishableKey={clerkConfig.publishableKey}>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route 
              path="/app" 
              element={
                <ProtectedRoute>
                  <YouTubeQAApp />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/chat" 
              element={
                <ProtectedRoute>
                  <ChatGPTMemory />
                </ProtectedRoute>
              } 
            />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ClerkProvider>
);

export default App;

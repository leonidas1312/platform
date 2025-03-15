import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LazyMotion, domAnimation } from "framer-motion";
import Index from "./pages/Index";
import QubotOptimizers from "./pages/QubotOptimizers";
import QubotOptDetail from "./pages/QubotOptDetail";
import QubotProblems from "./pages/QubotProblems";
import Community from "./pages/Community";
import Documentation from "./pages/Documentation";
import Blogs from "./pages/Blogs";
import NotFound from "./pages/NotFound";
import AuthPage from "./pages/AuthPage";
import Profile from "./pages/Profile";
import EmailVerify from "./pages/EmailVerify";
import PublicReposPage from "./pages/PublicReposPage";
import RepoPage from "./pages/RepoPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LazyMotion features={domAnimation}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/qubot-problems" element={<QubotProblems />} />
            <Route path="/community" element={<Community />} />
            <Route path="/blogs" element={<Blogs />} />
            <Route path="/docs" element={<Documentation />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/email-verify" element={<EmailVerify />} />
            <Route path="/qubot-optimizers" element={<PublicReposPage />} />
            <Route path="/:owner/:repoName" element={<RepoPage />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </LazyMotion>
  </QueryClientProvider>
);

export default App;

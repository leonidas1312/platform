import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LazyMotion, domAnimation } from "framer-motion";
import Index from "./pages/Index";
import QubotProblems from "./pages/QubotProblems";
import Community from "./pages/Community";
import Documentation from "./pages/Documentation";
import BlogsPage from "./pages/Blogs";
import BlogDetails from "./pages/BlogDetails";
import NotFound from "./pages/NotFound";
import AuthPage from "./pages/AuthPage";
import Profile from "./pages/Profile";
import EmailVerify from "./pages/EmailVerify";
import PublicReposPage from "./pages/PublicReposPage";
import RepoPage from "./pages/RepoPage";
import { ThemeProvider } from "./components/ThemeContext";
import SettingsPage from "./pages/SettingsPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <LazyMotion features={domAnimation}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/qubot-problems" element={<QubotProblems />} />
              <Route path="/community" element={<Community />} />
              <Route path="/blogs" element={<BlogsPage />} />
              <Route path="/blogs/:id" element={<BlogDetails />} />
              <Route path="/docs" element={<Documentation />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/email-verify" element={<EmailVerify />} />
              <Route path="/qubots" element={<PublicReposPage />} />
              

              {/* Profile page with username in URL */}
              <Route path="/u/:username" element={<Profile />} />
              <Route path="/u/:username/settings" element={<SettingsPage />} />
              
              {/* Gitea-style repository routes */}
              <Route path="/:owner/:repoName" element={<RepoPage />} />
              <Route path="/:owner/:repoName/src/branch/:branch" element={<RepoPage />} />
              <Route path="/:owner/:repoName/src/branch/:branch/*" element={<RepoPage />} />


              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </LazyMotion>

    </ThemeProvider>
    
  </QueryClientProvider>
);

export default App;

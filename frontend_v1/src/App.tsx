import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LazyMotion, domAnimation } from "framer-motion";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AuthPage from "./pages/AuthPage";
import Profile from "./pages/Profile";
import PublicReposPage from "./pages/PublicReposPage";
import RepoPage from "./pages/RepoPage";
import { ThemeProvider } from "./components/ThemeContext";
import SettingsPage from "./pages/SettingsPage";
import ExperimentalPreviewPage from "./pages/ExperimentalPreview";
import BenchmarkPage from "./pages/Benchmark";
import QubotPlayground from "./pages/QubotPlayground";
import OptimizationWorkflows from "./pages/OptimizationWorkflows";
import WorkflowDetail from "./pages/WorkflowDetail";
import WaitlistAdmin from "./pages/WaitlistAdmin";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminProtectedRoute from "./components/AdminProtectedRoute";

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
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/qubots" element={<PublicReposPage />} />
              <Route path="/experimental-preview" element={<ExperimentalPreviewPage />} />
              <Route path="/benchmark" element={
                <ProtectedRoute>
                  <BenchmarkPage />
                </ProtectedRoute>
              } />
              <Route path="/qubots-playground" element={
                <ProtectedRoute>
                  <QubotPlayground />
                </ProtectedRoute>
              } />
              <Route path="/optimization-workflows" element={
                <ProtectedRoute>
                  <OptimizationWorkflows />
                </ProtectedRoute>
              } />
              <Route path="/workflow/:id" element={
                <ProtectedRoute>
                  <WorkflowDetail />
                </ProtectedRoute>
              } />
              <Route path="/admin/waitlist" element={
                <AdminProtectedRoute>
                  <WaitlistAdmin />
                </AdminProtectedRoute>
              } />
              

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

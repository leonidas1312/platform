import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navigation from "./components/Navigation";
import Landing from "./pages/Landing";
import Docs from "./pages/Docs";
import Profile from "./pages/Profile";
import Repositories from "./pages/Repositories";
import Leaderboard from "./pages/Leaderboard"; 
import NotFound from "./pages/NotFound";
import SignIn from "./pages/SignIn";
import DocsLanding from "@/pages/docs/DocsLanding";
import GettingStartedIntroduction from "@/pages/docs/GettingStartedIntroduction";
import CreatingQubots from "./pages/docs/CreatingQubots";
import UploadingQubots from "./pages/docs/UploadingQubots";
import QubotCards from "./pages/docs/QubotCards";
import LocalUsage from "./pages/docs/LocalUsage";
import BenchmarkGuide from "./pages/docs/BenchmarkGuide";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Navigation />
        <Routes>
          <Route path="/" element={<Landing />} />
          
          <Route path="/docs" element={<Docs />}>
          <Route index element={<GettingStartedIntroduction />} />
          <Route path="getting-started/introduction" element={<GettingStartedIntroduction />} />
          <Route path="getting-started/uploading-qubots" element={<UploadingQubots />} />
          <Route path="getting-started/creating-qubots" element={<CreatingQubots />} />
          <Route path="getting-started/qubot-cards" element={<QubotCards />} />
          <Route path="getting-started/local-usage" element={<LocalUsage />} />
          <Route path="getting-started/benchmark-guide" element={<BenchmarkGuide />} />


          </Route>


          <Route path="/repositories" element={<Repositories />} />
          <Route path="/leaderboard" element={<Leaderboard />} /> 
          <Route path="/profile" element={<Profile />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
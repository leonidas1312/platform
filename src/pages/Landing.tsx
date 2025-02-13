import { Code2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { createClient } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import GithubAuth from "@/components/auth/GithubAuth";

const supabase = createClient(
  'https://qpqtbkionqkpkoznkhtv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwcXRia2lvbnFrcGtvem5raHR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDk5MzEwNjUsImV4cCI6MjAyNTUwNzA2NX0.oVDEhm-hXMqSBfIeYcvexWXzKi-jS3QUgTD3NDaZVvI'
);

const Landing = () => {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <div className="container py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold flex items-center justify-center text-github-gray mb-4"> 
            <div className="text-center">
              <img src="/rastion1.svg" alt="Rastion Logo" className="w-full max-w-[250px]" />
            </div>
          </h1>

          <p className="text-xl text-github-gray mb-8">Optimization for everyone</p>
          <div className="max-w-2xl mx-auto text-github-gray mb-12">
            <p className="mb-4">
              Rastion allows users to create and share optimizers and problems by making team accessible to everyone.
              Join us in building a more efficient future through open source collaboration.
            </p>
          </div>
          
          {!user ? (
            <div className="max-w-sm mx-auto mb-8">
              <GithubAuth />
            </div>
          ) : null}
          
          <div className="flex gap-4 justify-center">
            <Button asChild>
              <Link to="/repositories">Browse Repositories</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/docs">Read Documentation</Link>
            </Button>
          </div>
        </div>

        <div className="mb-16">
          <h2 className="text-2xl font-semibold text-github-gray mb-6">Get Started with Rastion</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-gradient-to-br from-[#1A1F2C] to-[#221F26] p-6 rounded-lg shadow-xl transform hover:scale-[1.02] transition-all duration-300">
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2 text-white">
                <Code2 className="w-5 h-5" />
                Using Optimizers and Problems
              </h3>
              <pre className="bg-[#1E1E1E] p-4 rounded text-sm overflow-x-auto font-code text-[#9b87f5] shadow-inner animate-fade-in">
{`from rastion_hub.auto_optimizer import AutoOptimizer
from rastion_hub.auto_problem import AutoProblem

# Load a problem from the hub
problem = AutoProblem.from_repo(
    "Rastion/portfolio-optimization", 
    revision="main"
)

# Load and run an optimizer
solver = AutoOptimizer.from_repo(
    "Rastion/particle-swarm", 
    revision="main"
)
solution, value = solver.optimize(problem)`}
              </pre>
            </div>

            <div className="bg-gradient-to-br from-[#1A1F2C] to-[#221F26] p-6 rounded-lg shadow-xl transform hover:scale-[1.02] transition-all duration-300">
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2 text-white">
                <Code2 className="w-5 h-5" />
                Sharing Your Work
              </h3>
              <pre className="bg-[#1E1E1E] p-4 rounded text-sm overflow-x-auto font-code text-[#9b87f5] shadow-inner animate-fade-in">
{`# Create a new solver repository
rastion create_repo my-solver --org Rastion

# Push your solver code and config
rastion push_solver my-solver \\
    --file my_solver.py \\
    --config solver_config.json

# Create and push a problem
rastion create_repo my-problem --org Rastion
rastion push_problem my-problem \\
    --file my_problem.py \\
    --config problem_config.json`}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Landing;

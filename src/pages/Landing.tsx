
import { Code2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Slideshow } from "@/components/Slideshow";

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

          <p className="text-xl text-github-gray mb-8">
            Quantum-Inspired Optimization for Everyone
          </p>
          <div className="max-w-2xl mx-auto text-github-gray mb-12">
            <p className="mb-4">
              Rastion brings the power of quantum-inspired algorithms to classical optimization problems.
              Our platform combines quantum computing principles with classical algorithms to solve complex optimization challenges efficiently.
            </p>
          </div>
          
          <div className="flex gap-4 justify-center">
            <Button asChild>
              <Link to="/repositories">Browse Repositories</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/signin">Sign In</Link>
            </Button>
          </div>
        </div>

        <div className="mb-16">
          <h2 className="text-2xl font-semibold text-github-gray mb-6">
            Quantum-Inspired Solutions
          </h2>
          <Slideshow />
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

# Load a quantum-inspired problem
problem = AutoProblem.from_repo(
    "Rastion/quantum-maxcut", 
    revision="main"
)

# Load and run an optimizer
solver = AutoOptimizer.from_repo(
    "Rastion/quantum-annealer", 
    revision="main"
)
solution, value = solver.optimize(problem)`}
              </pre>
            </div>

            <div className="bg-gradient-to-br from-[#1A1F2C] to-[#221F26] p-6 rounded-lg shadow-xl transform hover:scale-[1.02] transition-all duration-300">
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2 text-white">
                <Code2 className="w-5 h-5" />
                Creating Custom Solutions
              </h3>
              <pre className="bg-[#1E1E1E] p-4 rounded text-sm overflow-x-auto font-code text-[#9b87f5] shadow-inner animate-fade-in">
{`# Create a new quantum solver
rastion create_repo quantum-solver --org Rastion

# Push your quantum-inspired implementation
rastion push_solver quantum-solver \\
    --file quantum_solver.py \\
    --config solver_config.json

# Create and push a quantum problem
rastion create_repo quantum-problem --org Rastion
rastion push_problem quantum-problem \\
    --file quantum_problem.py \\
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

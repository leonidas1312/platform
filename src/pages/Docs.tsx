
import { BookOpen, Code2, Terminal, Layers, Flag, GitFork } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Docs = () => {
  return (
    <div className="min-h-screen bg-white">
      <div className="container py-12 max-w-[1200px]">
        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-github-gray mb-4">Documentation</h1>
          <p className="text-xl text-github-gray mb-8">Everything you need to get started with Rastion Hub</p>
        </div>

        <div className="space-y-16">
          {/* Getting Started Section */}
          <section>
            <h2 className="text-2xl font-semibold text-github-gray mb-6 flex items-center gap-2">
              <Flag className="w-6 h-6" />
              Getting Started
            </h2>
            <div className="bg-gradient-to-br from-[#1A1F2C] to-[#221F26] p-6 rounded-lg shadow-xl mb-8">
              <h3 className="text-xl font-semibold mb-4 text-white">Installation</h3>
              <pre className="bg-[#1E1E1E] p-4 rounded text-sm overflow-x-auto font-code text-[#9b87f5] shadow-inner">
                {`pip install rastion`}
              </pre>
            </div>
          </section>

          {/* Key Components Section */}
          <section>
            <h2 className="text-2xl font-semibold text-github-gray mb-6 flex items-center gap-2">
              <Layers className="w-6 h-6" />
              Key Components
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-gradient-to-br from-[#1A1F2C] to-[#221F26] p-6 rounded-lg shadow-xl">
                <h3 className="text-xl font-semibold mb-4 text-white">BaseProblem</h3>
                <div className="bg-[#1E1E1E] p-4 rounded text-sm overflow-x-auto font-code text-[#9b87f5] shadow-inner">
                  {`class BaseProblem:
    def evaluate_solution(self, solution) -> float:
        """Required method to evaluate a solution."""
        pass

    def random_solution(self):
        """Optional method to generate random solutions."""
        pass`}
                </div>
              </div>

              <div className="bg-gradient-to-br from-[#1A1F2C] to-[#221F26] p-6 rounded-lg shadow-xl">
                <h3 className="text-xl font-semibold mb-4 text-white">BaseOptimizer</h3>
                <div className="bg-[#1E1E1E] p-4 rounded text-sm overflow-x-auto font-code text-[#9b87f5] shadow-inner">
                  {`class BaseOptimizer:
    def optimize(self, problem, **kwargs) -> Tuple[Any, float]:
        """Required method to optimize a problem.
        Returns: (best_solution, best_value)"""
        pass`}
                </div>
              </div>
            </div>
          </section>

          {/* Usage Examples Section */}
          <section>
            <h2 className="text-2xl font-semibold text-github-gray mb-6 flex items-center gap-2">
              <Code2 className="w-6 h-6" />
              Usage Examples
            </h2>
            <div className="bg-gradient-to-br from-[#1A1F2C] to-[#221F26] p-6 rounded-lg shadow-xl mb-8">
              <h3 className="text-xl font-semibold mb-4 text-white">Portfolio Optimization with PSO</h3>
              <pre className="bg-[#1E1E1E] p-4 rounded text-sm overflow-x-auto font-code text-[#9b87f5] shadow-inner">
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
          </section>

          {/* CLI Commands Section */}
          <section>
            <h2 className="text-2xl font-semibold text-github-gray mb-6 flex items-center gap-2">
              <Terminal className="w-6 h-6" />
              CLI Commands
            </h2>
            <div className="bg-gradient-to-br from-[#1A1F2C] to-[#221F26] p-6 rounded-lg shadow-xl">
              <div className="grid gap-6">
                <div>
                  <h3 className="text-xl font-semibold mb-4 text-white">Create and Push</h3>
                  <pre className="bg-[#1E1E1E] p-4 rounded text-sm overflow-x-auto font-code text-[#9b87f5] shadow-inner">
{`# Create a new solver repository
rastion create_repo my-solver --org Rastion

# Push your solver code and config
rastion push_solver my-solver \\
    --file my_solver.py \\
    --config solver_config.json`}
                  </pre>
                </div>
              </div>
            </div>
          </section>

          {/* Contributing Section */}
          <section>
            <h2 className="text-2xl font-semibold text-github-gray mb-6 flex items-center gap-2">
              <GitFork className="w-6 h-6" />
              Contributing
            </h2>
            <div className="bg-gray-50 p-6 rounded-lg">
              <p className="text-github-gray mb-4">
                We encourage you to add new solvers and problems! Follow these steps:
              </p>
              <ol className="list-decimal list-inside space-y-2 text-github-gray">
                <li>Implement a class extending BaseOptimizer</li>
                <li>Supply a solver_config.json</li>
                <li>Push to a GitHub repo</li>
                <li>Reference your code using AutoOptimizer or AutoProblem classes</li>
              </ol>
            </div>
          </section>

          {/* CTA Section */}
          <div className="text-center pt-8">
            <p className="text-xl text-github-gray mb-6">Ready to get started?</p>
            <Button asChild size="lg">
              <Link to="/repositories">Browse Repositories</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Docs;

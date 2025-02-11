
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
          <p className="text-xl text-github-gray mb-8">Everything you need to get started with Rastion</p>
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
            
            {/* Example 1: PSO for portfolio optimization */}
            <div className="bg-gradient-to-br from-[#1A1F2C] to-[#221F26] p-6 rounded-lg shadow-xl mb-8">
              <h3 className="text-xl font-semibold mb-4 text-white">Example 1: Run PSO for portfolio optimization</h3>
              <pre className="bg-[#1E1E1E] p-4 rounded text-sm overflow-x-auto font-code text-[#9b87f5] shadow-inner">
{`from rastion_hub.auto_problem import AutoProblem
from rastion_hub.auto_optimizer import AutoOptimizer

problem = AutoProblem.from_repo(f"Rastion/portfolio-optimization", revision="main")
optimizer = AutoOptimizer.from_repo(f"Rastion/particle-swarm",
                                    revision="main",
                                    override_params={"swarm_size":60,"max_iters":500})

best_solution, best_cost = optimizer.optimize(problem)
print("Portfolio Optimization with PSO")
print("Best Solution:", best_solution)
print("Best Cost:", best_cost)`}
              </pre>
            </div>

            {/* Example 2: Quantum Classical Pipeline */}
            <div className="bg-gradient-to-br from-[#1A1F2C] to-[#221F26] p-6 rounded-lg shadow-xl mb-8">
              <h3 className="text-xl font-semibold mb-4 text-white">Example 2: Use VQA as warm starter for classical optimization</h3>
              <pre className="bg-[#1E1E1E] p-4 rounded text-sm overflow-x-auto font-code text-[#9b87f5] shadow-inner">
{`from rastion_hub.auto_problem import AutoProblem
from rastion_hub.auto_optimizer import AutoOptimizer
from rastion_hub.quantum_classical_pipeline import create_quantum_classical_pipeline

# 1. Load the problem instance
problem = AutoProblem.from_repo(f"Rastion/max-cut", revision="main")

# 2. Load the quantum optimizer for the VQA pipeline
quantum_optimizer = AutoOptimizer.from_repo(
   f"Rastion/vqa-qubit-eff",
   revision="main",
   override_params={
      "num_layers": 6,        
      "max_iters": 100,
      "nbitstrings": 5,
   }
)

# 3. Load the classical optimizer for the VQA pipeline
classical_optimizer = AutoOptimizer.from_repo(
      f"Rastion/rl-optimizer",
      revision="main",
      override_params={
            "time_limit": 1  # seconds
      }
)
      
# Compose the quantum-classical pipeline
pipeline = create_quantum_classical_pipeline(
   quantum_routine=quantum_optimizer,
   classical_optimizer=classical_optimizer
)

# Run the VQA pipeline
print("Running VQA pipeline ...")
vqa_solution, vqa_cost = pipeline.optimize(problem)
print(f"VQA Pipeline Solution: {vqa_solution}")
print(f"VQA Pipeline Cost: {vqa_cost}")`}
              </pre>
            </div>

            {/* Example 3: Multiple Independent Solvers */}
            <div className="bg-gradient-to-br from-[#1A1F2C] to-[#221F26] p-6 rounded-lg shadow-xl mb-8">
              <h3 className="text-xl font-semibold mb-4 text-white">Example 3: Run multiple solvers independently</h3>
              <pre className="bg-[#1E1E1E] p-4 rounded text-sm overflow-x-auto font-code text-[#9b87f5] shadow-inner">
{`from rastion_hub.auto_problem import AutoProblem
from rastion_hub.auto_optimizer import AutoOptimizer
from rastion_hub.optimizer_runner import run_optimizers_independently

# Load a small maxcut optimization problem
problem = AutoProblem.from_repo(f"Rastion/max-cut", revision="main")

# Load several optimizers with optional parameter overrides
optimizer1 = AutoOptimizer.from_repo(
   f"Rastion/particle-swarm",
   revision="main",
   override_params={"swarm_size": 50, "max_iters": 100}
)
optimizer2 = AutoOptimizer.from_repo(
   f"Rastion/tabu-search",
   revision="main",
   override_params={"max_iters": 100, "tabu_tenure": 10, "verbose": True}
)
optimizer3 = AutoOptimizer.from_repo(
   f"Rastion/exhaustive-search",
   revision="main",
)

optimizers = [optimizer1, optimizer2, optimizer3]

results = run_optimizers_independently(problem, optimizers)

# Find the best result
best_optimizer, best_solution, best_cost = min(results, key=lambda x: x[2])

print("=== Independent Runs Results ===")
for name, sol, cost in results:
   print(f"Optimizer {name}: Cost = {cost}, Solution = {sol}")
print(f"\\nBest optimizer: {best_optimizer} with cost = {best_cost}")`}
              </pre>
            </div>

            {/* Example 4: Chained Solvers */}
            <div className="bg-gradient-to-br from-[#1A1F2C] to-[#221F26] p-6 rounded-lg shadow-xl mb-8">
              <h3 className="text-xl font-semibold mb-4 text-white">Example 4: Run multiple solvers chained together</h3>
              <pre className="bg-[#1E1E1E] p-4 rounded text-sm overflow-x-auto font-code text-[#9b87f5] shadow-inner">
{`from rastion_hub.auto_problem import AutoProblem
from rastion_hub.auto_optimizer import AutoOptimizer
from rastion_hub.optimizer_runner import run_optimizers_in_chain

# Load a small maxcut optimization problem
problem = AutoProblem.from_repo(f"Rastion/max-cut", revision="main")

# Load a chain of optimizers
optimizer1 = AutoOptimizer.from_repo(
   f"Rastion/particle-swarm",
   revision="main",
   override_params={"swarm_size": 50, "max_iters": 100}
)
optimizer2 = AutoOptimizer.from_repo(
   f"Rastion/tabu-search",
   revision="main",
   override_params={"max_iters": 100, "tabu_tenure": 10, "verbose": True}
)
optimizer3 = AutoOptimizer.from_repo(
   f"Rastion/rl-optimizer",
   revision="main",
   override_params={"time_limit": 1}
)

optimizers_chain = [optimizer1, optimizer2, optimizer3]

final_solution, final_cost = run_optimizers_in_chain(problem, optimizers_chain)

print("=== Chained Refinement Results ===")
print(f"Final refined solution: {final_solution} with cost: {final_cost}\\n")

exhaustive_optimizer = AutoOptimizer.from_repo(
   f"Rastion/exhaustive-search",
   revision="main",
)

best_solution, best_cost = exhaustive_optimizer.optimize(problem)
print("=== Exhaustive Results ===")
print(f"Best solution: {best_solution} with cost: {best_cost}\\n")`}
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

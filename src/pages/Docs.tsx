
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
                <pre className="bg-[#1E1E1E] p-4 rounded text-sm overflow-x-auto font-code text-[#9b87f5] shadow-inner">
{`from abc import ABC, abstractmethod

class BaseProblem(ABC):
    """Base class for any Rastion problem.
    Defines a minimal interface."""
    
    @abstractmethod
    def evaluate_solution(self, solution) -> float:
        """Return a cost to minimize."""
        pass
        
    @abstractmethod
    def random_solution(self):
        """Return a random valid solution."""
        pass
        
    @abstractmethod
    def get_qubo(self):
        """Return QUBO matrix and constant."""
        pass`}
                </pre>
              </div>

              <div className="bg-gradient-to-br from-[#1A1F2C] to-[#221F26] p-6 rounded-lg shadow-xl">
                <h3 className="text-xl font-semibold mb-4 text-white">BaseOptimizer</h3>
                <pre className="bg-[#1E1E1E] p-4 rounded text-sm overflow-x-auto font-code text-[#9b87f5] shadow-inner">
{`from abc import ABC, abstractmethod

class BaseOptimizer(ABC):
    """Base class for any Rastion optimizer."""
    
    @abstractmethod
    def optimize(self, problem, **kwargs):
        """Run optimization, return tuple:
        (best_solution, best_value)"""
        pass`}
                </pre>
              </div>
            </div>
          </section>

          {/* Creating a Problem Section */}
          <section>
            <h2 className="text-2xl font-semibold text-github-gray mb-6 flex items-center gap-2">
              <Code2 className="w-6 h-6" />
              Creating a Problem
            </h2>
            <div className="bg-gradient-to-br from-[#1A1F2C] to-[#221F26] p-6 rounded-lg shadow-xl mb-8">
              <h3 className="text-xl font-semibold mb-4 text-white">Example: MaxCut Problem</h3>
              <p className="text-white mb-4">Follow these steps to create and host a new problem:</p>
              <ol className="list-decimal list-inside space-y-2 text-white mb-6">
                <li>Create a Python file implementing BaseProblem</li>
                <li>Create a problem_config.json with entry point and parameters</li>
                <li>Use Rastion CLI to create and push your problem</li>
              </ol>

              <div className="space-y-4">
                <div>
                  <h4 className="text-lg font-semibold text-white mb-2">1. Problem Implementation (max_cut.py)</h4>
                  <pre className="bg-[#1E1E1E] p-4 rounded text-sm overflow-x-auto font-code text-[#9b87f5] shadow-inner">
{`import numpy as np
from rastion_hub.base_problem import BaseProblem

def setup_problem(num_nodes, edge_probability=0.5, 
                 min_weight=1, max_weight=10):
    np.random.seed(123)
    nodes = [f'node{i}' for i in range(num_nodes)]
    weights = {}
    for i in range(num_nodes):
        for j in range(i+1, num_nodes):
            if np.random.rand() < edge_probability:
                weight = np.random.randint(min_weight, max_weight+1)
                weights[(i, j)] = weight
                weights[(j, i)] = weight
            else:
                weights[(i, j)] = 0
                weights[(j, i)] = 0
    return nodes, weights

def create_qubo_matrix(num_nodes, weights):
    Q = np.zeros((num_nodes, num_nodes))
    for i in range(num_nodes):
        for j in range(i+1, num_nodes):
            weight = weights.get((i, j), 0)
            Q[i, j] += 2 * weight
            Q[j, i] = Q[i, j]
    
    for i in range(num_nodes):
        incident_weight = sum(weights.get((i, j), 0) 
                            for j in range(num_nodes) if j != i)
        Q[i, i] += -incident_weight
    
    return Q

class MaxCutProblem(BaseProblem):
    def __init__(self, num_nodes=6, edge_probability=0.5,
                 min_weight=1, max_weight=10):
        self.nodes, self.weights = setup_problem(
            num_nodes, edge_probability, min_weight, max_weight)
        self.num_nodes = num_nodes
        self.QUBO_matrix = create_qubo_matrix(num_nodes, self.weights)
        self.qubo_constant = 0

    def evaluate_solution(self, solution) -> float:
        sol = np.array(solution)
        return float(sol.T @ self.QUBO_matrix @ sol + 
                    self.qubo_constant)

    def random_solution(self):
        return np.random.randint(0, 2, self.num_nodes).tolist()

    def get_qubo(self):
        return self.QUBO_matrix, self.qubo_constant`}</pre>
                </div>

                <div>
                  <h4 className="text-lg font-semibold text-white mb-2">2. Problem Configuration (problem_config.json)</h4>
                  <pre className="bg-[#1E1E1E] p-4 rounded text-sm overflow-x-auto font-code text-[#9b87f5] shadow-inner">
{`{
    "entry_point": "max_cut:MaxCutProblem",
    "default_params": {
        "num_nodes": 6,
        "edge_probability": 0.5,
        "min_weight": 1,
        "max_weight": 10
    }
}`}</pre>
                </div>

                <div>
                  <h4 className="text-lg font-semibold text-white mb-2">3. Push to Rastion</h4>
                  <pre className="bg-[#1E1E1E] p-4 rounded text-sm overflow-x-auto font-code text-[#9b87f5] shadow-inner">
{`# Create a new problem repository
rastion create_repo maxcut-problem

# Push your problem implementation
rastion push_problem maxcut-problem \\
    --file max_cut.py \\
    --config problem_config.json`}</pre>
                </div>
              </div>
            </div>
          </section>

          {/* Creating an Optimizer Section */}
          <section>
            <h2 className="text-2xl font-semibold text-github-gray mb-6 flex items-center gap-2">
              <Code2 className="w-6 h-6" />
              Creating an Optimizer
            </h2>
            <div className="bg-gradient-to-br from-[#1A1F2C] to-[#221F26] p-6 rounded-lg shadow-xl mb-8">
              <h3 className="text-xl font-semibold mb-4 text-white">Example: Tabu Search Optimizer</h3>
              <p className="text-white mb-4">Follow these steps to create and host a new optimizer:</p>
              <ol className="list-decimal list-inside space-y-2 text-white mb-6">
                <li>Create a Python file implementing BaseOptimizer</li>
                <li>Create a solver_config.json with entry point and parameters</li>
                <li>Use Rastion CLI to create and push your optimizer</li>
              </ol>

              <div className="space-y-4">
                <div>
                  <h4 className="text-lg font-semibold text-white mb-2">1. Optimizer Implementation (tabu_search.py)</h4>
                  <pre className="bg-[#1E1E1E] p-4 rounded text-sm overflow-x-auto font-code text-[#9b87f5] shadow-inner">
{`from rastion_hub.base_optimizer import BaseOptimizer
import random
import copy

class TabuSearchOptimizer(BaseOptimizer):
    def __init__(self, max_iters=100, tabu_tenure=5, 
                 verbose=False):
        self.max_iters = max_iters
        self.tabu_tenure = tabu_tenure
        self.verbose = verbose

    def optimize(self, problem, **kwargs):
        current = problem.random_solution()
        best_solution = copy.deepcopy(current)
        best_score = problem.evaluate_solution(best_solution)
        tabu_list = []
        
        for iter in range(self.max_iters):
            neighbors = []
            if isinstance(current, list) and len(current) >= 2:
                for _ in range(10):
                    neighbor = current.copy()
                    i, j = random.sample(range(len(neighbor)), 2)
                    neighbor[i], neighbor[j] = neighbor[j], neighbor[i]
                    neighbors.append(neighbor)
            else:
                neighbors.append(problem.random_solution())
                
            feasible = [n for n in neighbors 
                       if n not in tabu_list]
            if not feasible:
                feasible = neighbors
                
            candidate = min(feasible, 
                key=lambda n: problem.evaluate_solution(n))
            candidate_score = problem.evaluate_solution(candidate)
            
            if candidate_score < best_score:
                best_solution = candidate
                best_score = candidate_score
                
            tabu_list.append(candidate)
            if len(tabu_list) > self.tabu_tenure:
                tabu_list.pop(0)
                
            current = candidate
            if self.verbose:
                print(f"Iteration {iter}: Score = {best_score}")
                
        return best_solution, best_score`}</pre>
                </div>

                <div>
                  <h4 className="text-lg font-semibold text-white mb-2">2. Optimizer Configuration (solver_config.json)</h4>
                  <pre className="bg-[#1E1E1E] p-4 rounded text-sm overflow-x-auto font-code text-[#9b87f5] shadow-inner">
{`{
    "entry_point": "tabu_search:TabuSearchOptimizer",
    "default_params": {
        "max_iters": 100,
        "tabu_tenure": 5,
        "verbose": true
    }
}`}</pre>
                </div>

                <div>
                  <h4 className="text-lg font-semibold text-white mb-2">3. Push to Rastion</h4>
                  <pre className="bg-[#1E1E1E] p-4 rounded text-sm overflow-x-auto font-code text-[#9b87f5] shadow-inner">
{`# Create a new optimizer repository
rastion create_repo tabu-search

# Push your optimizer implementation
rastion push_solver tabu-search \\
    --file tabu_search.py \\
    --config solver_config.json`}</pre>
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
            <div className="space-y-8">
              {/* Example 1: Basic Usage */}
              <div className="bg-gradient-to-br from-[#1A1F2C] to-[#221F26] p-6 rounded-lg shadow-xl">
                <h3 className="text-xl font-semibold mb-4 text-white">Example 1: Basic Usage</h3>
                <pre className="bg-[#1E1E1E] p-4 rounded text-sm overflow-x-auto font-code text-[#9b87f5] shadow-inner">
{`from rastion_hub.auto_problem import AutoProblem
from rastion_hub.auto_optimizer import AutoOptimizer

# Load a problem and optimizer
problem = AutoProblem.from_repo("Rastion/maxcut-problem")
optimizer = AutoOptimizer.from_repo(
    "Rastion/tabu-search",
    override_params={"max_iters": 100}
)

# Run optimization
solution, cost = optimizer.optimize(problem)
print(f"Solution: {solution}\\nCost: {cost}")`}
                </pre>
              </div>

              {/* Example 2: Multiple Optimizers */}
              <div className="bg-gradient-to-br from-[#1A1F2C] to-[#221F26] p-6 rounded-lg shadow-xl">
                <h3 className="text-xl font-semibold mb-4 text-white">Example 2: Multiple Optimizers</h3>
                <pre className="bg-[#1E1E1E] p-4 rounded text-sm overflow-x-auto font-code text-[#9b87f5] shadow-inner">
{`from rastion_hub.auto_problem import AutoProblem
from rastion_hub.auto_optimizer import AutoOptimizer
from rastion_hub.optimizer_runner import run_optimizers_independently

problem = AutoProblem.from_repo("Rastion/maxcut-problem")

# Load multiple optimizers
optimizers = [
    AutoOptimizer.from_repo("Rastion/tabu-search"),
    AutoOptimizer.from_repo("Rastion/simulated-annealing"),
    AutoOptimizer.from_repo("Rastion/genetic-algorithm")
]

# Run all optimizers
results = run_optimizers_independently(problem, optimizers)

# Find best result
best_optimizer, best_sol, best_cost = min(
    results, key=lambda x: x[2]
)

print(f"Best optimizer: {best_optimizer}")
print(f"Best solution: {best_sol}")
print(f"Best cost: {best_cost}")`}
                </pre>
              </div>
            </div>
          </section>

          {/* CLI Commands Section */}
          <section>
            <h2 className="text-2xl font-semibold text-github-gray mb-6 flex items-center gap-2">
              <Terminal className="w-6 h-6" />
              CLI Commands
            </h2>
            <div className="bg-gradient-to-br from-[#1A1F2C] to-[#221F26] p-6 rounded-lg shadow-xl">
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold mb-4 text-white">Repository Management</h3>
                  <pre className="bg-[#1E1E1E] p-4 rounded text-sm overflow-x-auto font-code text-[#9b87f5] shadow-inner">
{`# Create new repository
rastion create_repo my-repo

# List repositories
rastion list_repos

# Delete repository
rastion delete_repo my-repo`}
                  </pre>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-4 text-white">Problem & Optimizer Management</h3>
                  <pre className="bg-[#1E1E1E] p-4 rounded text-sm overflow-x-auto font-code text-[#9b87f5] shadow-inner">
{`# Push problem implementation
rastion push_problem my-repo --file problem.py --config config.json

# Push optimizer implementation
rastion push_solver my-repo --file solver.py --config config.json

# List versions
rastion list_versions my-repo`}
                  </pre>
                </div>
              </div>
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

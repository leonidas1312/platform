import { useState } from "react";
import { BookOpen, Code2, Terminal, Layers, Flag } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

const Docs = () => {
  const [activeTab, setActiveTab] = useState("getting-started");
  const [showProblemGuide, setShowProblemGuide] = useState(false);
  const [showOptimizerGuide, setShowOptimizerGuide] = useState(false);

  return (
    <div className="min-h-screen bg-white">
      <div className="container py-12 max-w-[1200px]">
        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-github-gray mb-4">
            Documentation
          </h1>
          <p className="text-xl text-github-gray mb-8">
            Everything you need to get started with Rastion
          </p>
        </div>

        {/* Tabs Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="flex justify-center gap-4 mb-8">
            <TabsTrigger value="getting-started">
              <Flag className="w-5 h-5 mr-2" /> Getting Started
            </TabsTrigger>
            <TabsTrigger value="key-components">
              <Layers className="w-5 h-5 mr-2" /> Key Components
            </TabsTrigger>
            <TabsTrigger value="creating-problem">
              <Code2 className="w-5 h-5 mr-2" /> Creating a Problem
            </TabsTrigger>
            <TabsTrigger value="creating-optimizer">
              <Code2 className="w-5 h-5 mr-2" /> Creating an Optimizer
            </TabsTrigger>
            <TabsTrigger value="usage-examples">
              <BookOpen className="w-5 h-5 mr-2" /> Usage Examples
            </TabsTrigger>
            <TabsTrigger value="cli-commands">
              <Terminal className="w-5 h-5 mr-2" /> CLI Commands
            </TabsTrigger>
          </TabsList>

          {/* Getting Started */}
          <TabsContent value="getting-started">
            <section>
              <h2 className="text-2xl font-semibold text-github-gray mb-6 flex items-center gap-2">
                <Flag className="w-6 h-6" />
                Getting Started
              </h2>
              <div className="bg-gradient-to-br from-[#1A1F2C] to-[#221F26] p-6 rounded-lg shadow-xl">
                <h3 className="text-xl font-semibold mb-4 text-white">
                  Installation
                </h3>
                <pre className="bg-[#1E1E1E] p-4 rounded text-sm overflow-x-auto font-code text-[#9b87f5] shadow-inner">
                  {`pip install rastion`}
                </pre>
              </div>
            </section>
          </TabsContent>

          {/* Key Components */}
          <TabsContent value="key-components">
            <section>
              <h2 className="text-2xl font-semibold text-github-gray mb-6 flex items-center gap-2">
                <Layers className="w-6 h-6" />
                Key Components
              </h2>
              <div className="grid md:grid-cols-2 gap-8">
                <div className="bg-gradient-to-br from-[#1A1F2C] to-[#221F26] p-6 rounded-lg shadow-xl">
                  <h3 className="text-xl font-semibold mb-4 text-white">
                    BaseProblem
                  </h3>
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
                  <h3 className="text-xl font-semibold mb-4 text-white">
                    BaseOptimizer
                  </h3>
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
          </TabsContent>

          {/* Creating a Problem */}
          <TabsContent value="creating-problem">
            <section>
              <h2 className="text-2xl font-semibold text-github-gray mb-6 flex items-center gap-2">
                <Code2 className="w-6 h-6" />
                Creating a Problem
              </h2>
              <div className="bg-gradient-to-br from-[#1A1F2C] to-[#221F26] p-6 rounded-lg shadow-xl mb-8">
                <h3 className="text-xl font-semibold mb-4 text-white">
                  Overview
                </h3>
                <p className="text-white mb-4">
                  Follow these steps to create a new problem repo under Rastion:
                </p>
                <ol className="list-decimal list-inside space-y-2 text-white mb-6">
                  <li>Create a Python file implementing BaseProblem</li>
                  <li>Create a <code>problem_config.json</code> with entry point and parameters</li>
                  <li>Use Rastion CLI to create and push your problem</li>
                </ol>
                {/* (Existing example content goes here…) */}
              </div>

              {/* Collapsible Guide for Creating a Problem */}
              <div className="mt-8">
                <Button variant="outline" onClick={() => setShowProblemGuide(!showProblemGuide)}>
                  {showProblemGuide
                    ? "Hide Detailed Guide: Creating a Rastion Problem"
                    : "Show Detailed Guide: Creating a Rastion Problem"}
                </Button>
                {showProblemGuide && (
                  <div className="mt-4 p-6 bg-gray-900 rounded-lg text-white space-y-4">
                    <h3 className="text-xl font-bold mb-2">Guide 1: Creating a Rastion Problem</h3>
                    <p>
                      This guide will walk you through creating a new optimization problem for Rastion Hub.
                      We’ll build a simple <strong>Binary OneMax</strong> problem where the goal is to maximize the number of ones in a binary vector by minimizing the negative sum of bits.
                    </p>
                    <h4 className="text-lg font-semibold">Step 1: Create the Python Module</h4>
                    <p>Create a file named <code>binary_onemax.py</code> with the following content:</p>
                    <pre className="bg-[#1E1E1E] p-4 rounded overflow-x-auto font-code text-[#9b87f5]">
{`import numpy as np
from rastion_hub.base_problem import BaseProblem

class BinaryOneMaxProblem(BaseProblem):
    """
    Binary OneMax Problem:
    Given a binary vector x, maximize the number of ones by minimizing -sum(x).
    """
    def __init__(self, dimension=10):
        self.dimension = dimension

    def evaluate_solution(self, solution) -> float:
        x = np.array(solution)
        return float(-np.sum(x))
    
    def random_solution(self):
        return np.random.randint(0, 2, self.dimension).tolist()

    def get_qubo(self):
        Q = -1 * np.eye(self.dimension)
        qubo_constant = 0
        return Q, qubo_constant`}
                    </pre>
                    <h4 className="text-lg font-semibold">Step 2: Create the Problem Configuration</h4>
                    <p>Create a file named <code>problem_config.json</code> with this content:</p>
                    <pre className="bg-[#1E1E1E] p-4 rounded overflow-x-auto font-code text-[#9b87f5]">
{`{
  "entry_point": "binary_onemax:BinaryOneMaxProblem",
  "default_params": {
    "dimension": 10
  }
}`}
                    
                    <h4 className="text-lg font-semibold">Step 3: Pushing to Rastion Hub</h4>
                    <p>
                      Use the Rastion CLI to create and push your repository:
                    </p>
                    <pre className="bg-[#1E1E1E] p-4 rounded overflow-x-auto font-code text-[#9b87f5]">
{`# Create repository
rastion create_repo binary-onemax-problem --github-token <YOUR_GITHUB_TOKEN>

# Push your problem implementation
rastion push_problem binary-onemax-problem --file binary_onemax.py --config problem_config.json --github-token <YOUR_GITHUB_TOKEN>`}
                    </pre>


                    </pre>
                    <h4 className="text-lg font-semibold">Step 4: Testing </h4>
                    <p>
                      You can test your problem using the Rastion auto-loader:
                    </p>
                    <pre className="bg-[#1E1E1E] p-4 rounded overflow-x-auto font-code text-[#9b87f5]">
{`from rastion_hub.auto_problem import AutoProblem

problem = AutoProblem.from_repo("Rastion/binary-onemax-problem", revision="main")
print(problem.random_solution())
print(problem.evaluate_solution(problem.random_solution()))`}
                    </pre>
                    
                  </div>
                )}
              </div>
            </section>
          </TabsContent>

          {/* Creating an Optimizer */}
          <TabsContent value="creating-optimizer">
            <section>
              <h2 className="text-2xl font-semibold text-github-gray mb-6 flex items-center gap-2">
                <Code2 className="w-6 h-6" />
                Creating an Optimizer
              </h2>
              <div className="bg-gradient-to-br from-[#1A1F2C] to-[#221F26] p-6 rounded-lg shadow-xl mb-8">
                <h3 className="text-xl font-semibold mb-4 text-white">
                  Example: Tabu Search Optimizer
                </h3>
                <p className="text-white mb-4">
                  Follow these steps to create and host a new optimizer:
                </p>
                <ol className="list-decimal list-inside space-y-2 text-white mb-6">
                  <li>Create a Python file implementing BaseOptimizer</li>
                  <li>Create a <code>solver_config.json</code> with entry point and parameters</li>
                  <li>Use Rastion CLI to create and push your optimizer</li>
                </ol>
                {/* (Existing example content goes here…) */}
              </div>

              {/* Collapsible Guide for Creating an Optimizer */}
              <div className="mt-8">
                <Button variant="outline" onClick={() => setShowOptimizerGuide(!showOptimizerGuide)}>
                  {showOptimizerGuide
                    ? "Hide Detailed Guide: Creating a Rastion Optimizer"
                    : "Show Detailed Guide: Creating a Rastion Optimizer"}
                </Button>
                {showOptimizerGuide && (
                  <div className="mt-4 p-6 bg-gray-900 rounded-lg text-white space-y-4">
                    <h3 className="text-xl font-bold mb-2">Guide 2: Creating a Rastion Optimizer</h3>
                    <p>
                      This guide will help you create a new optimizer for Rastion Hub.
                      We’ll implement a simple <strong>Random Search Optimizer</strong> that samples random solutions and returns the best one.
                    </p>
                    <h4 className="text-lg font-semibold">Step 1: Create the Python Module</h4>
                    <p>Create a file named <code>random_search_optimizer.py</code> with the following content:</p>
                    <pre className="bg-[#1E1E1E] p-4 rounded overflow-x-auto font-code text-[#9b87f5]">
{`import numpy as np
from rastion_hub.base_optimizer import BaseOptimizer

class RandomSearchOptimizer(BaseOptimizer):
    """
    A simple random search optimizer that samples random solutions.
    """
    def __init__(self, max_iters=1000, verbose=False):
        self.max_iters = max_iters
        self.verbose = verbose

    def optimize(self, problem, initial_solution=None, **kwargs):
        if (initial_solution !== null) {
            best_solution = initial_solution
            best_cost = problem.evaluate_solution(best_solution)
        } else {
            best_solution = problem.random_solution()
            best_cost = problem.evaluate_solution(best_solution)
        }
        for (let iter = 0; iter < this.max_iters; iter++) {
            const candidate = problem.random_solution()
            const cost = problem.evaluate_solution(candidate)
            if (cost < best_cost) {
                best_cost = cost
                best_solution = candidate
            }
        }
        return [best_solution, best_cost]
    
    // Note: In JavaScript we use different syntax; here is the Python version:
    #
    # def optimize(self, problem, initial_solution=None, **kwargs):
    #     if initial_solution is not None:
    #         best_solution = initial_solution
    #         best_cost = problem.evaluate_solution(best_solution)
    #     else:
    #         best_solution = problem.random_solution()
    #         best_cost = problem.evaluate_solution(best_solution)
    #
    #     for iter in range(self.max_iters):
    #         candidate = problem.random_solution()
    #         cost = problem.evaluate_solution(candidate)
    #         if cost < best_cost:
    #             best_cost = cost
    #             best_solution = candidate
    #     return best_solution, best_cost`}
                    </pre>
                    <h4 className="text-lg font-semibold">Step 2: Create the Solver Configuration</h4>
                    <p>Create a file named <code>solver_config.json</code> with this content:</p>
                    <pre className="bg-[#1E1E1E] p-4 rounded overflow-x-auto font-code text-[#9b87f5]">
{`{
  "entry_point": "random_search_optimizer:RandomSearchOptimizer",
  "default_params": {
    "max_iters": 1000,
    "verbose": true
  }
}`}
                    </pre>
                    <h4 className="text-lg font-semibold">Step 3: Testing Locally</h4>
                    <p>Test your optimizer using the auto-loader:</p>
                    <pre className="bg-[#1E1E1E] p-4 rounded overflow-x-auto font-code text-[#9b87f5]">
{`from rastion_hub.auto_optimizer import AutoOptimizer
from rastion_hub.auto_problem import AutoProblem

problem = AutoProblem.from_repo("YourGitHubOrg/binary-onemax-problem", revision="main")
optimizer = AutoOptimizer.from_repo("YourGitHubOrg/random-search-optimizer", revision="main")
solution, cost = optimizer.optimize(problem)
print("Best solution:", solution)
print("Cost:", cost)`}
                    </pre>
                    <h4 className="text-lg font-semibold">Step 4: Pushing to Rastion Hub</h4>
                    <p>Use the Rastion CLI to create and push your optimizer repository:</p>
                    <pre className="bg-[#1E1E1E] p-4 rounded overflow-x-auto font-code text-[#9b87f5]">
{`# Create repository
rastion create_repo random-search-optimizer --github-token <YOUR_GITHUB_TOKEN>

# Push your optimizer implementation
rastion push_solver random-search-optimizer --file random_search_optimizer.py --config solver_config.json --github-token <YOUR_GITHUB_TOKEN>`}
                    </pre>
                  </div>
                )}
              </div>
            </section>
          </TabsContent>

          {/* Usage Examples */}
          <TabsContent value="usage-examples">
            <section>
              <h2 className="text-2xl font-semibold text-github-gray mb-6 flex items-center gap-2">
                <BookOpen className="w-6 h-6" />
                Usage Examples
              </h2>
              <div className="space-y-8">
                {/* Example 1: Basic Usage */}
                <div className="bg-gradient-to-br from-[#1A1F2C] to-[#221F26] p-6 rounded-lg shadow-xl">
                  <h3 className="text-xl font-semibold mb-4 text-white">
                    Example 1: Basic Usage
                  </h3>
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
                  <h3 className="text-xl font-semibold mb-4 text-white">
                    Example 2: Multiple Optimizers
                  </h3>
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
          </TabsContent>

          {/* CLI Commands */}
          <TabsContent value="cli-commands">
            <section>
              <h2 className="text-2xl font-semibold text-github-gray mb-6 flex items-center gap-2">
                <Terminal className="w-6 h-6" />
                CLI Commands
              </h2>
              <div className="bg-gradient-to-br from-[#1A1F2C] to-[#221F26] p-6 rounded-lg shadow-xl">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-semibold mb-4 text-white">
                      Repository Management
                    </h3>
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
                    <h3 className="text-xl font-semibold mb-4 text-white">
                      Problem & Optimizer Management
                    </h3>
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
          </TabsContent>
        </Tabs>

        {/* Call to Action */}
        <div className="text-center pt-8">
          <p className="text-xl text-github-gray mb-6">
            Ready to get started?
          </p>
          <Button asChild size="lg">
            <Link to="/repositories">Browse Repositories</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Docs;

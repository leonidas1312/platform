import React from "react";
import CodeBlock from "@/components/CodeBlock";
import { Terminal, Notebook } from "lucide-react";

/**
 * This page guides users through using Qubots locally to:
 * 1. Load and test private/local optimizers against public Rastion problems, or
 * 2. Test private/local problems against Rastion optimizers.
 * 
 * We'll walk you through installing Qubots, creating your own local
 * code that conforms to Qubots interfaces, and mixing/matching local and
 * remote qubots for a seamless development experience.
 */
const LocalUsage = () => {
  return (
    <div className="prose max-w-none space-y-8">
      {/* Intro */}
      <div className="bg-primary-50 p-6 rounded-xl border border-primary-100 shadow-sm">
        <h1 className="text-2xl font-semibold mb-4">Using Qubots Locally</h1>
        <p>
          Qubots can be used in a fully local workflow, or in a hybrid
          workflow that combines local code with problems/optimizers
          pulled from Rastion. This guide shows how to integrate your own
          implementations with qubots from Rastion.
        </p>
      </div>

      {/* Step 1: Local Installation */}
      <div className="bg-primary-50 p-6 rounded-xl border border-primary-100 shadow-sm">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <Terminal className="w-5 h-5 mr-2" />
          Step 1: Local Installation
        </h2>
        <p>
          If you haven't already, install the <code>qubots</code> library
          from PyPI. This gives you the core classes and the{" "}
          <code>AutoProblem</code> / <code>AutoOptimizer</code> loaders.
        </p>
        <CodeBlock code={`pip install qubots`} />
        <p className="mt-4">
          This installation includes the abstract base classes{" "}
          <strong>BaseProblem</strong> and <strong>BaseOptimizer</strong>,
          allowing you to define your own custom qubots. It also includes
          the “Auto” loader classes for retrieving remote qubots from
          Rastion if desired.
        </p>
      </div>

      {/* Step 2: Creating and Using Your Own Optimizer */}
      <div className="bg-primary-50 p-6 rounded-xl border border-primary-100 shadow-sm">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <Notebook className="w-5 h-5 mr-2" />
          Step 2: Creating Your Own Optimizer
        </h2>
        <p>
          If you want to test a local optimizer against a problem from
          Rastion, create a Python file (e.g.,{" "}
          <code>my_local_optimizer.py</code>) that defines a class
          inheriting from <strong>BaseOptimizer</strong>.
        </p>

        <CodeBlock
          code={`# my_local_optimizer.py
from qubots.base_optimizer import BaseOptimizer

class MyLocalOptimizer(BaseOptimizer):
    def __init__(self, max_iterations=100):
        self.max_iterations = max_iterations
    
    def optimize(self, problem, initial_solution=None, **kwargs):
        # 1. If no initial solution, fetch a random one
        if initial_solution is None and hasattr(problem, 'random_solution'):
            current_solution = problem.random_solution()
        else:
            current_solution = initial_solution

        # 2. Evaluate that solution
        best_cost = problem.evaluate_solution(current_solution)
        best_solution = current_solution

        # 3. Some trivial loop just for demonstration
        for _ in range(self.max_iterations):
            # Possibly mutate or tweak the solution
            # Evaluate cost, update if improved
            pass

        return best_solution, best_cost
`}
        />

        <p className="mt-4">
          In this example, <code>MyLocalOptimizer</code> looks for a
          random solution if none is provided, then runs a trivial loop.
          You can implement your favorite local search or advanced
          metaheuristic here.
        </p>
      </div>

      {/* Step 3: Using Rastion Problems with Your Local Optimizer */}
      <div className="bg-primary-50 p-6 rounded-xl border border-primary-100 shadow-sm">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <Terminal className="w-5 h-5 mr-2" />
          Step 3: Testing with a Rastion Problem
        </h2>
        <p>
          You can grab a problem qubot directly from Rastion via{" "}
          <code>AutoProblem.from_repo()</code>. Suppose Rastion hosts a
          Traveling Salesman Problem (TSP) qubot at{" "}
          <strong>Rastion/tsp_problem</strong>.
        </p>
        <CodeBlock
          code={`from qubots.auto_problem import AutoProblem
from my_local_optimizer import MyLocalOptimizer

# Load the problem qubot from the Rastion repo.
problem = AutoProblem.from_repo("Rastion/tsp_problem")

# Create an instance of your local optimizer
optimizer = MyLocalOptimizer(max_iterations=200)

best_solution, best_cost = optimizer.optimize(problem)

print("Best Solution:", best_solution)
print("Best Cost:", best_cost)`}
        />
        <p className="mt-4">
          This approach works because the TSP problem in Rastion adheres
          to <code>BaseProblem</code>. Your local optimizer likewise
          adheres to <code>BaseOptimizer</code>. Qubots is simply the
          “glue” that ensures they communicate properly.
        </p>
      </div>

      {/* Step 4: Using Rastion Optimizers with Your Local Problem */}
      <div className="bg-primary-50 p-6 rounded-xl border border-primary-100 shadow-sm">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <Notebook className="w-5 h-5 mr-2" />
          Step 4: Testing Your Local Problem with a Rastion Optimizer
        </h2>
        <p>
          The reverse scenario—where you have a local problem but want to
          leverage an optimizer from Rastion—follows the same pattern:
          create a local class inheriting from{" "}
          <strong>BaseProblem</strong>, then retrieve an optimizer qubot
          via <code>AutoOptimizer.from_repo()</code>.
        </p>
        <CodeBlock
          code={`# my_local_problem.py
import random
from qubots.base_problem import BaseProblem

class MyLocalProblem(BaseProblem):
    def __init__(self, data):
        self.data = data
    
    def evaluate_solution(self, solution):
        # Example: sum of squares
        return sum(x**2 for x in solution)
    
    def random_solution(self):
        # Suppose we generate random solutions
        return [random.randint(-10, 10) for _ in range(len(self.data))]
`}
        />
        <p className="mt-4">
          Now load an optimizer from Rastion (e.g., a Genetic Algorithm
          solver) and run:
        </p>
        <CodeBlock
          code={`from qubots.auto_optimizer import AutoOptimizer
from my_local_problem import MyLocalProblem

problem = MyLocalProblem(data=[1,2,3,4,5])
optimizer = AutoOptimizer.from_repo("Rastion/genetic_algorithm_solver")

best_solution, best_cost = optimizer.optimize(problem)
print("Best solution:", best_solution)
print("Best cost:", best_cost)`}
        />
        <p>
          As before, your local problem’s class must follow the
          <code>BaseProblem</code> interface. The remote Rastion
          optimizer simply needs that minimal interface to drive its
          search.
        </p>
      </div>

      

      {/* Closing */}
      <div className="bg-primary-50 p-6 rounded-xl border border-primary-100 shadow-sm">
        <h3 className="text-lg font-semibold mb-2">Conclusion</h3>
        <p>
          By conforming to the <strong>BaseProblem</strong> and{" "}
          <strong>BaseOptimizer</strong> interfaces, your custom code is
          immediately compatible with all the existing qubots in Rastion.
          Whether you want to try your local solver on a famous TSP from
          Rastion or test your brand-new local problem with a well-known
          remote metaheuristic, Qubots makes it straightforward. Embrace
          the hybrid approach to accelerate your research and
          experimentation!
        </p>
      </div>
    </div>
  );
};

export default LocalUsage;

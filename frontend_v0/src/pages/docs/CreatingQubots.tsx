import React from "react";
import CodeBlock from "@/components/CodeBlock";
import { Notebook, Code2 } from "lucide-react";

const CreatingQubots = () => {
  return (
    <div className="prose max-w-none">
      <h1 className="mb-4">Creating Qubots</h1>
      <p>
        To solve the MaxCut problem using a Guided Local Search (GLS) approach, we'll create a problem class to represent the MaxCut instance and an optimizer class implementing the GLS algorithm.
      </p>

      {/* MaxCut Problem */}
      <section className="mt-8">
        <h2 className="mb-2">MaxCut Problem Class <code>(maxcut_problem.py)</code></h2>
        <p>
          The <strong>MaxCutProblem</strong> class represents a graph using an adjacency matrix and provides methods to evaluate a solution and generate a random binary partition.
        </p>
        <CodeBlock
          code={`import random
import numpy as np
from qubots.base_problem import BaseProblem

class MaxCutProblem(BaseProblem):
    """
    MaxCut Problem:
    Partition the vertices of a graph into two subsets to maximize the sum of edge weights between the subsets.
    """
    def __init__(self, graph):
        self.graph = np.asarray(graph)
        self.n = self.graph.shape[0]

    def evaluate_solution(self, solution):
        """Evaluate the cut value of a binary partition (0/1 list)."""
        x = np.array(solution)
        same_set = np.equal.outer(x, x)
        same_set = np.triu(same_set, k=1)  # Upper triangle excluding diagonal
        cut_matrix = self.graph * (~same_set)
        return cut_matrix.sum()

    def random_solution(self):
        """Generate a random binary partition."""
        return [random.randint(0, 1) for _ in range(self.n)]
`}
        />

        <h3 className="mt-4">Configuration File: <code>problem_config.json</code></h3>
        <CodeBlock
          code={`{
  "entry_point": "maxcut_problem:MaxCutProblem",
  "default_params": {
    "graph": [
      [0, 1, 1, 0],
      [1, 0, 1, 1],
      [1, 1, 0, 1],
      [0, 1, 1, 0]
    ]
  },
  "creator": "Assistant",
  "type": "problem",
  "problem_name": "MaxCut Problem",
  "description": "Partition graph vertices into two sets to maximize the sum of edge weights between the sets.",
  "keywords": ["maxcut", "graph", "optimization"],
  "decision_variables": {
    "partition": {
      "type": "list of int",
      "description": "Binary list indicating the subset (0 or 1) of each vertex."
    }
  },
  "objective": {
    "type": "maximization",
    "function": "Sum of weights of edges between the two subsets."
  },
  "solution_representation": "binary list"
}`}
        />
      </section>

      {/* GLS MaxCut Optimizer */}
      <section className="mt-12">
        <h2 className="mb-2">GLS MaxCut Optimizer <code>(gls_maxcut_solver.py)</code></h2>
        <p>
          The <strong>GLSMaxCutSolver</strong> class implements Guided Local Search for the MaxCut problem. It uses a node-flip local search, updates penalties on edges within the same subset, and applies perturbations to escape local optima.
        </p>
        <CodeBlock
          code={`import time
import random
import numpy as np
from qubots.base_optimizer import BaseOptimizer

class GLSMaxCutSolver(BaseOptimizer):
    """
    Guided Local Search for MaxCut with adaptive penalties on edges not contributing to the cut.
    Features:
    - Node-flip local search
    - Penalty matrix for edges in the same subset
    - Augmented cost function for escaping local optima
    """
    def __init__(self, time_limit=300, lambda_param=0.2, a=1):
        self.time_limit = time_limit
        self.lambda_param = lambda_param
        self.a = a  # Penalty scaling factor

    def optimize(self, problem, initial_solution=None, verbose=False, **kwargs):
        start_time = time.time()
        n = problem.n
        current_solution = initial_solution if initial_solution is not None else problem.random_solution()
        penalties = np.zeros((n, n), dtype=int)

        best_solution = current_solution.copy()
        best_cost = problem.evaluate_solution(best_solution)
        last_improvement = start_time

        while time.time() - start_time < self.time_limit:
            # Local search to maximize augmented cost
            current_solution, current_cost = self.local_search(problem, current_solution, penalties)
            if current_cost > best_cost:
                best_solution, best_cost = current_solution.copy(), current_cost
                last_improvement = time.time()

            # Update penalties on edges in same subset
            self.update_penalties(current_solution, problem.graph, penalties)

            # Perturbation if stuck
            if time.time() - last_improvement > (self.time_limit * 0.2):
                current_solution = self.perturb(best_solution)

        return best_solution, best_cost

    def local_search(self, problem, solution, penalties):
        improved = True
        current = solution.copy()
        augmented_current = self.augmented_cost(problem, current, penalties)

        while improved:
            improved = False
            for i in random.sample(range(problem.n), problem.n):  # Random order
                new_solution = current.copy()
                new_solution[i] = 1 - new_solution[i]
                augmented_new = self.augmented_cost(problem, new_solution, penalties)
                if augmented_new > augmented_current:
                    current = new_solution
                    augmented_current = augmented_new
                    improved = True
                    break  # Greedy improvement
        return current, problem.evaluate_solution(current)

    def augmented_cost(self, problem, solution, penalties):
        base = problem.evaluate_solution(solution)
        x = np.array(solution)
        same_set = np.triu(np.equal.outer(x, x), k=1)
        penalty_sum = np.sum(penalties * same_set)
        return base - self.lambda_param * self.a * penalty_sum

    def update_penalties(self, solution, graph, penalties):
        x = np.array(solution)
        same_set = np.triu(np.equal.outer(x, x), k=1)
        utilities = []
        for i, j in zip(*np.where(same_set)):
            if graph[i][j] == 0: continue
            utility = graph[i][j] / (1 + penalties[i][j])
            utilities.append((utility, i, j))
        if utilities:
            max_util = max(utilities, key=lambda x: x[0])[0]
            for util, i, j in utilities:
                if util >= max_util - 1e-6:
                    penalties[i][j] += 1

    def perturb(self, solution):
        perturbed = solution.copy()
        n = len(perturbed)
        for i in random.sample(range(n), k=random.randint(1, max(1, n//10))):
            perturbed[i] = 1 - perturbed[i]
        return perturbed
`}
        />

        <h3 className="mt-4">Configuration File: <code>solver_config.json</code></h3>
        <CodeBlock
          code={`{
    "entry_point": "gls_maxcut_solver:GLSMaxCutSolver",
    "default_params": {
        "time_limit": 300,
        "lambda_param": 0.2,
        "a": 1
    },
    "creator": "Assistant",
    "type": "optimizer",
    "optimizer_name": "Guided Local Search MaxCut Solver",
    "description": "Maximizes cut using GLS with penalties on edges within the same subset. Employs node-flip local search and dynamic penalties.",
    "compatible_problems": ["maxcut_problem"],
    "parameters": {
        "time_limit": {
            "type": "int",
            "description": "Maximum runtime in seconds."
        },
        "lambda_param": {
            "type": "float",
            "description": "Penalty coefficient for augmented cost."
        },
        "a": {
            "type": "float",
            "description": "Adaptive scaling factor for penalties."
        }
    },
    "requirements": ["qubots", "numpy"],
    "keywords": ["maxcut", "guided local search", "heuristic"]
}`}
        />
      </section>

      {/* Dependencies */}
      <section className="mt-12">
        <h2 className="mb-2">Dependencies</h2>
        <p>The following packages are required:</p>
        <CodeBlock code={`qubots
numpy`} />
      </section>

      {/* Explanation */}
      <section className="mt-12">
        <h2 className="mb-2">Explanation</h2>
        <p>
          <strong>MaxCutProblem Class:</strong><br />
          - Represents the graph using an adjacency matrix.<br />
          - <em>evaluate_solution</em> computes the cut value using vectorized operations.<br />
          - <em>random_solution</em> generates a random binary partition.
        </p>
        <p>
          <strong>GLSMaxCutSolver Class:</strong><br />
          - Implements a Guided Local Search with a node-flip local search strategy.<br />
          - Updates penalties on edges within the same subset to escape local optima.<br />
          - Balances exploration and exploitation via an augmented cost function.
        </p>
      </section>
    </div>
  );
};

export default CreatingQubots;

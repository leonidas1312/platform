// src/components/ProblemGuidesSection.tsx
import React, { useState, FC, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import CodeBlock from "@/components/CodeBlock";

interface GuideModalProps {
  title: string;
  content: ReactNode;
  onClose: () => void;
}

const GuideModal: FC<GuideModalProps> = ({ title, content, onClose }) => {
  return (
    <div
      onClick={onClose}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    >
      <div
        onClick={(e) => e.stopPropagation()} // prevent closing when clicking inside modal
        className="bg-gray-900 p-6 rounded-lg max-h-full overflow-auto w-11/12 md:w-3/4 lg:w-1/2"
      >
        <h3 className="text-xl font-bold mb-4 text-white">{title}</h3>
        <div className="text-white space-y-4">{content}</div>
        <div className="mt-6 text-right">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};

type GuideKey = "minVertexCover" | "setCover" | "logisticRegression" | "leastSquares";

const ProblemGuidesSection: FC = () => {
  // activeGuide is set to a key identifying the guide; otherwise, null means no modal is open.
  const [activeGuide, setActiveGuide] = useState<GuideKey | null>(null);

  const closeModal = () => setActiveGuide(null);

  // Define the guide content for each new problem.
  const guides: Record<GuideKey, { title: string; content: ReactNode }> = {
    minVertexCover: {
      title: "Guide: Creating a Rastion Problem – Minimum Vertex Cover",
      content: (
        <>
          <p>
            This guide walks you through creating a new QUBO problem for Rastion Hub:
            the Minimum Vertex Cover. In this problem you must select a subset of vertices in
            an undirected graph so that every edge is covered while minimizing the number of vertices selected.
          </p>
          <h4 className="text-lg font-semibold">Step 1: Create the Python Module</h4>
          <p>Create a file named <code>min_vertex_cover.py</code> with the following content:</p>
          <CodeBlock
code={`import numpy as np
from rastion_hub.base_problem import BaseProblem

class MinVertexCoverProblem(BaseProblem):
    """
    Minimum Vertex Cover Problem:
    Given an undirected graph, select a subset of vertices such that every edge is covered.
    QUBO formulation uses cost A=1 per vertex and penalty B=10 for uncovered edges.
    """
    def __init__(self, num_vertices=6, edge_probability=0.5, A=1, B=10, seed=123):
        self.num_vertices = num_vertices
        self.A = A
        self.B = B
        np.random.seed(seed)
        self.edges = []
        for i in range(num_vertices):
            for j in range(i+1, num_vertices):
                if np.random.rand() < edge_probability:
                    self.edges.append((i, j))
        self.Q, self.qubo_constant = self._build_qubo()
        
    def _build_qubo(self):
        n = self.num_vertices
        Q = np.zeros((n, n))
        constant = 0
        for i in range(n):
            Q[i, i] += self.A
        for (i, j) in self.edges:
            Q[i, i] += -self.B
            Q[j, j] += -self.B
            Q[i, j] += self.B
            Q[j, i] += self.B
            constant += self.B
        return Q, constant

    def evaluate_solution(self, solution) -> float:
        x = np.array(solution)
        return float(x.T @ self.Q @ x + self.qubo_constant)

    def random_solution(self):
        return np.random.randint(0, 2, self.num_vertices).tolist()

    def get_qubo(self):
        return self.Q, self.qubo_constant`}
          />
          <h4 className="text-lg font-semibold">Step 2: Create the Problem Configuration</h4>
          <p>Create a file named <code>problem_config.json</code> with this content:</p>
          <CodeBlock
code={`{
  "entry_point": "min_vertex_cover:MinVertexCoverProblem",
  "default_params": {
    "num_vertices": 6,
    "edge_probability": 0.5,
    "A": 1,
    "B": 10
  }
}`}
          />
          <h4 className="text-lg font-semibold">Step 3: Pushing to Rastion Hub</h4>
          <p>
            Use the Rastion CLI to create and push your repository:
          </p>
          <CodeBlock
code={`# Create repository
rastion create_repo min-vertex-cover-problem --github-token <YOUR_GITHUB_TOKEN>

# Push your problem implementation
rastion push_problem min-vertex-cover-problem --file min_vertex_cover.py --config problem_config.json --github-token <YOUR_GITHUB_TOKEN>`}
          />
          <h4 className="text-lg font-semibold">Step 4: Testing</h4>
          <p>
            Test your problem using the auto-loader:
          </p>
          <CodeBlock
code={`from rastion_hub.auto_problem import AutoProblem

problem = AutoProblem.from_repo("Rastion/min-vertex-cover-problem", revision="main")
print(problem.random_solution())
print(problem.evaluate_solution(problem.random_solution()))`}
          />
        </>
      )
    },
    setCover: {
      title: "Guide: Creating a Rastion Problem – Set Cover",
      content: (
        <>
          <p>
            This guide explains how to create a QUBO formulation of the Set Cover problem.
            In this problem you select a subset of sets (with associated costs) so that every element is covered.
          </p>
          <h4 className="text-lg font-semibold">Step 1: Create the Python Module</h4>
          <p>Create a file named <code>set_cover.py</code> with the following content:</p>
          <CodeBlock
code={`import numpy as np
from rastion_hub.base_problem import BaseProblem

class SetCoverProblem(BaseProblem):
    """
    Set Cover Problem:
    Given a universe and a collection of sets (with costs), select sets to cover all elements.
    QUBO formulation uses cost terms and a penalty to enforce coverage.
    """
    def __init__(self, num_elements=5, num_sets=8, p_coverage=0.5, penalty=50, seed=123):
        self.num_elements = num_elements
        self.num_sets = num_sets
        self.penalty = penalty
        np.random.seed(seed)
        self.c = np.random.randint(1, 11, size=num_sets)
        self.M = (np.random.rand(num_elements, num_sets) < p_coverage).astype(int)
        self.Q, self.qubo_constant = self._build_qubo()
        
    def _build_qubo(self):
        m = self.num_sets
        n = self.num_elements
        P = self.penalty
        Q = np.zeros((m, m))
        constant = P * n
        for i in range(m):
            Q[i, i] = self.c[i] - P * np.sum(self.M[:, i])
        for i in range(m):
            for j in range(i+1, m):
                const = P * np.sum(self.M[:, i] * self.M[:, j])
                Q[i, j] = const
                Q[j, i] = const
        return Q, constant

    def evaluate_solution(self, solution) -> float:
        x = np.array(solution)
        return float(x.T @ self.Q @ x + self.qubo_constant)

    def random_solution(self):
        return np.random.randint(0, 2, self.num_sets).tolist()

    def get_qubo(self):
        return self.Q, self.qubo_constant`}
          />
          <h4 className="text-lg font-semibold">Step 2: Create the Problem Configuration</h4>
          <p>Create a file named <code>problem_config.json</code> with this content:</p>
          <CodeBlock
code={`{
  "entry_point": "set_cover:SetCoverProblem",
  "default_params": {
    "num_elements": 5,
    "num_sets": 8,
    "p_coverage": 0.5,
    "penalty": 50
  }
}`}
          />
          <h4 className="text-lg font-semibold">Step 3: Pushing to Rastion Hub</h4>
          <p>Use the Rastion CLI:</p>
          <CodeBlock
code={`# Create repository
rastion create_repo set-cover-problem --github-token <YOUR_GITHUB_TOKEN>

# Push your problem implementation
rastion push_problem set-cover-problem --file set_cover.py --config problem_config.json --github-token <YOUR_GITHUB_TOKEN>`}
          />
          <h4 className="text-lg font-semibold">Step 4: Testing</h4>
          <CodeBlock
code={`from rastion_hub.auto_problem import AutoProblem

problem = AutoProblem.from_repo("Rastion/set-cover-problem", revision="main")
print(problem.random_solution())
print(problem.evaluate_solution(problem.random_solution()))`}
          />
        </>
      )
    },
    logisticRegression: {
      title: "Guide: Creating a Rastion Problem – Logistic Regression",
      content: (
        <>
          <p>
            In this guide you’ll create a realistic continuous optimization problem—logistic regression.
            Given a dataset with features and binary labels, the task is to find a weight vector that minimizes
            the logistic loss with L2 regularization.
          </p>
          <h4 className="text-lg font-semibold">Step 1: Create the Python Module</h4>
          <p>Create a file named <code>logistic_regression.py</code> with the following content:</p>
          <CodeBlock
code={`import numpy as np
from rastion_hub.base_problem import BaseProblem

class LogisticRegressionProblem(BaseProblem):
    """
    Logistic Regression Problem:
    Find a weight vector w that minimizes the logistic loss with L2 regularization.
    Loss: (1/N)*sum(log(1+exp(-y*(X.w))) + reg*||w||^2
    """
    def __init__(self, X=None, y=None, reg=0.01, seed=123):
        np.random.seed(seed)
        if X is None or y is None:
            const N = 100, d = 5;
            X = np.random.randn(100, 5)
            const true_w = np.random.randn(5)
            const logits = X @ true_w
            y = np.where(logits > 0, 1, -1)
        self.X = np.array(X)
        self.y = np.array(y)
        self.reg = reg
        self.d = self.X.shape[1]
    
    def evaluate_solution(self, weights) -> float:
        weights = np.array(weights)
        const logits = self.X @ weights
        const losses = np.log(1 + np.exp(-this.y * logits))
        const loss = np.mean(losses) + self.reg * np.sum(weights**2)
        return float(loss)
    
    def random_solution(self):
        return np.random.randn(self.d).tolist()
    
    def get_qubo(self):
        throw new Error("LogisticRegressionProblem is not a QUBO problem.");`}
          />
          <h4 className="text-lg font-semibold">Step 2: Create the Problem Configuration</h4>
          <CodeBlock
code={`{
  "entry_point": "logistic_regression:LogisticRegressionProblem",
  "default_params": {
    "reg": 0.01
  }
}`}
          />
          <h4 className="text-lg font-semibold">Step 3: Pushing to Rastion Hub</h4>
          <CodeBlock
code={`# Create repository
rastion create_repo logistic-regression-problem --github-token <YOUR_GITHUB_TOKEN>

# Push your problem implementation
rastion push_problem logistic-regression-problem --file logistic_regression.py --config problem_config.json --github-token <YOUR_GITHUB_TOKEN>`}
          />
          <h4 className="text-lg font-semibold">Step 4: Testing</h4>
          <CodeBlock
code={`from rastion_hub.auto_problem import AutoProblem

problem = AutoProblem.from_repo("Rastion/logistic-regression-problem", revision="main")
print(problem.random_solution())
print(problem.evaluate_solution(problem.random_solution()))`}
          />
        </>
      )
    },
    leastSquares: {
      title: "Guide: Creating a Rastion Problem – Least Squares Regression",
      content: (
        <>
          <p>
            This guide explains how to set up a realistic continuous optimization problem for least squares regression.
            Given a dataset of features and target values, your task is to find a weight vector that minimizes
            the mean squared error (MSE).
          </p>
          <h4 className="text-lg font-semibold">Step 1: Create the Python Module</h4>
          <p>Create a file named <code>least_squares_regression.py</code> with the following content:</p>
          <CodeBlock
code={`import numpy as np
from rastion_hub.base_problem import BaseProblem

class LeastSquaresRegressionProblem(BaseProblem):
    """
    Least Squares Regression Problem:
    Find a weight vector w that minimizes the mean squared error on a dataset.
    """
    def __init__(self, X=None, y=None, seed=123):
        np.random.seed(seed)
        if (X == null || y == null) {
            const N = 100, d = 5;
            X = np.random.randn(100, 5)
            const true_w = np.random.randn(5)
            y = X @ true_w + 0.1 * np.random.randn(100)
        }
        this.X = np.array(X)
        this.y = np.array(y)
        this.d = this.X.shape[1]
    
    def evaluate_solution(self, weights) -> float:
        weights = np.array(weights)
        const predictions = this.X @ weights
        const mse = np.mean((this.y - predictions)**2)
        return float(mse)
    
    def random_solution(self):
        return np.random.randn(this.d).tolist()
    
    def get_qubo(self):
        throw new Error("LeastSquaresRegressionProblem is not a QUBO problem.");`}
          />
          <h4 className="text-lg font-semibold">Step 2: Create the Problem Configuration</h4>
          <CodeBlock
code={`{
  "entry_point": "least_squares_regression:LeastSquaresRegressionProblem",
  "default_params": {}
}`}
          />
          <h4 className="text-lg font-semibold">Step 3: Pushing to Rastion Hub</h4>
          <CodeBlock
code={`# Create repository
rastion create_repo least-squares-regression-problem --github-token <YOUR_GITHUB_TOKEN>

# Push your problem implementation
rastion push_problem least-squares-regression-problem --file least_squares_regression.py --config problem_config.json --github-token <YOUR_GITHUB_TOKEN>`}
          />
          <h4 className="text-lg font-semibold">Step 4: Testing</h4>
          <CodeBlock
code={`from rastion_hub.auto_problem import AutoProblem

problem = AutoProblem.from_repo("Rastion/least-squares-regression-problem", revision="main")
print(problem.random_solution())
print(problem.evaluate_solution(problem.random_solution()))`}
          />
        </>
      )
    }
  };

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Button variant="outline" onClick={() => setActiveGuide("minVertexCover")}>
          Minimum Vertex Cover
        </Button>
        <Button variant="outline" onClick={() => setActiveGuide("setCover")}>
          Set Cover
        </Button>
        <Button variant="outline" onClick={() => setActiveGuide("logisticRegression")}>
          Logistic Regression
        </Button>
        <Button variant="outline" onClick={() => setActiveGuide("leastSquares")}>
          Least Squares Regression
        </Button>
      </div>

      {activeGuide && (
        <GuideModal
          title={guides[activeGuide].title}
          content={guides[activeGuide].content}
          onClose={closeModal}
        />
      )}
    </div>
  );
};

export default ProblemGuidesSection;

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
        onClick={(e) => e.stopPropagation()}
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

type ContinuousGuideKey = "rosenbrock" | "rastrigin" | "ackley" | "himmelblau" | "logisticRegression" | "leastSquares";

const ContinuousProblemGuides: FC = () => {
  const [activeGuide, setActiveGuide] = useState<ContinuousGuideKey | null>(null);
  const closeModal = () => setActiveGuide(null);

  // Introduction text for continuous problems
  const introduction = (
    <div className="mb-6 space-y-3">
      <p>
        Below are examples of <strong>continuous optimization</strong> problems
        commonly used as benchmarks in numerical optimization. Each problem is
        defined by extending the <code>BaseProblem</code> class, providing:
      </p>
      <ul className="list-disc list-inside ml-4">
        <li>A function <code>evaluate_solution(solution)</code> to compute the cost or “fitness.”</li>
        <li>A method <code>random_solution()</code> generating initial guesses within specified bounds.</li>
        <li><code>get_qubo()</code> throws an error because these are <em>not</em> QUBO problems.</li>
      </ul>
      <p>
        For each problem, you’ll see how to build the Python module and
        <code>problem_config.json</code>, then push the code to Rastion using
        the CLI.
      </p>
      <p>
        Click any of the buttons below to open a detailed guide for that function.
      </p>
    </div>
  );

  // Content for each continuous problem guide
  const guides: Record<ContinuousGuideKey, { title: string; content: ReactNode }> = {
    rosenbrock: {
      title: "Guide: Creating a Rastion Problem – Rosenbrock Function",
      content: (
        <>
          <p>
            The <strong>Rosenbrock function</strong> is a classic test for
            gradient-based methods. It has a narrow, curved valley leading to the global minimum
            at x = [1, 1, ..., 1], f(x)=0.
          </p>
          <h4 className="text-lg font-semibold">Step 1: Python Module</h4>
          <p>
            Create a file named <code>rosenbrock.py</code>, implementing 
            <code>RosenbrockProblem</code>:
          </p>
          <div className="bg-gradient-to-br from-[#1A1F2C] to-[#221F26] p-6 rounded-lg shadow-xl">
            <CodeBlock
              code={`import numpy as np
from qubots.base_problem import BaseProblem

class RosenbrockProblem(BaseProblem):
    """
    Rosenbrock Function Problem:
    f(x) = sum_{i=1}^{n-1} [100*(x[i+1] - x[i]^2)^2 + (1 - x[i])^2]
    """
    def __init__(self, dim=2):
        self.dim = dim
        self.lower_bound = -2.0
        self.upper_bound = 2.0

    def evaluate_solution(self, solution) -> float:
        x = np.array(solution)
        total = 0
        for i in range(self.dim - 1):
            total += 100 * (x[i+1] - x[i]**2)**2 + (1 - x[i])**2
        return float(total)

    def random_solution(self):
        return np.random.uniform(self.lower_bound, self.upper_bound, self.dim).tolist()

    def get_qubo(self):
        raise NotImplementedError("RosenbrockProblem is a continuous problem.")`}
              language="python"
            />
          </div>
          <h4 className="text-lg font-semibold">Step 2: Configuration</h4>
          <p>
            In <code>problem_config.json</code>, provide the entry point and
            default parameters:
          </p>
          <div className="bg-gradient-to-br from-[#1A1F2C] to-[#221F26] p-6 rounded-lg shadow-xl">
            <CodeBlock
              code={`{
  "entry_point": "rosenbrock:RosenbrockProblem",
  "default_params": {
    "dim": 2
  }
}`}
              language="json"
            />
          </div>
          <h4 className="text-lg font-semibold">Step 3: Push to Rastion</h4>
          <div className="bg-gradient-to-br from-[#1A1F2C] to-[#221F26] p-6 rounded-lg shadow-xl">
            <CodeBlock
              code={`# Create repository
rastion create_repo rosenbrock-problem --github-token <YOUR_GITHUB_TOKEN>

# Push your files
rastion push_problem rosenbrock-problem --file rosenbrock.py --config problem_config.json --github-token <YOUR_GITHUB_TOKEN>`}
              language="bash"
            />
          </div>
        </>
      )
    },
    rastrigin: {
      title: "Guide: Creating a Rastion Problem – Rastrigin Function",
      content: (
        <>
          <p>
            The <strong>Rastrigin function</strong> is another popular benchmark
            with a large search space and many local minima, but a global minimum at x=0, f(x)=0.
          </p>
          <h4 className="text-lg font-semibold">Step 1: Python Module</h4>
          <p>
            Create <code>rastrigin.py</code>:
          </p>
          <CodeBlock
            code={`import numpy as np
from qubots.base_problem import BaseProblem

class RastriginProblem(BaseProblem):
    """
    Rastrigin Function:
    f(x) = 10*n + sum_{i=1}^n [x[i]^2 - 10*cos(2*pi*x[i])]
    """
    def __init__(self, dim=2):
        self.dim = dim
        self.lower_bound = -5.12
        self.upper_bound = 5.12

    def evaluate_solution(self, solution) -> float:
        x = np.array(solution)
        A = 10
        return float(A * self.dim + np.sum(x**2 - A * np.cos(2 * np.pi * x)))

    def random_solution(self):
        return np.random.uniform(self.lower_bound, self.upper_bound, self.dim).tolist()

    def get_qubo(self):
        raise NotImplementedError("RastriginProblem is a continuous problem.")`}
            language="python"
          />
          <h4 className="text-lg font-semibold">Step 2: Configuration</h4>
          <CodeBlock
            code={`{
  "entry_point": "rastrigin:RastriginProblem",
  "default_params": {
    "dim": 2
  }
}`}
            language="json"
          />
          <h4 className="text-lg font-semibold">Step 3: Push to Rastion</h4>
          <CodeBlock
            code={`# Create repository
rastion create_repo rastrigin-problem --github-token <YOUR_GITHUB_TOKEN>

# Push your implementation
rastion push_problem rastrigin-problem --file rastrigin.py --config problem_config.json --github-token <YOUR_GITHUB_TOKEN>`}
            language="bash"
          />
        </>
      )
    },
    ackley: {
      title: "Guide: Creating a Rastion Problem – Ackley Function",
      content: (
        <>
          <p>
            The <strong>Ackley function</strong> is known for its large search
            space and a nearly flat outer region, making it a good test for
            gradient-based and population-based optimizers.
          </p>
          <h4 className="text-lg font-semibold">Step 1: Python Module</h4>
          <p>
            Create <code>ackley.py</code>:
          </p>
          <CodeBlock
            code={`import numpy as np
from qubots.base_problem import BaseProblem

class AckleyProblem(BaseProblem):
    """
    Ackley Function:
    f(x) = -20 * exp(-0.2 * sqrt((1/n)*sum(x[i]^2))) - exp((1/n)*sum(cos(2*pi*x[i]))) + 20 + e
    """
    def __init__(self, dim=2):
        self.dim = dim
        self.lower_bound = -32.768
        self.upper_bound = 32.768

    def evaluate_solution(self, solution) -> float:
        x = np.array(solution)
        n = self.dim
        term1 = -20 * np.exp(-0.2 * np.sqrt(np.sum(x**2) / n))
        term2 = -np.exp(np.sum(np.cos(2 * np.pi * x)) / n)
        return float(term1 + term2 + 20 + np.e)

    def random_solution(self):
        return np.random.uniform(self.lower_bound, self.upper_bound, self.dim).tolist()

    def get_qubo(self):
        raise NotImplementedError("AckleyProblem is a continuous problem.")`}
            language="python"
          />
          <h4 className="text-lg font-semibold">Step 2: Configuration</h4>
          <CodeBlock
            code={`{
  "entry_point": "ackley:AckleyProblem",
  "default_params": {
    "dim": 2
  }
}`}
            language="json"
          />
          <h4 className="text-lg font-semibold">Step 3: Push to Rastion</h4>
          <CodeBlock
            code={`# Create repository
rastion create_repo ackley-problem --github-token <YOUR_GITHUB_TOKEN>

# Push your implementation
rastion push_problem ackley-problem --file ackley.py --config problem_config.json --github-token <YOUR_GITHUB_TOKEN>`}
            language="bash"
          />
        </>
      )
    },
    himmelblau: {
      title: "Guide: Creating a Rastion Problem – Himmelblau Function",
      content: (
        <>
          <p>
            The <strong>Himmelblau function</strong> has multiple global minima, making it interesting 
            for testing algorithms that may get stuck in local minima.
          </p>
          <h4 className="text-lg font-semibold">Step 1: Python Module</h4>
          <p>
            Create <code>himmelblau.py</code>:
          </p>
          <CodeBlock
            code={`import numpy as np
from qubots.base_problem import BaseProblem

class HimmelblauProblem(BaseProblem):
    """
    Himmelblau Function:
    f(x, y) = (x^2 + y - 11)^2 + (x + y^2 - 7)^2
    """
    def __init__(self, dim=2):
        self.dim = 2  # Specifically a 2D function
        self.lower_bound = -5.0
        self.upper_bound = 5.0

    def evaluate_solution(self, solution) -> float:
        x, y = solution[0], solution[1]
        return float((x**2 + y - 11)**2 + (x + y**2 - 7)**2)

    def random_solution(self):
        return np.random.uniform(self.lower_bound, self.upper_bound, self.dim).tolist()

    def get_qubo(self):
        raise NotImplementedError("HimmelblauProblem is a continuous problem.")`}
            language="python"
          />
          <h4 className="text-lg font-semibold">Step 2: Configuration</h4>
          <CodeBlock
            code={`{
  "entry_point": "himmelblau:HimmelblauProblem",
  "default_params": {
    "dim": 2
  }
}`}
            language="json"
          />
          <h4 className="text-lg font-semibold">Step 3: Push to Rastion</h4>
          <CodeBlock
            code={`# Create repository
rastion create_repo himmelblau-problem --github-token <YOUR_GITHUB_TOKEN>

# Push your files
rastion push_problem himmelblau-problem --file himmelblau.py --config problem_config.json --github-token <YOUR_GITHUB_TOKEN>`}
            language="bash"
          />
        </>
      )
    },
    logisticRegression: {
      title: "Guide: Creating a Rastion Problem – Logistic Regression",
      content: (
        <>
          <p>
            <em>Logistic Regression</em> is a continuous optimization problem
            (non-QUBO). You’ll define a custom <code>evaluate_solution</code> for
            the logistic loss function.
          </p>

          <h4 className="text-lg font-semibold">Step 1: Create the Python Module</h4>
          <p>
            In <code>logistic_regression.py</code>, implement{" "}
            <code>LogisticRegressionProblem</code>:
          </p>
          <CodeBlock
            code={`import numpy as np
from qubots.base_problem import BaseProblem

class LogisticRegressionProblem(BaseProblem):
    """
    Logistic Regression:
    Minimizes the logistic loss with L2 regularization.
    """
    def __init__(self, X=None, y=None, reg=0.01, seed=123):
        np.random.seed(seed)
        # Generate synthetic data if none provided
        if X is None or y is None:
            N, d = 100, 5
            X = np.random.randn(N, d)
            true_w = np.random.randn(d)
            logits = X @ true_w
            y = np.where(logits > 0, 1, -1)

        self.X = np.array(X)
        self.y = np.array(y)
        self.reg = reg
        self.d = self.X.shape[1]
    
    def evaluate_solution(self, weights) -> float:
        w = np.array(weights)
        logits = self.X @ w
        losses = np.log(1 + np.exp(-self.y * logits))
        loss = np.mean(losses) + self.reg * np.sum(w ** 2)
        return float(loss)
    
    def random_solution(self):
        return np.random.randn(self.d).tolist()
    
    def get_qubo(self):
        raise NotImplementedError("LogisticRegressionProblem is not a QUBO problem.")`}
          />

          <h4 className="text-lg font-semibold">Step 2: Configuration</h4>
          <CodeBlock
            code={`{
  "entry_point": "logistic_regression:LogisticRegressionProblem",
  "default_params": {
    "reg": 0.01
  }
}`}
          />

          <h4 className="text-lg font-semibold">Step 3: Pushing to Rastion</h4>
          <CodeBlock
            code={`rastion create_repo logistic-regression-problem
rastion push_problem logistic-regression-problem --source PATH_TO_MY_LOCAL_FOLDER`}
          />

          <h4 className="text-lg font-semibold">Step 4: Testing</h4>
          <CodeBlock
            code={`from qubots.auto_problem import AutoProblem

problem = AutoProblem.from_repo("Rastion/logistic-regression-problem")
print(problem.random_solution())
print(problem.evaluate_solution(problem.random_solution()))`}
          />
        </>
      ),
    },
    leastSquares: {
      title: "Guide: Creating a Rastion Problem – Least Squares Regression",
      content: (
        <>
          <p>
            <em>Least Squares Regression</em> is another continuous optimization
            problem. Here, we aim to minimize Mean Squared Error (MSE).
          </p>

          <h4 className="text-lg font-semibold">Step 1: Create the Python Module</h4>
          <p>
            In <code>least_squares_regression.py</code>, define{" "}
            <code>LeastSquaresRegressionProblem</code>:
          </p>
          <CodeBlock
            code={`import numpy as np
from qubots.base_problem import BaseProblem

class LeastSquaresRegressionProblem(BaseProblem):
    """
    Least Squares Regression Problem:
    Find a weight vector w to minimize mean squared error (MSE).
    """
    def __init__(self, X=None, y=None, seed=123):
        np.random.seed(seed)
        if X is None or y is None:
            # Generate synthetic data if not provided
            N, d = 100, 5
            X = np.random.randn(N, d)
            true_w = np.random.randn(d)
            y = X @ true_w + 0.1 * np.random.randn(N)

        self.X = np.array(X)
        self.y = np.array(y)
        self.d = self.X.shape[1]
    
    def evaluate_solution(self, weights) -> float:
        w = np.array(weights)
        predictions = self.X @ w
        mse = np.mean((self.y - predictions) ** 2)
        return float(mse)
    
    def random_solution(self):
        return np.random.randn(self.d).tolist()
    
    def get_qubo(self):
        raise NotImplementedError("LeastSquaresRegressionProblem is not a QUBO problem.")`}
          />

          <h4 className="text-lg font-semibold">Step 2: Configuration</h4>
          <CodeBlock
            code={`{
  "entry_point": "least_squares_regression:LeastSquaresRegressionProblem",
  "default_params": {}
}`}
          />

          <h4 className="text-lg font-semibold">Step 3: Push to Rastion</h4>
          <CodeBlock
            code={`rastion create_repo least-squares-regression-problem
rastion push_problem least-squares-regression-problem --source PATH_TO_MY_LOCAL_FOLDER`}
          />

          <h4 className="text-lg font-semibold">Step 4: Testing</h4>
          <CodeBlock
            code={`from qubots.auto_problem import AutoProblem

problem = AutoProblem.from_repo("Rastion/least-squares-regression-problem")
print(problem.random_solution())
print(problem.evaluate_solution(problem.random_solution()))`}
          />
        </>
      ),
    },
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4 text-github-gray">
        Continuous Problem Guides
      </h2>
      {introduction}

      {/* Buttons for each guide */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Button variant="outline" onClick={() => setActiveGuide("rosenbrock")}>
          Rosenbrock Function
        </Button>
        <Button variant="outline" onClick={() => setActiveGuide("rastrigin")}>
          Rastrigin Function
        </Button>
        <Button variant="outline" onClick={() => setActiveGuide("ackley")}>
          Ackley Function
        </Button>
        <Button variant="outline" onClick={() => setActiveGuide("himmelblau")}>
          Himmelblau Function
        </Button>
        <Button variant="outline" onClick={() => setActiveGuide("logisticRegression")}>
          Logistic Regression
        </Button>
        <Button variant="outline" onClick={() => setActiveGuide("leastSquares")}>
          Least Squares
        </Button>
      </div>

      {/* Modal for displaying the selected guide */}
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

export default ContinuousProblemGuides;

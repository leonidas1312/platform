// src/components/ContinuousProblemGuides.tsx
import React, { useState, FC, ReactNode } from "react";
import { Button } from "@/components/ui/button";

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

type ContinuousGuideKey = "rosenbrock" | "rastrigin" | "ackley" | "himmelblau";

const ContinuousProblemGuides: FC = () => {
  const [activeGuide, setActiveGuide] = useState<ContinuousGuideKey | null>(null);
  const closeModal = () => setActiveGuide(null);

  const guides: Record<ContinuousGuideKey, { title: string; content: ReactNode }> = {
    rosenbrock: {
      title: "Guide: Creating a Rastion Problem – Rosenbrock Function",
      content: (
        <>
          <p>
            This guide shows how to implement the Rosenbrock function as a continuous optimization problem.
            The function is defined as:
            <br /><code>f(x) = sum_(i=1)^(n-1)[100*(x[i+1]-x[i]**2)**2 + (1-x[i])**2]</code>
          </p>
          <h4 className="text-lg font-semibold">Step 1: Create the Python Module</h4>
          <p>Create a file named <code>rosenbrock.py</code> with the following content:</p>
          <pre className="bg-[#1E1E1E] p-4 rounded overflow-x-auto font-code text-[#9b87f5]">
{`import numpy as np
from rastion_hub.base_problem import BaseProblem

class RosenbrockProblem(BaseProblem):
    """
    Rosenbrock Function Problem:
      f(x) = sum_{i=1}^{n-1}[100*(x[i+1]-x[i]**2)**2 + (1-x[i])**2]
    Global minimum at x = [1,1,...,1] with f(x)=0.
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
          </pre>
          <h4 className="text-lg font-semibold">Step 2: Create the Problem Configuration</h4>
          <pre className="bg-[#1E1E1E] p-4 rounded overflow-x-auto font-code text-[#9b87f5]">
{`{
  "entry_point": "rosenbrock:RosenbrockProblem",
  "default_params": {
    "dim": 2
  }
}`}
          </pre>
          <h4 className="text-lg font-semibold">Step 3: Pushing to Rastion Hub</h4>
          <pre className="bg-[#1E1E1E] p-4 rounded overflow-x-auto font-code text-[#9b87f5]">
{`# Create repository
rastion create_repo rosenbrock-problem --github-token <YOUR_GITHUB_TOKEN>

# Push your problem implementation
rastion push_problem rosenbrock-problem --file rosenbrock.py --config problem_config.json --github-token <YOUR_GITHUB_TOKEN>`}
          </pre>
        </>
      )
    },
    rastrigin: {
      title: "Guide: Creating a Rastion Problem – Rastrigin Function",
      content: (
        <>
          <p>
            This guide explains how to implement the Rastrigin function as a continuous optimization problem.
            The function is defined as:
            <br /><code>f(x) = 10*n + sum_(i=1)^n [x[i]^2 - 10*cos(2*pi*x[i])]</code>
          </p>
          <h4 className="text-lg font-semibold">Step 1: Create the Python Module</h4>
          <p>Create a file named <code>rastrigin.py</code> with the following content:</p>
          <pre className="bg-[#1E1E1E] p-4 rounded overflow-x-auto font-code text-[#9b87f5]">
{`import numpy as np
from rastion_hub.base_problem import BaseProblem

class RastriginProblem(BaseProblem):
    """
    Rastrigin Function Problem:
      f(x) = 10*n + sum_{i=1}^n [x[i]^2 - 10*cos(2*pi*x[i])]
    Global minimum at x = [0,...,0] with f(x)=0.
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
          </pre>
          <h4 className="text-lg font-semibold">Step 2: Create the Problem Configuration</h4>
          <pre className="bg-[#1E1E1E] p-4 rounded overflow-x-auto font-code text-[#9b87f5]">
{`{
  "entry_point": "rastrigin:RastriginProblem",
  "default_params": {
    "dim": 2
  }
}`}
          </pre>
          <h4 className="text-lg font-semibold">Step 3: Pushing to Rastion Hub</h4>
          <pre className="bg-[#1E1E1E] p-4 rounded overflow-x-auto font-code text-[#9b87f5]">
{`# Create repository
rastion create_repo rastrigin-problem --github-token <YOUR_GITHUB_TOKEN>

# Push your problem implementation
rastion push_problem rastrigin-problem --file rastrigin.py --config problem_config.json --github-token <YOUR_GITHUB_TOKEN>`}
          </pre>
        </>
      )
    },
    ackley: {
      title: "Guide: Creating a Rastion Problem – Ackley Function",
      content: (
        <>
          <p>
            This guide explains how to implement the Ackley function as a continuous optimization problem.
            The Ackley function is defined as:
            <br /><code>f(x) = -20*exp(-0.2*sqrt((1/n)*sum(x[i]^2))) - exp((1/n)*sum(cos(2*pi*x[i]))) + 20 + e</code>
          </p>
          <h4 className="text-lg font-semibold">Step 1: Create the Python Module</h4>
          <p>Create a file named <code>ackley.py</code> with the following content:</p>
          <pre className="bg-[#1E1E1E] p-4 rounded overflow-x-auto font-code text-[#9b87f5]">
{`import numpy as np
from rastion_hub.base_problem import BaseProblem

class AckleyProblem(BaseProblem):
    """
    Ackley Function Problem:
      f(x) = -20*exp(-0.2*sqrt((1/n)*sum(x[i]^2))) - exp((1/n)*sum(cos(2*pi*x[i]))) + 20 + e
    Global minimum at x = [0,...,0] with f(x)=0.
    """
    def __init__(self, dim=2):
        self.dim = dim
        self.lower_bound = -32.768
        self.upper_bound = 32.768

    def evaluate_solution(self, solution) -> float:
        x = np.array(solution)
        n = self.dim
        term1 = -20 * np.exp(-0.2 * np.sqrt(np.sum(x**2)/n))
        term2 = -np.exp(np.sum(np.cos(2 * np.pi * x))/n)
        return float(term1 + term2 + 20 + np.e)

    def random_solution(self):
        return np.random.uniform(self.lower_bound, self.upper_bound, self.dim).tolist()

    def get_qubo(self):
        raise NotImplementedError("AckleyProblem is a continuous problem.")`}
          </pre>
          <h4 className="text-lg font-semibold">Step 2: Create the Problem Configuration</h4>
          <pre className="bg-[#1E1E1E] p-4 rounded overflow-x-auto font-code text-[#9b87f5]">
{`{
  "entry_point": "ackley:AckleyProblem",
  "default_params": {
    "dim": 2
  }
}`}
          </pre>
          <h4 className="text-lg font-semibold">Step 3: Pushing to Rastion Hub</h4>
          <pre className="bg-[#1E1E1E] p-4 rounded overflow-x-auto font-code text-[#9b87f5]">
{`# Create repository
rastion create_repo ackley-problem --github-token <YOUR_GITHUB_TOKEN>

# Push your problem implementation
rastion push_problem ackley-problem --file ackley.py --config problem_config.json --github-token <YOUR_GITHUB_TOKEN>`}
          </pre>
        </>
      )
    },
    himmelblau: {
      title: "Guide: Creating a Rastion Problem – Himmelblau Function",
      content: (
        <>
          <p>
            This guide explains how to implement the Himmelblau function as a continuous optimization problem.
            The function is defined as:
            <br /><code>f(x, y) = (x^2 + y - 11)^2 + (x + y^2 - 7)^2</code>
          </p>
          <h4 className="text-lg font-semibold">Step 1: Create the Python Module</h4>
          <p>Create a file named <code>himmelblau.py</code> with the following content:</p>
          <pre className="bg-[#1E1E1E] p-4 rounded overflow-x-auto font-code text-[#9b87f5]">
{`import numpy as np
from rastion_hub.base_problem import BaseProblem

class HimmelblauProblem(BaseProblem):
    """
    Himmelblau Function Problem:
      f(x, y) = (x^2 + y - 11)^2 + (x + y^2 - 7)^2.
    Global minima occur at several points; one example is (3, 2) with f(x,y)=0.
    """
    def __init__(self, dim=2):
        self.dim = 2  // Himmelblau is defined for 2D.
        self.lower_bound = -5.0
        self.upper_bound = 5.0

    def evaluate_solution(self, solution) -> float:
        x, y = solution[0], solution[1]
        return float((x**2 + y - 11)**2 + (x + y**2 - 7)**2)

    def random_solution(self):
        return np.random.uniform(self.lower_bound, self.upper_bound, self.dim).tolist()

    def get_qubo(self):
        raise NotImplementedError("HimmelblauProblem is a continuous problem.")`}
          </pre>
          <h4 className="text-lg font-semibold">Step 2: Create the Problem Configuration</h4>
          <pre className="bg-[#1E1E1E] p-4 rounded overflow-x-auto font-code text-[#9b87f5]">
{`{
  "entry_point": "himmelblau:HimmelblauProblem",
  "default_params": {
    "dim": 2
  }
}`}
          </pre>
          <h4 className="text-lg font-semibold">Step 3: Pushing to Rastion Hub</h4>
          <pre className="bg-[#1E1E1E] p-4 rounded overflow-x-auto font-code text-[#9b87f5]">
{`# Create repository
rastion create_repo himmelblau-problem --github-token <YOUR_GITHUB_TOKEN>

# Push your problem implementation
rastion push_problem himmelblau-problem --file himmelblau.py --config problem_config.json --github-token <YOUR_GITHUB_TOKEN>`}
          </pre>
        </>
      )
    }
  };

  return (
    <div>
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

export default ContinuousProblemGuides;

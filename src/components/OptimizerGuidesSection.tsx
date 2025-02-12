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

type GuideKey = "simulatedAnnealing" | "adam" | "sgd" | "rmsprop";

const OptimizerGuidesSection: FC = () => {
  const [activeGuide, setActiveGuide] = useState<GuideKey | null>(null);
  const closeModal = () => setActiveGuide(null);

  const guides: Record<GuideKey, { title: string; content: ReactNode }> = {
    simulatedAnnealing: {
      title: "Guide: Creating a Rastion Optimizer – Simulated Annealing",
      content: (
        <>
          <p>
            This guide walks you through creating a simulated annealing optimizer for Rastion Hub.
            Simulated annealing explores the solution space by accepting both better and (with a decreasing probability) worse solutions.
          </p>
          <h4 className="text-lg font-semibold">Step 1: Create the Python Module</h4>
          <p>Create a file named <code>simulated_annealing_optimizer.py</code> with the following content:</p>
          <div className="bg-gradient-to-br from-[#1A1F2C] to-[#221F26] p-6 rounded-lg shadow-xl">
            <CodeBlock
              code={`import numpy as np
from math import exp
from rastion_hub.base_optimizer import BaseOptimizer

class SimulatedAnnealingOptimizer(BaseOptimizer):
    """
    Simulated Annealing Optimizer:
    Perturbs a candidate solution and accepts worse solutions with a probability
    that decreases over time (temperature).
    """
    def __init__(self, max_iters=500, initial_temp=100.0, cooling_rate=0.95, verbose=False):
        self.max_iters = max_iters
        self.initial_temp = initial_temp
        self.cooling_rate = cooling_rate
        self.verbose = verbose

    def optimize(self, problem, initial_solution=None, **kwargs):
        if initial_solution is None:
            current_solution = np.array(problem.random_solution(), dtype=float)
        else:
            current_solution = np.array(initial_solution, dtype=float)
        current_cost = problem.evaluate_solution(current_solution)
        best_solution = current_solution.copy()
        best_cost = current_cost
        temp = self.initial_temp

        for i in range(self.max_iters):
            candidate = current_solution.copy()
            idx = np.random.randint(len(candidate))
            # For binary solutions, flip the bit; for continuous, add a small perturbation.
            candidate[idx] = 1 - candidate[idx] if candidate[idx] in [0,1] else candidate[idx] + np.random.randn() * 0.1
            candidate_cost = problem.evaluate_solution(candidate)
            delta = candidate_cost - current_cost
            if delta < 0 or exp(-delta / temp) > np.random.rand():
                current_solution = candidate
                current_cost = candidate_cost
                if current_cost < best_cost:
                    best_solution = current_solution.copy()
                    best_cost = current_cost
            temp *= self.cooling_rate
            if self.verbose:
                print(f"Iteration {i}: Cost = {current_cost}, Best = {best_cost}")
        return best_solution.tolist(), best_cost`}
              language="python"
            />
          </div>
          <h4 className="text-lg font-semibold">Step 2: Create the Optimizer Configuration</h4>
          <div className="bg-gradient-to-br from-[#1A1F2C] to-[#221F26] p-6 rounded-lg shadow-xl">
            <CodeBlock
              code={`{
  "entry_point": "simulated_annealing_optimizer:SimulatedAnnealingOptimizer",
  "default_params": {
    "max_iters": 500,
    "initial_temp": 100.0,
    "cooling_rate": 0.95,
    "verbose": false
  }
}`}
              language="json"
            />
          </div>
          <h4 className="text-lg font-semibold">Step 3: Pushing to Rastion Hub</h4>
          <div className="bg-gradient-to-br from-[#1A1F2C] to-[#221F26] p-6 rounded-lg shadow-xl">
            <CodeBlock
              code={`# Create repository
rastion create_repo simulated-annealing-optimizer --github-token <YOUR_GITHUB_TOKEN>

# Push your optimizer implementation
rastion push_solver simulated-annealing-optimizer --file simulated_annealing_optimizer.py --config solver_config.json --github-token <YOUR_GITHUB_TOKEN>`}
              language="bash"
            />
          </div>
        </>
      )
    },
    adam: {
      title: "Guide: Creating a Rastion Optimizer – PyTorch Adam",
      content: (
        <>
          <p>
            This guide shows you how to create an optimizer using PyTorch's Adam optimizer.
            It converts the problem’s initial solution to a tensor and iteratively optimizes it.
          </p>
          <h4 className="text-lg font-semibold">Step 1: Create the Python Module</h4>
          <p>Create a file named <code>adam_optimizer.py</code> with the following content:</p>
          <CodeBlock
code={`import torch
import numpy as np
from rastion_hub.base_optimizer import BaseOptimizer

class AdamOptimizer(BaseOptimizer):
    """
    PyTorch Adam Optimizer:
    Uses torch.optim.Adam to optimize continuous solutions.
    """
    def __init__(self, max_iters=1000, lr=0.01, verbose=False):
        self.max_iters = max_iters
        self.lr = lr
        self.verbose = verbose

    def optimize(self, problem, initial_solution=None, **kwargs):
        if initial_solution is None:
            x0 = np.array(problem.random_solution(), dtype=np.float32)
        else:
            x0 = np.array(initial_solution, dtype=np.float32)
        w = torch.tensor(x0, dtype=torch.float32, requires_grad=True)
        optimizer = torch.optim.Adam([w], lr=self.lr)
        best_loss = float('inf')
        best_solution = None
        for i in range(self.max_iters):
            optimizer.zero_grad()
            # Evaluate loss using problem.evaluate_solution; note that this function may not be differentiable.
            loss_value = problem.evaluate_solution(w.detach().numpy())
            loss = torch.tensor(loss_value, dtype=torch.float32, requires_grad=True)
            loss.backward()
            optimizer.step()
            if loss.item() < best_loss:
                best_loss = loss.item()
                best_solution = w.detach().numpy().tolist()
            if self.verbose:
                print(f"Iteration {i}: Loss = {loss.item()}")
        return best_solution, best_loss`}
          />
          <h4 className="text-lg font-semibold">Step 2: Create the Optimizer Configuration</h4>
          <p>Create a file named <code>solver_config.json</code> with this content:</p>
          <CodeBlock
code={`{
  "entry_point": "adam_optimizer:AdamOptimizer",
  "default_params": {
    "max_iters": 1000,
    "lr": 0.01,
    "verbose": false
  }
}`}
          />
          <h4 className="text-lg font-semibold">Step 3: Pushing to Rastion Hub</h4>
          <p>Use the Rastion CLI to create and push your repository:</p>
          <CodeBlock
code={`# Create repository
rastion create_repo adam-optimizer --github-token <YOUR_GITHUB_TOKEN>

# Push your optimizer implementation
rastion push_solver adam-optimizer --file adam_optimizer.py --config solver_config.json --github-token <YOUR_GITHUB_TOKEN>`}
          />
        </>
      )
    },
    sgd: {
      title: "Guide: Creating a Rastion Optimizer – PyTorch SGD",
      content: (
        <>
          <p>
            This guide demonstrates how to build an optimizer using PyTorch's SGD.
            It follows a similar approach to the Adam optimizer but uses SGD.
          </p>
          <h4 className="text-lg font-semibold">Step 1: Create the Python Module</h4>
          <p>Create a file named <code>sgd_optimizer.py</code> with the following content:</p>
          <CodeBlock
code={`import torch
import numpy as np
from rastion_hub.base_optimizer import BaseOptimizer

class SGDOptimizer(BaseOptimizer):
    """
    PyTorch SGD Optimizer:
    Uses torch.optim.SGD to optimize continuous solutions.
    """
    def __init__(self, max_iters=1000, lr=0.01, verbose=False):
        self.max_iters = max_iters
        self.lr = lr
        self.verbose = verbose

    def optimize(self, problem, initial_solution=None, **kwargs):
        if initial_solution is None:
            x0 = np.array(problem.random_solution(), dtype=np.float32)
        else:
            x0 = np.array(initial_solution, dtype=np.float32)
        w = torch.tensor(x0, dtype=torch.float32, requires_grad=True)
        optimizer = torch.optim.SGD([w], lr=self.lr)
        best_loss = float('inf')
        best_solution = None
        for i in range(self.max_iters):
            optimizer.zero_grad()
            loss_value = problem.evaluate_solution(w.detach().numpy())
            loss = torch.tensor(loss_value, dtype=torch.float32, requires_grad=True)
            loss.backward()
            optimizer.step()
            if loss.item() < best_loss:
                best_loss = loss.item()
                best_solution = w.detach().numpy().tolist()
            if self.verbose:
                print(f"Iteration {i}: Loss = {loss.item()}")
        return best_solution, best_loss`}
          />
          <h4 className="text-lg font-semibold">Step 2: Create the Optimizer Configuration</h4>
          <p>Create a file named <code>solver_config.json</code> with this content:</p>
          <CodeBlock
code={`{
  "entry_point": "sgd_optimizer:SGDOptimizer",
  "default_params": {
    "max_iters": 1000,
    "lr": 0.01,
    "verbose": false
  }
}`}
          />
          <h4 className="text-lg font-semibold">Step 3: Pushing to Rastion Hub</h4>
          <p>Use the Rastion CLI to create and push your repository:</p>
          <CodeBlock
code={`# Create repository
rastion create_repo sgd-optimizer --github-token <YOUR_GITHUB_TOKEN>

# Push your optimizer implementation
rastion push_solver sgd-optimizer --file sgd_optimizer.py --config solver_config.json --github-token <YOUR_GITHUB_TOKEN>`}
          />
        </>
      )
    },
    rmsprop: {
      title: "Guide: Creating a Rastion Optimizer – PyTorch RMSProp",
      content: (
        <>
          <p>
            This guide explains how to build an optimizer using PyTorch's RMSProp optimizer.
            It uses torch.optim.RMSprop to optimize continuous solutions.
          </p>
          <h4 className="text-lg font-semibold">Step 1: Create the Python Module</h4>
          <p>Create a file named <code>rmsprop_optimizer.py</code> with the following content:</p>
          <CodeBlock
code={`import torch
import numpy as np
from rastion_hub.base_optimizer import BaseOptimizer

class RMSPropOptimizer(BaseOptimizer):
    """
    PyTorch RMSProp Optimizer:
    Uses torch.optim.RMSprop to optimize continuous solutions.
    """
    def __init__(self, max_iters=1000, lr=0.01, alpha=0.99, verbose=False):
        self.max_iters = max_iters
        self.lr = lr
        self.alpha = alpha
        self.verbose = verbose

    def optimize(self, problem, initial_solution=None, **kwargs):
        if initial_solution is None:
            x0 = np.array(problem.random_solution(), dtype=np.float32)
        else:
            x0 = np.array(initial_solution, dtype=np.float32)
        w = torch.tensor(x0, dtype=torch.float32, requires_grad=True)
        optimizer = torch.optim.RMSprop([w], lr=self.lr, alpha=self.alpha)
        best_loss = float('inf')
        best_solution = None
        for i in range(self.max_iters):
            optimizer.zero_grad()
            loss_value = problem.evaluate_solution(w.detach().numpy())
            loss = torch.tensor(loss_value, dtype=torch.float32, requires_grad=True)
            loss.backward()
            optimizer.step()
            if loss.item() < best_loss:
                best_loss = loss.item()
                best_solution = w.detach().numpy().tolist()
            if self.verbose:
                print(f"Iteration {i}: Loss = {loss.item()}")
        return best_solution, best_loss`}
          />
          <h4 className="text-lg font-semibold">Step 2: Create the Optimizer Configuration</h4>
          <p>Create a file named <code>solver_config.json</code> with this content:</p>
          <CodeBlock
code={`{
  "entry_point": "rmsprop_optimizer:RMSPropOptimizer",
  "default_params": {
    "max_iters": 1000,
    "lr": 0.01,
    "alpha": 0.99,
    "verbose": false
  }
}`}
          />
          <h4 className="text-lg font-semibold">Step 3: Pushing to Rastion Hub</h4>
          <p>Use the Rastion CLI to create and push your repository:</p>
          <CodeBlock
code={`# Create repository
rastion create_repo rmsprop-optimizer --github-token <YOUR_GITHUB_TOKEN>

# Push your optimizer implementation
rastion push_solver rmsprop-optimizer --file rmsprop_optimizer.py --config solver_config.json --github-token <YOUR_GITHUB_TOKEN>`}
          />
        </>
      )
    }
  };

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Button variant="outline" onClick={() => setActiveGuide("simulatedAnnealing")}>
          Simulated Annealing
        </Button>
        <Button variant="outline" onClick={() => setActiveGuide("adam")}>
          PyTorch Adam
        </Button>
        <Button variant="outline" onClick={() => setActiveGuide("sgd")}>
          PyTorch SGD
        </Button>
        <Button variant="outline" onClick={() => setActiveGuide("rmsprop")}>
          PyTorch RMSProp
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

export default OptimizerGuidesSection;

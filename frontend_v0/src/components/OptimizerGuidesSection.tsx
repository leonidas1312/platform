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

  // Introductory text and instructions for building optimizers
  const introduction = (
    <div className="mb-6 space-y-3">
      <p>
        Below are examples of how to create various <strong>Rastion optimizers</strong>:
        from a classical <em>Simulated Annealing</em> approach to several 
        <em>PyTorch-based</em> optimizers (<strong>Adam</strong>, <strong>SGD</strong>, 
        and <strong>RMSProp</strong>). Each optimizer extends the{" "}
        <code>BaseOptimizer</code> interface, ensuring compatibility with all Rastion 
        and Qubots problems.
      </p>
      <ul className="list-disc list-inside ml-4">
        <li>
          <strong>Python Module:</strong> Showcases the optimizer class (logic and parameters).
        </li>
        <li>
          <strong>Configuration:</strong> A <code>solver_config.json</code> file 
          specifying the <code>entry_point</code> and default parameters.
        </li>
        <li>
          <strong>Pushing to Rastion:</strong> Use <code>rastion create_repo</code> 
          and <code>push_solver</code> commands to publish your optimizer.
        </li>
      </ul>
      <p>
        Choose one of the guides below to see a fully working example of how to implement,
        configure, and share an optimizer in the Rastion ecosystem.
      </p>
    </div>
  );

  // Guides for each example optimizer
  const guides: Record<GuideKey, { title: string; content: ReactNode }> = {
    simulatedAnnealing: {
      title: "Guide: Creating a Rastion Optimizer – Simulated Annealing",
      content: (
        <>
          <p>
            <em>Simulated Annealing</em> explores the solution space by occasionally
            accepting worse solutions with a probability that decreases over time
            (the “temperature”). This makes it suitable for both binary and continuous
            problems, with a small modification in how we “perturb” the candidate solution.
          </p>

          <h4 className="text-lg font-semibold">Step 1: Python Module</h4>
          <p>
            Create a file named <code>simulated_annealing_optimizer.py</code>, extending 
            <code>BaseOptimizer</code>:
          </p>
          <div className="bg-gradient-to-br from-[#1A1F2C] to-[#221F26] p-6 rounded-lg shadow-xl">
            <CodeBlock
              code={`import numpy as np
from math import exp
from qubots.base_optimizer import BaseOptimizer

class SimulatedAnnealingOptimizer(BaseOptimizer):
    """
    Simulated Annealing Optimizer:
    Perturbs a candidate solution and accepts worse solutions with a probability
    decreasing over time (temperature).
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
            # For binary solutions, flip the bit; for continuous, add a small perturbation
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
            />
          </div>

          <h4 className="text-lg font-semibold">Step 2: Configuration</h4>
          <p>
            Create a <code>solver_config.json</code> referencing the above 
            <code>SimulatedAnnealingOptimizer</code>:
          </p>
          <div className="bg-gradient-to-br from-[#1A1F2C] to-[#221F26] p-6 rounded-lg shadow-xl">
            <CodeBlock
              language="json"
              code={`{
  "entry_point": "simulated_annealing_optimizer:SimulatedAnnealingOptimizer",
  "default_params": {
    "max_iters": 500,
    "initial_temp": 100.0,
    "cooling_rate": 0.95,
    "verbose": false
  }
}`}
            />
          </div>

          <h4 className="text-lg font-semibold">Step 3: Pushing to Rastion</h4>
          <div className="bg-gradient-to-br from-[#1A1F2C] to-[#221F26] p-6 rounded-lg shadow-xl">
            <CodeBlock
              language="bash"
              code={`# Create repository for your optimizer
rastion create_repo simulated-annealing-optimizer

# Push your optimizer implementation
rastion push_solver simulated-annealing-optimizer --source MY_LOCAL_FOLDER_PATH_WITH_FILES`}
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
            This guide shows how to adapt PyTorch’s <em>Adam</em> to the
            Rastion ecosystem. Adam is a popular optimizer for continuous
            problems (though it can be adapted for discrete variables with custom logic).
          </p>

          <h4 className="text-lg font-semibold">Step 1: Python Module</h4>
          <p>
            Create <code>adam_optimizer.py</code> extending <code>BaseOptimizer</code>:
          </p>
          <CodeBlock
            code={`import torch
import numpy as np
from qubots.base_optimizer import BaseOptimizer

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

          <h4 className="text-lg font-semibold">Step 2: Configuration</h4>
          <p>
            In <code>solver_config.json</code>, specify the entry point for
            <code>AdamOptimizer</code>:
          </p>
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

          <h4 className="text-lg font-semibold">Step 3: Pushing to Rastion</h4>
          <p>
            Use the CLI to publish:
          </p>
          <CodeBlock
            code={`# Create repository
rastion create_repo adam-optimizer

# Push your optimizer implementation
rastion push_solver adam-optimizer --source MY_LOCAL_FOLDER_PATH_WITH_FILES`}
          />
        </>
      )
    },
    sgd: {
      title: "Guide: Creating a Rastion Optimizer – PyTorch SGD",
      content: (
        <>
          <p>
            <em>Stochastic Gradient Descent (SGD)</em> is simpler than Adam, but
            often works well for many continuous problems. This snippet is quite similar 
            to the Adam implementation, just swapping <code>torch.optim.SGD</code>.
          </p>

          <h4 className="text-lg font-semibold">Step 1: Python Module</h4>
          <p>
            Create <code>sgd_optimizer.py</code> extending <code>BaseOptimizer</code>:
          </p>
          <CodeBlock
            code={`import torch
import numpy as np
from qubots.base_optimizer import BaseOptimizer

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

          <h4 className="text-lg font-semibold">Step 2: Configuration</h4>
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

          <h4 className="text-lg font-semibold">Step 3: Pushing to Rastion</h4>
          <CodeBlock
            code={`# Create repository
rastion create_repo sgd-optimizer

# Push your optimizer implementation
rastion push_solver sgd-optimizer --source MY_LOCAL_FOLDER_PATH_WITH_FILES`}
          />
        </>
      )
    },
    rmsprop: {
      title: "Guide: Creating a Rastion Optimizer – PyTorch RMSProp",
      content: (
        <>
          <p>
            <em>RMSProp</em> is another popular gradient-based optimizer often used
            in deep learning frameworks. It adjusts the learning rate based on
            a moving average of recent gradient magnitudes.
          </p>

          <h4 className="text-lg font-semibold">Step 1: Python Module</h4>
          <p>
            Create <code>rmsprop_optimizer.py</code> extending <code>BaseOptimizer</code>:
          </p>
          <CodeBlock
            code={`import torch
import numpy as np
from qubots.base_optimizer import BaseOptimizer

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

          <h4 className="text-lg font-semibold">Step 2: Configuration</h4>
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

          <h4 className="text-lg font-semibold">Step 3: Pushing to Rastion</h4>
          <CodeBlock
            code={`# Create repository
rastion create_repo rmsprop-optimizer

# Push your optimizer implementation
rastion push_solver rmsprop-optimizer --source MY_LOCAL_FOLDER_PATH_WITH_FILES`}
          />
        </>
      )
    }
  };

  return (
    <div>
      {/* Intro Section */}
      <h2 className="text-2xl font-bold mb-4 text-github-gray">
        Optimizer Creation Guides
      </h2>
      {introduction}

      {/* Buttons for each optimizer guide */}
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

      {/* Modal content */}
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

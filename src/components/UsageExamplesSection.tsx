// src/components/UsageExamplesSection.tsx
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
        onClick={(e) => e.stopPropagation()} // Prevent modal from closing when clicking inside it
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

type ExampleKey = "example1" | "example2" | "example3" | "example4";

const UsageExamplesSection: FC = () => {
  const [activeExample, setActiveExample] = useState<ExampleKey | null>(null);
  const closeModal = () => setActiveExample(null);

  const examples: Record<ExampleKey, { title: string; content: ReactNode }> = {
    example1: {
      title: "Basic Usage: BinaryOneMax with Simulated Annealing",
      content: (
        <>
          <p>
            This example shows how to load the BinaryOneMax problem and the Simulated Annealing optimizer, then run the optimization.
          </p>
          <pre className="bg-[#1E1E1E] p-4 rounded overflow-x-auto font-code text-[#9b87f5]">
{`from rastion_hub.auto_problem import AutoProblem
from rastion_hub.auto_optimizer import AutoOptimizer

# Load the BinaryOneMax problem
problem = AutoProblem.from_repo("Rastion/binary-onemax-problem", revision="main")

# Load the Simulated Annealing optimizer
optimizer = AutoOptimizer.from_repo("Rastion/simulated-annealing-optimizer", revision="main",
                                    override_params={"max_iters": 500, "initial_temp": 100.0, "cooling_rate": 0.95})

# Run optimization
solution, cost = optimizer.optimize(problem)
print("Best solution:", solution)
print("Best cost:", cost)`}
          </pre>
        </>
      )
    },
    example2: {
      title: "Continuous Example: Rosenbrock with PyTorch Adam",
      content: (
        <>
          <p>
            In this example, we load the Rosenbrock problem and use the PyTorch Adam optimizer to minimize the Rosenbrock function.
          </p>
          <pre className="bg-[#1E1E1E] p-4 rounded overflow-x-auto font-code text-[#9b87f5]">
{`from rastion_hub.auto_problem import AutoProblem
from rastion_hub.auto_optimizer import AutoOptimizer

# Load the Rosenbrock problem
problem = AutoProblem.from_repo("Rastion/rosenbrock-problem", revision="main")

# Load the PyTorch Adam optimizer
optimizer = AutoOptimizer.from_repo("Rastion/adam-optimizer", revision="main",
                                    override_params={"max_iters": 1000, "lr": 0.01})

# Run optimization
solution, cost = optimizer.optimize(problem)
print("Rosenbrock solution:", solution)
print("Rosenbrock cost:", cost)`}
          </pre>
        </>
      )
    },
    example3: {
      title: "Multiple Optimizers: Independent Runs",
      content: (
        <>
          <p>
            This example runs several optimizers independently on a problem and compares their results.
          </p>
          <pre className="bg-[#1E1E1E] p-4 rounded overflow-x-auto font-code text-[#9b87f5]">
{`from rastion_hub.auto_problem import AutoProblem
from rastion_hub.auto_optimizer import AutoOptimizer
from rastion_hub.optimizer_runner import run_optimizers_independently

# Load a problem (using BinaryOneMax for demonstration)
problem = AutoProblem.from_repo("Rastion/binary-onemax-problem", revision="main")

# Load multiple optimizers
optimizer1 = AutoOptimizer.from_repo("Rastion/simulated-annealing-optimizer", revision="main",
                                      override_params={"max_iters": 500, "initial_temp": 100.0, "cooling_rate": 0.95})
optimizer2 = AutoOptimizer.from_repo("Rastion/adam-optimizer", revision="main",
                                      override_params={"max_iters": 1000, "lr": 0.01})
optimizer3 = AutoOptimizer.from_repo("Rastion/sgd-optimizer", revision="main",
                                      override_params={"max_iters": 1000, "lr": 0.01})

results = run_optimizers_independently(problem, [optimizer1, optimizer2, optimizer3])
best_optimizer, best_solution, best_cost = min(results, key=lambda x: x[2])
print("Best optimizer:", best_optimizer)
print("Best solution:", best_solution)
print("Best cost:", best_cost)`}
          </pre>
        </>
      )
    },
    example4: {
      title: "Chained Optimization: Sequential Refinement",
      content: (
        <>
          <p>
            This example demonstrates running a chain of optimizers sequentially, where each optimizer refines the solution from the previous one.
          </p>
          <pre className="bg-[#1E1E1E] p-4 rounded overflow-x-auto font-code text-[#9b87f5]">
{`from rastion_hub.auto_problem import AutoProblem
from rastion_hub.auto_optimizer import AutoOptimizer
from rastion_hub.optimizer_runner import run_optimizers_in_chain

# Load a continuous problem (e.g., Rastrigin)
problem = AutoProblem.from_repo("Rastion/rastrigin-problem", revision="main")

# Load a chain of optimizers: first use SGD, then Adam
optimizer1 = AutoOptimizer.from_repo("Rastion/sgd-optimizer", revision="main",
                                      override_params={"max_iters": 1000, "lr": 0.01})
optimizer2 = AutoOptimizer.from_repo("Rastion/adam-optimizer", revision="main",
                                      override_params={"max_iters": 1000, "lr": 0.01})

final_solution, final_cost = run_optimizers_in_chain(problem, [optimizer1, optimizer2])
print("Final refined solution:", final_solution)
print("Final cost:", final_cost)`}
          </pre>
        </>
      )
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4 text-github-gray">
        Usage Examples
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Button variant="outline" onClick={() => setActiveExample("example1")}>
          Basic Usage: BinaryOneMax + Simulated Annealing
        </Button>
        <Button variant="outline" onClick={() => setActiveExample("example2")}>
          Rosenbrock + PyTorch Adam
        </Button>
        <Button variant="outline" onClick={() => setActiveExample("example3")}>
          Multiple Optimizers: Independent Runs
        </Button>
        <Button variant="outline" onClick={() => setActiveExample("example4")}>
          Chained Optimization: Sequential Refinement
        </Button>
      </div>
      {activeExample && (
        <GuideModal
          title={examples[activeExample].title}
          content={examples[activeExample].content}
          onClose={closeModal}
        />
      )}
    </div>
  );
};

export default UsageExamplesSection;

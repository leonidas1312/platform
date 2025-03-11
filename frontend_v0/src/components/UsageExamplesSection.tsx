import React, { useState, FC, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import CodeBlock from "@/components/CodeBlock";

// Reusable modal component
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

// Keys to reference different example modals
type ExampleKey = "example1" | "example2" | "example3" | "example4";

const UsageExamplesSection: FC = () => {
  const [activeExample, setActiveExample] = useState<ExampleKey | null>(null);
  const closeModal = () => setActiveExample(null);

  // Organized examples with short descriptions
  const examples: Record<ExampleKey, { title: string; content: ReactNode }> = {
    example1: {
      title: "Basic Usage: BinaryOneMax with Simulated Annealing",
      content: (
        <>
          <p>
            <strong>Overview:</strong> This example shows how to load a binary
            optimization problem (<em>BinaryOneMax</em>) and solve it using a
            classical <em>Simulated Annealing</em> optimizer. We override a few
            parameters, such as <code>max_iters</code> and initial temperature.
          </p>
          <CodeBlock
            code={`from qubots.auto_problem import AutoProblem
from qubots.auto_optimizer import AutoOptimizer

# Load the BinaryOneMax problem
problem = AutoProblem.from_repo("Rastion/binary-onemax-problem")

# Load the Simulated Annealing optimizer
optimizer = AutoOptimizer.from_repo("Rastion/simulated-annealing-optimizer",
                                    override_params={"max_iters": 500, "initial_temp": 100.0, "cooling_rate": 0.95})

# Run the optimization
solution, cost = optimizer.optimize(problem)
print("Best solution:", solution)
print("Best cost:", cost)`}
          />
          <p>
            The <code>cost</code> measures how far we are from the optimal
            “all-ones” bitstring. A lower cost indicates a better solution.
          </p>
        </>
      ),
    },
    example2: {
      title: "Continuous Example: Rosenbrock with PyTorch Adam",
      content: (
        <>
          <p>
            <strong>Overview:</strong> Here, we’re working with a{" "}
            <em>continuous</em> optimization problem: the Rosenbrock function.
            We demonstrate using a <em>PyTorch Adam</em> optimizer, setting
            custom parameters such as <code>max_iters</code> and learning rate{" "}
            <code>lr</code>.
          </p>
          <CodeBlock
            code={`from qubots.auto_problem import AutoProblem
from qubots.auto_optimizer import AutoOptimizer

# Load the Rosenbrock problem
problem = AutoProblem.from_repo("Rastion/rosenbrock-problem")

# Load the PyTorch Adam optimizer
optimizer = AutoOptimizer.from_repo("Rastion/adam-optimizer",
                                    override_params={"max_iters": 1000, "lr": 0.01})

# Run the optimization
solution, cost = optimizer.optimize(problem)
print("Rosenbrock solution:", solution)
print("Rosenbrock cost:", cost)`}
          />
          <p>
            A <em>lower</em> Rosenbrock cost is better. This setup is typical for
            continuous optimization scenarios in machine learning or other
            scientific applications.
          </p>
        </>
      ),
    },
    example3: {
      title: "Multiple Optimizers: Independent Runs",
      content: (
        <>
          <p>
            <strong>Overview:</strong> Sometimes you want to compare multiple
            optimizers on the <em>same</em> problem. This code snippet shows how
            to run each optimizer independently using the provided{" "}
            <code>run_optimizers_independently</code> utility and pick the best
            result.
          </p>
          <CodeBlock
            code={`from qubots.auto_problem import AutoProblem
from qubots.auto_optimizer import AutoOptimizer
from qubots.optimizer_runner import run_optimizers_independently

# Load a problem (using BinaryOneMax for demonstration)
problem = AutoProblem.from_repo("Rastion/binary-onemax-problem")

# Load multiple optimizers
optimizer1 = AutoOptimizer.from_repo("Rastion/simulated-annealing-optimizer"
                                      override_params={"max_iters": 500, "initial_temp": 100.0, "cooling_rate": 0.95})
optimizer2 = AutoOptimizer.from_repo("Rastion/adam-optimizer"
                                      override_params={"max_iters": 1000, "lr": 0.01})
optimizer3 = AutoOptimizer.from_repo("Rastion/sgd-optimizer"
                                      override_params={"max_iters": 1000, "lr": 0.01})

results = run_optimizers_independently(problem, [optimizer1, optimizer2, optimizer3])
best_optimizer, best_solution, best_cost = min(results, key=lambda x: x[2])
print("Best optimizer:", best_optimizer)
print("Best solution:", best_solution)
print("Best cost:", best_cost)`}
          />
          <p>
            After running, we measure which optimizer yields the <em>lowest</em>{" "}
            cost. This method is handy for quick benchmarking across classical,
            quantum, or hybrid methods.
          </p>
        </>
      ),
    },
    example4: {
      title: "Chained Optimization: Sequential Refinement",
      content: (
        <>
          <p>
            <strong>Overview:</strong> In chained or “sequential” optimization,
            the output of one optimizer is fed as the initial solution to the
            next. This example loads a continuous <em>Rastrigin</em> problem,
            first runs <em>SGD</em>, then refines with <em>Adam</em>.
          </p>
          <CodeBlock
            code={`from qubots.auto_problem import AutoProblem
from qubots.auto_optimizer import AutoOptimizer
from qubots.optimizer_runner import run_optimizers_in_chain

# Load a continuous problem (e.g., Rastrigin)
problem = AutoProblem.from_repo("Rastion/rastrigin-problem")

# Load a chain of optimizers: first use SGD, then Adam
optimizer1 = AutoOptimizer.from_repo("Rastion/sgd-optimizer",
                                      override_params={"max_iters": 1000, "lr": 0.01})
optimizer2 = AutoOptimizer.from_repo("Rastion/adam-optimizer",
                                      override_params={"max_iters": 1000, "lr": 0.01})

final_solution, final_cost = run_optimizers_in_chain(problem, [optimizer1, optimizer2])
print("Final refined solution:", final_solution)
print("Final cost:", final_cost)`}
          />
          <p>
            This pipeline approach is especially useful in quantum–classical
            hybrids, where a quantum routine outputs a solution that is
            subsequently refined by a classical optimizer.
          </p>
        </>
      ),
    },
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4 text-github-gray">Usage Examples</h2>

      {/* Introduction / Overview */}
      <div className="mb-6 space-y-3">
        <p>
          Below are several example scenarios demonstrating how to leverage the{" "}
          <code>AutoProblem</code> and <code>AutoOptimizer</code> classes, along
          with runner utilities, to tackle different optimization setups. Each
          example highlights:
        </p>
        <ul className="list-disc list-inside ml-4">
          <li>Loading problems from Rastion (binary or continuous).</li>
          <li>Overriding solver parameters (e.g., learning rate, max iterations).</li>
          <li>Running the optimization standalone or in multi-optimizer workflows.</li>
        </ul>
        <p>
          Click any of the buttons below to see a detailed code snippet and
          explanation.
        </p>
      </div>

      {/* Example buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Button variant="outline" onClick={() => setActiveExample("example1")}>
          BinaryOneMax + Simulated Annealing
        </Button>
        <Button variant="outline" onClick={() => setActiveExample("example2")}>
          Rosenbrock + PyTorch Adam
        </Button>
        <Button variant="outline" onClick={() => setActiveExample("example3")}>
          Multiple Optimizers (Independent)
        </Button>
        <Button variant="outline" onClick={() => setActiveExample("example4")}>
          Chained (Sequential Refinement)
        </Button>
      </div>

      {/* Modal for active example */}
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

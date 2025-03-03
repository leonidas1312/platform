import React from "react";
import { Button } from "@/components/ui/button";
import CodeBlock from "@/components/CodeBlock";
import { Terminal, Notebook, Code2, Layers } from "lucide-react";

const GettingStartedIntroduction = () => {
  return (
    <div className="prose max-w-none">
      
      <div className="grid gap-6 mb-8">
        <div className="bg-primary-50 p-6 rounded-xl border border-primary-100">
          <h2 className="text-xl font-semibold mb-4">Quick installation</h2>
          <CodeBlock code="pip install qubots" />
        </div>

        

        <div className="border p-6 rounded-xl">
          <h2 className="text-xl font-semibold mb-4">Example workflow</h2>
          <CodeBlock code={`from qubots.auto_problem import AutoProblem
from qubots.auto_optimizer import AutoOptimizer

# Load an optimization problem from the Rastion hub
problem = AutoProblem.from_repo("Rastion/traveling_salesman_problem")

# Load an optimizer for the problem
optimizer = AutoOptimizer.from_repo("Rastion/ortools_tsp_solver")

# Run the optimization process
solution, cost = optimizer.optimize(problem)
print("Best solution:", solution)
print("Cost:", cost)
`} />
        </div>
      </div>
    </div>
  );
};

export default GettingStartedIntroduction;

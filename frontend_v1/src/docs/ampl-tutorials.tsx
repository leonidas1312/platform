import type { Metadata } from "next"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CodeBlock } from "@/components/Code-block-docs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { InfoIcon } from "lucide-react"

export const metadata: Metadata = {
  title: "AMPL Qubots Tutorial | Documentation",
  description: "Learn how to use AMPL with qubots for solving optimization problems",
}

export default function AMPLTutorialsPage() {
  return (
    <div className="container mx-auto py-10 space-y-8">
      <div className="space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">AMPL Qubots Tutorial</h1>
        <p className="text-xl text-muted-foreground">
          Learn how to use AMPL with qubots for solving optimization problems
        </p>
      </div>

      <Alert>
        <InfoIcon className="h-4 w-4" />
        <AlertTitle>Prerequisites</AlertTitle>
        <AlertDescription>
          This tutorial assumes you have AMPL installed and have basic knowledge of optimization problems. You'll need
          the <code>amplpy</code> Python package installed.
        </AlertDescription>
      </Alert>

      <div className="space-y-6">
        <h2 className="text-2xl font-bold tracking-tight" id="introduction">
          Introduction to AMPL and Qubots
        </h2>
        <p>
          AMPL (A Mathematical Programming Language) is a powerful algebraic modeling language for describing and
          solving complex optimization problems. When combined with qubots, AMPL becomes even more powerful, allowing
          you to create reusable optimization components that can be shared and composed.
        </p>

        <p>
          In this tutorial, we'll create a toy knapsack problem using AMPL and solve it with a qubot optimizer. We'll
          implement both the problem and optimizer following the qubot interfaces, and then show how they can be used
          together.
        </p>

        <h2 className="text-2xl font-bold tracking-tight mt-8" id="knapsack-problem">
          The Knapsack Problem
        </h2>
        <p>
          The knapsack problem is a classic optimization problem: given a set of items, each with a weight and a value,
          determine which items to include in a collection so that the total weight is less than or equal to a given
          limit and the total value is as large as possible.
        </p>

        <p>This is a perfect example for AMPL, as it can be formulated as a simple integer linear program:</p>

        <Card className="p-4 bg-gray-50 dark:bg-gray-900 font-mono text-sm">
          <pre>{`maximize ∑(value[i] * take[i]) for all i
subject to ∑(weight[i] * take[i]) ≤ capacity for all i
where take[i] is binary (0 or 1)`}</pre>
        </Card>

        <h2 className="text-2xl font-bold tracking-tight mt-8" id="implementing-problem">
          Implementing the AMPL Problem Qubot
        </h2>
        <p>
          First, we'll implement the knapsack problem as a qubot by extending the <code>BaseProblem</code> class:
        </p>

        <CodeBlock
          language="python"
          code={`from qubots.base_problem import BaseProblem
import amplpy

class AMPLKnapsackProblem(BaseProblem):
    """
    A knapsack problem implemented using AMPL.
    
    This problem involves selecting items to include in a knapsack
    to maximize value while respecting weight constraints.
    """
    
    def __init__(self, items_data=None, capacity=None):
        """
        Initialize the knapsack problem with items and capacity.
        
        Args:
            items_data: Dictionary with 'values' and 'weights' lists
            capacity: Maximum weight capacity of the knapsack
        """
        # Default toy problem if no data provided
        if items_data is None:
            self.values = [10, 20, 30, 40, 50]
            self.weights = [5, 4, 6, 3, 8]
        else:
            self.values = items_data.get('values', [])
            self.weights = items_data.get('weights', [])
            
        self.capacity = capacity or 15
        self.n_items = len(self.values)
        
        # Create AMPL model
        self.ampl = amplpy.AMPL()
        self._setup_model()
        
    def _setup_model(self):
        """Set up the AMPL model for the knapsack problem."""
        # Define the model using AMPL modeling language
        self.ampl.eval("""
        # Sets
        set ITEMS;
        
        # Parameters
        param value {i in ITEMS};
        param weight {i in ITEMS};
        param capacity;
        
        # Variables
        var Take {i in ITEMS} binary;
        
        # Objective
        maximize TotalValue: sum {i in ITEMS} value[i] * Take[i];
        
        # Constraints
        subject to WeightLimit: sum {i in ITEMS} weight[i] * Take[i] <= capacity;
        """)
        
        # Set up the data
        items_set = list(range(1, self.n_items + 1))
        
        # Create and populate sets
        items = self.ampl.getSet("ITEMS")
        items.setValues(items_set)
        
        # Create and populate parameters
        value_param = self.ampl.getParameter("value")
        weight_param = self.ampl.getParameter("weight")
        capacity_param = self.ampl.getParameter("capacity")
        
        for i, (v, w) in enumerate(zip(self.values, self.weights), 1):
            value_param.set(i, v)
            weight_param.set(i, w)
            
        capacity_param.set(self.capacity)
    
    def evaluate_solution(self, solution) -> float:
        """
        Evaluate the total value of the given solution.
        
        Args:
            solution: A binary list indicating which items to take
            
        Returns:
            float: Total value of the selected items
        """
        if not self.is_feasible(solution):
            return float('-inf')  # Infeasible solutions get negative infinity
            
        total_value = sum(v * take for v, take in zip(self.values, solution))
        return total_value
    
    def is_feasible(self, solution) -> bool:
        """
        Check if the solution respects the weight constraint.
        
        Args:
            solution: A binary list indicating which items to take
            
        Returns:
            bool: True if the solution is feasible, False otherwise
        """
        total_weight = sum(w * take for w, take in zip(self.weights, solution))
        return total_weight <= self.capacity
    
    def random_solution(self):
        """
        Generate a random feasible solution.
        
        Returns:
            list: A binary list indicating which items to take
        """
        # Start with nothing in the knapsack
        solution = [0] * self.n_items
        current_weight = 0
        
        # Try to add items randomly until we can't add more
        indices = list(range(self.n_items))
        np.random.shuffle(indices)
        
        for i in indices:
            if current_weight + self.weights[i] <= self.capacity:
                solution[i] = 1
                current_weight += self.weights[i]
                
        return solution
    
    def get_ampl_model(self):
        """Return the AMPL model for use by optimizers."""
        return self.ampl`}
        />

        <h2 className="text-2xl font-bold tracking-tight mt-8" id="implementing-optimizer">
          Implementing the AMPL Optimizer Qubot
        </h2>
        <p>
          Next, we'll implement an optimizer that uses AMPL to solve the knapsack problem by extending the{" "}
          <code>BaseOptimizer</code> class:
        </p>

        <CodeBlock
          language="python"
          code={`class AMPLKnapsackOptimizer(BaseOptimizer):
    """
    An optimizer that uses AMPL to solve the knapsack problem.
    """
    
    def __init__(self, solver='highs', time_limit=10):
        """
        Initialize the AMPL optimizer.
        
        Args:
            solver: The solver to use (default: 'highs')
            time_limit: Time limit in seconds
        """
        self.solver = solver
        self.time_limit = time_limit
    
    def optimize(self, problem, initial_solution=None, **kwargs):
        """
        Solve the knapsack problem using AMPL.
        
        Args:
            problem: An AMPLKnapsackProblem instance
            initial_solution: Optional initial solution (not used by AMPL)
            
        Returns:
            tuple: (best_solution, best_value)
        """
        if not isinstance(problem, AMPLKnapsackProblem):
            raise TypeError("Problem must be an instance of AMPLKnapsackProblem")
        
        # Get the AMPL model from the problem
        ampl = problem.get_ampl_model()
        
        # Set the solver
        ampl.setOption('solver', self.solver)
        ampl.setOption(f'{self.solver}_options', f'time_limit={self.time_limit}')
        
        # Solve the problem
        ampl.solve()
        
        # Check if the solution is optimal
        if ampl.getValue("solve_result") != "optimal":
            print(f"Warning: Solution is not optimal. Status: {ampl.getValue('solve_result')}")
        
        # Extract the solution
        take_var = ampl.getVariable("Take")
        solution = []
        
        for i in range(1, problem.n_items + 1):
            solution.append(int(take_var[i].value()))
        
        # Get the objective value
        objective_value = ampl.getValue("TotalValue")
        
        return solution, objective_value`}
        />

        <h2 className="text-2xl font-bold tracking-tight mt-8" id="using-qubots">
          Using the AMPL Qubots
        </h2>
        <p>
          Now that we have implemented both the problem and optimizer qubots, let's see how they can be used together:
        </p>

        <CodeBlock
          language="python"
          code={`# Create a toy problem instance
items_data = {
    'values': [10, 20, 30, 40, 50, 60, 70, 80, 90, 100],
    'weights': [5, 4, 6, 3, 8, 2, 7, 9, 5, 10]
}
capacity = 30

# Create the problem instance
problem = AMPLKnapsackProblem(items_data, capacity)

# Create the optimizer
optimizer = AMPLKnapsackOptimizer(solver='highs', time_limit=5)

# Solve the problem
solution, value = optimizer.optimize(problem)

print(f"Optimal solution: {solution}")
print(f"Optimal value: {value}")
print(f"Selected items: {[i+1 for i, x in enumerate(solution) if x == 1]}")
print(f"Total weight: {sum(problem.weights[i] for i, x in enumerate(solution) if x == 1)}")`}
        />

        <h2 className="text-2xl font-bold tracking-tight mt-8" id="auto-loading">
          Using AutoProblem and AutoOptimizer
        </h2>
        <p>
          In a real-world scenario, you would typically use <code>AutoProblem</code> and <code>AutoOptimizer</code> to
          load your qubots from repositories. Here's how that would look:
        </p>

        <CodeBlock
          language="python"
          code={`from qubots.auto_problem import AutoProblem
from qubots.auto_optimizer import AutoOptimizer

# Load the problem from a repository
problem = AutoProblem.from_repo("username/knapsack_problem",
                               override_params={"capacity": 30,
                                              "items_data": {
                                                  "values": [10, 20, 30, 40, 50],
                                                  "weights": [5, 4, 6, 3, 8]
                                              }})

# Extract problem data for the optimizer
n_items = problem.n_items
values = problem.values
weights = problem.weights

# Load the optimizer from a repository
optimizer = AutoOptimizer.from_repo("username/ampl_optimizer",
                                   override_params={"solver": "highs",
                                                  "time_limit": 10})

# Solve the problem
solution = optimizer.optimize(problem)
print(solution)`}
        />

        <h2 className="text-2xl font-bold tracking-tight mt-8" id="repository-structure">
          Repository Structure for AMPL Qubots
        </h2>
        <p>
          To make your AMPL qubots available through the <code>AutoProblem</code> and <code>AutoOptimizer</code>{" "}
          classes, you need to structure your repositories correctly. Here's the recommended structure:
        </p>

        <Tabs defaultValue="problem">
          <TabsList>
            <TabsTrigger value="problem">Problem Repository</TabsTrigger>
            <TabsTrigger value="optimizer">Optimizer Repository</TabsTrigger>
          </TabsList>
          <TabsContent value="problem">
            <Card className="p-4 bg-gray-50 dark:bg-gray-900 font-mono text-sm">
              <pre>{`knapsack_problem/
├── config.json           # Configuration for AutoProblem
├── knapsack_problem.py   # Contains the AMPLKnapsackProblem class
└── requirements.txt      # Dependencies (amplpy, etc.)
`}</pre>
            </Card>

            <p className="mt-4">
              Example <code>config.json</code> for the problem:
            </p>

            <CodeBlock
              language="json"
              code={`{
  "type": "problem",
  "entry_point": "knapsack_problem",
  "class_name": "AMPLKnapsackProblem",
  "default_params": {
    "capacity": 15
  }
}`}
            />
          </TabsContent>

          <TabsContent value="optimizer">
            <Card className="p-4 bg-gray-50 dark:bg-gray-900 font-mono text-sm">
              <pre>{`ampl_optimizer/
├── config.json           # Configuration for AutoOptimizer
├── ampl_optimizer.py     # Contains the AMPLKnapsackOptimizer class
└── requirements.txt      # Dependencies (amplpy, etc.)
`}</pre>
            </Card>

            <p className="mt-4">
              Example <code>config.json</code> for the optimizer:
            </p>

            <CodeBlock
              language="json"
              code={`{
  "type": "optimizer",
  "entry_point": "ampl_optimizer",
  "class_name": "AMPLKnapsackOptimizer",
  "default_params": {
    "solver": "highs",
    "time_limit": 10
  }
}`}
            />
          </TabsContent>
        </Tabs>

        

        <h2 className="text-2xl font-bold tracking-tight mt-8" id="conclusion">
          Conclusion
        </h2>
        <p>
          In this tutorial, we've seen how to create qubots that use AMPL to model and solve optimization problems.
          We've implemented both a problem qubot and an optimizer qubot, and shown how they can be used together.
        </p>

        <p>
          AMPL is a powerful tool for modeling optimization problems, and when combined with the qubot framework, it
          becomes even more powerful, allowing you to create reusable optimization components that can be shared and
          composed.
        </p>

        <p>
          For more information on AMPL, visit the{" "}
          <a href="https://ampl.com/" className="text-primary hover:underline">
            AMPL website
          </a>
          . For more information on qubots, check out the other tutorials in this documentation.
        </p>
      </div>
    </div>
  )
}

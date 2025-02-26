export const benchmarks: BenchmarkResult[] = [
    {
      problem: {
        name: "Traveling Salesman Problem (TSP)",
        description: "Aymmetric TSPs from TSPLIB",
        problemType: "combinatorial"
      },
      optimizers: [
        {
          name: "Routing manager from ortools",
          repo: "Rastion/ortools_tsp_solver",
          type: "hybrid",
          cost: 1210,
          runtime: 58.4,
          parameters: { timeLimit: 60 }
        },
        {
          name: "Cheapest arc heuristic",
          repo: "Rastion/nn_tsp_solver -> Rastion/gls_tsp_solver",
          type: "hybrid",
          cost: 1250,
          runtime: 54.2,
          iterations: 150,
          parameters: { timeLimit: 60 }
        },
        {
          name: "Christofides",
          repo: "Rastion/christofides_tsp_solver -> Rastion/gls_tsp_solver",
          type: "hybrid",
          cost: 1250,
          runtime: 54.2,
          iterations: 150,
          parameters: { timeLimit: 60 }
        },
        {
          name: "RL based QUBO optimizer",
          repo: "Rastion/rl-qubo-optimizer -> Rastion/gls_tsp_solver",
          type: "hybrid",
          cost: 1235,
          runtime: 59.8,
          parameters: { timeLimit: 60 }
        }
      ],
      testEnvironment: {
        cpu: "Intel Core i7",
        ram: "8GB RAM",
        os: "Windows 10",
        timestamp: "25/02/2025"
      },
      codeSnippet:`import matplotlib.pyplot as plt
from qubots.auto_problem import AutoProblem
from qubots.auto_optimizer import AutoOptimizer
from qubots.quantum_classical_pipeline import create_quantum_classical_pipeline

# Load problem and optimizer
problem = AutoProblem.from_repo(
    "Rastion/traveling_salesman_problem"
)

optimizer1 = AutoOptimizer.from_repo(
    "Rastion/ortools_tsp_solver",
    override_params={"time_limit": 60}
)

best_solution, best_cost1 = optimizer1.optimize(problem)
print(f"ORtools Best solution {best_solution}, with cost = {best_cost1}")

optimizer2 = AutoOptimizer.from_repo(
    "Rastion/rl-qubo-optimizer",
    override_params={"time_limit": 60,
                     "verbose": False}
)

best_solution, best_cost2 = optimizer2.optimize(problem)

# Decode the bitstring solution to a valid tour
tour = problem.decode_solution(best_solution)

# Use the problem's own evaluation function.
cost2 = problem.evaluate_solution(tour)
print(f"RL Best solution {tour}, with cost = {cost2}")

optimizer3 = AutoOptimizer.from_repo(
    "Rastion/sa_qubo_optimizer",
    override_params={"verbose": False,
                     "time_limit":60}
)

best_solution, best_cost3 = optimizer3.optimize(problem)

# Decode the bitstring solution to a valid tour
tour = problem.decode_solution(best_solution)

# Use the problem's own evaluation function.
cost3 = problem.evaluate_solution(tour)
print(f"SA solver solution: {tour}, cost: {cost3}")

optimizer4 = AutoOptimizer.from_repo(
    "Rastion/vqa-qubit-eff",
    override_params={"max_iters":100}
)

vqa_pipeline = create_quantum_classical_pipeline(optimizer4,
                                                 optimizer3
                                                 )

best_solution, best_cost4 = vqa_pipeline.optimize(problem)

# Decode the bitstring solution to a valid tour
tour = problem.decode_solution(best_solution)

# Use the problem's own evaluation function.
cost4 = problem.evaluate_solution(tour)

print(f"Best solution QuantumClassical {tour}, with cost = {cost4}")

vqa_pipeline = create_quantum_classical_pipeline(optimizer4,
                                                 optimizer2
                                                 )

best_solution, best_cost4 = vqa_pipeline.optimize(problem)

# Decode the bitstring solution to a valid tour
tour = problem.decode_solution(best_solution)

# Use the problem's own evaluation function.
cost5 = problem.evaluate_solution(tour)

print(f"Best solution QuantumClassical {tour}, with cost = {cost5}")`
    }
    // Add more benchmark entries here
  ];
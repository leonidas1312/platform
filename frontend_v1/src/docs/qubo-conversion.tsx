"use client"
import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import Layout from "@/components/Layout"
import { ArrowLeft, FileText, Code, GitBranch, ExternalLink, Copy } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

const QuboConversionDoc = () => {
  const { toast } = useToast()
  return (
    <Layout>
      <div className="container mx-auto px-4 py-12 md:py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl mx-auto"
        >
          <div className="mb-8">
            <Button variant="ghost" className="mb-4" asChild>
              <a href="/documentation">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Documentation
              </a>
            </Button>
            <h1 className="text-3xl md:text-4xl font-bold mb-4">Converting Problems to QUBO Format</h1>
            <p className="text-lg text-muted-foreground">
              Learn how to transform your optimization problems into Quadratic Unconstrained Binary Optimization format
              for quantum and quantum-inspired solvers.
            </p>
          </div>

          <div className="space-y-8">
            <section>
              <h2 className="text-2xl font-semibold mb-4">What is QUBO?</h2>
              <Card>
                <CardContent className="pt-6 prose prose-slate dark:prose-invert max-w-none">
                  <p className="mb-4 text-lg">
                    Quadratic Unconstrained Binary Optimization (QUBO) is a formulation used to represent combinatorial
                    optimization problems. It's particularly important because quantum annealing hardware and many
                    quantum-inspired algorithms are designed to solve problems in this format.
                  </p>
                  <p className="mb-4">A QUBO problem is expressed as minimizing a function of binary variables:</p>
                  <div className="bg-primary/5 p-4 rounded-md text-center mb-4 border border-primary/20 shadow-sm">
                    <p className="font-medium text-lg">
                      min f(x) = x<sup>T</sup>Qx
                    </p>
                  </div>
                  <p>
                    Where x is a vector of binary variables (0 or 1), and Q is a matrix of weights that defines the
                    problem.
                  </p>
                </CardContent>
              </Card>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">Converting Problems to QUBO</h2>
              <Card>
                <CardContent className="pt-6">
                  <p className="mb-4">
                    The Qubots library provides several ways to convert optimization problems to QUBO format:
                  </p>

                  <h3 className="text-xl font-medium mb-3">1. Using the Problem Class</h3>
                  <div className="bg-secondary/50 p-3 rounded-md font-mono text-sm mb-4 relative group shadow-sm border border-border/30">
                    <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => {
                          navigator.clipboard.writeText(`import qubots as qb

# Define your problem
problem = qb.Problem()

# Add variables
problem.add_variable('x', [0, 1])
problem.add_variable('y', [0, 1])
problem.add_variable('z', [0, 1])

# Add constraints
problem.add_constraint(lambda vars: vars['x'] + vars['y'] + vars['z'] <= 2)

# Set objective function
problem.set_objective(lambda vars: 3*vars['x'] + 2*vars['y'] + vars['z'], maximize=True)

# Convert to QUBO
qubo = qb.convert_to_qubo(problem)

# Print the Q matrix
print(qubo.Q)`)
                          toast({
                            title: "Code copied",
                            description: "Code snippet copied to clipboard",
                          })
                        }}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <pre className="overflow-x-auto">
                      <code>{`import qubots as qb

# Define your problem
problem = qb.Problem()

# Add variables
problem.add_variable('x', [0, 1])
problem.add_variable('y', [0, 1])
problem.add_variable('z', [0, 1])

# Add constraints
problem.add_constraint(lambda vars: vars['x'] + vars['y'] + vars['z'] <= 2)

# Set objective function
problem.set_objective(lambda vars: 3*vars['x'] + 2*vars['y'] + vars['z'], maximize=True)

# Convert to QUBO
qubo = qb.convert_to_qubo(problem)

# Print the Q matrix
print(qubo.Q)`}</code>
                    </pre>
                  </div>

                  <h3 className="text-xl font-medium mb-3">2. Using Pre-built Problem Types</h3>
                  <div className="bg-secondary/50 p-3 rounded-md font-mono text-sm mb-4 relative group shadow-sm border border-border/30">
                    <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => {
                          navigator.clipboard.writeText(`import qubots as qb
import networkx as nx

# Create a graph for MaxCut problem
G = nx.random_regular_graph(3, 10)

# Create a MaxCut problem instance
maxcut = qb.problems.MaxCut(G)

# The problem is already in QUBO format
qubo = maxcut.qubo

# Solve using a quantum-inspired solver
solver = qb.QAOASolver()
result = solver.solve(qubo)`)
                          toast({
                            title: "Code copied",
                            description: "Code snippet copied to clipboard",
                          })
                        }}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <pre className="overflow-x-auto">
                      <code>{`import qubots as qb
import networkx as nx

# Create a graph for MaxCut problem
G = nx.random_regular_graph(3, 10)

# Create a MaxCut problem instance
maxcut = qb.problems.MaxCut(G)

# The problem is already in QUBO format
qubo = maxcut.qubo

# Solve using a quantum-inspired solver
solver = qb.QAOASolver()
result = solver.solve(qubo)`}</code>
                    </pre>
                  </div>

                  <h3 className="text-xl font-medium mb-3">3. Direct QUBO Construction</h3>
                  <div className="bg-secondary/50 p-3 rounded-md font-mono text-sm mb-4 relative group shadow-sm border border-border/30">
                    <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => {
                          navigator.clipboard.writeText(`import qubots as qb
import numpy as np

# Create a QUBO directly
n_variables = 4
Q = np.zeros((n_variables, n_variables))

# Set linear terms (diagonal)
for i in range(n_variables):
    Q[i, i] = np.random.uniform(-1, 1)

# Set quadratic terms (off-diagonal)
for i in range(n_variables):
    for j in range(i+1, n_variables):
        Q[i, j] = np.random.uniform(-0.5, 0.5)
        Q[j, i] = Q[i, j]  # Ensure symmetry

qubo = qb.QUBO(Q)

# Solve the QUBO
solver = qb.SimulatedAnnealingSolver()
result = solver.solve(qubo)`)
                          toast({
                            title: "Code copied",
                            description: "Code snippet copied to clipboard",
                          })
                        }}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <pre className="overflow-x-auto">
                      <code>{`import qubots as qb
import numpy as np

# Create a QUBO directly
n_variables = 4
Q = np.zeros((n_variables, n_variables))

# Set linear terms (diagonal)
for i in range(n_variables):
    Q[i, i] = np.random.uniform(-1, 1)

# Set quadratic terms (off-diagonal)
for i in range(n_variables):
    for j in range(i+1, n_variables):
        Q[i, j] = np.random.uniform(-0.5, 0.5)
        Q[j, i] = Q[i, j]  # Ensure symmetry

qubo = qb.QUBO(Q)

# Solve the QUBO
solver = qb.SimulatedAnnealingSolver()
result = solver.solve(qubo)`}</code>
                    </pre>
                  </div>
                </CardContent>
              </Card>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">Handling Constraints</h2>
              <Card>
                <CardContent className="pt-6">
                  <p className="mb-4">
                    Converting constrained problems to QUBO requires penalty methods. Qubots handles this automatically,
                    but understanding the process helps in fine-tuning:
                  </p>

                  <h3 className="text-xl font-medium mb-3">Equality Constraints</h3>
                  <p className="mb-2">For a constraint like a = b + c, we add a penalty term:</p>
                  <div className="bg-secondary/50 p-3 rounded-md text-center mb-4">
                    <p>
                      P<sub>eq</sub> = A(a - b - c)<sup>2</sup>
                    </p>
                  </div>
                  <p className="mb-4">Where A is a sufficiently large penalty coefficient.</p>

                  <h3 className="text-xl font-medium mb-3">Inequality Constraints</h3>
                  <p className="mb-2">For a constraint like a + b ≤ 1, we introduce a slack variable s:</p>
                  <div className="bg-secondary/50 p-3 rounded-md text-center mb-4">
                    <p>a + b + s = 1, where s ≥ 0</p>
                  </div>
                  <p className="mb-4">Then we convert this to a penalty term in the QUBO formulation.</p>

                  <h3 className="text-xl font-medium mb-3">Example with Constraints</h3>
                  <div className="bg-secondary/50 p-3 rounded-md font-mono text-sm mb-4 relative group shadow-sm border border-border/30">
                    <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => {
                          navigator.clipboard.writeText(`import qubots as qb

# Define constrained problem
problem = qb.Problem()

# Add variables
problem.add_variable('x', [0, 1])
problem.add_variable('y', [0, 1])
problem.add_variable('z', [0, 1])

# Add constraints
problem.add_constraint(lambda vars: vars['x'] + vars['y'] + vars['z'] == 2)  # Equality
problem.add_constraint(lambda vars: vars['x'] + vars['y'] <= 1)              # Inequality

# Set objective
problem.set_objective(lambda vars: 3*vars['x'] + 2*vars['y'] + vars['z'])

# Convert to QUBO with automatic penalty coefficient selection
qubo = qb.convert_to_qubo(problem, auto_scale_penalties=True)

# Or specify custom penalty coefficients
qubo = qb.convert_to_qubo(problem, penalty_coefficient=5.0)`)
                          toast({
                            title: "Code copied",
                            description: "Code snippet copied to clipboard",
                          })
                        }}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <pre className="overflow-x-auto">
                      <code>{`import qubots as qb

# Define constrained problem
problem = qb.Problem()

# Add variables
problem.add_variable('x', [0, 1])
problem.add_variable('y', [0, 1])
problem.add_variable('z', [0, 1])

# Add constraints
problem.add_constraint(lambda vars: vars['x'] + vars['y'] + vars['z'] == 2)  # Equality
problem.add_constraint(lambda vars: vars['x'] + vars['y'] <= 1)              # Inequality

# Set objective
problem.set_objective(lambda vars: 3*vars['x'] + 2*vars['y'] + vars['z'])

# Convert to QUBO with automatic penalty coefficient selection
qubo = qb.convert_to_qubo(problem, auto_scale_penalties=True)

# Or specify custom penalty coefficients
qubo = qb.convert_to_qubo(problem, penalty_coefficient=5.0)`}</code>
                    </pre>
                  </div>
                </CardContent>
              </Card>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">Common Optimization Problems</h2>
              <Tabs defaultValue="maxcut">
                <TabsList className="mb-4">
                  <TabsTrigger value="maxcut">MaxCut</TabsTrigger>
                  <TabsTrigger value="tsp">TSP</TabsTrigger>
                  <TabsTrigger value="knapsack">Knapsack</TabsTrigger>
                  <TabsTrigger value="coloring">Graph Coloring</TabsTrigger>
                </TabsList>

                <TabsContent value="maxcut">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-2 mb-3">
                        <GitBranch className="h-5 w-5 text-primary" />
                        <h3 className="text-xl font-medium">Maximum Cut Problem</h3>
                      </div>
                      <p className="mb-4">
                        The MaxCut problem involves partitioning a graph's vertices into two sets to maximize the number
                        of edges between the sets.
                      </p>
                      <div className="bg-secondary/50 p-3 rounded-md font-mono text-sm mb-4 relative group shadow-sm border border-border/30">
                        <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => {
                              navigator.clipboard.writeText(`import qubots as qb
import networkx as nx

# Create a graph
G = nx.random_regular_graph(3, 8)

# Create MaxCut problem
maxcut = qb.problems.MaxCut(G)

# The problem is already in QUBO format
qubo = maxcut.qubo

# Solve
solver = qb.QAOASolver()
result = solver.solve(qubo)

# Get the cut
cut_set = maxcut.get_cut_from_solution(result.solution)
print(f"Cut value: {maxcut.evaluate_cut(cut_set)}")

# Visualize
maxcut.plot_solution(result.solution)`)
                              toast({
                                title: "Code copied",
                                description: "Code snippet copied to clipboard",
                              })
                            }}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                        <pre className="overflow-x-auto">
                          <code>{`import qubots as qb
import networkx as nx

# Create a graph
G = nx.random_regular_graph(3, 8)

# Create MaxCut problem
maxcut = qb.problems.MaxCut(G)

# The problem is already in QUBO format
qubo = maxcut.qubo

# Solve
solver = qb.QAOASolver()
result = solver.solve(qubo)

# Get the cut
cut_set = maxcut.get_cut_from_solution(result.solution)
print(f"Cut value: {maxcut.evaluate_cut(cut_set)}")

# Visualize
maxcut.plot_solution(result.solution)`}</code>
                        </pre>
                      </div>
                      <Button variant="outline" size="sm" asChild>
                        <a href="/notebooks/maxcut_example.ipynb">
                          <ExternalLink className="mr-2 h-4 w-4" />
                          Open MaxCut Notebook
                        </a>
                      </Button>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="tsp">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-2 mb-3">
                        <GitBranch className="h-5 w-5 text-primary" />
                        <h3 className="text-xl font-medium">Traveling Salesman Problem</h3>
                      </div>
                      <p className="mb-4">
                        The TSP involves finding the shortest possible route that visits each city exactly once and
                        returns to the origin.
                      </p>
                      <div className="bg-secondary/50 p-3 rounded-md font-mono text-sm mb-4 relative group shadow-sm border border-border/30">
                        <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => {
                              navigator.clipboard.writeText(`import qubots as qb
import networkx as nx
import numpy as np

# Create a complete graph with distances
n_cities = 5
G = nx.complete_graph(n_cities)
for (u, v) in G.edges():
    G.edges[u, v]['weight'] = np.random.randint(1, 10)

# Create TSP problem
tsp = qb.problems.TSP(G)

# Convert to QUBO
qubo = tsp.qubo

# Solve
solver = qb.SimulatedAnnealingSolver()
result = solver.solve(qubo)

# Get the tour
tour = tsp.get_tour_from_solution(result.solution)
print(f"Tour: {tour}")
print(f"Tour length: {tsp.evaluate_tour(tour)}")

# Visualize
tsp.plot_solution(result.solution)`)
                              toast({
                                title: "Code copied",
                                description: "Code snippet copied to clipboard",
                              })
                            }}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                        <pre className="overflow-x-auto">
                          <code>{`import qubots as qb
import networkx as nx
import numpy as np

# Create a complete graph with distances
n_cities = 5
G = nx.complete_graph(n_cities)
for (u, v) in G.edges():
    G.edges[u, v]['weight'] = np.random.randint(1, 10)

# Create TSP problem
tsp = qb.problems.TSP(G)

# Convert to QUBO
qubo = tsp.qubo

# Solve
solver = qb.SimulatedAnnealingSolver()
result = solver.solve(qubo)

# Get the tour
tour = tsp.get_tour_from_solution(result.solution)
print(f"Tour: {tour}")
print(f"Tour length: {tsp.evaluate_tour(tour)}")

# Visualize
tsp.plot_solution(result.solution)`}</code>
                        </pre>
                      </div>
                      <Button variant="outline" size="sm" asChild>
                        <a href="/notebooks/tsp_example.ipynb">
                          <ExternalLink className="mr-2 h-4 w-4" />
                          Open TSP Notebook
                        </a>
                      </Button>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="knapsack">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-2 mb-3">
                        <GitBranch className="h-5 w-5 text-primary" />
                        <h3 className="text-xl font-medium">Knapsack Problem</h3>
                      </div>
                      <p className="mb-4">
                        The Knapsack problem involves selecting items with different values and weights to maximize
                        value while staying within a weight constraint.
                      </p>
                      <div className="bg-secondary/50 p-3 rounded-md font-mono text-sm mb-4 relative group shadow-sm border border-border/30">
                        <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => {
                              navigator.clipboard.writeText(`import qubots as qb
import numpy as np

# Define items (values and weights)
values = np.array([10, 15, 20, 25, 30])
weights = np.array([1, 2, 3, 4, 5])
capacity = 10

# Create Knapsack problem
knapsack = qb.problems.Knapsack(values, weights, capacity)

# Convert to QUBO
qubo = knapsack.qubo

# Solve
solver = qb.QAOASolver()
result = solver.solve(qubo)

# Get selected items
selected = knapsack.get_items_from_solution(result.solution)
print(f"Selected items: {selected}")
print(f"Total value: {sum(values[selected])}")
print(f"Total weight: {sum(weights[selected])}")`)
                              toast({
                                title: "Code copied",
                                description: "Code snippet copied to clipboard",
                              })
                            }}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                        <pre className="overflow-x-auto">
                          <code>{`import qubots as qb
import numpy as np

# Define items (values and weights)
values = np.array([10, 15, 20, 25, 30])
weights = np.array([1, 2, 3, 4, 5])
capacity = 10

# Create Knapsack problem
knapsack = qb.problems.Knapsack(values, weights, capacity)

# Convert to QUBO
qubo = knapsack.qubo

# Solve
solver = qb.QAOASolver()
result = solver.solve(qubo)

# Get selected items
selected = knapsack.get_items_from_solution(result.solution)
print(f"Selected items: {selected}")
print(f"Total value: {sum(values[selected])}")
print(f"Total weight: {sum(weights[selected])}")`}</code>
                        </pre>
                      </div>
                      <Button variant="outline" size="sm" asChild>
                        <a href="/notebooks/knapsack_example.ipynb">
                          <ExternalLink className="mr-2 h-4 w-4" />
                          Open Knapsack Notebook
                        </a>
                      </Button>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="coloring">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-2 mb-3">
                        <GitBranch className="h-5 w-5 text-primary" />
                        <h3 className="text-xl font-medium">Graph Coloring Problem</h3>
                      </div>
                      <p className="mb-4">
                        The Graph Coloring problem involves assigning colors to vertices such that no adjacent vertices
                        have the same color, using the minimum number of colors.
                      </p>
                      <div className="bg-secondary/50 p-3 rounded-md font-mono text-sm mb-4 relative group shadow-sm border border-border/30">
                        <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => {
                              navigator.clipboard.writeText(`import qubots as qb
import networkx as nx

# Create a graph
G = nx.random_regular_graph(3, 10)

# Create Graph Coloring problem with 3 colors
coloring = qb.problems.GraphColoring(G, num_colors=3)

# Convert to QUBO
qubo = coloring.qubo

# Solve
solver = qb.SimulatedAnnealingSolver()
result = solver.solve(qubo)

# Get the coloring
colors = coloring.get_coloring_from_solution(result.solution)
print(f"Vertex colors: {colors}")
print(f"Is valid coloring: {coloring.is_valid_coloring(colors)}")

# Visualize
coloring.plot_solution(result.solution)`)
                              toast({
                                title: "Code copied",
                                description: "Code snippet copied to clipboard",
                              })
                            }}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                        <pre className="overflow-x-auto">
                          <code>{`import qubots as qb
import networkx as nx

# Create a graph
G = nx.random_regular_graph(3, 10)

# Create Graph Coloring problem with 3 colors
coloring = qb.problems.GraphColoring(G, num_colors=3)

# Convert to QUBO
qubo = coloring.qubo

# Solve
solver = qb.SimulatedAnnealingSolver()
result = solver.solve(qubo)

# Get the coloring
colors = coloring.get_coloring_from_solution(result.solution)
print(f"Vertex colors: {colors}")
print(f"Is valid coloring: {coloring.is_valid_coloring(colors)}")

# Visualize
coloring.plot_solution(result.solution)`}</code>
                        </pre>
                      </div>
                      <Button variant="outline" size="sm" asChild>
                        <a href="/notebooks/coloring_example.ipynb">
                          <ExternalLink className="mr-2 h-4 w-4" />
                          Open Graph Coloring Notebook
                        </a>
                      </Button>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">Advanced QUBO Techniques</h2>
              <Card>
                <CardContent className="pt-6">
                  <h3 className="text-xl font-medium mb-3">1. Penalty Coefficient Tuning</h3>
                  <p className="mb-4">
                    Finding the right penalty coefficients is crucial for QUBO performance. Qubots provides tools to
                    help:
                  </p>
                  <div className="bg-secondary/50 p-3 rounded-md font-mono text-sm mb-4 relative group shadow-sm border border-border/30">
                    <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => {
                          navigator.clipboard.writeText(`import qubots as qb

# Create problem
problem = qb.Problem()
# ... define variables, constraints, objective ...

# Auto-tune penalties
tuned_qubo = qb.tune_penalties(
    problem,
    penalty_range=[1, 10],
    num_trials=10,
    solver=qb.SimulatedAnnealingSolver()
)`)
                          toast({
                            title: "Code copied",
                            description: "Code snippet copied to clipboard",
                          })
                        }}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <pre className="overflow-x-auto">
                      <code>{`import qubots as qb

# Create problem
problem = qb.Problem()
# ... define variables, constraints, objective ...

# Auto-tune penalties
tuned_qubo = qb.tune_penalties(
    problem,
    penalty_range=[1, 10],
    num_trials=10,
    solver=qb.SimulatedAnnealingSolver()
)`}</code>
                    </pre>
                  </div>

                  <h3 className="text-xl font-medium mb-3">2. Variable Reduction</h3>
                  <p className="mb-4">Reducing the number of variables can improve solver performance:</p>
                  <div className="bg-secondary/50 p-3 rounded-md font-mono text-sm mb-4 relative group shadow-sm border border-border/30">
                    <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => {
                          navigator.clipboard.writeText(`import qubots as qb

# Original QUBO
original_qubo = qb.convert_to_qubo(problem)

# Apply variable reduction
reduced_qubo = qb.reduce_variables(original_qubo)
print(f"Original variables: {original_qubo.num_variables}")
print(f"Reduced variables: {reduced_qubo.num_variables}")`)
                          toast({
                            title: "Code copied",
                            description: "Code snippet copied to clipboard",
                          })
                        }}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <pre className="overflow-x-auto">
                      <code>{`import qubots as qb

# Original QUBO
original_qubo = qb.convert_to_qubo(problem)

# Apply variable reduction
reduced_qubo = qb.reduce_variables(original_qubo)
print(f"Original variables: {original_qubo.num_variables}")
print(f"Reduced variables: {reduced_qubo.num_variables}")`}</code>
                    </pre>
                  </div>

                  <h3 className="text-xl font-medium mb-3">3. Problem Decomposition</h3>
                  <p className="mb-4">Breaking large problems into smaller subproblems:</p>
                  <div className="bg-secondary/50 p-3 rounded-md font-mono text-sm mb-4 relative group shadow-sm border border-border/30">
                    <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => {
                          navigator.clipboard.writeText(`import qubots as qb

# Large QUBO
large_qubo = qb.convert_to_qubo(large_problem)

# Decompose into subproblems
subproblems = qb.decompose(large_qubo)

# Solve subproblems
sub_results = []
for sub_qubo in subproblems:
    solver = qb.QAOASolver()
    sub_results.append(solver.solve(sub_qubo))

# Combine results
combined_result = qb.combine_results(subproblems, sub_results)`)
                          toast({
                            title: "Code copied",
                            description: "Code snippet copied to clipboard",
                          })
                        }}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <pre className="overflow-x-auto">
                      <code>{`import qubots as qb

# Large QUBO
large_qubo = qb.convert_to_qubo(large_problem)

# Decompose into subproblems
subproblems = qb.decompose(large_qubo)

# Solve subproblems
sub_results = []
for sub_qubo in subproblems:
    solver = qb.QAOASolver()
    sub_results.append(solver.solve(sub_qubo))

# Combine results
combined_result = qb.combine_results(subproblems, sub_results)`}</code>
                    </pre>
                  </div>
                </CardContent>
              </Card>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">Next Steps</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Code className="h-5 w-5 text-primary" />
                      <h3 className="text-xl font-medium">Explore Solvers</h3>
                    </div>
                    <p className="mb-4">
                      Learn about the different solvers available in Qubots for solving QUBO problems.
                    </p>
                    <Button variant="outline" size="sm" asChild>
                      <a href="/docs/solvers">
                        View Solvers Documentation
                        <ArrowLeft className="ml-2 h-4 w-4 rotate-180" />
                      </a>
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2 mb-3">
                      <FileText className="h-5 w-5 text-primary" />
                      <h3 className="text-xl font-medium">Custom Problem Types</h3>
                    </div>
                    <p className="mb-4">Learn how to create your own custom problem types and QUBO conversions.</p>
                    <Button variant="outline" size="sm" asChild>
                      <a href="/docs/custom-problems">
                        View Custom Problems Guide
                        <ArrowLeft className="ml-2 h-4 w-4 rotate-180" />
                      </a>
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </section>
          </div>
        </motion.div>
      </div>
    </Layout>
  )
}

export default QuboConversionDoc

"use client"
import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Layout from "@/components/Layout"
import { ArrowLeft, FileText, Code, ExternalLink, Download, Copy } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

const TspTutorialDoc = () => {
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
            <h1 className="text-3xl md:text-4xl font-bold mb-4">Solving the Traveling Salesman Problem</h1>
            <p className="text-lg text-muted-foreground">
              A comprehensive tutorial on solving the Traveling Salesman Problem using quantum-inspired optimization
              with Qubots.
            </p>
          </div>

          <div className="flex justify-between items-center mb-8">
            <div className="flex gap-2">
              <Button variant="outline" size="sm" asChild>
                <a href="/notebooks/tsp_example.ipynb">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Open Notebook
                </a>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <a href="/notebooks/tsp_example.ipynb?download=true">
                  <Download className="mr-2 h-4 w-4" />
                  Download Notebook
                </a>
              </Button>
            </div>
            <div className="text-sm text-muted-foreground">Difficulty: Intermediate</div>
          </div>

          <div className="space-y-8">
            <section>
              <h2 className="text-2xl font-semibold mb-4">Problem Overview</h2>
              <Card>
                <CardContent className="pt-6 prose prose-slate dark:prose-invert max-w-none">
                  <p className="mb-4 text-lg">
                    The Traveling Salesman Problem (TSP) is one of the most studied combinatorial optimization problems.
                    It asks:
                  </p>
                  <blockquote className="border-l-4 border-primary/60 pl-4 py-2 my-4 bg-primary/5 rounded-r-md italic text-lg">
                    "Given a list of cities and the distances between each pair of cities, what is the shortest possible
                    route that visits each city exactly once and returns to the origin city?"
                  </blockquote>
                  <p className="mb-4">
                    TSP has applications in logistics, planning, manufacturing, DNA sequencing, and many other fields.
                    It's an NP-hard problem, meaning it's computationally difficult to solve optimally for large
                    instances.
                  </p>
                  <p>
                    In this tutorial, we'll show how to formulate TSP as a QUBO problem and solve it using
                    quantum-inspired optimization techniques with Qubots.
                  </p>
                </CardContent>
              </Card>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">Mathematical Formulation</h2>
              <Card>
                <CardContent className="pt-6">
                  <p className="mb-4">To formulate TSP as a QUBO problem, we need to:</p>
                  <ol className="list-decimal pl-5 space-y-2 mb-4">
                    <li>Represent the problem using binary variables</li>
                    <li>Express the objective function (minimize total distance)</li>
                    <li>Express constraints (visit each city once, complete tour)</li>
                    <li>Combine everything into a QUBO matrix</li>
                  </ol>

                  <h3 className="text-xl font-medium mb-3">Binary Representation</h3>
                  <p className="mb-4">
                    We use binary variables x<sub>i,p</sub> where:
                  </p>
                  <ul className="list-disc pl-5 space-y-2 mb-4">
                    <li>
                      x<sub>i,p</sub> = 1 if city i is visited at position p in the tour
                    </li>
                    <li>
                      x<sub>i,p</sub> = 0 otherwise
                    </li>
                  </ul>
                  <p className="mb-4">For n cities, we need n² binary variables.</p>

                  <h3 className="text-xl font-medium mb-3">Constraints</h3>
                  <p className="mb-4">We need to enforce:</p>
                  <ol className="list-decimal pl-5 space-y-2 mb-4">
                    <li>
                      Each city is visited exactly once: ∑<sub>p</sub> x<sub>i,p</sub> = 1 for all i
                    </li>
                    <li>
                      Each position in the tour has exactly one city: ∑<sub>i</sub> x<sub>i,p</sub> = 1 for all p
                    </li>
                  </ol>

                  <h3 className="text-xl font-medium mb-3">Objective Function</h3>
                  <p className="mb-4">The objective is to minimize the total distance:</p>
                  <div className="bg-secondary/50 p-3 rounded-md text-center mb-4">
                    <p>
                      min ∑<sub>i,j,p</sub> d<sub>i,j</sub> · x<sub>i,p</sub> · x<sub>j,(p+1) mod n</sub>
                    </p>
                  </div>
                  <p>
                    Where d<sub>i,j</sub> is the distance between cities i and j.
                  </p>
                </CardContent>
              </Card>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">Implementation with Qubots</h2>
              <Card>
                <CardContent className="pt-6">
                  <p className="mb-4">Qubots simplifies this process by providing a built-in TSP problem class:</p>

                  <h3 className="text-xl font-medium mb-3">1. Setting Up the Problem</h3>
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
import matplotlib.pyplot as plt

# Create a complete graph with distances
n_cities = 5
G = nx.complete_graph(n_cities)

# Assign random coordinates to cities
coords = {i: (np.random.random(), np.random.random()) for i in range(n_cities)}

# Calculate Euclidean distances
for i, j in G.edges():
    G[i][j]['weight'] = np.sqrt(
        (coords[i][0] - coords[j][0])**2 + 
        (coords[i][1] - coords[j][1])**2
    )

# Create TSP problem instance
tsp = qb.problems.TSP(G)

# Visualize the cities
plt.figure(figsize=(8, 6))
nx.draw(G, coords, with_labels=True, node_color='lightblue', 
        node_size=500, font_weight='bold')
plt.title("Cities and Connections")
plt.show()`)
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
import matplotlib.pyplot as plt

# Create a complete graph with distances
n_cities = 5
G = nx.complete_graph(n_cities)

# Assign random coordinates to cities
coords = {i: (np.random.random(), np.random.random()) for i in range(n_cities)}

# Calculate Euclidean distances
for i, j in G.edges():
    G[i][j]['weight'] = np.sqrt(
        (coords[i][0] - coords[j][0])**2 + 
        (coords[i][1] - coords[j][1])**2
    )

# Create TSP problem instance
tsp = qb.problems.TSP(G)

# Visualize the cities
plt.figure(figsize=(8, 6))
nx.draw(G, coords, with_labels=True, node_color='lightblue', 
        node_size=500, font_weight='bold')
plt.title("Cities and Connections")
plt.show()`}</code>
                    </pre>
                  </div>

                  <h3 className="text-xl font-medium mb-3">2. Converting to QUBO</h3>
                  <div className="bg-secondary/50 p-3 rounded-md font-mono text-sm mb-4 relative group shadow-sm border border-border/30">
                    <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => {
                          navigator.clipboard.writeText(`# The TSP class automatically creates the QUBO formulation
qubo = tsp.qubo

# Examine the QUBO matrix
print(f"QUBO matrix shape: {qubo.Q.shape}")
print(f"Number of variables: {qubo.num_variables}")

# Visualize the QUBO matrix structure
plt.figure(figsize=(8, 6))
plt.imshow(qubo.Q, cmap='viridis')
plt.colorbar()
plt.title("QUBO Matrix for TSP")
plt.show()`)
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
                      <code>{`# The TSP class automatically creates the QUBO formulation
qubo = tsp.qubo

# Examine the QUBO matrix
print(f"QUBO matrix shape: {qubo.Q.shape}")
print(f"Number of variables: {qubo.num_variables}")

# Visualize the QUBO matrix structure
plt.figure(figsize=(8, 6))
plt.imshow(qubo.Q, cmap='viridis')
plt.colorbar()
plt.title("QUBO Matrix for TSP")
plt.show()`}</code>
                    </pre>
                  </div>

                  <h3 className="text-xl font-medium mb-3">3. Solving the Problem</h3>
                  <div className="bg-secondary/50 p-3 rounded-md font-mono text-sm mb-4 relative group shadow-sm border border-border/30">
                    <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => {
                          navigator.clipboard.writeText(`# Choose a solver
solver = qb.SimulatedAnnealingSolver(
    num_reads=100,
    temperature_range=(10.0, 0.1)
)

# Solve the QUBO problem
result = solver.solve(qubo)

# Extract the tour from the solution
tour = tsp.get_tour_from_solution(result.solution)
print(f"Optimal tour: {tour}")

# Calculate the tour length
tour_length = tsp.evaluate_tour(tour)
print(f"Tour length: {tour_length:.4f}")

# Visualize the solution
plt.figure(figsize=(8, 6))
tsp.plot_solution(result.solution, coords=coords)
plt.title(f"Optimal TSP Tour (Length: {tour_length:.4f})")
plt.show()`)
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
                      <code>{`# Choose a solver
solver = qb.SimulatedAnnealingSolver(
    num_reads=100,
    temperature_range=(10.0, 0.1)
)

# Solve the QUBO problem
result = solver.solve(qubo)

# Extract the tour from the solution
tour = tsp.get_tour_from_solution(result.solution)
print(f"Optimal tour: {tour}")

# Calculate the tour length
tour_length = tsp.evaluate_tour(tour)
print(f"Tour length: {tour_length:.4f}")

# Visualize the solution
plt.figure(figsize=(8, 6))
tsp.plot_solution(result.solution, coords=coords)
plt.title(f"Optimal TSP Tour (Length: {tour_length:.4f})")
plt.show()`}</code>
                    </pre>
                  </div>
                </CardContent>
              </Card>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">Advanced Techniques</h2>
              <Card>
                <CardContent className="pt-6">
                  <h3 className="text-xl font-medium mb-3">1. Comparing Different Solvers</h3>
                  <div className="bg-secondary/50 p-3 rounded-md font-mono text-sm mb-4 relative group shadow-sm border border-border/30">
                    <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => {
                          navigator.clipboard.writeText(`# Define solvers to compare
solvers = [
    ("Simulated Annealing", qb.SimulatedAnnealingSolver(num_reads=100)),
    ("QAOA", qb.QAOASolver(num_reads=20, p=2)),
    ("Tabu Search", qb.TabuSearchSolver(num_reads=50))
]

# Compare results
results = []
for name, solver in solvers:
    result = solver.solve(qubo)
    tour = tsp.get_tour_from_solution(result.solution)
    length = tsp.evaluate_tour(tour)
    results.append((name, tour, length, result.execution_time))
    print(f"{name}: Tour={tour}, Length={length:.4f}, Time={result.execution_time:.4f}s")

# Plot comparison
names = [r[0] for r in results]
lengths = [r[2] for r in results]
times = [r[3] for r in results]

fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(12, 5))
ax1.bar(names, lengths)
ax1.set_ylabel("Tour Length")
ax1.set_title("Solution Quality")

ax2.bar(names, times)
ax2.set_ylabel("Execution Time (s)")
ax2.set_title("Performance")

plt.tight_layout()
plt.show()`)
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
                      <code>{`# Define solvers to compare
solvers = [
    ("Simulated Annealing", qb.SimulatedAnnealingSolver(num_reads=100)),
    ("QAOA", qb.QAOASolver(num_reads=20, p=2)),
    ("Tabu Search", qb.TabuSearchSolver(num_reads=50))
]

# Compare results
results = []
for name, solver in solvers:
    result = solver.solve(qubo)
    tour = tsp.get_tour_from_solution(result.solution)
    length = tsp.evaluate_tour(tour)
    results.append((name, tour, length, result.execution_time))
    print(f"{name}: Tour={tour}, Length={length:.4f}, Time={result.execution_time:.4f}s")

# Plot comparison
names = [r[0] for r in results]
lengths = [r[2] for r in results]
times = [r[3] for r in results]

fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(12, 5))
ax1.bar(names, lengths)
ax1.set_ylabel("Tour Length")
ax1.set_title("Solution Quality")

ax2.bar(names, times)
ax2.set_ylabel("Execution Time (s)")
ax2.set_title("Performance")

plt.tight_layout()
plt.show()`}</code>
                    </pre>
                  </div>

                  <h3 className="text-xl font-medium mb-3">2. Handling Larger Problems</h3>
                  <div className="bg-secondary/50 p-3 rounded-md font-mono text-sm mb-4 relative group shadow-sm border border-border/30">
                    <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => {
                          navigator.clipboard.writeText(`# For larger problems, we can use decomposition techniques
n_cities = 20
G_large = nx.complete_graph(n_cities)

# Assign random coordinates
coords_large = {i: (np.random.random(), np.random.random()) for i in range(n_cities)}
for i, j in G_large.edges():
    G_large[i][j]['weight'] = np.sqrt(
        (coords_large[i][0] - coords_large[j][0])**2 + 
        (coords_large[i][1] - coords_large[j][1])**2
    )

# Create TSP problem
tsp_large = qb.problems.TSP(G_large)

# Use hierarchical solver for large problems
hierarchical_solver = qb.HierarchicalSolver(
    base_solver=qb.SimulatedAnnealingSolver(),
    decomposition_size=10
)

# Solve
result_large = hierarchical_solver.solve(tsp_large.qubo)

# Extract and evaluate tour
tour_large = tsp_large.get_tour_from_solution(result_large.solution)
length_large = tsp_large.evaluate_tour(tour_large)
print(f"Large TSP tour length: {length_large:.4f}")

# Visualize
plt.figure(figsize=(10, 8))
tsp_large.plot_solution(result_large.solution, coords=coords_large)
plt.title(f"Large TSP Solution (n={n_cities}, Length={length_large:.4f})")
plt.show()`)
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
                      <code>{`# For larger problems, we can use decomposition techniques
n_cities = 20
G_large = nx.complete_graph(n_cities)

# Assign random coordinates
coords_large = {i: (np.random.random(), np.random.random()) for i in range(n_cities)}
for i, j in G_large.edges():
    G_large[i][j]['weight'] = np.sqrt(
        (coords_large[i][0] - coords_large[j][0])**2 + 
        (coords_large[i][1] - coords_large[j][1])**2
    )

# Create TSP problem
tsp_large = qb.problems.TSP(G_large)

# Use hierarchical solver for large problems
hierarchical_solver = qb.HierarchicalSolver(
    base_solver=qb.SimulatedAnnealingSolver(),
    decomposition_size=10
)

# Solve
result_large = hierarchical_solver.solve(tsp_large.qubo)

# Extract and evaluate tour
tour_large = tsp_large.get_tour_from_solution(result_large.solution)
length_large = tsp_large.evaluate_tour(tour_large)
print(f"Large TSP tour length: {length_large:.4f}")

# Visualize
plt.figure(figsize=(10, 8))
tsp_large.plot_solution(result_large.solution, coords=coords_large)
plt.title(f"Large TSP Solution (n={n_cities}, Length={length_large:.4f})")
plt.show()`}</code>
                    </pre>
                  </div>

                  <h3 className="text-xl font-medium mb-3">3. Custom Penalty Tuning</h3>
                  <div className="bg-secondary/50 p-3 rounded-md font-mono text-sm mb-4 relative group shadow-sm border border-border/30">
                    <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => {
                          navigator.clipboard.writeText(`# Create TSP with custom penalty coefficients
tsp_custom = qb.problems.TSP(
    G, 
    constraint_penalty=5.0,  # Penalty for constraint violations
    lagrange_multiplier=2.0  # Weight for the objective function
)

# Compare with default penalties
qubo_default = tsp.qubo
qubo_custom = tsp_custom.qubo

# Solve both and compare
solver = qb.SimulatedAnnealingSolver(num_reads=50)
result_default = solver.solve(qubo_default)
result_custom = solver.solve(qubo_custom)

# Extract tours
tour_default = tsp.get_tour_from_solution(result_default.solution)
tour_custom = tsp_custom.get_tour_from_solution(result_custom.solution)

# Compare results
length_default = tsp.evaluate_tour(tour_default)
length_custom = tsp_custom.evaluate_tour(tour_custom)

print(f"Default penalties: Tour={tour_default}, Length={length_default:.4f}")
print(f"Custom penalties: Tour={tour_custom}, Length={length_custom:.4f}")`)
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
                      <code>{`# Create TSP with custom penalty coefficients
tsp_custom = qb.problems.TSP(
    G, 
    constraint_penalty=5.0,  # Penalty for constraint violations
    lagrange_multiplier=2.0  # Weight for the objective function
)

# Compare with default penalties
qubo_default = tsp.qubo
qubo_custom = tsp_custom.qubo

# Solve both and compare
solver = qb.SimulatedAnnealingSolver(num_reads=50)
result_default = solver.solve(qubo_default)
result_custom = solver.solve(qubo_custom)

# Extract tours
tour_default = tsp.get_tour_from_solution(result_default.solution)
tour_custom = tsp_custom.get_tour_from_solution(result_custom.solution)

# Compare results
length_default = tsp.evaluate_tour(tour_default)
length_custom = tsp_custom.evaluate_tour(tour_custom)

print(f"Default penalties: Tour={tour_default}, Length={length_default:.4f}")
print(f"Custom penalties: Tour={tour_custom}, Length={length_custom:.4f}")`}</code>
                    </pre>
                  </div>
                </CardContent>
              </Card>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">Real-World Applications</h2>
              <Card>
                <CardContent className="pt-6">
                  <p className="mb-4">TSP has numerous real-world applications:</p>
                  <ul className="list-disc pl-5 space-y-2 mb-4">
                    <li>
                      <strong>Logistics and Delivery:</strong> Optimizing routes for package delivery
                    </li>
                    <li>
                      <strong>Manufacturing:</strong> Optimizing tool paths in CNC machines
                    </li>
                    <li>
                      <strong>Circuit Board Design:</strong> Minimizing wire lengths in PCB design
                    </li>
                    <li>
                      <strong>Genome Sequencing:</strong> Ordering DNA fragments
                    </li>
                  </ul>

                  <h3 className="text-xl font-medium mb-3">Example: Delivery Route Optimization</h3>
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
import matplotlib.pyplot as plt
import folium

# Real-world example: Delivery locations in a city
# Coordinates (latitude, longitude) for delivery locations
locations = {
    "Warehouse": (40.7128, -74.0060),  # New York
    "Customer A": (40.7282, -73.9942),
    "Customer B": (40.7411, -74.0018),
    "Customer C": (40.7214, -73.9896),
    "Customer D": (40.7069, -74.0113),
    "Customer E": (40.7308, -73.9973),
}

# Create a complete graph
G_delivery = nx.complete_graph(len(locations))

# Rename nodes to location names
mapping = {i: name for i, name in enumerate(locations.keys())}
G_delivery = nx.relabel_nodes(G_delivery, mapping)

# Calculate distances (using Haversine formula for geographic coordinates)
for u, v in G_delivery.edges():
    lat1, lon1 = locations[u]
    lat2, lon2 = locations[v]
    
    # Haversine formula
    R = 6371  # Earth radius in km
    dLat = np.radians(lat2 - lat1)
    dLon = np.radians(lon2 - lon1)
    a = (np.sin(dLat/2) * np.sin(dLat/2) + 
         np.cos(np.radians(lat1)) * np.cos(np.radians(lat2)) * 
         np.sin(dLon/2) * np.sin(dLon/2))
    c = 2 * np.arctan2(np.sqrt(a), np.sqrt(1-a))
    distance = R * c  # Distance in km
    
    G_delivery[u][v]['weight'] = distance

# Create TSP problem
tsp_delivery = qb.problems.TSP(G_delivery)

# Solve the problem
solver = qb.SimulatedAnnealingSolver(num_reads=100)
result_delivery = solver.solve(tsp_delivery.qubo)

# Extract the tour
tour_delivery = tsp_delivery.get_tour_from_solution(result_delivery.solution)
tour_names = [list(locations.keys())[i] for i in tour_delivery]
print(f"Optimal delivery route: {' -> '.join(tour_names)}")

# Calculate total distance
total_distance = tsp_delivery.evaluate_tour(tour_delivery)
print(f"Total distance: {total_distance:.2f} km")

# Visualize on a map
m = folium.Map(location=[40.7128, -74.0060], zoom_start=13)

# Add markers for each location
for name, (lat, lon) in locations.items():
    folium.Marker(
        [lat, lon], 
        popup=name,
        icon=folium.Icon(color='blue' if name != 'Warehouse' else 'red')
    ).add_to(m)

# Add the route as a polyline
route_coords = []
for i in tour_delivery:
    name = list(locations.keys())[i]
    route_coords.append(locations[name])

# Close the loop
route_coords.append(route_coords[0])

folium.PolyLine(
    route_coords,
    color='green',
    weight=5,
    opacity=0.8
).add_to(m)

# Save the map
m.save('delivery_route.html')
print("Map saved to delivery_route.html")`)
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
import matplotlib.pyplot as plt
import folium

# Real-world example: Delivery locations in a city
# Coordinates (latitude, longitude) for delivery locations
locations = {
    "Warehouse": (40.7128, -74.0060),  # New York
    "Customer A": (40.7282, -73.9942),
    "Customer B": (40.7411, -74.0018),
    "Customer C": (40.7214, -73.9896),
    "Customer D": (40.7069, -74.0113),
    "Customer E": (40.7308, -73.9973),
}

# Create a complete graph
G_delivery = nx.complete_graph(len(locations))

# Rename nodes to location names
mapping = {i: name for i, name in enumerate(locations.keys())}
G_delivery = nx.relabel_nodes(G_delivery, mapping)

# Calculate distances (using Haversine formula for geographic coordinates)
for u, v in G_delivery.edges():
    lat1, lon1 = locations[u]
    lat2, lon2 = locations[v]
    
    # Haversine formula
    R = 6371  # Earth radius in km
    dLat = np.radians(lat2 - lat1)
    dLon = np.radians(lon2 - lon1)
    a = (np.sin(dLat/2) * np.sin(dLat/2) + 
         np.cos(np.radians(lat1)) * np.cos(np.radians(lat2)) * 
         np.sin(dLon/2) * np.sin(dLon/2))
    c = 2 * np.arctan2(np.sqrt(a), np.sqrt(1-a))
    distance = R * c  # Distance in km
    
    G_delivery[u][v]['weight'] = distance

# Create TSP problem
tsp_delivery = qb.problems.TSP(G_delivery)

# Solve the problem
solver = qb.SimulatedAnnealingSolver(num_reads=100)
result_delivery = solver.solve(tsp_delivery.qubo)

# Extract the tour
tour_delivery = tsp_delivery.get_tour_from_solution(result_delivery.solution)
tour_names = [list(locations.keys())[i] for i in tour_delivery]
print(f"Optimal delivery route: {' -> '.join(tour_names)}")

# Calculate total distance
total_distance = tsp_delivery.evaluate_tour(tour_delivery)
print(f"Total distance: {total_distance:.2f} km")

# Visualize on a map
m = folium.Map(location=[40.7128, -74.0060], zoom_start=13)

# Add markers for each location
for name, (lat, lon) in locations.items():
    folium.Marker(
        [lat, lon], 
        popup=name,
        icon=folium.Icon(color='blue' if name != 'Warehouse' else 'red')
    ).add_to(m)

# Add the route as a polyline
route_coords = []
for i in tour_delivery:
    name = list(locations.keys())[i]
    route_coords.append(locations[name])

# Close the loop
route_coords.append(route_coords[0])

folium.PolyLine(
    route_coords,
    color='green',
    weight=5,
    opacity=0.8
).add_to(m)

# Save the map
m.save('delivery_route.html')
print("Map saved to delivery_route.html")`}</code>
                    </pre>
                  </div>
                </CardContent>
              </Card>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">Conclusion</h2>
              <Card>
                <CardContent className="pt-6">
                  <p className="mb-4">In this tutorial, we've learned how to:</p>
                  <ul className="list-disc pl-5 space-y-2 mb-4">
                    <li>Formulate the Traveling Salesman Problem as a QUBO problem</li>
                    <li>Use Qubots to solve TSP with quantum-inspired optimization</li>
                    <li>Apply advanced techniques for larger problems</li>
                    <li>Implement TSP solutions for real-world applications</li>
                  </ul>
                  <p className="mb-4">
                    The TSP is just one example of how Qubots can transform complex optimization problems into a format
                    suitable for quantum and quantum-inspired solvers. The same principles can be applied to many other
                    optimization challenges.
                  </p>
                  <p>For more examples and tutorials, check out our other documentation pages and example notebooks.</p>
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
                      <h3 className="text-xl font-medium">Explore Other Problems</h3>
                    </div>
                    <p className="mb-4">
                      Learn how to solve other optimization problems like MaxCut, Graph Coloring, and more.
                    </p>
                    <Button variant="outline" size="sm" asChild>
                      <a href="/docs/problem-library">
                        View Problem Library
                        <ArrowLeft className="ml-2 h-4 w-4 rotate-180" />
                      </a>
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2 mb-3">
                      <FileText className="h-5 w-5 text-primary" />
                      <h3 className="text-xl font-medium">Advanced Solvers</h3>
                    </div>
                    <p className="mb-4">Explore advanced solver options and performance tuning techniques.</p>
                    <Button variant="outline" size="sm" asChild>
                      <a href="/docs/advanced-solvers">
                        View Advanced Solvers Guide
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

export default TspTutorialDoc

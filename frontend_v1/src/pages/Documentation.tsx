"use client"

import { useState, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { motion } from "framer-motion"
import Layout from "@/components/Layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Search, FileText, Code, BookOpen, Cpu, Lightbulb, ArrowRight, ChevronRight, Home, Menu, X } from "lucide-react"

// Documentation structure
const documentationStructure = [
  {
    title: "Getting Started",
    icon: <Home className="h-4 w-4" />,
    items: [
      { title: "Introduction", slug: "introduction" },
      { title: "Installation", slug: "installation" },
      { title: "Quick Start", slug: "quick-start" },
    ],
  },
  {
    title: "Core Concepts",
    icon: <Cpu className="h-4 w-4" />,
    items: [
      { title: "Optimization Problems", slug: "optimization-problems" },
      { title: "QUBO Format", slug: "qubo-format" },
      { title: "Solvers", slug: "solvers" },
    ],
  },
  {
    title: "Tutorials",
    icon: <BookOpen className="h-4 w-4" />,
    items: [
      { title: "Traveling Salesman Problem", slug: "tsp-tutorial" },
      { title: "Portfolio Optimization", slug: "portfolio-optimization" },
      { title: "Job Shop Scheduling", slug: "job-shop-scheduling" },
      { title: "Vehicle Routing Problem", slug: "vrp-tutorial" },
    ],
  },
  {
    title: "API Reference",
    icon: <Code className="h-4 w-4" />,
    items: [
      { title: "Problem Class", slug: "problem-class" },
      { title: "Solver Interface", slug: "solver-interface" },
      { title: "Utility Functions", slug: "utility-functions" },
      { title: "Configuration", slug: "configuration" },
    ],
  },
  {
    title: "Advanced Topics",
    icon: <Lightbulb className="h-4 w-4" />,
    items: [
      { title: "Custom Problem Types", slug: "custom-problem-types" },
      { title: "Algorithm Integration", slug: "algorithm-integration" },
      { title: "Performance Optimization", slug: "performance-optimization" },
      { title: "Deployment", slug: "deployment" },
    ],
  },
]

// Sample documentation content
const documentationContent = {
  introduction: {
    title: "Introduction to Qubots",
    description: "Learn about the Qubots platform and how it can help you solve optimization problems.",
    content: `
# Introduction to Qubots

Qubots is a platform designed to help you solve complex optimization problems using quantum-inspired algorithms. Whether you're working on logistics, finance, manufacturing, or any other domain that involves optimization, Qubots provides the tools and infrastructure to model your problems and find high-quality solutions efficiently.

## What is Qubots?

Qubots is our platform for transforming classical optimization problems into formats suitable for quantum and quantum-inspired solvers. It provides:

- Tools to convert optimization problems to QUBO format
- Interfaces to various quantum and classical solvers
- Pre-built templates for common optimization problems
- Performance analysis and visualization tools

## Key Features

- **Problem Modeling**: Define your optimization problems using a simple, intuitive API
- **Solver Integration**: Connect to a variety of solvers, from classical to quantum
- **Performance Analysis**: Compare different solvers and parameter settings
- **Visualization**: Visualize your problems and solutions
- **Extensibility**: Add your own problem types and solvers

## Who is Qubots for?

Qubots is designed for:

- **Researchers** exploring new optimization algorithms
- **Data Scientists** solving complex optimization problems
- **Software Engineers** integrating optimization into applications
- **Domain Experts** in logistics, finance, manufacturing, etc.

## Getting Started

To get started with Qubots, check out the [Installation](/docs/installation) and [Quick Start](/docs/quick-start) guides.
    `,
  },
  installation: {
    title: "Installation",
    description: "Learn how to install and set up Qubots on your system.",
    content: `
# Installation

Getting Qubots up and running on your system is straightforward. Follow these steps to install the library and its dependencies.

## System Requirements

- Python 3.8 or higher
- pip (Python package installer)
- Optional: CUDA-compatible GPU for accelerated performance

## Installing with pip

The easiest way to install Qubots is using pip:

\`\`\`bash
pip install qubots
\`\`\`

This will install the core Qubots library and its required dependencies.

## Installing with Optional Dependencies

For additional features, you can install Qubots with optional dependencies:

\`\`\`bash
# For visualization support
pip install qubots[viz]

# For all optional dependencies
pip install qubots[all]
\`\`\`

## Installing from Source

To install the latest development version from source:

\`\`\`bash
git clone https://github.com/qubots/qubots.git
cd qubots
pip install -e .
\`\`\`

## Verifying Installation

To verify that Qubots is installed correctly, run:

\`\`\`python
import qubots
print(qubots.__version__)
\`\`\`

## Next Steps

Now that you have Qubots installed, check out the [Quick Start](/docs/quick-start) guide to begin solving optimization problems.
    `,
  },
  "quick-start": {
    title: "Quick Start",
    description: "Get up and running with Qubots in minutes.",
    content: `
# Quick Start

This guide will help you get started with Qubots by walking through a simple example of solving an optimization problem.

## Basic Workflow

The typical workflow with Qubots involves:

1. Define your optimization problem
2. Convert it to QUBO format
3. Solve using a quantum-inspired solver
4. Analyze the results

Let's see this in action with a simple example.

## Example: Solving a MaxCut Problem

The MaxCut problem involves partitioning a graph's vertices into two sets to maximize the number of edges between the sets.

### Step 1: Import Qubots

\`\`\`python
import qubots as qb
import networkx as nx
import numpy as np
import matplotlib.pyplot as plt
\`\`\`

### Step 2: Create a Graph

\`\`\`python
# Create a random graph
G = nx.random_regular_graph(3, 10)

# Visualize the graph
plt.figure(figsize=(8, 6))
nx.draw(G, with_labels=True, node_color='lightblue', 
       node_size=500, font_weight='bold')
plt.title("Random Graph")
plt.show()
\`\`\`

### Step 3: Define the MaxCut Problem

\`\`\`python
# Create a MaxCut problem instance
maxcut = qb.problems.MaxCut(G)
\`\`\`

### Step 4: Solve the Problem

\`\`\`python
# Choose a solver
solver = qb.SimulatedAnnealingSolver(num_reads=100)

# Solve the problem
result = solver.solve(maxcut.qubo)

# Extract the cut
cut = maxcut.get_cut_from_solution(result.solution)
print(f"Cut value: {maxcut.evaluate_cut(cut)}")
\`\`\`

### Step 5: Visualize the Solution

\`\`\`python
# Visualize the solution
plt.figure(figsize=(8, 6))
maxcut.plot_solution(result.solution)
plt.title("MaxCut Solution")
plt.show()
\`\`\`

## Next Steps

This is just a simple example to get you started. For more complex problems and advanced features, check out the [Tutorials](/docs/tutorials) section.
    `,
  },
  "qubo-format": {
    title: "QUBO Format",
    description: "Learn about the Quadratic Unconstrained Binary Optimization format and how to use it.",
    content: `
# QUBO Format

Quadratic Unconstrained Binary Optimization (QUBO) is a formulation used to represent combinatorial optimization problems. It's particularly important because quantum annealing hardware and many quantum-inspired algorithms are designed to solve problems in this format.

## What is QUBO?

A QUBO problem is expressed as minimizing a function of binary variables:

$$\\min f(x) = x^T Q x$$

Where:
- $x$ is a vector of binary variables (0 or 1)
- $Q$ is a matrix of weights that defines the problem

## Why QUBO?

QUBO is important for several reasons:

1. **Universality**: Many NP-hard problems can be formulated as QUBO
2. **Hardware Compatibility**: Quantum annealers like D-Wave are designed to solve QUBO problems
3. **Algorithm Compatibility**: Many quantum-inspired algorithms are optimized for QUBO

## Converting Problems to QUBO

Qubots provides several ways to convert optimization problems to QUBO format:

### Using the Problem Class

\`\`\`python
import qubots as qb

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
print(qubo.Q)
\`\`\`

### Using Pre-built Problem Types

\`\`\`python
import qubots as qb
import networkx as nx

# Create a graph for MaxCut problem
G = nx.random_regular_graph(3, 10)

# Create a MaxCut problem instance
maxcut = qb.problems.MaxCut(G)

# The problem is already in QUBO format
qubo = maxcut.qubo
\`\`\`

## Handling Constraints

Converting constrained problems to QUBO requires penalty methods. Qubots handles this automatically, but understanding the process helps in fine-tuning:

### Equality Constraints

For a constraint like a = b + c, we add a penalty term:

$$P_{eq} = A(a - b - c)^2$$

Where A is a sufficiently large penalty coefficient.

### Inequality Constraints

For a constraint like a + b ≤ 1, we introduce a slack variable s:

$$a + b + s = 1, \\text{where } s \\geq 0$$

Then we convert this to a penalty term in the QUBO formulation.

## Next Steps

For more details on specific problem types and how to convert them to QUBO, check out the [Tutorials](/docs/tutorials) section.
    `,
  },
  "tsp-tutorial": {
    title: "Traveling Salesman Problem Tutorial",
    description: "Learn how to solve the Traveling Salesman Problem using Qubots.",
    content: `
# Solving the Traveling Salesman Problem

The Traveling Salesman Problem (TSP) is one of the most studied combinatorial optimization problems. It asks:

> "Given a list of cities and the distances between each pair of cities, what is the shortest possible route that visits each city exactly once and returns to the origin city?"

This tutorial will show you how to solve TSP using Qubots.

## Problem Overview

TSP has applications in logistics, planning, manufacturing, DNA sequencing, and many other fields. It's an NP-hard problem, meaning it's computationally difficult to solve optimally for large instances.

## Mathematical Formulation

To formulate TSP as a QUBO problem, we need to:

1. Represent the problem using binary variables
2. Express the objective function (minimize total distance)
3. Express constraints (visit each city once, complete tour)
4. Combine everything into a QUBO matrix

### Binary Representation

We use binary variables $x_{i,p}$ where:
- $x_{i,p} = 1$ if city i is visited at position p in the tour
- $x_{i,p} = 0$ otherwise

For n cities, we need n² binary variables.

### Constraints

We need to enforce:
1. Each city is visited exactly once: $\\sum_p x_{i,p} = 1$ for all i
2. Each position in the tour has exactly one city: $\\sum_i x_{i,p} = 1$ for all p

### Objective Function

The objective is to minimize the total distance:

$$\\min \\sum_{i,j,p} d_{i,j} \\cdot x_{i,p} \\cdot x_{j,(p+1) \\mod n}$$

Where $d_{i,j}$ is the distance between cities i and j.

## Implementation with Qubots

Qubots simplifies this process by providing a built-in TSP problem class:

### Setting Up the Problem

\`\`\`python
import qubots as qb
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
plt.show()
\`\`\`

### Converting to QUBO

\`\`\`python
# The TSP class automatically creates the QUBO formulation
qubo = tsp.qubo

# Examine the QUBO matrix
print(f"QUBO matrix shape: {qubo.Q.shape}")
print(f"Number of variables: {qubo.num_variables}")

# Visualize the QUBO matrix structure
plt.figure(figsize=(8, 6))
plt.imshow(qubo.Q, cmap='viridis')
plt.colorbar()
plt.title("QUBO Matrix for TSP")
plt.show()
\`\`\`

### Solving the Problem

\`\`\`python
# Choose a solver
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
plt.show()
\`\`\`

## Advanced Techniques

For larger problems, you might want to use more advanced techniques:

\`\`\`python
# For larger problems, we can use decomposition techniques
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
\`\`\`

## Conclusion

This tutorial showed how to solve the Traveling Salesman Problem using Qubots. The same principles can be applied to many other optimization problems.

For more examples and tutorials, check out the other documentation pages.
    `,
  },
}

const DocumentationPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchQuery, setSearchQuery] = useState("")
  const [currentDoc, setCurrentDoc] = useState("introduction")
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchResults, setSearchResults] = useState<Array<{ slug: string; title: string; section: string }>>([])

  // Extract the slug from the URL if present
  useEffect(() => {
    const pathParts = location.pathname.split("/")
    const slug = pathParts[pathParts.length - 1]

    if (slug && documentationContent[slug]) {
      setCurrentDoc(slug)
    } else if (location.pathname === "/docs" || location.pathname === "/docs/") {
      setCurrentDoc("introduction")
    }
  }, [location])

  // Handle search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      return
    }

    const query = searchQuery.toLowerCase()
    const results: Array<{ slug: string; title: string; section: string }> = []

    // Search in all documentation content
    Object.entries(documentationContent).forEach(([slug, doc]) => {
      if (doc.title.toLowerCase().includes(query) || doc.description.toLowerCase().includes(query)) {
        // Find which section this doc belongs to
        let section = ""
        for (const category of documentationStructure) {
          const item = category.items.find((item) => item.slug === slug)
          if (item) {
            section = category.title
            break
          }
        }

        results.push({
          slug,
          title: doc.title,
          section,
        })
      }
    })

    setSearchResults(results)
  }, [searchQuery])

  // Navigate to a documentation page
  const navigateToDoc = (slug: string) => {
    setCurrentDoc(slug)
    navigate(`/docs/${slug}`)
    setMobileMenuOpen(false)
    setSearchQuery("")
    setSearchResults([])
  }

  // Get the current documentation content
  const currentDocContent = documentationContent[currentDoc]

  // Find the current section and item
  let currentSection = ""
  let currentSectionTitle = ""
  for (const section of documentationStructure) {
    const item = section.items.find((item) => item.slug === currentDoc)
    if (item) {
      currentSection = section.title
      currentSectionTitle = item.title
      break
    }
  }

  // Process markdown content to handle code blocks
  const processContent = (content: string) => {
    // Split content by code blocks
    const parts = content.split(/```(\w+)?\n/)

    return parts.map((part, index) => {
      if (index % 3 === 0) {
        // Regular text content
        return <div key={index} dangerouslySetInnerHTML={{ __html: markdownToHtml(part) }} />
      } else if (index % 3 === 1) {
        // Language identifier
        return null
      } else {
        // Code block content
        const language = parts[index - 1] || "text"
        return (
          <div key={index} className="my-4 rounded-md overflow-hidden">
            <div className="bg-muted px-4 py-2 text-sm font-medium border-b">{language}</div>
            <pre className="p-4 bg-muted/50 overflow-x-auto">
              <code>{part}</code>
            </pre>
          </div>
        )
      }
    })
  }

  // Simple markdown to HTML converter
  const markdownToHtml = (markdown: string) => {
    let html = markdown

    // Headers
    html = html.replace(/^# (.*$)/gm, '<h1 class="text-3xl font-bold mt-8 mb-4">$1</h1>')
    html = html.replace(/^## (.*$)/gm, '<h2 class="text-2xl font-bold mt-6 mb-3">$1</h2>')
    html = html.replace(/^### (.*$)/gm, '<h3 class="text-xl font-bold mt-5 mb-2">$1</h3>')

    // Bold and italic
    html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    html = html.replace(/\*(.*?)\*/g, "<em>$1</em>")

    // Lists
    html = html.replace(/^\s*\d+\.\s+(.*$)/gm, '<li class="ml-6 list-decimal mb-1">$1</li>')
    html = html.replace(/^\s*-\s+(.*$)/gm, '<li class="ml-6 list-disc mb-1">$1</li>')

    // Links
    html = html.replace(/\[(.*?)\]$$(.*?)$$/g, '<a href="$2" class="text-primary hover:underline">$1</a>')

    // Blockquotes
    html = html.replace(
      /^>\s+(.*$)/gm,
      '<blockquote class="border-l-4 border-primary pl-4 italic my-4">$1</blockquote>',
    )

    // Paragraphs
    html = html.replace(/^(?!<[a-z])/gm, '<p class="mb-4">')
    html = html.replace(/^(?!<\/[a-z])/gm, "</p>")

    return html
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 mt-24">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Mobile menu button */}
          <div className="md:hidden flex justify-between items-center mb-4">
            <Button variant="outline" size="sm" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="h-4 w-4 mr-2" /> : <Menu className="h-4 w-4 mr-2" />}
              {mobileMenuOpen ? "Close Menu" : "Documentation Menu"}
            </Button>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search docs..."
                className="w-full pl-10 py-2 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />

              {searchResults.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-background border border-border rounded-md shadow-lg">
                  <div className="p-2">
                    {searchResults.map((result) => (
                      <button
                        key={result.slug}
                        className="w-full text-left px-3 py-2 hover:bg-muted rounded-md flex flex-col"
                        onClick={() => navigateToDoc(result.slug)}
                      >
                        <span className="font-medium">{result.title}</span>
                        <span className="text-xs text-muted-foreground">{result.section}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className={`md:w-64 flex-shrink-0 ${mobileMenuOpen ? "block" : "hidden md:block"}`}>
            <div className="sticky top-24">
              <div className="hidden md:block mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search documentation..."
                    className="w-full pl-10 py-2 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />

                  {searchResults.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-background border border-border rounded-md shadow-lg">
                      <div className="p-2">
                        {searchResults.map((result) => (
                          <button
                            key={result.slug}
                            className="w-full text-left px-3 py-2 hover:bg-muted rounded-md flex flex-col"
                            onClick={() => navigateToDoc(result.slug)}
                          >
                            <span className="font-medium">{result.title}</span>
                            <span className="text-xs text-muted-foreground">{result.section}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <Card>
                <CardContent className="p-0">
                  <ScrollArea className="h-[calc(100vh-200px)]">
                    <div className="p-4">
                      {documentationStructure.map((section) => (
                        <div key={section.title} className="mb-6">
                          <h3 className="font-medium text-sm flex items-center mb-2 text-muted-foreground">
                            {section.icon}
                            <span className="ml-2">{section.title}</span>
                          </h3>
                          <ul className="space-y-1">
                            {section.items.map((item) => (
                              <li key={item.slug}>
                                <button
                                  className={`w-full text-left px-3 py-1.5 rounded-md text-sm flex items-center ${
                                    currentDoc === item.slug
                                      ? "bg-primary/10 text-primary font-medium"
                                      : "hover:bg-muted"
                                  }`}
                                  onClick={() => navigateToDoc(item.slug)}
                                >
                                  {currentDoc === item.slug && <ChevronRight className="h-3 w-3 mr-1 flex-shrink-0" />}
                                  <span className={currentDoc === item.slug ? "ml-0" : "ml-4"}>{item.title}</span>
                                </button>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Main content */}
          <div className="flex-1">
            {currentDocContent ? (
              <motion.div
                key={currentDoc}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="mb-6">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <Button
                      variant="link"
                      className="p-0 h-auto text-muted-foreground"
                      onClick={() => navigateToDoc("introduction")}
                    >
                      Docs
                    </Button>
                    <ChevronRight className="h-3 w-3" />
                    <Button variant="link" className="p-0 h-auto text-muted-foreground">
                      {currentSection}
                    </Button>
                    <ChevronRight className="h-3 w-3" />
                    <span>{currentSectionTitle}</span>
                  </div>

                  <h1 className="text-3xl font-bold mb-2">{currentDocContent.title}</h1>
                  <p className="text-muted-foreground">{currentDocContent.description}</p>
                </div>

                <Card>
                  <CardContent className="p-6">
                    <div className="prose prose-sm md:prose max-w-none dark:prose-invert">
                      {processContent(currentDocContent.content)}
                    </div>
                  </CardContent>
                </Card>

                {/* Navigation between docs */}
                <div className="mt-8 flex flex-col sm:flex-row justify-between gap-4">
                  {getPreviousDoc(currentDoc) && (
                    <Button
                      variant="outline"
                      className="flex items-center"
                      onClick={() => navigateToDoc(getPreviousDoc(currentDoc))}
                    >
                      <ArrowRight className="h-4 w-4 mr-2 rotate-180" />
                      Previous: {getPreviousDocTitle(currentDoc)}
                    </Button>
                  )}

                  {getNextDoc(currentDoc) && (
                    <Button
                      variant="outline"
                      className="flex items-center ml-auto"
                      onClick={() => navigateToDoc(getNextDoc(currentDoc))}
                    >
                      Next: {getNextDocTitle(currentDoc)}
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  )}
                </div>
              </motion.div>
            ) : (
              <div className="flex items-center justify-center h-[60vh]">
                <div className="text-center">
                  <FileText className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
                  <h3 className="text-xl font-medium">Documentation not found</h3>
                  <p className="text-muted-foreground mt-2 mb-6">
                    The documentation page you're looking for doesn't exist or has been moved.
                  </p>
                  <Button onClick={() => navigateToDoc("introduction")}>Go to Introduction</Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}

// Helper functions to get previous and next docs
function getPreviousDoc(currentSlug: string): string | null {
  let prevSlug: string | null = null
  const found = false

  // Flatten the documentation structure
  const allDocs: string[] = []
  documentationStructure.forEach((section) => {
    section.items.forEach((item) => {
      allDocs.push(item.slug)
    })
  })

  // Find the previous doc
  for (let i = 0; i < allDocs.length; i++) {
    if (allDocs[i] === currentSlug) {
      if (i > 0) {
        prevSlug = allDocs[i - 1]
      }
      break
    }
  }

  return prevSlug
}

function getNextDoc(currentSlug: string): string | null {
  let nextSlug: string | null = null

  // Flatten the documentation structure
  const allDocs: string[] = []
  documentationStructure.forEach((section) => {
    section.items.forEach((item) => {
      allDocs.push(item.slug)
    })
  })

  // Find the next doc
  for (let i = 0; i < allDocs.length; i++) {
    if (allDocs[i] === currentSlug) {
      if (i < allDocs.length - 1) {
        nextSlug = allDocs[i + 1]
      }
      break
    }
  }

  return nextSlug
}

function getPreviousDocTitle(currentSlug: string): string {
  const prevSlug = getPreviousDoc(currentSlug)
  if (!prevSlug) return ""

  // Find the title for the slug
  for (const section of documentationStructure) {
    for (const item of section.items) {
      if (item.slug === prevSlug) {
        return item.title
      }
    }
  }

  return ""
}

function getNextDocTitle(currentSlug: string): string {
  const nextSlug = getNextDoc(currentSlug)
  if (!nextSlug) return ""

  // Find the title for the slug
  for (const section of documentationStructure) {
    for (const item of section.items) {
      if (item.slug === nextSlug) {
        return item.title
      }
    }
  }

  return ""
}

export default DocumentationPage

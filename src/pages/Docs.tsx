import { useState } from "react";
import { 
  BookOpen, Code2, Terminal, Layers, Flag, 
  Notebook, Download, Search, ChevronDown, ChevronUp
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import CodeBlock from "@/components/CodeBlock";

const Docs = () => {
  const [openCategory, setOpenCategory] = useState("getting-started");
  const [searchQuery, setSearchQuery] = useState("");

  const documentationStructure = [
    {
      category: "Getting Started",
      id: "getting-started",
      icon: Flag,
      items: [
        { title: "Introduction", type: "guide" },
        { title: "Installation", type: "guide" },
        { title: "Usage Basics", type: "guide" },
        { title: "Quickstart Notebook", type: "notebook", badge: "ipynb" }
      ]
    },
    {
      category: "Problem Guides",
      id: "problem-guides",
      icon: Code2,
      items: [
        { title: "Defining Optimization Problems", type: "guide" },
        { title: "Discrete vs Continuous", type: "guide" },
        { title: "Handling Constraints", type: "guide" },
        { title: "Benchmarking Examples", type: "notebook", badge: "ipynb" }
      ]
    },
    {
      category: "Optimizer Guides",
      id: "optimizer-guides",
      icon: Layers,
      items: [
        { title: "Classical Optimizers", type: "guide" },
        { title: "Quantum and Hybrid Methods", type: "guide" },
        { title: "Parameter Tuning", type: "guide" },
        { title: "Optimizer Comparison", type: "notebook", badge: "ipynb" }
      ]
    },
    {
      category: "API Reference",
      id: "api-reference",
      icon: Terminal,
      items: [
        { title: "Core Modules", type: "api" },
        { title: "CLI Tools", type: "api" },
        { title: "REST API", type: "api" }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex flex-col lg:flex-row gap-8 max-w-[1800px] mx-auto p-6">
        {/* Navigation Sidebar */}
        <div className="w-full lg:w-80 flex flex-col gap-4">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search documentation..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <ScrollArea className="h-[calc(100vh-180px)]">
              {documentationStructure.map((section) => (
                <div key={section.id} className="mb-2">
                  <button
                    onClick={() => setOpenCategory(openCategory === section.id ? "" : section.id)}
                    className="w-full flex items-center justify-between p-3 hover:bg-gray-100 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <section.icon className="w-5 h-5 text-primary" />
                      <span className="font-medium">{section.category}</span>
                    </div>
                    {openCategory === section.id ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                  
                  {openCategory === section.id && (
                    <div className="ml-8 pl-3 border-l-2 border-gray-100">
                      {section.items.map((item, index) => (
                        <Link
                          key={index}
                          to="#"
                          className="flex items-center gap-3 p-2 text-sm hover:bg-gray-50 rounded-lg transition-colors"
                        >
                          {item.type === "notebook" ? (
                            <Notebook className="w-4 h-4 text-purple-600" />
                          ) : (
                            <BookOpen className="w-4 h-4 text-blue-600" />
                          )}
                          <span>{item.title}</span>
                          {item.badge && (
                            <span className="ml-auto text-xs bg-gray-100 px-2 py-1 rounded-full">
                              {item.badge}
                            </span>
                          )}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </ScrollArea>
          </div>
          
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <h3 className="font-medium mb-3">Featured Examples</h3>
            <div className="space-y-2">
              <Button variant="outline" className="w-full justify-start">
                <Download className="w-4 h-4 mr-2" />
                Basic Optimization.ipynb
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Download className="w-4 h-4 mr-2" />
                Quantum Hybrid Demo.ipynb
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 p-6 lg:p-8">
          <div className="prose max-w-none">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Getting Started with Qubots</h1>
            
            <div className="grid gap-6 mb-8">
              <div className="bg-primary-50 p-6 rounded-xl border border-primary-100">
                <h2 className="text-xl font-semibold mb-4">Quick Installation</h2>
                <CodeBlock code="pip install qubots" />
                <p className="mt-4">
                  Qubots is a collaborative optimization framework that lets you package your optimization problems and solvers as modular “qubots.” Easily integrate classical, quantum, or hybrid approaches using dynamic loading, chaining, and pipelines.
                </p>
                <div className="mt-4 flex gap-3">
                  <Button variant="default">
                    <Terminal className="w-4 h-4 mr-2" />
                    CLI Documentation
                  </Button>
                  <Button variant="secondary">
                    <Notebook className="w-4 h-4 mr-2" />
                    Example Notebooks
                  </Button>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="border p-6 rounded-xl">
                  <h3 className="font-semibold mb-4">Core Concepts</h3>
                  <ul className="space-y-3">
                    <li className="flex items-center gap-2">
                      <Code2 className="w-4 h-4 text-primary" />
                      Modular Problem Definitions
                    </li>
                    <li className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-primary" />
                      Dynamic Optimizer Loading
                    </li>
                    <li className="flex items-center gap-2">
                      <Terminal className="w-4 h-4 text-primary" />
                      Hybrid Quantum-Classical Pipelines
                    </li>
                  </ul>
                </div>

                <div className="border p-6 rounded-xl">
                  <h3 className="font-semibold mb-4">Popular Guides</h3>
                  <div className="space-y-3">
                    <Button variant="ghost" className="w-full justify-start">
                      <Notebook className="w-4 h-4 mr-2" />
                      Building Your First Qubot.ipynb
                    </Button>
                    <Button variant="ghost" className="w-full justify-start">
                      <Code2 className="w-4 h-4 mr-2" />
                      API Reference
                    </Button>
                  </div>
                </div>
              </div>

              <div className="border p-6 rounded-xl">
                <h2 className="text-xl font-semibold mb-4">Example Workflow</h2>
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
        </div>
      </div>
    </div>
  );
};

export default Docs;

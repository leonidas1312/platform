import { useState } from "react";
import { BookOpen, Code2, Terminal, Layers, Flag } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import ProblemGuidesSection from "@/components/ProblemGuidesSection";
import OptimizerGuidesSection from "@/components/OptimizerGuidesSection";
import ContinuousProblemGuides from "@/components/ContinuousProblemGuides";
import UsageExamplesSection from "@/components/UsageExamplesSection";
import CLIGuidesSection from "@/components/CLIGuidesSection";
import CodeBlock from "@/components/CodeBlock";

const Docs = () => {
  const [activeTab, setActiveTab] = useState("getting-started");
  const [showProblemGuide, setShowProblemGuide] = useState(false);
  const [showOptimizerGuide, setShowOptimizerGuide] = useState(false);

  return (
    <div className="min-h-screen bg-white">
      <div className="container py-12 max-w-[1200px]">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-github-gray mb-4">Documentation</h1>
          <p className="text-xl text-github-gray mb-8">Everything you need to get started with Rastion</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="flex justify-center gap-6 mb-8">
            <TabsTrigger value="getting-started">
              <Flag className="w-5 h-5 mr-2" /> Getting Started
            </TabsTrigger>
            <TabsTrigger value="creating-problem">
              <Code2 className="w-5 h-5 mr-2" /> Creating a Problem
            </TabsTrigger>
            <TabsTrigger value="creating-optimizer">
              <Code2 className="w-5 h-5 mr-2" /> Creating an Optimizer
            </TabsTrigger>
            <TabsTrigger value="usage-examples">
              <BookOpen className="w-5 h-5 mr-2" /> Usage Examples
            </TabsTrigger>
            <TabsTrigger value="cli-commands">
              <Terminal className="w-5 h-5 mr-2" /> CLI Commands
            </TabsTrigger>
          </TabsList>

          <TabsContent value="getting-started">
            <section>
              <h2 className="text-2xl font-semibold text-github-gray mb-6 flex items-center gap-2">
                <Flag className="w-6 h-6" />
                Getting Started
              </h2>

              <div className="prose max-w-none mb-8">
                <h3 className="text-xl font-semibold text-github-gray mb-4">What is Rastion?</h3>
                <p className="text-gray-700 mb-6">
                  Rastion is a powerful optimization framework designed to bridge the gap between classical and quantum optimization algorithms. 
                  It provides a unified interface for implementing, sharing, and running optimization problems and solvers, making it easier 
                  for researchers and developers to experiment with different optimization approaches.
                </p>

                <h3 className="text-xl font-semibold text-github-gray mb-4">Key Features</h3>
                <ul className="list-disc list-inside space-y-2 text-gray-700 mb-6">
                  <li>Unified interface for classical and quantum optimization problems</li>
                  <li>Easy-to-use repository system for sharing implementations</li>
                  <li>Support for both discrete and continuous optimization problems</li>
                  <li>Flexible optimizer framework supporting various algorithms</li>
                  <li>Built-in tools for problem conversion and analysis</li>
                </ul>

                <h3 className="text-xl font-semibold text-github-gray mb-4">How it Works</h3>
                <p className="text-gray-700 mb-4">
                  Rastion follows a simple workflow:
                </p>
                <ol className="list-decimal list-inside space-y-2 text-gray-700 mb-6">
                  <li>Define your optimization problem by implementing the BaseProblem interface</li>
                  <li>Create an optimizer by implementing the BaseOptimizer interface or use existing ones</li>
                  <li>Push your implementations to Rastion's repository system</li>
                  <li>Use the auto-loading system to easily run optimizations</li>
                </ol>
              </div>

              <div className="space-y-8">
                <div className="bg-gradient-to-br from-[#1A1F2C] to-[#221F26] p-6 rounded-lg shadow-xl">
                  <h3 className="text-xl font-semibold mb-4 text-white">Installation</h3>
                  <CodeBlock code="pip install rastion" />
                </div>

                <div className="bg-gradient-to-br from-[#1A1F2C] to-[#221F26] p-6 rounded-lg shadow-xl">
                  <h3 className="text-xl font-semibold mb-4 text-white">Base Problem Interface</h3>
                  <CodeBlock
                    code={`from abc import ABC, abstractmethod

class BaseProblem(ABC):
    """Base class for any Rastion problem.
    Defines a minimal interface."""
    
    @abstractmethod
    def evaluate_solution(self, solution) -> float:
        """Return a cost to minimize."""
        pass
        
    @abstractmethod
    def random_solution(self):
        """Return a random valid solution."""
        pass
        
    @abstractmethod
    def get_qubo(self):
        """Return QUBO matrix and constant."""
        pass`}
                  />
                </div>

                <div className="bg-gradient-to-br from-[#1A1F2C] to-[#221F26] p-6 rounded-lg shadow-xl">
                  <h3 className="text-xl font-semibold mb-4 text-white">Base Optimizer Interface</h3>
                  <CodeBlock
                    code={`from abc import ABC, abstractmethod

class BaseOptimizer(ABC):
    """Base class for any Rastion optimizer."""
    
    @abstractmethod
    def optimize(self, problem, **kwargs):
        """Run optimization, return tuple:
        (best_solution, best_value)"""
        pass`}
                  />
                </div>
              </div>
            </section>
          </TabsContent>

          <TabsContent value="creating-problem">
            <section>
              <h2 className="text-2xl font-semibold text-github-gray mb-6 flex items-center gap-2">
                <Code2 className="w-6 h-6" />
                Creating a Problem
              </h2>
            
              <div className="flex flex-col gap-4">
                <ProblemGuidesSection />
                <ContinuousProblemGuides />
              </div>
            </section>
          </TabsContent>

          <TabsContent value="creating-optimizer">
            <section>
              <h2 className="text-2xl font-semibold text-github-gray mb-6 flex items-center gap-2">
                <Code2 className="w-6 h-6" />
                Creating an Optimizer
              </h2>
              {/* Render the Optimizer Guides Section */}
              <OptimizerGuidesSection />
            </section>
          </TabsContent>

          <TabsContent value="usage-examples">
            <section>
              <UsageExamplesSection />
            </section>
          </TabsContent>

          <TabsContent value="cli-commands">
            <section>
              <CLIGuidesSection />
            </section>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Docs;

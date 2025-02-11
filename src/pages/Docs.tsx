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

const Docs = () => {
  const [activeTab, setActiveTab] = useState("getting-started");
  const [showProblemGuide, setShowProblemGuide] = useState(false);
  const [showOptimizerGuide, setShowOptimizerGuide] = useState(false);

  return (
    <div className="min-h-screen bg-white">
      <div className="container py-12 max-w-[1200px]">
        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-github-gray mb-4">
            Everything you need to get started with Rastion
          </h1>
        </div>

        {/* Tabs Navigation */}
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

          {/* Getting Started */}
          <TabsContent value="getting-started">
            <section>
              <h2 className="text-2xl font-semibold text-github-gray mb-6 flex items-center gap-2">
                <Flag className="w-6 h-6" />
                Getting Started
              </h2>
              <div className="bg-gradient-to-br from-[#1A1F2C] to-[#221F26] p-6 rounded-lg shadow-xl">
                <h3 className="text-xl font-semibold mb-4 text-white">
                  Installation
                </h3>
                <pre className="bg-[#1E1E1E] p-4 rounded text-sm overflow-x-auto font-code text-[#9b87f5] shadow-inner">
                  {`pip install rastion`}
                </pre>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-github-gray mb-6 flex items-center gap-2">
                <Layers className="w-6 h-6" />
                Key Components
              </h2>
              <div className="grid md:grid-cols-2 gap-8">
                <div className="bg-gradient-to-br from-[#1A1F2C] to-[#221F26] p-6 rounded-lg shadow-xl">
                  <h3 className="text-xl font-semibold mb-4 text-white">
                    BaseProblem
                  </h3>
                  <pre className="bg-[#1E1E1E] p-4 rounded text-sm overflow-x-auto font-code text-[#9b87f5] shadow-inner">
{`from abc import ABC, abstractmethod

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
                  </pre>
                </div>

                <div className="bg-gradient-to-br from-[#1A1F2C] to-[#221F26] p-6 rounded-lg shadow-xl">
                  <h3 className="text-xl font-semibold mb-4 text-white">
                    BaseOptimizer
                  </h3>
                  <pre className="bg-[#1E1E1E] p-4 rounded text-sm overflow-x-auto font-code text-[#9b87f5] shadow-inner">
{`from abc import ABC, abstractmethod

class BaseOptimizer(ABC):
    """Base class for any Rastion optimizer."""
    
    @abstractmethod
    def optimize(self, problem, **kwargs):
        """Run optimization, return tuple:
        (best_solution, best_value)"""
        pass`}
                  </pre>
                </div>
              </div>
            </section>

          </TabsContent>


          {/* Creating a Problem */}
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

          {/* Creating an Optimizer */}
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

          {/* Usage Examples */}
          <TabsContent value="usage-examples">
            <section>
              <UsageExamplesSection />
            </section>
          </TabsContent>

          {/* CLI Commands */}
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

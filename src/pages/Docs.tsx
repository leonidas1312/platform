import { useState } from "react";
import { BookOpen, Code2, Terminal, Layers, Flag } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

const Docs = () => {
  const [activeTab, setActiveTab] = useState("getting-started");

  return (
    <div className="min-h-screen bg-white">
      <div className="container py-12 max-w-[1200px]">
        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-github-gray mb-4">Documentation</h1>
          <p className="text-xl text-github-gray mb-8">Everything you need to get started with Rastion</p>
        </div>

        {/* Tabs Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="flex justify-center gap-4 mb-8">
            <TabsTrigger value="getting-started">
              <Flag className="w-5 h-5 mr-2" /> Getting Started
            </TabsTrigger>
            <TabsTrigger value="key-components">
              <Layers className="w-5 h-5 mr-2" /> Key Components
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
                <h3 className="text-xl font-semibold mb-4 text-white">Installation</h3>
                <pre className="bg-[#1E1E1E] p-4 rounded text-sm overflow-x-auto font-code text-[#9b87f5] shadow-inner">
                  {`pip install rastion`}
                </pre>
              </div>
            </section>
          </TabsContent>

          {/* Key Components */}
          <TabsContent value="key-components">
            <section>
              <h2 className="text-2xl font-semibold text-github-gray mb-6 flex items-center gap-2">
                <Layers className="w-6 h-6" />
                Key Components
              </h2>
              <p className="text-github-gray mb-4">Understanding the core building blocks of Rastion.</p>
            </section>
          </TabsContent>

          {/* Creating a Problem */}
          <TabsContent value="creating-problem">
            <section>
              <h2 className="text-2xl font-semibold text-github-gray mb-6 flex items-center gap-2">
                <Code2 className="w-6 h-6" />
                Creating a Problem
              </h2>
              <p className="text-github-gray mb-4">Learn how to define and configure an optimization problem.</p>
            </section>
          </TabsContent>

          {/* Creating an Optimizer */}
          <TabsContent value="creating-optimizer">
            <section>
              <h2 className="text-2xl font-semibold text-github-gray mb-6 flex items-center gap-2">
                <Code2 className="w-6 h-6" />
                Creating an Optimizer
              </h2>
              <p className="text-github-gray mb-4">Step-by-step guide to building an optimizer for Rastion.</p>
            </section>
          </TabsContent>

          {/* Usage Examples */}
          <TabsContent value="usage-examples">
            <section>
              <h2 className="text-2xl font-semibold text-github-gray mb-6 flex items-center gap-2">
                <BookOpen className="w-6 h-6" />
                Usage Examples
              </h2>
              <p className="text-github-gray mb-4">Explore different ways to utilize Rastion in your projects.</p>
            </section>
          </TabsContent>

          {/* CLI Commands */}
          <TabsContent value="cli-commands">
            <section>
              <h2 className="text-2xl font-semibold text-github-gray mb-6 flex items-center gap-2">
                <Terminal className="w-6 h-6" />
                CLI Commands
              </h2>
              <p className="text-github-gray mb-4">Command-line tools for managing repositories, solvers, and problems.</p>
            </section>
          </TabsContent>
        </Tabs>

        {/* Call to Action */}
        <div className="text-center pt-8">
          <p className="text-xl text-github-gray mb-6">Ready to get started?</p>
          <Button asChild size="lg">
            <Link to="/repositories">Browse Repositories</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Docs;

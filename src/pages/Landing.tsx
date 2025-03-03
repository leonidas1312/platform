import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import CodeBlock from "@/components/CodeBlock"; // Import the CodeBlock component
import { Code2, Workflow, Layers, Network, Trophy, BookOpenText } from "lucide-react";

// Dummy dropdown options – you can expand these as needed.
const problemOptions = [
  { label: "Rastion/max-cut", value: "max-cut" },
  { label: "Rastion/portfolio-optimization", value: "portfolio-optimization" },
  // Add more problems here.
];

const optimizerOptions = [
  { label: "Rastion/exhaustive-search", value: "exhaustive-search" },
  { label: "Rastion/particle-swarm", value: "particle-swarm" },
  // Add more optimizers here.
];

// A simplified code display box that only shows the snippet
const CodeDisplayBox = ({ codeSnippet }: { codeSnippet: string }) => {
  return (
    <div className="relative">
      {/* Render the code snippet with CodeBlock (non-executable display) */}
      <CodeBlock code={codeSnippet} language="python" />
    </div>
  );
};

const Landing = () => {
  const [user, setUser] = useState(null);
  const [selectedProblem, setSelectedProblem] = useState(problemOptions[0].value);
  const [selectedOptimizer, setSelectedOptimizer] = useState(optimizerOptions[0].value);

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
    };

    getUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // The code snippet – using the selected values dynamically.
  const codeSnippet = `from qubots.auto_problem import AutoProblem
from qubots.auto_optimizer import AutoOptimizer

# Load the problem from the repository.
problem = AutoProblem.from_repo("Rastion/${selectedProblem}")

# Load the optimizer from the repository.
optimizer = AutoOptimizer.from_repo("Rastion/${selectedOptimizer}")

best_solution, best_cost = optimizer.optimize(problem)
print(180*"=")
print("Best Solution:", best_solution)
print("Best Cost:", best_cost)
print(180*"=")`;

return (
  <div className="min-h-screen bg-white">
    <div className="container py-12 px-4 sm:px-6 lg:px-8">
      {/* Hero Section */}
      <div className="text-center mb-16 space-y-6">
        <div className="flex justify-center">
          <img 
            src="/rastion1.svg" 
            alt="Rastion Logo" 
            className="h-48 w-auto mb-8"
          />
        </div>
        <h1 className="text-5xl font-bold text-gray-900 mb-4">
          Open source community for decision making
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Collaborative platform for building and optimizing decision-making workflows. 
          Version controlled & community driven.
        </p>
        
        <div className="flex gap-4 justify-center mt-8">
          <Button asChild className="h-11 px-8">
            <Link to="/repositories">Get started</Link>
          </Button>
          <Button asChild variant="outline" className="h-11 px-8">
            <Link to="/docs">Documentation</Link>
          </Button>
        </div>
      </div>

      {/* Value Props */}
      <div className="grid md:grid-cols-3 gap-8 text-center mb-24">
        <div className="p-6">
          <Code2 className="h-10 w-10 mx-auto mb-4 text-blue-600" />
          <h3 className="text-xl font-semibold mb-2">Open source</h3>
          <p className="text-gray-600">Share and collaborate on optimization problems and algorithms</p>
        </div>
        <div className="p-6">
          <Network className="h-10 w-10 mx-auto mb-4 text-blue-600" />
          <h3 className="text-xl font-semibold mb-2">Standardized interfaces</h3>
          <p className="text-gray-600">Define universal interfaces for problems and optimizers</p>
        </div>
        <div className="p-6">
          <Layers className="h-10 w-10 mx-auto mb-4 text-blue-600" />
          <h3 className="text-xl font-semibold mb-2">Metadata & Compatibility</h3>
          <p className="text-gray-600">Tag problems and optimizers for sharing, discovering, and better collaboration</p>
        </div>
        <div className="p-6">
          <Workflow className="h-10 w-10 mx-auto mb-4 text-blue-600" />
          <h3 className="text-xl font-semibold mb-2">Pipelines</h3>
          <p className="text-gray-600">Compose multi-step workflows by "chaining" together optimizers</p>
        </div>
        <div className="p-6">
          <Trophy className="h-10 w-10 mx-auto mb-4 text-blue-600" />
          <h3 className="text-xl font-semibold mb-2">Benchmarking & Leaderboards</h3>
          <p className="text-gray-600">Compare optimizer performance on standardized problems</p>
        </div>
        <div className="p-6">
          <BookOpenText className="h-10 w-10 mx-auto mb-4 text-blue-600" />
          <h3 className="text-xl font-semibold mb-2">Documentation</h3>
          <p className="text-gray-600">Interactive examples to help you get started</p>
        </div>
      </div>


    </div>
  </div>
);

};

export default Landing;

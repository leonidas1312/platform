import { Code2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

// Dummy dropdown options – you can expand these as needed.
const problemOptions = [
  { label: "Rastion/max-cut", value: "max-cut" },
  // Add more problems here.
];

const optimizerOptions = [
  { label: "Rastion/exhaustive-search", value: "exhaustive-search" },
  // Add more optimizers here.
];

const ExecutableCodeBox = ({ codeSnippet }) => {
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);

  const runCode = async () => {
    setLoading(true);
    setOutput(""); // clear previous output

    try {
      const response = await fetch("/.netlify/functions/run-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: codeSnippet }),
      });
      const data = await response.json();
      setOutput(data.output);
    } catch (error) {
      setOutput("Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative">
      <pre className="bg-[#1E1E1E] p-4 rounded text-sm overflow-x-auto font-code text-[#9b87f5] shadow-inner">
        {codeSnippet}
      </pre>
      <Button onClick={runCode} className="mt-2" disabled={loading}>
        {loading ? "Running..." : "Run Code"}
      </Button>
      <div className="mt-4 bg-black text-green-400 p-4 rounded font-mono text-sm h-48 overflow-y-auto">
        {output || "Terminal output..."}
      </div>
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

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // The code snippet – using the selected values dynamically.
  const codeSnippet = `from qubots.auto_problem import AutoProblem
from qubots.auto_optimizer import AutoOptimizer

# Load the max-cut problem from the repository.
problem = AutoProblem.from_repo(f"Rastion/${selectedProblem}")

# Load the optimizer from the repository.
optimizer = AutoOptimizer.from_repo(f"Rastion/${selectedOptimizer}")

best_solution, best_cost = optimizer.optimize(problem)
print("Solved maxcut using exhaustive search")
print("Best Solution:", best_solution)
print("Best Cost:", best_cost)`;

  return (
    <div className="min-h-screen bg-white">
      <div className="container py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold flex items-center justify-center text-github-gray mb-4">
            <div className="text-center">
              <img src="/rastion1.svg" alt="Rastion Logo" className="w-full max-w-[250px]" />
            </div>
          </h1>

          <p className="text-xl text-github-gray mb-8">Optimization for everyone</p>
          <div className="max-w-2xl mx-auto text-github-gray mb-12">
            <p className="mb-4">
              Rastion allows users to create and share optimizers and problems by making team accessible to everyone.
              Join us in building a more efficient future through open source collaboration.
            </p>
          </div>

          <div className="flex gap-4 justify-center">
            <Button asChild>
              <Link to="/repositories">Browse Repositories</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/docs">Read Documentation</Link>
            </Button>
          </div>
        </div>

        {/* Get Started Section */}
        <div className="mb-16">
          <h2 className="text-2xl font-semibold text-github-gray mb-6">Get Started with Rastion</h2>
          <div className="bg-gradient-to-br from-[#1A1F2C] to-[#221F26] p-6 rounded-lg shadow-xl">
            <div className="mb-4 text-white text-xl">
              I want to optimize this&nbsp;
              <select
                value={selectedProblem}
                onChange={(e) => setSelectedProblem(e.target.value)}
                className="bg-gray-800 text-white px-2 py-1 rounded"
              >
                {problemOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              &nbsp;using this&nbsp;
              <select
                value={selectedOptimizer}
                onChange={(e) => setSelectedOptimizer(e.target.value)}
                className="bg-gray-800 text-white px-2 py-1 rounded"
              >
                {optimizerOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <ExecutableCodeBox codeSnippet={codeSnippet} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Landing;

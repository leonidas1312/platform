
import { useState } from "react";
import { RepositoryCard } from "@/components/RepositoryCard";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { Search, Code2, BookOpen } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

interface GitHubRepo {
  name: string;
  description: string;
  stargazers_count: number;
  forks_count: number;
  updated_at: string;
  html_url: string;
}

const fetchRepos = async () => {
  try {
    const response = await fetch(
      "https://api.github.com/users/Rastion/repos"
    );
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to fetch repositories");
    }
    
    return response.json();
  } catch (error) {
    console.error("Error fetching repos:", error);
    toast({
      title: "Error",
      description: "Unable to fetch repositories. Please check the organization name and try again.",
      variant: "destructive",
    });
    throw error;
  }
};

const Index = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const { data: repos, isLoading, error } = useQuery({
    queryKey: ["repos"],
    queryFn: fetchRepos,
  });

  const filteredRepos = repos?.filter((repo: GitHubRepo) =>
    repo.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatRepoData = (repo: GitHubRepo) => ({
    name: repo.name,
    description: repo.description || "No description available",
    stars: repo.stargazers_count,
    forks: repo.forks_count,
    updatedAt: repo.updated_at,
    docsUrl: repo.html_url,
  });

  return (
    <div className="min-h-screen bg-white">
      <div className="container py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-github-gray mb-4">Rastion-Hub</h1>
          <p className="text-xl text-github-gray mb-8">Optimizing together</p>
          <div className="max-w-2xl mx-auto text-github-gray mb-12">
            <p className="mb-4">
              At RastionHub, we believe in the power of open source to drive
              innovation and optimization. By sharing our tools and knowledge, we
              create a collaborative environment where the optimization community
              can grow and thrive together.
            </p>
            <p>
              Join us in building a more efficient future through open source
              collaboration.
            </p>
          </div>
        </div>

        <div className="mb-16">
          <h2 className="text-2xl font-semibold text-github-gray mb-6">Get Started with Rastion</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Code2 className="w-5 h-5" />
                Using Optimizers and Solvers
              </h3>
              <pre className="bg-white p-4 rounded text-sm overflow-x-auto">
{`from rastion_hub.auto_optimizer import AutoOptimizer
from rastion_hub.auto_problem import AutoProblem

# Load a problem from the hub
problem = AutoProblem.from_repo(
    "Rastion/my-problem-repo", 
    revision="main"
)

# Load and run an optimizer
solver = AutoOptimizer.from_repo(
    "Rastion/my-solver-repo", 
    revision="main"
)
solution, value = solver.optimize(problem)`}
              </pre>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Code2 className="w-5 h-5" />
                Sharing Your Work
              </h3>
              <pre className="bg-white p-4 rounded text-sm overflow-x-auto">
{`# Create a new solver repository
rastion create_repo my-solver --org Rastion

# Push your solver code and config
rastion push_solver my-solver \\
    --file my_solver.py \\
    --config solver_config.json

# Create and push a problem
rastion create_repo my-problem --org Rastion
rastion push_problem my-problem \\
    --file my_problem.py \\
    --config problem_config.json`}
              </pre>
            </div>
          </div>
        </div>

        <div className="mb-16">
          <h2 className="text-2xl font-semibold text-github-gray mb-6 flex items-center gap-2">
            <BookOpen className="w-6 h-6" />
            Documentation
          </h2>
          <div className="space-y-8">
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-xl font-semibold mb-4">Installation</h3>
              <pre className="bg-white p-4 rounded text-sm overflow-x-auto mb-4">
{`# Clone the repository
git clone https://github.com/Rastion/rastion-hub.git
cd rastion-hub

# Install dependencies
pip install -r requirements.txt

# Install the package
pip install .`}
              </pre>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-xl font-semibold mb-4">Key Components</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-lg mb-2">BaseProblem</h4>
                  <p className="text-github-gray mb-2">Abstract class requiring:</p>
                  <ul className="list-disc list-inside text-github-gray">
                    <li>evaluate_solution(solution) → float</li>
                    <li>Optional: random_solution()</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-lg mb-2">BaseOptimizer</h4>
                  <p className="text-github-gray">Must implement optimize(problem, **kwargs) → (best_solution, best_value)</p>
                </div>
                <div>
                  <h4 className="font-semibold text-lg mb-2">Auto-Loading Classes</h4>
                  <ul className="list-disc list-inside text-github-gray">
                    <li>AutoOptimizer and AutoProblem provide from_repo(...)</li>
                    <li>Automatically clone/pull from GitHub</li>
                    <li>Load respective configurations</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-xl font-semibold mb-4">Configuration Files</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-lg mb-2">solver_config.json</h4>
                  <p className="text-github-gray mb-2">Required for optimizers:</p>
                  <ul className="list-disc list-inside text-github-gray">
                    <li>entry_point: Module and class name</li>
                    <li>default_params: Default hyperparameters</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-lg mb-2">problem_config.json</h4>
                  <p className="text-github-gray mb-2">Required for problems:</p>
                  <ul className="list-disc list-inside text-github-gray">
                    <li>entry_point: Problem class location</li>
                    <li>default_params: Problem parameters</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="relative max-w-md mx-auto mb-8">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            type="text"
            placeholder="Search repositories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {isLoading ? (
          <div className="text-center text-github-gray">Loading repositories...</div>
        ) : error ? (
          <div className="text-center text-red-500">
            Unable to load repositories. Please check the organization name and try again.
          </div>
        ) : (
          <div>
            <h2 className="text-2xl font-semibold text-github-gray mb-4">Repositories</h2>
            <div className="grid gap-6 md:grid-cols-2">
              {filteredRepos?.map((repo: GitHubRepo) => (
                <RepositoryCard key={repo.name} repo={formatRepoData(repo)} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;

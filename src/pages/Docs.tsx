
import { Code2, BookOpen } from "lucide-react";

const Docs = () => {
  return (
    <div className="min-h-screen bg-white">
      <div className="container py-12">
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
      </div>
    </div>
  );
};

export default Docs;

import { useState, useEffect } from "react";
import { Github, Folder } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import CodeBlock from "@/components/CodeBlock";

interface Config {
  type?: "problem" | "optimizer";
  problem_type?: string;
  optimizer_type?: string;
  description?: string;
  keywords?: string[];
  compatible_problems?: string[];
  compatible_optimizers?: string[];
  data_format?: Record<string, any>;
  decision_variables?: Record<string, any>;
  objective?: Record<string, any>;
  solution_representation?: string;
  link_to_dataset?: string;
  example_code?: string;
  example_code_1?: string;
  example_code_2?: string;
}

interface Repository {
  name: string;
  description: string;
  stars: number;
  forks: number;
  updatedAt: string;
  docsUrl: string;
  creator: string;
}

interface RepositoryCardProps {
  repo: Repository;
}

// RadiantTag component for displaying a vibrant tag
const RadiantTag = ({
  type,
  label,
}: {
  type: "problem" | "optimizer";
  label: string;
}) => {
  return (
    <div className="flex flex-col items-end">
      <span
        className={`inline-block text-sm font-medium px-3 py-1 rounded-full bg-gradient-to-r ${
          type === "problem"
            ? "from-orange-500 to-pink-500"
            : "from-blue-500 to-purple-500"
        } text-white shadow-lg`}
      >
        {label}
      </span>
    </div>
  );
};

export const RepositoryCard = ({ repo }: RepositoryCardProps) => {
  const [config, setConfig] = useState<Config | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [exampleModalOpen, setExampleModalOpen] = useState(false);

  useEffect(() => {
    const fetchConfig = async () => {
      if (!config) {
        setIsLoading(true);
        try {
          const configTypes = ["problem_config.json", "solver_config.json"];
          const branches = ["main"];
          let configData: Config | null = null;
          let configTypeUsed = "";

          for (const branch of branches) {
            for (const type of configTypes) {
              const url = `https://raw.githubusercontent.com/Rastion/${repo.name}/${branch}/${type}`;
              console.log(`Attempting to fetch config from: ${url}`);
              try {
                const response = await fetch(url);
                if (response.ok) {
                  configData = await response.json();
                  configTypeUsed = type;
                  console.log(`Successfully fetched ${type} from ${branch} branch`);
                  break;
                }
              } catch (err) {
                console.log(`Failed to fetch ${type} from ${branch} branch`);
                continue;
              }
            }
            if (configData) break;
          }

          if (configData) {
            setConfig({
              ...configData,
              // Set as "problem" if loaded from problem_config.json; otherwise, "optimizer".
              type: configTypeUsed === "problem_config.json" ? "problem" : "optimizer",
            });
          } else {
            console.log(`No configuration file found for ${repo.name} in any branch`);
          }
        } catch (error) {
          console.error("Error fetching config:", error);
          toast({
            title: "Error",
            description: "Failed to load repository configuration.",
            variant: "destructive",
          });
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchConfig();
  }, [repo.name, config]);

  return (
    <div className="border border-github-border rounded-lg p-6 bg-white transition-all duration-200 hover:border-github-blue">
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <div className="flex items-center gap-3">
            <Folder className="w-5 h-5 text-github-gray" />
            <h2 className="text-base font-semibold text-github-gray">
              {config?.problem_type || config?.optimizer_type || repo.name}
            </h2>
          </div>
          <p className="text-xs text-github-gray">Created by: {repo.creator}</p>
        </div>
        {config && (
          <RadiantTag
            type={config.type!}
            label={config.type === "problem" ? "Problem" : "Optimizer"}
          />
        )}
      </div>
      <div className="mt-4 flex items-center gap-4 text-sm text-github-gray">
        <span>⭐ {repo.stars}</span>
        <span>🍴 {repo.forks}</span>
        <span>Updated {new Date(repo.updatedAt).toLocaleDateString()}</span>
      </div>
      <div className="mt-4">
        {config?.description ? (
          <p className="text-sm text-github-gray">{config.description}</p>
        ) : (
          <p className="text-sm text-github-gray">{repo.description}</p>
        )}
      </div>
      <div className="mt-4 space-y-4">
        <div className="flex flex-wrap gap-2">
          {config?.keywords &&
            config.keywords.length > 0 &&
            config.keywords.map((keyword, index) => (
              <span
                key={index}
                className="bg-github-border rounded-full px-2 py-1 text-xs text-github-gray"
              >
                {keyword}
              </span>
            ))}
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <a
            href={repo.docsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-github-blue hover:underline inline-flex items-center gap-2"
          >
            <Github className="w-4 h-4" />
            View Repository
          </a>
          {config?.type === "problem" && config.link_to_dataset && (
            <a
              href={config.link_to_dataset}
              target="_blank"
              rel="noopener noreferrer"
              className="text-github-blue hover:underline inline-flex items-center gap-2"
            >
              <span role="img" aria-label="dataset">📊</span>
              Dataset
            </a>
          )}
          {(config?.type === "problem" || config?.type === "optimizer") && (
            <button
              onClick={() => setExampleModalOpen(true)}
              className="text-github-blue hover:underline inline-flex items-center gap-2"
            >
              <span role="img" aria-label="example">💻</span>
              View Example
            </button>
          )}
        </div>
      </div>

      {/* View Example Modal */}
{exampleModalOpen && config && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
    <div className="bg-white p-6 rounded-lg w-96">
      <h3 className="text-xl font-semibold mb-4">Example Code</h3>
      <div className="mb-4">
        <CodeBlock
          code={
            config.type === "problem"
              ? `from qubots.auto_problem import AutoProblem
# Load the problem from the repository.
problem = AutoProblem.from_repo("Rastion/${repo.name}")
print("Problem loaded successfully!")`
              : `from qubots.auto_optimizer import AutoOptimizer
# Load the optimizer from the repository.
optimizer = AutoOptimizer.from_repo("Rastion/${repo.name}")
# Ensure you have a problem instance loaded.
solution, cost = optimizer.optimize(problem)
print("Best Solution:", solution)
print("Best Cost:", cost)`
          }
        />
      </div>
      <div className="text-right">
        <button
          onClick={() => setExampleModalOpen(false)}
          className="px-4 py-2 bg-gray-200 rounded"
        >
          Close
        </button>
      </div>
    </div>
  </div>
)}


      {isLoading && (
        <div className="text-center text-github-gray text-sm">
          Loading configuration...
        </div>
      )}
      {!isLoading && !config && (
        <div className="text-center text-github-gray text-sm">
          No configuration file found for this repository.
        </div>
      )}
    </div>
  );
};

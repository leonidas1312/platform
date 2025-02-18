import { useState, useEffect } from "react";
import { Github, Folder } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface Config {
  // entry_point: string;
  // default_params: Record<string, any>;
  // This field is set by our logic based on which file is loaded.
  type?: "problem" | "optimizer";
  // New fields from the updated configs:
  problem_type?: string;
  description?: string;
  keywords?: string[];
  data_format?: Record<string, any>;
  decision_variables?: Record<string, any>;
  objective?: Record<string, any>;
  solution_representation?: string;
  compatible_optimizers?: string[];
}

interface Repository {
  name: string;
  description: string;
  stars: number;
  forks: number;
  updatedAt: string;
  docsUrl: string;
}

interface RepositoryCardProps {
  repo: Repository;
}

export const RepositoryCard = ({ repo }: RepositoryCardProps) => {
  const [config, setConfig] = useState<Config | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchConfig = async () => {
      if (!config) {
        setIsLoading(true);
        try {
          // These are the config file names we try to load.
          const configTypes = ["problem_config.json", "solver_config.json"];
          const branches = ["main"];
          let configData: Config | null = null;
          let configTypeUsed = "";

          // Try fetching the config from each branch and each file.
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
              // Mark as "problem" if loaded from problem_config.json; otherwise, "optimizer".
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

  // Use the problem_type field if provided; otherwise, fallback based on our type flag.
  const getTypeLabel = () => {
    if (config?.problem_type) return `🎯 ${config.problem_type}`;
    if (!config?.type) return "";
    return config.type === "problem" ? "🎯 Problem" : "⚡ Optimizer";
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <div className="border border-github-border rounded-lg p-6 cursor-pointer transition-all duration-200 hover:border-github-blue bg-white">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Folder className="w-5 h-5 text-github-gray" />
              <div>
                
                {config && (
                  <span className="text-sm font-medium text-github-gray">
                    {getTypeLabel()}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-4 text-sm text-github-gray">
            <span>⭐ {repo.stars}</span>
            <span>🍴 {repo.forks}</span>
            <span>Updated {new Date(repo.updatedAt).toLocaleDateString()}</span>
          </div>
          {config?.description && (
            <p className="mt-4 text-github-gray text-sm">
              {config.description.length > 100
                ? `${config.description.substring(0, 100)}...`
                : config.description}
            </p>
          )}
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        {isLoading ? (
          <div className="text-center text-github-gray">Loading configuration...</div>
        ) : config ? (
          <div className="space-y-4">
            <div>
              
            </div>
            <div>
              
            </div>
            {config.description && (
              <div>
                <h3 className="font-semibold mb-2">Description</h3>
                <p className="text-sm text-github-gray">{config.description}</p>
              </div>
            )}
            {config.keywords && (
              <div>
                <h3 className="font-semibold mb-2">Keywords</h3>
                <div className="flex flex-wrap gap-2">
                  {config.keywords.map((keyword, index) => (
                    <span
                      key={index}
                      className="bg-github-border rounded-full px-2 py-1 text-xs text-github-gray"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            )}
            <div>
              <a
                href={repo.docsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-github-blue hover:underline inline-flex items-center gap-2"
              >
                <Github className="w-4 h-4" />
                View Repository
              </a>
            </div>
          </div>
        ) : (
          <div className="text-center text-github-gray">
            No configuration file found for this repository.
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};

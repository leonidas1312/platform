import { useState, useEffect } from "react";
import { Github, ArrowUp, ArrowDown, Folder } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

interface ConfigParams {
  [key: string]: any;
}

interface Config {
  entry_point: string;
  default_params: ConfigParams;
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
  const [isExpanded, setIsExpanded] = useState(false);
  const [config, setConfig] = useState<Config | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchConfig = async () => {
      if (isExpanded && !config) {
        setIsLoading(true);
        try {
          // Try problem_config.json first
          let response = await fetch(
            `https://raw.githubusercontent.com/Rastion/${repo.name}/main/problem_config.json`
          );
          
          // If problem_config.json doesn't exist, try solver_config.json
          if (!response.ok) {
            response = await fetch(
              `https://raw.githubusercontent.com/Rastion/${repo.name}/main/solver_config.json`
            );
          }

          if (response.ok) {
            const data = await response.json();
            setConfig(data);
          } else {
            console.log(`No config file found for ${repo.name}`);
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
  }, [isExpanded, repo.name, config]);

  return (
    <div className="border border-github-border rounded-lg overflow-hidden transition-all duration-200 hover:border-github-blue">
      <div
        className={`p-6 cursor-pointer transition-colors duration-200 ${
          isExpanded ? "bg-github-hover" : "hover:bg-github-hover"
        }`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Folder className="w-5 h-5 text-github-gray" />
            <h2 className="text-xl font-semibold text-github-blue">{repo.name}</h2>
          </div>
          {isExpanded ? (
            <ArrowUp className="w-5 h-5 text-github-gray" />
          ) : (
            <ArrowDown className="w-5 h-5 text-github-gray" />
          )}
        </div>
        <p className="mt-2 text-github-gray">{repo.description}</p>
        <div className="mt-4 flex items-center gap-4 text-sm text-github-gray">
          <span>⭐ {repo.stars}</span>
          <span>🍴 {repo.forks}</span>
          <span>Updated {new Date(repo.updatedAt).toLocaleDateString()}</span>
        </div>
      </div>
      
      {isExpanded && (
        <div className="p-6 border-t border-github-border bg-white">
          {isLoading ? (
            <div className="text-center text-github-gray">Loading configuration...</div>
          ) : config ? (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Entry Point</h3>
                <pre className="bg-github-hover p-3 rounded font-code text-sm overflow-x-auto">
                  {config.entry_point}
                </pre>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Default Parameters</h3>
                <pre className="bg-github-hover p-3 rounded font-code text-sm overflow-x-auto">
                  {JSON.stringify(config.default_params, null, 2)}
                </pre>
              </div>
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
        </div>
      )}
    </div>
  );
};
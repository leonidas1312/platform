
import { Github, Folder } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface ConfigParams {
  [key: string]: any;
}

interface Config {
  entry_point: string;
  default_params: ConfigParams;
  type?: 'problem' | 'optimizer';
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
          const configTypes = ['problem_config.json', 'solver_config.json'];
          const branches = ['master', 'main'];
          let configData = null;
          let configType = '';

          for (const branch of branches) {
            for (const type of configTypes) {
              try {
                const url = `https://raw.githubusercontent.com/Rastion/${repo.name}/${branch}/${type}`;
                console.log(`Attempting to fetch config from: ${url}`);
                const response = await fetch(url);
                
                if (response.ok) {
                  configData = await response.json();
                  configType = type;
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
              type: configType === 'problem_config.json' ? 'problem' : 'optimizer'
            });
          } else {
            console.log(`No config file found for ${repo.name} in any branch`);
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

  const getTypeLabel = () => {
    if (!config?.type) return '';
    return config.type === 'problem' ? 
      '🎯 Problem' : 
      '⚡ Optimizer';
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <div className="border border-github-border rounded-lg p-6 cursor-pointer transition-all duration-200 hover:border-github-blue bg-white">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Folder className="w-5 h-5 text-github-gray" />
              <div>
                <h2 className="text-xl font-semibold text-github-blue">{repo.name}</h2>
                {config?.type && (
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
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-80">
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
      </PopoverContent>
    </Popover>
  );
};

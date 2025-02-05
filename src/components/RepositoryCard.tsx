import { useState } from "react";
import { Github, ArrowUp, ArrowDown, Folder } from "lucide-react";

interface Repository {
  name: string;
  description: string;
  stars: number;
  forks: number;
  updatedAt: string;
  installCommand: string;
  usage: string;
  docsUrl: string;
}

interface RepositoryCardProps {
  repo: Repository;
}

export const RepositoryCard = ({ repo }: RepositoryCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

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
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Installation</h3>
              <pre className="bg-github-hover p-3 rounded font-code text-sm overflow-x-auto">
                {repo.installCommand}
              </pre>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Basic Usage</h3>
              <pre className="bg-github-hover p-3 rounded font-code text-sm overflow-x-auto">
                {repo.usage}
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
                View Documentation
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
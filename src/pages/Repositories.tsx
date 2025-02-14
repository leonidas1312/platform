
import { useState } from "react";
import { RepositoryCard } from "@/components/RepositoryCard";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/use-toast";

interface GitHubRepo {
  name: string;
  description: string;
  stargazers_count: number;
  forks_count: number;
  updated_at: string;
  html_url: string;
}

interface CategoryData {
  label: string;
  description: string;
  repos: string[];
}

const categories: Record<string, CategoryData> = {
  "graph-theory": {
    label: "Graph Theory",
    description: "Optimization problems related to graphs and networks",
    repos: ["graph-coloring", "traveling-salesman", "minimum-spanning-tree"]
  },
  "quantum": {
    label: "Quantum Computing",
    description: "Quantum-inspired algorithms and optimizers",
    repos: ["quantum-annealing", "quantum-approximate-optimization"]
  },
  "machine-learning": {
    label: "Machine Learning",
    description: "ML-based optimization techniques",
    repos: ["neural-optimizer", "reinforcement-learning-solver"]
  },
  "metaheuristics": {
    label: "Metaheuristics",
    description: "Nature-inspired and evolutionary algorithms",
    repos: ["particle-swarm", "genetic-algorithm", "ant-colony"]
  },
  "numerical": {
    label: "Numerical Methods",
    description: "Classical numerical optimization techniques",
    repos: ["gradient-descent", "newton-method", "simplex"]
  },
  "applications": {
    label: "Applications",
    description: "Real-world optimization problems",
    repos: ["portfolio-optimization", "supply-chain", "facility-location"]
  }
};

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

const Repositories = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentCategory, setCurrentCategory] = useState("all");
  const { data: repos, isLoading, error } = useQuery({
    queryKey: ["repos"],
    queryFn: fetchRepos,
  });

  const getCategoryForRepo = (repoName: string): string => {
    for (const [category, data] of Object.entries(categories)) {
      if (data.repos.includes(repoName)) {
        return category;
      }
    }
    return "uncategorized";
  };

  const filterRepos = (repos: GitHubRepo[]) => {
    return repos?.filter((repo: GitHubRepo) => {
      const matchesSearch = repo.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = currentCategory === "all" || getCategoryForRepo(repo.name) === currentCategory;
      return matchesSearch && matchesCategory;
    });
  };

  const formatRepoData = (repo: GitHubRepo) => ({
    name: repo.name,
    description: repo.description || "No description available",
    stars: repo.stargazers_count,
    forks: repo.forks_count,
    updatedAt: repo.updated_at,
    docsUrl: repo.html_url,
  });

  const organizeReposByCategory = (repos: GitHubRepo[]) => {
    const organized: Record<string, GitHubRepo[]> = {};
    
    repos?.forEach((repo) => {
      const category = getCategoryForRepo(repo.name);
      if (!organized[category]) {
        organized[category] = [];
      }
      organized[category].push(repo);
    });
    
    return organized;
  };

  const filteredRepos = repos ? filterRepos(repos) : [];
  const organizedRepos = organizeReposByCategory(filteredRepos);

  return (
    <div className="min-h-screen bg-white">
      <div className="container py-12">
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
            <Tabs defaultValue="all" onValueChange={setCurrentCategory} className="mb-8">
              <TabsList className="w-full flex-wrap h-auto p-2 gap-2">
                <TabsTrigger value="all" className="mb-1">
                  All Repositories
                </TabsTrigger>
                {Object.entries(categories).map(([key, { label }]) => (
                  <TabsTrigger key={key} value={key} className="mb-1">
                    {label}
                  </TabsTrigger>
                ))}
              </TabsList>

              <TabsContent value="all">
                <div className="space-y-8">
                  {Object.entries(categories).map(([category, data]) => {
                    const categoryRepos = organizedRepos[category] || [];
                    if (categoryRepos.length === 0) return null;

                    return (
                      <div key={category} className="mb-8">
                        <h2 className="text-2xl font-semibold text-github-gray mb-2">{data.label}</h2>
                        <p className="text-github-gray/80 mb-4">{data.description}</p>
                        <div className="grid gap-6 md:grid-cols-2">
                          {categoryRepos.map((repo: GitHubRepo) => (
                            <RepositoryCard key={repo.name} repo={formatRepoData(repo)} />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </TabsContent>

              {Object.entries(categories).map(([category, data]) => (
                <TabsContent key={category} value={category}>
                  <div>
                    <h2 className="text-2xl font-semibold text-github-gray mb-2">{data.label}</h2>
                    <p className="text-github-gray/80 mb-4">{data.description}</p>
                    <div className="grid gap-6 md:grid-cols-2">
                      {(organizedRepos[category] || []).map((repo: GitHubRepo) => (
                        <RepositoryCard key={repo.name} repo={formatRepoData(repo)} />
                      ))}
                    </div>
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </div>
        )}
      </div>
    </div>
  );
};

export default Repositories;

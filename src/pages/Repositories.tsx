
import { useState } from "react";
import { RepositoryCard } from "@/components/RepositoryCard";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { Search, TrendingUp, Star, GitFork, Clock } from "lucide-react";
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
  icon?: React.ReactNode;
  repos: string[];
}

const categories: Record<string, CategoryData> = {
  "trending": {
    label: "Trending",
    description: "Most active repositories in the last 30 days",
    icon: <TrendingUp className="w-4 h-4" />,
    repos: ["quantum-annealing", "graph-coloring", "neural-optimizer"]
  },
  "most-starred": {
    label: "Most Starred",
    description: "Repositories with the highest number of stars",
    icon: <Star className="w-4 h-4" />,
    repos: ["particle-swarm", "genetic-algorithm", "quantum-approximate-optimization"]
  },
  "most-forked": {
    label: "Most Forked",
    description: "Repositories with the highest number of forks",
    icon: <GitFork className="w-4 h-4" />,
    repos: ["traveling-salesman", "minimum-spanning-tree", "gradient-descent"]
  },
  "recently-updated": {
    label: "Recently Updated",
    description: "Latest updates and improvements",
    icon: <Clock className="w-4 h-4" />,
    repos: ["newton-method", "simplex", "portfolio-optimization"]
  },
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
  const [currentCategory, setCurrentCategory] = useState("trending");
  const { data: repos, isLoading, error } = useQuery({
    queryKey: ["repos"],
    queryFn: fetchRepos,
  });

  const getCategoryForRepo = (repoName: string): string[] => {
    const matchingCategories: string[] = [];
    Object.entries(categories).forEach(([categoryKey, categoryData]) => {
      if (categoryData.repos.includes(repoName)) {
        matchingCategories.push(categoryKey);
      }
    });
    return matchingCategories;
  };

  const filterRepos = (repos: GitHubRepo[]) => {
    if (!repos) return [];
    
    let filteredRepos = repos.filter((repo: GitHubRepo) => 
      repo.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    switch (currentCategory) {
      case "trending":
        // Sort by recent activity (stars + forks + recent updates)
        return filteredRepos.sort((a, b) => 
          (b.stargazers_count + b.forks_count) - (a.stargazers_count + a.forks_count)
        ).slice(0, 6);
      case "most-starred":
        return filteredRepos.sort((a, b) => b.stargazers_count - a.stargazers_count);
      case "most-forked":
        return filteredRepos.sort((a, b) => b.forks_count - a.forks_count);
      case "recently-updated":
        return filteredRepos.sort((a, b) => 
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        );
      default:
        // For other categories, filter by category
        return filteredRepos.filter(repo => 
          getCategoryForRepo(repo.name).includes(currentCategory)
        );
    }
  };

  const formatRepoData = (repo: GitHubRepo) => ({
    name: repo.name,
    description: repo.description || "No description available",
    stars: repo.stargazers_count,
    forks: repo.forks_count,
    updatedAt: repo.updated_at,
    docsUrl: repo.html_url,
  });

  const filteredRepos = repos ? filterRepos(repos) : [];

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
            <Tabs defaultValue="trending" onValueChange={setCurrentCategory} className="mb-8">
              <TabsList className="w-full flex-wrap h-auto p-2 gap-2">
                {Object.entries(categories).map(([key, { label, icon }]) => (
                  <TabsTrigger key={key} value={key} className="mb-1 flex items-center gap-2">
                    {icon}
                    {label}
                  </TabsTrigger>
                ))}
              </TabsList>

              {Object.entries(categories).map(([category, data]) => (
                <TabsContent key={category} value={category}>
                  <div>
                    <h2 className="text-2xl font-semibold text-github-gray mb-2 flex items-center gap-2">
                      {data.icon}
                      {data.label}
                    </h2>
                    <p className="text-github-gray/80 mb-4">{data.description}</p>
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                      {filteredRepos.map((repo: GitHubRepo) => (
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

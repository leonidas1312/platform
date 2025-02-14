
import { categories } from "@/data/categories";
import { GitHubRepo, FormattedRepo } from "@/types/repository";
import { toast } from "@/components/ui/use-toast";

export const getCategoryForRepo = (repoName: string): string[] => {
  const matchingCategories: string[] = [];
  Object.entries(categories).forEach(([categoryKey, categoryData]) => {
    if (categoryData.repos.includes(repoName)) {
      matchingCategories.push(categoryKey);
    }
  });
  return matchingCategories;
};

export const filterRepos = (
  repos: GitHubRepo[],
  searchTerm: string,
  currentCategory: string
): GitHubRepo[] => {
  if (!repos) return [];
  
  let filteredRepos = repos.filter((repo: GitHubRepo) => 
    repo.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  switch (currentCategory) {
    case "trending":
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
      return filteredRepos.filter(repo => 
        getCategoryForRepo(repo.name).includes(currentCategory)
      );
  }
};

export const formatRepoData = (repo: GitHubRepo): FormattedRepo => ({
  name: repo.name,
  description: repo.description || "No description available",
  stars: repo.stargazers_count,
  forks: repo.forks_count,
  updatedAt: repo.updated_at,
  docsUrl: repo.html_url,
});

export const fetchRepos = async () => {
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

// utils/repository.tsx
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

export const fetchRepos = async () => {
  try {
    const response = await fetch(
      "https://api.github.com/users/Rastion/repos?per_page=1000"
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to fetch repositories");
    }

    const repos: GitHubRepo[] = await response.json();

    // For each repo, try to fetch its config file to extract keywords and repo type.
    const reposWithConfig = await Promise.all(
      repos.map(async (repo) => {
        const configFilenames = ["problem_config.json", "solver_config.json"];
        const branches = ["master", "main"];
        let configKeywords: string[] = [];
        let repoType: "problem" | "optimizer" | null = null;

        for (const branch of branches) {
          for (const filename of configFilenames) {
            const url = `https://raw.githubusercontent.com/Rastion/${repo.name}/${branch}/${filename}`;
            try {
              const res = await fetch(url);
              if (res.ok) {
                const config = await res.json();
                if (Array.isArray(config.keywords)) {
                  configKeywords = config.keywords.map((kw: string) =>
                    kw.toLowerCase()
                  );
                }
                repoType = filename === "problem_config.json" ? "problem" : "optimizer";
                break;
              }
            } catch (err) {
              console.log(`Failed to fetch ${filename} from ${branch} for ${repo.name}`);
              continue;
            }
          }
          if (configKeywords.length || repoType) break;
        }

        return { ...repo, keywords: configKeywords, repoType };
      })
    );

    return reposWithConfig;
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
    case "all":
      return filteredRepos;

    case "trending":
      return filteredRepos
        .sort(
          (a, b) =>
            (b.stargazers_count + b.forks_count) -
            (a.stargazers_count + a.forks_count)
        )
        .slice(0, 6);

    case "most-starred":
      return filteredRepos.sort(
        (a, b) => b.stargazers_count - a.stargazers_count
      );

    case "most-forked":
      return filteredRepos.sort((a, b) => b.forks_count - a.forks_count);

    case "recently-updated":
      return filteredRepos.sort(
        (a, b) =>
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      );

    case "problems":
      return filteredRepos.filter(
        (repo) => (repo as any).repoType === "problem"
      );

    case "optimizers":
      return filteredRepos.filter(
        (repo) => (repo as any).repoType === "optimizer"
      );

    default: {
      // For other categories, use the keywords from the category definition.
      const categoryKeywords = (
        categories[currentCategory]?.repos || []
      ).map((kw) => kw.toLowerCase());

      return filteredRepos.filter((repo) => {
        // (Optional) Check if any manual mapping returns this category.
        const fixedCategories = getCategoryForRepo(repo.name);
        if (fixedCategories.includes(currentCategory)) return true;

        // Then compare repository config keywords against the category keywords.
        const repoKeywords = (repo as any).keywords;
        if (repoKeywords && Array.isArray(repoKeywords)) {
          return repoKeywords.some((kw: string) =>
            categoryKeywords.includes(kw.toLowerCase())
          );
        }
        return false;
      });
    }
  }
};


export const formatRepoData = (repo: GitHubRepo): FormattedRepo => ({
  name: repo.name,
  description: repo.description || "No description available",
  stars: repo.stargazers_count,
  forks: repo.forks_count,
  updatedAt: repo.updated_at,
  docsUrl: repo.html_url,
  keywords: (repo as any).keywords || [],
  repoType: (repo as any).repoType || null,
});

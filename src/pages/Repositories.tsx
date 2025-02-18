import { useState, useEffect } from "react";
import { RepositoryCard } from "@/components/RepositoryCard";
import { RepositorySearch } from "@/components/RepositorySearch";
import { useQuery } from "@tanstack/react-query";
import { categories } from "@/data/categories";
import { fetchRepos, filterRepos, formatRepoData } from "@/utils/repository";
import { GitHubRepo } from "@/types/repository";

const Repositories = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentCategory, setCurrentCategory] = useState("all");

  // Fetch repositories (which now include config keywords and repoType)
  const { data: repos, isLoading, error } = useQuery({
    queryKey: ["repos"],
    queryFn: fetchRepos,
  });

  // Compute total counts for problem and optimizer repositories.
  const problemCount = repos ? repos.filter((repo: GitHubRepo) => (repo as any).repoType === "problem").length : 0;
  const optimizerCount = repos ? repos.filter((repo: GitHubRepo) => (repo as any).repoType === "optimizer").length : 0;

  // Filter repositories based on search term and current category.
  const filteredRepos = repos ? filterRepos(repos, searchTerm, currentCategory) : [];

  return (
    <div className="min-h-screen bg-white">
      <div className="container py-12">
        {/* Search Bar */}
        <div className="mb-8">
          <RepositorySearch 
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
          />
        </div>
        <div className="flex gap-8">
          {/* Sidebar with Categories and Totals */}
          <aside className="w-64">
            <div className="sticky top-12">
              <h2 className="text-xl font-bold mb-4">Categories</h2>
              <ul className="space-y-2">
                {Object.entries(categories).map(([key, category]) => (
                  <li key={key}>
                    <button
                      className={`flex items-center gap-2 p-2 rounded transition-colors w-full text-left ${
                        currentCategory === key
                          ? "bg-github-blue text-white"
                          : "hover:bg-github-hover text-github-gray"
                      }`}
                      onClick={() => setCurrentCategory(key)}
                    >
                      {category.icon}
                      <span>{category.label}</span>
                    </button>
                  </li>
                ))}
              </ul>
              <div className="mt-8 border-t pt-4">
                <h3 className="text-lg font-semibold mb-2">Totals</h3>
                <p className="text-sm text-github-gray">
                  Problem Repos: <span className="font-bold">{problemCount}</span>
                </p>
                <p className="text-sm text-github-gray">
                  Optimizer Repos: <span className="font-bold">{optimizerCount}</span>
                </p>
              </div>
            </div>
          </aside>
          {/* Main Content Area */}
          <main className="flex-1">
            {isLoading ? (
              <div className="text-center text-github-gray">Loading repositories...</div>
            ) : error ? (
              <div className="text-center text-red-500">
                Unable to load repositories. Please check the organization name and try again.
              </div>
            ) : (
              <div>
                <div className="mb-4">
                  <h2 className="text-2xl font-semibold text-github-gray flex items-center gap-2">
                    {categories[currentCategory]?.icon}
                    {categories[currentCategory]?.label}
                  </h2>
                  <p className="text-github-gray/80">
                    {categories[currentCategory]?.description}
                  </p>
                </div>
                {filteredRepos.length === 0 ? (
                  <div className="text-center text-github-gray">
                    No repositories found in this category.
                  </div>
                ) : (
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {filteredRepos.map((repo: GitHubRepo) => (
                      <RepositoryCard key={repo.name} repo={formatRepoData(repo)} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default Repositories;


import { useState } from "react";
import { RepositoryCard } from "@/components/RepositoryCard";
import { RepositorySearch } from "@/components/RepositorySearch";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { categories } from "@/data/categories";
import { fetchRepos, filterRepos, formatRepoData } from "@/utils/repository";
import { GitHubRepo } from "@/types/repository";

const Repositories = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentCategory, setCurrentCategory] = useState("trending");
  const { data: repos, isLoading, error } = useQuery({
    queryKey: ["repos"],
    queryFn: fetchRepos,
  });

  const filteredRepos = repos ? filterRepos(repos, searchTerm, currentCategory) : [];

  return (
    <div className="min-h-screen bg-white">
      <div className="container py-12">
        <RepositorySearch 
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
        />

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

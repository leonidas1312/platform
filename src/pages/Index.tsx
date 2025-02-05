import { useState } from "react";
import { RepositoryCard } from "@/components/RepositoryCard";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

interface GitHubRepo {
  name: string;
  description: string;
  stargazers_count: number;
  forks_count: number;
  updated_at: string;
  html_url: string;
}

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

const Index = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const { data: repos, isLoading, error } = useQuery({
    queryKey: ["repos"],
    queryFn: fetchRepos,
  });

  const filteredRepos = repos?.filter((repo: GitHubRepo) =>
    repo.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatRepoData = (repo: GitHubRepo) => ({
    name: repo.name,
    description: repo.description || "No description available",
    stars: repo.stargazers_count,
    forks: repo.forks_count,
    updatedAt: repo.updated_at,
    installCommand: `git clone ${repo.html_url}.git`,
    usage: `cd ${repo.name}\nnpm install\nnpm start`,
    docsUrl: repo.html_url,
  });

  return (
    <div className="min-h-screen bg-white">
      <div className="container py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-github-gray mb-4">Rastion-Hub</h1>
          <p className="text-xl text-github-gray mb-8">Optimizing together</p>
          <div className="max-w-2xl mx-auto text-github-gray mb-12">
            <p className="mb-4">
              At RastionHub, we believe in the power of open source to drive
              innovation and optimization. By sharing our tools and knowledge, we
              create a collaborative environment where the optimization community
              can grow and thrive together.
            </p>
            <p>
              Join us in building a more efficient future through open source
              collaboration.
            </p>
          </div>
        </div>

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
          <div className="grid gap-6 md:grid-cols-2">
            {filteredRepos?.map((repo: GitHubRepo) => (
              <RepositoryCard key={repo.name} repo={formatRepoData(repo)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
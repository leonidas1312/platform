import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Search,
  ChevronDown,
  ChevronUp,
  Flag,
  Code2,
  Layers,
  CircuitBoard,
  Boxes,
  FlaskConical,
  Rocket
} from "lucide-react";
import { RepositoryCard } from "@/components/RepositoryCard";
import { fetchRepos, formatRepoData } from "@/utils/repository";
import { GitHubRepo } from "@/types/repository";
import { bigCategories } from "@/data/bigCategories";
import RepoStats from "@/components/RepoStats";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";

export default function Repositories() {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentCategory, setCurrentCategory] = useState("all");

  // 1) Initialize with all categories open
  const [openCategories, setOpenCategories] = useState<string[]>(
    bigCategories.map((cat) => cat.title)
  );

  // Fetch your repos (assumes each has a “categories” array from your config keywords)
  const { data: repos, isLoading, error } = useQuery({
    queryKey: ["repos"],
    queryFn: fetchRepos,
  });

  // Calculate problem and optimizer counts
  const problemCount = repos?.filter((r) => r.repoType === "problem").length || 0;
  const optimizerCount = repos?.filter((r) => r.repoType === "optimizer").length || 0;

  // 2) Toggling logic
  const toggleCategory = (title: string) => {
    setOpenCategories((prev) =>
      prev.includes(title) ? prev.filter((cat) => cat !== title) : [...prev, title]
    );
  };

  // Filter logic
  let filteredRepos: GitHubRepo[] = [];
  if (repos) {
    // 1) Filter by search term
    filteredRepos = repos.filter((r) =>
      r.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    // 2) Filter by category
    if (currentCategory === "recently-updated") {
      filteredRepos = filteredRepos.sort(
        (a, b) =>
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      );
    } else if (currentCategory !== "all") {
      filteredRepos = filteredRepos.filter((r) =>
        r.keywords?.includes(currentCategory)
      );
    }
  }

  // Icon mapping for categories
  const getCategoryIcon = (title: string) => {
    switch (title) {
      case "General":
        return Flag;
      case "Problem Types":
        return Code2;
      case "Optimization Methods":
        return Layers;
      case "Hardware Targets":
        return CircuitBoard;
      case "Resource Types":
        return Boxes;
      default:
        return Boxes;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex flex-col lg:flex-row gap-8 max-w-[1800px] mx-auto p-6">
        {/* Sidebar */}
        <div className="w-full lg:w-80 flex flex-col gap-4">
          {/* Stats Card */}
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <h3 className="font-medium mb-3">Repository Stats</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                <FlaskConical className="w-5 h-5 text-blue-600" />
                <div>
                  <div className="text-2xl font-bold">{problemCount}</div>
                  <div className="text-sm text-gray-600">Problems</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                <Rocket className="w-5 h-5 text-purple-600" />
                <div>
                  <div className="text-2xl font-bold">{optimizerCount}</div>
                  <div className="text-sm text-gray-600">Optimizers</div>
                </div>
              </div>
            </div>
          </div>

          {/* Search and Categories */}
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search repositories..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <ScrollArea className="h-[calc(100vh-300px)]">
              {bigCategories.map((bigCat) => {
                const Icon = getCategoryIcon(bigCat.title);
                const isOpen = openCategories.includes(bigCat.title);

                return (
                  <div key={bigCat.title} className="mb-2">
                    <button
                      onClick={() => toggleCategory(bigCat.title)}
                      className="w-full flex items-center justify-between p-3 hover:bg-gray-100 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-5 h-5 text-primary" />
                        <span className="font-medium">{bigCat.title}</span>
                      </div>
                      {isOpen ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>

                    {/* Show sub-categories if open */}
                    {isOpen && (
                      <div className="ml-8 pl-3 border-l-2 border-gray-100">
                        {bigCat.subCategories.map((subCat) => (
                          <button
                            key={subCat.key}
                            onClick={() => setCurrentCategory(subCat.key)}
                            className={`w-full flex items-center justify-between p-2 text-sm hover:bg-gray-50 rounded-lg transition-colors ${
                              currentCategory === subCat.key
                                ? "bg-blue-50 text-primary"
                                : ""
                            }`}
                          >
                            <span>{subCat.label}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </ScrollArea>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 p-6 lg:p-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {currentCategory === "all"
                ? "All Repositories"
                : currentCategory === "recently-updated"
                ? "Recently Updated"
                : `Category: ${currentCategory}`}
            </h1>
            <p className="text-gray-600">
              {filteredRepos.length} repositories found
            </p>
          </div>

          {isLoading ? (
            <div className="text-center text-gray-500">Loading repositories...</div>
          ) : error ? (
            <div className="text-center text-red-500">
              Unable to load repositories. Please try again.
            </div>
          ) : filteredRepos.length === 0 ? (
            <div className="text-center text-gray-500">
              No repositories found matching your criteria.
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredRepos.map((repo) => (
                <RepositoryCard key={repo.name} repo={formatRepoData(repo)} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

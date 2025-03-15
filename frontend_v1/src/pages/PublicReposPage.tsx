import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";

interface GiteaRepo {
  id: number;
  name: string;
  full_name: string; // e.g. "owner/repo"
  owner?: { login: string };
  stars_count: number;
  updated_at: string;
  description?: string;
  private: boolean;
}

// If your /api/public-repos returns data like { data, total_count }
interface SearchResult {
  data: GiteaRepo[];
  total_count: number;
}

function timeAgo(dateString: string) {
  const diffMs = Date.now() - new Date(dateString).getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays < 1) return "Updated today";
  if (diffDays === 1) return "Updated 1 day ago";
  return `Updated ${diffDays} days ago`;
}

export default function PublicReposPage() {
  const [repos, setRepos] = useState<GiteaRepo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);

  // For local filtering:
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);

  const navigate = useNavigate();

  // 1) Fetch repos from server
  useEffect(() => {
    fetch(`http://localhost:4000/api/public-repos?limit=12&page=${page}`)
      .then((res) => {
        if (!res.ok) {
          return res.json().then((data) => {
            throw new Error(data.message || "Failed to fetch public repos");
          });
        }
        return res.json();
      })
      .then((result: SearchResult) => {
        setRepos(result.data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Unknown error");
        setLoading(false);
      });
  }, [page]);

  const handlePrevPage = () => setPage((prev) => Math.max(prev - 1, 1));
  const handleNextPage = () => setPage((prev) => prev + 1);

  const handleRepoClick = (repo: GiteaRepo) => {
    // Suppose we have a route /repo/:owner/:repoName
    const [ownerName] = repo.full_name.split("/");
    const repoName = repo.name;
    navigate(`/${ownerName}/${repoName}`);
  };

  // 2) Example filter panel logic
  // For demonstration, we define some keywords for user to toggle
  const availableKeywords = ["Text", "Image", "Audio", "Video"];

  const toggleKeyword = (kw: string) => {
    setSelectedKeywords((prev) =>
      prev.includes(kw) ? prev.filter((k) => k !== kw) : [...prev, kw]
    );
  };

  // 3) Local filtering in the frontend
  // (Alternatively, pass `selectedKeywords` to your API for server-side filtering.)
  const filteredRepos = repos.filter((repo) => {
    if (selectedKeywords.length === 0) return true;
    const desc = (repo.description || "").toLowerCase();
    // Check if at least one selected keyword is in the description
    return selectedKeywords.some((kw) => desc.includes(kw.toLowerCase()));
  });

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="w-16 h-16 border-4 border-blue-500 border-dashed rounded-full animate-spin"></div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="p-6 bg-red-100 text-red-700 rounded shadow-md">
            {error}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
        <div className="container mx-auto px-4 py-32">
          <div className="flex gap-8">
            {/* Left Filter Sidebar */}
            <aside className="w-64 hidden md:block">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold mb-4">
                  Filter by Keywords
                </h2>
                <div className="space-y-3">
                  {availableKeywords.map((kw) => (
                    <label
                      key={kw}
                      className="flex items-center gap-2 text-sm cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedKeywords.includes(kw)}
                        onChange={() => toggleKeyword(kw)}
                        className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                      />
                      <span>{kw}</span>
                    </label>
                  ))}
                </div>
              </div>
            </aside>

            {/* 2x2 Grid of Repos */}
            <div className="flex-1">
              {filteredRepos.length === 0 ? (
                <p className="text-center text-gray-500">
                  No repositories match your filters.
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {filteredRepos.map((repo) => (
                    <div
                      key={repo.id}
                      onClick={() => handleRepoClick(repo)}
                      className="cursor-pointer border rounded-lg p-6 bg-white transition transform duration-300 hover:scale-105 hover:shadow-xl"
                    >
                      <h3 className="font-bold text-xl mb-2">
                        {repo.full_name}
                      </h3>
                      <p className="text-gray-700 mb-3">
                        {repo.description || "No description"}
                      </p>
                      <p className="text-gray-500 text-sm">
                        ★ {repo.stars_count} • {timeAgo(repo.updated_at)}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Pagination */}
              <div className="mt-8 flex justify-center items-center gap-6">
                <button
                  disabled={page === 1}
                  onClick={handlePrevPage}
                  className="px-6 py-2 bg-blue-500 text-white rounded-lg transition disabled:opacity-50 hover:bg-blue-600"
                >
                  Previous
                </button>
                <button
                  onClick={handleNextPage}
                  className="px-6 py-2 bg-blue-500 text-white rounded-lg transition hover:bg-blue-600"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

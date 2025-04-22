"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import Layout from "../components/Layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Filter,
  FolderGit,
  GitFork,
  Loader2,
  Search,
  SlidersHorizontal,
  Star,
  Tag,
  Users,
  X,
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface GiteaRepo {
  id: number
  name: string
  full_name: string // e.g. "owner/repo"
  owner?: { login: string; avatar_url?: string }
  stars_count: number
  forks_count?: number
  watchers_count?: number
  updated_at: string
  description?: string
  private: boolean
  language?: string
}

// If your /api/public-repos returns data like { data, total_count }
interface SearchResult {
  data: GiteaRepo[]
  total_count: number
}

function timeAgo(dateString: string) {
  const diffMs = Date.now() - new Date(dateString).getTime()
  const diffSecs = Math.floor(diffMs / 1000)
  const diffMins = Math.floor(diffSecs / 60)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)
  const diffWeeks = Math.floor(diffDays / 7)
  const diffMonths = Math.floor(diffDays / 30)
  const diffYears = Math.floor(diffDays / 365)

  if (diffSecs < 60) return "Updated just now"
  if (diffMins < 60) return `Updated ${diffMins} minute${diffMins !== 1 ? "s" : ""} ago`
  if (diffHours < 24) return `Updated ${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`
  if (diffDays < 7) return `Updated ${diffDays} day${diffDays !== 1 ? "s" : ""} ago`
  if (diffWeeks < 4) return `Updated ${diffWeeks} week${diffWeeks !== 1 ? "s" : ""} ago`
  if (diffMonths < 12) return `Updated ${diffMonths} month${diffMonths !== 1 ? "s" : ""} ago`
  return `Updated ${diffYears} year${diffYears !== 1 ? "s" : ""} ago`
}

// Language colors for repository cards
const languageColors: Record<string, string> = {
  JavaScript: "bg-yellow-400",
  TypeScript: "bg-blue-500",
  Python: "bg-green-500",
  Java: "bg-red-500",
  Go: "bg-cyan-500",
  Rust: "bg-orange-600",
  C: "bg-gray-600",
  "C++": "bg-pink-500",
  "C#": "bg-purple-500",
  Ruby: "bg-red-600",
  PHP: "bg-indigo-500",
  HTML: "bg-orange-500",
  CSS: "bg-blue-400",
  Shell: "bg-green-600",
  default: "bg-gray-400",
}

export default function PublicReposPage() {
  const PAGE_SIZE = 25

  const [repos, setRepos] = useState<GiteaRepo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeView, setActiveView] = useState<"grid" | "list">("grid")
  const [showFilters, setShowFilters] = useState(false)
  const [sortBy, setSortBy] = useState<string>("updated")

  // For local filtering:
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([])
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([])

  const navigate = useNavigate()

  // Declare result here to avoid the error
  const [result, setResult] = useState<SearchResult | null>(null)

  // total_count if you want to show “of Z”
  const [totalCount, setTotalCount] = useState(0)

  useEffect(() => {
    setLoading(true)
    fetch(`http://localhost:4000/api/public-repos?limit=${PAGE_SIZE}&page=${page}&sort=${sortBy}`)
      .then((res) => {
        if (!res.ok) {
          return res.json().then((data) => {
            throw new Error(data.message || "Failed to fetch public repos")
          })
        }
        return res.json()
      })
      .then((result: SearchResult) => {
        setRepos(result.data || [])
        setTotalCount(result.total_count)
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message || "Unknown error")
        setLoading(false)
      })
  }, [page, sortBy])


  // Add a useEffect to reset to page 1 when sorting changes
  // Add this after the existing useEffect hooks
  useEffect(() => {
    // Reset to page 1 when sort criteria changes
    setPage(1)
  }, [sortBy])

  // navigation handlers
  const handlePrevPage = () => setPage((p) => Math.max(p - 1, 1))
  const hasNextPage    = repos.length === PAGE_SIZE
  const handleNextPage = () => {
    if (hasNextPage) setPage((p) => p + 1)
  }

  const handleRepoClick = (repo: GiteaRepo) => {
    // Suppose we have a route /repo/:owner/:repoName
    const [ownerName] = repo.full_name.split("/")
    const repoName = repo.name
    navigate(`/${ownerName}/${repoName}`)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    // In a real app, you would call the API with the search query
    // For now, we'll just filter the existing repos
    console.log("Searching for:", searchQuery)
  }

  // 2) Example filter panel logic
  // For demonstration, we define some keywords for user to toggle
  const availableKeywords = ["Optimization", "Vehicle routing", "Quantum", "Scheduling", "Mathematical"]

  const toggleKeyword = (kw: string) => {
    setSelectedKeywords((prev) => (prev.includes(kw) ? prev.filter((k) => k !== kw) : [...prev, kw]))
  }

  const toggleLanguage = (lang: string) => {
    setSelectedLanguages((prev) => (prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang]))
  }

  const clearFilters = () => {
    setSelectedKeywords([])
    setSelectedLanguages([])
  }

  // 3) Local filtering in the frontend
  // (Alternatively, pass `selectedKeywords` to your API for server-side filtering.)
  const filteredRepos = repos.filter((repo) => {
    // Filter by search query
    if (
      searchQuery &&
      !repo.full_name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !(repo.description || "").toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false
    }

    // Filter by keywords
    if (selectedKeywords.length > 0) {
      const desc = (repo.description || "").toLowerCase()
      if (!selectedKeywords.some((kw) => desc.includes(kw.toLowerCase()))) {
        return false
      }
    }

    // Filter by language
    if (selectedLanguages.length > 0 && repo.language) {
      if (!selectedLanguages.includes(repo.language)) {
        return false
      }
    }

    return true
  })

  if (error) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="p-6 bg-destructive/10 text-destructive rounded-lg shadow-md max-w-md text-center">
            <h3 className="text-lg font-semibold mb-2">Error</h3>
            <p>{error}</p>
            <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </div>
        </div>
      </Layout>
    )
  }

  // Function to render repository grid
  const renderRepositoryGrid = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {filteredRepos.map((repo) => (
        <Card
          key={repo.id}
          className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer h-full"
          onClick={() => handleRepoClick(repo)}
        >
          <CardHeader className="pb-2 px-4 pt-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                {repo.owner?.avatar_url ? (
                  <img
                    src={repo.owner.avatar_url || "/placeholder.svg"}
                    alt={repo.owner.login}
                    className="w-5 h-5 rounded-full"
                  />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                    <Users className="h-3 w-3 text-primary" />
                  </div>
                )}
                <CardTitle className="text-sm font-medium truncate max-w-[150px]">{repo.full_name}</CardTitle>
              </div>
              <Badge variant={repo.private ? "outline" : "secondary"} className="text-[10px] px-1 h-5">
                {repo.private ? "Private" : "Public"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-3 text-xs text-muted-foreground">
              {repo.language && (
                <div className="flex items-center gap-1">
                  <span
                    className={`w-2 h-2 rounded-full ${languageColors[repo.language] || languageColors.default}`}
                  ></span>
                  {repo.language}
                </div>
              )}

              <div className="flex items-center gap-1">
                <Star className="h-3 w-3" />
                {repo.stars_count}
              </div>

              {repo.forks_count !== undefined && (
                <div className="flex items-center gap-1">
                  <GitFork className="h-3 w-3" />
                  {repo.forks_count}
                </div>
              )}

              <div className="flex items-center gap-1 w-full mt-1">
                <Clock className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">{timeAgo(repo.updated_at).replace("Updated ", "")}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )

  // Function to render repository list
  const renderRepositoryList = () => (
    <div className="space-y-2">
      {filteredRepos.map((repo) => (
        <Card
          key={repo.id}
          className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => handleRepoClick(repo)}
        >
          <div className="p-3">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  {repo.owner?.avatar_url ? (
                    <img
                      src={repo.owner.avatar_url || "/placeholder.svg"}
                      alt={repo.owner.login}
                      className="w-5 h-5 rounded-full"
                    />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                      <Users className="h-3 w-3 text-primary" />
                    </div>
                  )}
                  <h3 className="font-medium text-sm">{repo.full_name}</h3>
                  <Badge variant={repo.private ? "outline" : "secondary"} className="text-[10px] px-1 h-5">
                    {repo.private ? "Private" : "Public"}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mb-2">{repo.description || "No description provided"}</p>
              </div>

              <div className="flex items-center gap-3 text-xs">
                <div className="flex items-center gap-1">
                  <Star className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>{repo.stars_count}</span>
                </div>

                {repo.forks_count !== undefined && (
                  <div className="flex items-center gap-1">
                    <GitFork className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>{repo.forks_count}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
              {repo.language && (
                <div className="flex items-center gap-1">
                  <span
                    className={`w-2 h-2 rounded-full ${languageColors[repo.language] || languageColors.default}`}
                  ></span>
                  {repo.language}
                </div>
              )}

              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{timeAgo(repo.updated_at)}</span>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )

  return (
    <Layout>
      <div className="min-h-screen bg-background pt-24 pb-12">
        <div className="container max-w-[1400px] mx-auto px-4">
          <div className="flex flex-col space-y-4">
            {/* Header with integrated search and filters */}
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Explore Qubots</h1>
                <p className="text-sm text-muted-foreground">Discover public qubot repositories from the community</p>
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                <form onSubmit={handleSearch} className="relative w-full md:w-64 lg:w-80">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search repositories..."
                    className="pl-10 h-9"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </form>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-9">
                      <Filter className="h-4 w-4 mr-2" />
                      Filters
                      {(selectedKeywords.length > 0 || selectedLanguages.length > 0) && (
                        <Badge variant="secondary" className="ml-2">
                          {selectedKeywords.length + selectedLanguages.length}
                        </Badge>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-72">
                    <div className="p-2">
                      <div className="mb-4">
                        <h3 className="text-sm font-medium mb-2">Keywords</h3>
                        <div className="flex flex-wrap gap-1">
                          {availableKeywords.map((kw) => (
                            <Badge
                              key={kw}
                              variant={selectedKeywords.includes(kw) ? "default" : "outline"}
                              className="cursor-pointer hover:bg-primary/90 transition-colors"
                              onClick={() => toggleKeyword(kw)}
                            >
                              {kw}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div className="flex justify-between pt-2 border-t">
                        <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8">
                          Clear All
                        </Button>
                        <Button size="sm" className="h-8">
                          Apply Filters
                        </Button>
                      </div>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[180px] h-9">
                    <SlidersHorizontal className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Sort by">
                      {sortBy === "updated" && "Recently Updated"}
                      {sortBy === "stars" && "Most Stars"}
                      {sortBy === "forks" && "Most Forks"}
                      {sortBy === "created" && "Newest"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="updated">Recently Updated</SelectItem>
                    <SelectItem value="stars">Most Stars</SelectItem>
                    <SelectItem value="forks">Most Forks</SelectItem>
                    <SelectItem value="created">Newest</SelectItem>
                  </SelectContent>
                </Select>

                <Tabs
                  value={activeView}
                  onValueChange={(v) => setActiveView(v as "grid" | "list")}
                  className="hidden md:block"
                >
                  <TabsList className="h-9">
                    <TabsTrigger value="grid" className="px-3">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="1" y="1" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
                        <rect x="9" y="1" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
                        <rect x="1" y="9" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
                        <rect x="9" y="9" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
                      </svg>
                    </TabsTrigger>
                    <TabsTrigger value="list" className="px-3">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="1" y="2" width="14" height="2" rx="1" stroke="currentColor" strokeWidth="1.5" />
                        <rect x="1" y="7" width="14" height="2" rx="1" stroke="currentColor" strokeWidth="1.5" />
                        <rect x="1" y="12" width="14" height="2" rx="1" stroke="currentColor" strokeWidth="1.5" />
                      </svg>
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </div>

            {/* Active Filters */}
            {(selectedKeywords.length > 0 || selectedLanguages.length > 0) && (
              <div className="flex flex-wrap items-center gap-2 py-2">
                <span className="text-xs text-muted-foreground">Active filters:</span>
                {selectedKeywords.map((keyword) => (
                  <Badge key={keyword} variant="secondary" className="flex items-center gap-1 px-2 py-0 h-6">
                    <Tag className="h-3 w-3" />
                    {keyword}
                    <X
                      className="h-3 w-3 ml-1 cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleKeyword(keyword)
                      }}
                    />
                  </Badge>
                ))}
                {selectedLanguages.map((language) => (
                  <Badge key={language} variant="secondary" className="flex items-center gap-1 px-2 py-0 h-6">
                    <span
                      className={`w-2 h-2 rounded-full ${languageColors[language] || languageColors.default}`}
                    ></span>
                    {language}
                    <X
                      className="h-3 w-3 ml-1 cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleLanguage(language)
                      }}
                    />
                  </Badge>
                ))}
                <Button variant="ghost" size="sm" className="h-6 text-xs px-2" onClick={clearFilters}>
                  Clear all
                </Button>
              </div>
            )}

            {/* Repository Grid/List */}
            {loading ? (
              <div className="flex items-center justify-center py-32">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2 text-muted-foreground">Loading repositories...</span>
              </div>
            ) : filteredRepos.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <FolderGit className="h-16 w-16 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-medium">No repositories found</h3>
                <p className="text-muted-foreground mt-1 mb-4 max-w-md">
                  We couldn't find any repositories matching your criteria. Try adjusting your filters or search query.
                </p>
                <Button onClick={clearFilters}>Clear Filters</Button>
              </div>
            ) : (
              <Tabs value={activeView} onValueChange={(v) => setActiveView(v as "grid" | "list")}>
                <TabsContent value="grid" className="mt-0">
                  {renderRepositoryGrid()}
                </TabsContent>
                <TabsContent value="list" className="mt-0">
                  {renderRepositoryList()}
                </TabsContent>
              </Tabs>
            )}

            {/* ——— Pagination ——— */}
            {filteredRepos.length > 0 && (
              <div className="flex items-center justify-between mt-6">
                <div className="text-sm text-muted-foreground">
                  Showing {(page - 1) * PAGE_SIZE + 1} to {(page - 1) * PAGE_SIZE + filteredRepos.length} of {totalCount} repositories
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={handlePrevPage} disabled={page === 1}>
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleNextPage} disabled={!hasNextPage}>
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}

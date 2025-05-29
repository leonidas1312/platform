"use client"

import type React from "react"
import { useEffect, useState, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import Layout from "../components/Layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  FolderGit,
  GitFork,
  Loader2,
  Search,
  Star,
  Users,
  X,
  FileJson,
  Library,
  Code,
  Briefcase,
  Cpu,
  Lightbulb,
} from "lucide-react"
import { Link } from "react-router-dom"

const API = import.meta.env.VITE_API_BASE

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
  matching_keywords?: string[] // Added to track keywords matched in config.json
  qubot_type?: "problem" | "optimizer" // Add this line for the repository type
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

// Keyword categories for filtering
interface KeywordCategory {
  name: string
  icon: React.ReactNode
  keywords: string[]
  color: string
}

export default function PublicReposPage() {
  const PAGE_SIZE = 30

  const [repos, setRepos] = useState<GiteaRepo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeView, setActiveView] = useState<"grid" | "list">("grid")
  const [showFilters, setShowFilters] = useState(false)
  const [activeCategory, setActiveCategory] = useState("libraries")
  const [refreshTrigger, setRefreshTrigger] = useState(0) // Add a refresh trigger

  // For server-side filtering:
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([])
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([])

  // Add a new state variable for the total count
  const [totalRepoCount, setTotalRepoCount] = useState(0)
  const [filteredCount, setFilteredCount] = useState(0)
  const [totalPages, setTotalPages] = useState(1)

  const navigate = useNavigate()

  // Define keyword categories
  const keywordCategories: KeywordCategory[] = [
    {
      name: "Libraries",
      icon: <Library className="h-4 w-4" />,
      color: "from-blue-500 to-blue-600",
      keywords: [
        "PuLP",
        "CVXPY",
        "SciPy",
        "Pyomo",
        "OR-Tools",
        "Gurobi",
        "CPLEX",
        "MOSEK",
        "Optuna",
        "Hyperopt",
        "DEAP",
        "PyGAD",
        "Platypus",
        "PySwarms",
        "Scikit-Optimize",
        "Pymoo",
        "Simanneal",
        "Inspyred",
        "Nevergrad",
        "Ax",
      ],
    },
    {
      name: "Optimizers",
      icon: <Code className="h-4 w-4" />,
      color: "from-green-500 to-green-600",
      keywords: [
        "Linear Programming",
        "Integer Programming",
        "Mixed Integer Programming",
        "Genetic Algorithms",
        "Simulated Annealing",
        "Particle Swarm",
        "Gradient Descent",
        "Bayesian Optimization",
        "Evolutionary Algorithms",
        "Tabu Search",
        "Ant Colony Optimization",
        "Hill Climbing",
        "Branch and Bound",
        "Dynamic Programming",
        "Constraint Programming",
        "Stochastic Gradient Descent",
        "ADMM",
        "Nelder-Mead",
        "Differential Evolution",
        "Quantum Annealing",
      ],
    },
    {
      name: "Problems",
      icon: <Lightbulb className="h-4 w-4" />,
      color: "from-yellow-500 to-yellow-600",
      keywords: [
        "Scheduling",
        "Routing",
        "Assignment",
        "Knapsack",
        "Facility Location",
        "Network Flow",
        "Traveling Salesman",
        "Bin Packing",
        "Resource Allocation",
        "Portfolio Optimization",
        "Vehicle Routing",
        "Job Shop",
        "Flow Shop",
        "Cutting Stock",
        "Set Covering",
        "Maximum Flow",
        "Minimum Cost Flow",
        "Quadratic Assignment",
        "Nurse Scheduling",
        "Crew Scheduling",
      ],
    },

  ]

  // Get the active category data
  const getActiveCategoryData = () => {
    return keywordCategories.find((cat) => cat.name.toLowerCase() === activeCategory) || keywordCategories[0]
  }

  // Fetch repositories function
  const fetchRepositories = useCallback(() => {
    setLoading(true)

    // Build query parameters for the API request
    const queryParams = new URLSearchParams({
      limit: PAGE_SIZE.toString(),
      page: currentPage.toString(),
      sort: "created",
      order: "asc",
    })

    // Add search query if present
    if (searchQuery.trim()) {
      queryParams.append("q", searchQuery)
      queryParams.append("search_usernames", "true")
    }

    // Add keyword filters if present
    if (selectedKeywords.length > 0) {
      queryParams.append("keywords", selectedKeywords.join(","))
    }

    // Add language filters if present
    if (selectedLanguages.length > 0) {
      queryParams.append("languages", selectedLanguages.join(","))
    }

    // Log the API request URL for debugging
    console.log(`Fetching repositories: ${API}/public-repos?${queryParams.toString()}`)

    fetch(`${API}/public-repos?${queryParams.toString()}`)
      .then((res) => {
        if (!res.ok) {
          return res.json().then((data) => {
            throw new Error(data.message || "Failed to fetch public repos")
          })
        }
        return res.json()
      })
      .then((result: SearchResult) => {
        // Log the API response for debugging
        console.log("API response:", result)

        const newRepos = result.data || []
        console.log(`Received ${newRepos.length} repositories for page ${currentPage}`)

        setRepos(newRepos)

        // Update filteredCount and totalPages
        const hasFilters = searchQuery || selectedKeywords.length > 0 || selectedLanguages.length > 0

        // If we have filters, use the filtered count from the API
        if (hasFilters) {
          setFilteredCount(result.total_count)
          setTotalPages(Math.ceil(result.total_count / PAGE_SIZE))
        } else {
          // If no filters, use the total count we fetched initially
          setFilteredCount(totalRepoCount)
          setTotalPages(Math.ceil(totalRepoCount / PAGE_SIZE))
        }

        setLoading(false)
      })
      .catch((err) => {
        console.error("Error fetching repositories:", err)
        setError(err.message || "Unknown error")
        setLoading(false)
      })
  }, [currentPage, searchQuery, selectedKeywords, selectedLanguages, PAGE_SIZE, totalRepoCount])

  // Fetch total count on mount
  useEffect(() => {
    // Fetch the total count of repositories
    fetch(`${API}/public-repos/count`)
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to fetch repository count")
        }
        return res.json()
      })
      .then((data) => {
        setTotalRepoCount(data.total_count)
        setFilteredCount(data.total_count)
        setTotalPages(Math.ceil(data.total_count / PAGE_SIZE))
      })
      .catch((err) => {
        console.error("Error fetching repository count:", err)
      })
  }, [PAGE_SIZE]) // Empty dependency array means this runs once on mount

  // Fetch repositories when dependencies change
  useEffect(() => {
    fetchRepositories()
  }, [fetchRepositories, refreshTrigger])

  // Add a useEffect to reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, selectedKeywords, selectedLanguages])

  const handleRepoClick = (repo: GiteaRepo) => {
    // Suppose we have a route /repo/:owner/:repoName
    const [ownerName] = repo.full_name.split("/")
    const repoName = repo.name
    navigate(`/${ownerName}/${repoName}`)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    // Reset to page 1 when searching
    setCurrentPage(1)
    // Force a refresh
    setRefreshTrigger((prev) => prev + 1)
  }

  // Available languages for filtering
  const availableLanguages = ["JavaScript", "TypeScript", "Python", "Java", "Go", "C++", "Ruby"]

  const toggleKeyword = (kw: string) => {
    setSelectedKeywords((prev) => {
      const newKeywords = prev.includes(kw) ? prev.filter((k) => k !== kw) : [...prev, kw]
      // Force a refresh after state update
      setTimeout(() => setRefreshTrigger((prev) => prev + 1), 0)
      return newKeywords
    })
  }

  const toggleLanguage = (lang: string) => {
    setSelectedLanguages((prev) => {
      const newLanguages = prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang]
      // Force a refresh after state update
      setTimeout(() => setRefreshTrigger((prev) => prev + 1), 0)
      return newLanguages
    })
  }

  const clearFilters = () => {
    // Reset all filter states
    setSelectedKeywords([])
    setSelectedLanguages([])
    setSearchQuery("")
    setCurrentPage(1)

    // Reset filtered count to total count
    setFilteredCount(totalRepoCount)
    setTotalPages(Math.ceil(totalRepoCount / PAGE_SIZE))

    // Force a refresh to fetch all repositories
    setTimeout(() => setRefreshTrigger((prev) => prev + 1), 0)
  }

  // Pagination functions
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
      // Scroll to top when changing pages
      window.scrollTo(0, 0)
    }
  }

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      goToPage(currentPage - 1)
    }
  }

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      goToPage(currentPage + 1)
    }
  }

  // Generate pagination items
  const generatePaginationItems = () => {
    const items = []
    const maxVisiblePages = 5 // Maximum number of page buttons to show

    // Always show first page
    items.push(
      <Button
        key="page-1"
        variant={currentPage === 1 ? "default" : "outline"}
        size="sm"
        onClick={() => goToPage(1)}
        className="w-10 h-10"
      >
        1
      </Button>,
    )

    // Calculate range of pages to show
    const startPage = Math.max(2, currentPage - Math.floor(maxVisiblePages / 2))
    const endPage = Math.min(totalPages - 1, startPage + maxVisiblePages - 3)

    // Adjust if we're near the beginning
    if (startPage > 2) {
      items.push(
        <span key="ellipsis-start" className="px-2">
          ...
        </span>,
      )
    }

    // Add middle pages
    for (let i = startPage; i <= endPage; i++) {
      items.push(
        <Button
          key={`page-${i}`}
          variant={currentPage === i ? "default" : "outline"}
          size="sm"
          onClick={() => goToPage(i)}
          className="w-10 h-10"
        >
          {i}
        </Button>,
      )
    }

    // Add ellipsis if needed
    if (endPage < totalPages - 1) {
      items.push(
        <span key="ellipsis-end" className="px-2">
          ...
        </span>,
      )
    }

    // Always show last page if there is more than one page
    if (totalPages > 1) {
      items.push(
        <Button
          key={`page-${totalPages}`}
          variant={currentPage === totalPages ? "default" : "outline"}
          size="sm"
          onClick={() => goToPage(totalPages)}
          className="w-10 h-10"
        >
          {totalPages}
        </Button>,
      )
    }

    return items
  }

  // Get icon color based on category
  const getCategoryIconColor = (categoryName: string) => {
    const category = keywordCategories.find((cat) => cat.name.toLowerCase() === categoryName.toLowerCase())
    return category ? category.color : "from-gray-500 to-gray-600"
  }

  // Check if any filters are applied
  const hasFilters = searchQuery.trim() !== "" || selectedKeywords.length > 0 || selectedLanguages.length > 0

  return (
    <Layout>
      <div className="min-h-screen bg-background py-8">
        <div className="w-full px-4 lg:px-6">
          {/* Page Header with Search */}
          <div className="mb-8">
            <h1
              className="text-3xl md:text-4xl font-bold tracking-tight mb-6 text-foreground"
              style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}
            >
              Explore Public Optimization Tools
            </h1>
            <p
              className="text-lg text-muted-foreground mb-8 max-w-3xl"
              style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}
            >
              Discover optimization tools shared by the community.
            </p>
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="relative w-full max-w-2xl">
                <form onSubmit={handleSearch} className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search optimization tools and users..."
                    className="pl-12 h-14 text-base rounded-xl border-border/50 bg-card/50 backdrop-blur-sm focus:bg-card transition-colors"
                    style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </form>
              </div>
              {!loading && (
                <Badge
                  variant="outline"
                  className="px-4 py-2 text-base font-medium bg-primary/5 border-primary/20 h-14 flex items-center whitespace-nowrap rounded-xl"
                  style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}
                >

                  {totalRepoCount.toLocaleString()} public optimization tools
                </Badge>
              )}
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar with Filters */}
            <div className="w-full lg:w-80 flex-shrink-0">
              <div className="sticky top-32 bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl overflow-hidden shadow-soft">
                {/* Vertical Category List */}
                <div className="border-b border-border/50">
                  <div className="p-4 border-b border-border/30">
                    <h3
                      className="text-sm font-semibold text-foreground"
                      style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}
                    >
                      Filter by Category
                    </h3>
                  </div>
                  {keywordCategories.map((category) => (
                    <button
                      key={category.name}
                      onClick={() => setActiveCategory(category.name.toLowerCase())}
                      className={`w-full px-4 py-3 flex items-center gap-3 text-sm font-medium transition-all duration-200 border-l-3
${
  activeCategory === category.name.toLowerCase()
    ? "text-primary border-l-primary bg-primary/8 shadow-sm"
    : "text-muted-foreground border-l-transparent hover:text-foreground hover:bg-muted/30 hover:border-l-muted-foreground/30"
}`}
                      style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}
                    >
                      <div className={`p-1.5 rounded-lg ${activeCategory === category.name.toLowerCase() ? 'bg-primary/10' : 'bg-muted/50'}`}>
                        {category.icon}
                      </div>
                      {category.name}
                    </button>
                  ))}
                </div>

                {/* Keywords Section */}
                <div className="p-4">
                  <div
                    className="text-sm font-medium text-muted-foreground mb-3"
                    style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}
                  >
                    Keywords
                  </div>
                  <div className="flex flex-wrap gap-2 max-h-[calc(100vh-400px)] overflow-y-auto pr-2">
                    {getActiveCategoryData().keywords.map((keyword) => (
                      <div
                        key={keyword}
                        onClick={() => toggleKeyword(keyword)}
                        className={`
flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm cursor-pointer transition-all duration-200 font-medium
${
  selectedKeywords.includes(keyword)
    ? `bg-primary text-primary-foreground shadow-sm hover:bg-primary/90`
    : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground border border-border/50 hover:border-border"
}
`}
                        style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}
                      >
                        <span className="truncate">{keyword}</span>
                        {selectedKeywords.includes(keyword) && <X className="h-3.5 w-3.5 ml-0.5 flex-shrink-0" />}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Selected Filters */}
                {selectedKeywords.length > 0 && (
                  <div className="p-4 border-t border-border/50">
                    <div className="flex items-center justify-between mb-3">
                      <span
                        className="text-sm font-medium text-muted-foreground"
                        style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}
                      >
                        Selected Filters
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearFilters}
                        className="h-8 px-3 text-sm text-destructive hover:text-destructive hover:bg-destructive/10 rounded-lg"
                        style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}
                      >
                        <X className="h-3.5 w-3.5 mr-1.5" />
                        Clear All
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {selectedKeywords.map((keyword) => (
                        <Badge
                          key={keyword}
                          className="px-3 py-1.5 text-sm bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 transition-colors rounded-lg"
                          style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}
                        >
                          {keyword}
                          <X
                            className="h-3.5 w-3.5 ml-1.5 cursor-pointer hover:text-destructive transition-colors"
                            onClick={(e) => {
                              e.stopPropagation()
                              toggleKeyword(keyword)
                            }}
                          />
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1">
              {/* Active Filters Banner */}
              {hasFilters && (
                <div className="bg-muted/30 border border-border/50 rounded-xl p-4 mb-6 flex items-center justify-between backdrop-blur-sm">
                  <div
                    className="text-base font-medium"
                    style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}
                  >
                    <span className="text-foreground">Filtered results:</span>
                    <span className="text-primary ml-2">{filteredCount.toLocaleString()} optimization tools</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="h-9 px-4 text-sm text-destructive hover:text-destructive hover:bg-destructive/10 rounded-lg"
                    style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Clear Filters
                  </Button>
                </div>
              )}

              {/* Repository Grid/List */}
              {loading ? (
                <div className="flex flex-col items-center justify-center py-32">
                  <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
                  <span
                    className="text-lg text-muted-foreground"
                    style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}
                  >
                    Loading optimization tools...
                  </span>
                </div>
              ) : repos.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="p-6 rounded-full bg-muted/30 mb-6">
                    <FolderGit className="h-16 w-16 text-muted-foreground/60" />
                  </div>
                  <h3
                    className="text-2xl font-semibold mb-3 text-foreground"
                    style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}
                  >
                    No optimization tools found
                  </h3>
                  <p
                    className="text-muted-foreground mt-1 mb-6 max-w-md text-lg leading-relaxed"
                    style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}
                  >
                    We couldn't find any optimization tools matching your criteria. Try adjusting your filters or search query.
                  </p>
                  <Button
                    onClick={clearFilters}
                    className="h-12 px-6 text-base rounded-xl"
                    style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}
                  >
                    Clear Filters
                  </Button>
                </div>
              ) : (
                <Tabs value={activeView} onValueChange={(v) => setActiveView(v as "grid" | "list")}>
                  <TabsContent value="grid" className="mt-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {repos.map((repo) => (
                        <Card
                          key={repo.id}
                          className="overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer h-full bg-card/50 backdrop-blur-sm border-border/50 hover:border-border hover:bg-card/80 group rounded-xl"
                          onClick={() => handleRepoClick(repo)}
                        >
                          <CardHeader className="pb-3 px-5 pt-5">
                            <div className="flex items-start justify-between">
                              <div className="flex items-start gap-3 flex-1 min-w-0">
                                {repo.owner?.avatar_url ? (
                                  <img
                                    src={repo.owner.avatar_url || "/placeholder.svg"}
                                    alt={repo.owner.login}
                                    className="w-10 h-10 rounded-full ring-2 ring-border/20"
                                  />
                                ) : (
                                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center ring-2 ring-border/20">
                                    <Users className="h-5 w-5 text-primary" />
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1.5 mb-1">
                                    <Link
                                      to={`/u/${repo.owner.login}`}
                                      className="inline-block font-semibold text-base hover:text-primary hover:underline transition-colors flex-shrink-0"
                                      style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      {repo.owner.login}
                                    </Link>
                                    <span className="text-muted-foreground flex-shrink-0">/</span>
                                    <span
                                      className="font-semibold text-base text-foreground truncate"
                                      style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}
                                    >
                                      {repo.name}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <Badge
                                variant={repo.private ? "outline" : "secondary"}
                                className="text-xs px-3 py-1 h-7 ml-3 flex-shrink-0 rounded-lg"
                                style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}
                              >
                                {repo.private ? "Private" : "Public"}
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent className="px-3 pb-3">
                            {/* Show matching keywords from config.json if any */}
                            {repo.matching_keywords && repo.matching_keywords.length > 0 && (
                              <div className="mb-2 bg-primary/5 p-1.5 rounded-md border border-primary/10">
                                <div className="flex items-center gap-1 text-xs text-primary mb-1">
                                  <FileJson className="h-3.5 w-3.5" />
                                  <span>Matched keywords in qubot card:</span>
                                </div>
                                <div className="flex flex-wrap gap-1">
                                  {repo.matching_keywords.map((kw) => (
                                    <Badge
                                      key={kw}
                                      variant="outline"
                                      className="text-xs bg-primary/10 border-primary/20 hover:bg-primary/20 transition-colors"
                                    >
                                      {kw}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}

                            {repo.qubot_type && (
                              <Badge
                                variant="outline"
                                className={`px-3 py-1 text-sm font-small border-none text-white ${
                                  repo.qubot_type === "problem"
                                    ? "bg-gradient-to-r from-blue-500 to-cyan-500"
                                    : "bg-gradient-to-r from-orange-500 to-red-500"
                                }`}
                              >

                                {repo.qubot_type.charAt(0).toUpperCase() + repo.qubot_type.slice(1)}
                              </Badge>
                            )}

                            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-3 text-sm text-muted-foreground">
                              {repo.language && (
                                <div className="flex items-center gap-1">
                                  <span
                                    className={`w-2 h-2 rounded-full ${languageColors[repo.language] || languageColors.default}`}
                                  ></span>
                                  {repo.language}
                                </div>
                              )}

                              <div className="flex items-center gap-1">
                                <Star className="h-4 w-4" />
                                {repo.stars_count}
                              </div>



                              <Clock className="h-4 w-4 flex-shrink-0" />
                              <span>{timeAgo(repo.updated_at)}</span>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </TabsContent>
                  <TabsContent value="list" className="mt-0">
                    <div className="space-y-4">
                      {repos.map((repo) => (
                        <Card
                          key={repo.id}
                          className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                          onClick={() => handleRepoClick(repo)}
                        >
                          <div className="p-3">
                            <div className="flex items-start justify-between">
                              <div className="flex items-start gap-3">
                                {repo.owner?.avatar_url ? (
                                  <img
                                    src={repo.owner.avatar_url || "/placeholder.svg"}
                                    alt={repo.owner.login}
                                    className="w-10 h-10 rounded-full mt-1"
                                  />
                                ) : (
                                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mt-1">
                                    <Users className="h-5 w-5 text-primary" />
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1 mb-1">
                                    <Link
                                      to={`/u/${repo.owner.login}`}
                                      className="inline-block font-medium text-lg hover:text-primary hover:underline transition-colors flex-shrink-0"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      {repo.owner.login}
                                    </Link>
                                    <span className="text-muted-foreground flex-shrink-0">/</span>
                                    <Link
                                      to={`/${repo.owner.login}/${repo.name}`}
                                      className="inline-block font-medium text-lg hover:text-primary hover:underline transition-colors truncate"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      {repo.name}
                                    </Link>
                                    <Badge
                                      variant={repo.private ? "outline" : "secondary"}
                                      className="text-xs px-2 h-6 ml-2"
                                    >
                                      {repo.private ? "Private" : "Public"}
                                    </Badge>

                                    {repo.qubot_type && (
                                      <Badge
                                        variant="outline"
                                        className={`text-xs px-2 h-6 ml-2 ${
                                          repo.qubot_type === "problem"
                                            ? "bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800"
                                            : "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800"
                                        }`}
                                      >
                                        {repo.qubot_type === "problem" ? (
                                          <Lightbulb className="h-3 w-3 mr-1" />
                                        ) : (
                                          <Cpu className="h-3 w-3 mr-1" />
                                        )}
                                        {repo.qubot_type.charAt(0).toUpperCase() + repo.qubot_type.slice(1)}
                                      </Badge>
                                    )}
                                  </div>

                                  {/* Show matching keywords from config.json if any */}
                                  {repo.matching_keywords && repo.matching_keywords.length > 0 && (
                                    <div className="mb-3 bg-primary/5 p-2 rounded-md border border-primary/10">
                                      <div className="flex items-center gap-1 text-xs text-primary mb-1">
                                        <FileJson className="h-3.5 w-3.5" />
                                        <span>Matched keywords in config.json:</span>
                                      </div>
                                      <div className="flex flex-wrap gap-1">
                                        {repo.matching_keywords.map((kw) => (
                                          <Badge
                                            key={kw}
                                            variant="outline"
                                            className="text-xs bg-primary/10 border-primary/20"
                                          >
                                            {kw}
                                          </Badge>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>
              )}

              {/* Pagination */}
              {(repos.length > 0 || (loading && (searchQuery || selectedKeywords.length > 0))) && (
                <div className="flex flex-col items-center mt-4 space-y-2">
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={goToPreviousPage}
                      disabled={currentPage === 1 || loading}
                      className="h-10"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      <span className="ml-1">Previous</span>
                    </Button>

                    <div className="flex items-center">
                      {loading && (searchQuery || selectedKeywords.length > 0) ? (
                        // Show placeholder during loading with filters
                        <div className="flex items-center space-x-2">
                          <Button
                            variant={currentPage === 1 ? "default" : "outline"}
                            size="sm"
                            className="w-10 h-10"
                            disabled
                          >
                            1
                          </Button>
                          {totalPages > 1 && (
                            <Button variant="outline" size="sm" className="w-10 h-10 opacity-50" disabled>
                              ...
                            </Button>
                          )}
                        </div>
                      ) : (
                        generatePaginationItems()
                      )}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={goToNextPage}
                      disabled={currentPage === totalPages || loading}
                      className="h-10"
                    >
                      <span className="mr-1">Next</span>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Page info - Always show when we have data */}
                  {repos.length > 0 && (
                    <div className="text-center text-sm text-muted-foreground">
                      {loading ? (
                        <span>Loading results...</span>
                      ) : (
                        <span>
                          Showing page {currentPage} of {totalPages} ({filteredCount} optimization tools
                          {searchQuery || selectedKeywords.length > 0 ? " matching your filters" : ""})
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}

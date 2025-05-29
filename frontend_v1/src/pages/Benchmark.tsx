"use client"

import type React from "react"

import { useEffect, useState, useCallback, useRef } from "react"
import { useNavigate } from "react-router-dom"
import Layout from "../components/Layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardFooter, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ChevronLeft,
  ChevronRight,
  FolderGit,
  Loader2,
  Search,
  Users,
  X,
  LinkIcon,
  Plus,
  Upload,
  BarChart,
  GitCompare,
  FileCode,
  Download,
  AlertCircle,
  ExternalLink,
  Grid3X3,
  List,
} from "lucide-react"
import { Link } from "react-router-dom"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { handleColabOpen } from "@/utils/colabUtils"

const API = import.meta.env.VITE_API_BASE

interface Repository {
  id: number
  name: string
  full_name: string
  owner?: { login: string; avatar_url?: string }
  stars_count: number
  updated_at: string
  description?: string
  private: boolean
  language?: string
  qubot_type?: "problem" | "optimizer"
}

interface Benchmark {
  id: number
  title: string
  description: string
  created_by: string
  created_at: string
  updated_at: string
  connections: BenchmarkConnection[]
  results_count: number
  has_notebook?: boolean
  notebook_filename?: string
}

interface BenchmarkConnection {
  id: number
  benchmark_id: number
  repo_owner: string
  repo_name: string
  connected_repo_path: string
  description?: string
  code_snippet?: string
}

interface BenchmarkResult {
  id: number
  benchmark_id: number
  user_id: string
  repo_path: string
  metrics: Record<string, any>
  created_at: string
  code_snippet?: string
  has_notebook?: boolean
  notebook_filename?: string
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

export default function BenchmarkPage() {
  const { toast } = useToast()
  const navigate = useNavigate()
  const [benchmarks, setBenchmarks] = useState<Benchmark[]>([])
  const [filteredBenchmarks, setFilteredBenchmarks] = useState<Benchmark[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userRepos, setUserRepos] = useState<Repository[]>([])
  const [publicRepos, setPublicRepos] = useState<Repository[]>([])
  const [selectedBenchmark, setSelectedBenchmark] = useState<Benchmark | null>(null)
  const [benchmarkResults, setBenchmarkResults] = useState<BenchmarkResult[]>([])
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showParticipateDialog, setShowParticipateDialog] = useState(false)
  const [showDetailDialog, setShowDetailDialog] = useState(false)
  const [activeView, setActiveView] = useState<"grid" | "list">("grid")
  const PAGE_SIZE = 12

  // File input refs
  const createNotebookInputRef = useRef<HTMLInputElement>(null)
  const participateNotebookInputRef = useRef<HTMLInputElement>(null)

  // User repositories state
  const [userRepositories, setUserRepositories] = useState<Repository[]>([])

  // New benchmark form state
  const [newBenchmark, setNewBenchmark] = useState({
    title: "",
    description: "",
    connections: [] as { repoPath: string; description: string }[],
    notebookFile: null as File | null,
  })

  // Participate form state
  const [participation, setParticipation] = useState({
    benchmarkId: 0,
    repoPath: "",
    notebookFile: null as File | null,
  })

  // Check authentication status
  useEffect(() => {
    const token = localStorage.getItem("gitea_token")
    setIsAuthenticated(!!token)

    if (token) {
      fetchUserRepos(token)
    }
  }, [])

  // Fetch user repositories
  const fetchUserRepos = async (token: string) => {
    try {
      console.log("Fetching user repositories...")
      const response = await fetch(`${API}/user-repos`, {
        headers: {
          Authorization: `token ${token}`,
        },
      })

      if (response.ok) {
        const repos = await response.json()
        console.log("User repositories fetched:", repos)
        setUserRepos(repos)

        // For debugging, let's check if any repos have qubot_type
        const reposWithType = repos.filter((repo: Repository) => repo.qubot_type)
        console.log("Repositories with qubot_type:", reposWithType)

        // If no repos have qubot_type, let's use all repos for now
        if (reposWithType.length === 0) {
          console.log("No repositories with qubot_type found, using all repositories")
          setUserRepositories(repos)
        } else {
          setUserRepositories(reposWithType)
        }
      } else {
        console.error("Failed to fetch user repositories:", response.status, response.statusText)
      }
    } catch (error) {
      console.error("Error fetching user repositories:", error)
    }
  }

  // Fetch public repositories with problem or optimizer type
  const fetchPublicRepos = async () => {
    try {
      const token = localStorage.getItem("gitea_token")
      const headers: HeadersInit = {}

      if (token) {
        headers.Authorization = `token ${token}`
      }

      const response = await fetch(`${API}/public-repos?limit=50`, { headers })

      if (response.ok) {
        const result = await response.json()
        // Filter repos that have qubot_type
        const typedRepos = result.data.filter((repo: Repository) => repo.qubot_type)
        setPublicRepos(typedRepos)
      }
    } catch (error) {
      console.error("Error fetching public repositories:", error)
    }
  }

  // Fetch benchmarks
  const fetchBenchmarks = useCallback(async () => {
    setLoading(true)
    setError("")

    try {
      const token = localStorage.getItem("gitea_token")
      const headers: HeadersInit = {}

      if (token) {
        headers.Authorization = `token ${token}`
      }

      const response = await fetch(`${API}/benchmarks?page=${currentPage}&limit=${PAGE_SIZE}`, { headers })

      if (!response.ok) {
        throw new Error("Failed to fetch benchmarks")
      }

      const data = await response.json()
      setBenchmarks(data.data || [])
      setTotalPages(Math.ceil((data.total_count || 0) / PAGE_SIZE))
    } catch (err: any) {
      console.error("Error fetching benchmarks:", err)
      setError(err.message || "Failed to load benchmarks")
    } finally {
      setLoading(false)
    }
  }, [currentPage, PAGE_SIZE])

  // Filter benchmarks based on search query
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredBenchmarks(benchmarks)
    } else {
      const query = searchQuery.toLowerCase()
      const filtered = benchmarks.filter(
        (benchmark) =>
          benchmark.title.toLowerCase().includes(query) ||
          benchmark.description.toLowerCase().includes(query) ||
          benchmark.created_by.toLowerCase().includes(query),
      )
      setFilteredBenchmarks(filtered)
    }
  }, [benchmarks, searchQuery])

  // Fetch benchmarks when dependencies change
  useEffect(() => {
    fetchBenchmarks()
    fetchPublicRepos()
  }, [fetchBenchmarks])

  // Handle search form submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    // Reset to page 1 when searching
    setCurrentPage(1)
  }

  // Handle benchmark click - show detail view instead of results
  const handleBenchmarkClick = (benchmark: Benchmark) => {
    setSelectedBenchmark(benchmark)
    fetchBenchmarkResults(benchmark.id)
    setShowDetailDialog(true)
  }

  // Fetch results for a specific benchmark (for participation count)
  const fetchBenchmarkResults = async (benchmarkId: number) => {
    try {
      const token = localStorage.getItem("gitea_token")
      const headers: HeadersInit = {}

      if (token) {
        headers.Authorization = `token ${token}`
      }

      const response = await fetch(`${API}/benchmarks/${benchmarkId}/results`, { headers })

      if (response.ok) {
        const results = await response.json()
        setBenchmarkResults(results)
      }
    } catch (error) {
      console.error("Error fetching benchmark results:", error)
      toast({
        title: "Error",
        description: "Failed to load benchmark participants",
        variant: "destructive",
      })
    }
  }

  // Handle file selection for creating a benchmark
  const handleCreateNotebookFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setNewBenchmark({
        ...newBenchmark,
        notebookFile: e.target.files[0],
      })
    }
  }

  // Handle file selection for participating in a benchmark
  const handleParticipateNotebookFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setParticipation({
        ...participation,
        notebookFile: e.target.files[0],
      })
    }
  }

  // Handle creating a benchmark
  const handleCreateBenchmark = async () => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication required",
        description: "Please sign in to create a benchmark",
        variant: "destructive",
      })
      return
    }

    if (!newBenchmark.title || !newBenchmark.description || newBenchmark.connections.length < 1) {
      toast({
        title: "Missing information",
        description: "Please provide title, description, and at least one repository",
        variant: "destructive",
      })
      return
    }

    try {
      const token = localStorage.getItem("gitea_token")

      // Create FormData for file upload
      const formData = new FormData()
      formData.append("title", newBenchmark.title)
      formData.append("description", newBenchmark.description)
      formData.append("connections", JSON.stringify(newBenchmark.connections))

      if (newBenchmark.notebookFile) {
        formData.append("notebook", newBenchmark.notebookFile)
      }

      const response = await fetch(`${API}/benchmarks`, {
        method: "POST",
        headers: {
          Authorization: `token ${token}`,
        },
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to create benchmark")
      }

      // Reset form
      setNewBenchmark({
        title: "",
        description: "",
        connections: [],
        notebookFile: null,
      })

      // Reset file input
      if (createNotebookInputRef.current) {
        createNotebookInputRef.current.value = ""
      }

      setShowCreateDialog(false)
      fetchBenchmarks()

      toast({
        title: "Benchmark created",
        description: "Your benchmark has been created successfully",
      })
    } catch (error) {
      console.error("Error creating benchmark:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create benchmark",
        variant: "destructive",
      })
    }
  }

  // Handle participating in a benchmark
  const handleParticipateBenchmark = async () => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication required",
        description: "Please sign in to participate in a benchmark",
        variant: "destructive",
      })
      return
    }

    if (!participation.benchmarkId || !participation.repoPath) {
      toast({
        title: "Missing information",
        description: "Please select a benchmark and repository",
        variant: "destructive",
      })
      return
    }

    try {
      const token = localStorage.getItem("gitea_token")

      // Create FormData for file upload
      const formData = new FormData()
      formData.append("repoPath", participation.repoPath)

      if (participation.notebookFile) {
        formData.append("notebook", participation.notebookFile)
      }

      // Submit the participation
      const response = await fetch(`${API}/benchmarks/${participation.benchmarkId}/results`, {
        method: "POST",
        headers: {
          Authorization: `token ${token}`,
        },
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to submit benchmark participation")
      }

      // Reset form
      setParticipation({
        benchmarkId: 0,
        repoPath: "",
        notebookFile: null,
      })

      // Reset file input
      if (participateNotebookInputRef.current) {
        participateNotebookInputRef.current.value = ""
      }

      setShowParticipateDialog(false)
      fetchBenchmarks()

      toast({
        title: "Participation submitted",
        description: "Your participation has been submitted successfully",
      })
    } catch (error) {
      console.error("Error submitting participation:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit participation",
        variant: "destructive",
      })
    }
  }

  // Add a connection to the new benchmark
  const addConnection = () => {
    setNewBenchmark((prev) => ({
      ...prev,
      connections: [...prev.connections, { repoPath: "", description: "" }],
    }))
  }

  // Remove a connection from the new benchmark
  const removeConnection = (index: number) => {
    setNewBenchmark((prev) => ({
      ...prev,
      connections: prev.connections.filter((_, i) => i !== index),
    }))
  }

  // Update a connection in the new benchmark
  const updateConnection = (index: number, field: "repoPath" | "description", value: string) => {
    setNewBenchmark((prev) => ({
      ...prev,
      connections: prev.connections.map((conn, i) => (i === index ? { ...conn, [field]: value } : conn)),
    }))
  }

  return (
    <Layout>
      <div className="min-h-screen w-full bg-background py-8">
        <div className="w-full max-w-7xl mx-auto px-6">
          {/* Page Header with Search */}
          <div className="mb-8">
            <h1
              className="text-3xl md:text-4xl font-bold tracking-tight mb-6 text-foreground"
              style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}
            >
              Benchmark
            </h1>
            <p
              className="text-lg text-muted-foreground mb-8 max-w-4xl"
              style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}
            >
              Create optimization benchmarks and participate with your algorithms. Compare performance and collaborate with the community.
            </p>
            <div className="flex items-center justify-between gap-4 flex-wrap">
              {/* Search Bar */}
              <form onSubmit={handleSearch} className="flex-1 max-w-md">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    type="text"
                    placeholder="Search benchmarks..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-11 bg-background border-border focus:border-primary transition-colors"
                    style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}
                  />
                </div>
              </form>

              {/* Action Buttons */}
              <div className="flex items-center gap-3">
                {/* View Toggle */}
                <div className="flex items-center border border-border rounded-lg p-1 bg-background">
                  <Button
                    variant={activeView === "grid" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setActiveView("grid")}
                    className="h-8 w-8 p-0"
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={activeView === "list" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setActiveView("list")}
                    className="h-8 w-8 p-0"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>

                {/* Create Benchmark Button */}
                {isAuthenticated && (
                  <Button
                    onClick={() => setShowCreateDialog(true)}
                    className="h-11 px-6 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-lg transition-all duration-200 hover:shadow-md"
                    style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Benchmark
                  </Button>
                )}

                {/* Participate Button */}
                {isAuthenticated && (
                  <Button
                    onClick={() => setShowParticipateDialog(true)}
                    variant="outline"
                    className="h-11 px-6 border-border hover:bg-secondary/80 font-medium rounded-lg transition-all duration-200"
                    style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Participate
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="space-y-6">
            {/* Loading State */}
            {loading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-3 text-lg text-muted-foreground">Loading benchmarks...</span>
              </div>
            )}

            {/* Error State */}
            {error && !loading && (
              <Alert variant="destructive" className="max-w-2xl mx-auto">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Empty State */}
            {!loading && !error && filteredBenchmarks.length === 0 && (
              <div className="text-center py-12">
                <GitCompare className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No benchmarks found</h3>
                <p className="text-muted-foreground mb-6">
                  {searchQuery ? "Try adjusting your search terms" : "Be the first to create a benchmark"}
                </p>
                {isAuthenticated && !searchQuery && (
                  <Button onClick={() => setShowCreateDialog(true)} className="mx-auto">
                    <Plus className="w-4 h-4 mr-2" />
                    Create First Benchmark
                  </Button>
                )}
              </div>
            )}

            {/* Benchmarks Grid/List */}
            {!loading && !error && filteredBenchmarks.length > 0 && (
              <Tabs value={activeView} onValueChange={(value) => setActiveView(value as "grid" | "list")}>
                <TabsContent value="grid" className="mt-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredBenchmarks.map((benchmark) => (
                      <Card
                        key={benchmark.id}
                        className="overflow-hidden hover:shadow-lg transition-all duration-200 cursor-pointer border-border hover:border-primary/20 bg-card"
                        onClick={() => handleBenchmarkClick(benchmark)}
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between mb-2">
                            <CardTitle
                              className="text-lg font-semibold line-clamp-2 text-foreground"
                              style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}
                            >
                              {benchmark.title}
                            </CardTitle>
                            <Badge variant="outline" className="bg-primary/10 border-primary/20 text-primary rounded-lg ml-2 flex-shrink-0">
                              <Users className="h-3.5 w-3.5 mr-1.5" />
                              {benchmark.results_count}
                            </Badge>
                          </div>
                          <CardDescription
                            className="line-clamp-3 text-base leading-relaxed"
                            style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}
                          >
                            {benchmark.description}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <div className="text-sm font-medium">Original Repositories:</div>
                            <div className="space-y-1">
                              {benchmark.connections.slice(0, 2).map((connection) => (
                                <div key={connection.id} className="flex items-center gap-2 text-sm">
                                  <LinkIcon className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                                  <span className="truncate text-muted-foreground">{connection.connected_repo_path}</span>
                                </div>
                              ))}
                              {benchmark.connections.length > 2 && (
                                <div className="text-xs text-muted-foreground">
                                  +{benchmark.connections.length - 2} more repositories
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                        <CardFooter className="pt-3 border-t border-border">
                          <div className="flex items-center justify-between w-full text-sm text-muted-foreground">
                            <span>by {benchmark.created_by}</span>
                            <span>{timeAgo(benchmark.updated_at)}</span>
                          </div>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="list" className="mt-0">
                  <div className="space-y-4">
                    {filteredBenchmarks.map((benchmark) => (
                      <Card
                        key={benchmark.id}
                        className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => handleBenchmarkClick(benchmark)}
                      >
                        <div className="p-6">
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex-1">
                              <h3 className="text-xl font-semibold mb-2">{benchmark.title}</h3>
                              <p className="text-muted-foreground mb-4">{benchmark.description}</p>
                            </div>
                            <Badge variant="outline" className="bg-primary/10 border-primary/20 text-primary rounded-lg ml-4">
                              <Users className="h-3.5 w-3.5 mr-1.5" />
                              {benchmark.results_count} participants
                            </Badge>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                            <div>
                              <div className="text-sm font-medium mb-2">Original Repositories:</div>
                              <div className="space-y-1">
                                {benchmark.connections.map((connection) => (
                                  <div key={connection.id} className="flex items-center gap-2 text-sm">
                                    <LinkIcon className="h-3 w-3 text-muted-foreground" />
                                    <span className="truncate">{connection.connected_repo_path}</span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div className="flex flex-col justify-between">
                              <div className="text-sm text-muted-foreground">Created by {benchmark.created_by}</div>
                              <div className="text-sm text-muted-foreground mt-auto">
                                {timeAgo(benchmark.updated_at)}
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
            {!loading && !error && totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 mt-8">
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="flex items-center gap-2"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>

                <div className="text-center text-sm text-muted-foreground">
                  <span>
                    Page {currentPage} of {totalPages}
                  </span>
                </div>

                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="flex items-center gap-2"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Benchmark Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Benchmark</DialogTitle>
            <DialogDescription>
              Create a benchmark to compare optimization algorithms across different problems.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Title *</label>
              <Input
                placeholder="Enter benchmark title..."
                value={newBenchmark.title}
                onChange={(e) => setNewBenchmark({ ...newBenchmark, title: e.target.value })}
                className="w-full"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Description *</label>
              <Textarea
                placeholder="Describe your benchmark, the problem it addresses, and what participants should optimize..."
                value={newBenchmark.description}
                onChange={(e) => setNewBenchmark({ ...newBenchmark, description: e.target.value })}
                className="w-full min-h-[100px]"
              />
            </div>

            {/* Repository Selection */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Repositories *</label>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{newBenchmark.connections.length} selected</span>
                  <Select
                    onValueChange={(value) => {
                      if (
                        value !== "_select_repo_placeholder" &&
                        value !== "_your_repos_header" &&
                        value !== "_public_repos_header" &&
                        !newBenchmark.connections.some((c) => c.repoPath === value)
                      ) {
                        setNewBenchmark((prev) => ({
                          ...prev,
                          connections: [...prev.connections, { repoPath: value, description: "" }],
                        }))
                      }
                    }}
                  >
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Add Repository" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_select_repo_placeholder" disabled>
                        Select a repository
                      </SelectItem>

                      {userRepositories.length > 0 && (
                        <>
                          <SelectItem value="_your_repos_header" disabled className="font-medium">
                            Your Repositories
                          </SelectItem>
                          {userRepositories.map((repo) => (
                            <SelectItem key={`user-${repo.id}`} value={repo.full_name}>
                              <div className="flex items-center gap-2">
                                <FolderGit className="h-4 w-4" />
                                <span>{repo.full_name}</span>
                                {repo.qubot_type && (
                                  <Badge variant="outline" className="text-xs">
                                    {repo.qubot_type}
                                  </Badge>
                                )}
                              </div>
                            </SelectItem>
                          ))}
                        </>
                      )}

                      {publicRepos.length > 0 && (
                        <>
                          <SelectItem value="_public_repos_header" disabled className="font-medium">
                            Public Repositories
                          </SelectItem>
                          {publicRepos.map((repo) => (
                            <SelectItem key={`public-${repo.id}`} value={repo.full_name}>
                              <div className="flex items-center gap-2">
                                <FolderGit className="h-4 w-4" />
                                <span>{repo.full_name}</span>
                                {repo.qubot_type && (
                                  <Badge variant="outline" className="text-xs">
                                    {repo.qubot_type}
                                  </Badge>
                                )}
                              </div>
                            </SelectItem>
                          ))}
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Selected Repositories */}
              {newBenchmark.connections.length === 0 ? (
                <div className="text-sm text-muted-foreground border rounded-md p-4 text-center">
                  Add at least one repository to include in the benchmark
                </div>
              ) : (
                <div className="border rounded-md p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-medium">Selected Repositories:</div>
                    <Badge variant="outline">{newBenchmark.connections.length} selected</Badge>
                  </div>
                  <div className="space-y-2">
                    {newBenchmark.connections.map((connection, index) => (
                      <div key={index} className="flex items-center justify-between bg-muted/40 rounded-md p-2">
                        <div className="flex items-center gap-2 flex-1">
                          <LinkIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <span className="text-sm font-medium truncate">{connection.repoPath}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeConnection(index)}
                          className="h-6 w-6 p-0 hover:bg-destructive/10 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Notebook Upload (Optional) */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Jupyter Notebook (Optional)</label>
              <div className="border-2 border-dashed border-border rounded-lg p-4">
                <input
                  ref={createNotebookInputRef}
                  type="file"
                  accept=".ipynb"
                  onChange={handleCreateNotebookFileChange}
                  className="hidden"
                  id="create-notebook-upload"
                />
                <label
                  htmlFor="create-notebook-upload"
                  className="flex flex-col items-center justify-center cursor-pointer"
                >
                  <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                  <span className="text-sm font-medium">
                    {newBenchmark.notebookFile ? newBenchmark.notebookFile.name : "Upload Jupyter Notebook"}
                  </span>
                  <span className="text-xs text-muted-foreground mt-1">
                    Optional: Upload a .ipynb file to provide context or examples
                  </span>
                </label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateBenchmark} disabled={!newBenchmark.title || !newBenchmark.description || newBenchmark.connections.length === 0}>
              Create Benchmark
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Participate Dialog */}
      <Dialog open={showParticipateDialog} onOpenChange={setShowParticipateDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Participate in Benchmark</DialogTitle>
            <DialogDescription>
              Submit your optimization algorithm to participate in an existing benchmark.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Benchmark Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Benchmark *</label>
              <Select
                value={participation.benchmarkId.toString()}
                onValueChange={(value) => setParticipation({ ...participation, benchmarkId: Number.parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a benchmark to participate in" />
                </SelectTrigger>
                <SelectContent>
                  {benchmarks.map((benchmark) => (
                    <SelectItem key={benchmark.id} value={benchmark.id.toString()}>
                      <div className="flex flex-col items-start">
                        <span className="font-medium">{benchmark.title}</span>
                        <span className="text-xs text-muted-foreground truncate max-w-[300px]">
                          {benchmark.description}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Repository Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Your Repository *</label>
              <Select
                value={participation.repoPath}
                onValueChange={(value) => setParticipation({ ...participation, repoPath: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select your repository" />
                </SelectTrigger>
                <SelectContent>
                  {userRepositories.map((repo) => (
                    <SelectItem key={repo.id} value={repo.full_name}>
                      <div className="flex items-center gap-2">
                        <FolderGit className="h-4 w-4" />
                        <span>{repo.full_name}</span>
                        {repo.qubot_type && (
                          <Badge variant="outline" className="text-xs">
                            {repo.qubot_type}
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Notebook Upload (Optional) */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Jupyter Notebook (Optional)</label>
              <div className="border-2 border-dashed border-border rounded-lg p-4">
                <input
                  ref={participateNotebookInputRef}
                  type="file"
                  accept=".ipynb"
                  onChange={handleParticipateNotebookFileChange}
                  className="hidden"
                  id="participate-notebook-upload"
                />
                <label
                  htmlFor="participate-notebook-upload"
                  className="flex flex-col items-center justify-center cursor-pointer"
                >
                  <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                  <span className="text-sm font-medium">
                    {participation.notebookFile ? participation.notebookFile.name : "Upload Results Notebook"}
                  </span>
                  <span className="text-xs text-muted-foreground mt-1">
                    Optional: Upload a .ipynb file with your results and analysis
                  </span>
                </label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowParticipateDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleParticipateBenchmark}
              disabled={!participation.benchmarkId || !participation.repoPath}
            >
              Submit Participation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Benchmark Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="sm:max-w-[800px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedBenchmark?.title}</DialogTitle>
            <DialogDescription>
              {selectedBenchmark?.description}
            </DialogDescription>
          </DialogHeader>

          {selectedBenchmark && (
            <div className="space-y-6">
              {/* Benchmark Info */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Created by</div>
                  <div className="text-sm">{selectedBenchmark.created_by}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Total Participants</div>
                  <div className="text-sm font-semibold">{selectedBenchmark.results_count}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Created</div>
                  <div className="text-sm">{new Date(selectedBenchmark.created_at).toLocaleDateString()}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Last Updated</div>
                  <div className="text-sm">{timeAgo(selectedBenchmark.updated_at)}</div>
                </div>
              </div>

              {/* Original Repositories */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <FolderGit className="h-5 w-5" />
                  Original Repositories ({selectedBenchmark.connections.length})
                </h3>
                <div className="grid gap-3">
                  {selectedBenchmark.connections.map((connection) => (
                    <Card key={connection.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <LinkIcon className="h-4 w-4 text-muted-foreground" />
                          <Link
                            to={`/${connection.connected_repo_path}`}
                            className="font-medium hover:text-primary hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {connection.connected_repo_path}
                          </Link>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            window.open(`/${connection.connected_repo_path}`, '_blank')
                          }}
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          View
                        </Button>
                      </div>
                      {connection.description && (
                        <p className="text-sm text-muted-foreground mt-2">{connection.description}</p>
                      )}
                    </Card>
                  ))}
                </div>
              </div>

              {/* Participant Repositories */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Participant Repositories ({benchmarkResults.length})
                </h3>
                {benchmarkResults.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No participants yet</p>
                    <p className="text-sm">Be the first to participate in this benchmark!</p>
                  </div>
                ) : (
                  <div className="grid gap-3 max-h-[300px] overflow-y-auto">
                    {benchmarkResults.map((result) => (
                      <Card key={result.id} className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <LinkIcon className="h-4 w-4 text-muted-foreground" />
                            <Link
                              to={`/${result.repo_path}`}
                              className="font-medium hover:text-primary hover:underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {result.repo_path}
                            </Link>
                            <Badge variant="outline" className="text-xs">
                              by {result.user_id}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">
                              {new Date(result.created_at).toLocaleDateString()}
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                window.open(`/${result.repo_path}`, '_blank')
                              }}
                            >
                              <ExternalLink className="h-3 w-3 mr-1" />
                              View
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>

              {/* Participate Button */}
              {isAuthenticated && (
                <div className="flex justify-center pt-4 border-t border-border">
                  <Button
                    onClick={() => {
                      setParticipation({ ...participation, benchmarkId: selectedBenchmark.id })
                      setShowDetailDialog(false)
                      setShowParticipateDialog(true)
                    }}
                    className="px-8"
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Participate in this Benchmark
                  </Button>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  )
}
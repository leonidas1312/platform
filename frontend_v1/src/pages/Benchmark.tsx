import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { useSearchParams } from "react-router-dom"
import Layout from "../components/Layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Search,
  Globe,
  Lock,
  Calendar,
  User,
  Package,
  Loader2,
  Users,
  Plus,
  X,
  Target,
  ExternalLink,
  Trash2,
  ChevronDown
} from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { UserAvatar } from "@/components/ui/user-avatar"

const API = import.meta.env.VITE_API_BASE

interface Repository {
  id: number
  name: string
  full_name: string
  description: string
  username: string
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
  is_public: boolean
  tags: string[]
  problem_repositories: string[]
  views_count: number
  likes_count: number
  forks_count: number
  participants_count: number
}



// Abstract background patterns for cards
const backgroundPatterns = [
  "bg-gradient-to-br from-blue-500/20 to-purple-600/20",
  "bg-gradient-to-br from-green-500/20 to-blue-600/20",
  "bg-gradient-to-br from-purple-500/20 to-pink-600/20",
  "bg-gradient-to-br from-orange-500/20 to-red-600/20",
  "bg-gradient-to-br from-teal-500/20 to-cyan-600/20",
  "bg-gradient-to-br from-indigo-500/20 to-purple-600/20",
  "bg-gradient-to-br from-rose-500/20 to-pink-600/20",
  "bg-gradient-to-br from-amber-500/20 to-orange-600/20",
]

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const formatNumber = (num: number) => {
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'k'
  }
  return num.toString()
}

const BenchmarkPage = () => {
  const [searchParams, setSearchParams] = useSearchParams()

  const [benchmarks, setBenchmarks] = useState<Benchmark[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '')
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'created_at')
  const [sortOrder] = useState(searchParams.get('order') || 'desc')
  const [currentPage] = useState(parseInt(searchParams.get('page') || '1'))
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'community')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [selectedBenchmark, setSelectedBenchmark] = useState<Benchmark | null>(null)
  const [showBenchmarkModal, setShowBenchmarkModal] = useState(false)

  // Delete functionality state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [benchmarkToDelete, setBenchmarkToDelete] = useState<Benchmark | null>(null)
  const [deleting, setDeleting] = useState(false)

  // User repositories for benchmark creation
  const [userRepositories, setUserRepositories] = useState<Repository[]>([])
  const [loadingRepos, setLoadingRepos] = useState(false)

  // Create benchmark form state
  const [newBenchmark, setNewBenchmark] = useState({
    title: "",
    selectedRepositories: [] as string[],
    isPublic: false,
  })

  // Check authentication status and fetch user repositories
  useEffect(() => {
    const fetchUserRepos = async () => {
      setLoadingRepos(true)
      try {
        const response = await fetch(`${API}/api/repositories`, {
          credentials: "include",
        })

        if (response.ok) {
          const data = await response.json()
          // Filter only problem repositories
          const problemRepos = data.filter((repo: Repository) =>
            repo.qubot_type === 'problem'
          ) || []
          setUserRepositories(problemRepos)
        }
      } catch (error) {
        console.error("Error fetching user repositories:", error)
      } finally {
        setLoadingRepos(false)
      }
    }

    fetchUserRepos()
  }, [])

  // Fetch benchmarks when filters change
  useEffect(() => {
    fetchBenchmarks()
  }, [currentPage, sortBy, sortOrder, searchQuery, activeTab])

  // Update URL params when filters change
  useEffect(() => {
    const params = new URLSearchParams()
    if (searchQuery) params.set('search', searchQuery)
    if (sortBy !== 'created_at') params.set('sort', sortBy)
    if (sortOrder !== 'desc') params.set('order', sortOrder)
    if (currentPage !== 1) params.set('page', currentPage.toString())
    if (activeTab !== 'community') params.set('tab', activeTab)

    setSearchParams(params)
  }, [searchQuery, sortBy, sortOrder, currentPage, activeTab, setSearchParams])

  const fetchBenchmarks = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '12',
        sort: sortBy,
        order: sortOrder,
        ...(searchQuery && { search: searchQuery }),
        ...(activeTab === 'personal' && { personal: 'true' })
      })

      const response = await fetch(`${API}/api/benchmarks?${params}`, {
        credentials: "include",
      })

      if (response.ok) {
        const data = await response.json()
        setBenchmarks(data.benchmarks || [])
      } else {
        console.error("Failed to fetch benchmarks")
        setBenchmarks([])
      }
    } catch (error) {
      console.error("Error fetching benchmarks:", error)
      setBenchmarks([])
    } finally {
      setLoading(false)
    }
  }

  const handleCreateBenchmark = async () => {
    if (!newBenchmark.title.trim() || newBenchmark.selectedRepositories.length === 0) {
      toast({
        title: "Missing information",
        description: "Please provide title and select at least one repository",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch(`${API}/api/benchmarks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          title: newBenchmark.title.trim(),
          description: newBenchmark.title.trim(), // Use title as description
          problem_repositories: newBenchmark.selectedRepositories,
          tags: [], // Empty tags for now
          is_public: newBenchmark.isPublic,
        }),
      })

      if (response.ok) {
        toast({
          title: "Benchmark created",
          description: "Your benchmark has been created successfully",
        })
        setShowCreateDialog(false)
        setNewBenchmark({
          title: "",
          selectedRepositories: [],
          isPublic: false,
        })
        fetchBenchmarks()
      } else {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to create benchmark")
      }
    } catch (error) {
      console.error("Error creating benchmark:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create benchmark",
        variant: "destructive",
      })
    }
  }

  const handleRepositoryToggle = (repoPath: string) => {
    setNewBenchmark(prev => ({
      ...prev,
      selectedRepositories: prev.selectedRepositories.includes(repoPath)
        ? prev.selectedRepositories.filter(path => path !== repoPath)
        : [...prev.selectedRepositories, repoPath]
    }))
  }

  const handleBenchmarkClick = (benchmark: Benchmark) => {
    setSelectedBenchmark(benchmark)
    setShowBenchmarkModal(true)
  }

  const handleDeleteBenchmark = (benchmark: Benchmark) => {
    setBenchmarkToDelete(benchmark)
    setDeleteDialogOpen(true)
  }

  const confirmDeleteBenchmark = async () => {
    if (!benchmarkToDelete) return

    setDeleting(true)
    try {
      const response = await fetch(`${API}/api/benchmarks/${benchmarkToDelete.id}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (response.ok) {
        toast({
          title: "Benchmark Deleted",
          description: `"${benchmarkToDelete.title}" has been deleted successfully.`,
        })
        // Refresh the benchmarks list
        fetchBenchmarks()
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Failed to delete benchmark' }))
        throw new Error(errorData.message || 'Failed to delete benchmark')
      }
    } catch (error: any) {
      console.error('Error deleting benchmark:', error)
      toast({
        title: "Failed to Delete Benchmark",
        description: error.message || "An error occurred while deleting the benchmark.",
        variant: "destructive"
      })
    } finally {
      setDeleting(false)
      setDeleteDialogOpen(false)
      setBenchmarkToDelete(null)
    }
  }

  return (
    <Layout>
      <div className="min-h-screen w-full bg-background">
        <div className="w-full max-w-7xl mx-auto px-6 py-8">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-4 text-foreground">
              Benchmarks
            </h1>
            <p className="text-lg text-muted-foreground mb-6 max-w-4xl">
              Connect your problem repositories to build comprehensive evaluation suites.
            </p>

            {/* Search and Actions */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-4 flex-1">
                <div className="relative max-w-md flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    type="text"
                    placeholder="Search benchmarks..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-11"
                  />
                </div>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="created_at">Latest</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                {activeTab === 'personal' && benchmarks.length > 0 && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="destructive" disabled={loading}>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Benchmark
                        <ChevronDown className="h-4 w-4 ml-2" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-64">
                      {benchmarks.map((benchmark) => (
                        <DropdownMenuItem
                          key={benchmark.id}
                          onClick={() => handleDeleteBenchmark(benchmark)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          <div className="flex flex-col">
                            <span className="font-medium">{benchmark.title}</span>
                            <span className="text-xs text-muted-foreground">
                              {benchmark.is_public ? 'Public' : 'Private'}
                            </span>
                          </div>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
                <Button
                  onClick={() => setShowCreateDialog(true)}
                  className="h-11 px-6"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Benchmark
                </Button>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-2 mb-8">
              <TabsTrigger value="community" className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Community
              </TabsTrigger>
              <TabsTrigger value="personal" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Personal
              </TabsTrigger>
            </TabsList>

            <TabsContent value="community" className="mt-0">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="ml-3 text-lg text-muted-foreground">Loading benchmarks...</span>
                </div>
              ) : benchmarks.length === 0 ? (
                <div className="text-center py-12">
                  <Target className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No benchmarks found</h3>
                  <p className="text-muted-foreground mb-6">
                    {searchQuery ? "Try adjusting your search terms" : "Be the first to create a benchmark"}
                  </p>
                  <Button onClick={() => setShowCreateDialog(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create First Benchmark
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {benchmarks.map((benchmark, index) => (
                    <motion.div
                      key={benchmark.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                    >
                      <Card
                        className="overflow-hidden hover:shadow-lg transition-all duration-200 cursor-pointer border-border hover:border-primary/20 bg-card group"
                        onClick={() => handleBenchmarkClick(benchmark)}
                      >
                        {/* Abstract Background */}
                        <div className={`h-32 ${backgroundPatterns[index % backgroundPatterns.length]} relative`}>
                          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                          <div className="absolute top-4 right-4 flex items-center gap-2">
                            {benchmark.is_public ? (
                              <Badge variant="secondary" className="bg-green-500/20 border-green-500/30 text-green-700 dark:text-green-300">
                                <Globe className="h-3 w-3 mr-1" />
                                Public
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="bg-gray-500/20 border-gray-500/30 text-gray-700 dark:text-gray-300">
                                <Lock className="h-3 w-3 mr-1" />
                                Private
                              </Badge>
                            )}
                          </div>
                        </div>

                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg font-semibold line-clamp-2 text-foreground group-hover:text-primary transition-colors">
                            {benchmark.title}
                          </CardTitle>
                          
                        </CardHeader>

                        <CardContent className="space-y-4">
                          {/* Repository Count */}
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Package className="h-4 w-4" />
                            <span>{benchmark.problem_repositories.length} problem repositories</span>
                          </div>

                          {/* Tags */}
                          {benchmark.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {benchmark.tags.slice(0, 3).map((tag, tagIndex) => (
                                <Badge key={tagIndex} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                              {benchmark.tags.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{benchmark.tags.length - 3}
                                </Badge>
                              )}
                            </div>
                          )}

                          {/* Participants Count */}
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Users className="h-3 w-3" />
                            <span>{formatNumber(benchmark.participants_count)} participants</span>
                          </div>

                          {/* Creator and Date */}
                          <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2 border-t border-border">
                            <UserAvatar username={benchmark.created_by} size="sm" showTooltip />
                            <span>{benchmark.created_by}</span>
                            <span>•</span>
                            <Calendar className="h-3 w-3" />
                            <span>{formatDate(benchmark.created_at)}</span>
                          </div>


                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="personal" className="mt-0">
              {/* Same structure as community tab but filtered for user's benchmarks */}
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="ml-3 text-lg text-muted-foreground">Loading your benchmarks...</span>
                </div>
              ) : benchmarks.length === 0 ? (
                <div className="text-center py-12">
                  <Target className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No personal benchmarks</h3>
                  <p className="text-muted-foreground mb-6">
                    Create your first benchmark to get started
                  </p>
                  <Button onClick={() => setShowCreateDialog(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Benchmark
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {benchmarks.map((benchmark, index) => (
                    <motion.div
                      key={benchmark.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                    >
                      <Card
                        className="overflow-hidden hover:shadow-lg transition-all duration-200 cursor-pointer border-border hover:border-primary/20 bg-card group"
                        onClick={() => handleBenchmarkClick(benchmark)}
                      >
                        {/* Abstract Background */}
                        <div className={`h-32 ${backgroundPatterns[index % backgroundPatterns.length]} relative`}>
                          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                          <div className="absolute top-4 right-4 flex items-center gap-2">
                            {benchmark.is_public ? (
                              <Badge variant="secondary" className="bg-green-500/20 border-green-500/30 text-green-700 dark:text-green-300">
                                <Globe className="h-3 w-3 mr-1" />
                                Public
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="bg-gray-500/20 border-gray-500/30 text-gray-700 dark:text-gray-300">
                                <Lock className="h-3 w-3 mr-1" />
                                Private
                              </Badge>
                            )}
                          </div>
                        </div>

                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg font-semibold line-clamp-2 text-foreground group-hover:text-primary transition-colors">
                            {benchmark.title}
                          </CardTitle>
                          
                        </CardHeader>

                        <CardContent className="space-y-4">
                          {/* Repository Count */}
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Package className="h-4 w-4" />
                            <span>{benchmark.problem_repositories.length} problem repositories</span>
                          </div>

                          {/* Tags */}
                          {benchmark.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {benchmark.tags.slice(0, 3).map((tag, tagIndex) => (
                                <Badge key={tagIndex} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                              {benchmark.tags.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{benchmark.tags.length - 3}
                                </Badge>
                              )}
                            </div>
                          )}

                          {/* Participants Count */}
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Users className="h-3 w-3" />
                            <span>{formatNumber(benchmark.participants_count)} participants</span>
                          </div>

                          {/* Creator and Date */}
                          <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2 border-t border-border">
                            <UserAvatar username={benchmark.created_by} size="sm" showTooltip />
                            <span>{benchmark.created_by}</span>
                            <span>•</span>
                            <Calendar className="h-3 w-3" />
                            <span>{formatDate(benchmark.created_at)}</span>
                          </div>


                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Benchmark Details Modal */}
      <Dialog open={showBenchmarkModal} onOpenChange={setShowBenchmarkModal}>
        <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
          {selectedBenchmark && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  {selectedBenchmark.title}
                </DialogTitle>
                
              </DialogHeader>

              <div className="space-y-6">
                {/* Benchmark Info */}
                <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{selectedBenchmark.participants_count} participants</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Created {formatDate(selectedBenchmark.created_at)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <UserAvatar username={selectedBenchmark.created_by} size="sm" />
                    <span className="text-sm">{selectedBenchmark.created_by}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedBenchmark.is_public ? (
                      <>
                        <Globe className="h-4 w-4 text-green-500" />
                        <span className="text-sm text-green-600 dark:text-green-400">Public</span>
                      </>
                    ) : (
                      <>
                        <Lock className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">Private</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Tags */}
                {selectedBenchmark.tags.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Tags</Label>
                    <div className="flex flex-wrap gap-2">
                      {selectedBenchmark.tags.map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Problem Repositories */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Problem Repositories ({selectedBenchmark.problem_repositories.length})
                  </Label>
                  <div className="space-y-2">
                    {selectedBenchmark.problem_repositories.map((repoPath, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group"
                        onClick={() => window.open(`https://rastion.com/${repoPath}`, '_blank')}
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-primary/10 rounded-md">
                            <Package className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-sm group-hover:text-primary transition-colors">
                              {repoPath}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Click to view repository
                            </p>
                          </div>
                        </div>
                        <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowBenchmarkModal(false)}
                >
                  Close
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Benchmark Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Create Benchmark
            </DialogTitle>
            <DialogDescription>
              Connect your problem repositories to build comprehensive evaluation suites.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={newBenchmark.title}
                onChange={(e) => setNewBenchmark(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g., Vehicle Routing Problem Benchmark"
                required
              />
            </div>

            {/* Repository Selection */}
            <div className="space-y-3">
              <Label>Problem Repositories *</Label>
              <p className="text-sm text-muted-foreground">
                Select the problem repositories to include in this benchmark
              </p>

              {loadingRepos ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <span className="ml-2 text-sm text-muted-foreground">Loading repositories...</span>
                </div>
              ) : userRepositories.length === 0 ? (
                <div className="text-center py-8 border border-dashed border-border rounded-lg">
                  <Package className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No problem repositories found</p>
                  <p className="text-xs text-muted-foreground">Create some problem repositories first</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto border border-border rounded-lg p-3">
                  {userRepositories.map((repo) => (
                    <div key={repo.id} className="flex items-center space-x-3 p-2 hover:bg-muted/50 rounded">
                      <Checkbox
                        id={`repo-${repo.id}`}
                        checked={newBenchmark.selectedRepositories.includes(repo.full_name)}
                        onCheckedChange={() => handleRepositoryToggle(repo.full_name)}
                      />
                      <div className="flex-1 min-w-0">
                        <Label htmlFor={`repo-${repo.id}`} className="text-sm font-medium cursor-pointer">
                          {repo.full_name}
                        </Label>
                        
                      </div>
                      <div className="flex items-center gap-2">
                        {repo.qubot_type && (
                          <Badge
                            variant="outline"
                            className={`px-2 py-1 text-xs font-small border-none text-white ${
                              repo.qubot_type === "problem"
                                ? "bg-gradient-to-r from-blue-500 to-cyan-500"
                                : "bg-gradient-to-r from-orange-500 to-red-500"
                            }`}
                          >
                            {repo.qubot_type.charAt(0).toUpperCase() + repo.qubot_type.slice(1)}
                          </Badge>
                        )}
                        {repo.language && (
                          <Badge variant="outline" className="text-xs">
                            {repo.language}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Selected Repositories */}
              {newBenchmark.selectedRepositories.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Selected Repositories ({newBenchmark.selectedRepositories.length})</Label>
                  <div className="flex flex-wrap gap-2">
                    {newBenchmark.selectedRepositories.map((repoPath) => (
                      <Badge key={repoPath} variant="secondary" className="flex items-center gap-1">
                        {repoPath}
                        <X
                          className="h-3 w-3 cursor-pointer hover:text-destructive"
                          onClick={() => handleRepositoryToggle(repoPath)}
                        />
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Visibility */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="flex items-center gap-2">
                  {newBenchmark.isPublic ? (
                    <Globe className="h-4 w-4 text-green-500" />
                  ) : (
                    <Lock className="h-4 w-4 text-gray-500" />
                  )}
                  {newBenchmark.isPublic ? 'Public Benchmark' : 'Private Benchmark'}
                </Label>
                <p className="text-xs text-muted-foreground">
                  {newBenchmark.isPublic
                    ? 'Anyone can discover and use this benchmark'
                    : 'Only you can access this benchmark'
                  }
                </p>
              </div>
              <Switch
                checked={newBenchmark.isPublic}
                onCheckedChange={(checked) => setNewBenchmark(prev => ({ ...prev, isPublic: checked }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowCreateDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateBenchmark}
              disabled={!newBenchmark.title.trim() || newBenchmark.selectedRepositories.length === 0}
            >
              <Target className="h-4 w-4 mr-2" />
              Create Benchmark
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Benchmark</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{benchmarkToDelete?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteBenchmark}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  )
}

export default BenchmarkPage

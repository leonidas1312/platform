import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { useNavigate, useSearchParams } from "react-router-dom"
import Layout from "../components/Layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Search,
  Filter,
  Globe,
  Lock,
  Eye,
  Heart,
  GitFork,
  Calendar,
  User,
  Package,
  Settings,
  Play,
  Loader2
} from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { OptimizationWorkflow, WorkflowsResponse } from "@/types/playground"

const API = import.meta.env.VITE_API_BASE

const OptimizationWorkflows = () => {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const [workflows, setWorkflows] = useState<OptimizationWorkflow[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '')
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'created_at')
  const [sortOrder, setSortOrder] = useState(searchParams.get('order') || 'desc')
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get('page') || '1'))
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    fetchWorkflows()
  }, [searchQuery, sortBy, sortOrder, currentPage])

  useEffect(() => {
    // Update URL params when filters change
    const params = new URLSearchParams()
    if (searchQuery) params.set('search', searchQuery)
    if (sortBy !== 'created_at') params.set('sort', sortBy)
    if (sortOrder !== 'desc') params.set('order', sortOrder)
    if (currentPage !== 1) params.set('page', currentPage.toString())
    setSearchParams(params)
  }, [searchQuery, sortBy, sortOrder, currentPage, setSearchParams])

  const fetchWorkflows = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '12',
        sort: sortBy,
        order: sortOrder,
        ...(searchQuery && { search: searchQuery })
      })

      const response = await fetch(`${API}/api/playground/workflows?${params}`)

      if (response.ok) {
        const data: WorkflowsResponse = await response.json()
        setWorkflows(data.workflows)
        setTotalPages(data.pagination.totalPages)
        setTotal(data.pagination.total)
      } else {
        throw new Error('Failed to fetch workflows')
      }
    } catch (error: any) {
      console.error('Error fetching workflows:', error)
      toast({
        title: "Failed to Load Workflows",
        description: error.message || "An error occurred while loading workflows.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleWorkflowClick = (workflow: OptimizationWorkflow) => {
    // Navigate to workflow detail page
    navigate(`/workflow/${workflow.id}`)
  }

  const handleRunWorkflow = (workflow: OptimizationWorkflow, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent card click
    // Navigate to playground with workflow parameters
    const params = new URLSearchParams({
      workflow_id: workflow.id.toString(),
      problem_name: workflow.problem_name,
      problem_username: workflow.problem_username,
      optimizer_name: workflow.optimizer_name,
      optimizer_username: workflow.optimizer_username,
      problem_params: JSON.stringify(workflow.problem_params),
      optimizer_params: JSON.stringify(workflow.optimizer_params)
    })

    navigate(`/qubots-playground?${params}`)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPage(1)
    fetchWorkflows()
  }

  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20"
      >
        <div className="w-full px-6 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Optimization Workflows</h1>
            <p className="text-muted-foreground">
              Discover and share optimization workflows created by the community
            </p>
          </div>

          {/* Search and Filters */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <form onSubmit={handleSearch} className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search workflows, problems, optimizers..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <Button type="submit" disabled={loading}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  </Button>
                </div>

                <div className="flex gap-4 items-center">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Sort by:</span>
                  </div>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="created_at">Date Created</SelectItem>
                      <SelectItem value="updated_at">Last Updated</SelectItem>
                      <SelectItem value="views_count">Most Viewed</SelectItem>
                      <SelectItem value="likes_count">Most Liked</SelectItem>
                      <SelectItem value="title">Title</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={sortOrder} onValueChange={setSortOrder}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="desc">Descending</SelectItem>
                      <SelectItem value="asc">Ascending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Results Summary */}
          <div className="mb-6 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {loading ? 'Loading...' : `${total} workflow${total !== 1 ? 's' : ''} found`}
            </p>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Page {currentPage} of {totalPages}</span>
            </div>
          </div>

          {/* Workflows Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="h-3 bg-muted rounded"></div>
                      <div className="h-3 bg-muted rounded w-2/3"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : workflows.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No workflows found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery
                    ? `No workflows match your search for "${searchQuery}"`
                    : "No public workflows have been shared yet"
                  }
                </p>
                <Button onClick={() => navigate('/qubots-playground')}>
                  Create Your First Workflow
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {workflows.map((workflow) => (
                <WorkflowCard
                  key={workflow.id}
                  workflow={workflow}
                  onClick={() => handleWorkflowClick(workflow)}
                  onRun={(e: React.MouseEvent) => handleRunWorkflow(workflow, e)}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8 flex justify-center gap-2">
              <Button
                variant="outline"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1 || loading}
              >
                Previous
              </Button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const page = i + 1
                return (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    onClick={() => setCurrentPage(page)}
                    disabled={loading}
                  >
                    {page}
                  </Button>
                )
              })}
              <Button
                variant="outline"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages || loading}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      </motion.div>
    </Layout>
  )
}

interface WorkflowCardProps {
  workflow: OptimizationWorkflow
  onClick: () => void
  onRun: (e: React.MouseEvent) => void
}

function WorkflowCard({ workflow, onClick, onRun }: WorkflowCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02]" onClick={onClick}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg line-clamp-2 mb-1">{workflow.title}</CardTitle>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="h-3 w-3" />
              <span>{workflow.created_by}</span>
              <span>•</span>
              <Calendar className="h-3 w-3" />
              <span>{formatDate(workflow.created_at)}</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {workflow.is_public ? (
              <Globe className="h-4 w-4 text-green-500" />
            ) : (
              <Lock className="h-4 w-4 text-gray-500" />
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {workflow.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {workflow.description}
          </p>
        )}

        {/* Repositories Used Section */}
        <div className="space-y-3">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Repositories Used</div>
          <div className="grid grid-cols-1 gap-2">
            <div className="flex items-center gap-2 p-2 rounded-md bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
              <Package className="h-3 w-3 text-blue-500 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="text-xs font-medium text-blue-700 dark:text-blue-300">Problem</div>
                <div className="text-xs text-blue-600 dark:text-blue-400 truncate">{workflow.problem_username}/{workflow.problem_name}</div>
              </div>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-md bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
              <Settings className="h-3 w-3 text-green-500 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="text-xs font-medium text-green-700 dark:text-green-300">Optimizer</div>
                <div className="text-xs text-green-600 dark:text-green-400 truncate">{workflow.optimizer_username}/{workflow.optimizer_name}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Results Section */}
        {workflow.execution_results && (
          <div className="space-y-3">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Results Obtained</div>
            <div className="grid grid-cols-2 gap-2">
              <div className="text-center p-2 border rounded-md">
                <div className="text-lg font-bold">
                  {workflow.execution_results.success ? '✅' : '❌'}
                </div>
                <div className="text-xs text-muted-foreground">Status</div>
              </div>
              {workflow.execution_results.best_value !== undefined && (
                <div className="text-center p-2 border rounded-md">
                  <div className="text-sm font-bold text-green-600">
                    {typeof workflow.execution_results.best_value === 'number'
                      ? workflow.execution_results.best_value.toFixed(2)
                      : workflow.execution_results.best_value}
                  </div>
                  <div className="text-xs text-muted-foreground">Best Value</div>
                </div>
              )}
              {workflow.execution_results.execution_time && (
                <div className="text-center p-2 border rounded-md">
                  <div className="text-sm font-bold text-purple-600">
                    {workflow.execution_results.execution_time.toFixed(2)}s
                  </div>
                  <div className="text-xs text-muted-foreground">Time</div>
                </div>
              )}
              {workflow.execution_results.iterations && (
                <div className="text-center p-2 border rounded-md">
                  <div className="text-sm font-bold text-blue-600">
                    {workflow.execution_results.iterations.toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground">Iterations</div>
                </div>
              )}
            </div>
          </div>
        )}

        {workflow.tags && workflow.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {workflow.tags.slice(0, 3).map((tag, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
            {workflow.tags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{workflow.tags.length - 3}
              </Badge>
            )}
          </div>
        )}

        <Separator />

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              <span>{workflow.views_count}</span>
            </div>
            <div className="flex items-center gap-1">
              <Heart className="h-3 w-3" />
              <span>{workflow.likes_count}</span>
            </div>
            <div className="flex items-center gap-1">
              <GitFork className="h-3 w-3" />
              <span>{workflow.forks_count}</span>
            </div>
          </div>
          <Button size="sm" variant="ghost" className="h-6 px-2" onClick={onRun}>
            <Play className="h-3 w-3 mr-1" />
            Run
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default OptimizationWorkflows

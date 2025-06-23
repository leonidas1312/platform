import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { Search, Filter, Globe, Lock, Eye, Heart, GitFork, Calendar, Package, Settings, Play, Loader2, Trash2, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { toast } from "@/components/ui/use-toast"
import { OptimizationWorkflow, WorkflowsResponse } from "@/types/playground"
import { UserAvatar } from "@/components/ui/user-avatar"

const API = import.meta.env.VITE_API_BASE

const PersonalWorkflows = () => {
  const navigate = useNavigate()

  const [workflows, setWorkflows] = useState<OptimizationWorkflow[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('created_at')
  const [sortOrder, setSortOrder] = useState('desc')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [workflowToDelete, setWorkflowToDelete] = useState<OptimizationWorkflow | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    fetchWorkflows()
  }, [searchQuery, sortBy, sortOrder, currentPage])

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

      // Fetch personal workflows
      const endpoint = `${API}/api/playground/workflows/personal?${params}`

      const response = await fetch(endpoint, {
        credentials: 'include' // Include cookies for authentication
      })

      if (response.ok) {
        const data: WorkflowsResponse = await response.json()
        setWorkflows(data.workflows)
        setTotalPages(data.pagination.totalPages)
        setTotal(data.pagination.total)
      } else {
        if (response.status === 401) {
          toast({
            title: "Authentication Required",
            description: "Please log in to view your personal workflows.",
            variant: "destructive"
          })
          return
        }
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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPage(1)
    fetchWorkflows()
  }

  const handleDeleteWorkflow = (workflow: OptimizationWorkflow) => {
    setWorkflowToDelete(workflow)
    setDeleteDialogOpen(true)
  }

  const confirmDeleteWorkflow = async () => {
    if (!workflowToDelete) return

    setDeleting(true)
    try {
      const response = await fetch(`${API}/api/playground/workflows/${workflowToDelete.id}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (response.ok) {
        toast({
          title: "Workflow Deleted",
          description: `"${workflowToDelete.title}" has been deleted successfully.`,
        })
        // Refresh the workflows list
        fetchWorkflows()
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Failed to delete workflow' }))
        throw new Error(errorData.message || 'Failed to delete workflow')
      }
    } catch (error: any) {
      console.error('Error deleting workflow:', error)
      toast({
        title: "Failed to Delete Workflow",
        description: error.message || "An error occurred while deleting the workflow.",
        variant: "destructive"
      })
    } finally {
      setDeleting(false)
      setDeleteDialogOpen(false)
      setWorkflowToDelete(null)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  // Abstract background patterns for cards
  const backgroundPatterns = [
    'bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500',
    'bg-gradient-to-br from-green-400 via-blue-500 to-purple-600',
    'bg-gradient-to-br from-yellow-400 via-red-500 to-pink-500',
    'bg-gradient-to-br from-purple-400 via-pink-500 to-red-500',
    'bg-gradient-to-br from-indigo-400 via-purple-500 to-pink-500',
    'bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-600',
    'bg-gradient-to-br from-emerald-400 via-cyan-500 to-blue-500',
    'bg-gradient-to-br from-orange-400 via-red-500 to-pink-500',
    'bg-gradient-to-br from-teal-400 via-green-500 to-blue-500',
    'bg-gradient-to-br from-rose-400 via-pink-500 to-purple-500'
  ]

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search your workflows..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Button type="submit" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              </Button>
              {workflows.length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="destructive" disabled={loading}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Workflow
                      <ChevronDown className="h-4 w-4 ml-2" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-64">
                    {workflows.map((workflow) => (
                      <DropdownMenuItem
                        key={workflow.id}
                        onClick={() => handleDeleteWorkflow(workflow)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        <div className="flex flex-col">
                          <span className="font-medium">{workflow.title}</span>
                          <span className="text-xs text-muted-foreground">
                            {workflow.is_public ? 'Public' : 'Private'}
                          </span>
                        </div>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
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
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {loading ? 'Loading...' : `${total} personal workflow${total !== 1 ? 's' : ''} found`}
        </p>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Page {currentPage} of {totalPages}</span>
        </div>
      </div>

      {/* Workflows Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse overflow-hidden">
              <div className="h-20 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800"></div>
              <CardHeader>
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="h-3 bg-muted rounded"></div>
                  <div className="space-y-2">
                    <div className="h-8 bg-muted rounded"></div>
                    <div className="h-8 bg-muted rounded"></div>
                  </div>
                  <div className="flex gap-1">
                    <div className="h-5 bg-muted rounded w-12"></div>
                    <div className="h-5 bg-muted rounded w-16"></div>
                  </div>
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
                : "You haven't created any workflows yet"
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
              backgroundPatterns={backgroundPatterns}
              formatDate={formatDate}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-8 flex justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => setCurrentPage((prev: number) => Math.max(1, prev - 1))}
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
            onClick={() => setCurrentPage((prev: number) => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages || loading}
          >
            Next
          </Button>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Workflow</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{workflowToDelete?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteWorkflow}
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
    </div>
  )
}

interface WorkflowCardProps {
  workflow: OptimizationWorkflow
  onClick: () => void
  onRun: (e: React.MouseEvent) => void
  backgroundPatterns: string[]
  formatDate: (dateString: string) => string
}

function WorkflowCard({ workflow, onClick, onRun, backgroundPatterns, formatDate }: WorkflowCardProps) {
  // Use workflow ID to consistently assign the same pattern to the same workflow
  const patternIndex = workflow.id % backgroundPatterns.length
  const backgroundPattern = backgroundPatterns[patternIndex]

  return (
    <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02] overflow-hidden group" onClick={onClick}>
      {/* Abstract Background Header */}
      <div className={`h-20 ${backgroundPattern} relative`}>
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute top-2 right-2 flex items-center gap-1">
          {workflow.is_public ? (
            <Globe className="h-4 w-4 text-white/90" />
          ) : (
            <Lock className="h-4 w-4 text-white/90" />
          )}
        </div>
        {/* Abstract geometric shapes */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-0 w-16 h-16 bg-white/10 rounded-full -translate-x-8 -translate-y-8"></div>
          <div className="absolute bottom-0 right-0 w-12 h-12 bg-white/10 rounded-full translate-x-6 translate-y-6"></div>
          <div className="absolute top-1/2 left-1/2 w-8 h-8 bg-white/10 rounded-full -translate-x-4 -translate-y-4"></div>
        </div>
      </div>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg line-clamp-2 mb-1">{workflow.title}</CardTitle>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <UserAvatar username={workflow.created_by} size="sm" showTooltip />
              <span>{workflow.created_by}</span>
              <span>•</span>
              <Calendar className="h-3 w-3" />
              <span>{formatDate(workflow.created_at)}</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {workflow.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {workflow.description}
          </p>
        )}

        {/* Repositories Used Section - Compact */}
        <div className="space-y-2">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Repositories Used</div>
          <div className="grid grid-cols-1 gap-1.5">
            <div className="flex items-center gap-2 p-1.5 rounded-md bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
              <Package className="h-3 w-3 text-blue-500 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="text-xs font-medium text-blue-700 dark:text-blue-300">Problem</div>
                <div className="text-xs text-blue-600 dark:text-blue-400 truncate">{workflow.problem_username}/{workflow.problem_name}</div>
              </div>
            </div>
            <div className="flex items-center gap-2 p-1.5 rounded-md bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
              <Settings className="h-3 w-3 text-green-500 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="text-xs font-medium text-green-700 dark:text-green-300">Optimizer</div>
                <div className="text-xs text-green-600 dark:text-green-400 truncate">{workflow.optimizer_username}/{workflow.optimizer_name}</div>
              </div>
            </div>
          </div>
        </div>

        {workflow.tags && workflow.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {workflow.tags.slice(0, 3).map((tag, index) => (
              <Badge key={index} variant="secondary" className="text-xs h-5">
                {tag}
              </Badge>
            ))}
            {workflow.tags.length > 3 && (
              <Badge variant="outline" className="text-xs h-5">
                +{workflow.tags.length - 3}
              </Badge>
            )}
          </div>
        )}

        <Separator />

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
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
          <Button size="sm" variant="ghost" className="h-6 px-2 text-xs" onClick={onRun}>
            <Play className="h-3 w-3 mr-1" />
            Run
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default PersonalWorkflows

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
  Package,
  Settings,
  Play,
  Loader2,
  Copy,
  ExternalLink,
  Code
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "@/components/ui/use-toast"
import { OptimizationWorkflow, WorkflowsResponse } from "@/types/playground"
import { UserAvatar } from "@/components/ui/user-avatar"

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
  const [showCopyUrlDialog, setShowCopyUrlDialog] = useState(false)
  const [selectedWorkflowForUrl, setSelectedWorkflowForUrl] = useState<OptimizationWorkflow | null>(null)
  const [showUseLocallyDialog, setShowUseLocallyDialog] = useState(false)
  const [selectedWorkflowForCode, setSelectedWorkflowForCode] = useState<OptimizationWorkflow | null>(null)


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

      // Always fetch community workflows
      const endpoint = `${API}/api/playground/workflows/community?${params}`

      const response = await fetch(endpoint)

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
    // Navigate to workflow automation with workflow parameters
    const params = new URLSearchParams({
      workflow_id: workflow.id.toString(),
      problem_name: workflow.problem_name,
      problem_username: workflow.problem_username,
      optimizer_name: workflow.optimizer_name,
      optimizer_username: workflow.optimizer_username,
      problem_params: JSON.stringify(workflow.problem_params),
      optimizer_params: JSON.stringify(workflow.optimizer_params)
    })

    navigate(`/workflow-automation?${params}`)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPage(1)
    fetchWorkflows()
  }

  const handleCopyUrl = (workflow: OptimizationWorkflow, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent card click
    setSelectedWorkflowForUrl(workflow)
    setShowCopyUrlDialog(true)
  }

  const copyUrlToClipboard = () => {
    if (selectedWorkflowForUrl) {
      const params = new URLSearchParams({
        workflow_id: selectedWorkflowForUrl.id.toString(),
        problem_name: selectedWorkflowForUrl.problem_name,
        problem_username: selectedWorkflowForUrl.problem_username,
        optimizer_name: selectedWorkflowForUrl.optimizer_name,
        optimizer_username: selectedWorkflowForUrl.optimizer_username,
        problem_params: JSON.stringify(selectedWorkflowForUrl.problem_params),
        optimizer_params: JSON.stringify(selectedWorkflowForUrl.optimizer_params)
      })

      const url = `${window.location.origin}/qubots-playground?${params}`
      navigator.clipboard.writeText(url)
      toast({
        title: "URL Copied",
        description: "The experiment URL has been copied to your clipboard."
      })
    }
  }

  const handleRepositoryClick = (username: string, repoName: string, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent card click
    const repoUrl = `https://rastion.com/${username}/${repoName}`
    window.open(repoUrl, '_blank')
  }

  const handleUseLocally = (workflow: OptimizationWorkflow, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent card click
    setSelectedWorkflowForCode(workflow)
    setShowUseLocallyDialog(true)
  }

  const copyCodeToClipboard = () => {
    if (selectedWorkflowForCode) {
      const codeSnippet = generateCodeSnippet(selectedWorkflowForCode)
      navigator.clipboard.writeText(codeSnippet)
      toast({
        title: "Code Copied",
        description: "The qubots code snippet has been copied to your clipboard."
      })
    }
  }

  const generateCodeSnippet = (workflow: OptimizationWorkflow) => {
    const problemParams = Object.keys(workflow.problem_params).length > 0
      ? `, override_params=${JSON.stringify(workflow.problem_params, null, 2)}`
      : ''

    const optimizerParams = Object.keys(workflow.optimizer_params).length > 0
      ? `, override_params=${JSON.stringify(workflow.optimizer_params, null, 2)}`
      : ''

    return `from qubots import AutoProblem, AutoOptimizer

# Load problem from repository
problem = AutoProblem.from_repo("${workflow.problem_username}/${workflow.problem_name}"${problemParams})

# Load optimizer from repository
optimizer = AutoOptimizer.from_repo("${workflow.optimizer_username}/${workflow.optimizer_name}"${optimizerParams})

# Run optimization
result = optimizer.optimize(problem)

# Display results
print(f"Best Solution: {result.best_solution}")
print(f"Best Value: {result.best_value}")
print(f"Runtime: {result.runtime_seconds:.3f} seconds")
print(f"Iterations: {result.iterations}")
print(f"Success: {result.success}")
`
  }



  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20"
      >
        <div className="w-full max-w-7xl mx-auto px-6 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-4 text-foreground">
              Optimization Experiments by the Community
            </h1>
            <div className="space-y-4 text-muted-foreground max-w-4xl">
              <p className="text-lg">
                Explore and run optimization experiments created by the community.
              </p>
              <div className="space-y-2 text-base">
                <p>
                  • <strong>Optimization experiments</strong> are playground environments that can be shared within the Rastion community
                </p>
                <p>
                  • You can open an optimization experiment in the playground, adjust the parameters and run it directly in the platform
                </p>
              </div>
            </div>
          </div>

          {/* Community Workflows Content */}
          <div className="space-y-6">
            <WorkflowsContent
              workflows={workflows}
              loading={loading}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              sortBy={sortBy}
              setSortBy={setSortBy}
              sortOrder={sortOrder}
              setSortOrder={setSortOrder}
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
              totalPages={totalPages}
              total={total}
              handleSearch={handleSearch}
              handleWorkflowClick={handleWorkflowClick}
              handleRunWorkflow={handleRunWorkflow}
              handleCopyUrl={handleCopyUrl}
              handleRepositoryClick={handleRepositoryClick}
              handleUseLocally={handleUseLocally}
              tabType="community"
            />
          </div>
        </div>
      </motion.div>

      {/* Copy URL Dialog */}
      <Dialog open={showCopyUrlDialog} onOpenChange={setShowCopyUrlDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share Experiment</DialogTitle>
            <DialogDescription>
              Copy this URL to share the experiment with other Rastion users. They can run it directly in the playground.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-muted p-4 rounded-lg">
              <code className="text-sm font-mono break-all">
                {selectedWorkflowForUrl && `${window.location.origin}/qubots-playground?workflow_id=${selectedWorkflowForUrl.id}&problem_name=${selectedWorkflowForUrl.problem_name}&problem_username=${selectedWorkflowForUrl.problem_username}&optimizer_name=${selectedWorkflowForUrl.optimizer_name}&optimizer_username=${selectedWorkflowForUrl.optimizer_username}&problem_params=${encodeURIComponent(JSON.stringify(selectedWorkflowForUrl.problem_params))}&optimizer_params=${encodeURIComponent(JSON.stringify(selectedWorkflowForUrl.optimizer_params))}`}
              </code>
            </div>
            <Button
              onClick={copyUrlToClipboard}
              className="w-full"
              variant="outline"
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy to Clipboard
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Use Locally Dialog */}
      <Dialog open={showUseLocallyDialog} onOpenChange={setShowUseLocallyDialog}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Use Locally with Qubots</DialogTitle>
            <DialogDescription>
              Copy this code snippet to run the experiment locally using the qubots framework.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-muted p-4 rounded-lg">
              <pre className="text-sm font-mono whitespace-pre-wrap overflow-x-auto">
                {selectedWorkflowForCode && generateCodeSnippet(selectedWorkflowForCode)}
              </pre>
            </div>
            <Button
              onClick={copyCodeToClipboard}
              className="w-full"
              variant="outline"
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy Code to Clipboard
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    </Layout>
  )
}

interface WorkflowsContentProps {
  workflows: OptimizationWorkflow[]
  loading: boolean
  searchQuery: string
  setSearchQuery: (query: string) => void
  sortBy: string
  setSortBy: (sort: string) => void
  sortOrder: string
  setSortOrder: (order: string) => void
  currentPage: number
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>
  totalPages: number
  total: number
  handleSearch: (e: React.FormEvent) => void
  handleWorkflowClick: (workflow: OptimizationWorkflow) => void
  handleRunWorkflow: (workflow: OptimizationWorkflow, e: React.MouseEvent) => void
  handleCopyUrl: (workflow: OptimizationWorkflow, e: React.MouseEvent) => void
  handleRepositoryClick: (username: string, repoName: string, e: React.MouseEvent) => void
  handleUseLocally: (workflow: OptimizationWorkflow, e: React.MouseEvent) => void
  tabType: 'community'
}

function WorkflowsContent({
  workflows,
  loading,
  searchQuery,
  setSearchQuery,
  sortBy,
  setSortBy,
  sortOrder,
  setSortOrder,
  currentPage,
  setCurrentPage,
  totalPages,
  total,
  handleSearch,
  handleWorkflowClick,
  handleRunWorkflow,
  handleCopyUrl,
  handleRepositoryClick,
  handleUseLocally,
  tabType
}: WorkflowsContentProps) {
  const navigate = useNavigate()

  return (
    <>
      {/* Search and Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <form onSubmit={handleSearch} className="space-y-3">
            <div className="flex gap-3">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Search experiments, problems, optimizers..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 h-9 text-sm"
                  />
                </div>
              </div>
              <Button type="submit" disabled={loading} size="sm" className="h-9 px-3">
                {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
              </Button>
            </div>

            <div className="flex gap-3 items-center">
              <div className="flex items-center gap-2">
                <Filter className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Sort by:</span>
              </div>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-36 h-8 text-sm">
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
                <SelectTrigger className="w-28 h-8 text-sm">
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
          {loading ? 'Loading...' : `${total} optimization experiment${total !== 1 ? 's' : ''} found`}
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
              {/* Abstract Background Header Skeleton */}
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
            <h3 className="text-lg font-semibold mb-2">No experiments found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery
                ? `No experiments match your search for "${searchQuery}"`
                : "No community experiments have been shared yet"
              }
            </p>
            <Button onClick={() => navigate('/qubots-playground')}>
              Create an Experiment
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
              onCopyUrl={(e: React.MouseEvent) => handleCopyUrl(workflow, e)}
              onRepositoryClick={handleRepositoryClick}
              onUseLocally={(e: React.MouseEvent) => handleUseLocally(workflow, e)}
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
    </>
  )
}

interface WorkflowCardProps {
  workflow: OptimizationWorkflow
  onClick: () => void
  onRun: (e: React.MouseEvent) => void
  onCopyUrl: (e: React.MouseEvent) => void
  onRepositoryClick: (username: string, repoName: string, e: React.MouseEvent) => void
  onUseLocally: (e: React.MouseEvent) => void
}

function WorkflowCard({ workflow, onClick, onRun, onCopyUrl, onRepositoryClick, onUseLocally }: WorkflowCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  // Abstract background patterns - cycling through different designs
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
            <div
              className="flex items-center gap-2 p-1.5 rounded-md bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-950/30 transition-colors"
              onClick={(e) => onRepositoryClick(workflow.problem_username, workflow.problem_name, e)}
            >
              <Package className="h-3 w-3 text-blue-500 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="text-xs font-medium text-blue-700 dark:text-blue-300">Problem</div>
                <div className="text-xs text-blue-600 dark:text-blue-400 truncate flex items-center gap-1">
                  {workflow.problem_username}/{workflow.problem_name}
                  <ExternalLink className="h-2 w-2" />
                </div>
              </div>
            </div>
            <div
              className="flex items-center gap-2 p-1.5 rounded-md bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 cursor-pointer hover:bg-green-100 dark:hover:bg-green-950/30 transition-colors"
              onClick={(e) => onRepositoryClick(workflow.optimizer_username, workflow.optimizer_name, e)}
            >
              <Settings className="h-3 w-3 text-green-500 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="text-xs font-medium text-green-700 dark:text-green-300">Optimizer</div>
                <div className="text-xs text-green-600 dark:text-green-400 truncate flex items-center gap-1">
                  {workflow.optimizer_username}/{workflow.optimizer_name}
                  <ExternalLink className="h-2 w-2" />
                </div>
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
          <div className="flex items-center gap-1">
            <Button size="sm" variant="ghost" className="h-6 px-2 text-xs" onClick={onUseLocally}>
              <Code className="h-3 w-3 mr-1" />
              Use locally
            </Button>
          </div>
          <div className="flex items-center gap-1">
            <Button size="sm" variant="ghost" className="h-6 px-2 text-xs" onClick={onCopyUrl}>
              <Copy className="h-3 w-3 mr-1" />
              Copy URL
            </Button>
            <Button size="sm" variant="ghost" className="h-6 px-2 text-xs" onClick={onRun}>
              <Play className="h-3 w-3 mr-1" />
              Open as a workflow
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default OptimizationWorkflows

import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import Layout from "../components/Layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  ArrowLeft,
  Play,
  Globe,
  Lock,
  Eye,
  Heart,
  GitFork,
  Calendar,
  User,
  Package,
  Settings,
  Loader2,
  CheckCircle,
  AlertTriangle,
  BarChart3,
  ExternalLink
} from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { OptimizationWorkflow } from "@/types/playground"

const API = import.meta.env.VITE_API_BASE

const WorkflowDetail = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [workflow, setWorkflow] = useState<OptimizationWorkflow | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) {
      fetchWorkflow(id)
    }
  }, [id])

  const fetchWorkflow = async (workflowId: string) => {
    setLoading(true)
    try {
      const response = await fetch(`${API}/api/playground/workflows/${workflowId}`, {
        credentials: 'include' // Include cookies for authentication
      })

      if (response.ok) {
        const data = await response.json()
        setWorkflow(data.workflow)
      } else {
        if (response.status === 401 || response.status === 403) {
          const errorData = await response.json().catch(() => ({ message: 'Access denied' }))
          throw new Error(errorData.message || 'Workflow not found or you don\'t have permission to view it.')
        }
        throw new Error('Failed to fetch workflow')
      }
    } catch (error: any) {
      console.error('Error fetching workflow:', error)
      toast({
        title: "Failed to Load Workflow",
        description: error.message || "An error occurred while loading the workflow.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleOpenInPlayground = () => {
    if (!workflow) return

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
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Loading workflow...</p>
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  if (!workflow) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Workflow not found or you don't have permission to view it.
            </AlertDescription>
          </Alert>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => navigate('/optimization-workflows')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Workflows
          </Button>

          <Button
            onClick={handleOpenInPlayground}
            className="flex items-center gap-2"
          >
            <Play className="h-4 w-4" />
            Open in playground
          </Button>
        </div>

        {/* Workflow Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-2xl">{workflow.title}</CardTitle>
                    {workflow.is_public ? (
                      <Globe className="h-5 w-5 text-green-500" />
                    ) : (
                      <Lock className="h-5 w-5 text-gray-500" />
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      <span>{workflow.created_by}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>{formatDate(workflow.created_at)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    <span>{workflow.views_count}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Heart className="h-4 w-4" />
                    <span>{workflow.likes_count}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <GitFork className="h-4 w-4" />
                    <span>{workflow.forks_count}</span>
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {workflow.description && (
                <p className="text-muted-foreground">{workflow.description}</p>
              )}

              {workflow.tags && workflow.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {workflow.tags.map((tag, index) => (
                    <Badge key={index} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Configuration */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-blue-500" />
                    <span className="font-medium">Problem</span>
                  </div>
                  <div className="pl-6 space-y-1">
                    <a
                      href={`https://rastion.com/${workflow.problem_username}/${workflow.problem_name}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-blue-600 hover:underline flex items-center gap-1"
                    >
                      {workflow.problem_username}/{workflow.problem_name}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                    {Object.keys(workflow.problem_params || {}).length > 0 && (
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Parameters:</p>
                        <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                          {JSON.stringify(workflow.problem_params, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Settings className="h-4 w-4 text-green-500" />
                    <span className="font-medium">Optimizer</span>
                  </div>
                  <div className="pl-6 space-y-1">
                    <a
                      href={`https://rastion.com/${workflow.optimizer_username}/${workflow.optimizer_name}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-blue-600 hover:underline flex items-center gap-1"
                    >
                      {workflow.optimizer_username}/{workflow.optimizer_name}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                    {Object.keys(workflow.optimizer_params || {}).length > 0 && (
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Parameters:</p>
                        <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                          {JSON.stringify(workflow.optimizer_params, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Execution Results */}
        {workflow.execution_results && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Execution Results
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold">
                      {workflow.execution_results.success ? '✅' : '❌'}
                    </div>
                    <div className="text-sm text-muted-foreground">Status</div>
                  </div>
                  {workflow.execution_results.best_value !== undefined && (
                    <div className="text-center">
                      <div className="text-2xl font-bold">
                        {typeof workflow.execution_results.best_value === 'number'
                          ? workflow.execution_results.best_value.toFixed(4)
                          : workflow.execution_results.best_value}
                      </div>
                      <div className="text-sm text-muted-foreground">Best Value</div>
                    </div>
                  )}
                  {workflow.execution_results.iterations !== undefined && (
                    <div className="text-center">
                      <div className="text-2xl font-bold">
                        {workflow.execution_results.iterations?.toLocaleString() || 'N/A'}
                      </div>
                      <div className="text-sm text-muted-foreground">Iterations</div>
                    </div>
                  )}
                  <div className="text-center">
                    <div className="text-2xl font-bold">
                      {workflow.execution_results.execution_time && workflow.execution_results.execution_time > 0
                        ? `${workflow.execution_results.execution_time.toFixed(2)}s`
                        : 'N/A'}
                    </div>
                    <div className="text-sm text-muted-foreground">Execution Time</div>
                  </div>
                </div>

                <Separator className="my-4" />

                <div className="space-y-2">
                  <p className="text-sm font-medium">Raw Results:</p>
                  <pre className="text-xs bg-muted p-4 rounded overflow-x-auto max-h-96">
                    {JSON.stringify(workflow.execution_results, null, 2)}
                  </pre>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </Layout>
  )
}

export default WorkflowDetail

import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ArrowLeft,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  PlayCircle,
  ShieldCheck,
  Cpu,
  Trophy,
  ExternalLink,
  RefreshCw
} from 'lucide-react'
import Layout from '@/components/Layout'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'

const API = import.meta.env.VITE_API_BASE

interface SubmissionDetails {
  submission: {
    id: string
    solver_repository: string
    problem_id: number
    status: string
    progress: number
    current_step: string
    error_message?: string
    results?: any
    created_at: string
    updated_at: string
    num_runs: number
  }
  logs: string[]
}

const statusConfig = {
  pending: {
    icon: Clock,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-50 border-yellow-200',
    label: 'Pending'
  },
  validating: {
    icon: ShieldCheck,
    color: 'text-blue-500',
    bgColor: 'bg-blue-50 border-blue-200',
    label: 'Validating'
  },
  executing: {
    icon: Cpu,
    color: 'text-purple-500',
    bgColor: 'bg-purple-50 border-purple-200',
    label: 'Executing'
  },
  completed: {
    icon: CheckCircle,
    color: 'text-green-500',
    bgColor: 'bg-green-50 border-green-200',
    label: 'Completed'
  },
  failed: {
    icon: XCircle,
    color: 'text-red-500',
    bgColor: 'bg-red-50 border-red-200',
    label: 'Failed'
  },
  cancelled: {
    icon: AlertTriangle,
    color: 'text-gray-500',
    bgColor: 'bg-gray-50 border-gray-200',
    label: 'Cancelled'
  }
}

export default function SubmissionDetails() {
  const { submissionId } = useParams<{ submissionId: string }>()
  const [details, setDetails] = useState<SubmissionDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const fetchSubmissionDetails = async () => {
    if (!submissionId) return

    try {
      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('Authentication required')
      }

      const response = await fetch(`${API}/api/submissions/${submissionId}/status`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch submission details')
      }

      const data = await response.json()
      if (data.success) {
        setDetails(data)
      } else {
        throw new Error(data.message || 'Failed to fetch submission details')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSubmissionDetails()
    
    // Auto-refresh for active submissions
    const interval = setInterval(() => {
      if (details?.submission.status === 'pending' || 
          details?.submission.status === 'validating' || 
          details?.submission.status === 'executing') {
        fetchSubmissionDetails()
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [submissionId, details?.submission.status])

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-1/3 mb-6"></div>
            <div className="space-y-4">
              <div className="h-32 bg-muted rounded"></div>
              <div className="h-48 bg-muted rounded"></div>
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  if (error || !details) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Submission Not Found</h1>
            <p className="text-muted-foreground mb-4">
              {error || 'The requested submission could not be found.'}
            </p>
            <Link to="/leaderboard">
              <Button>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Leaderboard
              </Button>
            </Link>
          </div>
        </div>
      </Layout>
    )
  }

  const { submission, logs } = details
  const config = statusConfig[submission.status as keyof typeof statusConfig] || statusConfig.pending
  const StatusIcon = config.icon

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link to="/leaderboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Submission Details</h1>
            <p className="text-muted-foreground">
              {submission.solver_repository} • Problem {submission.problem_id}
            </p>
          </div>
          <div className="ml-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchSubmissionDetails}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Status Card */}
          <div className="lg:col-span-1">
            <Card className={config.bgColor}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <StatusIcon className={`h-5 w-5 ${config.color}`} />
                  {config.label}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {submission.progress > 0 && (
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Progress</span>
                      <span>{submission.progress}%</span>
                    </div>
                    <Progress value={submission.progress} />
                  </div>
                )}
                
                {submission.current_step && (
                  <div>
                    <p className="text-sm font-medium mb-1">Current Step</p>
                    <p className="text-sm text-muted-foreground">
                      {submission.current_step}
                    </p>
                  </div>
                )}

                {submission.error_message && (
                  <div>
                    <p className="text-sm font-medium mb-1 text-red-600">Error</p>
                    <p className="text-sm text-red-600 bg-red-50 p-2 rounded">
                      {submission.error_message}
                    </p>
                  </div>
                )}

                <Separator />

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Submission ID</span>
                    <span className="font-mono text-xs">{submission.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Runs</span>
                    <span>{submission.num_runs}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Created</span>
                    <span>{new Date(submission.created_at).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Updated</span>
                    <span>{new Date(submission.updated_at).toLocaleString()}</span>
                  </div>
                </div>

                {submission.results && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm font-medium mb-2">Results</p>
                      <div className="space-y-1 text-sm">
                        {submission.results.best_value && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Best Value</span>
                            <span className="font-mono">{submission.results.best_value}</span>
                          </div>
                        )}
                        {submission.results.runtime_seconds && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Runtime</span>
                            <span>{submission.results.runtime_seconds.toFixed(2)}s</span>
                          </div>
                        )}
                        {submission.results.rank && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Rank</span>
                            <span className="flex items-center gap-1">
                              <Trophy className="h-3 w-3 text-yellow-500" />
                              #{submission.results.rank}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Logs Card */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Execution Logs</CardTitle>
              </CardHeader>
              <CardContent>
                {logs.length > 0 ? (
                  <div className="bg-black text-green-400 p-4 rounded font-mono text-sm max-h-96 overflow-y-auto">
                    {logs.map((log, index) => (
                      <div key={index} className="mb-1">
                        {log}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    <PlayCircle className="h-8 w-8 mx-auto mb-2" />
                    <p>No logs available yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Actions */}
        {submission.status === 'completed' && submission.results?.leaderboard_id && (
          <div className="mt-6 text-center">
            <Link to={`/leaderboard?problem=${submission.problem_id}`}>
              <Button>
                <Trophy className="h-4 w-4 mr-2" />
                View on Leaderboard
                <ExternalLink className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
        )}
      </div>
    </Layout>
  )
}

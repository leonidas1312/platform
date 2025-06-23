import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Loader2, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Zap, 
  Target,
  AlertCircle,
  ExternalLink
} from "lucide-react"

interface SubmissionStatus {
  id: string
  status: 'pending' | 'validating' | 'executing' | 'completed' | 'failed'
  progress: number
  current_step: string
  solver_repository: string
  problem_name: string
  started_at: string
  completed_at?: string
  error_message?: string
  results?: {
    best_value: number
    runtime_seconds: number
    rank: number
    total_submissions: number
  }
}

interface SubmissionProgressProps {
  submissionId: string
  onComplete?: (results: any) => void
  onError?: (error: string) => void
}

export function SubmissionProgress({
  submissionId,
  onComplete,
  onError
}: SubmissionProgressProps) {
  const [status, setStatus] = useState<SubmissionStatus | null>(null)
  const [logs, setLogs] = useState<string[]>([])
  const [isPolling, setIsPolling] = useState(true)

  const API = import.meta.env.VITE_API_BASE

  useEffect(() => {
    if (!submissionId) return

    const pollStatus = async () => {
      try {
        const response = await fetch(`${API}/api/submissions/${submissionId}/status`, {
          credentials: 'include' // Use session-based authentication
        })

        if (response.ok) {
          const data = await response.json()
          setStatus(data.submission)
          
          if (data.logs) {
            setLogs(data.logs)
          }

          if (data.submission.status === 'completed') {
            setIsPolling(false)
            onComplete?.(data.submission.results)
          } else if (data.submission.status === 'failed') {
            setIsPolling(false)
            onError?.(data.submission.error_message || 'Submission failed')
          }
        }
      } catch (error) {
        console.error('Error polling submission status:', error)
      }
    }

    // Initial poll
    pollStatus()

    // Set up polling interval
    const interval = setInterval(pollStatus, 2000)

    return () => {
      clearInterval(interval)
      setIsPolling(false)
    }
  }, [submissionId, onComplete, onError])

  const getStatusIcon = () => {
    if (!status) return <Loader2 className="h-5 w-5 animate-spin" />

    switch (status.status) {
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />
      case 'validating':
      case 'executing':
        return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />
      default:
        return <Loader2 className="h-5 w-5 animate-spin" />
    }
  }

  const getStatusColor = () => {
    if (!status) return "bg-gray-500"

    switch (status.status) {
      case 'pending':
        return "bg-yellow-500"
      case 'validating':
      case 'executing':
        return "bg-blue-500"
      case 'completed':
        return "bg-green-500"
      case 'failed':
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  const formatDuration = (startTime: string, endTime?: string) => {
    const start = new Date(startTime)
    const end = endTime ? new Date(endTime) : new Date()
    const duration = Math.floor((end.getTime() - start.getTime()) / 1000)
    
    if (duration < 60) {
      return `${duration}s`
    } else if (duration < 3600) {
      return `${Math.floor(duration / 60)}m ${duration % 60}s`
    } else {
      return `${Math.floor(duration / 3600)}h ${Math.floor((duration % 3600) / 60)}m`
    }
  }

  if (!status) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>Loading submission status...</span>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getStatusIcon()}
            Submission Progress
            <Badge className={getStatusColor()}>
              {status.status.toUpperCase()}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Solver:</span>
              <p className="font-medium">{status.solver_repository}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Problem:</span>
              <p className="font-medium">{status.problem_name}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Started:</span>
              <p className="font-medium">{new Date(status.started_at).toLocaleString()}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Duration:</span>
              <p className="font-medium">{formatDuration(status.started_at, status.completed_at)}</p>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Progress</span>
              <span className="text-sm text-muted-foreground">{status.progress}%</span>
            </div>
            <Progress value={status.progress} className="w-full" />
            <p className="text-sm text-muted-foreground mt-1">{status.current_step}</p>
          </div>

          {status.error_message && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-center gap-2 text-red-700">
                <AlertCircle className="h-4 w-4" />
                <span className="font-medium">Error</span>
              </div>
              <p className="text-sm text-red-600 mt-1">{status.error_message}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      {status.status === 'completed' && status.results && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Benchmark Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {typeof status.results.best_value === 'number'
                    ? status.results.best_value.toFixed(2)
                    : status.results.best_value || 'N/A'}
                </div>
                <div className="text-sm text-muted-foreground">Best Value</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {typeof status.results.runtime_seconds === 'number'
                    ? `${status.results.runtime_seconds.toFixed(2)}s`
                    : status.results.runtime_seconds || 'N/A'}
                </div>
                <div className="text-sm text-muted-foreground">Runtime</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  #{status.results.rank}
                </div>
                <div className="text-sm text-muted-foreground">Rank</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {status.results.total_submissions}
                </div>
                <div className="text-sm text-muted-foreground">Total Submissions</div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t">
              <Button className="w-full" asChild>
                <a href={`/leaderboard?problem=${status.problem_name}`} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Full Leaderboard
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Execution Logs */}
      {logs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Execution Logs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-black text-green-400 p-4 rounded-lg font-mono text-sm max-h-64 overflow-y-auto">
              {logs.map((log, index) => (
                <div key={index} className="mb-1">
                  {log}
                </div>
              ))}
              {isPolling && status.status !== 'completed' && status.status !== 'failed' && (
                <div className="flex items-center gap-2 text-yellow-400">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span>Executing...</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

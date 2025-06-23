import React, { useEffect, useState } from 'react'
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Play, 
  Loader2,
  ExternalLink,
  Eye,
  RefreshCw
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useSubmissions } from '@/hooks/use-submissions'
import { cn } from '@/lib/utils'

interface Submission {
  id: string
  user_id: number
  solver_repository: string
  problem_id: number
  custom_parameters: string
  num_runs: number
  status: 'pending' | 'validating' | 'executing' | 'completed' | 'failed' | 'cancelled'
  progress: number
  current_step?: string
  error_message?: string
  results?: any
  created_at: string
  updated_at: string
}

interface SubmissionDetailsCardProps {
  submission: Submission
  onViewLeaderboard?: () => void
  className?: string
}

const statusConfig = {
  pending: {
    icon: Clock,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
    label: 'Pending',
    variant: 'secondary' as const
  },
  validating: {
    icon: AlertTriangle,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    label: 'Validating',
    variant: 'secondary' as const
  },
  executing: {
    icon: Play,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    label: 'Executing',
    variant: 'secondary' as const
  },
  completed: {
    icon: CheckCircle,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    label: 'Completed',
    variant: 'default' as const
  },
  failed: {
    icon: XCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    label: 'Failed',
    variant: 'destructive' as const
  },
  cancelled: {
    icon: XCircle,
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    label: 'Cancelled',
    variant: 'outline' as const
  }
}

export const SubmissionDetailsCard: React.FC<SubmissionDetailsCardProps> = ({
  submission,
  onViewLeaderboard,
  className
}) => {
  const { 
    connectToSubmissionStream, 
    disconnectFromSubmissionStream, 
    submissionDetails, 
    isStreamConnected 
  } = useSubmissions()
  
  const [isExpanded, setIsExpanded] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(false)

  const config = statusConfig[submission.status]
  const IconComponent = config.icon

  // Connect to real-time stream for active submissions
  useEffect(() => {
    if (submission.status === 'pending' || submission.status === 'validating' || submission.status === 'executing') {
      connectToSubmissionStream(submission.id)
      setAutoRefresh(true)
    } else {
      disconnectFromSubmissionStream()
      setAutoRefresh(false)
    }

    return () => {
      disconnectFromSubmissionStream()
    }
  }, [submission.id, submission.status, connectToSubmissionStream, disconnectFromSubmissionStream])

  // Use real-time data if available, otherwise use prop data
  const currentSubmission = submissionDetails?.submission || submission
  const logs = submissionDetails?.logs || []

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const formatDuration = (startDate: string, endDate?: string) => {
    const start = new Date(startDate)
    const end = endDate ? new Date(endDate) : new Date()
    const diffMs = end.getTime() - start.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffSecs = Math.floor((diffMs % 60000) / 1000)
    
    if (diffMins > 0) {
      return `${diffMins}m ${diffSecs}s`
    }
    return `${diffSecs}s`
  }

  const parseCustomParameters = (params: string) => {
    try {
      return JSON.parse(params || '{}')
    } catch {
      return {}
    }
  }

  const customParams = parseCustomParameters(currentSubmission.custom_parameters)

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn("p-2 rounded-lg", config.bgColor)}>
              <IconComponent className={cn("h-5 w-5", config.color)} />
            </div>
            <div>
              <CardTitle className="text-lg">
                {currentSubmission.solver_repository}
              </CardTitle>
              <CardDescription>
                Problem ID: {currentSubmission.problem_id} • {currentSubmission.num_runs} runs
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isStreamConnected && autoRefresh && (
              <div className="flex items-center gap-1 text-xs text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                Live
              </div>
            )}
            <Badge variant={config.variant}>
              {config.label}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress Bar */}
        {(currentSubmission.status === 'pending' || 
          currentSubmission.status === 'validating' || 
          currentSubmission.status === 'executing') && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>{currentSubmission.progress || 0}%</span>
            </div>
            <Progress value={currentSubmission.progress || 0} className="h-2" />
            {currentSubmission.current_step && (
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Loader2 className="h-3 w-3 animate-spin" />
                {currentSubmission.current_step}
              </p>
            )}
          </div>
        )}

        {/* Error Message */}
        {currentSubmission.status === 'failed' && currentSubmission.error_message && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {currentSubmission.error_message}
            </AlertDescription>
          </Alert>
        )}

        {/* Submission Info */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium">Submitted:</span>
            <p className="text-muted-foreground">{formatDate(currentSubmission.created_at)}</p>
          </div>
          <div>
            <span className="font-medium">Duration:</span>
            <p className="text-muted-foreground">
              {formatDuration(currentSubmission.created_at, currentSubmission.updated_at)}
            </p>
          </div>
        </div>

        {/* Custom Parameters */}
        {Object.keys(customParams).length > 0 && (
          <div>
            <span className="font-medium text-sm">Parameters:</span>
            <div className="mt-1 p-2 bg-muted rounded text-xs font-mono">
              {JSON.stringify(customParams, null, 2)}
            </div>
          </div>
        )}

        {/* Results */}
        {currentSubmission.status === 'completed' && currentSubmission.results && (
          <div>
            <span className="font-medium text-sm">Results:</span>
            <div className="mt-1 p-2 bg-green-50 border border-green-200 rounded text-xs">
              <pre>{JSON.stringify(currentSubmission.results, null, 2)}</pre>
            </div>
          </div>
        )}

        {/* Logs Section */}
        {logs.length > 0 && (
          <div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-0 h-auto font-medium text-sm"
            >
              <Eye className="h-3 w-3 mr-1" />
              {isExpanded ? 'Hide' : 'Show'} Execution Logs ({logs.length})
            </Button>
            
            {isExpanded && (
              <ScrollArea className="h-32 mt-2 p-2 bg-gray-50 rounded border">
                <div className="space-y-1">
                  {logs.map((log, index) => (
                    <div key={index} className="text-xs font-mono text-gray-700">
                      {log}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          {currentSubmission.status === 'completed' && onViewLeaderboard && (
            <Button size="sm" onClick={onViewLeaderboard}>
              <ExternalLink className="h-3 w-3 mr-1" />
              View Leaderboard
            </Button>
          )}
          
          {(currentSubmission.status === 'pending' || 
            currentSubmission.status === 'validating' || 
            currentSubmission.status === 'executing') && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => connectToSubmissionStream(currentSubmission.id)}
              disabled={isStreamConnected}
            >
              <RefreshCw className={cn("h-3 w-3 mr-1", isStreamConnected && "animate-spin")} />
              {isStreamConnected ? 'Connected' : 'Reconnect'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default SubmissionDetailsCard

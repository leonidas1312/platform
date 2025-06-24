import React, { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  X,
  Play,
  Square,
  RotateCcw,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Info,
  Terminal,
  Clock,
  Zap,
  ChevronDown,
  ChevronRight
} from 'lucide-react'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@/components/ui/collapsible'
import { ExecutionState, ExecutionLog, ExecutionStatus } from '@/types/workflow-automation'

interface ExecutionStep {
  id: string
  name: string
  status: 'pending' | 'running' | 'completed' | 'error'
  startTime?: Date
  endTime?: Date
  logs: ExecutionLog[]
}

interface ExecutionLogsSidebarProps {
  isOpen: boolean
  onClose: () => void
  executionState: ExecutionState
  onExecute: () => void
  onStop: () => void
  onReset: () => void
  isExecuting: boolean
}

const getLogIcon = (level: string) => {
  switch (level) {
    case 'error':
      return <XCircle className="h-4 w-4 text-red-500" />
    case 'warning':
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />
    case 'info':
      return <Info className="h-4 w-4 text-blue-500" />
    case 'debug':
      return <Terminal className="h-4 w-4 text-gray-500" />
    default:
      return <Info className="h-4 w-4 text-blue-500" />
  }
}

const getStepIcon = (status: ExecutionStep['status']) => {
  switch (status) {
    case 'pending':
      return <Clock className="h-4 w-4 text-gray-400" />
    case 'running':
      return <Play className="h-4 w-4 text-blue-500 animate-pulse" />
    case 'completed':
      return <CheckCircle className="h-4 w-4 text-green-500" />
    case 'error':
      return <XCircle className="h-4 w-4 text-red-500" />
    default:
      return <Clock className="h-4 w-4 text-gray-400" />
  }
}

const organizeLogsIntoSteps = (logs: ExecutionLog[]): ExecutionStep[] => {
  const steps: ExecutionStep[] = []
  let currentStep: ExecutionStep | null = null

  logs.forEach((log) => {
    // Check if this log indicates a new step
    const stepIndicators = [
      'Starting',
      'Initializing',
      'Loading',
      'Executing',
      'Processing',
      'Validating',
      'Completing',
      'Finished'
    ]

    const isNewStep = stepIndicators.some(indicator =>
      log.message.includes(indicator) && log.level === 'info'
    )

    if (isNewStep || !currentStep) {
      // Create new step
      const stepName = extractStepName(log.message)
      const stepStatus = log.level === 'error' ? 'error' : 'running'

      currentStep = {
        id: `step-${steps.length + 1}`,
        name: stepName,
        status: stepStatus,
        startTime: log.timestamp,
        logs: [log]
      }
      steps.push(currentStep)
    } else {
      // Add log to current step
      currentStep.logs.push(log)

      // Update step status based on log level
      if (log.level === 'error') {
        currentStep.status = 'error'
      } else if (log.message.includes('completed') || log.message.includes('finished')) {
        currentStep.status = 'completed'
        currentStep.endTime = log.timestamp
      }
    }
  })

  return steps
}

const extractStepName = (message: string): string => {
  // Extract meaningful step names from log messages
  if (message.includes('Starting')) return 'Initialization'
  if (message.includes('Loading')) return 'Loading Resources'
  if (message.includes('Executing')) return 'Execution'
  if (message.includes('Processing')) return 'Processing Results'
  if (message.includes('Validating')) return 'Validation'
  if (message.includes('Completing')) return 'Completion'

  // Fallback: use first few words of the message
  return message.split(' ').slice(0, 3).join(' ')
}

const getStatusColor = (status: ExecutionStatus) => {
  switch (status) {
    case 'running':
      return 'text-blue-600'
    case 'completed':
      return 'text-green-600'
    case 'error':
      return 'text-red-600'
    case 'cancelled':
      return 'text-yellow-600'
    case 'paused':
      return 'text-orange-600'
    default:
      return 'text-gray-600'
  }
}

const getStatusIcon = (status: ExecutionStatus) => {
  switch (status) {
    case 'running':
      return <Play className="h-4 w-4 text-blue-600" />
    case 'completed':
      return <CheckCircle className="h-4 w-4 text-green-600" />
    case 'error':
      return <XCircle className="h-4 w-4 text-red-600" />
    case 'cancelled':
      return <Square className="h-4 w-4 text-yellow-600" />
    case 'paused':
      return <AlertTriangle className="h-4 w-4 text-orange-600" />
    default:
      return <Clock className="h-4 w-4 text-gray-600" />
  }
}

const ExecutionLogsSidebar: React.FC<ExecutionLogsSidebarProps> = ({
  isOpen,
  onClose,
  executionState,
  onExecute,
  onStop,
  onReset,
  isExecuting
}) => {
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const [autoScroll, setAutoScroll] = useState(true)
  const [expandedSteps, setExpandedSteps] = useState<Record<string, boolean>>({})

  // Organize logs into steps
  const steps = organizeLogsIntoSteps(executionState.logs)

  // Auto-expand the currently running step
  useEffect(() => {
    const runningStep = steps.find(step => step.status === 'running')
    if (runningStep && !expandedSteps[runningStep.id]) {
      setExpandedSteps(prev => ({ ...prev, [runningStep.id]: true }))
    }
  }, [steps])

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (autoScroll && scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]')
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight
      }
    }
  }, [executionState.logs, autoScroll])

  const toggleStepExpansion = (stepId: string) => {
    setExpandedSteps(prev => ({ ...prev, [stepId]: !prev[stepId] }))
  }

  if (!isOpen) {
    return null
  }

  const formatTimestamp = (timestamp: Date) => {
    return timestamp.toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    })
  }

  const formatDuration = (startTime?: Date, endTime?: Date) => {
    if (!startTime) return '0s'
    const end = endTime || new Date()
    const duration = Math.floor((end.getTime() - startTime.getTime()) / 1000)
    
    if (duration < 60) return `${duration}s`
    if (duration < 3600) return `${Math.floor(duration / 60)}m ${duration % 60}s`
    return `${Math.floor(duration / 3600)}h ${Math.floor((duration % 3600) / 60)}m`
  }

  return (
    <div className="w-96 border-l bg-white dark:bg-slate-900 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-orange-600" />
            <h3 className="font-semibold">Workflow Execution</h3>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Status */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            {getStatusIcon(executionState.status)}
            <span className={`font-medium text-sm ${getStatusColor(executionState.status)}`}>
              {executionState.status.charAt(0).toUpperCase() + executionState.status.slice(1)}
            </span>
            {executionState.startTime && (
              <span className="text-xs text-muted-foreground">
                {formatDuration(executionState.startTime, executionState.endTime)}
              </span>
            )}
          </div>
          
          {/* Progress */}
          {executionState.status === 'running' && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span>Progress</span>
                <span>{Math.round(executionState.progress)}%</span>
              </div>
              <Progress value={executionState.progress} className="h-2" />
              {executionState.currentStep && (
                <p className="text-xs text-muted-foreground">{executionState.currentStep}</p>
              )}
            </div>
          )}
          
          {/* Metrics */}
          {executionState.metrics && (
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-muted-foreground">Steps:</span>
                <span className="ml-1 font-medium">
                  {executionState.metrics.completedSteps}/{executionState.metrics.totalSteps}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Time:</span>
                <span className="ml-1 font-medium">{executionState.metrics.executionTime}s</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Logs */}
      <div className="flex-1 flex flex-col">
        <div className="p-3 border-b">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm">Execution Logs</h4>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setAutoScroll(!autoScroll)}
                className={autoScroll ? "text-blue-600" : ""}
              >
                Auto-scroll
              </Button>
              <Badge variant="outline" className="text-xs">
                {steps.length} steps
              </Badge>
            </div>
          </div>
        </div>
        
        <ScrollArea ref={scrollAreaRef} className="flex-1">
          <div className="p-3 space-y-2">
            {steps.length === 0 ? (
              <div className="text-center py-8">
                <Terminal className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No execution steps yet</p>
                <p className="text-xs text-muted-foreground">Steps will appear here during execution</p>
              </div>
            ) : (
              steps.map((step) => (
                <Collapsible
                  key={step.id}
                  open={expandedSteps[step.id] !== false}
                  onOpenChange={() => toggleStepExpansion(step.id)}
                >
                  <CollapsibleTrigger asChild>
                    <div className="flex items-center gap-2 p-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer border border-gray-200 dark:border-gray-700">
                      {expandedSteps[step.id] !== false ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                      {getStepIcon(step.status)}
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm">{step.name}</span>
                          <div className="flex items-center gap-2">
                            {step.startTime && (
                              <span className="text-xs text-muted-foreground">
                                {formatTimestamp(step.startTime)}
                              </span>
                            )}
                            <Badge
                              variant={step.status === 'error' ? 'destructive' :
                                     step.status === 'completed' ? 'default' :
                                     step.status === 'running' ? 'secondary' : 'outline'}
                              className="text-xs"
                            >
                              {step.logs.length}
                            </Badge>
                          </div>
                        </div>
                        {step.endTime && step.startTime && (
                          <div className="text-xs text-muted-foreground">
                            Duration: {Math.round((step.endTime.getTime() - step.startTime.getTime()) / 1000)}s
                          </div>
                        )}
                      </div>
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-1 mt-2 ml-6">
                    {step.logs.map((log) => (
                      <div key={log.id} className="flex gap-2 text-xs py-1">
                        <span className="text-muted-foreground font-mono">
                          {formatTimestamp(log.timestamp)}
                        </span>
                        {getLogIcon(log.level)}
                        <div className="flex-1">
                          <span className="font-medium">{log.message}</span>
                          {log.source && (
                            <span className="text-muted-foreground ml-2">({log.source})</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Controls */}
      <div className="p-4 border-t">
        <div className="flex gap-2">
          {!isExecuting ? (
            <Button onClick={onExecute} className="flex-1" disabled={executionState.status === 'running'}>
              <Play className="h-4 w-4 mr-2" />
              Execute
            </Button>
          ) : (
            <Button onClick={onStop} variant="destructive" className="flex-1">
              <Square className="h-4 w-4 mr-2" />
              Stop
            </Button>
          )}
          <Button onClick={onReset} variant="outline" disabled={isExecuting}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
        </div>
        
        {executionState.error && (
          <div className="mt-3 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-xs">
            <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
              <XCircle className="h-3 w-3" />
              <span className="font-medium">Error</span>
            </div>
            <p className="mt-1 text-red-600 dark:text-red-300">{executionState.error}</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default ExecutionLogsSidebar

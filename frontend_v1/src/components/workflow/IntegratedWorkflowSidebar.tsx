import React, { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
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
  Database,
  Brain,
  ChevronDown,
  ChevronRight,
  Settings,
  Edit3,
  Save,
  Link
} from 'lucide-react'
import { ExecutionState, ExecutionLog, ExecutionStatus, WorkflowNode, WorkflowConnection } from '@/types/workflow-automation'
import ParameterPanel from './ParameterPanel'

interface ExecutionStep {
  id: string
  name: string
  status: 'pending' | 'running' | 'completed' | 'error'
  startTime?: Date
  endTime?: Date
  logs: ExecutionLog[]
}

interface IntegratedWorkflowSidebarProps {
  isOpen: boolean
  onClose: () => void
  nodes: WorkflowNode[]
  connections: WorkflowConnection[]
  executionState: ExecutionState
  onExecute: () => void
  onStop: () => void
  onReset: () => void
  onParameterChange: (nodeId: string, parameters: Record<string, any>) => void
  isExecuting: boolean
}

const getNodeIcon = (type: string) => {
  switch (type) {
    case 'dataset':
      return <Database className="h-4 w-4 text-blue-600" />
    case 'problem':
      return <Brain className="h-4 w-4 text-green-600" />
    case 'optimizer':
      return <Zap className="h-4 w-4 text-orange-600" />
    default:
      return <Settings className="h-4 w-4 text-gray-600" />
  }
}

const getNodeColor = (type: string) => {
  switch (type) {
    case 'dataset':
      return 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950'
    case 'problem':
      return 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950'
    case 'optimizer':
      return 'border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950'
    default:
      return 'border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-950'
  }
}

const getLogIcon = (level: string) => {
  switch (level) {
    case 'error':
      return <XCircle className="h-3 w-3 text-red-500" />
    case 'warning':
      return <AlertTriangle className="h-3 w-3 text-yellow-500" />
    case 'info':
      return <Info className="h-3 w-3 text-blue-500" />
    case 'debug':
      return <Terminal className="h-3 w-3 text-gray-500" />
    default:
      return <Info className="h-3 w-3 text-blue-500" />
  }
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

  logs.forEach((log, index) => {
    // Check if this log indicates a new step
    const stepIndicators = [
      'Starting workflow execution',
      'Creating execution job',
      'Waiting for optimization',
      'Optimization job completed',
      'Optimization completed',
      'Workflow execution completed'
    ]

    const isNewStep = stepIndicators.some(indicator =>
      log.message.includes(indicator) && log.level === 'info'
    ) || (!currentStep && index === 0)

    if (isNewStep) {
      // Complete the previous step if it exists
      if (currentStep && currentStep.status === 'running') {
        currentStep.status = 'completed'
        currentStep.endTime = log.timestamp
      }

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
    } else if (currentStep) {
      // Add log to current step
      currentStep.logs.push(log)

      // Update step status based on log level and content
      if (log.level === 'error') {
        currentStep.status = 'error'
        currentStep.endTime = log.timestamp
      } else if (log.message.includes('completed') || log.message.includes('finished') || log.message.includes('successfully')) {
        currentStep.status = 'completed'
        currentStep.endTime = log.timestamp
      }
    }
  })

  // Ensure the last step is properly closed
  if (currentStep && currentStep.status === 'running' && logs.length > 0) {
    const lastLog = logs[logs.length - 1]
    if (lastLog.level === 'error') {
      currentStep.status = 'error'
      currentStep.endTime = lastLog.timestamp
    }
  }

  return steps
}

const extractStepName = (message: string): string => {
  // Extract meaningful step names from workflow execution log messages
  if (message.includes('Starting workflow execution')) return 'Workflow Initialization'
  if (message.includes('Creating execution job')) return 'Job Creation'
  if (message.includes('Waiting for optimization')) return 'Optimization Execution'
  if (message.includes('Optimization job completed')) return 'Job Completion'
  if (message.includes('Optimization completed')) return 'Results Processing'
  if (message.includes('Workflow execution completed')) return 'Workflow Completion'
  if (message.includes('Starting')) return 'Initialization'
  if (message.includes('Loading')) return 'Loading Resources'
  if (message.includes('Executing')) return 'Execution'
  if (message.includes('Processing')) return 'Processing'
  if (message.includes('Validating')) return 'Validation'
  if (message.includes('Completing')) return 'Completion'

  // Fallback: use first few words of the message
  return message.split(' ').slice(0, 3).join(' ')
}

const IntegratedWorkflowSidebar: React.FC<IntegratedWorkflowSidebarProps> = ({
  isOpen,
  onClose,
  nodes,
  connections,
  executionState,
  onExecute,
  onStop,
  onReset,
  onParameterChange,
  isExecuting
}) => {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [showParameterPanel, setShowParameterPanel] = useState(false)
  const [autoScroll, setAutoScroll] = useState(true)
  const [expandedComponents, setExpandedComponents] = useState<Record<string, boolean>>({})
  const [expandedSteps, setExpandedSteps] = useState<Record<string, boolean>>({})
  const [logViewMode, setLogViewMode] = useState<'components' | 'steps'>('steps')
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  // Organize logs into steps
  const steps = organizeLogsIntoSteps(executionState.logs)

  // Auto-expand the currently running step and collapse completed ones
  useEffect(() => {
    const runningStep = steps.find(step => step.status === 'running')
    const latestStep = steps[steps.length - 1]

    if (runningStep || latestStep) {
      const targetStep = runningStep || latestStep

      // Collapse all steps first, then expand only the target step
      const newExpandedSteps: Record<string, boolean> = {}
      steps.forEach(step => {
        newExpandedSteps[step.id] = step.id === targetStep.id
      })

      setExpandedSteps(newExpandedSteps)
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

  const handleNodeClick = (nodeId: string) => {
    if (selectedNodeId === nodeId && showParameterPanel) {
      // Close if clicking the same node
      setShowParameterPanel(false)
      setSelectedNodeId(null)
    } else {
      // Open parameter panel for this node
      setSelectedNodeId(nodeId)
      setShowParameterPanel(true)
    }
  }

  const toggleComponentExpansion = (nodeId: string) => {
    setExpandedComponents(prev => ({
      ...prev,
      [nodeId]: !prev[nodeId]
    }))
  }

  const toggleStepExpansion = (stepId: string) => {
    setExpandedSteps(prev => ({ ...prev, [stepId]: !prev[stepId] }))
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

  // Group nodes by type for better organization
  const nodesByType = nodes.reduce((acc, node) => {
    if (!acc[node.type]) acc[node.type] = []
    acc[node.type].push(node)
    return acc
  }, {} as Record<string, WorkflowNode[]>)

  // Group logs by component for better organization during execution
  const logsByComponent = executionState.logs.reduce((acc, log) => {
    const componentName = log.source === 'system' ? 'System' : log.source
    if (!acc[componentName]) acc[componentName] = []
    acc[componentName].push(log)
    return acc
  }, {} as Record<string, ExecutionLog[]>)

  // Get component names from nodes for log grouping
  const componentNames = nodes.map(node => node.data.name)
  const hasComponentLogs = Object.keys(logsByComponent).some(key =>
    key !== 'System' && componentNames.includes(key)
  )

  if (!isOpen) {
    return null
  }

  const selectedNode = selectedNodeId ? nodes.find(n => n.id === selectedNodeId) : null

  return (
    <div className="w-96 border-l bg-white dark:bg-slate-900 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-orange-600" />
            <h3 className="font-semibold">Workflow</h3>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        

      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {showParameterPanel && selectedNode ? (
          /* Parameter Panel */
          <div className="flex-1 flex flex-col">
            <ParameterPanel
              node={selectedNode}
              isOpen={true}
              onClose={() => {
                setShowParameterPanel(false)
                setSelectedNodeId(null)
              }}
              onParameterChange={onParameterChange}
              connections={connections}
              allNodes={nodes}
            />
          </div>
        ) : (
          /* Component List and Logs */
          <div className="flex-1 flex flex-col">
            {/* Components Section */}
            <div className="border-b">
              <div className="p-3">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-sm">Components</h4>
                  <Badge variant="outline" className="text-xs">
                    {nodes.length}
                  </Badge>
                </div>
                
                {nodes.length === 0 ? (
                  <div className="text-center py-4">
                    <Settings className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground">No components added</p>
                    <p className="text-xs text-muted-foreground">Drag from the left sidebar</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {Object.entries(nodesByType).map(([type, typeNodes]) => (
                      <div key={type}>
                        {typeNodes.map((node) => (
                          <Card
                            key={node.id}
                            className={`cursor-pointer transition-all hover:shadow-sm ${getNodeColor(node.type)} ${
                              selectedNodeId === node.id ? 'ring-2 ring-primary' : ''
                            }`}
                            onClick={() => handleNodeClick(node.id)}
                          >
                            <CardContent className="p-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  {getNodeIcon(node.type)}
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium text-xs truncate">{node.data.name}</p>
                                    <p className="text-xs text-muted-foreground truncate">@{node.data.username}</p>
                                  </div>
                                </div>
                                <Edit3 className="h-3 w-3 text-muted-foreground" />
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Execution Logs Section */}
            <div className="flex-1 flex flex-col">
              <div className="p-3 border-b">
                <div className="flex items-center justify-between mb-2">
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
                      {logViewMode === 'steps' ? `${steps.length} steps` : `${executionState.logs.length} logs`}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant={logViewMode === 'steps' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setLogViewMode('steps')}
                    className="text-xs h-6"
                  >
                    Steps
                  </Button>
                  <Button
                    variant={logViewMode === 'components' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setLogViewMode('components')}
                    className="text-xs h-6"
                  >
                    Components
                  </Button>
                </div>
              </div>
              
              <ScrollArea ref={scrollAreaRef} className="flex-1">
                <div className="p-3 space-y-4">
                  {executionState.logs.length === 0 ? (
                    <div className="text-center py-8">
                      <Terminal className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">No logs yet</p>
                      <p className="text-xs text-muted-foreground">Logs will appear here during execution</p>
                    </div>
                  ) : logViewMode === 'steps' ? (
                    /* Step-based logs view */
                    steps.map((step) => (
                      <Collapsible
                        key={step.id}
                        open={expandedSteps[step.id] !== false}
                        onOpenChange={() => toggleStepExpansion(step.id)}
                      >
                        <CollapsibleTrigger asChild>
                          <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer border border-gray-200 dark:border-gray-700 mb-2 transition-all">
                            {expandedSteps[step.id] !== false ? (
                              <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            )}
                            {getStepIcon(step.status)}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-medium text-sm truncate">{step.name}</span>
                                <div className="flex items-center gap-2 flex-shrink-0">
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
                        <CollapsibleContent className="space-y-2 mt-3 ml-6 border-l-2 border-gray-100 dark:border-gray-800 pl-3">
                          {step.logs.map((log, logIndex) => (
                            <div key={log.id} className="flex gap-2 text-xs py-1.5 bg-gray-50 dark:bg-gray-900 rounded-md px-2">
                              <span className="text-muted-foreground font-mono text-xs">
                                {formatTimestamp(log.timestamp)}
                              </span>
                              {getLogIcon(log.level)}
                              <div className="flex-1 min-w-0">
                                <span className="font-medium break-words">{log.message}</span>
                                {log.source && log.source !== 'system' && (
                                  <span className="text-muted-foreground ml-2">({log.source})</span>
                                )}
                              </div>
                            </div>
                          ))}
                        </CollapsibleContent>
                      </Collapsible>
                    ))
                  ) : hasComponentLogs ? (
                    /* Component-grouped logs during execution */
                    Object.entries(logsByComponent).map(([componentName, logs]) => (
                      <Collapsible
                        key={componentName}
                        open={expandedComponents[componentName] !== false}
                        onOpenChange={(open) => toggleComponentExpansion(componentName)}
                      >
                        <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-muted rounded-md">
                          <div className="flex items-center gap-2">
                            {componentName === 'System' ? (
                              <Settings className="h-4 w-4 text-gray-600" />
                            ) : (
                              getNodeIcon(nodes.find(n => n.data.name === componentName)?.type || 'optimizer')
                            )}
                            <span className="font-medium text-sm">{componentName}</span>
                            <Badge variant="outline" className="text-xs">
                              {logs.length}
                            </Badge>
                          </div>
                          {expandedComponents[componentName] !== false ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </CollapsibleTrigger>
                        <CollapsibleContent className="space-y-1 mt-2">
                          {logs.map((log) => (
                            <div key={log.id} className="flex gap-2 text-xs pl-6">
                              <span className="text-muted-foreground font-mono">
                                {formatTimestamp(log.timestamp)}
                              </span>
                              {getLogIcon(log.level)}
                              <div className="flex-1">
                                <span className="font-medium">{log.message}</span>
                              </div>
                            </div>
                          ))}
                        </CollapsibleContent>
                      </Collapsible>
                    ))
                  ) : (
                    /* Simple log list when no component-specific logs */
                    executionState.logs.map((log) => (
                      <div key={log.id} className="flex gap-2 text-xs">
                        <span className="text-muted-foreground font-mono">
                          {formatTimestamp(log.timestamp)}
                        </span>
                        {getLogIcon(log.level)}
                        <div className="flex-1">
                          <span className="font-medium">{log.message}</span>
                          {log.source && log.source !== 'system' && (
                            <span className="text-muted-foreground ml-2">({log.source})</span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="p-4 border-t">
        <div className="flex gap-2">
          {!isExecuting ? (
            <Button onClick={onExecute} className="flex-1" disabled={nodes.length === 0}>
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

export default IntegratedWorkflowSidebar

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
  Database,
  Brain,
  Settings,
  Edit3,
  Save,
  Link,
  ChevronDown,
  ChevronRight
} from 'lucide-react'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@/components/ui/collapsible'
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

// Component for displaying execution steps with expandable logs
const ExecutionStepsDisplay: React.FC<{ logs: ExecutionLog[], executionState: ExecutionState }> = ({ logs, executionState }) => {
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set())

  // Define the execution steps following the qubots modular architecture
  const executionSteps = [
    { id: 'dataset', name: '📊 Load Dataset', icon: Database },
    { id: 'problem', name: '🧩 Load Problem', icon: Brain },
    { id: 'optimizer', name: '⚙️ Load Optimizer', icon: Settings },
    { id: 'execution', name: '🚀 Execute Optimization', icon: Zap },
    { id: 'results', name: '📈 Process Results', icon: CheckCircle }
  ]

  // Organize logs by execution step based on step property or message content
  const organizeLogsByStep = (logs: ExecutionLog[]) => {
    const stepLogs: Record<string, ExecutionLog[]> = {
      dataset: [],
      problem: [],
      optimizer: [],
      execution: [],
      results: [],
      system: [] // For system logs that don't fit into specific steps
    }

    logs.forEach(log => {
      // First check if log has explicit step information
      const logWithStep = log as any // Type assertion to access step property
      if (logWithStep.step && stepLogs[logWithStep.step]) {
        stepLogs[logWithStep.step].push(log)
        return
      }

      // Fallback to message content analysis
      const message = log.message.toLowerCase()

      if (message.includes('dataset') || message.includes('loading dataset') || message.includes('step 1')) {
        stepLogs.dataset.push(log)
      } else if (message.includes('problem') || message.includes('loading problem') || message.includes('step 2')) {
        stepLogs.problem.push(log)
      } else if (message.includes('optimizer') || message.includes('loading optimizer') || message.includes('step 3')) {
        stepLogs.optimizer.push(log)
      } else if (message.includes('execution') || message.includes('optimize') || message.includes('step 4') || message.includes('running')) {
        stepLogs.execution.push(log)
      } else if (message.includes('result') || message.includes('completed') || message.includes('step 5') || message.includes('best')) {
        stepLogs.results.push(log)
      } else {
        stepLogs.system.push(log)
      }
    })

    return stepLogs
  }

  // Determine step status based on logs and execution state
  const getStepStatus = (stepId: string, stepLogs: ExecutionLog[]) => {
    if (stepLogs.length === 0) return 'pending'

    const hasError = stepLogs.some(log => log.level === 'error')
    if (hasError) return 'error'

    const hasCompletion = stepLogs.some(log =>
      log.message.toLowerCase().includes('completed') ||
      log.message.toLowerCase().includes('success') ||
      log.message.toLowerCase().includes('loaded')
    )
    if (hasCompletion) return 'completed'

    return 'running'
  }

  const toggleStep = (stepId: string) => {
    const newExpanded = new Set(expandedSteps)
    if (newExpanded.has(stepId)) {
      newExpanded.delete(stepId)
    } else {
      newExpanded.add(stepId)
    }
    setExpandedSteps(newExpanded)
  }

  const getLogIcon = (level: string) => {
    switch (level) {
      case 'error': return <XCircle className="h-3 w-3 text-red-500" />
      case 'warning': return <AlertTriangle className="h-3 w-3 text-yellow-500" />
      case 'info': return <Info className="h-3 w-3 text-blue-500" />
      default: return <Terminal className="h-3 w-3 text-gray-500" />
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'running': return <Clock className="h-4 w-4 text-blue-500 animate-spin" />
      case 'error': return <XCircle className="h-4 w-4 text-red-500" />
      default: return <Clock className="h-4 w-4 text-gray-400" />
    }
  }

  const organizedLogs = organizeLogsByStep(logs)

  return (
    <div className="space-y-2">
      {/* System logs first */}
      {organizedLogs.system.length > 0 && (
        <Collapsible>
          <CollapsibleTrigger
            className="flex items-center justify-between w-full p-2 rounded bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            onClick={() => toggleStep('system')}
          >
            <div className="flex items-center gap-2">
              <Terminal className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium">System Logs</span>
              <Badge variant="outline" className="text-xs">
                {organizedLogs.system.length}
              </Badge>
            </div>
            {expandedSteps.has('system') ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-1 mt-2 ml-6">
            {organizedLogs.system.map((log) => (
              <div key={log.id} className="flex gap-2 text-xs py-1">
                <span className="text-muted-foreground font-mono">
                  {log.timestamp.toLocaleTimeString()}
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
      )}

      {/* Execution steps */}
      {executionSteps.map((step) => {
        const stepLogs = organizedLogs[step.id] || []
        const status = getStepStatus(step.id, stepLogs)
        const IconComponent = step.icon

        return (
          <Collapsible key={step.id}>
            <CollapsibleTrigger
              className="flex items-center justify-between w-full p-2 rounded bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              onClick={() => toggleStep(step.id)}
            >
              <div className="flex items-center gap-2">
                <IconComponent className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                <span className="text-sm font-medium">{step.name}</span>
                {getStatusIcon(status)}
                {stepLogs.length > 0 && (
                  <Badge variant="outline" className="text-xs">
                    {stepLogs.length}
                  </Badge>
                )}
              </div>
              {expandedSteps.has(step.id) ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-1 mt-2 ml-6">
              {stepLogs.length === 0 ? (
                <div className="text-xs text-muted-foreground py-2">No logs for this step yet</div>
              ) : (
                stepLogs.map((log) => (
                  <div key={log.id} className="flex gap-2 text-xs py-1">
                    <span className="text-muted-foreground font-mono">
                      {log.timestamp.toLocaleTimeString()}
                    </span>
                    {getLogIcon(log.level)}
                    <div className="flex-1">
                      <span className="font-medium">{log.message}</span>
                      {log.source && (
                        <span className="text-muted-foreground ml-2">({log.source})</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </CollapsibleContent>
          </Collapsible>
        )
      })}
    </div>
  )
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

// Removed unused step organization function

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
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  // Use raw logs instead of organizing into steps
  const logs = executionState.logs

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]')
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight
      }
    }
  }, [executionState.logs])

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







  if (!isOpen) {
    return null
  }

  const selectedNode = selectedNodeId ? nodes.find(n => n.id === selectedNodeId) : null

  // Group nodes by type for organized display
  const nodesByType = nodes.reduce((acc, node) => {
    if (!acc[node.type]) {
      acc[node.type] = []
    }
    acc[node.type].push(node)
    return acc
  }, {} as Record<string, WorkflowNode[]>)

  return (
    <div className="w-96 border-l bg-white dark:bg-slate-900 flex flex-col h-full">
      {/* Enhanced Header */}
      <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={`
              p-2 rounded-lg transition-all duration-300
              ${isExecuting
                ? 'bg-blue-500 text-white animate-pulse'
                : executionState.status === 'completed'
                ? 'bg-green-500 text-white'
                : executionState.status === 'error'
                ? 'bg-red-500 text-white'
                : 'bg-orange-500 text-white'
              }
            `}>
              <Zap className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">Workflow Automation</h3>
              <p className="text-xs text-muted-foreground">
                {isExecuting
                  ? '🔄 Executing qubots workflow...'
                  : executionState.status === 'completed'
                  ? '✅ Workflow completed successfully'
                  : executionState.status === 'error'
                  ? '❌ Workflow execution failed'
                  : '⚡ Ready to execute workflow'
                }
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="hover:bg-white dark:hover:bg-gray-800">
            <X className="h-4 w-4" />
          </Button>
        </div>


      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {showParameterPanel && selectedNode ? (
          /* Parameter Panel */
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
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
                    <p className="text-xs text-muted-foreground">Drag components from the left sidebar</p>
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
                    <Badge variant="outline" className="text-xs">
                      {logs.length} logs
                    </Badge>
                  </div>
                </div>
              </div>
              
              <ScrollArea ref={scrollAreaRef} className="flex-1">
                <div className="p-3 space-y-4">
                  {logs.length === 0 ? (
                    <div className="text-center py-8">
                      <Terminal className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">
                        {executionState.status === 'running' ? 'Waiting for execution logs...' : 'No execution logs yet'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {executionState.status === 'running'
                          ? 'Logs will be retrieved after execution completes'
                          : 'Logs will appear here during execution'
                        }
                      </p>
                      {executionState.status === 'running' && (
                        <div className="mt-4">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <ExecutionStepsDisplay logs={logs} executionState={executionState} />
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>
        )}
      </div>

      {/* Enhanced Controls */}
      <div className="p-4 border-t bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700">


        {/* Control Buttons */}
        <div className="flex gap-2">
          {!isExecuting ? (
            <Button
              onClick={onExecute}
              className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]"
              disabled={nodes.length === 0}
            >
              <Play className="h-4 w-4 mr-2" />
              Execute Workflow
            </Button>
          ) : (
            <Button
              onClick={onStop}
              variant="destructive"
              className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]"
            >
              <Square className="h-4 w-4 mr-2" />
              Stop Execution
            </Button>
          )}
          <Button
            onClick={onReset}
            variant="outline"
            disabled={isExecuting}
            className="hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 transform hover:scale-[1.02]"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
        </div>

        {/* Workflow Summary */}
        {nodes.length > 0 && !isExecuting && (
          <div className="mt-3 p-3 bg-white dark:bg-gray-800 rounded-lg border">
            <div className="text-xs text-muted-foreground mb-2">Ready to execute:</div>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1">
                <Database className="h-3 w-3 text-blue-600" />
                <span>{nodes.filter(n => n.type === 'dataset').length} datasets</span>
              </div>
              <div className="flex items-center gap-1">
                <Brain className="h-3 w-3 text-green-600" />
                <span>{nodes.filter(n => n.type === 'problem').length} problems</span>
              </div>
              <div className="flex items-center gap-1">
                <Zap className="h-3 w-3 text-orange-600" />
                <span>{nodes.filter(n => n.type === 'optimizer').length} optimizers</span>
              </div>
            </div>
          </div>
        )}

        {/* Error Display */}
        {executionState.error && (
          <div className="mt-3 p-3 bg-gradient-to-r from-red-50 to-red-100 dark:from-red-950 dark:to-red-900 border-2 border-red-200 dark:border-red-800 rounded-lg shadow-sm">
            <div className="flex items-center gap-2 text-red-700 dark:text-red-400 mb-2">
              <XCircle className="h-4 w-4" />
              <span className="font-semibold">Execution Error</span>
            </div>
            <p className="text-sm text-red-600 dark:text-red-300 bg-white dark:bg-red-950 p-2 rounded border">
              {executionState.error}
            </p>
          </div>
        )}

        {/* Success Display */}
        {executionState.status === 'completed' && !executionState.error && (
          <div className="mt-3 p-3 bg-gradient-to-r from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-2 border-green-200 dark:border-green-800 rounded-lg shadow-sm">
            <div className="flex items-center gap-2 text-green-700 dark:text-green-400 mb-2">
              <CheckCircle className="h-4 w-4" />
              <span className="font-semibold">Execution Completed</span>
            </div>
            <div className="text-sm text-green-600 dark:text-green-300">
              🎉 All workflow steps completed successfully!
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default IntegratedWorkflowSidebar

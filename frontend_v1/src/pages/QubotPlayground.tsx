import { useState, useEffect, useRef } from "react"
import { useSearchParams } from "react-router-dom"
import Layout from "@/components/Layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger} from "@/components/ui/dialog"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useAuth } from "@/hooks/use-auth"
import {
  RotateCcw,
  Settings,
  Loader2,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  Share2,
  Play,
  Square,
  Download,
  User,
  Trophy,
  Lock,
  Edit
} from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { CompactModelSelector } from "@/components/playground/CompactModelSelector"
import { TerminalViewer } from "@/components/playground/TerminalViewer"
import { ParameterInputs } from "@/components/playground/ParameterInputs"
import { ShareWorkflowDialog } from "@/components/playground/ShareWorkflowDialog"
import { OptimizationResultDisplay } from "@/components/playground/OptimizationResultDisplay"
import EnvironmentSpecs from "@/components/playground/EnvironmentSpecs"
import { ModelInfo, QubotResult, ExecutionLog, ExecutionMetrics, ExecutionState } from "@/types/playground"

const API = import.meta.env.VITE_API_BASE

const QubotPlayground = () => {
  const [searchParams] = useSearchParams()
  const [selectedProblem, setSelectedProblem] = useState<ModelInfo | null>(null)
  const [selectedOptimizer, setSelectedOptimizer] = useState<ModelInfo | null>(null)
  const [result, setResult] = useState<QubotResult | null>(null)
  const [systemStatus, setSystemStatus] = useState<any>(null)
  const [statusLoading, setStatusLoading] = useState(true)

  // Authentication state
  const { isAuthenticated } = useAuth()

  // Share workflow state
  const [shareDialogOpen, setShareDialogOpen] = useState(false)
  const [isSharing, setIsSharing] = useState(false)
  const [resultsModalOpen, setResultsModalOpen] = useState(false)

  // Leaderboard submission state
  const [submittingToLeaderboard, setSubmittingToLeaderboard] = useState(false)

  // Workflow restoration state
  const [isRestoringWorkflow, setIsRestoringWorkflow] = useState(false)

  // Leaderboard locked mode state
  const [isLockedMode, setIsLockedMode] = useState(false)
  const [leaderboardProblemId, setLeaderboardProblemId] = useState<string | null>(null)

  // Enhanced execution state
  const [executionState, setExecutionState] = useState<ExecutionState>({
    isRunning: false,
    isPaused: false,
    canPause: false,
    logs: [],
    metrics: {
      execution_time: 0,
      status: 'idle'
    }
  })

  // Parameter state
  const [problemParams, setProblemParams] = useState<Record<string, any>>({})
  const [optimizerParams, setOptimizerParams] = useState<Record<string, any>>({})

  // WebSocket and execution control
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    checkSystemStatus()
  }, [])

  // Clear problem parameters when problem changes
  useEffect(() => {
    if (!isRestoringWorkflow) {
      setProblemParams({})
    }
  }, [selectedProblem?.name, selectedProblem?.username, isRestoringWorkflow])

  // Clear optimizer parameters when optimizer changes
  useEffect(() => {
    if (!isRestoringWorkflow) {
      setOptimizerParams({})
    }
  }, [selectedOptimizer?.name, selectedOptimizer?.username, isRestoringWorkflow])

  // Workflow restoration effect
  useEffect(() => {
    const workflowId = searchParams.get('workflow_id')
    const problemName = searchParams.get('problem_name')
    const problemUsername = searchParams.get('problem_username')
    const optimizerName = searchParams.get('optimizer_name')
    const optimizerUsername = searchParams.get('optimizer_username')
    const problemParamsStr = searchParams.get('problem_params')
    const optimizerParamsStr = searchParams.get('optimizer_params')
    const locked = searchParams.get('locked')
    const leaderboardProblemIdParam = searchParams.get('leaderboard_problem_id')

    // Set locked mode if coming from leaderboard
    if (locked === 'true' && leaderboardProblemIdParam) {
      setIsLockedMode(true)
      setLeaderboardProblemId(leaderboardProblemIdParam)
    }

    if (workflowId || (problemName && (optimizerName || locked === 'true'))) {
      restoreWorkflow({
        workflowId,
        problemName,
        problemUsername,
        optimizerName,
        optimizerUsername,
        problemParams: problemParamsStr ? JSON.parse(problemParamsStr) : {},
        optimizerParams: optimizerParamsStr ? JSON.parse(optimizerParamsStr) : {}
      })
    }
  }, [searchParams])

  const restoreWorkflow = async (workflowData: {
    workflowId?: string | null
    problemName?: string | null
    problemUsername?: string | null
    optimizerName?: string | null
    optimizerUsername?: string | null
    problemParams?: Record<string, any>
    optimizerParams?: Record<string, any>
  }) => {
    setIsRestoringWorkflow(true)

    try {
      // If we have a workflow ID, fetch the full workflow data
      if (workflowData.workflowId) {
        const response = await fetch(`${API}/api/playground/workflows/${workflowData.workflowId}`, {
          credentials: 'include' // Include cookies for authentication
        })
        if (response.ok) {
          const data = await response.json()
          const workflow = data.workflow

          // Set problem and optimizer from workflow data
          setSelectedProblem({
            name: workflow.problem_name,
            username: workflow.problem_username,
            description: '',
            model_type: 'problem',
            repository_url: '',
            last_updated: '',
            tags: [],
            metadata: { stars: 0, forks: 0, size: 0 }
          })

          setSelectedOptimizer({
            name: workflow.optimizer_name,
            username: workflow.optimizer_username,
            description: '',
            model_type: 'optimizer',
            repository_url: '',
            last_updated: '',
            tags: [],
            metadata: { stars: 0, forks: 0, size: 0 }
          })

          // Set parameters
          setProblemParams(workflow.problem_params || {})
          setOptimizerParams(workflow.optimizer_params || {})

          toast({
            title: "Workflow Restored",
            description: `Loaded workflow: ${workflow.title}`,
          })
        }
      } else if (workflowData.problemName) {
        // Direct parameter restoration from URL (problem required, optimizer optional for locked mode)
        setSelectedProblem({
          name: workflowData.problemName,
          username: workflowData.problemUsername || '',
          description: '',
          model_type: 'problem',
          repository_url: '',
          last_updated: '',
          tags: [],
          metadata: { stars: 0, forks: 0, size: 0 }
        })

        if (workflowData.optimizerName) {
          setSelectedOptimizer({
            name: workflowData.optimizerName,
            username: workflowData.optimizerUsername || '',
            description: '',
            model_type: 'optimizer',
            repository_url: '',
            last_updated: '',
            tags: [],
            metadata: { stars: 0, forks: 0, size: 0 }
          })
        }

        setProblemParams(workflowData.problemParams || {})
        setOptimizerParams(workflowData.optimizerParams || {})

        if (isLockedMode) {
          toast({
            title: "Leaderboard Problem Loaded",
            description: "Problem and its parameters are locked. Choose any optimizer to compete.",
          })
        } else {
          toast({
            title: "Workflow Restored",
            description: "Configuration loaded from shared workflow",
          })
        }
      }
    } catch (error: any) {
      console.error('Error restoring workflow:', error)
      toast({
        title: "Failed to Restore Workflow",
        description: error.message || "Could not load the shared workflow configuration.",
        variant: "destructive"
      })
    } finally {
      setIsRestoringWorkflow(false)
    }
  }

  // Disabled auto-scroll to prevent unwanted page movement
  // Users can manually scroll in the terminal if needed
  // useEffect(() => {
  //   if (logsEndRef.current) {
  //     logsEndRef.current.scrollIntoView({ behavior: 'smooth' })
  //   }
  // }, [executionState.logs])

  // Cleanup WebSocket on unmount
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [])

  // Utility functions
  const addLog = (level: ExecutionLog['level'], message: string, source?: string) => {
    const newLog: ExecutionLog = {
      timestamp: new Date().toISOString(),
      level,
      message,
      source
    }

    setExecutionState(prev => ({
      ...prev,
      logs: [...prev.logs, newLog]
    }))
  }

  const updateMetrics = (updates: Partial<ExecutionMetrics>) => {
    setExecutionState(prev => ({
      ...prev,
      metrics: { ...prev.metrics, ...updates }
    }))
  }

  const clearLogs = () => {
    setExecutionState(prev => ({
      ...prev,
      logs: []
    }))
  }

  const exportLogs = () => {
    const logsText = executionState.logs
      .map(log => `[${log.timestamp}] ${log.level.toUpperCase()}: ${log.message}`)
      .join('\n')

    const blob = new Blob([logsText], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `qubots-execution-logs-${new Date().toISOString().split('T')[0]}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const checkSystemStatus = async () => {
    try {
      const response = await fetch(`${API}/api/playground/qubots/status`)
      const status = await response.json()
      setSystemStatus(status)
    } catch (error) {
      console.error("Error checking system status:", error)
      setSystemStatus({ success: false, error: "Failed to check system status" })
    } finally {
      setStatusLoading(false)
    }
  }

  const runOptimization = async () => {
    if (!selectedProblem || !selectedOptimizer) {
      toast({
        title: "Missing Selection",
        description: "Please select both a problem and an optimizer.",
        variant: "destructive"
      })
      return
    }

    // Authentication is now handled via HTTP-only cookies
    // The backend will check for authentication automatically

    // Initialize execution state
    setExecutionState({
      isRunning: true,
      isPaused: false,
      canPause: true,
      logs: [],
      metrics: {
        execution_time: 0,
        status: 'running',
        progress: 0
      },
      startTime: new Date()
    })

    setResult(null)

    // Add initial logs
    addLog('info', 'Starting optimization execution...', 'system')
    addLog('info', `Problem: ${selectedProblem.name} (${selectedProblem.username})`, 'config')
    addLog('info', `Optimizer: ${selectedOptimizer.name} (${selectedOptimizer.username})`, 'config')

    if (Object.keys(problemParams).length > 0) {
      addLog('info', `Problem parameters: ${JSON.stringify(problemParams)}`, 'config')
    }
    if (Object.keys(optimizerParams).length > 0) {
      addLog('info', `Optimizer parameters: ${JSON.stringify(optimizerParams)}`, 'config')
    }

    try {
      addLog('info', 'Starting streaming execution...', 'system')

      // Start streaming execution
      const response = await fetch(`${API}/api/playground/qubots/execute-stream`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: 'include', // Include cookies for authentication
        body: JSON.stringify({
          problem_name: selectedProblem.name,
          problem_username: selectedProblem.username,
          optimizer_name: selectedOptimizer.name,
          optimizer_username: selectedOptimizer.username,
          problem_params: problemParams,
          optimizer_params: optimizerParams
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        addLog('error', `HTTP ${response.status}: ${errorText}`, 'system')
        throw new Error("Failed to start streaming execution")
      }

      const streamingResponse = await response.json()

      if (!streamingResponse.success) {
        throw new Error(streamingResponse.message || "Failed to start execution")
      }

      const executionId = streamingResponse.execution_id
      addLog('info', `Execution started with ID: ${executionId}`, 'system')
      addLog('info', 'Connecting to real-time log stream...', 'system')

      // Connect to WebSocket for real-time logs
      await connectToStreamingExecution(executionId)

    } catch (error) {
      console.error("Error running optimization:", error)
      addLog('error', `Execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 'system')
      updateMetrics({ status: 'error' })

      toast({
        title: "Error",
        description: "Failed to run optimization. Please try again.",
        variant: "destructive"
      })

      setExecutionState(prev => ({
        ...prev,
        isRunning: false,
        canPause: false
      }))
    }
  }

  const connectToStreamingExecution = async (executionId: string) => {
    return new Promise<void>((resolve, reject) => {
      // Close existing WebSocket if any
      if (wsRef.current) {
        wsRef.current.close()
      }

      // Create WebSocket connection using current domain
      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      const wsHost = window.location.host
      const wsUrl = `${wsProtocol}//${wsHost}/api/playground/qubots/stream/${executionId}`

      addLog('debug', `Connecting to WebSocket: ${wsUrl}`, 'system')
      const ws = new WebSocket(wsUrl)
      wsRef.current = ws

      ws.onopen = () => {
        addLog('info', 'Connected to real-time log stream', 'system')
      }

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data)
          handleStreamingMessage(message)
        } catch (error) {
          console.error('Error parsing WebSocket message:', error)
        }
      }

      ws.onclose = () => {
        addLog('info', 'Log stream disconnected', 'system')
        setExecutionState(prev => ({
          ...prev,
          isRunning: false,
          canPause: false
        }))
        resolve()
      }

      ws.onerror = (error) => {
        console.error('WebSocket error:', error)
        addLog('error', 'Log stream connection error', 'system')
        reject(error)
      }
    })
  }

  const handleStreamingMessage = (message: any) => {
    // Debug logging to understand what messages we're receiving
    console.log('Received streaming message:', message)

    switch (message.type) {
      case 'connection_established':
        console.log('WebSocket connection established:', message.data)
        addLog('info', message.data.message, 'system')
        addLog('debug', 'Real-time log streaming is now active', 'system')
        break

      case 'optimization_log':
        const logData = message.data
        console.log('Processing optimization log:', logData)
        addLog(logData.level, logData.message, logData.source)
        break

      case 'execution_complete':
        const resultData = message.data
        console.log('Execution complete:', resultData)
        if (resultData.success) {
          addLog('info', 'Optimization completed successfully!', 'system')
          setResult(resultData.result)
          updateMetrics({
            status: 'completed',
            progress: 100,
            execution_time: resultData.result?.execution_time || 0
          })

          toast({
            title: "Optimization Complete",
            description: "Optimization finished with real-time logging"
          })
        } else {
          addLog('error', `Optimization failed: ${resultData.error_message}`, 'system')
          updateMetrics({ status: 'error' })

          toast({
            title: "Optimization Failed",
            description: resultData.error_message || "Unknown error occurred",
            variant: "destructive"
          })
        }
        break

      default:
        console.log('Unknown streaming message type:', message.type, message)
        // Still try to log unknown messages in case they contain useful info
        if (message.data && message.data.message) {
          addLog('debug', `Unknown message: ${message.data.message}`, 'system')
        }
    }
  }

  const resetOptimization = () => {
    setResult(null)
    setExecutionState({
      isRunning: false,
      isPaused: false,
      canPause: false,
      logs: [],
      metrics: {
        execution_time: 0,
        status: 'idle'
      }
    })
    setProblemParams({})
    setOptimizerParams({})

    // Close WebSocket if open
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
  }



  const handleShareWorkflow = async (workflowData: {
    title: string
    description: string
    tags: string[]
    isPublic: boolean
  }) => {
    if (!selectedProblem || !selectedOptimizer) {
      toast({
        title: "Cannot Share Workflow",
        description: "Please select both a problem and an optimizer before sharing.",
        variant: "destructive"
      })
      return
    }

    setIsSharing(true)

    try {
      // Authentication is now handled via HTTP-only cookies
      const response = await fetch(`${API}/api/playground/workflows`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include', // Include cookies for authentication
        body: JSON.stringify({
          title: workflowData.title,
          description: workflowData.description,
          problem_name: selectedProblem.name,
          problem_username: selectedProblem.username,
          optimizer_name: selectedOptimizer.name,
          optimizer_username: selectedOptimizer.username,
          problem_params: problemParams,
          optimizer_params: optimizerParams,
          tags: workflowData.tags,
          is_public: workflowData.isPublic,
          uploaded_files: {}, // TODO: Handle file uploads
          execution_results: result // Include execution results if available
        })
      })

      if (response.ok) {
        await response.json()
        toast({
          title: "Workflow Shared Successfully!",
          description: `Your workflow "${workflowData.title}" has been ${workflowData.isPublic ? 'publicly' : 'privately'} shared.`,
        })
        setShareDialogOpen(false)
      } else {
        const error = await response.json()
        throw new Error(error.message || 'Failed to share workflow')
      }
    } catch (error: any) {
      console.error('Error sharing workflow:', error)
      toast({
        title: "Failed to Share Workflow",
        description: error.message || "An error occurred while sharing the workflow.",
        variant: "destructive"
      })
    } finally {
      setIsSharing(false)
    }
  }

  const stopOptimization = () => {
    if (executionState.isRunning) {
      setExecutionState(prev => ({
        ...prev,
        isRunning: false,
        isPaused: false,
        canPause: false
      }))
      updateMetrics({ status: 'idle' })
      addLog('warning', 'Optimization stopped by user', 'system')

      if (wsRef.current) {
        wsRef.current.close()
        wsRef.current = null
      }
    }
  }



  const handleSubmitToLeaderboard = async (problemId: number) => {

    if (!result || !selectedProblem || !selectedOptimizer) {
      toast({
        title: "Cannot Submit",
        description: "Please run an optimization first to get results.",
        variant: "destructive"
      })
      return
    }

    if (!result.best_value || !result.execution_time) {
      toast({
        title: "Incomplete Results",
        description: "Results must include best value and execution time.",
        variant: "destructive"
      })
      return
    }

    setSubmittingToLeaderboard(true)

    try {
      const response = await fetch(`${API}/api/leaderboard/problems/${problemId}/submit-playground`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          problem_name: selectedProblem.name,
          problem_username: selectedProblem.username,
          optimizer_name: selectedOptimizer.name,
          optimizer_username: selectedOptimizer.username,
          best_value: result.best_value,
          runtime_seconds: result.execution_time || result.runtime_seconds,
          iterations: result.iterations,
          evaluations: result.evaluations,
          problem_params: problemParams,
          optimizer_params: optimizerParams
        })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        toast({
          title: "Submitted to Leaderboard!",
          description: data.message || "Your results have been submitted successfully.",
          action: (
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.href = '/leaderboard'}
            >
              View Leaderboard
            </Button>
          )
        })

      } else {
        throw new Error(data.message || 'Failed to submit to leaderboard')
      }
    } catch (error: any) {
      console.error('Error submitting to leaderboard:', error)
      toast({
        title: "Submission Failed",
        description: error.message || "Failed to submit results to leaderboard.",
        variant: "destructive"
      })
    } finally {
      setSubmittingToLeaderboard(false)
    }
  }

  if (statusLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="flex flex-col h-screen">
        {/* Compact Top Toolbar */}
        <div className="flex-shrink-0 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="px-4 py-2">
            <div className="flex items-center justify-between gap-4">
              {/* Left: System Status & Workflow Restoration */}
              <div className="flex items-center gap-2">
                {!isAuthenticated ? (
                  <Badge variant="secondary" className="text-xs h-6">
                    <User className="h-3 w-3 mr-1" />
                    Sign in to run
                  </Badge>
                ) : systemStatus?.success ? (
                  <div className="flex items-center gap-2">
                    <Badge variant="default" className="text-xs h-6">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Ready
                    </Badge>
                    <EnvironmentSpecs
                      specs={systemStatus?.environment_specs}
                      variant="compact"
                    />
                  </div>
                ) : (
                  <Badge variant="destructive" className="text-xs h-6">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Setup Required
                  </Badge>
                )}
                {isRestoringWorkflow && (
                  <Badge variant="outline" className="text-xs h-6">
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    Restoring...
                  </Badge>
                )}
              </div>

              {/* Center: Primary Actions */}
              <div className="flex items-center justify-center gap-3 flex-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="default"
                      size="default"
                      onClick={runOptimization}
                      disabled={!isAuthenticated || executionState.isRunning || !selectedProblem || !selectedOptimizer}
                      className="h-10 px-6 font-medium"
                    >
                      {executionState.isRunning ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Play className="h-4 w-4 mr-2" />
                      )}
                      {executionState.isRunning ? 'Running' : 'Run Optimization'}
                    </Button>
                  </TooltipTrigger>
                  {!isAuthenticated && (
                    <TooltipContent side="bottom">
                      Please sign in to run optimizations
                    </TooltipContent>
                  )}
                </Tooltip>

                <Button
                  variant="outline"
                  size="default"
                  onClick={stopOptimization}
                  disabled={!executionState.isRunning}
                  className="h-10 px-6"
                >
                  <Square className="h-4 w-4 mr-2" />
                  Stop
                </Button>
              </div>

              {/* Right: Secondary Actions */}
              <div className="flex items-center gap-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setResultsModalOpen(true)}
                      disabled={!result}
                      className="h-8 px-2"
                    >
                      <BarChart3 className="h-3 w-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">View Results</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={exportLogs}
                      disabled={executionState.logs.length === 0}
                      className="h-8 px-2"
                    >
                      <Download className="h-3 w-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">Export Logs</TooltipContent>
                </Tooltip>

                {/* Only show submit to leaderboard button when opened from leaderboard */}
                {leaderboardProblemId && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          if (leaderboardProblemId) {
                            handleSubmitToLeaderboard(parseInt(leaderboardProblemId))
                          }
                        }}
                        disabled={!isAuthenticated || !result || executionState.isRunning || submittingToLeaderboard}
                        className="h-8 px-2"
                      >
                        {submittingToLeaderboard ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Trophy className="h-3 w-3" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      {!isAuthenticated ? "Please sign in to submit to leaderboard" :
                       !result ? "Run optimization to submit results" : "Submit to Leaderboard"}
                    </TooltipContent>
                  </Tooltip>
                )}

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShareDialogOpen(true)}
                      disabled={!isAuthenticated || !selectedProblem || !selectedOptimizer || executionState.isRunning || isSharing}
                      className="h-8 px-2"
                    >
                      {isSharing ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Share2 className="h-3 w-3" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    {!isAuthenticated ? "Please sign in to share workflows" : "Share Workflow"}
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={resetOptimization}
                      disabled={executionState.isRunning}
                      className="h-8 px-2"
                    >
                      <RotateCcw className="h-3 w-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">Reset All</TooltipContent>
                </Tooltip>
              </div>
            </div>
          </div>
        </div>

        {/* System Status Alert - Only show if error */}
        {!systemStatus?.success && (
          <div className="flex-shrink-0 bg-destructive/10 border-b">
            <div className="px-4 py-1">
              <div className="flex items-center gap-2 text-sm text-destructive">
                <AlertTriangle className="h-3 w-3" />
                <span>Qubots system unavailable: {systemStatus?.error || "Unknown error"}</span>
              </div>
            </div>
          </div>
        )}

        {/* Playground Information Banner */}
        <div className="flex-shrink-0 bg-muted/30 border-b">
          <div className="px-4 py-3">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-lg font-semibold mb-2 text-foreground">Qubots Playground</h2>
              <div className="space-y-1 text-sm text-muted-foreground">
                <p>
                  • This is a containerized cloud environment with Python + Qubots framework + utils functions for pip installing 3rd party packages installed
                </p>
                <p>
                  • You can experiment with qubot optimizers and problems by simply uploading them to the platform
                </p>
                <p>
                  • Underneath the playground uses the autoloading function to load the qubot problem and optimizer, and then calls the optimize function to solve the problem, and returns raw results from the optimizer
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content - Optimized Three-Column Layout */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full flex min-w-0 max-w-full">
            {/* Left Sidebar - Problem Selection & Parameters */}
            <div className="w-80 flex-shrink-0 border-r bg-muted/30 overflow-y-auto h-full">
              <div className="p-3 space-y-3">
                {/* Problem Model Selector */}
                <CompactModelSelector
                  modelType="problem"
                  selectedModel={selectedProblem}
                  onModelSelect={setSelectedProblem}
                  onModelClear={() => setSelectedProblem(null)}
                  initiallyExpanded={!selectedProblem}
                  disabled={isLockedMode}
                  isWorkflowRestoration={isRestoringWorkflow}
                />

                {/* Problem Parameters */}
                {selectedProblem && (
                  <Card className="border-l-4 border-l-blue-500">
                    <CardHeader className="pb-1 pt-2">
                      <CardTitle className="text-xs flex items-center gap-1">
                        <Settings className="h-3 w-3" />
                        Problem Parameters
                        <Badge variant="outline" className="text-xs h-4">config</Badge>
                        {isLockedMode && (
                          <Badge variant="secondary" className="text-xs h-4 bg-orange-100 text-orange-700 border-orange-200 flex items-center gap-1">
                            <Lock className="h-2.5 w-2.5" />
                            locked
                          </Badge>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-2">
                      <ParameterInputs
                        modelName={selectedProblem.name}
                        username={selectedProblem.username}
                        modelType="problem"
                        onParametersChange={setProblemParams}
                        initialParameters={problemParams}
                        disabled={isLockedMode}
                      />
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>

            {/* Main Terminal Area - Optimized Height */}
            <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
              <TerminalViewer
                logs={executionState.logs.map(log => ({
                  timestamp: new Date(log.timestamp).getTime(),
                  level: log.level,
                  message: log.message,
                  source: log.source
                }))}
                metrics={executionState.metrics}
                isExecuting={executionState.isRunning}
                onClearLogs={clearLogs}
                onExportLogs={exportLogs}
                className="w-full h-full"
              />
            </div>

            {/* Right Sidebar - Optimizer Selection & Parameters */}
            <div className="w-80 flex-shrink-0 border-l bg-muted/30 overflow-y-auto h-full">
              <div className="p-3 space-y-3">
                {/* Optimizer Model Selector */}
                <CompactModelSelector
                  modelType="optimizer"
                  selectedModel={selectedOptimizer}
                  onModelSelect={setSelectedOptimizer}
                  onModelClear={() => setSelectedOptimizer(null)}
                  initiallyExpanded={!selectedOptimizer}
                  isWorkflowRestoration={isRestoringWorkflow}
                />

                {/* Optimizer Parameters */}
                {selectedOptimizer && (
                  <Card className="border-l-4 border-l-green-500">
                    <CardHeader className="pb-1 pt-2">
                      <CardTitle className="text-xs flex items-center gap-1">
                        <Settings className="h-3 w-3" />
                        Optimizer Parameters
                        <Badge variant="outline" className="text-xs h-4">config</Badge>
                        {isLockedMode && (
                          <Badge variant="secondary" className="text-xs h-4 bg-green-100 text-green-700 border-green-200 flex items-center gap-1">
                            <Edit className="h-2.5 w-2.5" />
                            editable
                          </Badge>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-2">
                      <ParameterInputs
                        modelName={selectedOptimizer.name}
                        username={selectedOptimizer.username}
                        modelType="optimizer"
                        onParametersChange={setOptimizerParams}
                        initialParameters={optimizerParams}
                        disabled={false}
                      />
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
            </div>
          </div>

        {/* Share Workflow Dialog */}
        <ShareWorkflowDialog
          open={shareDialogOpen}
          onOpenChange={setShareDialogOpen}
          onShare={handleShareWorkflow}
          isLoading={isSharing}
          selectedProblem={selectedProblem}
          selectedOptimizer={selectedOptimizer}
          problemParams={problemParams}
          optimizerParams={optimizerParams}
          executionResults={result}
        />

        {/* Results Modal */}
        <Dialog open={resultsModalOpen} onOpenChange={setResultsModalOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] w-[90vw]">
            <div className="max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Optimization Results
              </DialogTitle>
            </DialogHeader>

            {result && (
              <OptimizationResultDisplay
                result={result}
                selectedProblem={selectedProblem}
                selectedOptimizer={selectedOptimizer}
                problemParams={problemParams}
                optimizerParams={optimizerParams}
              />
            )}
            </div>
          </DialogContent>
        </Dialog>


      </div>
    </Layout>
  )
}

export default QubotPlayground

import { useState, useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { workflowAutomationApi } from '@/services/workflowAutomationApi'
import {
  Dataset,
  Problem,
  Optimizer,
  WorkflowState,
  WorkflowNode,
  WorkflowConnection,
  ExecutionState,
  ExecutionStatus,
  WorkflowExecutionRequest,
  SaveWorkflowRequest,
  UseWorkflowState,
  UseWorkflowExecution,
  UseWorkflowPersistence
} from '@/types/workflow-automation'
import { toast } from '@/components/ui/use-toast'

// Hook for managing user content (datasets, problems, optimizers)
export function useUserContent(additionalModels?: string[], datasetId?: string) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['workflow-automation', 'user-content'],
    queryFn: () => workflowAutomationApi.getUserContent(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  // Fetch additional community models if specified
  const { data: communityData, isLoading: isLoadingCommunity, error: communityError } = useQuery({
    queryKey: ['workflow-automation', 'community-models', additionalModels],
    queryFn: async () => {
      if (!additionalModels || additionalModels.length === 0) {
        return { success: true, problems: [], optimizers: [], total: 0 }
      }

      try {
        const result = await workflowAutomationApi.getCommunityModels(additionalModels)
        return result
      } catch (error) {
        console.error('Error fetching community models:', error)
        throw error
      }
    },
    enabled: !!additionalModels && additionalModels.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  // Helper function to validate UUID format
  const isValidUUID = (uuid: string) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    return uuidRegex.test(uuid)
  }

  // Fetch specific dataset if specified
  const { data: datasetData, isLoading: isLoadingDataset, error: datasetError } = useQuery({
    queryKey: ['workflow-automation', 'dataset', datasetId],
    queryFn: async () => {
      if (!datasetId) {
        return { success: true, dataset: null }
      }

      // Validate UUID format before making request
      if (!isValidUUID(datasetId)) {
        console.warn('Invalid dataset ID format:', datasetId)
        return { success: false, dataset: null, error: 'Invalid dataset ID format' }
      }

      try {
        const result = await workflowAutomationApi.getDatasetById(datasetId)
        return result
      } catch (error) {
        console.error('Error fetching dataset:', error)
        // Return a graceful fallback instead of throwing
        return { success: false, dataset: null, error: error.message }
      }
    },
    enabled: !!datasetId && isValidUUID(datasetId || ''),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false, // Don't retry on 404 errors
  })

  // Combine user content with community models and specific dataset
  const allProblems = [
    ...(data?.problems || []),
    ...(communityData?.problems || [])
  ]

  const allOptimizers = [
    ...(data?.optimizers || []),
    ...(communityData?.optimizers || [])
  ]

  const allDatasets = [
    ...(data?.datasets || []),
    ...(datasetData?.dataset ? [datasetData.dataset] : [])
  ]

  // Show toast notification for dataset errors
  useEffect(() => {
    if (datasetError && datasetId) {
      toast({
        title: "Dataset not found",
        description: `The dataset with ID ${datasetId} could not be loaded. It may have been deleted or you may not have access to it.`,
        variant: "destructive"
      })
    }
  }, [datasetError, datasetId])

  return {
    datasets: allDatasets,
    problems: allProblems,
    optimizers: allOptimizers,
    totals: data?.totals || { datasets: 0, problems: 0, optimizers: 0 },
    isLoading: isLoading || isLoadingCommunity || isLoadingDataset,
    error,
    refetch,
  }
}

// Local storage key for workflow state persistence
const WORKFLOW_STORAGE_KEY = 'rastion_workflow_state'

// Helper functions for local storage persistence
const saveWorkflowToStorage = (workflow: WorkflowState) => {
  try {
    const serializedWorkflow = {
      nodes: workflow.nodes,
      connections: workflow.connections,
      // Don't persist execution state or selection
    }
    localStorage.setItem(WORKFLOW_STORAGE_KEY, JSON.stringify(serializedWorkflow))
  } catch (error) {
    console.warn('Failed to save workflow to localStorage:', error)
  }
}

const loadWorkflowFromStorage = (): Partial<WorkflowState> | null => {
  try {
    const stored = localStorage.getItem(WORKFLOW_STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (error) {
    console.warn('Failed to load workflow from localStorage:', error)
  }
  return null
}

// Hook for managing workflow state
export function useWorkflowState(): UseWorkflowState {
  const [workflow, setWorkflow] = useState<WorkflowState>(() => {
    // Try to restore from localStorage on initialization
    const stored = loadWorkflowFromStorage()
    return {
      nodes: stored?.nodes || [],
      connections: stored?.connections || [],
      selectedNodeId: null,
      executionState: {
        status: 'idle' as ExecutionStatus,
        progress: 0,
        logs: [],
        metrics: {
          totalSteps: 0,
          completedSteps: 0,
          executionTime: 0
        }
      },
      isDirty: false
    }
  })

  const updateNodes = useCallback((nodes: WorkflowNode[]) => {
    setWorkflow(prev => ({ ...prev, nodes, isDirty: true }))
  }, [])

  const updateNodeParameters = useCallback((nodeId: string, parameters: Record<string, any>) => {
    setWorkflow(prev => {
      const newWorkflow = {
        ...prev,
        nodes: prev.nodes.map(node =>
          node.id === nodeId
            ? { ...node, data: { ...node.data, parameters } }
            : node
        ),
        isDirty: true
      }

      // Persist to localStorage for session recovery
      saveWorkflowToStorage(newWorkflow)

      return newWorkflow
    })
  }, [])

  const updateConnections = useCallback((connections: WorkflowConnection[]) => {
    setWorkflow(prev => ({ ...prev, connections, isDirty: true }))
  }, [])

  const selectNode = useCallback((nodeId: string | null) => {
    setWorkflow(prev => ({ ...prev, selectedNodeId: nodeId }))
  }, [])

  const addNode = useCallback((node: Omit<WorkflowNode, 'id'> | WorkflowNode) => {
    const newNode: WorkflowNode = {
      ...node,
      id: 'id' in node && node.id ? node.id : `${node.type}-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
    }
    setWorkflow(prev => {
      const newWorkflow = {
        ...prev,
        nodes: [...prev.nodes, newNode],
        isDirty: true
      }

      // Persist to localStorage
      saveWorkflowToStorage(newWorkflow)

      return newWorkflow
    })
  }, [])

  const removeNode = useCallback((nodeId: string) => {
    setWorkflow(prev => {
      const newWorkflow = {
        ...prev,
        nodes: prev.nodes.filter(node => node.id !== nodeId),
        connections: prev.connections.filter(
          conn => conn.source !== nodeId && conn.target !== nodeId
        ),
        selectedNodeId: prev.selectedNodeId === nodeId ? null : prev.selectedNodeId,
        isDirty: true
      }

      // Persist to localStorage
      saveWorkflowToStorage(newWorkflow)

      return newWorkflow
    })
  }, [])

  const addConnection = useCallback((connection: Omit<WorkflowConnection, 'id'>) => {
    const newConnection: WorkflowConnection = {
      ...connection,
      id: `${connection.source}-${connection.target}-${Date.now()}`
    }
    setWorkflow(prev => ({ 
      ...prev, 
      connections: [...prev.connections, newConnection], 
      isDirty: true 
    }))
  }, [])

  const removeConnection = useCallback((connectionId: string) => {
    setWorkflow(prev => ({
      ...prev,
      connections: prev.connections.filter(conn => conn.id !== connectionId),
      isDirty: true
    }))
  }, [])

  const resetWorkflow = useCallback(() => {
    const newWorkflow: WorkflowState = {
      nodes: [],
      connections: [],
      selectedNodeId: null,
      executionState: {
        status: 'idle' as ExecutionStatus,
        progress: 0,
        logs: [],
        metrics: {
          totalSteps: 0,
          completedSteps: 0,
          executionTime: 0
        }
      },
      isDirty: false
    }

    // Clear localStorage when resetting
    try {
      localStorage.removeItem(WORKFLOW_STORAGE_KEY)
    } catch (error) {
      console.warn('Failed to clear workflow from localStorage:', error)
    }

    setWorkflow(newWorkflow)
  }, [])

  const setExecutionState = useCallback((state: Partial<ExecutionState>) => {
    setWorkflow(prev => ({
      ...prev,
      executionState: { ...prev.executionState, ...state }
    }))
  }, [])

  return {
    workflow,
    updateNodes,
    updateNodeParameters,
    updateConnections,
    selectNode,
    addNode,
    removeNode,
    addConnection,
    removeConnection,
    resetWorkflow,
    setExecutionState
  }
}

// Hook for workflow execution
export function useWorkflowExecution(
  onLogReceived?: (log: any) => void,
  onProgressUpdate?: (progress: number, step?: string) => void
): UseWorkflowExecution {
  const [isExecuting, setIsExecuting] = useState(false)
  const [executionId, setExecutionId] = useState<string | null>(null)
  const [executionResult, setExecutionResult] = useState<any>(null)
  const [webSocket, setWebSocket] = useState<WebSocket | null>(null)

  const executeMutation = useMutation({
    mutationFn: (request: WorkflowExecutionRequest) =>
      workflowAutomationApi.executeWorkflow(request),
    onSuccess: (response) => {
      if (response.success) {
        setExecutionId(response.executionId)
        setIsExecuting(true)

        // Connect to WebSocket for real-time logs
        connectToExecutionStream(response.executionId)

        toast({
          title: "Workflow started",
          description: "Your workflow execution has begun."
        })
      } else {
        toast({
          title: "Execution failed",
          description: response.error || "Failed to start workflow execution.",
          variant: "destructive"
        })
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Execution failed",
        description: error.message,
        variant: "destructive"
      })
    }
  })

  const stopMutation = useMutation({
    mutationFn: () => {
      if (!executionId) throw new Error("No execution to stop")
      return workflowAutomationApi.stopExecution(executionId)
    },
    onSuccess: () => {
      setIsExecuting(false)
      setExecutionId(null)
      setExecutionResult(null)

      // Close WebSocket connection
      if (webSocket) {
        webSocket.close()
        setWebSocket(null)
      }

      toast({
        title: "Execution stopped",
        description: "Workflow execution has been stopped."
      })
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to stop execution",
        description: error.message,
        variant: "destructive"
      })
    }
  })

  // Connect to WebSocket for real-time execution logs
  const connectToExecutionStream = useCallback((execId: string) => {
    try {
      const ws = workflowAutomationApi.connectToWorkflowExecution(execId)
      setWebSocket(ws)

      // Override the onmessage handler to process messages for the hook
      const originalOnMessage = ws.onmessage
      ws.onmessage = (event) => {
        // Call the original handler first (for debugging)
        if (originalOnMessage) {
          originalOnMessage.call(ws, event)
        }

        try {
          const data = JSON.parse(event.data)
          console.log('🎯 Processing WebSocket message in hook:', data)

          switch (data.type) {
            case 'log':
              // Handle log messages - pass to callback for execution state update
              if (onLogReceived) {
                console.log('🎯 Calling onLogReceived with:', data.data)
                onLogReceived(data.data)
              }
              break

            case 'progress':
              // Handle progress updates
              if (onProgressUpdate) {
                console.log('🎯 Calling onProgressUpdate with:', data.data)
                onProgressUpdate(data.data.progress, data.data.step)
              }
              break

            case 'result':
              // Handle final result
              console.log('🎯 Received final result:', data.data)
              setExecutionResult(data.data)
              setIsExecuting(false)

              toast({
                title: "Workflow completed",
                description: "Your optimization workflow has finished successfully."
              })
              break

            case 'error':
              // Handle execution error
              console.log('🎯 Received error:', data.data)
              setIsExecuting(false)

              toast({
                title: "Workflow failed",
                description: data.data.message || "Workflow execution encountered an error.",
                variant: "destructive"
              })
              break

            case 'connection_established':
              console.log('🎯 WebSocket connection established:', data.data)
              break

            case 'step_log':
              // Handle step-specific log messages
              console.log('🎯 Step log:', data.data)
              if (onLogReceived) {
                onLogReceived({
                  timestamp: data.data.timestamp,
                  level: data.data.level,
                  message: data.data.message,
                  step: data.data.step,
                  source: data.data.source || 'system'
                })
              }
              break

            case 'execution_summary':
              // Handle execution summary updates
              console.log('🎯 Execution summary:', data.data)
              if (onProgressUpdate && data.data.overallProgress !== undefined) {
                onProgressUpdate(data.data.overallProgress, data.data.currentStep)
              }
              break

            default:
              console.log('🎯 Unknown message type:', data.type)
              break
          }
        } catch (error) {
          console.error('🎯 ❌ Error parsing WebSocket message in hook:', error)
        }
      }

      ws.onclose = () => {
        setWebSocket(null)
        if (isExecuting) {
          setIsExecuting(false)
        }
      }

      ws.onerror = (error) => {
        console.error('WebSocket error:', error)
        setWebSocket(null)
        setIsExecuting(false)

        toast({
          title: "Connection error",
          description: "Lost connection to execution stream.",
          variant: "destructive"
        })
      }

    } catch (error) {
      console.error('Failed to connect to execution stream:', error)
      setIsExecuting(false)

      toast({
        title: "Connection failed",
        description: "Failed to connect to execution stream.",
        variant: "destructive"
      })
    }
  }, [isExecuting])

  // Cleanup WebSocket on unmount
  useEffect(() => {
    return () => {
      if (webSocket) {
        webSocket.close()
      }
    }
  }, [webSocket])

  const execute = useCallback(async (request: WorkflowExecutionRequest) => {
    return executeMutation.mutateAsync(request)
  }, [executeMutation])

  const stop = useCallback(async () => {
    await stopMutation.mutateAsync()
  }, [stopMutation])

  const getStatus = useCallback(async (execId: string) => {
    return workflowAutomationApi.getExecutionStatus(execId)
  }, [])

  return {
    execute,
    stop,
    getStatus,
    isExecuting,
    executionId,
    executionResult
  }
}

// Hook for workflow persistence
export function useWorkflowPersistence(): UseWorkflowPersistence {
  const queryClient = useQueryClient()
  const [isLoading, setIsLoading] = useState(false)

  const saveMutation = useMutation({
    mutationFn: (request: SaveWorkflowRequest) => 
      workflowAutomationApi.saveWorkflow(request),
    onSuccess: (response) => {
      if (response.success) {
        queryClient.invalidateQueries({ queryKey: ['workflow-automation', 'workflows'] })
        toast({
          title: "Workflow saved",
          description: "Your workflow has been saved successfully."
        })
      } else {
        toast({
          title: "Save failed",
          description: response.error || "Failed to save workflow.",
          variant: "destructive"
        })
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Save failed",
        description: error.message,
        variant: "destructive"
      })
    }
  })

  const deleteMutation = useMutation({
    mutationFn: (workflowId: string) => 
      workflowAutomationApi.deleteWorkflow(workflowId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflow-automation', 'workflows'] })
      toast({
        title: "Workflow deleted",
        description: "Workflow has been deleted successfully."
      })
    },
    onError: (error: Error) => {
      toast({
        title: "Delete failed",
        description: error.message,
        variant: "destructive"
      })
    }
  })

  const save = useCallback(async (request: SaveWorkflowRequest) => {
    return saveMutation.mutateAsync(request)
  }, [saveMutation])

  const load = useCallback(async (workflowId: string) => {
    setIsLoading(true)
    try {
      const response = await workflowAutomationApi.loadWorkflow(workflowId)
      if (response.success) {
        toast({
          title: "Workflow loaded",
          description: "Workflow has been loaded successfully."
        })
      }
      return response
    } catch (error) {
      toast({
        title: "Load failed",
        description: error instanceof Error ? error.message : "Failed to load workflow.",
        variant: "destructive"
      })
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [])

  const list = useCallback(async (page = 1, limit = 20) => {
    setIsLoading(true)
    try {
      return await workflowAutomationApi.listWorkflows(page, limit)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const deleteWorkflow = useCallback(async (workflowId: string) => {
    return deleteMutation.mutateAsync(workflowId)
  }, [deleteMutation])

  return {
    save,
    load,
    list,
    delete: deleteWorkflow,
    isLoading: isLoading || saveMutation.isPending || deleteMutation.isPending
  }
}

// Hook for workflow templates
export function useWorkflowTemplates() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['workflow-automation', 'templates'],
    queryFn: () => workflowAutomationApi.getWorkflowTemplates(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  })

  const createFromTemplateMutation = useMutation({
    mutationFn: ({ templateId, name }: { templateId: string; name: string }) =>
      workflowAutomationApi.createWorkflowFromTemplate(templateId, name),
    onSuccess: () => {
      toast({
        title: "Workflow created",
        description: "Workflow has been created from template successfully."
      })
    },
    onError: (error: Error) => {
      toast({
        title: "Creation failed",
        description: error.message,
        variant: "destructive"
      })
    }
  })

  return {
    templates: data?.templates || [],
    isLoading,
    error,
    createFromTemplate: createFromTemplateMutation.mutateAsync,
    isCreating: createFromTemplateMutation.isPending
  }
}

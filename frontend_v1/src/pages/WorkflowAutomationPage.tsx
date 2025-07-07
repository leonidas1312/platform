import React, { useState, useCallback, useRef, useEffect, useMemo } from "react"
import { useSearchParams } from "react-router-dom"
import { motion } from "framer-motion"
import {
  ReactFlow,
  Node,
  Edge,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  Controls,
  MiniMap,
  Background,
  BackgroundVariant,
  ReactFlowProvider,
  NodeTypes,
  EdgeTypes,
  MarkerType,
  useReactFlow
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import Layout from "@/components/Layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Play,
  Square,
  RotateCcw,
  Settings,
  Loader2,
  Database,
  Brain,
  Zap,
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  Code,
  FileText,
  CheckCircle,
  AlertTriangle,
  X,
  Terminal,
  ChevronDown,
  BookOpen,
  Globe,
  Trophy
} from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import {
  WorkflowNode,
  WorkflowConnection,
  WorkflowState,
  ExecutionState,
  Dataset,
  Problem,
  Optimizer,
  NodeType
} from "@/types/workflow-automation"
import { useUserContent, useWorkflowState, useWorkflowExecution, useWorkflowPersistence } from "@/hooks/useWorkflowAutomation"
import { nodeTypes, defaultEdgeOptions } from "@/components/workflow/WorkflowNodes"

import ComponentSidebar from "@/components/workflow/ComponentSidebar"
import ExportExperimentDialog, { ExportExperimentData } from "@/components/workflow/ExportExperimentDialog"
import DatasetParameterSelectionModal from "@/components/workflow/DatasetParameterSelectionModal"

import ParameterPanel from "@/components/workflow/ParameterPanel"

// Helper function to validate workflow connections
const validateWorkflowConnections = (nodes: WorkflowNode[], connections: WorkflowConnection[]): boolean => {
  const problemNode = nodes.find(node => node.type === 'problem')
  const optimizerNode = nodes.find(node => node.type === 'optimizer')
  const datasetNode = nodes.find(node => node.type === 'dataset')

  if (!problemNode || !optimizerNode) {
    return false
  }

  // Check if problem is connected to optimizer
  const problemToOptimizer = connections.some(conn =>
    conn.source === problemNode.id && conn.target === optimizerNode.id
  )

  if (!problemToOptimizer) {
    return false
  }

  // If dataset exists, check if it's connected to problem
  if (datasetNode) {
    const datasetToProblem = connections.some(conn =>
      conn.source === datasetNode.id && conn.target === problemNode.id
    )
    return datasetToProblem
  }

  // If no dataset, problem→optimizer connection is sufficient
  return true
}

// Inner component that uses ReactFlow hooks
const WorkflowCanvas = ({
  workflow,
  addNode,
  removeNode,
  selectNode,
  addConnection,
  handleAddNode,
  updateNodes,
  onDatasetProblemConnection
}: {
  workflow: any
  addNode: any
  removeNode: any
  selectNode: any
  addConnection: any
  handleAddNode: any
  updateNodes: any
  onDatasetProblemConnection: (params: Connection, datasetNode: WorkflowNode, problemNode: WorkflowNode) => void
}) => {
  // React Flow state
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])

  // Drag and drop functionality (now inside ReactFlowProvider)
  const reactFlowWrapper = useRef<HTMLDivElement>(null)
  const { screenToFlowPosition } = useReactFlow()

  // Handle node changes and sync position updates back to workflow state
  const handleNodesChange = useCallback((changes: any[]) => {
    onNodesChange(changes)

    // Handle node removals
    const removeChanges = changes.filter(change => change.type === 'remove')
    if (removeChanges.length > 0) {
      removeChanges.forEach(change => {
        removeNode(change.id)
      })
    }

    // Check if any position changes occurred and sync them back to workflow state
    const positionChanges = changes.filter(change => change.type === 'position' && change.position)
    if (positionChanges.length > 0) {
      // Update workflow state with new positions
      const updatedNodes = workflow.nodes.map(node => {
        const positionChange = positionChanges.find(change => change.id === node.id)
        if (positionChange && positionChange.position) {
          return { ...node, position: positionChange.position }
        }
        return node
      })

      // Check if any positions actually changed before updating
      const hasPositionChanges = updatedNodes.some((node, index) => {
        const originalNode = workflow.nodes[index]
        return originalNode && (
          node.position.x !== originalNode.position.x ||
          node.position.y !== originalNode.position.y
        )
      })

      if (hasPositionChanges) {
        updateNodes(updatedNodes)
      }
    }
  }, [onNodesChange, workflow.nodes, updateNodes, removeNode])

  const onDragStart = useCallback((event: React.DragEvent, nodeType: NodeType, item: Dataset | Problem | Optimizer) => {
    event.dataTransfer.setData('application/reactflow', JSON.stringify({ nodeType, item }))
    event.dataTransfer.effectAllowed = 'move'
  }, [])

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }, [])

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()

      const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect()
      if (!reactFlowBounds) return

      const data = event.dataTransfer.getData('application/reactflow')
      if (!data) return

      try {
        const { nodeType, item } = JSON.parse(data)

        // Calculate position relative to the React Flow canvas
        const position = screenToFlowPosition({
          x: event.clientX - reactFlowBounds.left,
          y: event.clientY - reactFlowBounds.top,
        })

        handleAddNode(nodeType, item, position, {})
      } catch (error) {
        console.error('Error parsing drag data:', error)
      }
    },
    [screenToFlowPosition, handleAddNode]
  )

  // React Flow event handlers
  const onConnect = useCallback(
    (params: Connection) => {
      if (params.source && params.target) {
        // Find the source and target nodes
        const sourceNode = workflow.nodes.find(node => node.id === params.source)
        const targetNode = workflow.nodes.find(node => node.id === params.target)

        // Check if this is a dataset-to-problem connection
        if (sourceNode?.type === 'dataset' && targetNode?.type === 'problem') {
          // Trigger the parameter selection modal
          onDatasetProblemConnection(params, sourceNode, targetNode)
          return
        }

        // For other connections, proceed normally
        // Add to React Flow state
        const newEdge = {
          ...params,
          id: `${params.source}-${params.target}`,
          animated: true,
          style: { stroke: '#94a3b8', strokeWidth: 2 },
          markerEnd: { type: MarkerType.ArrowClosed, color: '#94a3b8' }
        }
        setEdges((eds) => addEdge(newEdge, eds))

        // Add to workflow state
        addConnection({
          source: params.source,
          target: params.target,
          sourceHandle: params.sourceHandle,
          targetHandle: params.targetHandle,
          animated: true
        })

        toast({
          title: "Connection created",
          description: "Nodes have been connected successfully."
        })
      }
    },
    [setEdges, addConnection, workflow.nodes, onDatasetProblemConnection]
  )

  const onNodeClick = useCallback(
    (event: React.MouseEvent, node: Node) => {
      selectNode(node.id)
    },
    [selectNode]
  )

  const onPaneClick = useCallback(() => {
    selectNode(null)
  }, [selectNode])

  // Sync React Flow nodes with workflow state - optimized to prevent unnecessary re-renders
  const reactFlowNodes = useMemo(() => {
    return workflow.nodes.map((node) => ({
      id: node.id,
      type: node.type,
      position: node.position,
      data: node.data,
      selected: workflow.selectedNodeId === node.id
    }))
  }, [workflow.nodes, workflow.selectedNodeId])

  useEffect(() => {
    setNodes(reactFlowNodes)
  }, [reactFlowNodes, setNodes])

  // Sync React Flow edges with workflow state - optimized to prevent unnecessary re-renders
  const reactFlowEdges = useMemo(() => {
    return workflow.connections.map((connection) => ({
      id: connection.id,
      source: connection.source,
      target: connection.target,
      sourceHandle: connection.sourceHandle,
      targetHandle: connection.targetHandle,
      animated: connection.animated || true,
      style: connection.style || { stroke: 'hsl(var(--muted-foreground))', strokeWidth: 2 },
      markerEnd: { type: MarkerType.ArrowClosed, color: 'hsl(var(--muted-foreground))' }
    }))
  }, [workflow.connections])

  useEffect(() => {
    setEdges(reactFlowEdges)
  }, [reactFlowEdges, setEdges])

  return (
    <div
      ref={reactFlowWrapper}
      className="w-full h-full"
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        fitView
        fitViewOptions={{
          padding: 0.3,
          minZoom: 0.5,
          maxZoom: 1.2
        }}
        defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
        className="bg-background"
        proOptions={{ hideAttribution: true }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1.5}
          className="opacity-30 dark:opacity-20"
          color="hsl(var(--foreground))"
        />
        <Controls
          className="bg-background border border-border rounded-lg shadow-lg [&>button]:bg-background [&>button]:border-border [&>button]:text-foreground [&>button:hover]:bg-accent [&>button:hover]:text-accent-foreground"
        />
        <MiniMap
          className="bg-background border border-border rounded-lg shadow-lg"
          nodeColor={() => {
            // Use theme-responsive colors
            return 'hsl(var(--foreground))'
          }}
        />

        {workflow.nodes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center space-y-6 max-w-lg">
              <div className="text-8xl opacity-20">🔧</div>
              <Alert className="pointer-events-auto">
                <AlertDescription className="text-center space-y-2">
                  <strong className="text-lg">Welcome to Decision Model Builder!</strong><br />
                  <p className="text-sm text-muted-foreground">
                    Start building your decision model by dragging components from the left sidebar.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Connect nodes by dragging from the connection handles to define your workflow execution order.
                  </p>
                </AlertDescription>
              </Alert>
            </div>
          </div>
        )}
      </ReactFlow>
    </div>
  )
}

const WorkflowAutomationPage = () => {
  // Use custom hooks for state management
  const { workflow, addNode, removeNode, selectNode, resetWorkflow, setExecutionState, addConnection, updateNodeParameters, updateNodes } = useWorkflowState()
  const [searchParams] = useSearchParams()

  // Extract models from URL parameters for community model loading
  const problemName = searchParams.get('problem_name')
  const problemUsername = searchParams.get('problem_username')
  const optimizerName = searchParams.get('optimizer_name')
  const optimizerUsername = searchParams.get('optimizer_username')
  const datasetId = searchParams.get('dataset_id')

  const additionalModels = useMemo(() => {
    const models = []
    if (problemName && problemUsername) {
      models.push(`${problemUsername}/${problemName}`)
    }
    if (optimizerName && optimizerUsername) {
      models.push(`${optimizerUsername}/${optimizerName}`)
    }
    return models
  }, [problemName, problemUsername, optimizerName, optimizerUsername])

  const { datasets, problems, optimizers, isLoading: isLoadingContent } = useUserContent(additionalModels, datasetId || undefined)

  // Parameter panel state
  const [showParameterPanel, setShowParameterPanel] = useState(false)
  const [selectedNodeForParams, setSelectedNodeForParams] = useState<string | null>(null)

  // Dataset parameter selection modal state
  const [showParameterSelectionModal, setShowParameterSelectionModal] = useState(false)
  const [pendingConnection, setPendingConnection] = useState<{
    params: Connection
    datasetNode: WorkflowNode
    problemNode: WorkflowNode
  } | null>(null)

  // Execution hook with callbacks for real-time updates
  const { execute, stop, isExecuting, executionResult } = useWorkflowExecution(
    // Log callback
    (log) => {
      console.log('📝 Received workflow log:', log)
      console.log('📝 Log message content:', JSON.stringify(log.message))
      console.log('📝 Log level:', log.level)
      console.log('📝 Log source:', log.source)
      console.log('📝 Log timestamp:', log.timestamp)

      // Ensure we have a valid log structure
      if (!log || !log.message) {
        console.warn('⚠️ Received invalid log entry:', log)
        return
      }

      const newLog = {
        id: `log-${Date.now()}-${Math.random()}`,
        timestamp: new Date(log.timestamp || new Date().toISOString()),
        level: log.level || 'info',
        message: log.message,
        source: log.source || 'system',
        step: log.step // Include step information if available
      }

      console.log('📝 Adding log to execution state:', newLog)

      setExecutionState({
        logs: [...workflow.executionState.logs, newLog]
      })
    },
    // Progress callback
    (progress, step) => {
      console.log('📊 Progress update:', { progress, step })
      setExecutionState({
        progress,
        currentStep: step
      })
    }
  )

  const { save, load, isLoading: isSaving } = useWorkflowPersistence()


  const [showCodeModal, setShowCodeModal] = useState(false)
  const [showTemplatesModal, setShowTemplatesModal] = useState(false)
  const [showExportDialog, setShowExportDialog] = useState(false)

  const [isExporting, setIsExporting] = useState(false)
  const [exportFormat, setExportFormat] = useState<'python' | 'jupyter' | 'docker' | 'github-actions' | 'requirements'>('python')
  const canvasRef = useRef<HTMLDivElement>(null)

  // Handle adding nodes to the workflow
  const handleAddNode = useCallback((type: NodeType, item: Dataset | Problem | Optimizer, position?: { x: number; y: number }, initialParameters?: Record<string, any>) => {
    let nodePosition = position

    // If no position provided, calculate position in a grid layout
    if (!nodePosition) {
      const nodesPerRow = 4
      const nodeWidth = 200
      const nodeHeight = 120
      const startX = 100
      const startY = 100

      const nodeIndex = workflow.nodes.length
      const row = Math.floor(nodeIndex / nodesPerRow)
      const col = nodeIndex % nodesPerRow

      nodePosition = {
        x: startX + col * nodeWidth,
        y: startY + row * nodeHeight
      }
    }

    // Generate consistent ID based on node type and item properties
    let nodeId: string
    if (type === 'dataset') {
      nodeId = `dataset-${item.id}`
    } else if (type === 'problem' || type === 'optimizer') {
      const username = 'username' in item ? item.username : (item as any).user?.username || (item as any).user_id || 'unknown'
      nodeId = `${type}-${item.name}-${username}`
    } else {
      nodeId = `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    }

    const nodeData = {
      id: nodeId,
      type,
      position: nodePosition,
      data: {
        name: item.name,
        username: 'username' in item ? item.username : (item as any).user?.username || (item as any).user_id || 'unknown',
        description: item.description || '',
        parameters: initialParameters || {},
        repository: 'repository' in item ? item.repository : undefined,
        tags: 'tags' in item ? item.tags : undefined,
        // For datasets, preserve additional dataset-specific data
        ...(type === 'dataset' && {
          datasetId: item.id,
          original_filename: (item as any).original_filename,
          format_type: (item as any).format_type,
          file_size: (item as any).file_size,
          metadata: (item as any).metadata
        })
      }
    }

    addNode(nodeData)

    toast({
      title: "Node added",
      description: `${item.name} has been added to your workflow.`
    })
  }, [workflow.nodes.length, addNode])

  // Track if workflow has been loaded to prevent infinite loops
  const workflowLoadedRef = useRef<string | null>(null)

  // Load workflow from URL parameters (from experiments page)
  useEffect(() => {
    const workflowId = searchParams.get('workflow_id')
    const problemName = searchParams.get('problem_name')
    const problemUsername = searchParams.get('problem_username')
    const optimizerName = searchParams.get('optimizer_name')
    const optimizerUsername = searchParams.get('optimizer_username')
    const problemParams = searchParams.get('problem_params')
    const optimizerParams = searchParams.get('optimizer_params')
    const datasetId = searchParams.get('dataset_id')
    const datasetParameter = searchParams.get('dataset_parameter')

    // Create a unique key for this workflow configuration
    const workflowKey = `${workflowId}-${problemName}-${problemUsername}-${optimizerName}-${optimizerUsername}-${datasetId}`

    if (workflowId && problemName && problemUsername && optimizerName && optimizerUsername) {
      // Check if this workflow has already been loaded
      if (workflowLoadedRef.current === workflowKey) {
        return
      }

      // Only proceed if we're not currently loading content
      if (isLoadingContent) {
        return
      }

      // Find matching problem and optimizer from loaded data
      const matchingProblem = problems.find(p =>
        p.name === problemName && p.username === problemUsername
      )
      const matchingOptimizer = optimizers.find(o =>
        o.name === optimizerName && o.username === optimizerUsername
      )
      const matchingDataset = datasetId ? datasets.find(d => d.id === datasetId) : null



      if (matchingProblem && matchingOptimizer) {
        // Mark this workflow as loaded
        workflowLoadedRef.current = workflowKey

        // Clear existing workflow first
        resetWorkflow()
        let nodePositions: {
          dataset?: { x: number; y: number };
          problem: { x: number; y: number };
          optimizer: { x: number; y: number };
        } = { problem: { x: 300, y: 200 }, optimizer: { x: 600, y: 200 } }

        // Create nodes directly using addNode to avoid dependency issues

        // If dataset exists, adjust positions and add dataset node
        if (matchingDataset) {
          nodePositions = {
            dataset: { x: 100, y: 200 },
            problem: { x: 400, y: 200 },
            optimizer: { x: 700, y: 200 }
          }

          // Add dataset node
          const datasetNodeData = {
            id: `dataset-${matchingDataset.id}`,
            type: 'dataset' as const,
            position: nodePositions.dataset,
            data: {
              name: matchingDataset.name,
              username: matchingDataset.user?.username || 'unknown',
              description: matchingDataset.description || '',
              parameters: {},
              datasetId: matchingDataset.id,
              original_filename: matchingDataset.original_filename,
              format_type: matchingDataset.format_type,
              file_size: matchingDataset.file_size,
              metadata: matchingDataset.metadata
            }
          }
          addNode(datasetNodeData)
        }

        // Add problem node with parameters
        const problemNodeData = {
          id: `problem-${matchingProblem.name}-${matchingProblem.username}`,
          type: 'problem' as const,
          position: nodePositions.problem,
          data: {
            name: matchingProblem.name,
            username: matchingProblem.username,
            description: matchingProblem.description || '',
            parameters: problemParams ? JSON.parse(problemParams) : {},
            repository: matchingProblem.repository,
            tags: matchingProblem.tags
          }
        }
        addNode(problemNodeData)

        // Add optimizer node
        const optimizerNodeData = {
          id: `optimizer-${matchingOptimizer.name}-${matchingOptimizer.username}`,
          type: 'optimizer' as const,
          position: nodePositions.optimizer,
          data: {
            name: matchingOptimizer.name,
            username: matchingOptimizer.username,
            description: matchingOptimizer.description || '',
            parameters: optimizerParams ? JSON.parse(optimizerParams) : {},
            repository: matchingOptimizer.repository,
            tags: matchingOptimizer.tags
          }
        }
        addNode(optimizerNodeData)

        // Create connections between nodes
        setTimeout(() => {
          // Connect dataset to problem if dataset exists
          if (matchingDataset) {
            addConnection({
              source: `dataset-${matchingDataset.id}`,
              target: `problem-${matchingProblem.name}-${matchingProblem.username}`,
              animated: true,
              datasetParameter: datasetParameter || undefined // Use the saved dataset parameter
            })
          }

          // Connect problem to optimizer
          addConnection({
            source: `problem-${matchingProblem.name}-${matchingProblem.username}`,
            target: `optimizer-${matchingOptimizer.name}-${matchingOptimizer.username}`,
            animated: true
          })
        }, 100) // Small delay to ensure nodes are rendered

        toast({
          title: "Workflow loaded",
          description: `Loaded experiment: ${problemName} + ${optimizerName}${matchingDataset ? ` with dataset ${matchingDataset.name}` : ''}`
        })
      }
    } else {
      // Reset the loaded workflow key if no workflow parameters
      workflowLoadedRef.current = null
    }
  }, [searchParams, problems, optimizers, datasets, resetWorkflow, addNode, isLoadingContent])

  // Drag and drop handlers (moved to WorkflowCanvas component)
  const onDragStart = useCallback((event: React.DragEvent, nodeType: NodeType, item: Dataset | Problem | Optimizer) => {
    event.dataTransfer.setData('application/reactflow', JSON.stringify({ nodeType, item }))
    event.dataTransfer.effectAllowed = 'move'
  }, [])

  // Handle node selection for parameter panel - optimized to prevent grid refresh
  const handleNodeSelect = useCallback((nodeId: string | null) => {
    // Only update if the selection actually changed
    if (workflow.selectedNodeId !== nodeId) {
      selectNode(nodeId)
    }

    if (nodeId) {
      setSelectedNodeForParams(nodeId)
      setShowParameterPanel(true)
    } else {
      setShowParameterPanel(false)
      setSelectedNodeForParams(null)
    }
  }, [selectNode, workflow.selectedNodeId])

  // Handle parameter changes
  const handleParameterChange = useCallback((nodeId: string, parameters: Record<string, any>) => {
    updateNodeParameters(nodeId, parameters)
  }, [updateNodeParameters])

  // Handle dataset parameter selection
  const handleParameterSelectionConfirm = useCallback((selectedParameter: string) => {
    if (!pendingConnection) return

    const { params, datasetNode, problemNode } = pendingConnection

    // Add to workflow state with parameter mapping
    addConnection({
      source: params.source,
      target: params.target,
      sourceHandle: params.sourceHandle,
      targetHandle: params.targetHandle,
      animated: true,
      datasetParameter: selectedParameter // Store which parameter receives the dataset
    })

    // Update the problem node parameters to include the selected parameter mapping
    const updatedParameters = {
      ...problemNode.data.parameters,
      [`__dataset_mapping_${datasetNode.id}`]: selectedParameter
    }
    updateNodeParameters(problemNode.id, updatedParameters)

    // Clear pending connection
    setPendingConnection(null)

    toast({
      title: "Dataset connected",
      description: `Dataset "${datasetNode.data.name}" connected to parameter "${selectedParameter}" in problem "${problemNode.data.name}".`
    })
  }, [pendingConnection, addConnection, updateNodeParameters, setPendingConnection])

  const handleParameterSelectionCancel = useCallback(() => {
    setPendingConnection(null)
    setShowParameterSelectionModal(false)
  }, [setPendingConnection, setShowParameterSelectionModal])

  // Handle dataset-to-problem connection trigger
  const handleDatasetProblemConnection = useCallback((params: Connection, datasetNode: WorkflowNode, problemNode: WorkflowNode) => {
    setPendingConnection({
      params,
      datasetNode,
      problemNode
    })
    setShowParameterSelectionModal(true)
  }, [setPendingConnection, setShowParameterSelectionModal])

  const handleExecuteWorkflow = useCallback(async () => {
    if (workflow.nodes.length === 0) {
      toast({
        title: "No workflow to execute",
        description: "Please add nodes to your workflow before executing.",
        variant: "destructive"
      })
      return
    }

    try {


      // Set execution state to running
      setExecutionState({
        status: 'running',
        progress: 0,
        startTime: new Date(),
        logs: [...workflow.executionState.logs, {
          id: `log-${Date.now()}`,
          timestamp: new Date(),
          level: 'info',
          message: 'Starting workflow execution...',
          source: 'system'
        }]
      })

      await execute({
        nodes: workflow.nodes,
        connections: workflow.connections
      })
    } catch (error) {
      console.error('Execution failed:', error)
      setExecutionState({
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      })
    }
  }, [workflow.nodes, workflow.connections, execute, setExecutionState])

  const handleStopExecution = useCallback(async () => {
    try {
      await stop()
      setExecutionState({
        status: 'cancelled',
        endTime: new Date(),
        logs: [
          ...workflow.executionState.logs,
          {
            id: `log-${Date.now()}`,
            timestamp: new Date(),
            level: 'warning',
            message: 'Workflow execution stopped by user',
            source: 'system'
          }
        ]
      })
    } catch (error) {
      console.error('Stop failed:', error)
    }
  }, [stop, workflow.executionState.logs, setExecutionState])

  const handleResetWorkflow = useCallback(() => {
    resetWorkflow()
  }, [resetWorkflow])

  const handleResetExecution = useCallback(() => {
    setExecutionState({
      status: 'idle',
      progress: 0,
      logs: [],
      metrics: {
        totalSteps: 0,
        completedSteps: 0,
        executionTime: 0
      }
    })
  }, [setExecutionState])

  const handleResetAll = useCallback(() => {
    // Reset the entire workflow including nodes and connections
    resetWorkflow()

    // Also reset execution state
    setExecutionState({
      status: 'idle',
      progress: 0,
      logs: [],
      metrics: {
        totalSteps: 0,
        completedSteps: 0,
        executionTime: 0
      }
    })

    // Close parameter panel
    setShowParameterPanel(false)
    setSelectedNodeForParams(null)

    toast({
      title: "Workflow reset",
      description: "All nodes, connections, and execution state have been cleared."
    })
  }, [resetWorkflow, setExecutionState])

  // Helper function to format parameter values for Python code generation
  const formatParameterForPython = useCallback((value: any): string => {
    if (value === null || value === undefined) {
      return 'None'
    }

    if (typeof value === 'string') {
      // Escape quotes and special characters
      return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`
    }

    if (typeof value === 'number') {
      return String(value)
    }

    if (typeof value === 'boolean') {
      return value ? 'True' : 'False'
    }

    if (Array.isArray(value)) {
      const formattedItems = value.map(item => formatParameterForPython(item))
      return `[${formattedItems.join(', ')}]`
    }

    if (typeof value === 'object') {
      const formattedEntries = Object.entries(value).map(([k, v]) =>
        `"${k}": ${formatParameterForPython(v)}`
      )
      return `{${formattedEntries.join(', ')}}`
    }

    // Fallback to JSON.stringify for other types
    return JSON.stringify(value)
  }, [])

  // Generate workflow execution code for local use
  const generateWorkflowCode = useCallback((format = 'python') => {
    if (workflow.nodes.length === 0) {
      return "# No workflow nodes to generate code for"
    }

    const datasets = workflow.nodes.filter(node => node.type === 'dataset')
    const problems = workflow.nodes.filter(node => node.type === 'problem')
    const optimizers = workflow.nodes.filter(node => node.type === 'optimizer')

    if (problems.length === 0 || optimizers.length === 0) {
      return `# Incomplete workflow: Need at least one problem and one optimizer
# Current nodes: ${problems.length} problem(s), ${optimizers.length} optimizer(s), ${datasets.length} dataset(s)`
    }

    switch (format) {
      case 'jupyter':
        return generateJupyterNotebook(datasets, problems, optimizers)
      case 'docker':
        return generateDockerfile(datasets, problems, optimizers)
      case 'github-actions':
        return generateGitHubActions(datasets, problems, optimizers)
      case 'requirements':
        return generateRequirements(datasets, problems, optimizers)
      default:
        // Fall through to original Python generation logic below
        break
    }

    let code = `#!/usr/bin/env python3
"""
Generated Workflow Execution Code
Auto-generated from Rastion Decision Model Builder

This script executes your decision model locally using the qubots library.
Make sure you have the qubots library installed: pip install qubots

Usage:
    python workflow_script.py --token YOUR_RASTION_TOKEN [--param key=value ...]

Example:
    python workflow_script.py --token abc123 --param max_iterations=1000 --param population_size=50
"""

import argparse
import sys
from qubots import AutoProblem, AutoOptimizer, load_dataset_from_platform

def parse_arguments():
    """Parse command line arguments for dynamic parameter configuration"""
    parser = argparse.ArgumentParser(description='Execute Rastion workflow locally')
    parser.add_argument('--token', required=True, help='Rastion authentication token')
    parser.add_argument('--param', action='append', default=[],
                       help='Override parameters in format key=value (can be used multiple times)')
    return parser.parse_args()

def parse_override_params(param_list):
    """Parse parameter overrides from command line"""
    overrides = {}
    for param in param_list:
        if '=' not in param:
            print(f"Warning: Invalid parameter format '{param}', expected key=value")
            continue
        key, value = param.split('=', 1)
        # Try to parse as JSON for complex types, fallback to string
        try:
            import json
            overrides[key] = json.loads(value)
        except:
            overrides[key] = value
    return overrides

def main():
    """Execute the workflow locally using qubots modular architecture"""

    print("🔧 Qubots Modular Architecture Workflow")
    print("=" * 50)

    # Parse command line arguments
    args = parse_arguments()
    override_params = parse_override_params(args.param)

    if override_params:
        print(f"📝 Parameter overrides: {override_params}")

`

    // Generate modular workflow execution following datasets->problems->optimizers->results pattern
    if (problems.length > 0 && optimizers.length > 0) {

      // Step 1: Dataset loading (if datasets are present)
      if (datasets.length > 0) {
        code += `    # Step 1: Load datasets from platform\n`
        code += `    print("\\n📊 Step 1: Loading datasets from platform...")\n`
        code += `    datasets = {}\n`
        code += `    try:\n`

        datasets.forEach((dataset, index) => {
          code += `        # Load dataset: ${dataset.data.name}\n`
          code += `        print(f"Loading dataset: ${dataset.data.name} (ID: ${dataset.data.datasetId})")\n`
          code += `        datasets["${dataset.id}"] = load_dataset_from_platform(\n`
          code += `            token=args.token,\n`
          code += `            dataset_id="${dataset.data.datasetId}"\n`
          code += `        )\n`
          code += `        print(f"✅ Dataset loaded successfully ({len(datasets['${dataset.id}'])} characters)")\n`
          if (index === 0) {
            code += `        print(f"📄 Dataset preview: {datasets['${dataset.id}'][:100]}...")\n`
          }
          code += `\n`
        })

        code += `    except Exception as e:\n`
        code += `        print(f"⚠️  Dataset loading failed: {e}")\n`
        code += `        return\n`
        code += `\n`
      }

      // Step 2: Problem loading
      code += `    # Step ${datasets.length > 0 ? '2' : '1'}: Load problems from repository\n`
      code += `    print("\\n🧩 Step ${datasets.length > 0 ? '2' : '1'}: Loading problems from repository...")\n`
      code += `    problems = {}\n`
      code += `    try:\n`

      problems.forEach((problem, pIndex) => {
        // Find connected dataset and its parameter mapping
        const datasetConnection = workflow.connections.find(conn =>
          conn.target === problem.id &&
          datasets.some(d => d.id === conn.source)
        )

        const connectedDataset = datasetConnection ?
          datasets.find(d => d.id === datasetConnection.source) : null

        code += `        # Load problem: ${problem.data.name}\n`
        code += `        print(f"Loading problem: ${problem.data.name}")\n`
        code += `        problem_params_${pIndex + 1} = {\n`

        // Add dataset content if connected, using the selected parameter
        if (connectedDataset && datasetConnection) {
          const parameterName = datasetConnection.datasetParameter || 'dataset_content'
          code += `            "${parameterName}": datasets["${connectedDataset.id}"],  # Dataset connected to ${parameterName}\n`
        }

        // Add parameters from workflow (user-configured values)
        const problemParams = problem.data.parameters || {}
        Object.entries(problemParams).forEach(([key, value]) => {
          // Skip template variables and undefined, null, or empty string values
          if (key.startsWith('dataset_') || key.startsWith('__dataset_mapping_') ||
              value === undefined || value === null || value === '') {
            return
          }
          // Format parameter value for Python
          const formattedValue = formatParameterForPython(value)
          code += `            "${key}": ${formattedValue},  # User configured: ${typeof value}\n`
        })

        code += `            **override_params  # Dynamic overrides from command line\n`
        code += `        }\n`
        code += `        \n`
        code += `        problems["${problem.id}"] = AutoProblem.from_repo(\n`
        code += `            "${problem.data.username}/${problem.data.name}",\n`
        code += `            override_params=problem_params_${pIndex + 1}\n`
        code += `        )\n`
        code += `        print(f"✅ Problem loaded: {problems['${problem.id}'].metadata.name}")\n`
        code += `        print(f"📋 Problem type: {problems['${problem.id}'].metadata.problem_type.value}")\n`
        code += `        print(f"🎯 Objective: {problems['${problem.id}'].metadata.objective_type.value}")\n`
        code += `\n`
      })

      code += `    except Exception as e:\n`
      code += `        print(f"⚠️  Problem loading failed: {e}")\n`
      code += `        return\n`
      code += `\n`

      // Step 3: Optimizer loading
      code += `    # Step ${datasets.length > 0 ? '3' : '2'}: Load optimizers from repository\n`
      code += `    print("\\n⚙️  Step ${datasets.length > 0 ? '3' : '2'}: Loading optimizers from repository...")\n`
      code += `    optimizers = {}\n`
      code += `    try:\n`

      optimizers.forEach((optimizer, oIndex) => {
        code += `        # Load optimizer: ${optimizer.data.name}\n`
        code += `        print(f"Loading optimizer: ${optimizer.data.name}")\n`
        code += `        optimizer_params_${oIndex + 1} = {\n`

        // Add parameters from workflow (user-configured values)
        const optimizerParams = optimizer.data.parameters || {}
        Object.entries(optimizerParams).forEach(([key, value]) => {
          // Skip undefined, null, or empty string values unless they're explicitly set
          if (value !== undefined && value !== null && value !== '') {
            // Format parameter value for Python
            const formattedValue = formatParameterForPython(value)
            code += `            "${key}": ${formattedValue},  # User configured: ${typeof value}\n`
          }
        })

        code += `            **override_params  # Dynamic overrides from command line\n`
        code += `        }\n`
        code += `        \n`
        code += `        optimizers["${optimizer.id}"] = AutoOptimizer.from_repo(\n`
        code += `            "${optimizer.data.username}/${optimizer.data.name}",\n`
        code += `            override_params=optimizer_params_${oIndex + 1}\n`
        code += `        )\n`
        code += `        print(f"✅ Optimizer loaded: {optimizers['${optimizer.id}'].metadata.name}")\n`
        code += `        print(f"🔧 Algorithm type: {optimizers['${optimizer.id}'].metadata.optimizer_type.value}")\n`
        code += `        print(f"👥 Family: {optimizers['${optimizer.id}'].metadata.optimizer_family.value}")\n`
        code += `\n`
      })

      code += `    except Exception as e:\n`
      code += `        print(f"⚠️  Optimizer loading failed: {e}")\n`
      code += `        return\n`
      code += `\n`

      // Step 4: Execute optimization
      code += `    # Step ${datasets.length > 0 ? '4' : '3'}: Execute optimization\n`
      code += `    print("\\n🚀 Step ${datasets.length > 0 ? '4' : '3'}: Running optimization...")\n`
      code += `    results = {}\n`
      code += `    try:\n`

      // Generate all problem-optimizer combinations based on connections
      problems.forEach((problem, pIndex) => {
        optimizers.forEach((optimizer, oIndex) => {
          // Check if there's a connection between this problem and optimizer
          const hasConnection = workflow.connections.some(conn =>
            conn.source === problem.id && conn.target === optimizer.id
          )

          if (hasConnection) {
            const resultKey = `${problem.id}_${optimizer.id}`
            code += `        # Execute: ${problem.data.name} + ${optimizer.data.name}\n`
            code += `        print(f"Executing optimization: ${problem.data.name} + ${optimizer.data.name}")\n`
            code += `        results["${resultKey}"] = optimizers["${optimizer.id}"].optimize(problems["${problem.id}"])\n`
            code += `        \n`
            code += `        print(f"✅ Optimization completed!")\n`
            code += `        print(f"🏆 Best value: {results['${resultKey}'].best_value}")\n`
            code += `        print(f"⏱️  Runtime: {results['${resultKey}'].runtime_seconds:.3f} seconds")\n`
            code += `        print(f"🔄 Iterations: {results['${resultKey}'].iterations}")\n`
            code += `        print(f"📊 Solution: {results['${resultKey}'].best_solution}")\n`
            code += `        print()\n`
          }
        })
      })

      code += `    except Exception as e:\n`
      code += `        print(f"⚠️  Optimization failed: {e}")\n`
      code += `        return\n`
      code += `\n`
    }

    code += `    print("=" * 50)
    print("🎉 Workflow execution completed!")

if __name__ == "__main__":
    main()
`

    return code
  }, [workflow.nodes, workflow.connections])

  // Helper functions for different export formats
  const generateJupyterNotebook = useCallback((datasets, problems, optimizers) => {
    const cells = []

    // Title cell
    cells.push({
      cell_type: "markdown",
      metadata: {},
      source: [
        "# Decision Model\n",
        "Generated from Rastion Decision Model Builder\n",
        "\n",
        "This notebook contains your visual decision model converted to executable code.\n",
        "Make sure you have the qubots library installed: pip install qubots\n"
      ]
    })

    // Installation cell
    cells.push({
      cell_type: "code",
      execution_count: null,
      metadata: {},
      outputs: [],
      source: [
        "# Install required packages\n",
        "!pip install qubots\n"
      ]
    })

    // Imports and configuration cell
    cells.push({
      cell_type: "code",
      execution_count: null,
      metadata: {},
      outputs: [],
      source: [
        "# Generated Workflow Execution Code\n",
        "# Auto-generated from Rastion Decision Model Builder\n",
        "#\n",
        "# This notebook executes your decision model locally using the qubots library.\n",
        "# Make sure you have the qubots library installed: pip install qubots\n",
        "\n",
        "import sys\n",
        "import time\n",
        "from qubots import AutoProblem, AutoOptimizer, load_dataset_from_platform\n",
        "\n",
        "# Configuration - Update this with your actual token\n",
        "RASTION_TOKEN = \"your_rastion_token_here\"  # Replace with your actual token\n",
        "\n",
        "print(\"🚀 Starting Decision Model Execution...\")\n",
        "print(f\"📊 Workflow contains: {" + datasets.length + "} dataset(s), {" + problems.length + "} problem(s), {" + optimizers.length + "} optimizer(s)\")\n",
        "print(\"\\n\" + \"=\"*60)\n",
        "\n",
        "start_time = time.time()\n"
      ]
    })

    // Generate modular workflow execution following datasets->problems->optimizers->results pattern
    if (problems.length > 0 && optimizers.length > 0) {

      // Step 1: Dataset loading (if datasets are present)
      if (datasets.length > 0) {
        cells.push({
          cell_type: "code",
          execution_count: null,
          metadata: {},
          outputs: [],
          source: [
            `# Step 1: Load datasets from platform\n`,
            `print("\\n📊 Step 1: Loading datasets from platform...")\n`,
            `datasets = {}\n`,
            `try:\n`,
            ...datasets.map((dataset, index) => [
              `    # Load dataset: ${dataset.data.name}\n`,
              `    print(f"Loading dataset: ${dataset.data.name} (ID: ${dataset.data.datasetId})")\n`,
              `    datasets["${dataset.id}"] = load_dataset_from_platform(\n`,
              `        token=RASTION_TOKEN,\n`,
              `        dataset_id="${dataset.data.datasetId}"\n`,
              `    )\n`,
              `    print(f"✅ Dataset loaded successfully ({len(datasets['${dataset.id}'])} characters)")\n`,
              ...(index === 0 ? [`    print(f"📄 Dataset preview: {datasets['${dataset.id}'][:100]}...")\n`] : []),
              `\n`
            ]).flat(),
            `except Exception as e:\n`,
            `    print(f"⚠️  Dataset loading failed: {e}")\n`,
            `    raise\n`,
            `\n`
          ]
        })
      }

      // Step 2: Problem loading
      cells.push({
        cell_type: "code",
        execution_count: null,
        metadata: {},
        outputs: [],
        source: [
          `# Step ${datasets.length > 0 ? '2' : '1'}: Load problems from repository\n`,
          `print("\\n🧩 Step ${datasets.length > 0 ? '2' : '1'}: Loading problems from repository...")\n`,
          `problems = {}\n`,
          `try:\n`,
          ...problems.map((problem, pIndex) => {
            // Find connected dataset and its parameter mapping
            const datasetConnection = workflow.connections.find(conn =>
              conn.target === problem.id &&
              datasets.some(d => d.id === conn.source)
            )
            const connectedDataset = datasetConnection ?
              datasets.find(d => d.id === datasetConnection.source) : null

            const lines = [
              `    # Load problem: ${problem.data.name}\n`,
              `    print(f"Loading problem: ${problem.data.name}")\n`,
              `    problem_params_${pIndex + 1} = {\n`
            ]

            // Add dataset content if connected, using the selected parameter
            if (connectedDataset && datasetConnection) {
              const parameterName = datasetConnection.datasetParameter || 'dataset_content'
              lines.push(`        "${parameterName}": datasets["${connectedDataset.id}"],  # Dataset connected to ${parameterName}\n`)
            }

            // Add parameters from workflow (user-configured values)
            const problemParams = problem.data.parameters || {}
            Object.entries(problemParams).forEach(([key, value]) => {
              // Skip template variables and undefined, null, or empty string values
              if (key.startsWith('dataset_') || key.startsWith('__dataset_mapping_') ||
                  value === undefined || value === null || value === '') {
                return
              }
              // Format parameter value for Python
              const formattedValue = formatParameterForPython(value)
              lines.push(`        "${key}": ${formattedValue},  # User configured: ${typeof value}\n`)
            })

            lines.push(
              `    }\n`,
              `    \n`,
              `    problems["${problem.id}"] = AutoProblem.from_repo(\n`,
              `        "${problem.data.username}/${problem.data.name}",\n`,
              `        override_params=problem_params_${pIndex + 1}\n`,
              `    )\n`,
              `    print(f"✅ Problem loaded: {problems['${problem.id}'].metadata.name}")\n`,
              `    print(f"📋 Problem type: {problems['${problem.id}'].metadata.problem_type.value}")\n`,
              `    print(f"🎯 Objective: {problems['${problem.id}'].metadata.objective_type.value}")\n`,
              `\n`
            )
            return lines
          }).flat(),
          `except Exception as e:\n`,
          `    print(f"⚠️  Problem loading failed: {e}")\n`,
          `    raise\n`,
          `\n`
        ]
      })

      // Step 3: Optimizer loading
      cells.push({
        cell_type: "code",
        execution_count: null,
        metadata: {},
        outputs: [],
        source: [
          `# Step ${datasets.length > 0 ? '3' : '2'}: Load optimizers from repository\n`,
          `print("\\n⚙️  Step ${datasets.length > 0 ? '3' : '2'}: Loading optimizers from repository...")\n`,
          `optimizers = {}\n`,
          `try:\n`,
          ...optimizers.map((optimizer, oIndex) => {
            const lines = [
              `    # Load optimizer: ${optimizer.data.name}\n`,
              `    print(f"Loading optimizer: ${optimizer.data.name}")\n`,
              `    optimizer_params_${oIndex + 1} = {\n`
            ]

            // Add parameters from workflow (user-configured values)
            const optimizerParams = optimizer.data.parameters || {}
            Object.entries(optimizerParams).forEach(([key, value]) => {
              // Skip template variables and undefined, null, or empty string values
              if (key.startsWith('dataset_') || key.startsWith('__dataset_mapping_') ||
                  value === undefined || value === null || value === '') {
                return
              }
              // Format parameter value for Python
              const formattedValue = formatParameterForPython(value)
              lines.push(`        "${key}": ${formattedValue},  # User configured: ${typeof value}\n`)
            })

            lines.push(
              `    }\n`,
              `    \n`,
              `    optimizers["${optimizer.id}"] = AutoOptimizer.from_repo(\n`,
              `        "${optimizer.data.username}/${optimizer.data.name}",\n`,
              `        override_params=optimizer_params_${oIndex + 1}\n`,
              `    )\n`,
              `    print(f"✅ Optimizer loaded: {optimizers['${optimizer.id}'].metadata.name}")\n`,
              `\n`
            )
            return lines
          }).flat(),
          `except Exception as e:\n`,
          `    print(f"⚠️  Optimizer loading failed: {e}")\n`,
          `    raise\n`,
          `\n`
        ]
      })

      // Step 4: Execution
      cells.push({
        cell_type: "code",
        execution_count: null,
        metadata: {},
        outputs: [],
        source: [
          `# Step ${datasets.length > 0 ? '4' : '3'}: Execute optimization workflows\n`,
          `print("\\n🚀 Step ${datasets.length > 0 ? '4' : '3'}: Executing optimization workflows...")\n`,
          `results = {}\n`,
          `\n`,
          ...(() => {
            const executionLines = []
            problems.forEach(problem => {
              optimizers.forEach(optimizer => {
                // Check if there's a connection between this problem and optimizer
                const hasConnection = workflow.connections.some(conn =>
                  conn.source === problem.id && conn.target === optimizer.id
                )

                if (hasConnection) {
                  executionLines.push(
                    `# Execute: ${problem.data.name} + ${optimizer.data.name}\n`,
                    `print("\\n" + "="*60)\n`,
                    `print(f"🔄 Executing: ${problem.data.name} + ${optimizer.data.name}")\n`,
                    `print("="*60)\n`,
                    `\n`,
                    `try:\n`,
                    `    execution_start = time.time()\n`,
                    `    result = optimizers["${optimizer.id}"].optimize(problems["${problem.id}"])\n`,
                    `    execution_end = time.time()\n`,
                    `    \n`,
                    `    # Store result\n`,
                    `    result_key = "${problem.id}_${optimizer.id}"\n`,
                    `    results[result_key] = {\n`,
                    `        "problem": "${problem.data.name}",\n`,
                    `        "optimizer": "${optimizer.data.name}",\n`,
                    `        "result": result,\n`,
                    `        "runtime": execution_end - execution_start\n`,
                    `    }\n`,
                    `    \n`,
                    `    # Display results\n`,
                    `    print(f"✅ Optimization completed successfully!")\n`,
                    `    print(f"🎯 Best Value: {result.best_value}")\n`,
                    `    print(f"⏱️  Runtime: {execution_end - execution_start:.3f} seconds")\n`,
                    `    if hasattr(result, 'iterations'):\n`,
                    `        print(f"🔄 Iterations: {result.iterations}")\n`,
                    `    if hasattr(result, 'best_solution') and len(str(result.best_solution)) < 200:\n`,
                    `        print(f"🔧 Best Solution: {result.best_solution}")\n`,
                    `    \n`,
                    `except Exception as e:\n`,
                    `    print(f"❌ Optimization failed: {e}")\n`,
                    `    results[result_key] = {"error": str(e)}\n`,
                    `\n`
                  )
                }
              })
            })
            return executionLines
          })()
        ]
      })

      // Step 5: Results and Summary
      cells.push({
        cell_type: "code",
        execution_count: null,
        metadata: {},
        outputs: [],
        source: [
          `# Step ${datasets.length > 0 ? '5' : '4'}: Display results summary\n`,
          `print("\\n📊 Step ${datasets.length > 0 ? '5' : '4'}: Results Summary")\n`,
          `print("="*60)\n`,
          `\n`,
          `total_runtime = time.time() - start_time\n`,
          `\n`,
          `if results:\n`,
          `    for result_key, result_data in results.items():\n`,
          `        if "error" not in result_data:\n`,
          `            print(f"\\n🎯 {result_data['problem']} + {result_data['optimizer']}")\n`,
          `            print(f"   Best Value: {result_data['result'].best_value}")\n`,
          `            print(f"   Runtime: {result_data['runtime']:.3f}s")\n`,
          `            if hasattr(result_data['result'], 'iterations'):\n`,
          `                print(f"   Iterations: {result_data['result'].iterations}")\n`,
          `        else:\n`,
          `            print(f"\\n❌ {result_key}: {result_data['error']}")\n`,
          `else:\n`,
          `    print("No results to display")\n`,
          `\n`,
          `print(f"\\n⏱️  Total execution time: {total_runtime:.3f} seconds")\n`,
          `print("\\n✅ Decision model execution completed!")\n`
        ]
      })
    }

    return JSON.stringify({
      cells,
      metadata: {
        kernelspec: {
          display_name: "Python 3",
          language: "python",
          name: "python3"
        },
        language_info: {
          codemirror_mode: {
            name: "ipython",
            version: 3
          },
          file_extension: ".py",
          mimetype: "text/x-python",
          name: "python",
          nbconvert_exporter: "python",
          pygments_lexer: "ipython3",
          version: "3.8.0"
        }
      },
      nbformat: 4,
      nbformat_minor: 4
    }, null, 2)
  }, [workflow.connections])

  const generateDockerfile = useCallback((datasets, problems, optimizers) => {
    return `# Dockerfile for Optimization Workflow
# Generated from Rastion Decision Model Builder

FROM python:3.9-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \\
    git \\
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy workflow script
COPY workflow.py .

# Set environment variables
ENV PYTHONPATH=/app
ENV RASTION_TOKEN=""

# Run the workflow
CMD ["python", "workflow.py"]
`
  }, [])

  const generateGitHubActions = useCallback((datasets, problems, optimizers) => {
    return `# GitHub Actions Workflow
# Generated from Rastion Decision Model Builder

name: Optimization Workflow

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]
  workflow_dispatch:

jobs:
  optimize:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v3

    - name: Set up Python 3.9
      uses: actions/setup-python@v3
      with:
        python-version: 3.9

    - name: Install dependencies
      run: |
        python -m pip install --upgrade pip
        pip install qubots
        if [ -f requirements.txt ]; then pip install -r requirements.txt; fi

    - name: Run optimization workflow
      env:
        RASTION_TOKEN: \${{ secrets.RASTION_TOKEN }}
      run: python workflow.py

    - name: Upload results
      uses: actions/upload-artifact@v3
      with:
        name: optimization-results
        path: results/
`
  }, [])

  const generateRequirements = useCallback((datasets, problems, optimizers) => {
    const requirements = new Set(['qubots'])

    // Add specific requirements based on node types
    problems.forEach(problem => {
      if (problem.data.tags?.includes('tsp')) requirements.add('networkx')
      if (problem.data.tags?.includes('scheduling')) requirements.add('ortools')
    })

    optimizers.forEach(optimizer => {
      if (optimizer.data.tags?.includes('genetic')) requirements.add('deap')
      if (optimizer.data.tags?.includes('ortools')) requirements.add('ortools')
    })

    return Array.from(requirements).join('\\n')
  }, [])

  // Handle export as Python
  const handleExportAsPython = useCallback(() => {
    const code = generateWorkflowCode('python')
    const filename = 'workflow.py'

    const blob = new Blob([code], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast({
      title: "Workflow exported!",
      description: `Workflow has been exported as ${filename}.`
    })
  }, [generateWorkflowCode])

  // Handle export as Jupyter Notebook
  const handleExportAsJupyter = useCallback(() => {
    const code = generateWorkflowCode('jupyter')
    const filename = 'workflow.ipynb'

    const blob = new Blob([code], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast({
      title: "Jupyter Notebook exported!",
      description: `Workflow has been exported as ${filename}.`
    })
  }, [generateWorkflowCode])

  // Handle download locally - downloads repositories and dataset as zip
  const handleDownloadLocally = useCallback(async () => {
    if (workflow.nodes.length === 0) {
      toast({
        title: "No workflow to download",
        description: "Please add some components to your workflow first.",
        variant: "destructive"
      })
      return
    }

    try {
      // Extract repositories and datasets from workflow nodes
      const repositories = []
      const datasets = []

      workflow.nodes.forEach(node => {
        if (node.type === 'problem' || node.type === 'optimizer') {
          repositories.push({
            username: node.data.username,
            name: node.data.name,
            type: node.type
          })
        } else if (node.type === 'dataset') {
          datasets.push({
            id: node.data.datasetId,
            name: node.data.name
          })
        }
      })

      // Create download request
      const downloadRequest = {
        repositories,
        datasets,
        workflow_code: generateWorkflowCode('python')
      }

      toast({
        title: "Preparing download...",
        description: "Creating zip file with repositories and datasets."
      })

      // Call API to create zip file
      const response = await fetch('/api/decision-model-builder/download-locally', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(downloadRequest)
      })

      if (response.ok) {
        // Download the zip file
        const blob = await response.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'workflow-local-package.zip'
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)

        toast({
          title: "Download complete!",
          description: "Workflow package has been downloaded successfully."
        })
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
    } catch (error) {
      console.error('Download failed:', error)
      toast({
        title: "Download failed",
        description: error.message || "Failed to download workflow package.",
        variant: "destructive"
      })
    }
  }, [workflow.nodes, generateWorkflowCode])

  // Handle copy workflow code
  const handleCopyWorkflowCode = useCallback(async () => {
    const code = generateWorkflowCode()

    try {
      await navigator.clipboard.writeText(code)
      toast({
        title: "Code copied!",
        description: "Workflow execution code has been copied to clipboard."
      })
    } catch (error) {
      console.error('Failed to copy code:', error)
      toast({
        title: "Copy failed",
        description: "Failed to copy code to clipboard.",
        variant: "destructive"
      })
    }
  }, [generateWorkflowCode, toast])

  const handleSaveWorkflow = useCallback(async () => {
    if (workflow.nodes.length === 0) {
      toast({
        title: "Cannot save empty workflow",
        description: "Please add nodes to your workflow before saving.",
        variant: "destructive"
      })
      return
    }

    // Find problem and optimizer nodes
    const problemNode = workflow.nodes.find(node => node.type === 'problem')
    const optimizerNode = workflow.nodes.find(node => node.type === 'optimizer')

    if (!problemNode || !optimizerNode) {
      toast({
        title: "Cannot save incomplete workflow",
        description: "Workflow must contain at least one problem and one optimizer to save as a solution.",
        variant: "destructive"
      })
      return
    }

    const workflowName = prompt("Enter a name for your optimization solution:")
    if (!workflowName || workflowName.trim().length === 0) {
      return
    }

    try {
      // Convert workflow to optimization solution format
      const optimizationSolution = {
        title: workflowName.trim(),
        description: "Optimization solution created with decision model builder",
        problem_name: problemNode.data.name,
        problem_username: problemNode.data.username,
        optimizer_name: optimizerNode.data.name,
        optimizer_username: optimizerNode.data.username,
        problem_params: problemNode.data.parameters || {},
        optimizer_params: optimizerNode.data.parameters || {},
        tags: [],
        is_public: false
      }

      // Save as optimization solution instead of workflow
      const response = await fetch('/api/playground/workflows', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(optimizationSolution)
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Solution saved",
          description: "Your optimization solution has been saved successfully."
        })
      } else {
        throw new Error(result.message || 'Failed to save solution')
      }
    } catch (error) {
      console.error('Save failed:', error)
      toast({
        title: "Save failed",
        description: error.message || "Failed to save optimization solution.",
        variant: "destructive"
      })
    }
  }, [workflow.nodes, workflow.connections])

  const handleExportAsPublicExperiment = useCallback(async (data: ExportExperimentData) => {
    if (workflow.nodes.length === 0) {
      toast({
        title: "Cannot export empty workflow",
        description: "Please add nodes to your workflow before exporting.",
        variant: "destructive"
      })
      return
    }

    // Find problem and optimizer nodes
    const problemNode = workflow.nodes.find(node => node.type === 'problem')
    const optimizerNode = workflow.nodes.find(node => node.type === 'optimizer')
    const datasetNode = workflow.nodes.find(node => node.type === 'dataset')

    if (!problemNode || !optimizerNode) {
      toast({
        title: "Cannot export incomplete workflow",
        description: "Workflow must contain at least one problem and one optimizer.",
        variant: "destructive"
      })
      return
    }

    // Validate connections
    const hasValidConnections = validateWorkflowConnections(workflow.nodes, workflow.connections)
    if (!hasValidConnections) {
      toast({
        title: "Invalid workflow connections",
        description: "Please ensure your workflow has proper connections: dataset→problem→optimizer or problem→optimizer.",
        variant: "destructive"
      })
      return
    }

    setIsExporting(true)

    try {
      // Find dataset parameter mapping if dataset is connected to problem
      let datasetParameter = null
      if (datasetNode && problemNode) {
        const datasetConnection = workflow.connections.find(conn =>
          conn.source === datasetNode.id && conn.target === problemNode.id
        )
        datasetParameter = datasetConnection?.datasetParameter || null
      }

      // Create public experiment
      const publicExperiment = {
        name: data.name,
        description: data.description || "Public experiment created with decision model builder",
        problem_name: problemNode.data.name,
        problem_username: problemNode.data.username,
        optimizer_name: optimizerNode.data.name,
        optimizer_username: optimizerNode.data.username,
        problem_params: problemNode.data.parameters || {},
        optimizer_params: optimizerNode.data.parameters || {},
        dataset_id: datasetNode?.data.datasetId || null,
        dataset_parameter: datasetParameter, // Save which parameter should receive the dataset
        is_public: true,
        tags: data.tags
      }

      // Save as public experiment
      const response = await fetch('/api/public-experiments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(publicExperiment)
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Public experiment created",
          description: "Your experiment has been published and is now visible to the community."
        })
      } else {
        throw new Error(result.message || 'Failed to create public experiment')
      }
    } catch (error) {
      console.error('Export failed:', error)
      toast({
        title: "Export failed",
        description: error.message || "Failed to create public experiment.",
        variant: "destructive"
      })
      throw error // Re-throw to let the dialog handle it
    } finally {
      setIsExporting(false)
    }
  }, [workflow.nodes, workflow.connections])



  const handleOpenExportDialog = useCallback(() => {
    if (workflow.nodes.length === 0) {
      toast({
        title: "Cannot export empty workflow",
        description: "Please add nodes to your workflow before exporting.",
        variant: "destructive"
      })
      return
    }

    // Find problem and optimizer nodes
    const problemNode = workflow.nodes.find(node => node.type === 'problem')
    const optimizerNode = workflow.nodes.find(node => node.type === 'optimizer')
    const datasetNode = workflow.nodes.find(node => node.type === 'dataset')

    if (!problemNode || !optimizerNode) {
      toast({
        title: "Cannot export incomplete workflow",
        description: "Workflow must contain at least one problem and one optimizer.",
        variant: "destructive"
      })
      return
    }

    // Validate connections
    const hasValidConnections = validateWorkflowConnections(workflow.nodes, workflow.connections)
    if (!hasValidConnections) {
      toast({
        title: "Invalid workflow connections",
        description: "Please ensure your workflow has proper connections: dataset→problem→optimizer or problem→optimizer.",
        variant: "destructive"
      })
      return
    }

    setShowExportDialog(true)
  }, [workflow.nodes])



  const handleLoadWorkflow = useCallback(async () => {
    // This would typically open a dialog to select from saved workflows
    // For now, we'll just show a message
    toast({
      title: "Load workflow",
      description: "Workflow loading dialog will be implemented in the next phase."
    })
  }, [load])

  return (
    <Layout>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-40">
          <div className="container mx-auto px-4 sm:px-6 py-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                  Decision Model Builder
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Build visual decision models with drag-and-drop simplicity
                </p>
              </div>
              
              {/* Workflow Controls */}
              <div className="flex flex-wrap items-center gap-2">
                

                

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResetAll}
                  disabled={isExecuting}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset
                </Button>

                {/* Export Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={workflow.nodes.length === 0}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      <span className="hidden sm:inline">Export</span>
                      <ChevronDown className="h-4 w-4 ml-2" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleExportAsPython}>
                      <Code className="h-4 w-4 mr-2" />
                      Export as .py
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleExportAsJupyter}>
                      <BookOpen className="h-4 w-4 mr-2" />
                      Export as Jupyter Notebook
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleDownloadLocally}>
                      <Download className="h-4 w-4 mr-2" />
                      Download Locally
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleOpenExportDialog}>
                      <Globe className="h-4 w-4 mr-2" />
                      Export as Public Decision Model
                    </DropdownMenuItem>

                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>


          </div>
        </div>

        <div className="flex h-[calc(100vh-140px)] sm:h-[calc(100vh-120px)] w-full">
          {/* Component Sidebar - Left */}
          <ComponentSidebar
            datasets={datasets}
            problems={problems}
            optimizers={optimizers}
            onDragStart={onDragStart}
            onAddNode={(nodeType, item) => {
              // Generate a random position for click-to-add
              const position = {
                x: Math.random() * 400 + 100,
                y: Math.random() * 300 + 100
              }
              handleAddNode(nodeType, item, position, {})
            }}
            isLoading={isLoadingContent}
          />

          {/* Main Canvas Area - Flexible width */}
          <div className="flex-1 relative min-h-0 overflow-hidden">
            <ReactFlowProvider>
              <WorkflowCanvas
                workflow={workflow}
                addNode={addNode}
                removeNode={removeNode}
                selectNode={handleNodeSelect}
                addConnection={addConnection}
                handleAddNode={handleAddNode}
                updateNodes={updateNodes}
                onDatasetProblemConnection={handleDatasetProblemConnection}
              />
            </ReactFlowProvider>
          </div>

          {/* Right Parameter Panel */}
          {showParameterPanel && selectedNodeForParams && (
            <ParameterPanel
              node={workflow.nodes.find(n => n.id === selectedNodeForParams) || null}
              isOpen={showParameterPanel}
              onClose={() => {
                setShowParameterPanel(false)
                setSelectedNodeForParams(null)
                selectNode(null)
              }}
              onParameterChange={handleParameterChange}
              connections={workflow.connections}
              allNodes={workflow.nodes}
            />
          )}

        </div>

        {/* Export Experiment Dialog */}
        <ExportExperimentDialog
          isOpen={showExportDialog}
          onClose={() => setShowExportDialog(false)}
          onExport={handleExportAsPublicExperiment}
          isLoading={isExporting}
        />

        {/* Dataset Parameter Selection Modal */}
        <DatasetParameterSelectionModal
          open={showParameterSelectionModal}
          onClose={handleParameterSelectionCancel}
          onConfirm={handleParameterSelectionConfirm}
          datasetNode={pendingConnection?.datasetNode || null}
          problemNode={pendingConnection?.problemNode || null}
        />


      </div>
    </Layout>
  )
}

export default WorkflowAutomationPage

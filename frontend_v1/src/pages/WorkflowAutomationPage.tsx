import React, { useState, useCallback, useRef, useEffect } from "react"
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
  Play,
  Square,
  RotateCcw,
  Save,
  FolderOpen,
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

  CheckCircle,
  AlertTriangle,
  X,
  Terminal
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
import IntegratedWorkflowSidebar from "@/components/workflow/IntegratedWorkflowSidebar"
import { useDragAndDrop } from "@/hooks/useDragAndDrop"

// Inner component that uses ReactFlow hooks
const WorkflowCanvas = ({
  workflow,
  addNode,
  selectNode,
  addConnection,
  handleAddNode
}: {
  workflow: any
  addNode: any
  selectNode: any
  addConnection: any
  handleAddNode: any
}) => {
  // React Flow state
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])

  // Drag and drop functionality (now inside ReactFlowProvider)
  const { reactFlowWrapper, onDragStart, onDragOver, onDrop } = useDragAndDrop()

  // React Flow event handlers
  const onConnect = useCallback(
    (params: Connection) => {
      if (params.source && params.target) {
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
    [setEdges, addConnection]
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

  // Sync React Flow nodes with workflow state
  useEffect(() => {
    const reactFlowNodes = workflow.nodes.map((node) => ({
      id: node.id,
      type: node.type,
      position: node.position,
      data: node.data,
      selected: workflow.selectedNodeId === node.id
    }))
    setNodes(reactFlowNodes)
  }, [workflow.nodes, workflow.selectedNodeId, setNodes])

  // Sync React Flow edges with workflow state
  useEffect(() => {
    const reactFlowEdges = workflow.connections.map((connection) => ({
      id: connection.id,
      source: connection.source,
      target: connection.target,
      sourceHandle: connection.sourceHandle,
      targetHandle: connection.targetHandle,
      animated: connection.animated || true,
      style: connection.style || { stroke: '#94a3b8', strokeWidth: 2 },
      markerEnd: { type: MarkerType.ArrowClosed, color: '#94a3b8' }
    }))
    setEdges(reactFlowEdges)
  }, [workflow.connections, setEdges])

  return (
    <div
      ref={reactFlowWrapper}
      className="w-full h-full"
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, handleAddNode)}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        fitView
        className="bg-slate-50 dark:bg-slate-800"
        proOptions={{ hideAttribution: true }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          className="opacity-50"
        />
        <Controls
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg"
        />
        <MiniMap
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg"
          nodeColor={(node) => {
            switch (node.type) {
              case 'dataset': return '#3b82f6'
              case 'problem': return '#10b981'
              case 'optimizer': return '#f59e0b'
              default: return '#6b7280'
            }
          }}
        />

        {workflow.nodes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center space-y-4 max-w-md">
              <div className="text-6xl opacity-20">🔧</div>
              <Alert className="pointer-events-auto">
                <AlertDescription className="text-center">
                  <strong>Welcome to Workflow Automation!</strong><br />
                  Drag datasets, problems, and optimizers from the sidebar to start building your workflow.<br />
                  Connect nodes by dragging from the connection handles to define your workflow execution order.
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
  const { workflow, addNode, selectNode, resetWorkflow, setExecutionState, addConnection } = useWorkflowState()
  const { datasets, problems, optimizers, isLoading: isLoadingContent } = useUserContent()

  // Execution hook with callbacks for real-time updates
  const { execute, stop, isExecuting, executionResult } = useWorkflowExecution(
    // Log callback
    (log) => {
      setExecutionState({
        logs: [
          ...workflow.executionState.logs,
          {
            id: `log-${Date.now()}-${Math.random()}`,
            timestamp: new Date(log.timestamp),
            level: log.level,
            message: log.message,
            source: log.source
          }
        ]
      })
    },
    // Progress callback
    (progress, step) => {
      setExecutionState({
        progress,
        currentStep: step
      })
    }
  )

  const { save, load, isLoading: isSaving } = useWorkflowPersistence()

  const [sidebarTab, setSidebarTab] = useState<'datasets' | 'problems' | 'optimizers'>('datasets')
  const [showWorkflowSidebar, setShowWorkflowSidebar] = useState(false)
  const canvasRef = useRef<HTMLDivElement>(null)

  // Drag and drop handlers (moved to WorkflowCanvas component)
  const onDragStart = useCallback((event: React.DragEvent, nodeType: NodeType, item: Dataset | Problem | Optimizer) => {
    event.dataTransfer.setData('application/reactflow', JSON.stringify({ nodeType, item }))
    event.dataTransfer.effectAllowed = 'move'
  }, [])

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
      // Show workflow sidebar
      setShowWorkflowSidebar(true)

      // Set execution state to running
      setExecutionState({
        status: 'running',
        progress: 0,
        startTime: new Date(),
        logs: [{
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
    setShowWorkflowSidebar(false)
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



  const handleParameterChange = useCallback((nodeId: string, parameters: Record<string, any>) => {
    // Update the node's parameters in the workflow state
    // This would typically update the workflow state through the hook
    // For now, we'll just log the changes
    console.log('Parameter change for node', nodeId, ':', parameters)
  }, [])

  const handleSaveWorkflow = useCallback(async () => {
    if (workflow.nodes.length === 0) {
      toast({
        title: "Cannot save empty workflow",
        description: "Please add nodes to your workflow before saving.",
        variant: "destructive"
      })
      return
    }

    const workflowName = prompt("Enter a name for your workflow:")
    if (!workflowName || workflowName.trim().length === 0) {
      return
    }

    try {
      await save({
        name: workflowName.trim(),
        description: "Workflow created with visual builder",
        nodes: workflow.nodes,
        connections: workflow.connections,
        tags: [],
        isPublic: false
      })
    } catch (error) {
      console.error('Save failed:', error)
    }
  }, [workflow.nodes, workflow.connections, save])

  const handleLoadWorkflow = useCallback(async () => {
    // This would typically open a dialog to select from saved workflows
    // For now, we'll just show a message
    toast({
      title: "Load workflow",
      description: "Workflow loading dialog will be implemented in the next phase."
    })
  }, [load])

  const handleAddNode = useCallback((type: NodeType, item: Dataset | Problem | Optimizer, position?: { x: number; y: number }) => {
    let nodePosition = position

    // If no position provided, calculate position in a grid layout
    if (!nodePosition) {
      const nodesPerRow = 3
      const nodeWidth = 250
      const nodeHeight = 150
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

    const nodeData = {
      type,
      position: nodePosition,
      data: {
        name: item.name,
        username: 'username' in item ? item.username : 'user',
        description: item.description || '',
        parameters: {},
        repository: 'repository' in item ? item.repository : undefined,
        tags: 'tags' in item ? item.tags : undefined
      }
    }

    addNode(nodeData)

    toast({
      title: "Node added",
      description: `${item.name} has been added to your workflow.`
    })
  }, [workflow.nodes.length, addNode])

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        {/* Header */}
        <div className="border-b bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm sticky top-0 z-40">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                  Workflow Automation
                </h1>
                <p className="text-muted-foreground mt-1">
                  Build visual optimization workflows with drag-and-drop simplicity
                </p>
              </div>
              
              {/* Execution Controls */}
              <div className="flex items-center gap-3">
                {isExecuting ? (
                  <>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Executing... {executionResult?.progress || 0}%
                      {executionResult?.metrics && (
                        <span className="ml-2">
                          ({executionResult.metrics.completedSteps}/{executionResult.metrics.totalSteps} steps)
                        </span>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleStopExecution}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Square className="h-4 w-4 mr-2" />
                      Stop
                    </Button>
                  </>
                ) : (
                  <Button
                    onClick={handleExecuteWorkflow}
                    disabled={workflow.nodes.length === 0}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Execute
                  </Button>
                )}

                <Button variant="outline" size="sm" onClick={handleResetWorkflow}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSaveWorkflow}
                  disabled={isSaving || workflow.nodes.length === 0}
                >
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Save
                </Button>

                <Button variant="outline" size="sm" onClick={handleLoadWorkflow}>
                  <FolderOpen className="h-4 w-4 mr-2" />
                  Load
                </Button>

                <Button
                  variant={showWorkflowSidebar ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowWorkflowSidebar(!showWorkflowSidebar)}
                >
                  <Terminal className="h-4 w-4 mr-2" />
                  Workflow
                </Button>
              </div>
            </div>

            {/* Progress Bar */}
            {isExecuting && (
              <div className="mt-3">
                <Progress value={executionResult?.progress || 0} className="h-2" />
                {executionResult?.logs && executionResult.logs.length > 0 && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    Latest: {executionResult.logs[executionResult.logs.length - 1]?.message}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex h-[calc(100vh-120px)]">
          {/* Sidebar */}
          <div className="w-80 border-r bg-white dark:bg-slate-900 flex flex-col">
            <div className="p-4 border-b">
              <Tabs value={sidebarTab} onValueChange={(value) => setSidebarTab(value as any)}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="datasets" className="text-xs">
                    <Database className="h-4 w-4 mr-1" />
                    Datasets
                  </TabsTrigger>
                  <TabsTrigger value="problems" className="text-xs">
                    <Brain className="h-4 w-4 mr-1" />
                    Problems
                  </TabsTrigger>
                  <TabsTrigger value="optimizers" className="text-xs">
                    <Zap className="h-4 w-4 mr-1" />
                    Optimizers
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {isLoadingContent ? (
                <div className="flex items-center justify-center py-8">
                  <div className="flex items-center gap-3">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <span className="text-sm text-muted-foreground">Loading your content...</span>
                  </div>
                </div>
              ) : (
                <Tabs value={sidebarTab}>
                  <TabsContent value="datasets" className="space-y-2 mt-0">
                    {datasets.length === 0 ? (
                      <div className="text-center py-8">
                        <Database className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">No datasets found</p>
                        <p className="text-xs text-muted-foreground mt-1">Upload datasets to get started</p>
                      </div>
                    ) : (
                      datasets.map((dataset) => (
                        <Card
                          key={dataset.id}
                          className="cursor-pointer hover:shadow-md transition-shadow"
                          draggable
                          onDragStart={(e) => onDragStart(e, 'dataset', dataset)}
                          onClick={() => handleAddNode('dataset', dataset)}
                        >
                          <CardContent className="p-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium text-sm">{dataset.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {dataset.metadata.problem_type} • {(dataset.file_size / 1024).toFixed(1)} KB
                                </p>
                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                  {dataset.description}
                                </p>
                              </div>
                              <Plus className="h-4 w-4 text-muted-foreground" />
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </TabsContent>

                  <TabsContent value="problems" className="space-y-2 mt-0">
                    {problems.length === 0 ? (
                      <div className="text-center py-8">
                        <Brain className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">No problems found</p>
                        <p className="text-xs text-muted-foreground mt-1">Create problem repositories to get started</p>
                      </div>
                    ) : (
                      problems.map((problem) => (
                        <Card
                          key={problem.id}
                          className="cursor-pointer hover:shadow-md transition-shadow"
                          draggable
                          onDragStart={(e) => onDragStart(e, 'problem', problem)}
                          onClick={() => handleAddNode('problem', problem)}
                        >
                          <CardContent className="p-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium text-sm">{problem.name}</p>
                                <p className="text-xs text-muted-foreground">@{problem.username}</p>
                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{problem.description}</p>
                              </div>
                              <Plus className="h-4 w-4 text-muted-foreground" />
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </TabsContent>

                  <TabsContent value="optimizers" className="space-y-2 mt-0">
                    {optimizers.length === 0 ? (
                      <div className="text-center py-8">
                        <Zap className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">No optimizers found</p>
                        <p className="text-xs text-muted-foreground mt-1">Create optimizer repositories to get started</p>
                      </div>
                    ) : (
                      optimizers.map((optimizer) => (
                        <Card
                          key={optimizer.id}
                          className="cursor-pointer hover:shadow-md transition-shadow"
                          draggable
                          onDragStart={(e) => onDragStart(e, 'optimizer', optimizer)}
                          onClick={() => handleAddNode('optimizer', optimizer)}
                        >
                          <CardContent className="p-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium text-sm">{optimizer.name}</p>
                                <p className="text-xs text-muted-foreground">@{optimizer.username}</p>
                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{optimizer.description}</p>
                              </div>
                              <Plus className="h-4 w-4 text-muted-foreground" />
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </TabsContent>
                </Tabs>
              )}
            </div>
          </div>

          {/* Main Canvas Area */}
          <div className="flex-1 relative">
            <ReactFlowProvider>
              <WorkflowCanvas
                workflow={workflow}
                addNode={addNode}
                selectNode={selectNode}
                addConnection={addConnection}
                handleAddNode={handleAddNode}
              />
            </ReactFlowProvider>
          </div>

          {/* Integrated Workflow Sidebar */}
          <IntegratedWorkflowSidebar
            isOpen={showWorkflowSidebar}
            onClose={() => setShowWorkflowSidebar(false)}
            nodes={workflow.nodes}
            connections={workflow.connections}
            executionState={workflow.executionState}
            onExecute={handleExecuteWorkflow}
            onStop={handleStopExecution}
            onReset={handleResetExecution}
            onParameterChange={handleParameterChange}
            isExecuting={isExecuting}
          />
        </div>
      </div>
    </Layout>
  )
}

export default WorkflowAutomationPage

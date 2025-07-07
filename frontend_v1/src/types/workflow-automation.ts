/**
 * TypeScript interfaces for Workflow Automation feature
 */

// Base node types
export type NodeType = 'dataset' | 'problem' | 'optimizer'

// Node position interface
export interface NodePosition {
  x: number
  y: number
}

// Base node data interface
export interface NodeData {
  name: string
  username: string
  description: string
  parameters: Record<string, any>
  repository?: string
  version?: string
  tags?: string[]
  // Dataset-specific properties
  datasetId?: string
  original_filename?: string
  format_type?: string
  file_size?: number
  metadata?: any
}

// Workflow node interface
export interface WorkflowNode {
  id: string
  type: NodeType
  position: NodePosition
  data: NodeData
  selected?: boolean
  dragging?: boolean
}

// Connection handle types
export type HandleType = 'source' | 'target'
export type HandlePosition = 'top' | 'right' | 'bottom' | 'left'

// Connection interface
export interface WorkflowConnection {
  id: string
  source: string
  target: string
  sourceHandle?: string
  targetHandle?: string
  animated?: boolean
  style?: React.CSSProperties
  datasetParameter?: string // For dataset-to-problem connections, stores which parameter receives the dataset
}

// Execution state
export type ExecutionStatus = 'idle' | 'running' | 'paused' | 'completed' | 'error' | 'cancelled'

export interface ExecutionState {
  status: ExecutionStatus
  progress: number
  currentStep?: string
  startTime?: Date
  endTime?: Date
  logs: ExecutionLog[]
  metrics?: ExecutionMetrics
  error?: string
}

export interface ExecutionLog {
  id: string
  timestamp: Date
  level: 'info' | 'warning' | 'error' | 'debug'
  message: string
  source?: string
  nodeId?: string
  step?: string // Optional step identifier for organizing logs
}

export interface ExecutionMetrics {
  totalSteps: number
  completedSteps: number
  executionTime: number
  memoryUsage?: number
  cpuUsage?: number
}

// Workflow state interface
export interface WorkflowState {
  nodes: WorkflowNode[]
  connections: WorkflowConnection[]
  selectedNodeId: string | null
  executionState: ExecutionState
  isDirty: boolean
  lastSaved?: Date
}

// Workflow metadata
export interface WorkflowMetadata {
  id?: string
  name: string
  description?: string
  author: string
  version: string
  created: Date
  modified: Date
  tags: string[]
  isPublic: boolean
}

// Complete workflow interface
export interface Workflow {
  metadata: WorkflowMetadata
  state: WorkflowState
}

// API interfaces for user content
export interface Dataset {
  id: string
  name: string
  description: string
  format_type: string
  metadata?: {
    [key: string]: any
  }
  file_size: number
  original_filename: string
  is_public: boolean
  user_id: string
  created_at: string
  user?: {
    username: string
    avatar_url: string | null
    full_name: string | null
  }
}

export interface Problem {
  id: string
  name: string
  username: string
  description: string
  repository: string
  model_type: string
  tags: string[]
  metadata: {
    stars: number
    forks: number
    size: number
    problem_type?: string
    difficulty?: string
  }
  last_updated: string
}

export interface Optimizer {
  id: string
  name: string
  username: string
  description: string
  repository: string
  model_type: string
  tags: string[]
  metadata: {
    stars: number
    forks: number
    size: number
    optimizer_type?: string
    algorithm_family?: string
  }
  last_updated: string
}

// API response interfaces
export interface DatasetsResponse {
  success: boolean
  datasets: Dataset[]
  total: number
}

export interface ProblemsResponse {
  success: boolean
  problems: Problem[]
  total: number
}

export interface OptimizersResponse {
  success: boolean
  optimizers: Optimizer[]
  total: number
}

// Workflow execution interfaces
export interface WorkflowExecutionRequest {
  workflowId?: string
  nodes: WorkflowNode[]
  connections: WorkflowConnection[]
  parameters?: Record<string, any>
}

export interface WorkflowExecutionResponse {
  success: boolean
  executionId: string
  message?: string
  error?: string
}

export interface WorkflowExecutionResult {
  executionId: string
  status: ExecutionStatus
  progress: number
  logs: ExecutionLog[]
  metrics?: ExecutionMetrics
  results?: {
    nodeId: string
    output: any
    error?: string
  }[]
  error?: string
}

// Workflow persistence interfaces
export interface SaveWorkflowRequest {
  name: string
  description?: string
  nodes: WorkflowNode[]
  connections: WorkflowConnection[]
  tags?: string[]
  isPublic?: boolean
}

export interface SaveWorkflowResponse {
  success: boolean
  workflowId: string
  message?: string
  error?: string
}

export interface LoadWorkflowResponse {
  success: boolean
  workflow: Workflow
  error?: string
}

export interface WorkflowListResponse {
  success: boolean
  workflows: WorkflowMetadata[]
  total: number
  page: number
  limit: number
}

// Node validation interfaces
export interface NodeValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

export interface WorkflowValidationResult {
  isValid: boolean
  nodeValidations: Record<string, NodeValidationResult>
  connectionErrors: string[]
  globalErrors: string[]
}

// Canvas interfaces
export interface CanvasViewport {
  x: number
  y: number
  zoom: number
}

export interface CanvasState {
  viewport: CanvasViewport
  isDragging: boolean
  isSelecting: boolean
  selectionBox?: {
    startX: number
    startY: number
    endX: number
    endY: number
  }
}

// Parameter panel interfaces
export interface ParameterDefinition {
  name: string
  type: 'string' | 'number' | 'boolean' | 'select' | 'multiselect' | 'file' | 'textarea' | 'array'
  label: string
  description?: string
  defaultValue?: any
  required?: boolean
  readOnly?: boolean
  options?: { label: string; value: any }[]
  min?: number
  max?: number
  step?: number
  validation?: (value: any) => string | null
}

export interface ParameterGroup {
  name: string
  label: string
  description?: string
  parameters: ParameterDefinition[]
  collapsible?: boolean
  defaultExpanded?: boolean
}

export interface NodeParameterSchema {
  nodeType: NodeType
  groups: ParameterGroup[]
}

// Sidebar interfaces
export interface SidebarState {
  activeTab: 'datasets' | 'problems' | 'optimizers'
  searchQuery: string
  filters: {
    type?: string
    tags?: string[]
    difficulty?: string
  }
  isLoading: boolean
}

// Event interfaces
export interface NodeEvent {
  type: 'select' | 'deselect' | 'move' | 'delete' | 'duplicate'
  nodeId: string
  data?: any
}

export interface ConnectionEvent {
  type: 'create' | 'delete' | 'update'
  connectionId: string
  source?: string
  target?: string
  data?: any
}

export interface WorkflowEvent {
  type: 'save' | 'load' | 'execute' | 'stop' | 'reset' | 'export' | 'import'
  data?: any
}

// Hook interfaces
export interface UseWorkflowState {
  workflow: WorkflowState
  updateNodes: (nodes: WorkflowNode[]) => void
  updateNodeParameters: (nodeId: string, parameters: Record<string, any>) => void
  updateConnections: (connections: WorkflowConnection[]) => void
  selectNode: (nodeId: string | null) => void
  addNode: (node: Omit<WorkflowNode, 'id'> | WorkflowNode) => void
  removeNode: (nodeId: string) => void
  addConnection: (connection: Omit<WorkflowConnection, 'id'>) => void
  removeConnection: (connectionId: string) => void
  resetWorkflow: () => void
  setExecutionState: (state: Partial<ExecutionState>) => void
}

export interface UseWorkflowExecution {
  execute: (request: WorkflowExecutionRequest) => Promise<WorkflowExecutionResponse>
  stop: () => Promise<void>
  getStatus: (executionId: string) => Promise<WorkflowExecutionResult>
  isExecuting: boolean
  executionId: string | null
  executionResult: WorkflowExecutionResult | null
}

export interface UseWorkflowPersistence {
  save: (request: SaveWorkflowRequest) => Promise<SaveWorkflowResponse>
  load: (workflowId: string) => Promise<LoadWorkflowResponse>
  list: (page?: number, limit?: number) => Promise<WorkflowListResponse>
  delete: (workflowId: string) => Promise<{ success: boolean; error?: string }>
  isLoading: boolean
}

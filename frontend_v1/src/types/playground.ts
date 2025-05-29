/**
 * Shared types for the Qubots Playground
 */

export interface LogEntry {
  timestamp: number
  level: 'info' | 'warning' | 'error' | 'debug'
  message: string
  source?: string
}

export interface ExecutionMetrics {
  status: 'idle' | 'running' | 'paused' | 'completed' | 'error'
  progress?: number
  execution_time: number
  iterations?: number
  memory_usage?: number
}

export interface ExecutionLog {
  timestamp: string
  level: 'info' | 'warning' | 'error' | 'debug'
  message: string
  source?: string
}

export interface ExecutionState {
  isRunning: boolean
  isPaused: boolean
  canPause: boolean
  logs: ExecutionLog[]
  metrics: ExecutionMetrics
  startTime?: Date
}

export interface ModelInfo {
  name: string
  username: string
  description: string
  model_type: string
  repository_url: string
  last_updated: string
  tags: string[]
  metadata: {
    stars: number
    forks: number
    size: number
  }
}

export interface QubotResult {
  success: boolean
  problem_name: string
  optimizer_name: string
  problem_username: string
  optimizer_username: string
  execution_time: number
  timestamp: string
  best_solution?: number[]
  best_value?: number
  iterations?: number
  history?: Array<{
    iteration: number
    best_value: number
    [key: string]: any
  }>
  metadata?: {
    problem_class: string
    optimizer_class: string
    problem_metadata: Record<string, any>
    optimizer_metadata: Record<string, any>
    result_type: string
  }
  error_message?: string
  error_type?: string
  message?: string
}

/**
 * Optimization Workflow Types
 */
export interface OptimizationWorkflow {
  id: number
  title: string
  description?: string
  created_by: string
  problem_name: string
  problem_username: string
  optimizer_name: string
  optimizer_username: string
  problem_params: Record<string, any>
  optimizer_params: Record<string, any>
  tags: string[]
  is_public: boolean
  views_count: number
  forks_count: number
  likes_count: number
  uploaded_files: Record<string, any>
  execution_results?: QubotResult
  created_at: string
  updated_at: string
  last_executed?: string
  creator_username?: string
}

export interface WorkflowCreateRequest {
  title: string
  description?: string
  problem_name: string
  problem_username: string
  optimizer_name: string
  optimizer_username: string
  problem_params?: Record<string, any>
  optimizer_params?: Record<string, any>
  tags?: string[]
  is_public?: boolean
  uploaded_files?: Record<string, any>
}

export interface WorkflowsResponse {
  success: boolean
  workflows: OptimizationWorkflow[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

export interface WorkflowResponse {
  success: boolean
  workflow: OptimizationWorkflow
}

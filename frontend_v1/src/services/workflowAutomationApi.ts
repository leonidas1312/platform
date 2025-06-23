import { 
  Dataset, 
  Problem, 
  Optimizer, 
  DatasetsResponse, 
  ProblemsResponse, 
  OptimizersResponse,
  WorkflowExecutionRequest,
  WorkflowExecutionResponse,
  WorkflowExecutionResult,
  SaveWorkflowRequest,
  SaveWorkflowResponse,
  LoadWorkflowResponse,
  WorkflowListResponse
} from '@/types/workflow-automation'

const API_BASE_URL = import.meta.env.VITE_API_URL || (
  window.location.hostname === 'localhost'
    ? 'http://localhost:3001/api'
    : `${window.location.protocol}//${window.location.host}/api`
)

class WorkflowAutomationApi {
  private getHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
    }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}/workflow-automation${endpoint}`

    const response = await fetch(url, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }))
      throw new Error(errorData.message || `HTTP ${response.status}`)
    }

    return response.json()
  }

  // User content APIs
  async getUserDatasets(formatType?: string, limit?: number): Promise<DatasetsResponse> {
    const params = new URLSearchParams()
    if (formatType) params.append('format_type', formatType)
    if (limit) params.append('limit', limit.toString())
    
    const query = params.toString() ? `?${params.toString()}` : ''
    return this.request<DatasetsResponse>(`/user-datasets${query}`)
  }

  async getUserProblems(limit?: number): Promise<ProblemsResponse> {
    const params = new URLSearchParams()
    if (limit) params.append('limit', limit.toString())
    
    const query = params.toString() ? `?${params.toString()}` : ''
    return this.request<ProblemsResponse>(`/user-problems${query}`)
  }

  async getUserOptimizers(limit?: number): Promise<OptimizersResponse> {
    const params = new URLSearchParams()
    if (limit) params.append('limit', limit.toString())
    
    const query = params.toString() ? `?${params.toString()}` : ''
    return this.request<OptimizersResponse>(`/user-optimizers${query}`)
  }

  async getUserContent(): Promise<{
    success: boolean
    datasets: Dataset[]
    problems: Problem[]
    optimizers: Optimizer[]
    totals: {
      datasets: number
      problems: number
      optimizers: number
    }
  }> {
    // Use the new user-models endpoint that handles authentication properly
    const modelsResponse = await this.request<{
      success: boolean
      problems: Problem[]
      optimizers: Optimizer[]
      total: number
    }>('/user-models')

    // Get datasets from the original endpoint
    const datasets = await this.getUserDatasets()

    return {
      success: true,
      datasets: datasets.datasets || [],
      problems: modelsResponse.problems || [],
      optimizers: modelsResponse.optimizers || [],
      totals: {
        datasets: datasets.datasets?.length || 0,
        problems: modelsResponse.problems?.length || 0,
        optimizers: modelsResponse.optimizers?.length || 0
      }
    }
  }

  // Workflow execution APIs
  async executeWorkflow(request: WorkflowExecutionRequest): Promise<WorkflowExecutionResponse> {
    return this.request<WorkflowExecutionResponse>('/execute', {
      method: 'POST',
      body: JSON.stringify(request),
    })
  }

  // WebSocket connection for real-time execution logs
  connectToWorkflowExecution(executionId: string): WebSocket {
    const wsUrl = API_BASE_URL.replace('http', 'ws') + `/workflow-automation/stream/${executionId}`
    const ws = new WebSocket(wsUrl)

    ws.onopen = () => {
      console.log(`🔌 Connected to workflow execution stream: ${executionId}`)
    }

    ws.onerror = (error) => {
      console.error('WebSocket error:', error)
    }

    ws.onclose = (event) => {
      console.log(`🔌 Disconnected from workflow execution stream: ${executionId}`, event.reason)
    }

    return ws
  }

  async getExecutionStatus(executionId: string): Promise<WorkflowExecutionResult> {
    return this.request<WorkflowExecutionResult>(`/execution/${executionId}`)
  }

  async stopExecution(executionId: string): Promise<{ success: boolean; message?: string }> {
    return this.request<{ success: boolean; message?: string }>(`/execution/${executionId}/stop`, {
      method: 'POST',
    })
  }

  // Workflow persistence APIs
  async saveWorkflow(request: SaveWorkflowRequest): Promise<SaveWorkflowResponse> {
    return this.request<SaveWorkflowResponse>('/workflows', {
      method: 'POST',
      body: JSON.stringify(request),
    })
  }

  async loadWorkflow(workflowId: string): Promise<LoadWorkflowResponse> {
    return this.request<LoadWorkflowResponse>(`/workflows/${workflowId}`)
  }

  async listWorkflows(page = 1, limit = 20): Promise<WorkflowListResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    })
    
    return this.request<WorkflowListResponse>(`/workflows?${params.toString()}`)
  }

  async deleteWorkflow(workflowId: string): Promise<{ success: boolean; error?: string }> {
    return this.request<{ success: boolean; error?: string }>(`/workflows/${workflowId}`, {
      method: 'DELETE',
    })
  }

  async updateWorkflow(
    workflowId: string, 
    request: SaveWorkflowRequest
  ): Promise<SaveWorkflowResponse> {
    return this.request<SaveWorkflowResponse>(`/workflows/${workflowId}`, {
      method: 'PUT',
      body: JSON.stringify(request),
    })
  }

  // Workflow validation APIs
  async validateWorkflow(request: WorkflowExecutionRequest): Promise<{
    success: boolean
    isValid: boolean
    errors: string[]
    warnings: string[]
  }> {
    return this.request<{
      success: boolean
      isValid: boolean
      errors: string[]
      warnings: string[]
    }>('/validate', {
      method: 'POST',
      body: JSON.stringify(request),
    })
  }

  // Parameter schema APIs
  async getNodeParameterSchema(nodeType: string, nodeName: string, username: string): Promise<{
    success: boolean
    schema: any
  }> {
    const params = new URLSearchParams({
      nodeType,
      nodeName,
      username,
    })
    
    return this.request<{
      success: boolean
      schema: any
    }>(`/parameter-schema?${params.toString()}`)
  }

  // Export/Import APIs
  async exportWorkflow(workflowId: string, format: 'json' | 'yaml' = 'json'): Promise<Blob> {
    const url = `${API_BASE_URL}/workflow-automation/workflows/${workflowId}/export?format=${format}`
    
    const response = await fetch(url, {
      credentials: 'include',
    })

    if (!response.ok) {
      throw new Error(`Export failed: ${response.statusText}`)
    }

    return response.blob()
  }

  async importWorkflow(file: File): Promise<SaveWorkflowResponse> {
    const formData = new FormData()
    formData.append('workflow', file)

    const url = `${API_BASE_URL}/workflow-automation/workflows/import`
    
    const response = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }))
      throw new Error(errorData.message || `HTTP ${response.status}`)
    }

    return response.json()
  }

  // Template APIs
  async getWorkflowTemplates(): Promise<{
    success: boolean
    templates: Array<{
      id: string
      name: string
      description: string
      category: string
      nodes: any[]
      connections: any[]
      tags: string[]
    }>
  }> {
    return this.request<{
      success: boolean
      templates: Array<{
        id: string
        name: string
        description: string
        category: string
        nodes: any[]
        connections: any[]
        tags: string[]
      }>
    }>('/templates')
  }

  async createWorkflowFromTemplate(templateId: string, name: string): Promise<SaveWorkflowResponse> {
    return this.request<SaveWorkflowResponse>('/workflows/from-template', {
      method: 'POST',
      body: JSON.stringify({ templateId, name }),
    })
  }
}

// Export singleton instance
export const workflowAutomationApi = new WorkflowAutomationApi()
export default workflowAutomationApi

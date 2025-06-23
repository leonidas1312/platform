const API_BASE_URL = import.meta.env.VITE_API_URL || (
  window.location.hostname === 'localhost'
    ? 'http://localhost:3001/api'
    : `${window.location.protocol}//${window.location.host}/api`
)

export interface FileAnalysis {
  fileName: string
  fileType: string
  problemType: string
  confidence: number
  characteristics: string[]
  size: number
  contentPreview?: string
}

export interface Recommendation {
  id: string
  type: 'problem' | 'optimizer'
  name: string
  repository: string
  username: string
  description: string
  confidence: number
  tags: string[]
  compatibility: number
  matchFactors?: string[]
  performance?: {
    avgRuntime: number
    successRate: number
    bestValue?: number
  }
}

export interface ExperimentRecommendation {
  id: string
  type: 'experiment'
  experimentId: number
  title: string
  description: string
  creator: string
  problemName: string
  problemUsername: string
  optimizerName: string
  optimizerUsername: string
  problemParams: any
  optimizerParams: any
  tags: string[]
  confidence: number
  compatibility: number
  matchFactors: string[]
  performance: {
    avgRuntime: number | null
    successRate: number
    bestValue: number | null
  }
  createdAt: string
  viewsCount: number
  likesCount: number
}

export interface ExecutionResult {
  executionId: string
  status: 'queued' | 'running' | 'completed' | 'failed'
  message: string
  result?: any
}

export interface SupportedFileType {
  extension: string
  description: string
}

class AutoSolveApiService {
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('token')
    return {
      'Authorization': token ? `Bearer ${token}` : '',
    }
  }

  async analyzeFile(file: File): Promise<FileAnalysis> {
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch(`${API_BASE_URL}/autosolve/analyze`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: formData,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    if (!data.success) {
      throw new Error(data.message || 'Analysis failed')
    }

    return data.analysis
  }

  async getRecommendations(analysis: FileAnalysis): Promise<Recommendation[]> {
    const response = await fetch(`${API_BASE_URL}/autosolve/recommendations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
      },
      body: JSON.stringify({ analysis }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    if (!data.success) {
      throw new Error(data.message || 'Failed to get recommendations')
    }

    return data.recommendations
  }

  async getExperimentRecommendations(analysis: FileAnalysis): Promise<ExperimentRecommendation[]> {
    const response = await fetch(`${API_BASE_URL}/autosolve/recommendations/experiments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
      },
      body: JSON.stringify({ analysis }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    if (!data.success) {
      throw new Error(data.message || 'Failed to get experiment recommendations')
    }

    return data.experiments
  }

  async executeRecommendation(
    recommendationId: string,
    problemRepo: string,
    optimizerRepo: string,
    parameters?: any
  ): Promise<ExecutionResult> {
    const response = await fetch(`${API_BASE_URL}/autosolve/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
      },
      body: JSON.stringify({
        recommendationId,
        problemRepo,
        optimizerRepo,
        parameters,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    if (!data.success) {
      throw new Error(data.message || 'Execution failed')
    }

    return data.execution
  }

  async executeExperiment(
    experimentId: number,
    uploadedFile?: File
  ): Promise<ExecutionResult> {
    const response = await fetch(`${API_BASE_URL}/autosolve/execute/experiment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
      },
      body: JSON.stringify({
        experimentId,
        uploadedFile: uploadedFile ? uploadedFile.name : null,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    if (!data.success) {
      throw new Error(data.message || 'Experiment execution failed')
    }

    return data.execution
  }

  async getRepositoryDetails(username: string, repoName: string): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/autosolve/repository/${username}/${repoName}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    if (!data.success) {
      throw new Error(data.message || 'Failed to get repository details')
    }

    return data.repository
  }

  async getSupportedFileTypes(): Promise<SupportedFileType[]> {
    const response = await fetch(`${API_BASE_URL}/autosolve/supported-types`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    if (!data.success) {
      throw new Error(data.message || 'Failed to get supported file types')
    }

    return data.supportedTypes
  }
}

export const autosolveApi = new AutoSolveApiService()

/**
 * Integration Manager for Workflow Execution
 * 
 * Handles integration with authentication system, dataset management,
 * repository system, and Kubernetes deployment infrastructure.
 */

const axios = require('axios')

class IntegrationManager {
  constructor() {
    this.authEndpoint = process.env.RASTION_API_URL || 'https://hub.rastion.com/api/v1'
    this.giteaUrl = process.env.GITEA_URL || 'https://hub.rastion.com'
    this.maxRetries = 3
    this.retryDelay = 1000
    
    // Cache for validated tokens and user info
    this.tokenCache = new Map()
    this.userCache = new Map()
    
    console.log(`🔗 IntegrationManager initialized`)
    console.log(`🔗 Auth endpoint: ${this.authEndpoint}`)
    console.log(`🔗 Gitea URL: ${this.giteaUrl}`)
  }

  /**
   * Validate authentication token
   */
  async validateAuthToken(token) {
    if (!token) {
      throw new Error('Authentication token is required')
    }

    // Check cache first
    const cached = this.tokenCache.get(token)
    if (cached && (Date.now() - cached.timestamp) < 300000) { // 5 minutes cache
      return cached.user
    }

    try {
      const response = await this.makeAuthenticatedRequest('/user', token)
      const user = response.data

      // Cache the result
      this.tokenCache.set(token, {
        user,
        timestamp: Date.now()
      })

      console.log(`✅ Token validated for user: ${user.login}`)
      return user

    } catch (error) {
      console.error(`❌ Token validation failed: ${error.message}`)
      throw new Error(`Authentication failed: ${error.message}`)
    }
  }

  /**
   * Validate dataset access
   */
  async validateDatasetAccess(token, datasetId) {
    if (!datasetId) {
      return { hasAccess: true, message: 'No dataset specified' }
    }

    try {
      // Validate user first
      const user = await this.validateAuthToken(token)

      // For now, allow access to all datasets for authenticated users
      // TODO: Implement proper dataset access control when API is available
      console.log(`🔍 Dataset access check for ${datasetId} by user ${user.login}`)

      return {
        hasAccess: true,
        dataset: { id: datasetId, name: `Dataset ${datasetId}` },
        user,
        message: 'Access granted (temporary bypass for development)'
      }

      // Original implementation (commented out until API is ready):
      /*
      // Check dataset access via API
      const response = await this.makeAuthenticatedRequest(`/datasets/${datasetId}`, token)
      const dataset = response.data

      // Check if user has access to this dataset
      const hasAccess = dataset.user_id === user.id || dataset.public === true

      return {
        hasAccess,
        dataset,
        user,
        message: hasAccess ? 'Access granted' : 'Access denied'
      }
      */

    } catch (error) {
      console.error(`❌ Dataset access validation failed: ${error.message}`)

      // For development, allow access even if validation fails
      return {
        hasAccess: true,
        message: `Dataset access granted (validation bypassed due to: ${error.message})`
      }
    }
  }

  /**
   * Validate repository access
   */
  async validateRepositoryAccess(token, repoId) {
    if (!repoId) {
      throw new Error('Repository ID is required')
    }

    try {
      // Parse repository ID
      const [username, repoName] = repoId.split('/')
      if (!username || !repoName) {
        throw new Error(`Invalid repository format: ${repoId}`)
      }

      // Validate user first
      const user = await this.validateAuthToken(token)

      // Check repository access via Gitea API
      const giteaResponse = await this.makeGiteaRequest(`/repos/${username}/${repoName}`, token)
      const repository = giteaResponse.data

      // Check access permissions
      const hasAccess = repository.owner.login === user.login || 
                       repository.permissions?.read === true ||
                       !repository.private

      return {
        hasAccess,
        repository,
        user,
        message: hasAccess ? 'Repository access granted' : 'Repository access denied'
      }

    } catch (error) {
      console.error(`❌ Repository access validation failed: ${error.message}`)
      return {
        hasAccess: false,
        message: `Repository access validation failed: ${error.message}`
      }
    }
  }

  /**
   * Validate complete workflow access
   */
  async validateWorkflowAccess(token, workflowConfig) {
    const validationResults = {
      isValid: true,
      errors: [],
      warnings: [],
      user: null,
      datasetAccess: null,
      problemAccess: null,
      optimizerAccess: null
    }

    try {
      // Validate authentication
      validationResults.user = await this.validateAuthToken(token)

      // Validate dataset access if dataset is specified
      if (workflowConfig.dataset) {
        const datasetAccess = await this.validateDatasetAccess(token, workflowConfig.dataset.datasetId)
        validationResults.datasetAccess = datasetAccess
        
        if (!datasetAccess.hasAccess) {
          validationResults.errors.push(`Dataset access denied: ${datasetAccess.message}`)
          validationResults.isValid = false
        }
      }

      // Validate problem repository access
      if (workflowConfig.problem?.data?.repository) {
        const problemAccess = await this.validateRepositoryAccess(token, workflowConfig.problem.data.repository)
        validationResults.problemAccess = problemAccess
        
        if (!problemAccess.hasAccess) {
          validationResults.errors.push(`Problem repository access denied: ${problemAccess.message}`)
          validationResults.isValid = false
        }
      }

      // Validate optimizer repository access
      if (workflowConfig.optimizer?.data?.repository) {
        const optimizerAccess = await this.validateRepositoryAccess(token, workflowConfig.optimizer.data.repository)
        validationResults.optimizerAccess = optimizerAccess
        
        if (!optimizerAccess.hasAccess) {
          validationResults.errors.push(`Optimizer repository access denied: ${optimizerAccess.message}`)
          validationResults.isValid = false
        }
      }

    } catch (error) {
      validationResults.errors.push(`Workflow validation failed: ${error.message}`)
      validationResults.isValid = false
    }

    return validationResults
  }

  /**
   * Make authenticated request to Rastion API
   */
  async makeAuthenticatedRequest(endpoint, token, retryCount = 0) {
    try {
      const response = await axios.get(`${this.authEndpoint}${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000 // 10 seconds
      })

      return response

    } catch (error) {
      if (retryCount < this.maxRetries && this.isRetryableError(error)) {
        console.log(`🔄 Retrying API request (${retryCount + 1}/${this.maxRetries}): ${endpoint}`)
        await new Promise(resolve => setTimeout(resolve, this.retryDelay * (retryCount + 1)))
        return this.makeAuthenticatedRequest(endpoint, token, retryCount + 1)
      }

      throw error
    }
  }

  /**
   * Make request to Gitea API
   */
  async makeGiteaRequest(endpoint, token, retryCount = 0) {
    try {
      const response = await axios.get(`${this.giteaUrl}/api/v1${endpoint}`, {
        headers: {
          'Authorization': `token ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000 // 10 seconds
      })

      return response

    } catch (error) {
      if (retryCount < this.maxRetries && this.isRetryableError(error)) {
        console.log(`🔄 Retrying Gitea request (${retryCount + 1}/${this.maxRetries}): ${endpoint}`)
        await new Promise(resolve => setTimeout(resolve, this.retryDelay * (retryCount + 1)))
        return this.makeGiteaRequest(endpoint, token, retryCount + 1)
      }

      throw error
    }
  }

  /**
   * Check if error is retryable
   */
  isRetryableError(error) {
    if (!error.response) return true // Network errors are retryable
    
    const status = error.response.status
    return status >= 500 || status === 429 // Server errors and rate limiting
  }

  /**
   * Get user information with caching
   */
  async getUserInfo(token) {
    const cacheKey = `user_${token}`
    const cached = this.userCache.get(cacheKey)
    
    if (cached && (Date.now() - cached.timestamp) < 600000) { // 10 minutes cache
      return cached.user
    }

    try {
      const user = await this.validateAuthToken(token)
      
      this.userCache.set(cacheKey, {
        user,
        timestamp: Date.now()
      })

      return user

    } catch (error) {
      console.error(`❌ Failed to get user info: ${error.message}`)
      throw error
    }
  }

  /**
   * Check system health and connectivity
   */
  async checkSystemHealth() {
    const health = {
      rastion_api: false,
      gitea_api: false,
      timestamp: new Date().toISOString(),
      errors: []
    }

    // Check Rastion API
    try {
      await axios.get(`${this.authEndpoint}/health`, { timeout: 5000 })
      health.rastion_api = true
    } catch (error) {
      health.errors.push(`Rastion API health check failed: ${error.message}`)
    }

    // Check Gitea API
    try {
      await axios.get(`${this.giteaUrl}/api/v1/version`, { timeout: 5000 })
      health.gitea_api = true
    } catch (error) {
      health.errors.push(`Gitea API health check failed: ${error.message}`)
    }

    return health
  }

  /**
   * Clear caches
   */
  clearCaches() {
    this.tokenCache.clear()
    this.userCache.clear()
    console.log(`🧹 Integration caches cleared`)
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      tokenCache: {
        size: this.tokenCache.size,
        entries: Array.from(this.tokenCache.keys()).map(key => ({
          key: key.substring(0, 10) + '...',
          timestamp: this.tokenCache.get(key).timestamp
        }))
      },
      userCache: {
        size: this.userCache.size,
        entries: Array.from(this.userCache.keys()).map(key => ({
          key,
          timestamp: this.userCache.get(key).timestamp
        }))
      }
    }
  }
}

module.exports = IntegrationManager

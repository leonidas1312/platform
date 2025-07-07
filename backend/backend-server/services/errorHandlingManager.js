/**
 * Error Handling and Fallback Manager
 * 
 * Provides comprehensive error handling, recovery mechanisms,
 * and fallback strategies for workflow execution.
 */

class ErrorHandlingManager {
  constructor() {
    this.errorHistory = []
    this.maxErrorHistory = 1000
    this.retryStrategies = this.initializeRetryStrategies()
    this.fallbackMechanisms = this.initializeFallbackMechanisms()
    
    console.log(`🛡️ ErrorHandlingManager initialized`)
  }

  /**
   * Initialize retry strategies for different error types
   */
  initializeRetryStrategies() {
    return {
      network: {
        maxRetries: 3,
        baseDelay: 1000,
        backoffMultiplier: 2,
        maxDelay: 10000
      },
      kubernetes: {
        maxRetries: 2,
        baseDelay: 2000,
        backoffMultiplier: 1.5,
        maxDelay: 8000
      },
      authentication: {
        maxRetries: 1,
        baseDelay: 500,
        backoffMultiplier: 1,
        maxDelay: 500
      },
      resource: {
        maxRetries: 5,
        baseDelay: 5000,
        backoffMultiplier: 1.2,
        maxDelay: 30000
      }
    }
  }

  /**
   * Initialize fallback mechanisms
   */
  initializeFallbackMechanisms() {
    return {
      dataset_loading: {
        enabled: true,
        fallback: 'use_cached_dataset',
        timeout: 30000
      },
      repository_access: {
        enabled: true,
        fallback: 'use_local_copy',
        timeout: 20000
      },
      kubernetes_execution: {
        enabled: false, // No fallback for K8s execution
        fallback: null,
        timeout: 0
      }
    }
  }

  /**
   * Handle and categorize errors
   */
  async handleError(error, context = {}) {
    const errorInfo = this.categorizeError(error, context)
    
    // Log error
    this.logError(errorInfo)
    
    // Determine if retry is appropriate
    const retryDecision = this.shouldRetry(errorInfo)
    
    // Apply fallback if available
    const fallbackResult = await this.applyFallback(errorInfo)
    
    return {
      error: errorInfo,
      shouldRetry: retryDecision.shouldRetry,
      retryDelay: retryDecision.delay,
      fallbackApplied: fallbackResult.applied,
      fallbackResult: fallbackResult.result,
      recommendation: this.getErrorRecommendation(errorInfo)
    }
  }

  /**
   * Categorize error by type and severity
   */
  categorizeError(error, context) {
    const errorInfo = {
      message: error.message || 'Unknown error',
      stack: error.stack,
      type: 'unknown',
      severity: 'medium',
      category: 'general',
      retryable: false,
      context,
      timestamp: new Date().toISOString(),
      id: this.generateErrorId()
    }

    // Network errors
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND' || error.code === 'ETIMEDOUT') {
      errorInfo.type = 'network'
      errorInfo.category = 'connectivity'
      errorInfo.retryable = true
      errorInfo.severity = 'high'
    }
    
    // Kubernetes errors
    else if (error.response?.status === 409 || error.message.includes('already exists')) {
      errorInfo.type = 'kubernetes'
      errorInfo.category = 'resource_conflict'
      errorInfo.retryable = true
      errorInfo.severity = 'low'
    }
    else if (error.response?.status === 403) {
      errorInfo.type = 'kubernetes'
      errorInfo.category = 'permission'
      errorInfo.retryable = false
      errorInfo.severity = 'high'
    }
    else if (error.response?.status === 404 && context.operation === 'kubernetes') {
      errorInfo.type = 'kubernetes'
      errorInfo.category = 'resource_not_found'
      errorInfo.retryable = true
      errorInfo.severity = 'medium'
    }
    
    // Authentication errors
    else if (error.response?.status === 401 || error.message.includes('authentication')) {
      errorInfo.type = 'authentication'
      errorInfo.category = 'auth_failure'
      errorInfo.retryable = false
      errorInfo.severity = 'high'
    }
    
    // Resource errors
    else if (error.message.includes('insufficient') || error.message.includes('resource')) {
      errorInfo.type = 'resource'
      errorInfo.category = 'resource_exhaustion'
      errorInfo.retryable = true
      errorInfo.severity = 'high'
    }
    
    // Timeout errors
    else if (error.code === 'ETIMEDOUT' || error.message.includes('timeout')) {
      errorInfo.type = 'timeout'
      errorInfo.category = 'timeout'
      errorInfo.retryable = true
      errorInfo.severity = 'medium'
    }
    
    // Validation errors
    else if (error.message.includes('validation') || error.message.includes('invalid')) {
      errorInfo.type = 'validation'
      errorInfo.category = 'input_validation'
      errorInfo.retryable = false
      errorInfo.severity = 'medium'
    }

    return errorInfo
  }

  /**
   * Determine if error should be retried
   */
  shouldRetry(errorInfo) {
    if (!errorInfo.retryable) {
      return { shouldRetry: false, delay: 0 }
    }

    const strategy = this.retryStrategies[errorInfo.type] || this.retryStrategies.network
    const currentRetries = errorInfo.context.retryCount || 0

    if (currentRetries >= strategy.maxRetries) {
      return { shouldRetry: false, delay: 0 }
    }

    const delay = Math.min(
      strategy.baseDelay * Math.pow(strategy.backoffMultiplier, currentRetries),
      strategy.maxDelay
    )

    return { shouldRetry: true, delay }
  }

  /**
   * Apply fallback mechanisms
   */
  async applyFallback(errorInfo) {
    const operation = errorInfo.context.operation
    const fallback = this.fallbackMechanisms[operation]

    if (!fallback || !fallback.enabled) {
      return { applied: false, result: null }
    }

    try {
      console.log(`🔄 Applying fallback for ${operation}: ${fallback.fallback}`)
      
      switch (fallback.fallback) {
        case 'use_cached_dataset':
          return await this.useCachedDataset(errorInfo.context)
        
        case 'use_local_copy':
          return await this.useLocalRepository(errorInfo.context)
        
        default:
          return { applied: false, result: null }
      }
    } catch (fallbackError) {
      console.error(`❌ Fallback failed for ${operation}:`, fallbackError.message)
      return { applied: false, result: null, error: fallbackError.message }
    }
  }

  /**
   * Use cached dataset as fallback
   */
  async useCachedDataset(context) {
    // This would implement dataset caching logic
    console.log(`📦 Attempting to use cached dataset for ${context.datasetId}`)
    
    // Placeholder implementation
    return {
      applied: true,
      result: {
        source: 'cache',
        datasetId: context.datasetId,
        message: 'Using cached dataset as fallback'
      }
    }
  }

  /**
   * Use local repository copy as fallback
   */
  async useLocalRepository(context) {
    // This would implement local repository fallback logic
    console.log(`📁 Attempting to use local repository copy for ${context.repository}`)
    
    // Placeholder implementation
    return {
      applied: true,
      result: {
        source: 'local',
        repository: context.repository,
        message: 'Using local repository copy as fallback'
      }
    }
  }

  /**
   * Get error recommendation
   */
  getErrorRecommendation(errorInfo) {
    switch (errorInfo.category) {
      case 'connectivity':
        return 'Check network connectivity and service availability'
      
      case 'permission':
        return 'Verify authentication credentials and access permissions'
      
      case 'resource_exhaustion':
        return 'Wait for resources to become available or reduce resource requirements'
      
      case 'resource_conflict':
        return 'Resource already exists, consider using a different name or cleaning up existing resources'
      
      case 'timeout':
        return 'Operation timed out, consider increasing timeout or checking system load'
      
      case 'input_validation':
        return 'Check input parameters and workflow configuration'
      
      case 'auth_failure':
        return 'Verify authentication token and user permissions'
      
      default:
        return 'Review error details and check system logs for more information'
    }
  }

  /**
   * Log error to history
   */
  logError(errorInfo) {
    this.errorHistory.push(errorInfo)
    
    // Maintain history limit
    if (this.errorHistory.length > this.maxErrorHistory) {
      this.errorHistory.shift()
    }

    // Log to console with appropriate level
    const logLevel = errorInfo.severity === 'high' ? 'error' : 
                    errorInfo.severity === 'medium' ? 'warn' : 'info'
    
    console[logLevel](`🛡️ [${errorInfo.type}] ${errorInfo.message}`, {
      id: errorInfo.id,
      category: errorInfo.category,
      retryable: errorInfo.retryable,
      context: errorInfo.context
    })
  }

  /**
   * Generate unique error ID
   */
  generateErrorId() {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Get error statistics
   */
  getErrorStatistics(timeWindow = 3600000) { // 1 hour default
    const now = Date.now()
    const cutoff = now - timeWindow
    
    const recentErrors = this.errorHistory.filter(error => 
      new Date(error.timestamp).getTime() > cutoff
    )

    const stats = {
      total: recentErrors.length,
      byType: {},
      byCategory: {},
      bySeverity: {},
      retryableCount: 0,
      timeWindow: timeWindow / 1000 / 60 // minutes
    }

    for (const error of recentErrors) {
      // Count by type
      stats.byType[error.type] = (stats.byType[error.type] || 0) + 1
      
      // Count by category
      stats.byCategory[error.category] = (stats.byCategory[error.category] || 0) + 1
      
      // Count by severity
      stats.bySeverity[error.severity] = (stats.bySeverity[error.severity] || 0) + 1
      
      // Count retryable errors
      if (error.retryable) {
        stats.retryableCount++
      }
    }

    return stats
  }

  /**
   * Get recent errors
   */
  getRecentErrors(limit = 50) {
    return this.errorHistory.slice(-limit)
  }

  /**
   * Clear error history
   */
  clearErrorHistory() {
    this.errorHistory = []
    console.log(`🧹 Error history cleared`)
  }
}

module.exports = ErrorHandlingManager

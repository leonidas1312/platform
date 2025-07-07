/**
 * Performance Optimization Manager
 * 
 * Provides caching mechanisms, resource pooling, and execution queue management
 * to handle multiple concurrent workflows efficiently within infrastructure constraints.
 */

class PerformanceOptimizationManager {
  constructor() {
    // Execution queue management
    this.executionQueue = []
    this.maxConcurrentExecutions = 3 // Based on 2 vCPU, 4GB memory constraints
    this.currentExecutions = new Set()
    
    // Caching mechanisms
    this.scriptCache = new Map() // Cache generated scripts
    this.configCache = new Map() // Cache parsed configurations
    this.resultCache = new Map() // Cache execution results
    
    // Cache settings
    this.maxCacheSize = 100
    this.cacheExpiryTime = 30 * 60 * 1000 // 30 minutes
    
    // Resource pooling
    this.resourcePool = {
      small: { available: 2, total: 2 },
      medium: { available: 1, total: 1 },
      large: { available: 0, total: 0 } // No large resources on current infrastructure
    }
    
    // Performance metrics
    this.metrics = {
      totalExecutions: 0,
      queuedExecutions: 0,
      cacheHits: 0,
      cacheMisses: 0,
      averageExecutionTime: 0,
      resourceUtilization: 0
    }
    
    console.log(`⚡ PerformanceOptimizationManager initialized`)
    console.log(`⚡ Max concurrent executions: ${this.maxConcurrentExecutions}`)
    
    // Start periodic optimization tasks
    this.startPeriodicOptimization()
  }

  /**
   * Queue execution request
   */
  async queueExecution(executionRequest) {
    const queueEntry = {
      ...executionRequest,
      queuedAt: new Date(),
      priority: this.calculatePriority(executionRequest),
      estimatedDuration: this.estimateExecutionDuration(executionRequest)
    }

    // Add to queue in priority order
    this.insertInPriorityOrder(queueEntry)
    this.metrics.queuedExecutions++

    console.log(`📋 Execution queued: ${executionRequest.executionId} (queue size: ${this.executionQueue.length})`)

    // Try to process queue immediately
    this.processQueue()

    return {
      queued: true,
      position: this.getQueuePosition(executionRequest.executionId),
      estimatedWaitTime: this.estimateWaitTime(executionRequest.executionId)
    }
  }

  /**
   * Process execution queue
   */
  async processQueue() {
    while (this.executionQueue.length > 0 && this.currentExecutions.size < this.maxConcurrentExecutions) {
      const nextExecution = this.executionQueue.shift()
      
      // Check if resources are available
      const resourceProfile = nextExecution.resourceProfile || 'small'
      if (!this.allocateResourceFromPool(resourceProfile)) {
        // Put back at front of queue
        this.executionQueue.unshift(nextExecution)
        break
      }

      // Start execution
      this.currentExecutions.add(nextExecution.executionId)
      this.executeWorkflowOptimized(nextExecution)
        .finally(() => {
          this.currentExecutions.delete(nextExecution.executionId)
          this.releaseResourceToPool(resourceProfile)
          this.processQueue() // Process next in queue
        })
    }
  }

  /**
   * Execute workflow with optimizations
   */
  async executeWorkflowOptimized(executionRequest) {
    const startTime = Date.now()
    
    try {
      console.log(`⚡ Starting optimized execution: ${executionRequest.executionId}`)
      
      // Check for cached script
      const scriptCacheKey = this.generateScriptCacheKey(executionRequest)
      let script = this.getFromCache(this.scriptCache, scriptCacheKey)
      
      if (script) {
        this.metrics.cacheHits++
        console.log(`⚡ Script cache hit for: ${executionRequest.executionId}`)
      } else {
        this.metrics.cacheMisses++
        // Generate script and cache it
        script = await this.generateAndCacheScript(executionRequest, scriptCacheKey)
      }

      // Check for cached configuration
      const configCacheKey = this.generateConfigCacheKey(executionRequest)
      let config = this.getFromCache(this.configCache, configCacheKey)
      
      if (!config) {
        config = await this.parseAndCacheConfig(executionRequest, configCacheKey)
      }

      // Execute with optimizations
      const result = await this.executeWithOptimizations(executionRequest, script, config)
      
      // Cache result if successful
      if (result.success) {
        const resultCacheKey = this.generateResultCacheKey(executionRequest)
        this.addToCache(this.resultCache, resultCacheKey, result)
      }

      // Update metrics
      const executionTime = Date.now() - startTime
      this.updateExecutionMetrics(executionTime)
      
      console.log(`⚡ Optimized execution completed: ${executionRequest.executionId} (${executionTime}ms)`)
      
      return result

    } catch (error) {
      console.error(`⚡ Optimized execution failed: ${executionRequest.executionId}`, error)
      throw error
    }
  }

  /**
   * Calculate execution priority
   */
  calculatePriority(executionRequest) {
    let priority = 5 // Default priority
    
    // Higher priority for smaller resource profiles
    if (executionRequest.resourceProfile === 'small') priority += 2
    else if (executionRequest.resourceProfile === 'medium') priority += 1
    
    // Higher priority for authenticated users
    if (executionRequest.authToken) priority += 1
    
    // Lower priority for complex workflows
    const nodeCount = executionRequest.nodes?.length || 0
    if (nodeCount > 5) priority -= 1
    
    return Math.max(1, Math.min(10, priority))
  }

  /**
   * Estimate execution duration
   */
  estimateExecutionDuration(executionRequest) {
    let baseDuration = 60000 // 1 minute base
    
    // Adjust based on resource profile
    const profileMultipliers = { small: 1, medium: 1.5, large: 2 }
    const multiplier = profileMultipliers[executionRequest.resourceProfile] || 1
    
    // Adjust based on workflow complexity
    const nodeCount = executionRequest.nodes?.length || 0
    const complexityMultiplier = 1 + (nodeCount * 0.1)
    
    return baseDuration * multiplier * complexityMultiplier
  }

  /**
   * Insert execution in priority order
   */
  insertInPriorityOrder(queueEntry) {
    let insertIndex = this.executionQueue.length
    
    for (let i = 0; i < this.executionQueue.length; i++) {
      if (queueEntry.priority > this.executionQueue[i].priority) {
        insertIndex = i
        break
      }
    }
    
    this.executionQueue.splice(insertIndex, 0, queueEntry)
  }

  /**
   * Allocate resource from pool
   */
  allocateResourceFromPool(profile) {
    const pool = this.resourcePool[profile]
    if (pool && pool.available > 0) {
      pool.available--
      return true
    }
    return false
  }

  /**
   * Release resource back to pool
   */
  releaseResourceToPool(profile) {
    const pool = this.resourcePool[profile]
    if (pool && pool.available < pool.total) {
      pool.available++
    }
  }

  /**
   * Generate cache keys
   */
  generateScriptCacheKey(executionRequest) {
    const { nodes, connections, parameters } = executionRequest
    const keyData = JSON.stringify({ nodes, connections, parameters })
    return this.hashString(keyData)
  }

  generateConfigCacheKey(executionRequest) {
    const { nodes, connections } = executionRequest
    const keyData = JSON.stringify({ nodes, connections })
    return this.hashString(keyData)
  }

  generateResultCacheKey(executionRequest) {
    return this.generateScriptCacheKey(executionRequest)
  }

  /**
   * Hash string for cache keys
   */
  hashString(str) {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return hash.toString()
  }

  /**
   * Cache management methods
   */
  addToCache(cache, key, value) {
    // Remove oldest entries if cache is full
    if (cache.size >= this.maxCacheSize) {
      const oldestKey = cache.keys().next().value
      cache.delete(oldestKey)
    }
    
    cache.set(key, {
      value,
      timestamp: Date.now()
    })
  }

  getFromCache(cache, key) {
    const entry = cache.get(key)
    if (!entry) return null
    
    // Check if expired
    if (Date.now() - entry.timestamp > this.cacheExpiryTime) {
      cache.delete(key)
      return null
    }
    
    return entry.value
  }

  /**
   * Get queue position
   */
  getQueuePosition(executionId) {
    return this.executionQueue.findIndex(entry => entry.executionId === executionId) + 1
  }

  /**
   * Estimate wait time
   */
  estimateWaitTime(executionId) {
    const position = this.getQueuePosition(executionId)
    if (position === 0) return 0
    
    const averageDuration = this.metrics.averageExecutionTime || 60000
    const concurrentSlots = this.maxConcurrentExecutions
    
    return Math.ceil((position - 1) / concurrentSlots) * averageDuration
  }

  /**
   * Update execution metrics
   */
  updateExecutionMetrics(executionTime) {
    this.metrics.totalExecutions++
    
    // Update average execution time
    const currentAvg = this.metrics.averageExecutionTime
    this.metrics.averageExecutionTime = currentAvg === 0 ? 
      executionTime : 
      (currentAvg * 0.9) + (executionTime * 0.1) // Weighted average
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics() {
    return {
      ...this.metrics,
      queueLength: this.executionQueue.length,
      currentExecutions: this.currentExecutions.size,
      resourcePool: this.resourcePool,
      cacheStats: {
        scriptCache: this.scriptCache.size,
        configCache: this.configCache.size,
        resultCache: this.resultCache.size
      },
      cacheHitRate: this.metrics.cacheHits / (this.metrics.cacheHits + this.metrics.cacheMisses) || 0
    }
  }

  /**
   * Start periodic optimization tasks
   */
  startPeriodicOptimization() {
    // Clean up expired cache entries every 5 minutes
    setInterval(() => {
      this.cleanupExpiredCacheEntries()
    }, 5 * 60 * 1000)
    
    // Update resource utilization metrics every minute
    setInterval(() => {
      this.updateResourceUtilizationMetrics()
    }, 60 * 1000)
  }

  /**
   * Clean up expired cache entries
   */
  cleanupExpiredCacheEntries() {
    const now = Date.now()
    const caches = [this.scriptCache, this.configCache, this.resultCache]
    
    let totalCleaned = 0
    
    for (const cache of caches) {
      for (const [key, entry] of cache.entries()) {
        if (now - entry.timestamp > this.cacheExpiryTime) {
          cache.delete(key)
          totalCleaned++
        }
      }
    }
    
    if (totalCleaned > 0) {
      console.log(`⚡ Cleaned up ${totalCleaned} expired cache entries`)
    }
  }

  /**
   * Update resource utilization metrics
   */
  updateResourceUtilizationMetrics() {
    const totalResources = Object.values(this.resourcePool).reduce((sum, pool) => sum + pool.total, 0)
    const usedResources = Object.values(this.resourcePool).reduce((sum, pool) => sum + (pool.total - pool.available), 0)
    
    this.metrics.resourceUtilization = totalResources > 0 ? (usedResources / totalResources) * 100 : 0
  }

  /**
   * Generate and cache script
   */
  async generateAndCacheScript(executionRequest, cacheKey) {
    // This would integrate with the actual code generator
    console.log(`⚡ Generating script for: ${executionRequest.executionId}`)

    // Placeholder - would call actual code generator
    const script = `# Generated script for ${executionRequest.executionId}`

    this.addToCache(this.scriptCache, cacheKey, script)
    return script
  }

  /**
   * Parse and cache configuration
   */
  async parseAndCacheConfig(executionRequest, cacheKey) {
    // This would integrate with the actual config parser
    console.log(`⚡ Parsing config for: ${executionRequest.executionId}`)

    // Placeholder - would call actual config parser
    const config = { parsed: true, executionId: executionRequest.executionId }

    this.addToCache(this.configCache, cacheKey, config)
    return config
  }

  /**
   * Execute with optimizations
   */
  async executeWithOptimizations(executionRequest, script, config) {
    // This would integrate with the actual execution logic
    console.log(`⚡ Executing with optimizations: ${executionRequest.executionId}`)

    // Placeholder - would call actual execution logic
    return {
      success: true,
      executionId: executionRequest.executionId,
      result: { optimized: true },
      timestamp: new Date().toISOString()
    }
  }

  /**
   * Clear all caches
   */
  clearCaches() {
    this.scriptCache.clear()
    this.configCache.clear()
    this.resultCache.clear()
    console.log(`⚡ All caches cleared`)
  }

  /**
   * Get queue status
   */
  getQueueStatus() {
    return {
      queueLength: this.executionQueue.length,
      currentExecutions: this.currentExecutions.size,
      maxConcurrentExecutions: this.maxConcurrentExecutions,
      nextExecution: this.executionQueue.length > 0 ? {
        executionId: this.executionQueue[0].executionId,
        priority: this.executionQueue[0].priority,
        queuedAt: this.executionQueue[0].queuedAt
      } : null
    }
  }
}

module.exports = PerformanceOptimizationManager

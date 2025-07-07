/**
 * Enhanced Logging Manager for Workflow Execution
 * 
 * Provides structured logging, step-by-step monitoring, and improved log parsing
 * for the 5-step execution process following the Qubots modular architecture.
 */

class EnhancedLoggingManager {
  constructor() {
    this.executionLogs = new Map() // executionId -> logs array
    this.stepProgress = new Map() // executionId -> step progress
    this.logParsers = this.initializeLogParsers()
    
    // Define the 5-step execution process
    this.executionSteps = [
      { id: 'dataset', name: 'Load Dataset', icon: '📊' },
      { id: 'problem', name: 'Load Problem', icon: '🧩' },
      { id: 'optimizer', name: 'Load Optimizer', icon: '⚙️' },
      { id: 'execution', name: 'Execute Optimization', icon: '🚀' },
      { id: 'results', name: 'Process Results', icon: '📈' }
    ]
    
    console.log(`📝 EnhancedLoggingManager initialized`)
  }

  /**
   * Initialize log parsers for different log types
   */
  initializeLogParsers() {
    return {
      stepLog: /^STEP_LOG:\s*(.+)$/,
      stepProgress: /^STEP_PROGRESS:\s*(.+)$/,
      workflowResult: /^WORKFLOW_RESULT_START$([\s\S]*?)^WORKFLOW_RESULT_END$/m,
      pythonError: /^Traceback \(most recent call last\):/,
      qubotImport: /qubots framework imported successfully/,
      datasetLoaded: /Dataset loaded successfully/,
      problemLoaded: /Problem loaded successfully/,
      optimizerLoaded: /Optimizer loaded successfully/,
      optimizationComplete: /Optimization completed successfully/
    }
  }

  /**
   * Initialize logging for a new execution
   */
  initializeExecution(executionId) {
    this.executionLogs.set(executionId, [])
    this.stepProgress.set(executionId, {
      currentStep: 'dataset',
      steps: this.executionSteps.reduce((acc, step) => {
        acc[step.id] = {
          status: 'pending',
          progress: 0,
          logs: [],
          startTime: null,
          endTime: null,
          errors: []
        }
        return acc
      }, {})
    })
    
    console.log(`📝 Initialized logging for execution: ${executionId}`)
  }

  /**
   * Process raw log output and categorize by steps
   */
  processLogOutput(executionId, rawLogs) {
    if (!this.executionLogs.has(executionId)) {
      this.initializeExecution(executionId)
    }

    const lines = rawLogs.split('\n')
    const processedLogs = []
    const stepProgress = this.stepProgress.get(executionId)

    for (const line of lines) {
      if (!line.trim()) continue

      const logEntry = this.parseLogLine(line, executionId)
      if (logEntry) {
        processedLogs.push(logEntry)
        
        // Update step progress based on log content
        this.updateStepProgress(executionId, logEntry)
      }
    }

    // Add to execution logs
    const existingLogs = this.executionLogs.get(executionId)
    this.executionLogs.set(executionId, [...existingLogs, ...processedLogs])

    return {
      logs: processedLogs,
      stepProgress: stepProgress,
      summary: this.getExecutionSummary(executionId)
    }
  }

  /**
   * Parse individual log line
   */
  parseLogLine(line, executionId) {
    const timestamp = new Date().toISOString()
    
    // Check for structured log entries
    if (this.logParsers.stepLog.test(line)) {
      const match = line.match(this.logParsers.stepLog)
      try {
        const logData = JSON.parse(match[1])
        return {
          timestamp: logData.timestamp || timestamp,
          level: logData.level || 'info',
          message: logData.message,
          step: logData.step || this.determineStepFromContent(logData.message),
          source: 'step',
          executionId
        }
      } catch (e) {
        // Fallback to plain text
        return {
          timestamp,
          level: 'info',
          message: match[1],
          step: this.determineStepFromContent(match[1]),
          source: 'step',
          executionId
        }
      }
    }

    // Check for progress entries
    if (this.logParsers.stepProgress.test(line)) {
      const match = line.match(this.logParsers.stepProgress)
      try {
        const progressData = JSON.parse(match[1])
        return {
          timestamp: progressData.timestamp || timestamp,
          level: 'info',
          message: progressData.message || `Progress: ${progressData.progress}%`,
          step: progressData.step,
          progress: progressData.progress,
          source: 'progress',
          executionId
        }
      } catch (e) {
        return null
      }
    }

    // Check for Python errors
    if (this.logParsers.pythonError.test(line)) {
      return {
        timestamp,
        level: 'error',
        message: line,
        step: 'system',
        source: 'python',
        executionId
      }
    }

    // Regular log line
    return {
      timestamp,
      level: this.determineLevelFromContent(line),
      message: line,
      step: this.determineStepFromContent(line),
      source: 'system',
      executionId
    }
  }

  /**
   * Determine step from log content
   */
  determineStepFromContent(content) {
    const lowerContent = content.toLowerCase()
    
    if (lowerContent.includes('dataset') || lowerContent.includes('loading dataset')) {
      return 'dataset'
    } else if (lowerContent.includes('problem') || lowerContent.includes('loading problem')) {
      return 'problem'
    } else if (lowerContent.includes('optimizer') || lowerContent.includes('loading optimizer')) {
      return 'optimizer'
    } else if (lowerContent.includes('optimization') || lowerContent.includes('execute') || lowerContent.includes('running')) {
      return 'execution'
    } else if (lowerContent.includes('result') || lowerContent.includes('completed')) {
      return 'results'
    }
    
    return 'system'
  }

  /**
   * Determine log level from content
   */
  determineLevelFromContent(content) {
    const lowerContent = content.toLowerCase()
    
    if (lowerContent.includes('error') || lowerContent.includes('failed') || lowerContent.includes('exception')) {
      return 'error'
    } else if (lowerContent.includes('warning') || lowerContent.includes('warn')) {
      return 'warning'
    } else if (lowerContent.includes('success') || lowerContent.includes('completed')) {
      return 'success'
    }
    
    return 'info'
  }

  /**
   * Update step progress based on log entry
   */
  updateStepProgress(executionId, logEntry) {
    const stepProgress = this.stepProgress.get(executionId)
    if (!stepProgress) return

    const stepId = logEntry.step
    if (!stepProgress.steps[stepId]) return

    const step = stepProgress.steps[stepId]

    // Update step status based on log content
    if (logEntry.level === 'error') {
      step.status = 'error'
      step.errors.push(logEntry.message)
    } else if (logEntry.progress !== undefined) {
      step.progress = logEntry.progress
      if (logEntry.progress >= 100) {
        step.status = 'completed'
        step.endTime = new Date()
      } else if (step.status === 'pending') {
        step.status = 'running'
        step.startTime = new Date()
      }
    } else if (logEntry.message.includes('completed') || logEntry.message.includes('success')) {
      step.status = 'completed'
      step.progress = 100
      step.endTime = new Date()
    } else if (step.status === 'pending' && logEntry.level !== 'error') {
      step.status = 'running'
      step.startTime = new Date()
    }

    // Add log to step
    step.logs.push(logEntry)

    // Update current step
    if (step.status === 'running' && stepProgress.currentStep !== stepId) {
      stepProgress.currentStep = stepId
    }
  }

  /**
   * Get execution summary
   */
  getExecutionSummary(executionId) {
    const stepProgress = this.stepProgress.get(executionId)
    if (!stepProgress) return null

    const steps = stepProgress.steps
    const completedSteps = Object.values(steps).filter(s => s.status === 'completed').length
    const errorSteps = Object.values(steps).filter(s => s.status === 'error').length
    const runningSteps = Object.values(steps).filter(s => s.status === 'running').length

    return {
      totalSteps: this.executionSteps.length,
      completedSteps,
      errorSteps,
      runningSteps,
      currentStep: stepProgress.currentStep,
      overallProgress: (completedSteps / this.executionSteps.length) * 100,
      status: errorSteps > 0 ? 'error' : 
              completedSteps === this.executionSteps.length ? 'completed' : 
              runningSteps > 0 ? 'running' : 'pending'
    }
  }

  /**
   * Get logs for a specific execution
   */
  getExecutionLogs(executionId) {
    return this.executionLogs.get(executionId) || []
  }

  /**
   * Get step progress for a specific execution
   */
  getStepProgress(executionId) {
    return this.stepProgress.get(executionId)
  }

  /**
   * Clean up logs for completed executions
   */
  cleanupExecutionLogs(executionId) {
    this.executionLogs.delete(executionId)
    this.stepProgress.delete(executionId)
    console.log(`📝 Cleaned up logs for execution: ${executionId}`)
  }

  /**
   * Extract workflow result from logs
   */
  extractWorkflowResult(rawLogs) {
    const match = rawLogs.match(this.logParsers.workflowResult)
    if (match) {
      try {
        return JSON.parse(match[1].trim())
      } catch (e) {
        console.error('Failed to parse workflow result:', e)
        return null
      }
    }
    return null
  }

  /**
   * Format logs for WebSocket transmission
   */
  formatLogsForWebSocket(executionId) {
    const logs = this.getExecutionLogs(executionId)
    const stepProgress = this.getStepProgress(executionId)
    const summary = this.getExecutionSummary(executionId)

    return {
      executionId,
      logs: logs.slice(-100), // Last 100 logs
      stepProgress,
      summary,
      timestamp: new Date().toISOString()
    }
  }
}

module.exports = EnhancedLoggingManager

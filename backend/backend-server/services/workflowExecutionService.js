const QubotStreamingExecutionService = require('./qubotStreamingExecutionService')
const WebSocket = require('ws')

class WorkflowExecutionService {
  constructor() {
    this.qubotService = new QubotStreamingExecutionService()
    this.activeExecutions = new Map()
    this.executionResults = new Map()
  }

  /**
   * Execute a workflow with real-time log streaming
   * @param {string} executionId - Unique execution identifier
   * @param {Array} nodes - Workflow nodes
   * @param {Array} connections - Node connections
   * @param {Object} parameters - Additional parameters
   * @param {WebSocket} ws - WebSocket connection for streaming
   * @param {string} authToken - Authentication token for platform access
   * @returns {Promise<Object>} Execution result
   */
  async executeWorkflow(executionId, nodes, connections, parameters, ws, authToken = null) {
    console.log(`🚀 Starting workflow execution: ${executionId}`)
    console.log(`📊 Nodes: ${nodes.length}, Connections: ${connections.length}`)

    // Store execution info
    this.activeExecutions.set(executionId, {
      nodes,
      connections,
      parameters,
      ws,
      authToken,
      startTime: Date.now(),
      status: 'running'
    })

    try {
      // Send initial log
      this.sendLog(ws, 'info', 'Starting workflow execution...', 'system')

      // Validate workflow structure
      const validation = this.validateWorkflow(nodes, connections)
      if (!validation.isValid) {
        throw new Error(`Invalid workflow: ${validation.errors.join(', ')}`)
      }

      // Build execution graph
      const executionGraph = this.buildExecutionGraph(nodes, connections)
      this.sendLog(ws, 'info', `Built execution graph with ${executionGraph.length} steps`, 'system')

      // Execute workflow steps in order
      const results = await this.executeWorkflowSteps(executionId, executionGraph, ws, authToken)

      // Store final results
      this.executionResults.set(executionId, {
        success: true,
        results,
        executionTime: Date.now() - this.activeExecutions.get(executionId).startTime,
        completedAt: new Date().toISOString()
      })

      this.sendLog(ws, 'info', 'Workflow execution completed successfully!', 'system')

      return {
        success: true,
        executionId,
        results
      }

    } catch (error) {
      console.error(`❌ Workflow execution error: ${error.message}`)
      this.sendLog(ws, 'error', `Workflow execution failed: ${error.message}`, 'system')

      // Store error result
      this.executionResults.set(executionId, {
        success: false,
        error: error.message,
        executionTime: Date.now() - this.activeExecutions.get(executionId).startTime,
        completedAt: new Date().toISOString()
      })

      throw error
    } finally {
      // Update execution status
      if (this.activeExecutions.has(executionId)) {
        this.activeExecutions.get(executionId).status = 'completed'
      }
    }
  }

  /**
   * Validate workflow structure
   */
  validateWorkflow(nodes, connections) {
    const errors = []

    // Check for required node types
    const hasDataset = nodes.some(node => node.type === 'dataset')
    const hasProblem = nodes.some(node => node.type === 'problem')
    const hasOptimizer = nodes.some(node => node.type === 'optimizer')

    if (!hasProblem) {
      errors.push('Workflow must contain at least one problem node')
    }

    if (!hasOptimizer) {
      errors.push('Workflow must contain at least one optimizer node')
    }

    // Check for valid connections
    for (const connection of connections) {
      const sourceNode = nodes.find(n => n.id === connection.source)
      const targetNode = nodes.find(n => n.id === connection.target)

      if (!sourceNode || !targetNode) {
        errors.push(`Invalid connection: ${connection.source} -> ${connection.target}`)
        continue
      }

      // Validate connection types
      if (sourceNode.type === 'dataset' && targetNode.type !== 'problem') {
        errors.push('Datasets can only connect to problems')
      }

      if (sourceNode.type === 'problem' && targetNode.type !== 'optimizer') {
        errors.push('Problems can only connect to optimizers')
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * Build execution graph from nodes and connections
   */
  buildExecutionGraph(nodes, connections) {
    const graph = []
    const processed = new Set()

    // Find all problem-optimizer pairs
    const problemNodes = nodes.filter(node => node.type === 'problem')
    
    for (const problemNode of problemNodes) {
      // Find connected datasets
      const connectedDatasets = connections
        .filter(conn => conn.target === problemNode.id)
        .map(conn => nodes.find(n => n.id === conn.source))
        .filter(node => node && node.type === 'dataset')

      // Find connected optimizers
      const connectedOptimizers = connections
        .filter(conn => conn.source === problemNode.id)
        .map(conn => nodes.find(n => n.id === conn.target))
        .filter(node => node && node.type === 'optimizer')

      // Create execution steps for each optimizer
      for (const optimizerNode of connectedOptimizers) {
        const stepId = `${problemNode.id}-${optimizerNode.id}`
        if (!processed.has(stepId)) {
          graph.push({
            id: stepId,
            type: 'optimization',
            problem: problemNode,
            optimizer: optimizerNode,
            datasets: connectedDatasets
          })
          processed.add(stepId)
        }
      }
    }

    return graph
  }

  /**
   * Execute workflow steps in sequence with detailed step-by-step logging
   */
  async executeWorkflowSteps(executionId, executionGraph, ws, authToken = null) {
    const results = []

    for (let i = 0; i < executionGraph.length; i++) {
      const step = executionGraph[i]

      this.sendLog(ws, 'info', `🚀 Starting Step ${i + 1}/${executionGraph.length}: ${step.problem.data.name} -> ${step.optimizer.data.name}`, 'workflow')

      try {
        // Step 1: Prepare parameters and handle dataset loading
        this.sendLog(ws, 'info', '📋 Step 1: Preparing execution parameters...', 'workflow')

        const { problemParams, optimizerParams, hasDataset } = await this.prepareExecutionParameters(
          step, authToken, ws
        )

        // Step 2: Execute optimization with detailed logging
        this.sendLog(ws, 'info', '⚡ Step 2: Starting optimization execution...', 'workflow')

        const result = await this.executeOptimizationStep(
          step, problemParams, optimizerParams, hasDataset, ws
        )

        // Step 3: Process and display results
        this.sendLog(ws, 'info', '📊 Step 3: Processing optimization results...', 'workflow')

        const processedResult = this.processOptimizationResult(result, step)

        results.push({
          stepId: step.id,
          problemName: step.problem.data.name,
          optimizerName: step.optimizer.data.name,
          result: processedResult,
          success: true,
          hasDataset
        })

        this.sendLog(ws, 'info', `✅ Step ${i + 1} completed successfully!`, 'workflow')
        this.displayStepResults(processedResult, step, ws)

      } catch (error) {
        this.sendLog(ws, 'error', `❌ Step ${i + 1} failed: ${error.message}`, 'workflow')

        results.push({
          stepId: step.id,
          problemName: step.problem.data.name,
          optimizerName: step.optimizer.data.name,
          error: error.message,
          success: false
        })

        // Continue with next step even if one fails
        continue
      }
    }

    return results
  }

  /**
   * Prepare execution parameters with dataset handling and config.json merging
   */
  async prepareExecutionParameters(step, authToken, ws) {
    this.sendLog(ws, 'info', '⚙️ Merging parameters from config.json and user inputs...', 'config')

    // Fetch config.json for both problem and optimizer to get default parameters
    const problemConfig = await this.fetchRepositoryConfig(step.problem.data.username, step.problem.data.name, ws)
    const optimizerConfig = await this.fetchRepositoryConfig(step.optimizer.data.username, step.optimizer.data.name, ws)

    // Merge parameters: config defaults -> user parameters
    const problemParams = this.mergeParameters(
      problemConfig?.default_params || {},
      step.problem.data.parameters || {},
      'problem'
    )

    const optimizerParams = this.mergeParameters(
      optimizerConfig?.default_params || {},
      step.optimizer.data.parameters || {},
      'optimizer'
    )

    let hasDataset = false

    // Handle dataset connection
    if (step.datasets.length > 0) {
      const dataset = step.datasets[0]
      const datasetId = dataset.data.datasetId || dataset.id
      hasDataset = true

      this.sendLog(ws, 'info', `📁 Dataset detected: ${dataset.data.name} (ID: ${datasetId})`, 'dataset')

      // Configure problem for dataset loading
      problemParams.dataset_id = datasetId
      problemParams.dataset_source = "platform"
      problemParams.rastion_dataset_id = datasetId

      this.sendLog(ws, 'info', '🔗 Configured problem for dataset loading', 'dataset')
    } else {
      this.sendLog(ws, 'info', '📝 No dataset connected - using problem defaults', 'workflow')
    }

    // Add authentication token for platform access
    if (authToken) {
      problemParams.auth_token = authToken
    }

    // Log final parameter summary
    this.sendLog(ws, 'debug', `Final problem parameters: ${JSON.stringify(problemParams, null, 2)}`, 'config')
    this.sendLog(ws, 'debug', `Final optimizer parameters: ${JSON.stringify(optimizerParams, null, 2)}`, 'config')

    return { problemParams, optimizerParams, hasDataset }
  }

  /**
   * Fetch repository config.json
   */
  async fetchRepositoryConfig(username, repoName, ws) {
    try {
      // This would typically call the same API that the frontend uses
      // For now, we'll return null and let the qubots library handle defaults
      this.sendLog(ws, 'debug', `Fetching config for ${username}/${repoName}...`, 'config')
      return null
    } catch (error) {
      this.sendLog(ws, 'debug', `Could not fetch config for ${username}/${repoName}: ${error.message}`, 'config')
      return null
    }
  }

  /**
   * Merge parameters with proper type conversion and validation
   */
  mergeParameters(defaultParams, userParams, componentType) {
    const merged = { ...defaultParams }

    // Override with user parameters, ensuring proper type conversion
    Object.entries(userParams).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        // Convert string numbers to actual numbers if the default is a number
        if (typeof defaultParams[key] === 'number' && typeof value === 'string') {
          const numValue = Number(value)
          if (!isNaN(numValue)) {
            merged[key] = numValue
          } else {
            merged[key] = value
          }
        } else {
          merged[key] = value
        }
      }
    })

    return merged
  }

  /**
   * Execute optimization step with detailed logging
   */
  async executeOptimizationStep(step, problemParams, optimizerParams, hasDataset, ws) {
    // Create a wrapper WebSocket to intercept and modify logs
    const logWrapper = {
      send: (data) => {
        try {
          const parsed = JSON.parse(data)
          if (parsed.type === 'log') {
            // Modify the log to include component information
            parsed.data.source = step.optimizer.data.name
            this.sendLog(ws, parsed.data.level, parsed.data.message, step.optimizer.data.name)
          } else {
            // Forward other messages as-is
            ws.send(data)
          }
        } catch (error) {
          // If not JSON, forward as-is
          ws.send(data)
        }
      },
      readyState: ws.readyState,
      OPEN: ws.OPEN
    }

    // Execute optimization using qubots service
    return await this.qubotService.executeOptimizationWithStreaming({
      problemName: step.problem.data.name,
      optimizerName: step.optimizer.data.name,
      problemUsername: step.problem.data.username,
      optimizerUsername: step.optimizer.data.username,
      problemParams,
      optimizerParams,
      hasDataset,
      timeout: 300000 // 5 minutes
    }, logWrapper)
  }

  /**
   * Process optimization result
   */
  processOptimizationResult(result, step) {
    // Ensure result has required fields
    const processedResult = {
      success: result.success || false,
      best_value: result.best_value,
      best_solution: result.best_solution,
      runtime_seconds: result.runtime_seconds,
      metadata: result.metadata || {},
      convergence_history: result.convergence_history || [],
      algorithm_info: result.algorithm_info || {},
      problem_info: result.problem_info || {},
      ...result
    }

    return processedResult
  }

  /**
   * Display step results to user
   */
  displayStepResults(result, step, ws) {
    if (result.success) {
      this.sendLog(ws, 'info', `🎯 Best Value: ${result.best_value}`, 'results')

      if (result.runtime_seconds) {
        this.sendLog(ws, 'info', `⏱️ Runtime: ${result.runtime_seconds.toFixed(3)} seconds`, 'results')
      }

      if (result.best_solution) {
        const solutionStr = Array.isArray(result.best_solution)
          ? `[${result.best_solution.slice(0, 10).join(', ')}${result.best_solution.length > 10 ? '...' : ''}]`
          : String(result.best_solution).substring(0, 100)
        this.sendLog(ws, 'info', `🔧 Solution: ${solutionStr}`, 'results')
      }

      if (result.metadata && Object.keys(result.metadata).length > 0) {
        this.sendLog(ws, 'debug', `📋 Metadata: ${JSON.stringify(result.metadata)}`, 'results')
      }
    } else {
      this.sendLog(ws, 'error', `❌ Optimization failed: ${result.error_message || 'Unknown error'}`, 'results')
    }
  }

  /**
   * Stop workflow execution
   */
  async stopExecution(executionId) {
    if (this.activeExecutions.has(executionId)) {
      const execution = this.activeExecutions.get(executionId)
      execution.status = 'cancelled'
      
      if (execution.ws) {
        this.sendLog(execution.ws, 'warning', 'Workflow execution stopped by user', 'system')
      }

      // TODO: Stop any running qubots jobs
      
      this.activeExecutions.delete(executionId)
      return { success: true }
    }

    return { success: false, error: 'Execution not found' }
  }

  /**
   * Get execution status
   */
  getExecutionStatus(executionId) {
    if (this.activeExecutions.has(executionId)) {
      const execution = this.activeExecutions.get(executionId)
      return {
        status: execution.status,
        startTime: execution.startTime,
        isActive: true
      }
    }

    if (this.executionResults.has(executionId)) {
      const result = this.executionResults.get(executionId)
      return {
        status: result.success ? 'completed' : 'error',
        result,
        isActive: false
      }
    }

    return { status: 'not_found', isActive: false }
  }

  /**
   * Send log message via WebSocket
   */
  sendLog(ws, level, message, source = 'workflow') {
    if (ws && ws.readyState === WebSocket.OPEN) {
      const logEntry = {
        timestamp: new Date().toISOString(),
        level,
        message,
        source
      }
      
      try {
        ws.send(JSON.stringify({
          type: 'log',
          data: logEntry
        }))
      } catch (error) {
        console.error('Failed to send log via WebSocket:', error)
      }
    }
  }
}

module.exports = WorkflowExecutionService

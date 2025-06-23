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
   * @returns {Promise<Object>} Execution result
   */
  async executeWorkflow(executionId, nodes, connections, parameters, ws) {
    console.log(`🚀 Starting workflow execution: ${executionId}`)
    console.log(`📊 Nodes: ${nodes.length}, Connections: ${connections.length}`)

    // Store execution info
    this.activeExecutions.set(executionId, {
      nodes,
      connections,
      parameters,
      ws,
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
      const results = await this.executeWorkflowSteps(executionId, executionGraph, ws)

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
   * Execute workflow steps in sequence
   */
  async executeWorkflowSteps(executionId, executionGraph, ws) {
    const results = []

    for (let i = 0; i < executionGraph.length; i++) {
      const step = executionGraph[i]
      
      this.sendLog(ws, 'info', `Executing step ${i + 1}/${executionGraph.length}: ${step.problem.data.name} -> ${step.optimizer.data.name}`, `${step.problem.data.name} + ${step.optimizer.data.name}`)

      try {
        // Prepare execution parameters
        const problemParams = step.problem.data.parameters || {}
        const optimizerParams = step.optimizer.data.parameters || {}

        // Add dataset information if available
        if (step.datasets.length > 0) {
          problemParams.dataset_id = step.datasets[0].id
          this.sendLog(ws, 'info', `Using dataset: ${step.datasets[0].data.name}`, step.datasets[0].data.name)
        }

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
        const result = await this.qubotService.executeOptimizationWithStreaming({
          problemName: step.problem.data.name,
          optimizerName: step.optimizer.data.name,
          problemUsername: step.problem.data.username,
          optimizerUsername: step.optimizer.data.username,
          problemParams,
          optimizerParams,
          timeout: 300000 // 5 minutes
        }, logWrapper)

        results.push({
          stepId: step.id,
          problemName: step.problem.data.name,
          optimizerName: step.optimizer.data.name,
          result,
          success: true
        })

        this.sendLog(ws, 'info', `Step ${i + 1} completed successfully`, step.optimizer.data.name)

      } catch (error) {
        this.sendLog(ws, 'error', `Step ${i + 1} failed: ${error.message}`, step.optimizer.data.name)
        
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

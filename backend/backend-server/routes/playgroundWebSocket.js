/**
 * Playground WebSocket Routes
 *
 * Handles WebSocket connections for real-time optimization log streaming.
 */

const WebSocket = require('ws')
const url = require('url')
const QubotStreamingExecutionService = require('../services/qubotStreamingExecutionService')
const WorkflowExecutionService = require('../services/workflowExecutionService')

class PlaygroundWebSocketHandler {
  constructor() {
    this.streamingService = new QubotStreamingExecutionService()
    this.workflowExecutionService = new WorkflowExecutionService()
    this.activeConnections = new Map()
    this.userConnections = new Map() // Map of userId -> Set of WebSocket connections
  }

  /**
   * Handle WebSocket connection for streaming execution
   */
  handleConnection(ws, request) {
    const pathname = url.parse(request.url).pathname
    const query = url.parse(request.url, true).query

    console.log(`🔌 WebSocket connection attempt: ${pathname}`)
    console.log(`🔍 Request headers:`, {
      'user-agent': request.headers['user-agent'],
      'origin': request.headers.origin,
      'upgrade': request.headers.upgrade,
      'connection': request.headers.connection
    })

    // Handle different WebSocket endpoints
    if (pathname.startsWith('/api/playground/qubots/stream/')) {
      console.log(`📡 Handling streaming execution for: ${pathname}`)
      this.handleStreamingExecution(ws, request, pathname)
    } else if (pathname === '/api/playground/ws') {
      console.log(`🌐 Handling environment connection`)
      this.handleEnvironmentConnection(ws, request, query)
    } else if (pathname === '/api/playground/test') {
      console.log(`🧪 Handling test connection`)
      this.handleTestConnection(ws, request)
    } else if (pathname === '/api/notifications/ws') {
      console.log(`🔔 Handling notification connection`)
      this.handleNotificationConnection(ws, request, query)
    } else if (pathname.startsWith('/api/submissions/stream/')) {
      console.log(`📊 Handling submission progress stream for: ${pathname}`)
      this.handleSubmissionProgressStream(ws, request, pathname, query)
    } else if (pathname.startsWith('/api/workflow-automation/stream/')) {
      console.log(`🔧 Handling workflow execution stream for: ${pathname}`)
      this.handleWorkflowExecutionStream(ws, request, pathname)
    } else {
      console.log(`❌ Unknown WebSocket endpoint: ${pathname}`)
      ws.close(1000, 'Unknown endpoint')
    }
  }

  /**
   * Handle streaming execution WebSocket
   */
  async handleStreamingExecution(ws, request, pathname) {
    const executionId = pathname.split('/').pop()

    console.log(`🔌 Streaming execution WebSocket connected: ${executionId}`)
    console.log(`📋 Pending executions available: ${global.pendingExecutions ? global.pendingExecutions.size : 0}`)

    // Check if execution parameters exist
    if (!global.pendingExecutions || !global.pendingExecutions.has(executionId)) {
      console.log(`❌ Execution not found: ${executionId}`)
      console.log(`📋 Available executions: ${global.pendingExecutions ? Array.from(global.pendingExecutions.keys()) : 'none'}`)

      ws.send(JSON.stringify({
        type: 'error',
        data: {
          message: 'Execution not found or expired',
          execution_id: executionId,
          available_executions: global.pendingExecutions ? Array.from(global.pendingExecutions.keys()) : [],
          timestamp: new Date().toISOString()
        }
      }))
      ws.close(1000, 'Execution not found')
      return
    }

    // Get execution parameters
    const params = global.pendingExecutions.get(executionId)
    global.pendingExecutions.delete(executionId) // Remove from pending

    // Store connection
    this.activeConnections.set(executionId, {
      ws,
      params,
      startTime: Date.now()
    })

    // Set up WebSocket event handlers
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message)
        this.handleWebSocketMessage(executionId, data)
      } catch (error) {
        console.error('Error parsing WebSocket message:', error)
      }
    })

    ws.on('close', () => {
      console.log(`Streaming execution WebSocket disconnected: ${executionId}`)
      this.activeConnections.delete(executionId)

      // Stop execution if still running
      this.streamingService.stopExecution(executionId)
    })

    ws.on('error', (error) => {
      console.error(`WebSocket error for execution ${executionId}:`, error)
    })

    // Send initial connection confirmation
    ws.send(JSON.stringify({
      type: 'connection_established',
      data: {
        execution_id: executionId,
        message: 'Connected to streaming execution',
        timestamp: new Date().toISOString()
      }
    }))

    try {
      // Start the streaming execution using the streaming service
      const result = await this.streamingService.executeOptimizationWithStreaming(params, ws)

      // Send final result
      ws.send(JSON.stringify({
        type: 'execution_complete',
        data: {
          success: true,
          result,
          timestamp: new Date().toISOString()
        }
      }))

    } catch (error) {
      console.error(`Streaming execution error for ${executionId}:`, error)

      // Send error result
      ws.send(JSON.stringify({
        type: 'execution_complete',
        data: {
          success: false,
          error_message: error.message,
          error_type: error.constructor.name,
          timestamp: new Date().toISOString()
        }
      }))
    } finally {
      // Clean up connection
      this.activeConnections.delete(executionId)

      // Close WebSocket after a brief delay
      setTimeout(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.close(1000, 'Execution completed')
        }
      }, 1000)
    }
  }

  /**
   * Handle workflow execution stream WebSocket
   */
  async handleWorkflowExecutionStream(ws, request, pathname) {
    const executionId = pathname.split('/').pop()

    console.log(`🔧 Workflow execution WebSocket connected: ${executionId}`)
    console.log(`📋 Pending workflow executions available: ${global.pendingWorkflowExecutions ? global.pendingWorkflowExecutions.size : 0}`)

    // Check if execution parameters exist
    if (!global.pendingWorkflowExecutions || !global.pendingWorkflowExecutions.has(executionId)) {
      console.log(`❌ Workflow execution not found: ${executionId}`)
      console.log(`📋 Available workflow executions: ${global.pendingWorkflowExecutions ? Array.from(global.pendingWorkflowExecutions.keys()) : 'none'}`)

      ws.send(JSON.stringify({
        type: 'error',
        data: {
          message: 'Workflow execution not found or expired',
          execution_id: executionId,
          available_executions: global.pendingWorkflowExecutions ? Array.from(global.pendingWorkflowExecutions.keys()) : [],
          timestamp: new Date().toISOString()
        }
      }))
      ws.close(1000, 'Execution not found')
      return
    }

    // Get execution parameters
    const executionData = global.pendingWorkflowExecutions.get(executionId)
    global.pendingWorkflowExecutions.delete(executionId) // Remove from pending

    // Store connection
    const connectionKey = `workflow_${executionId}`
    this.activeConnections.set(connectionKey, {
      ws,
      executionData,
      startTime: Date.now()
    })

    // Set up WebSocket event handlers
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message)
        this.handleWorkflowWebSocketMessage(executionId, data)
      } catch (error) {
        console.error('Error parsing workflow WebSocket message:', error)
      }
    })

    ws.on('close', () => {
      console.log(`🔧 Workflow execution WebSocket disconnected: ${executionId}`)
      this.activeConnections.delete(connectionKey)
    })

    ws.on('error', (error) => {
      console.error(`WebSocket error for workflow execution ${executionId}:`, error)
    })

    // Send initial connection confirmation
    ws.send(JSON.stringify({
      type: 'connection_established',
      data: {
        execution_id: executionId,
        message: 'Connected to workflow execution stream',
        timestamp: new Date().toISOString()
      }
    }))

    try {
      // Start the workflow execution using the workflow service
      const result = await this.workflowExecutionService.executeWorkflow(
        executionId,
        executionData.nodes,
        executionData.connections,
        executionData.parameters,
        ws,
        executionData.token  // Pass the authentication token
      )

      // Send final result
      ws.send(JSON.stringify({
        type: 'result',
        data: result
      }))

    } catch (error) {
      console.error(`Workflow execution error for ${executionId}:`, error)

      // Send error result
      ws.send(JSON.stringify({
        type: 'error',
        data: {
          message: error.message,
          executionId,
          timestamp: new Date().toISOString()
        }
      }))
    } finally {
      // Clean up connection
      this.activeConnections.delete(connectionKey)

      // Close WebSocket after a brief delay
      setTimeout(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.close(1000, 'Workflow execution completed')
        }
      }, 1000)
    }
  }

  /**
   * Handle workflow WebSocket messages
   */
  handleWorkflowWebSocketMessage(executionId, data) {
    console.log(`📨 Workflow WebSocket message from ${executionId}:`, data)

    const connectionKey = `workflow_${executionId}`
    const connection = this.activeConnections.get(connectionKey)
    if (!connection) {
      console.log(`⚠️ No active workflow connection found for execution: ${executionId}`)
      return
    }

    switch (data.type) {
      case 'ping':
        connection.ws.send(JSON.stringify({
          type: 'pong',
          data: { timestamp: new Date().toISOString() }
        }))
        break

      case 'stop_execution':
        console.log(`🛑 Stopping workflow execution: ${executionId}`)
        this.workflowExecutionService.stopExecution(executionId)
        break

      default:
        console.log(`❓ Unknown workflow message type: ${data.type}`)
    }
  }

  /**
   * Handle test WebSocket connection
   */
  handleTestConnection(ws, request) {
    console.log('Test WebSocket connected')

    ws.send(JSON.stringify({
      type: 'test_connection',
      data: {
        message: 'WebSocket test connection successful',
        timestamp: new Date().toISOString()
      }
    }))

    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message)
        console.log('Test WebSocket message:', data)

        ws.send(JSON.stringify({
          type: 'test_echo',
          data: {
            echo: data,
            timestamp: new Date().toISOString()
          }
        }))
      } catch (error) {
        console.error('Error parsing test WebSocket message:', error)
      }
    })

    ws.on('close', () => {
      console.log('Test WebSocket disconnected')
    })

    ws.on('error', (error) => {
      console.error('Test WebSocket error:', error)
    })
  }

  /**
   * Handle environment-based WebSocket connection (existing functionality)
   */
  handleEnvironmentConnection(ws, request, query) {
    const { envId, token } = query

    if (!envId || !token) {
      ws.close(1000, 'Missing envId or token')
      return
    }

    console.log(`Environment WebSocket connected: ${envId}`)

    // TODO: Implement authentication check with token
    // For now, just accept the connection

    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message)
        console.log(`Environment ${envId} message:`, data)

        // Echo back for now
        ws.send(JSON.stringify({
          type: 'echo',
          data: data
        }))
      } catch (error) {
        console.error('Error parsing environment WebSocket message:', error)
      }
    })

    ws.on('close', () => {
      console.log(`Environment WebSocket disconnected: ${envId}`)
    })

    ws.on('error', (error) => {
      console.error(`Environment WebSocket error for ${envId}:`, error)
    })

    // Send connection confirmation
    ws.send(JSON.stringify({
      type: 'connection_established',
      data: {
        env_id: envId,
        message: 'Connected to environment',
        timestamp: new Date().toISOString()
      }
    }))
  }

  /**
   * Handle incoming WebSocket messages
   */
  handleWebSocketMessage(executionId, data) {
    console.log(`📨 WebSocket message from ${executionId}:`, data)

    const connection = this.activeConnections.get(executionId)
    if (!connection) {
      console.log(`⚠️ No active connection found for execution: ${executionId}`)
      return
    }

    switch (data.type) {
      case 'ping':
        connection.ws.send(JSON.stringify({
          type: 'pong',
          data: { timestamp: new Date().toISOString() }
        }))
        break

      case 'stop_execution':
        console.log(`🛑 Stopping execution: ${executionId}`)
        // Note: The working execution service doesn't have a stop method yet
        // This could be implemented later if needed
        break

      default:
        console.log(`❓ Unknown message type: ${data.type}`)
    }
  }

  /**
   * Get status of all active connections
   */
  getConnectionStatus() {
    const status = {
      active_connections: this.activeConnections.size,
      connections: []
    }

    for (const [executionId, connection] of this.activeConnections) {
      status.connections.push({
        execution_id: executionId,
        start_time: connection.startTime,
        duration_ms: Date.now() - connection.startTime,
        problem: connection.params.problemName,
        optimizer: connection.params.optimizerName
      })
    }

    return status
  }

  /**
   * Broadcast message to all active connections
   */
  broadcast(message) {
    const messageStr = JSON.stringify(message)

    for (const [executionId, connection] of this.activeConnections) {
      if (connection.ws.readyState === WebSocket.OPEN) {
        connection.ws.send(messageStr)
      }
    }
  }

  /**
   * Handle notification WebSocket connection
   */
  handleNotificationConnection(ws, request, query) {
    const { token, userId } = query

    if (!token || !userId) {
      ws.close(1000, 'Missing token or userId')
      return
    }

    console.log(`🔔 Notification WebSocket connected for user: ${userId}`)

    // TODO: Validate token and get user info
    // For now, just accept the connection

    // Add to user connections
    if (!this.userConnections.has(userId)) {
      this.userConnections.set(userId, new Set())
    }
    this.userConnections.get(userId).add(ws)

    ws.on('close', () => {
      console.log(`🔔 Notification WebSocket disconnected for user: ${userId}`)
      if (this.userConnections.has(userId)) {
        this.userConnections.get(userId).delete(ws)
        if (this.userConnections.get(userId).size === 0) {
          this.userConnections.delete(userId)
        }
      }
    })

    ws.on('error', (error) => {
      console.error(`🔔 Notification WebSocket error for user ${userId}:`, error)
    })

    // Send connection confirmation
    ws.send(JSON.stringify({
      type: 'notification_connection_established',
      data: {
        user_id: userId,
        message: 'Connected to notification stream',
        timestamp: new Date().toISOString()
      }
    }))
  }

  /**
   * Handle submission progress stream WebSocket
   */
  async handleSubmissionProgressStream(ws, request, pathname, query) {
    const submissionId = pathname.split('/').pop()
    const { userId } = query

    console.log(`📊 Submission progress WebSocket connected: ${submissionId} for user: ${userId}`)

    if (!submissionId || !userId) {
      console.log('❌ Missing submissionId or userId for submission stream')
      ws.close(1000, 'Missing required parameters')
      return
    }

    // Store connection for this submission
    const connectionKey = `submission_${submissionId}`
    this.activeConnections.set(connectionKey, {
      ws,
      submissionId,
      userId,
      startTime: Date.now()
    })

    // Add to user connections for broadcasting
    if (!this.userConnections.has(userId)) {
      this.userConnections.set(userId, new Set())
    }
    this.userConnections.get(userId).add(ws)

    // Set up WebSocket event handlers
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message)
        this.handleSubmissionWebSocketMessage(submissionId, data)
      } catch (error) {
        console.error('Error parsing submission WebSocket message:', error)
      }
    })

    ws.on('close', () => {
      console.log(`📊 Submission progress WebSocket disconnected: ${submissionId}`)
      this.activeConnections.delete(connectionKey)

      // Remove from user connections
      const userConnections = this.userConnections.get(userId)
      if (userConnections) {
        userConnections.delete(ws)
        if (userConnections.size === 0) {
          this.userConnections.delete(userId)
        }
      }
    })

    ws.on('error', (error) => {
      console.error(`WebSocket error for submission ${submissionId}:`, error)
    })

    // Send initial connection confirmation
    ws.send(JSON.stringify({
      type: 'submission_connection_established',
      data: {
        submission_id: submissionId,
        message: 'Connected to submission progress stream',
        timestamp: new Date().toISOString()
      }
    }))

    // Send current submission status
    try {
      const SubmissionWorkflowService = require('../services/submissionWorkflowService')
      const status = await SubmissionWorkflowService.getSubmissionStatus(submissionId)

      ws.send(JSON.stringify({
        type: 'submission_status_update',
        data: {
          submission: status.submission,
          logs: status.logs,
          timestamp: new Date().toISOString()
        }
      }))
    } catch (error) {
      console.error('Error fetching initial submission status:', error)
    }
  }

  /**
   * Handle submission WebSocket messages
   */
  handleSubmissionWebSocketMessage(submissionId, data) {
    console.log(`📨 Submission WebSocket message from ${submissionId}:`, data)

    const connectionKey = `submission_${submissionId}`
    const connection = this.activeConnections.get(connectionKey)
    if (!connection) {
      console.log(`⚠️ No active connection found for submission: ${submissionId}`)
      return
    }

    switch (data.type) {
      case 'ping':
        connection.ws.send(JSON.stringify({
          type: 'pong',
          data: { timestamp: new Date().toISOString() }
        }))
        break

      case 'request_status_update':
        // Fetch and send current status
        this.sendSubmissionStatusUpdate(submissionId, connection.ws)
        break

      default:
        console.log(`❓ Unknown submission message type: ${data.type}`)
    }
  }

  /**
   * Send submission status update to WebSocket
   */
  async sendSubmissionStatusUpdate(submissionId, ws) {
    try {
      const SubmissionWorkflowService = require('../services/submissionWorkflowService')
      const status = await SubmissionWorkflowService.getSubmissionStatus(submissionId)

      ws.send(JSON.stringify({
        type: 'submission_status_update',
        data: {
          submission: status.submission,
          logs: status.logs,
          timestamp: new Date().toISOString()
        }
      }))
    } catch (error) {
      console.error('Error sending submission status update:', error)
    }
  }

  /**
   * Broadcast submission update to all connected clients for a submission
   */
  broadcastSubmissionUpdate(submissionId, updateData) {
    const connectionKey = `submission_${submissionId}`
    const connection = this.activeConnections.get(connectionKey)

    if (connection && connection.ws.readyState === WebSocket.OPEN) {
      connection.ws.send(JSON.stringify({
        type: 'submission_status_update',
        data: {
          ...updateData,
          timestamp: new Date().toISOString()
        }
      }))
    }
  }

  /**
   * Broadcast message to specific user
   */
  broadcastToUser(userId, message) {
    const userConnections = this.userConnections.get(userId.toString())
    if (!userConnections || userConnections.size === 0) {
      console.log(`📡 No active connections for user ${userId}`)
      return
    }

    const messageStr = JSON.stringify(message)
    let sentCount = 0

    for (const ws of userConnections) {
      if (ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(messageStr)
          sentCount++
        } catch (error) {
          console.error(`❌ Error sending message to user ${userId}:`, error)
        }
      }
    }

    console.log(`📡 Broadcasted message to ${sentCount} connections for user ${userId}`)
  }

  /**
   * Close all connections
   */
  closeAllConnections() {
    console.log(`🔌 Closing ${this.activeConnections.size} active WebSocket connections`)

    for (const [executionId, connection] of this.activeConnections) {
      try {
        if (connection.ws && connection.ws.readyState === WebSocket.OPEN) {
          connection.ws.close(1000, 'Server shutdown')
        }
      } catch (error) {
        console.error(`❌ Error closing connection ${executionId}:`, error)
      }
    }

    // Close user notification connections
    for (const [userId, connections] of this.userConnections) {
      for (const ws of connections) {
        try {
          if (ws.readyState === WebSocket.OPEN) {
            ws.close(1000, 'Server shutdown')
          }
        } catch (error) {
          console.error(`❌ Error closing notification connection for user ${userId}:`, error)
        }
      }
    }

    this.activeConnections.clear()
    this.userConnections.clear()
    console.log(`✅ All WebSocket connections closed`)
  }
}

module.exports = PlaygroundWebSocketHandler

/**
 * Playground WebSocket Routes
 *
 * Handles WebSocket connections for real-time optimization log streaming.
 */

const WebSocket = require('ws')
const url = require('url')
const QubotStreamingExecutionService = require('../services/qubotStreamingExecutionService')

class PlaygroundWebSocketHandler {
  constructor() {
    this.streamingService = new QubotStreamingExecutionService()
    this.activeConnections = new Map()
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

    this.activeConnections.clear()
    console.log(`✅ All WebSocket connections closed`)
  }
}

module.exports = PlaygroundWebSocketHandler

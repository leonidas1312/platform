/**
 * Enhanced WebSocket Manager for Workflow Execution
 * 
 * Provides improved WebSocket communication with better error handling,
 * structured message formatting, and reliable delivery mechanisms.
 */

class EnhancedWebSocketManager {
  constructor() {
    this.connections = new Map() // executionId -> connection info
    this.messageQueue = new Map() // executionId -> queued messages
    this.heartbeatInterval = 30000 // 30 seconds
    this.maxRetries = 3
    this.retryDelay = 1000 // 1 second
    
    console.log(`🔌 EnhancedWebSocketManager initialized`)
  }

  /**
   * Register a WebSocket connection for an execution
   */
  registerConnection(executionId, ws) {
    if (!ws) {
      console.warn(`⚠️ Attempted to register null WebSocket for ${executionId}`)
      return false
    }

    const connectionInfo = {
      ws,
      executionId,
      connectedAt: new Date(),
      lastHeartbeat: new Date(),
      messagesSent: 0,
      isAlive: true
    }

    this.connections.set(executionId, connectionInfo)
    this.messageQueue.set(executionId, [])

    // Set up WebSocket event handlers
    this.setupWebSocketHandlers(executionId, ws)

    // Start heartbeat for this connection
    this.startHeartbeat(executionId)

    console.log(`🔌 Registered WebSocket connection for execution: ${executionId}`)
    
    // Send connection confirmation
    this.sendMessage(executionId, 'connection_established', {
      executionId,
      timestamp: new Date().toISOString(),
      message: 'WebSocket connection established successfully'
    })

    return true
  }

  /**
   * Set up WebSocket event handlers
   */
  setupWebSocketHandlers(executionId, ws) {
    ws.on('close', () => {
      console.log(`🔌 WebSocket closed for execution: ${executionId}`)
      this.unregisterConnection(executionId)
    })

    ws.on('error', (error) => {
      console.error(`🔌 WebSocket error for execution ${executionId}:`, error)
      this.handleConnectionError(executionId, error)
    })

    ws.on('pong', () => {
      const connection = this.connections.get(executionId)
      if (connection) {
        connection.lastHeartbeat = new Date()
        connection.isAlive = true
      }
    })

    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data)
        this.handleClientMessage(executionId, message)
      } catch (error) {
        console.error(`🔌 Failed to parse client message for ${executionId}:`, error)
      }
    })
  }

  /**
   * Handle messages from client
   */
  handleClientMessage(executionId, message) {
    console.log(`🔌 Received client message for ${executionId}:`, message.type)

    switch (message.type) {
      case 'ping':
        this.sendMessage(executionId, 'pong', {
          timestamp: new Date().toISOString()
        })
        break

      case 'request_status':
        this.sendExecutionStatus(executionId)
        break

      case 'request_logs':
        this.sendRecentLogs(executionId, message.data?.limit || 50)
        break

      default:
        console.log(`🔌 Unknown client message type: ${message.type}`)
    }
  }

  /**
   * Send a message to a specific execution's WebSocket
   */
  sendMessage(executionId, type, data, retryCount = 0) {
    // Validate executionId
    if (!executionId || typeof executionId !== 'string') {
      console.error(`❌ Invalid executionId provided to sendMessage: ${executionId} (type: ${typeof executionId})`)
      console.error(`❌ Message type: ${type}, data:`, data)
      console.error(`❌ Stack trace:`, new Error().stack)
      return false
    }

    const connection = this.connections.get(executionId)

    if (!connection || !connection.ws) {
      console.warn(`⚠️ No WebSocket connection for execution: ${executionId}`)
      this.queueMessage(executionId, type, data)
      return false
    }

    const message = {
      type,
      data,
      timestamp: new Date().toISOString(),
      executionId
    }

    try {
      if (connection.ws.readyState === connection.ws.OPEN) {
        connection.ws.send(JSON.stringify(message))
        connection.messagesSent++
        connection.lastHeartbeat = new Date()
        
        console.log(`🔌 Sent ${type} message to ${executionId}`)
        return true
      } else {
        console.warn(`⚠️ WebSocket not open for ${executionId}, state: ${connection.ws.readyState}`)
        this.queueMessage(executionId, type, data)
        return false
      }
    } catch (error) {
      console.error(`🔌 Failed to send message to ${executionId}:`, error)
      
      // Retry logic
      if (retryCount < this.maxRetries) {
        setTimeout(() => {
          this.sendMessage(executionId, type, data, retryCount + 1)
        }, this.retryDelay * (retryCount + 1))
      } else {
        this.queueMessage(executionId, type, data)
      }
      
      return false
    }
  }

  /**
   * Queue message for later delivery
   */
  queueMessage(executionId, type, data) {
    const queue = this.messageQueue.get(executionId) || []
    queue.push({
      type,
      data,
      timestamp: new Date().toISOString(),
      queuedAt: new Date()
    })
    
    // Limit queue size
    if (queue.length > 100) {
      queue.shift() // Remove oldest message
    }
    
    this.messageQueue.set(executionId, queue)
    console.log(`📦 Queued ${type} message for ${executionId} (queue size: ${queue.length})`)
  }

  /**
   * Send queued messages when connection is restored
   */
  sendQueuedMessages(executionId) {
    const queue = this.messageQueue.get(executionId) || []
    if (queue.length === 0) return

    console.log(`📦 Sending ${queue.length} queued messages for ${executionId}`)

    for (const message of queue) {
      this.sendMessage(executionId, message.type, message.data)
    }

    this.messageQueue.set(executionId, [])
  }

  /**
   * Send log message
   */
  sendLog(executionId, level, message, step = 'system') {
    return this.sendMessage(executionId, 'log', {
      level,
      message,
      step,
      timestamp: new Date().toISOString()
    })
  }

  /**
   * Send step-specific log message
   */
  sendStepLog(executionId, level, message, step) {
    return this.sendMessage(executionId, 'step_log', {
      level,
      message,
      step,
      timestamp: new Date().toISOString()
    })
  }

  /**
   * Send progress update
   */
  sendProgress(executionId, step, progress, message = '') {
    return this.sendMessage(executionId, 'progress', {
      step,
      progress,
      message,
      timestamp: new Date().toISOString()
    })
  }

  /**
   * Send execution result
   */
  sendResult(executionId, result) {
    return this.sendMessage(executionId, 'result', result)
  }

  /**
   * Send error message
   */
  sendError(executionId, error, step = 'system') {
    return this.sendMessage(executionId, 'error', {
      message: error.message || error,
      step,
      timestamp: new Date().toISOString()
    })
  }

  /**
   * Start heartbeat for a connection
   */
  startHeartbeat(executionId) {
    const heartbeatTimer = setInterval(() => {
      const connection = this.connections.get(executionId)
      
      if (!connection) {
        clearInterval(heartbeatTimer)
        return
      }

      if (!connection.isAlive) {
        console.log(`💔 Heartbeat failed for ${executionId}, closing connection`)
        connection.ws.terminate()
        this.unregisterConnection(executionId)
        clearInterval(heartbeatTimer)
        return
      }

      connection.isAlive = false
      try {
        connection.ws.ping()
      } catch (error) {
        console.error(`💔 Heartbeat ping failed for ${executionId}:`, error)
        this.unregisterConnection(executionId)
        clearInterval(heartbeatTimer)
      }
    }, this.heartbeatInterval)

    // Store timer reference for cleanup
    const connection = this.connections.get(executionId)
    if (connection) {
      connection.heartbeatTimer = heartbeatTimer
    }
  }

  /**
   * Handle connection errors
   */
  handleConnectionError(executionId, error) {
    console.error(`🔌 Connection error for ${executionId}:`, error)
    
    const connection = this.connections.get(executionId)
    if (connection) {
      connection.lastError = {
        message: error.message,
        timestamp: new Date()
      }
    }
  }

  /**
   * Unregister a WebSocket connection
   */
  unregisterConnection(executionId) {
    const connection = this.connections.get(executionId)
    
    if (connection) {
      // Clear heartbeat timer
      if (connection.heartbeatTimer) {
        clearInterval(connection.heartbeatTimer)
      }
      
      console.log(`🔌 Unregistered WebSocket connection for execution: ${executionId}`)
      console.log(`📊 Connection stats: Messages sent: ${connection.messagesSent}, Duration: ${Date.now() - connection.connectedAt.getTime()}ms`)
    }
    
    this.connections.delete(executionId)
    
    // Keep message queue for a short time in case of reconnection
    setTimeout(() => {
      this.messageQueue.delete(executionId)
    }, 60000) // 1 minute
  }

  /**
   * Check if connection exists and is active
   */
  isConnected(executionId) {
    const connection = this.connections.get(executionId)
    return connection && connection.ws && connection.ws.readyState === connection.ws.OPEN
  }

  /**
   * Get connection statistics
   */
  getConnectionStats() {
    const stats = {
      totalConnections: this.connections.size,
      queuedMessages: 0,
      connections: []
    }

    for (const [executionId, connection] of this.connections) {
      const queue = this.messageQueue.get(executionId) || []
      stats.queuedMessages += queue.length
      
      stats.connections.push({
        executionId,
        connectedAt: connection.connectedAt,
        messagesSent: connection.messagesSent,
        queuedMessages: queue.length,
        isAlive: connection.isAlive,
        lastHeartbeat: connection.lastHeartbeat
      })
    }

    return stats
  }

  /**
   * Cleanup inactive connections
   */
  cleanupInactiveConnections() {
    const now = new Date()
    const inactiveThreshold = 5 * 60 * 1000 // 5 minutes

    for (const [executionId, connection] of this.connections) {
      const timeSinceHeartbeat = now - connection.lastHeartbeat
      
      if (timeSinceHeartbeat > inactiveThreshold) {
        console.log(`🧹 Cleaning up inactive connection: ${executionId}`)
        this.unregisterConnection(executionId)
      }
    }
  }
}

module.exports = EnhancedWebSocketManager

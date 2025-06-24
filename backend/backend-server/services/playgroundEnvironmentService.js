/**
 * Playground Environment Service
 *
 * Manages containerized environments for interactive optimization testing.
 * Handles Kubernetes pod creation, lifecycle management, and user sessions.
 */

const k8s = require('@kubernetes/client-node')
const crypto = require('crypto')
const WebSocket = require('ws')

class PlaygroundEnvironmentService {
  constructor() {
    // Initialize Kubernetes client
    this.kc = new k8s.KubeConfig()
    this.kc.loadFromDefault()
    this.k8sApi = this.kc.makeApiClient(k8s.CoreV1Api)
    this.k8sAppsApi = this.kc.makeApiClient(k8s.AppsV1Api)

    // Environment configuration
    this.namespace = process.env.PLAYGROUND_NAMESPACE || 'playground'
    this.baseImage = process.env.PLAYGROUND_IMAGE || 'registry.digitalocean.com/rastion/qubots-playground:latest'
    this.maxEnvironments = parseInt(process.env.MAX_PLAYGROUND_ENVIRONMENTS) || 10
    this.sessionTimeout = parseInt(process.env.PLAYGROUND_SESSION_TIMEOUT) || 3600000 // 1 hour

    // Active environments tracking
    this.activeEnvironments = new Map()
    this.environmentSockets = new Map()

    // Start cleanup timer
    this.startCleanupTimer()
  }

  /**
   * Create a new playground environment for a user
   * @param {string} userId - User identifier
   * @param {string} problemRepo - Problem repository name
   * @param {string} optimizerRepo - Optimizer repository name
   * @param {string} problemUsername - Problem repository owner
   * @param {string} optimizerUsername - Optimizer repository owner
   * @returns {Promise<Object>} Environment details
   */
  async createEnvironment(userId, problemRepo, optimizerRepo, problemUsername, optimizerUsername) {
    try {
      // Check if user already has an active environment
      const existingEnv = this.getUserEnvironment(userId)
      if (existingEnv) {
        throw new Error('User already has an active environment')
      }

      // Check environment limits
      if (this.activeEnvironments.size >= this.maxEnvironments) {
        throw new Error('Maximum number of environments reached')
      }

      // Generate unique environment ID
      const envId = this.generateEnvironmentId(userId)
      const envName = `playground-${envId}`

      // Create Kubernetes resources
      await this.createNamespace(envId)
      const pod = await this.createPod(envId, envName, problemRepo, optimizerRepo, problemUsername, optimizerUsername)
      const service = await this.createService(envId, envName)

      // Store environment info
      const environment = {
        id: envId,
        userId,
        name: envName,
        problemRepo,
        optimizerRepo,
        problemUsername,
        optimizerUsername,
        status: 'starting',
        createdAt: new Date(),
        lastActivity: new Date(),
        pod: pod.body,
        service: service.body,
        url: this.getEnvironmentUrl(envId)
      }

      this.activeEnvironments.set(envId, environment)

      // Wait for pod to be ready
      await this.waitForPodReady(envId, envName)
      environment.status = 'ready'

      return environment
    } catch (error) {
      console.error('Failed to create playground environment:', error)
      throw error
    }
  }

  /**
   * Get environment details
   * @param {string} envId - Environment ID
   * @returns {Object|null} Environment details
   */
  getEnvironment(envId) {
    return this.activeEnvironments.get(envId) || null
  }

  /**
   * Get user's active environment
   * @param {string} userId - User ID
   * @returns {Object|null} Environment details
   */
  getUserEnvironment(userId) {
    for (const [envId, env] of this.activeEnvironments) {
      if (env.userId === userId) {
        return env
      }
    }
    return null
  }

  /**
   * List all active environments
   * @returns {Array} List of environments
   */
  listEnvironments() {
    return Array.from(this.activeEnvironments.values())
  }

  /**
   * Delete an environment
   * @param {string} envId - Environment ID
   * @returns {Promise<boolean>} Success status
   */
  async deleteEnvironment(envId) {
    try {
      const environment = this.activeEnvironments.get(envId)
      if (!environment) {
        return false
      }

      // Close WebSocket connections
      const sockets = this.environmentSockets.get(envId) || []
      sockets.forEach(ws => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.close()
        }
      })
      this.environmentSockets.delete(envId)

      // Delete Kubernetes resources
      await this.deleteNamespace(envId)

      // Remove from tracking
      this.activeEnvironments.delete(envId)

      console.log(`Deleted playground environment: ${envId}`)
      return true
    } catch (error) {
      console.error(`Failed to delete environment ${envId}:`, error)
      return false
    }
  }

  /**
   * Execute optimization in environment
   * @param {string} envId - Environment ID
   * @param {Object} params - Execution parameters
   * @returns {Promise<Object>} Execution result
   */
  async executeOptimization(envId, params) {
    const environment = this.activeEnvironments.get(envId)
    if (!environment) {
      throw new Error('Environment not found')
    }

    // Update last activity
    environment.lastActivity = new Date()

    // Execute via HTTP call to the pod
    const result = await this.callPodAPI(envId, environment.name, params)

    return result
  }

  /**
   * Connect WebSocket for real-time communication
   * @param {string} envId - Environment ID
   * @param {WebSocket} ws - WebSocket connection
   */
  connectWebSocket(envId, ws) {
    if (!this.environmentSockets.has(envId)) {
      this.environmentSockets.set(envId, [])
    }
    this.environmentSockets.get(envId).push(ws)

    ws.on('close', () => {
      const sockets = this.environmentSockets.get(envId) || []
      const index = sockets.indexOf(ws)
      if (index > -1) {
        sockets.splice(index, 1)
      }
    })
  }

  /**
   * Broadcast message to environment WebSockets
   * @param {string} envId - Environment ID
   * @param {Object} message - Message to broadcast
   */
  broadcastToEnvironment(envId, message) {
    const sockets = this.environmentSockets.get(envId) || []
    const messageStr = JSON.stringify(message)

    sockets.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(messageStr)
      }
    })
  }

  // Private helper methods
  generateEnvironmentId(userId) {
    const timestamp = Date.now().toString()
    const random = crypto.randomBytes(4).toString('hex')
    const userHash = crypto.createHash('md5').update(userId).digest('hex').substring(0, 8)
    return `${userHash}-${timestamp.substring(-6)}-${random}`
  }

  getEnvironmentUrl(envId) {
    const domain = process.env.PLAYGROUND_DOMAIN || 'playground.rastion.com'
    return `https://${envId}.${domain}`
  }

  async createNamespace(envId) {
    const namespace = {
      metadata: {
        name: `playground-${envId}`,
        labels: {
          'app': 'playground',
          'environment-id': envId
        }
      }
    }

    try {
      await this.k8sApi.createNamespace(namespace)
    } catch (error) {
      if (error.response?.statusCode !== 409) { // Ignore if already exists
        throw error
      }
    }
  }

  async deleteNamespace(envId) {
    try {
      await this.k8sApi.deleteNamespace(`playground-${envId}`)
    } catch (error) {
      console.error(`Failed to delete namespace for ${envId}:`, error)
    }
  }

  startCleanupTimer() {
    setInterval(() => {
      this.cleanupInactiveEnvironments()
    }, 60000) // Check every minute
  }

  async cleanupInactiveEnvironments() {
    const now = new Date()
    const toDelete = []

    for (const [envId, env] of this.activeEnvironments) {
      const inactiveTime = now - env.lastActivity
      if (inactiveTime > this.sessionTimeout) {
        toDelete.push(envId)
      }
    }

    for (const envId of toDelete) {
      console.log(`Cleaning up inactive environment: ${envId}`)
      await this.deleteEnvironment(envId)
    }
  }

  async createPod(envId, envName, problemRepo, optimizerRepo, problemUsername, optimizerUsername) {
    const pod = {
      metadata: {
        name: envName,
        namespace: `playground-${envId}`,
        labels: {
          'app': 'playground',
          'environment-id': envId
        }
      },
      spec: {
        containers: [{
          name: 'playground',
          image: this.baseImage,
          ports: [
            { containerPort: 8000, name: 'qubots-api' },
            { containerPort: 8888, name: 'jupyter' },
            { containerPort: 8080, name: 'vscode' }
          ],
          env: [
            { name: 'PROBLEM_REPO', value: problemRepo },
            { name: 'OPTIMIZER_REPO', value: optimizerRepo },
            { name: 'PROBLEM_USERNAME', value: problemUsername },
            { name: 'OPTIMIZER_USERNAME', value: optimizerUsername },
            { name: 'GITEA_URL', value: process.env.GITEA_URL || 'https://hub.rastion.com' }
          ],
          resources: {
            limits: {
              cpu: '2',
              memory: '4Gi'
            },
            requests: {
              cpu: '500m',
              memory: '1Gi'
            }
          }
        }],
        restartPolicy: 'Never'
      }
    }

    return await this.k8sApi.createNamespacedPod(`playground-${envId}`, pod)
  }

  async createService(envId, envName) {
    const service = {
      metadata: {
        name: `${envName}-service`,
        namespace: `playground-${envId}`,
        labels: {
          'app': 'playground',
          'environment-id': envId
        }
      },
      spec: {
        selector: {
          'environment-id': envId
        },
        ports: [
          { port: 8000, targetPort: 8000, name: 'qubots-api' },
          { port: 8888, targetPort: 8888, name: 'jupyter' },
          { port: 8080, targetPort: 8080, name: 'vscode' }
        ],
        type: 'ClusterIP'
      }
    }

    return await this.k8sApi.createNamespacedService(`playground-${envId}`, service)
  }

  async waitForPodReady(envId, envName, timeout = 120000) {
    const startTime = Date.now()

    while (Date.now() - startTime < timeout) {
      try {
        const pod = await this.k8sApi.readNamespacedPod(envName, `playground-${envId}`)
        const status = pod.body.status

        if (status.phase === 'Running' &&
            status.containerStatuses &&
            status.containerStatuses[0].ready) {
          return true
        }

        if (status.phase === 'Failed') {
          throw new Error('Pod failed to start')
        }

        await new Promise(resolve => setTimeout(resolve, 2000))
      } catch (error) {
        if (Date.now() - startTime >= timeout) {
          throw new Error('Timeout waiting for pod to be ready')
        }
        await new Promise(resolve => setTimeout(resolve, 2000))
      }
    }

    throw new Error('Timeout waiting for pod to be ready')
  }

  /**
   * Call the playground container API for optimization execution
   * @param {string} envId - Environment ID
   * @param {string} envName - Environment name
   * @param {Object} params - Execution parameters
   * @returns {Promise<Object>} Execution result
   */
  async callPodAPI(envId, envName, params) {
    const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args))

    try {
      // For lightweight qubots execution, we'll use the playground container's HTTP API
      // The container exposes an API on port 8000 for qubots execution
      const podIP = await this.getPodIP(envId, envName)
      const apiUrl = `http://${podIP}:8000/execute`

      const requestBody = {
        problem_name: params.problemName,
        problem_username: params.problemUsername || 'default',
        optimizer_name: params.optimizerName,
        optimizer_username: params.optimizerUsername || 'default',
        problem_params: params.problemParams || {},
        optimizer_params: params.optimizerParams || {},
        timeout: 30000
      }

      console.log(`Calling playground API at ${apiUrl} with params:`, requestBody)

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody),
        timeout: 35000
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Playground API error: ${response.status} - ${errorText}`)
      }

      const result = await response.json()

      // Transform result to match expected dashboard format
      return {
        success: result.success || false,
        problem_name: params.problemName,
        optimizer_name: params.optimizerName,
        problem_username: params.problemUsername,
        optimizer_username: params.optimizerUsername,
        execution_time: result.execution_time || 0,
        timestamp: new Date().toISOString(),
        best_solution: result.best_solution,
        best_value: result.best_value,
        iterations: result.iterations,
        history: result.history || [],
        metadata: result.metadata || {},
        error_message: result.error_message,
        error_type: result.error_type
      }

    } catch (error) {
      console.error(`Failed to call playground API for ${envId}:`, error)

      // Return error result in dashboard format
      return {
        success: false,
        problem_name: params.problemName,
        optimizer_name: params.optimizerName,
        problem_username: params.problemUsername,
        optimizer_username: params.optimizerUsername,
        execution_time: 0,
        timestamp: new Date().toISOString(),
        error_message: error.message,
        error_type: 'api_error'
      }
    }
  }

  /**
   * Get the IP address of a pod
   * @param {string} envId - Environment ID
   * @param {string} envName - Environment name
   * @returns {Promise<string>} Pod IP address
   */
  async getPodIP(envId, envName) {
    try {
      const pod = await this.k8sApi.readNamespacedPod(envName, `playground-${envId}`)
      const podIP = pod.body.status.podIP

      if (!podIP) {
        throw new Error('Pod IP not available')
      }

      return podIP
    } catch (error) {
      console.error(`Failed to get pod IP for ${envName}:`, error)
      throw new Error(`Failed to get pod IP: ${error.message}`)
    }
  }
}

module.exports = PlaygroundEnvironmentService

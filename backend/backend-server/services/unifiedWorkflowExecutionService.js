/**
 * Unified Workflow Execution Service
 *
 * Provides secure, containerized, cloud-based execution of qubots workflows.
 * Dynamically generates Python scripts based on workflow configuration and executes them
 * in isolated Kubernetes containers with real-time streaming support.
 *
 * This service replaces the multiple overlapping execution services with a single,
 * clean implementation focused on workflow automation.
 */

const crypto = require('crypto')
const EnhancedWorkflowCodeGenerator = require('./enhancedWorkflowCodeGenerator')
const WorkflowConfigurationParser = require('./workflowConfigurationParser')
const ResourceManager = require('./resourceManager')
const SecurityManager = require('./securityManager')
const EnhancedLoggingManager = require('./enhancedLoggingManager')
const EnhancedWebSocketManager = require('./enhancedWebSocketManager')
const IntegrationManager = require('./integrationManager')
const ErrorHandlingManager = require('./errorHandlingManager')
const PerformanceOptimizationManager = require('./performanceOptimizationManager')

// Singleton instance
let instance = null

class UnifiedWorkflowExecutionService {
  static getInstance() {
    if (!instance) {
      instance = new UnifiedWorkflowExecutionService()
    }
    return instance
  }
  constructor() {
    // Kubernetes client will be initialized lazily
    this.k8s = null
    this.kc = null
    this.k8sApi = null
    this.k8sBatchApi = null
    this.k8sInitialized = false

    // Configuration
    this.namespace = process.env.PLAYGROUND_NAMESPACE || 'playground'
    this.baseImage = process.env.PLAYGROUND_IMAGE || 'registry.digitalocean.com/rastion/qubots-playground:latest'
    this.jobTimeout = 300 // 5 minutes

    // Validate configuration
    if (!this.namespace || typeof this.namespace !== 'string') {
      throw new Error(`Invalid namespace configuration: ${this.namespace}`)
    }

    // Active executions tracking
    this.activeExecutions = new Map()
    this.executionResults = new Map()

    // Track namespace initialization to avoid duplicate attempts
    this.namespaceInitialized = false
    this.namespaceInitializing = false

    // Initialize enhanced components
    this.codeGenerator = new EnhancedWorkflowCodeGenerator()
    this.configParser = new WorkflowConfigurationParser()
    this.resourceManager = new ResourceManager()
    this.securityManager = new SecurityManager()
    this.loggingManager = new EnhancedLoggingManager()
    this.webSocketManager = new EnhancedWebSocketManager()
    this.integrationManager = new IntegrationManager()
    this.errorHandler = new ErrorHandlingManager()
    this.performanceManager = new PerformanceOptimizationManager()

    console.log(`🚀 UnifiedWorkflowExecutionService initialized`)
    console.log(`📦 Namespace: ${this.namespace}`)
    console.log(`🐳 Container Image: ${this.baseImage}`)

    // Initialize tracking
    this.activeLogStreams = new Map()

    // Start periodic cleanup
    this.startPeriodicCleanup()
  }

  /**
   * Initialize Kubernetes client lazily
   */
  async initializeKubernetes() {
    if (this.k8sInitialized) {
      return
    }

    try {
      // Dynamic import for ES module
      this.k8s = await import('@kubernetes/client-node')

      // Initialize Kubernetes client
      this.kc = new this.k8s.KubeConfig()
      this.kc.loadFromDefault()
      this.k8sApi = this.kc.makeApiClient(this.k8s.CoreV1Api)
      this.k8sBatchApi = this.kc.makeApiClient(this.k8s.BatchV1Api)

      this.k8sInitialized = true
      console.log('✅ Kubernetes client initialized')

    } catch (error) {
      console.error('❌ Failed to initialize Kubernetes client:', error.message)
      throw error
    }
  }

  /**
   * Initialize namespace once during startup
   */
  async initializeNamespace() {
    if (this.namespaceInitialized || this.namespaceInitializing) {
      return
    }

    this.namespaceInitializing = true
    try {
      await this.ensureNamespaceExists()
      this.namespaceInitialized = true
    } catch (error) {
      console.error(`❌ Failed to ensure namespace exists during initialization:`, error.message)
    } finally {
      this.namespaceInitializing = false
    }
  }

  /**
   * Ensure the playground namespace exists
   */
  async ensureNamespaceExists() {
    try {
      // Initialize Kubernetes client if not already done
      await this.initializeKubernetes()

      // Validate namespace before making API call
      if (!this.namespace || typeof this.namespace !== 'string') {
        throw new Error(`Invalid namespace value: ${this.namespace} (type: ${typeof this.namespace})`)
      }

      console.log(`🔍 Checking if namespace '${this.namespace}' exists...`)
      console.log(`🔍 Debug: namespace type=${typeof this.namespace}, value='${this.namespace}'`)
      console.log(`🔍 Debug: k8sApi exists=${!!this.k8sApi}`)

      // Check if namespace exists
      const namespaceName = this.namespace
      console.log(`🔍 Debug: About to call readNamespace with: '${namespaceName}'`)
      await this.k8sApi.readNamespace({ name: namespaceName })
      console.log(`✅ Namespace '${this.namespace}' exists`)
    } catch (error) {
      if (error.response?.statusCode === 404) {
        // Namespace doesn't exist, create it
        console.log(`📦 Creating namespace '${this.namespace}'...`)
        try {
          const namespaceManifest = {
            metadata: {
              name: this.namespace,
              labels: {
                'app': 'rastion-playground',
                'managed-by': 'unified-workflow-service'
              }
            }
          }
          await this.k8sApi.createNamespace(namespaceManifest)
          console.log(`✅ Namespace '${this.namespace}' created successfully`)
        } catch (createError) {
          console.error(`❌ Failed to create namespace '${this.namespace}':`, createError.message)
          throw createError
        }
      } else {
        console.error(`❌ Error checking namespace '${this.namespace}':`, error.message)
        throw error
      }
    }
  }

  /**
   * Check cluster resources and node availability
   */
  async checkClusterResources() {
    try {
      console.log(`🔍 Checking cluster resources...`)

      // Check nodes
      const nodes = await this.k8sApi.listNode()
      const readyNodes = nodes.body?.items?.filter(node => {
        const conditions = node.status?.conditions || []
        return conditions.some(condition =>
          condition.type === 'Ready' && condition.status === 'True'
        )
      }) || []

      console.log(`📋 Cluster has ${readyNodes.length} ready nodes out of ${nodes.body?.items?.length || 0} total`)

      if (readyNodes.length === 0) {
        console.warn(`⚠️ No ready nodes found in cluster!`)
      }

      // Check resource quotas in namespace
      try {
        const quotas = await this.k8sApi.listNamespacedResourceQuota({ namespace: this.namespace })
        if (quotas.body?.items?.length > 0) {
          console.log(`📋 Found ${quotas.body.items.length} resource quotas in namespace ${this.namespace}`)
          for (const quota of quotas.body.items) {
            console.log(`📋 Quota ${quota.metadata.name}:`, quota.status)
          }
        }
      } catch (quotaError) {
        console.log(`📋 No resource quotas found in namespace ${this.namespace}`)
      }

    } catch (error) {
      console.warn(`⚠️ Could not check cluster resources: ${error.message}`)
      // Don't throw - this is just for debugging
    }
  }

  /**
   * Execute a workflow with enhanced performance optimization
   * @param {string} executionId - Unique execution identifier
   * @param {Array} nodes - Workflow nodes
   * @param {Array} connections - Node connections
   * @param {Object} parameters - Additional parameters
   * @param {WebSocket} ws - WebSocket connection for sending logs after completion
   * @param {string} authToken - Authentication token for platform access
   * @returns {Promise<Object>} Execution result
   */
  async executeWorkflow(executionId, nodes, connections, parameters, ws, authToken = null) {
    console.log(`🚀 Starting workflow execution: ${executionId}`)
    console.log(`📊 Nodes: ${nodes.length}, Connections: ${connections.length}`)

    // Check if we should queue this execution for performance optimization
    const shouldQueue = this.performanceManager.currentExecutions.size >= this.performanceManager.maxConcurrentExecutions

    if (shouldQueue) {
      console.log(`📋 Queueing execution due to resource constraints: ${executionId}`)

      const queueResult = await this.performanceManager.queueExecution({
        executionId,
        nodes,
        connections,
        parameters,
        ws,
        authToken,
        resourceProfile: 'small' // Will be determined later
      })

      // Send queue status to WebSocket
      if (ws) {
        this.webSocketManager.registerConnection(executionId, ws)
        this.webSocketManager.sendLog(executionId, 'info', `Execution queued (position: ${queueResult.position})`, 'system')
        this.webSocketManager.sendLog(executionId, 'info', `Estimated wait time: ${Math.round(queueResult.estimatedWaitTime / 1000)}s`, 'system')
      }

      return {
        success: true,
        queued: true,
        executionId,
        queuePosition: queueResult.position,
        estimatedWaitTime: queueResult.estimatedWaitTime,
        message: 'Execution queued due to resource constraints'
      }
    }

    // Execute immediately
    return this.executeWorkflowImmediate(executionId, nodes, connections, parameters, ws, authToken)
  }

  /**
   * Execute workflow immediately (internal method)
   */
  async executeWorkflowImmediate(executionId, nodes, connections, parameters, ws, authToken = null) {
    let workflowConfig = null // Declare in outer scope for error handling
    let jobName = null // Declare in outer scope for error handling

    try {
      // Initialize Kubernetes client if not already done
      await this.initializeKubernetes()

      // Initialize enhanced logging for this execution
      this.loggingManager.initializeExecution(executionId)

      // Register WebSocket connection with enhanced manager
      if (ws) {
        this.webSocketManager.registerConnection(executionId, ws)
      }

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

      const jobId = this.generateJobId()
      jobName = `workflow-${jobId}`

      // Send initial log using enhanced WebSocket manager
      console.log(`🔍 WebSocket state at execution start: ${ws ? ws.readyState : 'null'}`)
      this.webSocketManager.sendLog(executionId, 'info', 'Starting workflow execution...', 'system')

      // Ensure namespace exists (only if not already initialized)
      if (!this.namespaceInitialized) {
        await this.ensureNamespaceExists()
        this.namespaceInitialized = true
      }
      this.webSocketManager.sendLog(executionId, 'info', `Namespace '${this.namespace}' verified`, 'system')

      // Check cluster resources
      await this.checkClusterResources()
      this.webSocketManager.sendLog(executionId, 'info', 'Cluster resources checked', 'system')

      // Check namespace and permissions
      try {
        const namespaceInfo = await this.k8sApi.readNamespace({ name: this.namespace })
        console.log(`✅ Namespace ${this.namespace} is accessible`)
        this.webSocketManager.sendLog(executionId, 'info', `Namespace ${this.namespace} verified`, 'system')
      } catch (nsError) {
        console.error(`❌ Namespace access issue: ${nsError.message}`)
        this.webSocketManager.sendLog(executionId, 'warning', `Namespace access warning: ${nsError.message}`, 'system')
      }

      // Test Kubernetes connectivity
      try {
        const namespaces = await this.k8sApi.listNamespace()
        const namespaceCount = namespaces?.body?.items?.length || 0
        console.log(`🔍 Kubernetes connectivity test: Found ${namespaceCount} namespaces`)
        this.webSocketManager.sendLog(executionId, 'info', `Kubernetes cluster connected (${namespaceCount} namespaces)`, 'system')

        // Test job creation capability with a simple test
        try {
          const testJobName = `test-${Date.now()}`
          const testScript = `
import time
print("TEST_LOG: Simple test job started")
print("TEST_LOG: Job is running successfully")
time.sleep(2)
print("TEST_LOG: Test job completed")
`
          console.log(`🔍 Creating test job: ${testJobName}`)
          await this.createSimpleTestJob(testJobName, testScript, executionId)
          console.log(`🔍 Test job created successfully: ${testJobName}`)
          this.sendLog(ws, 'info', `Test job creation successful: ${testJobName}`, 'system')

          // Clean up test job after a short delay
          setTimeout(async () => {
            try {
              await this.deleteJob(testJobName)
              console.log(`🔍 Test job cleaned up: ${testJobName}`)
            } catch (cleanupError) {
              console.log(`🔍 Test job cleanup failed: ${cleanupError.message}`)
            }
          }, 10000)

        } catch (testJobError) {
          console.error(`🔍 Test job creation failed: ${testJobError.message}`)
          this.webSocketManager.sendLog(executionId, 'warning', `Test job creation failed: ${testJobError.message}`, 'system')
        }

      } catch (k8sError) {
        console.error(`🔍 Kubernetes connectivity test failed: ${k8sError.message}`)
        this.webSocketManager.sendLog(executionId, 'error', `Kubernetes connectivity issue: ${k8sError.message}`, 'system')
      }

      // Validate workflow structure
      const validation = this.validateWorkflow(nodes, connections)
      if (!validation.isValid) {
        throw new Error(`Invalid workflow: ${validation.errors.join(', ')}`)
      }

      // Build execution configuration from nodes using enhanced parser
      workflowConfig = this.configParser.parseWorkflow(nodes, connections)
      const workflowSummary = this.configParser.getWorkflowSummary(workflowConfig)
      this.webSocketManager.sendLog(executionId, 'info', `Workflow configuration built: ${JSON.stringify(workflowSummary)}`, 'system')

      // Validate workflow access and permissions
      if (authToken) {
        this.webSocketManager.sendLog(executionId, 'info', 'Validating workflow access permissions...', 'system')
        const accessValidation = await this.integrationManager.validateWorkflowAccess(authToken, workflowConfig)

        if (!accessValidation.isValid) {
          const errorMsg = `Access validation failed: ${accessValidation.errors.join(', ')}`
          this.webSocketManager.sendError(executionId, new Error(errorMsg), 'system')
          throw new Error(errorMsg)
        }

        if (accessValidation.warnings.length > 0) {
          this.webSocketManager.sendLog(executionId, 'warning', `Access warnings: ${accessValidation.warnings.join(', ')}`, 'system')
        }

        this.webSocketManager.sendLog(executionId, 'info', `Access validation passed for user: ${accessValidation.user.login}`, 'system')
      }

      // Determine optimal resource profile
      const resourceProfile = this.resourceManager.determineResourceProfile(workflowConfig)
      this.webSocketManager.sendLog(executionId, 'info', `Resource profile selected: ${resourceProfile}`, 'system')

      // Check resource availability
      if (!this.resourceManager.canAllocateResources(resourceProfile)) {
        const errorMsg = `Insufficient cluster resources for ${resourceProfile} profile`
        this.webSocketManager.sendError(executionId, new Error(errorMsg), 'system')
        throw new Error(errorMsg)
      }

      // Allocate resources
      const resourceSpec = this.resourceManager.allocateResources(executionId, resourceProfile)
      this.webSocketManager.sendLog(executionId, 'info', `Resources allocated: CPU=${resourceSpec.cpu}, Memory=${resourceSpec.memory}`, 'system')

      // Send step-by-step progress updates
      this.webSocketManager.sendStepLog(executionId, 'info', '📊 Step 1: Preparing to load dataset from platform...', 'dataset')
      this.webSocketManager.sendStepLog(executionId, 'info', '🧩 Step 2: Preparing to load problem from repository...', 'problem')
      this.webSocketManager.sendStepLog(executionId, 'info', '⚙️ Step 3: Preparing to load optimizer from repository...', 'optimizer')
      this.webSocketManager.sendStepLog(executionId, 'info', '🚀 Step 4: Preparing to execute optimization...', 'execution')
      this.webSocketManager.sendStepLog(executionId, 'info', '📈 Step 5: Preparing to process results...', 'results')

      // Generate execution script using enhanced generator
      const script = this.codeGenerator.generateWorkflowScript(workflowConfig, executionId, authToken)

      // Validate script security
      const securityValidation = this.securityManager.validateExecutionEnvironment(script, executionId)
      if (!securityValidation.isValid) {
        this.resourceManager.releaseResources(executionId)
        throw new Error(`Security validation failed: ${securityValidation.errors.join(', ')}`)
      }

      if (securityValidation.warnings.length > 0) {
        this.webSocketManager.sendLog(executionId, 'warning', `Security warnings: ${securityValidation.warnings.join(', ')}`, 'system')
      }
      console.log(`📋 Generated script length: ${script.length} characters`)
      console.log(`📋 Script preview (first 500 chars): ${script.substring(0, 500)}...`)
      console.log(`📋 Using base image: ${this.baseImage}`)
      this.webSocketManager.sendLog(executionId, 'info', `Execution script generated (${script.length} characters)`, 'system')
      this.webSocketManager.sendLog(executionId, 'info', `Using container image: ${this.baseImage}`, 'system')

      // Create and execute Kubernetes job with enhanced security
      console.log(`🔧 About to create secure job: ${jobName}`)
      await this.createSecureWorkflowJob(jobName, script, executionId, resourceSpec)
      console.log(`🔧 Secure job creation completed: ${jobName}`)
      this.webSocketManager.sendLog(executionId, 'info', `Secure execution job created: ${jobName}`, 'system')

      // Verify job was created successfully
      try {
        const createdJob = await this.k8sBatchApi.readNamespacedJob({
          name: jobName,
          namespace: this.namespace
        })
        console.log(`✅ Job verification successful: ${jobName}`)
        console.log(`📋 Job status after creation:`, createdJob.body?.status)
        this.webSocketManager.sendLog(executionId, 'info', `Job verified successfully: ${jobName}`, 'system')

        // Check if pod is being created
        setTimeout(async () => {
          try {
            const podName = await this.getPodNameForJob(jobName)
            if (podName) {
              console.log(`✅ Pod created for job: ${podName}`)
              this.webSocketManager.sendLog(executionId, 'info', `Pod created: ${podName}`, 'system')
            } else {
              console.log(`⏳ Pod not yet created for job: ${jobName}`)
              this.webSocketManager.sendLog(executionId, 'info', 'Pod creation in progress...', 'system')
            }
          } catch (podCheckError) {
            console.log(`⚠️ Error checking pod creation: ${podCheckError.message}`)
          }
        }, 3000)

      } catch (verifyError) {
        console.error(`❌ Job verification failed: ${verifyError.message}`)
        this.webSocketManager.sendLog(executionId, 'error', new Error(`Job verification failed: ${verifyError.message}`), 'system')
      }

      // Send immediate test logs to verify WebSocket is working
      this.webSocketManager.sendStepLog(executionId, 'info', '📊 Step 1: Dataset loading initiated...', 'dataset')
      this.webSocketManager.sendStepLog(executionId, 'info', '🧩 Step 2: Problem loading initiated...', 'problem')
      this.webSocketManager.sendStepLog(executionId, 'info', '⚙️ Step 3: Optimizer loading initiated...', 'optimizer')

      // Add a small delay to ensure logs are sent and pod is scheduled
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Wait for pod completion and get all logs at once
      console.log(`🚀 Waiting for job completion: ${jobName}`)
      this.webSocketManager.sendLog(executionId, 'info', 'Waiting for pod to complete execution...', 'system')

      // Send additional test logs before waiting
      this.webSocketManager.sendStepLog(executionId, 'info', '🚀 Step 4: Execution monitoring started...', 'execution')
      this.webSocketManager.sendLog(executionId, 'info', `Job ${jobName} is now being monitored for completion`, 'system')

      // Use the enhanced approach: wait for completion then get all logs
      console.log(`🔍 About to call waitForJobCompletionAndRetrieveLogs for ${jobName}`)
      const result = await this.waitForJobCompletionAndRetrieveLogsEnhanced(jobName, executionId)
      console.log(`🔍 Enhanced log retrieval completed for ${jobName}:`, result ? 'success' : 'no result')

      this.webSocketManager.sendLog(executionId, 'info', 'Workflow execution completed!', 'system')

      // Send final result
      if (result) {
        this.webSocketManager.sendResult(executionId, result)
      }

      // Clean up
      await this.deleteJob(jobName)
      this.resourceManager.releaseResources(executionId)

      // Clean up logging after a delay to allow final messages to be sent
      setTimeout(() => {
        this.loggingManager.cleanupExecutionLogs(executionId)
        this.webSocketManager.unregisterConnection(executionId)
      }, 5000)

      // Update execution status
      const execution = this.activeExecutions.get(executionId)
      if (execution) {
        execution.status = 'completed'
        execution.result = result
      }

      return {
        success: true,
        executionId,
        result,
        timestamp: new Date().toISOString()
      }

    } catch (error) {
      console.error(`❌ Workflow execution failed: ${error.message}`)

      // Handle error with enhanced error manager
      const errorHandling = await this.errorHandler.handleError(error, {
        operation: 'workflow_execution',
        executionId,
        workflowConfig: workflowConfig || {},
        retryCount: 0
      })

      // Send error via WebSocket
      this.webSocketManager.sendError(executionId, error, 'system')

      // Send error recommendation
      if (errorHandling.recommendation) {
        this.webSocketManager.sendLog(executionId, 'info', `Recommendation: ${errorHandling.recommendation}`, 'system')
      }

      // Clean up on error
      try {
        if (jobName) {
          await this.deleteJob(jobName)
        }
        this.resourceManager.releaseResources(executionId)

        // Clean up logging and WebSocket after delay
        setTimeout(() => {
          this.loggingManager.cleanupExecutionLogs(executionId)
          this.webSocketManager.unregisterConnection(executionId)
        }, 10000) // 10 seconds delay for error logs

      } catch (cleanupError) {
        console.error('Cleanup error:', cleanupError)
        await this.errorHandler.handleError(cleanupError, {
          operation: 'cleanup',
          executionId
        })
      }

      // Update execution status
      const execution = this.activeExecutions.get(executionId)
      if (execution) {
        execution.status = 'failed'
        execution.error = error.message
        execution.errorHandling = errorHandling
      }

      return {
        success: false,
        executionId,
        error: error.message,
        errorType: errorHandling.error.type,
        recommendation: errorHandling.recommendation,
        retryable: errorHandling.shouldRetry,
        timestamp: new Date().toISOString()
      }
    }
  }

  /**
   * Build workflow configuration from nodes
   */
  buildWorkflowConfig(nodes, _connections) {
    const config = {}

    // Find dataset node
    const datasetNode = nodes.find(node => node.type === 'dataset')
    if (datasetNode) {
      config.dataset = {
        id: datasetNode.data.datasetId,
        name: datasetNode.data.name
      }
    }

    // Find problem node
    const problemNode = nodes.find(node => node.type === 'problem')
    if (problemNode) {
      config.problem = {
        name: problemNode.data.name,
        username: problemNode.data.username || 'default',
        params: problemNode.data.parameters || {}
      }
    }

    // Find optimizer node
    const optimizerNode = nodes.find(node => node.type === 'optimizer')
    if (optimizerNode) {
      config.optimizer = {
        name: optimizerNode.data.name,
        username: optimizerNode.data.username || 'default',
        params: optimizerNode.data.parameters || {}
      }
    }

    return config
  }

  /**
   * Validate workflow structure
   */
  validateWorkflow(nodes, _connections) {
    const errors = []

    // Check for required node types
    const hasProblem = nodes.some(node => node.type === 'problem')
    const hasOptimizer = nodes.some(node => node.type === 'optimizer')

    if (!hasProblem) {
      errors.push('Workflow must contain at least one problem node')
    }

    if (!hasOptimizer) {
      errors.push('Workflow must contain at least one optimizer node')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * Generate unique job ID
   */
  generateJobId() {
    return crypto.randomBytes(8).toString('hex')
  }

  /**
   * Send log message via WebSocket
   */
  sendLog(ws, level, message, source = 'system') {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      source
    }

    console.log(`📤 [${level.toUpperCase()}] ${message}`)
    console.log(`📤 WebSocket state: ${ws ? ws.readyState : 'null'} (1=OPEN, 0=CONNECTING, 2=CLOSING, 3=CLOSED)`)

    if (ws && ws.readyState === 1) {
      try {
        const logMessage = JSON.stringify({
          type: 'log',
          data: logEntry
        })

        console.log(`📤 Sending WebSocket log message: ${logMessage.substring(0, 200)}${logMessage.length > 200 ? '...' : ''}`)
        ws.send(logMessage)
        console.log(`📤 ✅ Log message sent successfully to WebSocket`)
      } catch (error) {
        console.error('📤 ❌ Error sending log via WebSocket:', error)
        console.error('📤 WebSocket readyState:', ws.readyState)
        console.error('📤 WebSocket error details:', error.stack)
      }
    } else {
      console.warn(`📤 ⚠️ Cannot send log - WebSocket not ready. ReadyState: ${ws ? ws.readyState : 'null'}`)
      if (ws) {
        console.warn(`📤 WebSocket object exists but readyState is: ${ws.readyState}`)
      } else {
        console.warn(`📤 WebSocket object is null/undefined`)
      }
    }
  }

  /**
   * Send step-specific log message via WebSocket
   */
  sendStepLog(ws, level, message, step, source = 'system') {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      source,
      step // Add step information for frontend processing
    }

    console.log(`📤 [${step.toUpperCase()}] [${level.toUpperCase()}] ${message}`)
    console.log(`📤 Step log WebSocket state: ${ws ? ws.readyState : 'null'}`)

    if (ws && ws.readyState === 1) {
      try {
        const logMessage = JSON.stringify({
          type: 'log',
          data: logEntry
        })

        console.log(`📤 Sending step log: ${logMessage.substring(0, 200)}${logMessage.length > 200 ? '...' : ''}`)
        ws.send(logMessage)
        console.log(`📤 ✅ Step log sent successfully to WebSocket`)
      } catch (error) {
        console.error('📤 ❌ Error sending step log via WebSocket:', error)
        console.error('📤 WebSocket readyState:', ws.readyState)
        console.error('📤 Step log error details:', error.stack)
      }
    } else {
      console.warn(`📤 ⚠️ Cannot send step log - WebSocket not ready. ReadyState: ${ws ? ws.readyState : 'null'}`)
      if (ws) {
        console.warn(`📤 Step log WebSocket object exists but readyState is: ${ws.readyState}`)
      } else {
        console.warn(`📤 Step log WebSocket object is null/undefined`)
      }
    }
  }

  /**
   * Serialize parameters for Python script with proper type handling
   */
  serializeParameters(params) {
    if (!params || Object.keys(params).length === 0) {
      return '{}'
    }

    // Custom JSON serialization that preserves numeric types
    const serialized = JSON.stringify(params, (_, value) => {
      // Ensure numbers are properly typed
      if (typeof value === 'number') {
        return value
      }
      // Handle string representations of numbers
      if (typeof value === 'string' && !isNaN(value) && !isNaN(parseFloat(value))) {
        const num = parseFloat(value)
        return Number.isInteger(num) ? parseInt(value) : num
      }
      return value
    }, 8)

    return serialized
  }

  /**
   * Generate Python execution script for the workflow
   */
  generateWorkflowScript(workflow, executionId, authToken = null) {
    const { dataset, problem, optimizer } = workflow

    let script = `
import sys
import json
import traceback
import time
import signal
import threading
import os
from datetime import datetime

# Debug: Print Python and system information
print(f"PYTHON_VERSION: {sys.version}")
print(f"PYTHON_PATH: {sys.path}")
print(f"WORKING_DIR: {os.getcwd()}")
sys.stdout.flush()

def log_message(level, message, source='system', step=None):
    """Send structured log message via stdout for Kubernetes log capture"""
    log_entry = {
        "timestamp": datetime.now().isoformat(),
        "level": level,
        "message": message,
        "source": source,
        "execution_id": "{executionId}",
        "step": step  # Add step information for frontend processing
    }

    # Only print to stdout to avoid duplicate logs
    print(f"STREAM_LOG: {json.dumps(log_entry)}")
    sys.stdout.flush()

class OutputCapture:
    """Context manager to capture stdout/stderr from user functions"""
    def __init__(self, step_name):
        self.step_name = step_name
        self.captured_output = []
        self.original_stdout = None
        self.original_stderr = None

    def __enter__(self):
        self.original_stdout = sys.stdout
        self.original_stderr = sys.stderr

        # Create custom write methods that capture and forward output
        class CaptureWriter:
            def __init__(self, original_stream, step_name, captured_output):
                self.original_stream = original_stream
                self.step_name = step_name
                self.captured_output = captured_output

            def write(self, text):
                # Always write to original stream first to maintain normal flow
                self.original_stream.write(text)

                # Capture non-empty lines for logging
                if text.strip() and not text.startswith("STREAM_LOG:"):
                    self.captured_output.append(text.strip())
                    # Create a simple log entry without recursion
                    log_entry = {
                        "timestamp": datetime.now().isoformat(),
                        "level": "info",
                        "message": f"[USER OUTPUT] {text.strip()}",
                        "source": "user_function",
                        "execution_id": "{executionId}",
                        "step": self.step_name
                    }
                    # Print directly to avoid recursion
                    print(f"STREAM_LOG: {json.dumps(log_entry)}")

            def flush(self):
                self.original_stream.flush()

        sys.stdout = CaptureWriter(self.original_stdout, self.step_name, self.captured_output)
        sys.stderr = CaptureWriter(self.original_stderr, self.step_name, self.captured_output)
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        sys.stdout = self.original_stdout
        sys.stderr = self.original_stderr

def main():
    """Main workflow execution function following qubots modular architecture"""
    start_time = time.time()

    try:
        # Immediate test logs to verify container is running
        print("CONTAINER_START: Python script execution started")
        print("CONTAINER_START: Logging system initialized")
        sys.stdout.flush()

        log_message("info", "🔧 Qubots Modular Architecture Workflow", step="system")
        log_message("info", "=" * 50, step="system")
        log_message("info", "Initializing qubots execution environment...", step="system")
        log_message("info", "Container started successfully - logs should be visible", step="system")

        # Add a small delay to ensure logs are flushed
        time.sleep(1)

        # Import qubots with dataset loading capability
        try:
            from qubots import AutoProblem, AutoOptimizer, load_dataset_from_platform
            log_message("info", "Qubots library imported successfully", step="system")
        except ImportError as e:
            log_message("error", f"Failed to import qubots library: {e}", step="system")
            raise e

        # Log environment information (os already imported)
        log_message("info", f"Python version: {sys.version}", step="system")
        log_message("info", f"Working directory: {os.getcwd()}", step="system")
        log_message("info", f"Environment variables: GITEA_URL={os.getenv('GITEA_URL', 'Not set')}", step="system")
        log_message("info", f"Environment variables: RASTION_API_URL={os.getenv('RASTION_API_URL', 'Not set')}", step="system")
`

    // Add dataset loading if present
    if (dataset) {
      script += `
        # Step 1: Load dataset from platform
        log_message("info", "📊 Step 1: Loading dataset from platform...", step="dataset")
        try:
            # Load dataset using platform API
            log_message("info", f"Loading dataset ID: ${dataset.id}", step="dataset")
            auth_token = "${authToken || 'PLACEHOLDER_TOKEN'}"
            log_message("info", f"Using auth token: {'***' + auth_token[-4:] if len(auth_token) > 4 else 'PLACEHOLDER'}", step="dataset")
            dataset_content = load_dataset_from_platform(
                token=auth_token,
                dataset_id="${dataset.id}"
            )
            log_message("info", f"✅ Dataset loaded successfully ({len(dataset_content)} characters)", step="dataset")
            log_message("info", f"📄 Dataset preview: {dataset_content[:100]}...", step="dataset")
        except Exception as e:
            log_message("error", f"⚠️  Dataset loading failed: {e}", step="dataset")
            raise e
`
    }

    // Add problem loading
    if (problem) {
      const problemParams = this.serializeParameters(problem.params)
      const problemRepo = `${problem.username || 'default'}/${problem.name}`

      script += `
        # Step ${dataset ? '2' : '1'}: Load problem from repository
        log_message("info", "🧩 Step ${dataset ? '2' : '1'}: Loading problem from repository...", step="problem")
        try:
            log_message("info", f"Loading problem: ${problemRepo}", step="problem")

            # Build problem parameters with dataset content if available
            problem_params = ${problemParams}
            ${dataset ? `
            # Add pre-loaded dataset content to problem parameters
            if 'dataset_content' not in problem_params:
                problem_params['dataset_content'] = dataset_content
            ` : ''}

            log_message("info", f"Problem parameters configured: {list(problem_params.keys())}", step="problem")

            problem = AutoProblem.from_repo(
                repo_id="${problemRepo}",
                override_params=problem_params
            )
            log_message("info", f"✅ Problem loaded: {problem.metadata.name}", step="problem")
            log_message("info", f"📋 Problem type: {problem.metadata.problem_type.value}", step="problem")
            log_message("info", f"🎯 Objective: {problem.metadata.objective_type.value}", step="problem")
        except Exception as e:
            log_message("error", f"⚠️  Problem loading failed: {e}", step="problem")
            log_message("error", f"Problem repo: ${problemRepo}", step="problem")
            log_message("error", f"Problem params: {problem_params}", step="problem")
            import traceback
            log_message("error", f"Traceback: {traceback.format_exc()}", step="problem")
            raise e
`
    }

    // Add optimizer loading and execution
    if (optimizer) {
      const optimizerParams = this.serializeParameters(optimizer.params)
      const optimizerRepo = `${optimizer.username || 'default'}/${optimizer.name}`

      script += `
        # Step ${dataset && problem ? '3' : problem ? '2' : '1'}: Load optimizer from repository
        log_message("info", "⚙️  Step ${dataset && problem ? '3' : problem ? '2' : '1'}: Loading optimizer from repository...", step="optimizer")
        try:
            log_message("info", f"Loading optimizer: ${optimizerRepo}", step="optimizer")

            # Build optimizer parameters
            optimizer_params = ${optimizerParams}
            log_message("info", f"Optimizer parameters configured: {list(optimizer_params.keys())}", step="optimizer")

            optimizer = AutoOptimizer.from_repo(
                repo_id="${optimizerRepo}",
                override_params=optimizer_params
            )
            log_message("info", f"✅ Optimizer loaded: {optimizer.metadata.name}", step="optimizer")
            log_message("info", f"🔧 Algorithm type: {optimizer.metadata.optimizer_type.value}", step="optimizer")
            log_message("info", f"👥 Family: {optimizer.metadata.optimizer_family.value}", step="optimizer")
        except Exception as e:
            log_message("error", f"⚠️  Optimizer loading failed: {e}", step="optimizer")
            log_message("error", f"Optimizer repo: ${optimizerRepo}", step="optimizer")
            log_message("error", f"Optimizer params: {optimizer_params}", step="optimizer")
            import traceback
            log_message("error", f"Traceback: {traceback.format_exc()}", step="optimizer")
            raise e

        # Step ${dataset && problem ? '4' : problem ? '3' : '2'}: Execute optimization
        log_message("info", "🚀 Step ${dataset && problem ? '4' : problem ? '3' : '2'}: Running optimization...", step="execution")
        try:
            log_message("info", "Starting optimization execution...", step="execution")
            log_message("info", f"Problem type: {type(problem).__name__}", step="execution")
            log_message("info", f"Optimizer type: {type(optimizer).__name__}", step="execution")

            # Add timeout and progress monitoring
            def timeout_handler(signum, frame):
                raise TimeoutError("Optimization execution timed out after 300 seconds")

            # Progress monitoring thread
            optimization_running = threading.Event()
            optimization_running.set()

            def progress_monitor():
                count = 0
                while optimization_running.is_set():
                    time.sleep(10)  # Check every 10 seconds
                    count += 10
                    if optimization_running.is_set():
                        log_message("info", f"⏱️ Optimization running for {count} seconds...", step="execution")

            # Start progress monitor
            monitor_thread = threading.Thread(target=progress_monitor, daemon=True)
            monitor_thread.start()

            # Set timeout for optimization (5 minutes)
            signal.signal(signal.SIGALRM, timeout_handler)
            signal.alarm(300)

            try:
                # Capture user function output during optimization
                log_message("info", "📡 Starting output capture for optimization...", step="execution")
                with OutputCapture("execution") as capture:
                    log_message("info", "🔄 Calling optimizer.optimize(problem)...", step="execution")
                    result = optimizer.optimize(problem)
                    log_message("info", "🔄 optimizer.optimize() returned successfully", step="execution")

                # Stop progress monitoring
                optimization_running.clear()

                # Cancel timeout
                signal.alarm(0)

                log_message("info", "✅ Optimization completed successfully!", step="execution")
                log_message("info", f"📝 Captured {len(capture.captured_output)} lines of user output", step="execution")

            except TimeoutError as te:
                optimization_running.clear()
                signal.alarm(0)
                log_message("error", f"⏰ Optimization timed out: {te}", step="execution")
                raise te
            except Exception as opt_error:
                optimization_running.clear()
                signal.alarm(0)
                log_message("error", f"💥 Optimization failed: {opt_error}", step="execution")
                log_message("error", f"💥 Error type: {type(opt_error).__name__}", step="execution")
                import traceback
                log_message("error", f"💥 Traceback: {traceback.format_exc()}", step="execution")
                raise opt_error

            # Process results
            execution_time = time.time() - start_time

            output = {
                "success": True,
                "best_value": getattr(result, 'best_value', None),
                "best_solution": getattr(result, 'best_solution', None),
                "runtime_seconds": getattr(result, 'runtime_seconds', execution_time),
                "iterations": getattr(result, 'iterations', None),
                "termination_reason": getattr(result, 'termination_reason', 'completed'),
                "execution_time": execution_time
            }

            log_message("info", f"🏆 Best value: {output['best_value']}", step="results")
            log_message("info", f"⏱️  Runtime: {output['runtime_seconds']:.3f} seconds", step="results")
            log_message("info", f"🔄 Iterations: {output['iterations']}", step="results")
            log_message("info", f"📊 Solution: {output['best_solution']}", step="results")
            log_message("info", "=" * 50, step="results")

            # Output final result
            print("WORKFLOW_RESULT_START")
            print(json.dumps(output, indent=2))
            print("WORKFLOW_RESULT_END")
        except Exception as e:
            log_message("error", f"⚠️  Optimization execution failed: {e}", step="execution")
            raise e
`
    }

    // Add the main exception handler and script footer
    script += `
    except Exception as e:
        execution_time = time.time() - start_time
        error_msg = str(e)
        error_trace = traceback.format_exc()

        log_message("error", f"💥 MAIN EXECUTION FAILED: {error_msg}", step="system")
        log_message("error", f"💥 Error type: {type(e).__name__}", step="system")
        log_message("error", f"💥 Full traceback: {error_trace}", step="system")

        # Also print to stdout for immediate visibility
        print(f"EXECUTION_ERROR: {error_msg}")
        print(f"ERROR_TYPE: {type(e).__name__}")
        print(f"TRACEBACK: {error_trace}")
        sys.stdout.flush()

        error_output = {
            "success": False,
            "error_message": error_msg,
            "error_type": "execution_error",
            "execution_time": execution_time,
            "error_trace": error_trace
        }

        print("WORKFLOW_RESULT_START")
        print(json.dumps(error_output, indent=2))
        print("WORKFLOW_RESULT_END")

        sys.exit(1)

if __name__ == "__main__":
    main()
`

    // Replace executionId placeholder with actual value
    return script.replace(/{executionId}/g, executionId)
  }

  /**
   * Create Kubernetes job for workflow execution
   */
  async createWorkflowJob(jobName, script, executionId) {
    console.log(`🔧 Creating Kubernetes job: ${jobName} in namespace: ${this.namespace}`)

    // Validate inputs
    if (!this.namespace || typeof this.namespace !== 'string') {
      throw new Error(`Namespace is not defined or invalid: ${this.namespace} (type: ${typeof this.namespace})`)
    }
    if (!jobName || typeof jobName !== 'string') {
      throw new Error(`Job name is not defined or invalid: ${jobName}`)
    }
    if (!script || typeof script !== 'string') {
      throw new Error(`Script is not defined or invalid`)
    }

    const job = {
      metadata: {
        name: jobName,
        namespace: this.namespace,
        labels: {
          'app': 'workflow-execution',
          'execution-id': executionId,
          'type': 'optimization-job'
        }
      },
      spec: {
        template: {
          metadata: {
            labels: {
              'app': 'workflow-execution',
              'execution-id': executionId
            }
          },
          spec: {
            containers: [{
              name: 'workflow-executor',
              image: this.baseImage,
              command: ['python3', '-u', '-c'],
              args: [script],
              env: [
                { name: 'EXECUTION_ID', value: executionId },
                { name: 'PYTHONUNBUFFERED', value: '1' },
                { name: 'PYTHONIOENCODING', value: 'utf-8' },
                { name: 'GITEA_URL', value: process.env.GITEA_URL || 'https://hub.rastion.com' },
                { name: 'RASTION_API_URL', value: process.env.RASTION_API_URL || 'https://hub.rastion.com/api/v1' }
              ],
              resources: {
                limits: {
                  cpu: '1',
                  memory: '2Gi'
                },
                requests: {
                  cpu: '250m',
                  memory: '512Mi'
                }
              }
            }],
            restartPolicy: 'Never'
          }
        },
        backoffLimit: 1,
        activeDeadlineSeconds: this.jobTimeout,
        ttlSecondsAfterFinished: 600 // 10 minutes to allow log streaming
      }
    }

    try {
      console.log(`📋 Job manifest prepared for namespace: ${this.namespace}`)
      console.log(`📋 Using image: ${this.baseImage}`)
      console.log(`📋 Job timeout: ${this.jobTimeout}s`)
      console.log(`📋 Job labels:`, JSON.stringify(job.metadata.labels, null, 2))
      console.log(`📋 Pod template labels:`, JSON.stringify(job.spec.template.metadata.labels, null, 2))

      const result = await this.k8sBatchApi.createNamespacedJob({ namespace: this.namespace, body: job })
      console.log(`✅ Job ${jobName} created successfully in namespace ${this.namespace}`)

      // Log the job UID for tracking
      console.log(`📋 Job UID: ${result.body?.metadata?.uid}`)
      console.log(`📋 Job name: ${result.body?.metadata?.name}`)

      // Wait a moment and then verify the job was created
      setTimeout(async () => {
        try {
          const verifyJob = await this.k8sBatchApi.readNamespacedJob({ name: jobName, namespace: this.namespace })
          console.log(`✅ Job verification successful: ${jobName}`)
          console.log(`📋 Job status:`, verifyJob.body?.status)
        } catch (verifyError) {
          console.error(`❌ Job verification failed: ${verifyError.message}`)
        }
      }, 2000)

      return result
    } catch (error) {
      console.error(`❌ Failed to create job ${jobName} in namespace ${this.namespace}:`, error.message)
      console.error(`🔍 Error details:`, error.response?.body || error)

      // Additional debugging for common issues
      if (error.response?.statusCode === 403) {
        console.error(`🔍 Permission denied - check RBAC permissions for namespace ${this.namespace}`)
      } else if (error.response?.statusCode === 404) {
        console.error(`🔍 Namespace ${this.namespace} not found - will be created automatically`)
      } else if (error.response?.body?.message) {
        console.error(`🔍 Kubernetes API error: ${error.response.body.message}`)
      }

      throw error
    }
  }

  /**
   * Wait for job completion with log streaming
   */
  async waitForJobCompletion(jobName, executionId, ws) {
    const maxWaitTime = this.jobTimeout * 1000
    const pollInterval = 2000
    let elapsedTime = 0
    let result = null
    let podName = null

    // Log streaming already started in executeWorkflow, just monitor completion

    while (elapsedTime < maxWaitTime) {
      try {
        // Try to get job status first
        let jobCompleted = false
        let jobFailed = false

        try {
          const job = await this.k8sBatchApi.readNamespacedJob({ name: jobName, namespace: this.namespace })
          const jobStatus = job.body?.status

          if (jobStatus?.succeeded) {
            console.log(`✅ Job ${jobName} completed successfully via job status`)
            jobCompleted = true
          } else if (jobStatus?.failed) {
            console.log(`❌ Job ${jobName} failed via job status`)
            jobFailed = true
          } else {
            console.log(`⏳ Job ${jobName} status: active=${jobStatus?.active || 0}, succeeded=${jobStatus?.succeeded || 0}, failed=${jobStatus?.failed || 0}`)
          }
        } catch (jobError) {
          if (jobError.response?.statusCode === 404) {
            console.log(`⚠️ Job ${jobName} not found, checking pod status instead...`)
          } else {
            console.log(`⚠️ Error reading job status: ${jobError.message}`)
          }
        }

        // If job status is not available, check pod status
        if (!jobCompleted && !jobFailed) {
          try {
            if (!podName) {
              podName = await this.getPodNameForJob(jobName)
            }

            if (podName) {
              const pod = await this.k8sApi.readNamespacedPod({ name: podName, namespace: this.namespace })
              const podStatus = pod.body?.status
              const phase = podStatus?.phase

              console.log(`📋 Pod ${podName} status: phase=${phase}`)

              if (phase === 'Succeeded') {
                console.log(`✅ Job ${jobName} completed successfully via pod status`)
                jobCompleted = true
              } else if (phase === 'Failed') {
                console.log(`❌ Job ${jobName} failed via pod status`)
                jobFailed = true
              } else {
                console.log(`⏳ Pod ${podName} still running (phase: ${phase})`)
              }
            } else {
              console.log(`⏳ Pod not yet available for job ${jobName}, waiting for pod creation...`)
              this.webSocketManager.sendStepLog(executionId, 'info', 'Waiting for pod to be created...', 'system')
            }
          } catch (podError) {
            console.log(`⚠️ Error reading pod status: ${podError.message}`)
          }
        }

        // Handle completion
        if (jobCompleted) {
          result = await this.extractJobResult(jobName)
          break
        } else if (jobFailed) {
          const logs = await this.getJobLogs(jobName)
          throw new Error(`Job failed: ${logs}`)
        }

        await new Promise(resolve => setTimeout(resolve, pollInterval))
        elapsedTime += pollInterval

      } catch (error) {
        console.error(`❌ Error in waitForJobCompletion: ${error.message}`)
        await new Promise(resolve => setTimeout(resolve, pollInterval))
        elapsedTime += pollInterval
      }
    }

    if (!result) {
      // Final attempt: check if execution completed but status detection failed
      console.log(`⏰ Job ${jobName} timed out, making final attempt to extract results...`)
      try {
        const logs = await this.getJobLogs(jobName)
        if (logs && logs.includes('WORKFLOW_RESULT_START') && logs.includes('WORKFLOW_RESULT_END')) {
          console.log(`🎯 Found WORKFLOW_RESULT markers in final check, extracting result`)
          this.sendLog(ws, 'info', 'Timeout reached but execution completed! Extracting results...', 'system')
          await this.getAllLogsAndSend(jobName, executionId, ws)
          result = await this.extractJobResult(jobName)
          if (result) {
            console.log(`✅ Successfully extracted result on timeout`)
            return result
          }
        }
      } catch (finalError) {
        console.log(`⚠️ Final result extraction failed: ${finalError.message}`)
      }

      throw new Error(`Job ${jobName} timed out after ${this.jobTimeout} seconds`)
    }

    return result
  }

  /**
   * Wait for job completion and get all logs at once (no streaming)
   */
  async waitForJobCompletionAndGetLogs(jobName, executionId, ws) {
    const maxWaitTime = this.jobTimeout * 1000
    const pollInterval = 2000
    let elapsedTime = 0
    let result = null
    let podName = null
    let statusUpdateCounter = 0

    console.log(`⏳ Waiting for job completion: ${jobName}`)

    while (elapsedTime < maxWaitTime) {
      try {
        // Send periodic status updates to user
        statusUpdateCounter++
        if (statusUpdateCounter % 5 === 0) { // Every 10 seconds (5 * 2 second intervals)
          const minutes = Math.floor(elapsedTime / 60000)
          const seconds = Math.floor((elapsedTime % 60000) / 1000)
          this.sendLog(ws, 'info', `Still waiting for execution to complete... (${minutes}m ${seconds}s elapsed)`, 'system')

          // After 30 seconds, start checking logs more aggressively for completion markers
          if (elapsedTime > 30000) {
            try {
              const logs = await this.getJobLogs(jobName)
              if (logs && logs.includes('WORKFLOW_RESULT_START') && logs.includes('WORKFLOW_RESULT_END')) {
                console.log(`🎯 Found WORKFLOW_RESULT markers after ${elapsedTime/1000}s, forcing completion`)
                this.sendLog(ws, 'info', 'Execution completed! Processing results...', 'system')
                await this.getAllLogsAndSend(jobName, executionId, ws)
                result = await this.extractJobResult(jobName)
                console.log(`✅ Forced completion - extracted result:`, result ? 'Success' : 'No result')
                break
              }
            } catch (logCheckError) {
              console.log(`⚠️ Could not check logs for completion markers: ${logCheckError.message}`)
            }
          }
        }

        // Try to get job status first
        let jobCompleted = false
        let jobFailed = false

        try {
          const job = await this.k8sBatchApi.readNamespacedJob({ name: jobName, namespace: this.namespace })
          const jobStatus = job.body?.status

          console.log(`🔍 Job ${jobName} full status:`, JSON.stringify(jobStatus, null, 2))

          if (jobStatus?.succeeded && jobStatus.succeeded > 0) {
            console.log(`✅ Job ${jobName} completed successfully (succeeded: ${jobStatus.succeeded})`)
            jobCompleted = true
          } else if (jobStatus?.failed && jobStatus.failed > 0) {
            console.log(`❌ Job ${jobName} failed (failed: ${jobStatus.failed})`)
            jobFailed = true
          } else {
            console.log(`⏳ Job ${jobName} status: active=${jobStatus?.active || 0}, succeeded=${jobStatus?.succeeded || 0}, failed=${jobStatus?.failed || 0}`)
          }
        } catch (jobError) {
          if (jobError.response?.statusCode === 404) {
            console.log(`⚠️ Job ${jobName} not found, checking pod status instead...`)
          } else {
            console.log(`⚠️ Error reading job status: ${jobError.message}`)
            console.log(`⚠️ Job error details:`, jobError.response?.body || jobError)
          }
        }

        // If job status is not available or inconclusive, check pod status
        if (!jobCompleted && !jobFailed) {
          try {
            if (!podName) {
              podName = await this.getPodNameForJob(jobName)
              if (podName) {
                console.log(`🔍 Found pod for job: ${podName}`)
              }
            }

            if (podName) {
              const pod = await this.k8sApi.readNamespacedPod({ name: podName, namespace: this.namespace })
              const podStatus = pod.body?.status
              const phase = podStatus?.phase
              const containerStatuses = podStatus?.containerStatuses || []

              console.log(`📋 Pod ${podName} status: phase=${phase}`)
              console.log(`📋 Pod ${podName} full status:`, JSON.stringify(podStatus, null, 2))

              // Check container statuses for more detailed info
              if (containerStatuses.length > 0) {
                containerStatuses.forEach((container, index) => {
                  console.log(`📦 Container ${index}: ${container.name}, ready=${container.ready}, restartCount=${container.restartCount}`)
                  if (container.state) {
                    console.log(`📦 Container state:`, JSON.stringify(container.state, null, 2))

                    // Check if container has terminated successfully
                    if (container.state.terminated && container.state.terminated.exitCode === 0) {
                      console.log(`✅ Container ${container.name} terminated successfully (exit code 0)`)
                      jobCompleted = true
                    } else if (container.state.terminated && container.state.terminated.exitCode !== 0) {
                      console.log(`❌ Container ${container.name} terminated with error (exit code ${container.state.terminated.exitCode})`)
                      jobFailed = true
                    }
                  }
                })
              }

              if (phase === 'Succeeded') {
                console.log(`✅ Job ${jobName} completed successfully via pod status`)
                jobCompleted = true
              } else if (phase === 'Failed') {
                console.log(`❌ Job ${jobName} failed via pod status`)
                jobFailed = true
              } else if (phase === 'Running') {
                console.log(`⏳ Pod ${podName} still running (phase: ${phase})`)
              } else if (phase === 'Pending') {
                console.log(`⏳ Pod ${podName} is pending (phase: ${phase})`)
              } else {
                console.log(`⏳ Pod ${podName} in unknown phase: ${phase}`)
              }
            } else {
              console.log(`⏳ Pod not yet available for job ${jobName}, waiting for pod creation...`)
              this.webSocketManager.sendStepLog(executionId, 'info', 'Waiting for pod to be created...', 'system')
            }
          } catch (podError) {
            console.log(`⚠️ Error reading pod status: ${podError.message}`)
          }
        }

        // Handle completion
        if (jobCompleted) {
          // Get all logs at once and send them
          console.log(`📝 Getting all logs for completed job: ${jobName}`)
          this.sendLog(ws, 'info', 'Job completed! Retrieving execution logs...', 'system')
          await this.getAllLogsAndSend(jobName, executionId, ws)

          result = await this.extractJobResult(jobName)
          console.log(`✅ Extracted result for job ${jobName}:`, result ? 'Success' : 'No result')
          break
        } else if (jobFailed) {
          // Get all logs for failed job too
          console.log(`📝 Getting all logs for failed job: ${jobName}`)
          this.sendLog(ws, 'error', 'Job failed! Retrieving execution logs...', 'system')
          await this.getAllLogsAndSend(jobName, executionId, ws)

          const logs = await this.getJobLogs(jobName)
          throw new Error(`Job failed: ${logs}`)
        }

        // Additional check: if we have a pod name, check if it has WORKFLOW_RESULT markers in logs
        if (!jobCompleted && !jobFailed && podName) {
          try {
            const logs = await this.getJobLogs(jobName)
            if (logs && logs.includes('WORKFLOW_RESULT_START') && logs.includes('WORKFLOW_RESULT_END')) {
              console.log(`🎯 Found WORKFLOW_RESULT markers in logs, treating as completed`)
              this.sendLog(ws, 'info', 'Execution completed! Processing results...', 'system')
              await this.getAllLogsAndSend(jobName, executionId, ws)
              result = await this.extractJobResult(jobName)
              console.log(`✅ Extracted result from logs:`, result ? 'Success' : 'No result')
              break
            }
          } catch (logCheckError) {
            console.log(`⚠️ Could not check logs for completion markers: ${logCheckError.message}`)
          }
        }

        // If we've been waiting for a while and have a pod, try to get partial logs
        if (elapsedTime > 30000 && podName && elapsedTime % 30000 < pollInterval) { // Every 30 seconds after first 30 seconds
          console.log(`📝 Getting partial logs for long-running job: ${jobName}`)
          this.sendLog(ws, 'info', 'Getting partial execution logs...', 'system')
          try {
            await this.getAllLogsAndSend(jobName, executionId, ws)
          } catch (partialLogError) {
            console.log(`⚠️ Could not get partial logs: ${partialLogError.message}`)
          }
        }

        await new Promise(resolve => setTimeout(resolve, pollInterval))
        elapsedTime += pollInterval

        // Warn user if taking too long
        if (elapsedTime > 60000 && elapsedTime % 60000 < pollInterval) { // Every minute after first minute
          const minutes = Math.floor(elapsedTime / 60000)
          this.sendLog(ws, 'warning', `Execution is taking longer than expected (${minutes} minutes). This may indicate a complex optimization problem.`, 'system')
        }

      } catch (error) {
        console.error(`❌ Error in waitForJobCompletionAndGetLogs: ${error.message}`)
        await new Promise(resolve => setTimeout(resolve, pollInterval))
        elapsedTime += pollInterval
      }
    }

    if (!result) {
      // Before timing out, try to get any available logs
      console.log(`⚠️ Job ${jobName} timed out, attempting to get any available logs...`)
      this.sendLog(ws, 'warning', `Execution timed out after ${this.jobTimeout} seconds. Attempting to retrieve any available logs...`, 'system')

      try {
        await this.getAllLogsAndSend(jobName, executionId, ws)
      } catch (logError) {
        console.error(`❌ Failed to get logs on timeout: ${logError.message}`)
      }

      throw new Error(`Job ${jobName} timed out after ${this.jobTimeout} seconds`)
    }

    return result
  }

  /**
   * Get all logs from a job and send them via WebSocket
   */
  async getAllLogsAndSend(jobName, executionId, ws) {
    try {
      console.log(`📝 Retrieving all logs for job: ${jobName}`)
      this.sendLog(ws, 'info', `Retrieving logs for job: ${jobName}`, 'system')

      // Get pod name for the job
      const podName = await this.getPodNameForJob(jobName)
      if (!podName) {
        console.log(`⚠️ No pod found for job ${jobName}`)
        this.sendLog(ws, 'warning', 'No pod found for execution - logs may not be available', 'system')
        return
      }

      console.log(`📝 Getting logs from pod: ${podName}`)
      this.sendLog(ws, 'info', `Getting logs from pod: ${podName}`, 'system')

      // Try multiple approaches to get logs
      let logs = null
      const logAttempts = [
        // Attempt 1: Get all logs
        async () => {
          console.log(`📝 Attempt 1: Getting all logs from pod ${podName}`)
          return await this.k8sApi.readNamespacedPodLog({
            name: podName,
            namespace: this.namespace,
            follow: false,
            tailLines: 1000
          })
        },
        // Attempt 2: Get logs without tail limit
        async () => {
          console.log(`📝 Attempt 2: Getting logs without tail limit from pod ${podName}`)
          return await this.k8sApi.readNamespacedPodLog({
            name: podName,
            namespace: this.namespace,
            follow: false
          })
        },
        // Attempt 3: Get logs from previous container if current failed
        async () => {
          console.log(`📝 Attempt 3: Getting previous logs from pod ${podName}`)
          return await this.k8sApi.readNamespacedPodLog({
            name: podName,
            namespace: this.namespace,
            follow: false,
            previous: true
          })
        }
      ]

      for (let i = 0; i < logAttempts.length; i++) {
        try {
          console.log(`📝 Trying log retrieval attempt ${i + 1}`)
          this.sendLog(ws, 'info', `Trying log retrieval method ${i + 1}...`, 'system')

          const logResponse = await logAttempts[i]()
          logs = logResponse.body || logResponse
          if (logs && logs.trim()) {
            console.log(`📝 Successfully retrieved logs using attempt ${i + 1}: ${logs.length} characters`)
            this.sendLog(ws, 'info', `Successfully retrieved ${logs.length} characters of logs`, 'system')
            break
          } else {
            console.log(`📝 Attempt ${i + 1} returned empty logs`)
            this.sendLog(ws, 'info', `Attempt ${i + 1} returned empty logs`, 'system')
          }
        } catch (attemptError) {
          console.log(`📝 Attempt ${i + 1} failed: ${attemptError.message}`)
          this.sendLog(ws, 'warning', `Attempt ${i + 1} failed: ${attemptError.message}`, 'system')
        }
      }

      if (logs && logs.trim()) {
        console.log(`📝 Processing ${logs.length} characters of logs`)
        this.sendLog(ws, 'info', '=== EXECUTION LOGS START ===', 'system')

        // Just send all logs as simple text, line by line
        const lines = logs.split('\n')
        for (const line of lines) {
          if (line.trim()) {
            // Send each line as a simple info message
            this.sendLog(ws, 'info', line.trim(), 'execution')
          }
        }

        this.sendLog(ws, 'info', '=== EXECUTION LOGS END ===', 'system')
      } else {
        console.log(`📝 No logs found for job ${jobName}`)
        this.sendLog(ws, 'warning', 'No execution logs available - the pod may not have started properly', 'system')
      }

    } catch (error) {
      console.error(`❌ Error getting logs for job ${jobName}: ${error.message}`)
      this.sendLog(ws, 'error', `Could not retrieve execution logs: ${error.message}`, 'system')
    }
  }

  /**
   * Start log streaming using Kubernetes Job Logs API (most robust approach)
   * @deprecated - No longer used. Using waitForJobCompletionAndGetLogs instead.
   */
  async startLogStreaming(jobName, executionId, ws) {
    try {
      console.log(`🔍 Starting robust log streaming for job: ${jobName}, execution: ${executionId}`)

      // Use real-time streaming approach for better log capture
      this.streamJobLogsRealTime(jobName, executionId, ws)

    } catch (error) {
      console.error('❌ Error starting log streaming:', error)
      this.sendLog(ws, 'warning', `Log streaming error: ${error.message}`, 'system')
    }
  }

  /**
   * Stream logs using real-time Kubernetes streaming (follow=true)
   */
  async streamJobLogsRealTime(jobName, executionId, ws) {
    console.log(`📡 Starting real-time log streaming for job: ${jobName}`)
    this.sendLog(ws, 'info', `Real-time log stream established for job: ${jobName}`, 'system')

    // Store streaming state
    const streamingKey = `${executionId}_${jobName}`
    this.activeLogStreams = this.activeLogStreams || new Map()
    this.activeLogStreams.set(streamingKey, { isStreaming: true })

    let isStreaming = true
    let logStream = null

    // Stop streaming when WebSocket closes
    ws.on('close', () => {
      console.log(`🔌 WebSocket closed, stopping log streaming for ${jobName}`)
      isStreaming = false
      if (logStream) {
        logStream.destroy()
      }
      this.activeLogStreams.delete(streamingKey)
    })

    // Wait for pod to be created and start streaming
    this.waitForPodAndStream(jobName, executionId, ws, isStreaming, streamingKey)
  }

  /**
   * Wait for pod creation and start real-time log streaming
   */
  async waitForPodAndStream(jobName, executionId, ws, isStreaming, streamingKey) {
    const maxWaitTime = 60000 // 1 minute
    const checkInterval = 2000 // 2 seconds
    let waitTime = 0

    const checkForPod = async () => {
      if (!isStreaming || ws.readyState !== 1) {
        console.log(`🛑 Stopping pod wait for ${jobName}`)
        return
      }

      try {
        // First, check if the job exists and its status
        await this.debugJobStatus(jobName)

        const pods = await this.getAllPodsForJob(jobName)

        if (pods.length === 0) {
          waitTime += checkInterval
          if (waitTime < maxWaitTime) {
            console.log(`🔍 Waiting for pod creation for job ${jobName} (${waitTime/1000}s)`)
            // Also check for any events related to the job
            await this.debugJobEvents(jobName)
            setTimeout(checkForPod, checkInterval)
            return
          } else {
            console.log(`⏰ Timeout waiting for pod creation for job ${jobName}`)
            // Get detailed debugging info before giving up
            await this.debugJobStatus(jobName)
            await this.debugJobEvents(jobName)
            this.sendLog(ws, 'warning', `Timeout waiting for pod creation - check Kubernetes cluster resources`, 'system')
            return
          }
        }

        // Found pods, start streaming from the first available one
        const pod = pods[0]
        const podName = pod.metadata.name
        const podPhase = pod.status?.phase
        console.log(`✅ Found pod ${podName} for job ${jobName} (phase: ${podPhase}), starting real-time streaming`)

        this.startRealTimeLogStream(podName, executionId, ws, isStreaming, streamingKey)

      } catch (error) {
        console.error(`❌ Error checking for pods: ${error.message}`)
        if (waitTime < maxWaitTime) {
          setTimeout(checkForPod, checkInterval)
        }
      }
    }

    checkForPod()
  }

  /**
   * Debug job status for troubleshooting
   */
  async debugJobStatus(jobName) {
    try {
      console.log(`🔍 Debugging job status for: ${jobName}`)
      const job = await this.k8sBatchApi.readNamespacedJob({ name: jobName, namespace: this.namespace })
      const jobStatus = job.body?.status

      console.log(`📋 Job ${jobName} status:`, {
        active: jobStatus?.active || 0,
        succeeded: jobStatus?.succeeded || 0,
        failed: jobStatus?.failed || 0,
        conditions: jobStatus?.conditions || []
      })

      if (jobStatus?.conditions) {
        for (const condition of jobStatus.conditions) {
          console.log(`📋 Job condition: ${condition.type} = ${condition.status} (${condition.reason}: ${condition.message})`)
        }
      }
    } catch (error) {
      console.error(`❌ Error debugging job status: ${error.message}`)
    }
  }

  /**
   * Debug job events for troubleshooting
   */
  async debugJobEvents(jobName) {
    try {
      console.log(`🔍 Checking events for job: ${jobName}`)
      const events = await this.k8sApi.listNamespacedEvent({
        namespace: this.namespace,
        fieldSelector: `involvedObject.name=${jobName}`
      })

      if (events.body?.items && events.body.items.length > 0) {
        console.log(`📋 Found ${events.body.items.length} events for job ${jobName}:`)
        for (const event of events.body.items) {
          console.log(`📋 Event: ${event.type} - ${event.reason}: ${event.message}`)
        }
      } else {
        console.log(`📋 No events found for job ${jobName}`)
      }
    } catch (error) {
      console.error(`❌ Error checking job events: ${error.message}`)
    }
  }

  /**
   * Start real-time log streaming from a specific pod using follow=true
   */
  async startRealTimeLogStream(podName, executionId, ws, isStreaming, streamingKey) {
    console.log(`📡 Starting real-time log stream from pod: ${podName}`)

    try {
      // Try different container names
      const containerNames = ['workflow-executor', 'main', 'app']
      let streamStarted = false

      for (const containerName of containerNames) {
        if (!isStreaming || ws.readyState !== 1) break

        try {
          console.log(`🔍 Attempting to stream logs from container: ${containerName}`)

          const logStream = await this.k8sApi.readNamespacedPodLog({
            name: podName,
            namespace: this.namespace,
            container: containerName,
            follow: true, // Enable real-time streaming
            tailLines: 100 // Get last 100 lines to start
          })

          console.log(`✅ Successfully started log stream from ${podName}:${containerName}`)
          streamStarted = true

          // Handle the stream
          this.handleLogStream(logStream, executionId, ws, isStreaming, streamingKey, podName)
          break

        } catch (containerError) {
          if (containerError.response?.statusCode === 400) {
            console.log(`⚠️ Container ${containerName} not found, trying next...`)
            continue
          }
          throw containerError
        }
      }

      // If no named container worked, try default container
      if (!streamStarted && isStreaming && ws.readyState === 1) {
        try {
          console.log(`🔍 Attempting to stream logs from default container`)

          const logStream = await this.k8sApi.readNamespacedPodLog({
            name: podName,
            namespace: this.namespace,
            follow: true,
            tailLines: 100
          })

          console.log(`✅ Successfully started log stream from ${podName} (default container)`)
          this.handleLogStream(logStream, executionId, ws, isStreaming, streamingKey, podName)

        } catch (defaultError) {
          console.error(`❌ Failed to stream from default container: ${defaultError.message}`)
          this.sendLog(ws, 'warning', `Failed to establish log stream: ${defaultError.message}`, 'system')
        }
      }

    } catch (error) {
      console.error(`❌ Error starting real-time log stream: ${error.message}`)
      this.sendLog(ws, 'warning', `Log streaming error: ${error.message}`, 'system')
    }
  }

  /**
   * Handle the real-time log stream
   */
  handleLogStream(logStream, executionId, ws, isStreaming, streamingKey, podName) {
    console.log(`📡 Handling log stream for pod: ${podName}`)

    logStream.on('data', (chunk) => {
      if (!isStreaming || ws.readyState !== 1) {
        logStream.destroy()
        return
      }

      const logData = chunk.toString()
      const lines = logData.split('\n')

      for (const line of lines) {
        if (line.trim()) {
          console.log(`📝 Real-time log: ${line.substring(0, 100)}${line.length > 100 ? '...' : ''}`)
          this.processLogLine(line.trim(), executionId, ws)
        }
      }
    })

    logStream.on('error', (error) => {
      console.error(`❌ Log stream error for pod ${podName}:`, error.message)
      if (isStreaming && ws.readyState === 1) {
        this.sendLog(ws, 'warning', `Log stream error: ${error.message}`, 'system')
      }
    })

    logStream.on('end', () => {
      console.log(`🏁 Log stream ended for pod ${podName}`)
      if (isStreaming && ws.readyState === 1) {
        this.sendLog(ws, 'info', `Log stream completed for pod: ${podName}`, 'system')
      }
    })

    // Store stream reference for cleanup
    if (this.activeLogStreams.has(streamingKey)) {
      this.activeLogStreams.get(streamingKey).stream = logStream
    }
  }

  /**
   * Stream logs using Kubernetes Job API (handles pod discovery automatically) - LEGACY POLLING METHOD
   */
  async streamJobLogs(jobName, executionId, ws) {
    const maxPolls = 600 // 10 minutes
    const pollInterval = 1000 // 1 second
    let pollCount = 0
    let lastLogLength = 0
    let isStreaming = true

    console.log(`📡 Starting job-based log streaming for: ${jobName}`)
    this.sendLog(ws, 'info', `Log stream established for job: ${jobName}`, 'system')

    // Store streaming state
    const streamingKey = `${executionId}_${jobName}`
    this.activeLogStreams = this.activeLogStreams || new Map()
    this.activeLogStreams.set(streamingKey, { isStreaming: true })

    // Stop streaming when WebSocket closes
    ws.on('close', () => {
      console.log(`🔌 WebSocket closed, stopping log streaming for ${jobName}`)
      isStreaming = false
      this.activeLogStreams.delete(streamingKey)
    })

    const pollLogs = async () => {
      try {
        if (!isStreaming || pollCount >= maxPolls || ws.readyState !== 1) {
          console.log(`🛑 Stopping log streaming for ${jobName}`)
          this.activeLogStreams.delete(streamingKey)
          return
        }

        pollCount++

        // Get all pods for this job and try to read logs from any of them
        const pods = await this.getAllPodsForJob(jobName)

        if (pods.length === 0) {
          if (pollCount <= 10) { // Only log for first 10 attempts
            console.log(`🔍 No pods found for job ${jobName} yet (attempt ${pollCount})`)
          }
          setTimeout(pollLogs, pollInterval)
          return
        }

        // Try to get logs from the first available pod
        let logResponse = null
        let podUsed = null

        for (const pod of pods) {
          try {
            const podName = pod.metadata.name
            const podPhase = pod.status?.phase

            console.log(`📋 Trying to get logs from pod: ${podName} (phase: ${podPhase})`)

            // Try different container names
            const containerNames = ['workflow-executor', 'main', 'app']

            for (const containerName of containerNames) {
              try {
                logResponse = await this.k8sApi.readNamespacedPodLog({
                  name: podName,
                  namespace: this.namespace,
                  container: containerName,
                  follow: false // Don't follow, just get current logs
                })
                podUsed = podName
                console.log(`✅ Successfully got logs from pod: ${podName}, container: ${containerName}`)
                break
              } catch (containerError) {
                if (containerError.response?.statusCode === 400) {
                  continue // Try next container
                }
                throw containerError
              }
            }

            // If no named container worked, try default
            if (!logResponse) {
              logResponse = await this.k8sApi.readNamespacedPodLog({
                name: podName,
                namespace: this.namespace,
                follow: false
              })
              podUsed = podName
              console.log(`✅ Successfully got logs from pod: ${podName} (default container)`)
            }

            break // Successfully got logs, exit pod loop

          } catch (podError) {
            console.log(`⚠️ Failed to get logs from pod ${pod.metadata.name}: ${podError.message}`)
            continue // Try next pod
          }
        }

        if (logResponse) {
          const currentLogs = logResponse.body || logResponse

          if (currentLogs.length > lastLogLength) {
            const newLogs = currentLogs.substring(lastLogLength)
            lastLogLength = currentLogs.length

            console.log(`📝 Processing ${newLogs.length} new characters from pod: ${podUsed}`)
            const lines = newLogs.split('\n')
            for (const line of lines) {
              if (line.trim()) {
                this.processLogLine(line.trim(), executionId, ws)
              }
            }
          }

          // Check if job/pod completed
          const completedPod = pods.find(p => p.status?.phase === 'Succeeded' || p.status?.phase === 'Failed')
          if (completedPod) {
            console.log(`🏁 Job ${jobName} completed (pod phase: ${completedPod.status.phase})`)
            // Give a few more seconds to capture final logs
            setTimeout(() => {
              isStreaming = false
            }, 3000)
          }
        }

        // Continue polling if still streaming
        if (isStreaming && ws.readyState === 1) {
          setTimeout(pollLogs, pollInterval)
        }

      } catch (error) {
        console.error(`❌ Error in job log streaming for ${jobName}:`, error.message)

        // Continue polling on errors (transient issues)
        if (isStreaming && ws.readyState === 1) {
          setTimeout(pollLogs, pollInterval)
        }
      }
    }

    // Start polling
    pollLogs()
  }

  /**
   * Get all pods for a job using multiple discovery methods
   */
  async getAllPodsForJob(jobName) {
    const allPods = []
    console.log(`🔍 Searching for pods for job: ${jobName} in namespace: ${this.namespace}`)

    try {
      // Method 1: Label selector with job-name
      const labelSelectors = [
        `job-name=${jobName}`,
        `batch.kubernetes.io/job-name=${jobName}`,
        `app=workflow-execution`
      ]

      for (const labelSelector of labelSelectors) {
        try {
          console.log(`🔍 Trying label selector: ${labelSelector}`)
          const pods = await this.k8sApi.listNamespacedPod({
            namespace: this.namespace,
            labelSelector
          })

          console.log(`📋 Found ${pods.body?.items?.length || 0} pods with selector: ${labelSelector}`)

          if (pods.body?.items) {
            // Log all pods found with this selector for debugging
            pods.body.items.forEach(pod => {
              console.log(`📋 Pod found: ${pod.metadata.name}, Labels:`, pod.metadata.labels)
            })

            // Filter pods that match the job name
            const matchingPods = pods.body.items.filter(pod =>
              pod.metadata.name.includes(jobName) ||
              pod.metadata.labels?.['job-name'] === jobName ||
              pod.metadata.labels?.['batch.kubernetes.io/job-name'] === jobName
            )

            console.log(`🎯 ${matchingPods.length} pods match job name: ${jobName}`)
            allPods.push(...matchingPods)
          }
        } catch (selectorError) {
          console.log(`⚠️ Label selector ${labelSelector} failed: ${selectorError.message}`)
        }
      }

      // Method 2: List all pods and filter by name pattern
      if (allPods.length === 0) {
        try {
          console.log(`🔍 Method 2: Listing all pods in namespace and filtering by name pattern`)
          const allNamespacePods = await this.k8sApi.listNamespacedPod({
            namespace: this.namespace
          })

          console.log(`📋 Total pods in namespace: ${allNamespacePods.body?.items?.length || 0}`)

          // Log first few pods for debugging
          if (allNamespacePods.body?.items?.length > 0) {
            console.log(`📋 Sample pods in namespace:`)
            allNamespacePods.body.items.slice(0, 5).forEach(pod => {
              console.log(`  - ${pod.metadata.name} (labels: ${JSON.stringify(pod.metadata.labels)})`)
            })
          }

          const matchingPods = allNamespacePods.body?.items?.filter(pod =>
            pod.metadata.name.startsWith(jobName) ||
            pod.metadata.name.includes(jobName)
          ) || []

          console.log(`🎯 Found ${matchingPods.length} pods matching name pattern for job: ${jobName}`)
          allPods.push(...matchingPods)
        } catch (listError) {
          console.log(`⚠️ Failed to list all pods: ${listError.message}`)
        }
      }

      // Remove duplicates
      const uniquePods = allPods.filter((pod, index, self) =>
        index === self.findIndex(p => p.metadata.name === pod.metadata.name)
      )

      console.log(`📋 Found ${uniquePods.length} pods for job ${jobName}`)
      return uniquePods

    } catch (error) {
      console.error(`❌ Error getting pods for job ${jobName}:`, error.message)
      return []
    }
  }

  /**
   * Stream logs from pod
   */
  async streamPodLogs(podName, executionId, ws) {
    let lastLogLength = 0
    const pollInterval = 1000
    const maxPolls = 600 // Increased to 10 minutes
    let pollCount = 0
    let isStreaming = true

    console.log(`📡 Setting up real-time log streaming for pod: ${podName}`)
    this.sendLog(ws, 'info', `Log stream established for pod: ${podName}`, 'system')

    // Store streaming state to allow cleanup
    const streamingKey = `${executionId}_${podName}`
    this.activeLogStreams = this.activeLogStreams || new Map()
    this.activeLogStreams.set(streamingKey, { isStreaming: true })

    // Stop streaming when WebSocket closes
    ws.on('close', () => {
      console.log(`🔌 WebSocket closed, stopping log streaming for ${podName}`)
      isStreaming = false
      this.activeLogStreams.delete(streamingKey)
    })

    const pollLogs = async () => {
      try {
        // Check if we should continue streaming
        if (!isStreaming || pollCount >= maxPolls || ws.readyState !== 1) {
          console.log(`🛑 Stopping log streaming for ${podName} (streaming: ${isStreaming}, polls: ${pollCount}, ws: ${ws.readyState})`)
          this.activeLogStreams.delete(streamingKey)
          return
        }

        pollCount++

        // Try different container names if the default fails
        const containerNames = ['workflow-executor', 'main', 'app']
        let logResponse = null
        let containerUsed = null

        for (const containerName of containerNames) {
          try {
            // For the first attempt, try to get all logs (including from completed pods)
            const logParams = {
              name: podName,
              namespace: this.namespace,
              container: containerName
            }

            // If this is the first poll, get all logs from the beginning
            if (pollCount === 1) {
              logParams.sinceTime = new Date(Date.now() - 60000).toISOString() // Last minute
              console.log(`📋 First poll - getting all logs since: ${logParams.sinceTime}`)
            }

            logResponse = await this.k8sApi.readNamespacedPodLog(logParams)
            containerUsed = containerName
            break
          } catch (containerError) {
            if (containerError.response?.statusCode === 400) {
              // Container not found, try next one
              continue
            }
            throw containerError
          }
        }

        if (!logResponse) {
          // Try without specifying container (use default)
          const logParams = {
            name: podName,
            namespace: this.namespace
          }

          if (pollCount === 1) {
            logParams.sinceTime = new Date(Date.now() - 60000).toISOString()
          }

          logResponse = await this.k8sApi.readNamespacedPodLog(logParams)
          containerUsed = 'default'
        }

        const currentLogs = logResponse.body || logResponse
        console.log(`📋 Retrieved ${currentLogs.length} characters of logs from container: ${containerUsed}`)

        if (currentLogs.length > lastLogLength) {
          const newLogs = currentLogs.substring(lastLogLength)
          lastLogLength = currentLogs.length

          console.log(`📝 Processing ${newLogs.length} new characters of logs`)
          const lines = newLogs.split('\n')
          for (const line of lines) {
            if (line.trim()) {
              this.processLogLine(line.trim(), executionId, ws)
            }
          }
        }

        // Check if pod has completed and stop streaming
        try {
          const podStatus = await this.k8sApi.readNamespacedPod({
            name: podName,
            namespace: this.namespace
          })

          const phase = podStatus.body?.status?.phase
          if (phase === 'Succeeded' || phase === 'Failed') {
            console.log(`🏁 Pod ${podName} completed with phase: ${phase}`)

            // Make sure we got all logs from completed pod
            if (currentLogs.length === 0 && pollCount <= 3) {
              console.log(`🔄 Pod completed but no logs yet, continuing to poll...`)
            } else {
              console.log(`✅ Pod completed and logs processed, stopping stream`)
              isStreaming = false
              return
            }
          }
        } catch (statusError) {
          console.log(`⚠️ Could not check pod status: ${statusError.message}`)
        }

        // Continue polling if still streaming
        if (isStreaming && ws.readyState === 1) {
          setTimeout(pollLogs, pollInterval)
        }

      } catch (error) {
        console.error(`❌ Error polling logs for pod ${podName}:`, error.message)

        // Don't retry on certain errors
        if (error.response?.statusCode === 404) {
          console.log(`🔍 Pod ${podName} not found, stopping log streaming`)
          isStreaming = false
          return
        }

        // Retry on other errors if still streaming
        if (isStreaming && ws.readyState === 1) {
          setTimeout(pollLogs, pollInterval)
        }
      }
    }

    // Start polling
    pollLogs()
  }

  /**
   * Process log line from container
   */
  processLogLine(line, executionId, ws) {
    console.log(`🔍 Processing log line: ${line.substring(0, 100)}${line.length > 100 ? '...' : ''}`)
    console.log(`🔍 Expected execution ID: ${executionId}`)

    // Look for structured log messages
    if (line.includes('STREAM_LOG:')) {
      try {
        const logStart = line.indexOf('STREAM_LOG:') + 'STREAM_LOG:'.length
        const logJson = line.substring(logStart).trim()
        console.log(`📝 Parsing STREAM_LOG JSON: ${logJson.substring(0, 200)}${logJson.length > 200 ? '...' : ''}`)

        const logEntry = JSON.parse(logJson)
        console.log(`✅ Parsed log entry - execution_id: ${logEntry.execution_id}, level: ${logEntry.level}, step: ${logEntry.step}, message: ${logEntry.message.substring(0, 50)}...`)

        // Forward log with step information if available
        if (logEntry.step) {
          console.log(`📤 Forwarding step log to WebSocket: [${logEntry.step}] ${logEntry.message}`)
          this.sendStepLog(ws, logEntry.level, logEntry.message, logEntry.step, logEntry.source)
        } else {
          console.log(`📤 Forwarding log to WebSocket: ${logEntry.message}`)
          this.sendLog(ws, logEntry.level, logEntry.message, logEntry.source)
        }

        if (logEntry.execution_id !== executionId) {
          console.log(`⚠️ Execution ID mismatch (but still forwarding): expected ${executionId}, got ${logEntry.execution_id}`)
        }
      } catch (error) {
        console.error(`❌ Error parsing STREAM_LOG entry: ${error.message}`)
        console.error(`❌ Raw line: ${line}`)
        // Still forward the raw line as a fallback
        this.sendLog(ws, 'info', line, 'container')
      }
    }
    // Forward other logs as info (including non-STREAM_LOG lines)
    else {
      console.log(`📤 Forwarding raw log line: ${line}`)
      this.sendLog(ws, 'info', line, 'container')
    }
  }

  /**
   * Extract result from job logs
   */
  async extractJobResult(jobName) {
    try {
      const podName = await this.getPodNameForJob(jobName)
      if (!podName) {
        throw new Error('Pod not found for job')
      }

      const logResponse = await this.k8sApi.readNamespacedPodLog({
        name: podName,
        namespace: this.namespace,
        container: 'workflow-executor'
      })

      const logs = logResponse.body || logResponse

      // Extract result between WORKFLOW_RESULT_START and WORKFLOW_RESULT_END
      const startMarker = 'WORKFLOW_RESULT_START'
      const endMarker = 'WORKFLOW_RESULT_END'

      const startIndex = logs.indexOf(startMarker)
      const endIndex = logs.indexOf(endMarker)

      if (startIndex !== -1 && endIndex !== -1) {
        const resultJson = logs.substring(startIndex + startMarker.length, endIndex).trim()
        return JSON.parse(resultJson)
      }

      // Fallback result if no structured output found
      return {
        success: false,
        error_message: 'No structured result found in logs',
        error_type: 'result_parsing_error'
      }

    } catch (error) {
      console.error('Error extracting job result:', error)
      return {
        success: false,
        error_message: error.message,
        error_type: 'result_extraction_error'
      }
    }
  }

  /**
   * Get pod name for job
   */
  async getPodNameForJob(jobName) {
    try {
      console.log(`🔍 Looking for pods with job-name=${jobName} in namespace ${this.namespace}`)

      // First, try to get the job to verify it exists
      try {
        const job = await this.k8sBatchApi.readNamespacedJob({
          name: jobName,
          namespace: this.namespace
        })
        console.log(`✅ Job ${jobName} exists with status:`, job.body?.status)
      } catch (jobError) {
        console.log(`⚠️ Job ${jobName} not found: ${jobError.message}`)
        return null
      }

      // Try multiple approaches to find pods
      const approaches = [
        // Approach 1: Use the standard Kubernetes job label
        async () => {
          console.log(`🔍 Approach 1: Using batch.kubernetes.io/job-name=${jobName}`)
          const pods = await this.k8sApi.listNamespacedPod({
            namespace: this.namespace,
            labelSelector: `batch.kubernetes.io/job-name=${jobName}`
          })
          return pods.body?.items || []
        },

        // Approach 2: Use our custom app label
        async () => {
          console.log(`🔍 Approach 2: Using app=workflow-execution`)
          const pods = await this.k8sApi.listNamespacedPod({
            namespace: this.namespace,
            labelSelector: 'app=workflow-execution'
          })
          const filtered = (pods.body?.items || []).filter(pod =>
            pod.metadata.name.includes(jobName)
          )
          return filtered
        },

        // Approach 3: List all pods and filter by name
        async () => {
          console.log(`🔍 Approach 3: Listing all pods and filtering by name`)
          const allPods = await this.k8sApi.listNamespacedPod({
            namespace: this.namespace
          })
          const filtered = (allPods.body?.items || []).filter(pod =>
            pod.metadata.name.includes(jobName) ||
            pod.metadata.name.startsWith('workflow-')
          )
          return filtered
        }
      ]

      for (let i = 0; i < approaches.length; i++) {
        try {
          const pods = await approaches[i]()
          console.log(`📋 Approach ${i + 1} found ${pods.length} pods`)

          if (pods.length > 0) {
            // Log all found pods for debugging
            pods.forEach(pod => {
              console.log(`📋 Pod: ${pod.metadata.name}, Phase: ${pod.status?.phase}, Labels:`, pod.metadata.labels)
            })

            // Select the most appropriate pod
            const pod = pods[0]
            const podName = pod.metadata.name
            const podStatus = pod.status?.phase
            console.log(`✅ Selected pod: ${podName} with status: ${podStatus}`)
            return podName
          }
        } catch (error) {
          console.log(`⚠️ Approach ${i + 1} failed: ${error.message}`)
        }
      }

      console.log(`❌ No pods found for job: ${jobName}`)
      return null
    } catch (error) {
      console.error(`❌ Error getting pod for job ${jobName}:`, error.message)
      return null
    }
  }

  /**
   * Delete job
   */
  async deleteJob(jobName) {
    if (!jobName) {
      console.log('⚠️ No job name provided for deletion')
      return
    }

    if (!this.namespace) {
      console.error('❌ Namespace is not defined for job deletion')
      return
    }

    try {
      console.log(`🗑️ Deleting job: ${jobName} from namespace: ${this.namespace}`)
      await this.k8sBatchApi.deleteNamespacedJob({ name: jobName, namespace: this.namespace })
      console.log(`✅ Job ${jobName} deleted successfully`)
    } catch (error) {
      if (error.response?.statusCode === 404) {
        console.log(`ℹ️ Job ${jobName} not found (may have been already deleted)`)
      } else {
        console.error(`❌ Error deleting job ${jobName} from namespace ${this.namespace}:`, error.message)
        console.error(`🔍 Error details:`, error.response?.body || error)
      }
    }
  }

  /**
   * Get job status from Kubernetes with improved completion detection
   */
  async getJobStatus(jobName) {
    try {
      // First check the job status
      const jobResponse = await this.k8sBatchApi.readNamespacedJob({
        name: jobName,
        namespace: this.namespace
      })

      const job = jobResponse.body
      const status = job.status

      console.log(`📊 Job ${jobName} raw status:`, JSON.stringify(status, null, 2))

      // Check job conditions first (most reliable)
      if (status.conditions) {
        console.log(`📊 Job ${jobName} conditions:`, status.conditions)
        for (const condition of status.conditions) {
          if (condition.type === 'Complete' && condition.status === 'True') {
            console.log(`✅ Job ${jobName} marked as Complete`)
            return 'completed'
          }
          if (condition.type === 'Failed' && condition.status === 'True') {
            console.log(`❌ Job ${jobName} marked as Failed`)
            return 'failed'
          }
        }
      }

      // Check numeric status counters
      if (status.succeeded && status.succeeded > 0) {
        console.log(`✅ Job ${jobName} has ${status.succeeded} succeeded pods`)
        return 'completed'
      }

      if (status.failed && status.failed > 0) {
        console.log(`❌ Job ${jobName} has ${status.failed} failed pods`)
        return 'failed'
      }

      if (status.active && status.active > 0) {
        console.log(`🔄 Job ${jobName} is active with ${status.active} pods`)
        return 'running'
      }

      // Get pod status for more detailed information
      try {
        const podName = await this.getPodNameForJob(jobName)
        if (podName) {
          const podResponse = await this.k8sApi.readNamespacedPod({
            name: podName,
            namespace: this.namespace
          })
          const podStatus = podResponse.body.status
          const phase = podStatus.phase

          console.log(`📊 Pod ${podName} phase: ${phase}`)

          // Check container statuses for more details
          if (podStatus.containerStatuses) {
            for (const containerStatus of podStatus.containerStatuses) {
              console.log(`📊 Container ${containerStatus.name}: ready=${containerStatus.ready}, restartCount=${containerStatus.restartCount}`)

              if (containerStatus.state) {
                if (containerStatus.state.terminated) {
                  const terminated = containerStatus.state.terminated
                  console.log(`📊 Container ${containerStatus.name} terminated: exitCode=${terminated.exitCode}, reason=${terminated.reason}`)

                  if (terminated.exitCode === 0) {
                    return 'completed'
                  } else {
                    return 'failed'
                  }
                } else if (containerStatus.state.running) {
                  console.log(`📊 Container ${containerStatus.name} is running`)
                  return 'running'
                } else if (containerStatus.state.waiting) {
                  const waiting = containerStatus.state.waiting
                  console.log(`📊 Container ${containerStatus.name} waiting: reason=${waiting.reason}`)
                  return 'pending'
                }
              }
            }
          }

          // Fallback to pod phase
          if (phase === 'Succeeded') {
            return 'completed'
          } else if (phase === 'Failed') {
            return 'failed'
          } else if (phase === 'Running') {
            return 'running'
          } else if (phase === 'Pending') {
            return 'pending'
          }
        }
      } catch (podError) {
        console.log(`📊 Could not get pod status: ${podError.message}`)
      }

      // Default to pending if no clear status
      console.log(`📊 Job ${jobName} defaulting to pending status`)
      return 'pending'

    } catch (error) {
      console.error(`❌ Error getting job status for ${jobName}:`, error.message)
      return 'unknown'
    }
  }

  /**
   * Get job logs with fallback approaches
   */
  async getJobLogs(jobName) {
    try {
      const podName = await this.getPodNameForJob(jobName)
      if (!podName) {
        return 'Pod not yet available - waiting for pod creation'
      }

      // Try different approaches to get logs
      const logAttempts = [
        // Primary: workflow-executor container
        async () => {
          return await this.k8sApi.readNamespacedPodLog({
            name: podName,
            namespace: this.namespace,
            container: 'workflow-executor'
          })
        },
        // Fallback: default container
        async () => {
          return await this.k8sApi.readNamespacedPodLog({
            name: podName,
            namespace: this.namespace
          })
        }
      ]

      for (const attempt of logAttempts) {
        try {
          const logResponse = await attempt()
          const logs = logResponse.body || logResponse
          if (logs && logs.trim()) {
            return logs
          }
        } catch (attemptError) {
          console.log(`📝 Log retrieval attempt failed: ${attemptError.message}`)
          continue
        }
      }

      return 'No logs available'
    } catch (error) {
      return `Error getting logs: ${error.message}`
    }
  }

  /**
   * Wait for job completion and retrieve all logs using kubectl approach
   * This is more reliable than real-time streaming
   */
  async waitForJobCompletionAndRetrieveLogs(jobName, executionId, ws) {
    const maxWaitTime = Math.min(this.jobTimeout * 1000, 600000) // Max 10 minutes or configured timeout
    const pollInterval = 2000 // Check every 2 seconds for faster feedback
    let elapsedTime = 0
    let statusUpdateCounter = 0
    let lastLogLength = 0 // Track partial logs to avoid duplicates

    console.log(`🚀 Starting reliable job completion wait for: ${jobName}`)
    console.log(`🚀 Max wait time: ${maxWaitTime}ms, Poll interval: ${pollInterval}ms`)
    this.sendLog(ws, 'info', `Starting execution monitoring for job: ${jobName}`, 'system')

    // Send immediate status check
    try {
      const initialStatus = await this.getJobStatus(jobName)
      console.log(`🚀 Initial job status: ${initialStatus}`)
      this.sendLog(ws, 'info', `Initial job status: ${initialStatus}`, 'system')
    } catch (error) {
      console.error(`🚀 Error getting initial job status: ${error.message}`)
      this.sendLog(ws, 'warning', `Error getting initial job status: ${error.message}`, 'system')
    }

    // Wait for pod to be created first
    await this.waitForPodCreation(jobName, ws)

    while (elapsedTime < maxWaitTime) {
      try {
        // Check job status
        const jobStatus = await this.getJobStatus(jobName)
        console.log(`📊 Job ${jobName} status: ${jobStatus} (elapsed: ${elapsedTime}ms)`)

        if (jobStatus === 'completed') {
          console.log(`✅ Job ${jobName} completed successfully`)
          this.sendLog(ws, 'info', 'Execution completed! Retrieving logs...', 'system')
          this.sendStepLog(ws, 'info', '📈 Step 5: Processing results...', 'results')

          // Wait a moment for logs to be fully written
          await new Promise(resolve => setTimeout(resolve, 1000))

          // Get all logs using kubectl approach
          console.log(`📝 About to retrieve logs for completed job: ${jobName}`)
          await this.retrieveAndProcessAllLogs(jobName, executionId, ws)

          // Extract and return the result
          console.log(`📝 About to extract result for job: ${jobName}`)
          const result = await this.extractJobResult(jobName)
          console.log(`📝 Extracted result:`, result ? 'success' : 'no result')
          return result
        } else if (jobStatus === 'failed') {
          console.log(`❌ Job ${jobName} failed`)
          this.sendLog(ws, 'error', 'Execution failed. Retrieving error logs...', 'system')

          // Wait a moment for error logs to be written
          await new Promise(resolve => setTimeout(resolve, 1000))

          // Still try to get logs to show what went wrong
          console.log(`📝 Retrieving logs for failed job: ${jobName}`)
          await this.retrieveAndProcessAllLogs(jobName, executionId, ws)

          throw new Error('Job execution failed')
        } else if (jobStatus === 'running') {
          // Job is running, send progress update
          this.sendStepLog(ws, 'info', '🚀 Step 4: Optimization in progress...', 'execution')

          // Get partial logs to show progress
          try {
            const partialLogs = await this.getJobLogs(jobName)
            if (partialLogs && partialLogs.length > lastLogLength && !partialLogs.includes('Error getting logs')) {
              const newLogs = partialLogs.substring(lastLogLength)
              if (newLogs.trim()) {
                console.log(`📝 Got ${newLogs.length} characters of new logs`)
                await this.processPartialLogs(newLogs, executionId, ws)
                lastLogLength = partialLogs.length
              }
            }
          } catch (error) {
            console.log(`📝 Could not get partial logs: ${error.message}`)
          }
        } else if (jobStatus === 'pending') {
          this.sendStepLog(ws, 'info', '⏳ Step 4: Waiting for execution to start...', 'execution')
        }

        // Send status updates every 5 iterations (every 10 seconds)
        statusUpdateCounter++
        if (statusUpdateCounter % 5 === 0) {
          const minutes = Math.floor(elapsedTime / 60000)
          const seconds = Math.floor((elapsedTime % 60000) / 1000)
          this.sendLog(ws, 'info', `Execution in progress... (${minutes}m ${seconds}s elapsed, status: ${jobStatus})`, 'system')
        }

        // Wait before next check
        await new Promise(resolve => setTimeout(resolve, pollInterval))
        elapsedTime += pollInterval

      } catch (error) {
        console.error(`❌ Error checking job status: ${error.message}`)
        this.sendLog(ws, 'warning', `Status check error: ${error.message}`, 'system')
        await new Promise(resolve => setTimeout(resolve, pollInterval))
        elapsedTime += pollInterval
      }
    }

    // Timeout reached
    console.log(`⚠️ Job ${jobName} timed out after ${maxWaitTime/1000} seconds`)
    this.sendLog(ws, 'warning', `Execution timed out after ${maxWaitTime/1000} seconds. Retrieving available logs...`, 'system')

    // Try to get any available logs even on timeout
    await this.retrieveAndProcessAllLogs(jobName, executionId, ws)

    throw new Error(`Job execution timed out after ${maxWaitTime/1000} seconds`)
  }

  /**
   * Wait for pod creation before starting monitoring
   */
  async waitForPodCreation(jobName, ws) {
    const maxWaitTime = 60000 // 1 minute max wait for pod creation
    const pollInterval = 2000 // Check every 2 seconds
    let elapsedTime = 0

    console.log(`⏳ Waiting for pod creation for job: ${jobName}`)
    this.sendLog(ws, 'info', `Waiting for execution pod to be created...`, 'system')

    while (elapsedTime < maxWaitTime) {
      try {
        const podName = await this.getPodNameForJob(jobName)
        if (podName) {
          console.log(`✅ Pod created: ${podName}`)
          this.sendLog(ws, 'info', `Execution pod created: ${podName}`, 'system')

          // Wait for pod to be in running state
          const podStatus = await this.k8sApi.readNamespacedPod({
            name: podName,
            namespace: this.namespace
          })

          const phase = podStatus.body?.status?.phase
          console.log(`📊 Pod ${podName} phase: ${phase}`)

          if (phase === 'Running' || phase === 'Succeeded') {
            this.sendLog(ws, 'info', `Execution pod is ${phase.toLowerCase()}`, 'system')
            return podName
          } else if (phase === 'Failed') {
            this.sendLog(ws, 'error', `Execution pod failed to start`, 'system')
            throw new Error('Pod failed to start')
          }
        }

        await new Promise(resolve => setTimeout(resolve, pollInterval))
        elapsedTime += pollInterval
      } catch (error) {
        console.log(`⏳ Pod not ready yet: ${error.message}`)
        await new Promise(resolve => setTimeout(resolve, pollInterval))
        elapsedTime += pollInterval
      }
    }

    this.sendLog(ws, 'warning', `Pod creation timed out after ${maxWaitTime/1000} seconds`, 'system')
    throw new Error('Pod creation timed out')
  }

  /**
   * Retrieve and process all logs from a completed job
   */
  async retrieveAndProcessAllLogs(jobName, executionId, ws) {
    try {
      console.log(`📝 Retrieving all logs for completed job: ${jobName}`)

      // Get the pod name for this job
      const podName = await this.getPodNameForJob(jobName)
      if (!podName) {
        this.sendLog(ws, 'warning', 'No pod found for this execution', 'system')
        return
      }

      console.log(`📝 Getting logs from pod: ${podName}`)
      this.sendLog(ws, 'info', `Retrieving execution logs from pod: ${podName}`, 'system')

      // Try multiple approaches to get logs
      let logs = null
      const logAttempts = [
        // Attempt 1: Get logs from workflow-executor container
        async () => {
          return await this.k8sApi.readNamespacedPodLog({
            name: podName,
            namespace: this.namespace,
            container: 'workflow-executor'
          })
        },
        // Attempt 2: Get logs from default container
        async () => {
          return await this.k8sApi.readNamespacedPodLog({
            name: podName,
            namespace: this.namespace
          })
        },
        // Attempt 3: Get logs with previous flag in case container restarted
        async () => {
          return await this.k8sApi.readNamespacedPodLog({
            name: podName,
            namespace: this.namespace,
            container: 'workflow-executor',
            previous: true
          })
        }
      ]

      for (let i = 0; i < logAttempts.length; i++) {
        try {
          console.log(`📝 Trying log retrieval attempt ${i + 1}`)
          const logResponse = await logAttempts[i]()
          logs = logResponse.body || logResponse

          if (logs && logs.trim()) {
            console.log(`📝 Successfully retrieved logs using attempt ${i + 1}: ${logs.length} characters`)
            break
          }
        } catch (attemptError) {
          console.log(`📝 Attempt ${i + 1} failed: ${attemptError.message}`)
          if (i === logAttempts.length - 1) {
            // Last attempt failed, throw the error
            throw attemptError
          }
        }
      }

      if (!logs || !logs.trim()) {
        this.sendLog(ws, 'warning', 'No logs available from the execution pod', 'system')
        return
      }

      console.log(`📝 Retrieved ${logs.length} characters of logs`)
      this.sendLog(ws, 'info', `Retrieved ${logs.length} characters of execution logs`, 'system')

      // Process logs line by line and send them via WebSocket
      const logLines = logs.split('\n').filter(line => line.trim())

      this.sendLog(ws, 'info', `Processing ${logLines.length} log lines...`, 'system')

      for (const line of logLines) {
        if (line.trim()) {
          this.processLogLine(line, executionId, ws)
        }
      }

      this.sendLog(ws, 'info', 'All execution logs processed successfully', 'system')

    } catch (error) {
      console.error(`❌ Error retrieving logs for job ${jobName}: ${error.message}`)
      this.sendLog(ws, 'error', `Failed to retrieve execution logs: ${error.message}`, 'system')
    }
  }

  /**
   * Create a simple test job to verify Kubernetes functionality
   */
  async createSimpleTestJob(jobName, script, executionId) {
    const job = {
      metadata: {
        name: jobName,
        namespace: this.namespace,
        labels: {
          'app': 'test-job',
          'execution-id': executionId,
          'type': 'test'
        }
      },
      spec: {
        template: {
          metadata: {
            labels: {
              'app': 'test-job',
              'execution-id': executionId
            }
          },
          spec: {
            containers: [{
              name: 'test-executor',
              image: 'python:3.9-slim',
              command: ['python3', '-u', '-c'],
              args: [script],
              env: [
                { name: 'PYTHONUNBUFFERED', value: '1' }
              ]
            }],
            restartPolicy: 'Never'
          }
        },
        backoffLimit: 1,
        activeDeadlineSeconds: 60, // 1 minute timeout for test
        ttlSecondsAfterFinished: 300 // 5 minutes cleanup
      }
    }

    const result = await this.k8sBatchApi.createNamespacedJob({ namespace: this.namespace, body: job })
    return result
  }

  /**
   * Process partial logs from running pods and send them to frontend
   */
  async processPartialLogs(logs, executionId, ws) {
    try {
      if (!logs || typeof logs !== 'string') {
        return
      }

      // Keep track of processed logs to avoid duplicates
      if (!this.processedLogLines) {
        this.processedLogLines = new Map()
      }

      const executionKey = `${executionId}`
      if (!this.processedLogLines.has(executionKey)) {
        this.processedLogLines.set(executionKey, new Set())
      }

      const processedLines = this.processedLogLines.get(executionKey)
      const logLines = logs.split('\n').filter(line => line.trim())

      console.log(`📝 Processing ${logLines.length} log lines for execution ${executionId}`)

      let newLinesCount = 0
      for (const line of logLines) {
        const trimmedLine = line.trim()
        if (trimmedLine && !processedLines.has(trimmedLine)) {
          processedLines.add(trimmedLine)
          newLinesCount++

          // Process each new log line
          this.processLogLine(trimmedLine, executionId, ws)
        }
      }

      if (newLinesCount > 0) {
        console.log(`📝 Processed ${newLinesCount} new log lines`)
        this.sendLog(ws, 'info', `Processed ${newLinesCount} new execution log lines`, 'system')
      }

    } catch (error) {
      console.error(`❌ Error processing partial logs: ${error.message}`)
      this.sendLog(ws, 'error', `Error processing execution logs: ${error.message}`, 'system')
    }
  }

  /**
   * Get execution status
   */
  getExecutionStatus(executionId) {
    const execution = this.activeExecutions.get(executionId)
    if (execution) {
      return {
        status: execution.status,
        isActive: execution.status === 'running',
        startTime: execution.startTime,
        result: execution.result,
        error: execution.error
      }
    }

    return { status: 'not_found', isActive: false }
  }

  /**
   * Start periodic cleanup of resources and stale executions
   */
  startPeriodicCleanup() {
    // Clean up every 5 minutes
    setInterval(() => {
      try {
        // Clean up stale resource allocations
        const cleanedAllocations = this.resourceManager.cleanupStaleAllocations(30)
        if (cleanedAllocations > 0) {
          console.log(`🧹 Cleaned up ${cleanedAllocations} stale resource allocations`)
        }

        // Log current resource utilization
        const utilization = this.resourceManager.getResourceUtilization()
        console.log(`📊 Resource utilization: CPU=${utilization.cpu.utilization.toFixed(1)}%, Memory=${utilization.memory.utilization.toFixed(1)}%, Active=${utilization.activeExecutions}`)

      } catch (error) {
        console.error(`❌ Periodic cleanup failed: ${error.message}`)
      }
    }, 5 * 60 * 1000) // 5 minutes
  }

  /**
   * Create secure workflow job using SecurityManager
   */
  async createSecureWorkflowJob(jobName, script, executionId, resourceSpec) {
    console.log(`🔒 Creating secure Kubernetes job: ${jobName} in namespace: ${this.namespace}`)

    // Create secure job manifest
    const jobManifest = this.securityManager.createSecureJobManifest(jobName, script, executionId, resourceSpec)

    try {
      console.log(`📋 Secure job manifest prepared for namespace: ${this.namespace}`)
      console.log(`📋 Using image: ${jobManifest.spec.template.spec.containers[0].image}`)
      console.log(`📋 Security context: ${JSON.stringify(jobManifest.spec.template.spec.securityContext)}`)
      console.log(`📋 Resource limits: ${JSON.stringify(jobManifest.spec.template.spec.containers[0].resources)}`)

      const result = await this.k8sBatchApi.createNamespacedJob({
        namespace: this.namespace,
        body: jobManifest
      })

      console.log(`✅ Secure job ${jobName} created successfully in namespace ${this.namespace}`)
      console.log(`📋 Job UID: ${result.body?.metadata?.uid}`)

      // Log security event
      this.securityManager.logSecurityEvent('job_created', executionId, {
        jobName,
        resourceProfile: resourceSpec,
        securityLevel: 'restricted'
      })

      return result

    } catch (error) {
      console.error(`❌ Failed to create secure job ${jobName} in namespace ${this.namespace}:`, error.message)

      // Log security event
      this.securityManager.logSecurityEvent('job_creation_failed', executionId, {
        jobName,
        error: error.message
      })

      throw error
    }
  }

  /**
   * Get resource utilization status
   */
  getResourceUtilization() {
    return this.resourceManager.getResourceUtilization()
  }

  /**
   * Get security events
   */
  getSecurityEvents(limit = 100) {
    return this.securityManager.getSecurityEvents(limit)
  }

  /**
   * Enhanced log retrieval with structured processing
   */
  async waitForJobCompletionAndRetrieveLogsEnhanced(jobName, executionId) {
    const maxWaitTime = Math.min(this.jobTimeout * 1000, 600000) // Max 10 minutes
    const pollInterval = 2000 // Check every 2 seconds
    let elapsedTime = 0

    console.log(`🚀 Starting enhanced job completion wait for: ${jobName}`)
    this.webSocketManager.sendLog(executionId, 'info', `Starting execution monitoring for job: ${jobName}`, 'system')

    // Wait for pod to be created first
    await this.waitForPodCreation(jobName, executionId)

    while (elapsedTime < maxWaitTime) {
      try {
        // Check job status
        const jobStatus = await this.getJobStatus(jobName)
        console.log(`📊 Job ${jobName} status: ${jobStatus} (elapsed: ${elapsedTime}ms)`)

        // Get current logs and process them
        const currentLogs = await this.getJobLogs(jobName)
        if (currentLogs) {
          const processedLogs = this.loggingManager.processLogOutput(executionId, currentLogs)

          // Send processed logs via WebSocket
          this.sendProcessedLogsToWebSocket(executionId, processedLogs)

          // Check for completion markers in logs
          const workflowResult = this.loggingManager.extractWorkflowResult(currentLogs)
          if (workflowResult) {
            console.log(`✅ Found workflow result in logs`)
            return workflowResult
          }
        }

        // Check if job is completed
        if (jobStatus === 'completed' || jobStatus === 'succeeded') {
          console.log(`✅ Job ${jobName} completed successfully`)

          // Get final logs
          const finalLogs = await this.getJobLogs(jobName)
          if (finalLogs) {
            const finalProcessedLogs = this.loggingManager.processLogOutput(executionId, finalLogs)
            this.sendProcessedLogsToWebSocket(executionId, finalProcessedLogs)

            const finalResult = this.loggingManager.extractWorkflowResult(finalLogs)
            if (finalResult) {
              return finalResult
            }
          }

          break
        } else if (jobStatus === 'failed' || jobStatus === 'error') {
          console.log(`❌ Job ${jobName} failed`)
          this.webSocketManager.sendError(executionId, new Error(`Job execution failed with status: ${jobStatus}`))
          throw new Error(`Job execution failed: ${jobStatus}`)
        }

        await new Promise(resolve => setTimeout(resolve, pollInterval))
        elapsedTime += pollInterval

      } catch (error) {
        console.error(`❌ Error during enhanced log retrieval: ${error.message}`)
        this.webSocketManager.sendError(executionId, new Error(`Monitoring error: ${error.message}`))
        await new Promise(resolve => setTimeout(resolve, pollInterval))
        elapsedTime += pollInterval
      }
    }

    // Timeout reached
    console.log(`⚠️ Job ${jobName} timed out after ${maxWaitTime/1000} seconds`)
    this.webSocketManager.sendLog(executionId, 'warning', `Execution timed out after ${maxWaitTime/1000} seconds`, 'system')

    throw new Error(`Job execution timed out after ${maxWaitTime/1000} seconds`)
  }

  /**
   * Send processed logs to WebSocket with proper formatting
   */
  sendProcessedLogsToWebSocket(executionId, processedLogs) {
    if (!processedLogs || !processedLogs.logs) return

    // Send individual log entries
    for (const logEntry of processedLogs.logs) {
      this.webSocketManager.sendStepLog(executionId, logEntry.level, logEntry.message, logEntry.step)
    }

    // Send progress updates
    if (processedLogs.stepProgress) {
      for (const [stepId, stepInfo] of Object.entries(processedLogs.stepProgress.steps)) {
        if (stepInfo.progress > 0) {
          this.webSocketManager.sendProgress(executionId, stepId, stepInfo.progress, stepInfo.status)
        }
      }
    }

    // Send summary update
    if (processedLogs.summary) {
      this.webSocketManager.sendMessage(executionId, 'execution_summary', processedLogs.summary)
    }
  }

  /**
   * Wait for pod creation with enhanced logging
   */
  async waitForPodCreation(jobName, executionId) {
    const maxWaitTime = 60000 // 1 minute
    const checkInterval = 2000 // 2 seconds
    let waitTime = 0

    this.webSocketManager.sendLog(executionId, 'info', 'Waiting for execution pod to be created...', 'system')

    const checkForPod = async () => {
      try {
        const pods = await this.getAllPodsForJob(jobName)

        if (pods.length > 0) {
          this.webSocketManager.sendLog(executionId, 'info', `Execution pod created: ${pods[0].metadata.name}`, 'system')
          return
        }

        waitTime += checkInterval
        if (waitTime < maxWaitTime) {
          setTimeout(checkForPod, checkInterval)
        } else {
          this.webSocketManager.sendLog(executionId, 'warning', 'Timeout waiting for pod creation', 'system')
        }
      } catch (error) {
        console.error(`Error checking for pod: ${error.message}`)
        this.webSocketManager.sendLog(executionId, 'warning', `Pod check error: ${error.message}`, 'system')
      }
    }

    await checkForPod()
  }

  /**
   * Get system health status
   */
  async getSystemHealth() {
    const health = {
      kubernetes: false,
      integrations: null,
      resources: null,
      errors: [],
      timestamp: new Date().toISOString()
    }

    try {
      // Check Kubernetes connectivity
      await this.initializeKubernetes()
      const namespaces = await this.k8sApi.listNamespace()
      health.kubernetes = true
    } catch (error) {
      health.errors.push(`Kubernetes: ${error.message}`)
    }

    try {
      // Check integration health
      health.integrations = await this.integrationManager.checkSystemHealth()
    } catch (error) {
      health.errors.push(`Integrations: ${error.message}`)
    }

    try {
      // Get resource utilization
      health.resources = this.resourceManager.getResourceUtilization()
    } catch (error) {
      health.errors.push(`Resources: ${error.message}`)
    }

    return health
  }

  /**
   * Get comprehensive execution statistics
   */
  getExecutionStatistics() {
    return {
      activeExecutions: this.activeExecutions.size,
      resourceUtilization: this.resourceManager.getResourceUtilization(),
      webSocketConnections: this.webSocketManager.getConnectionStats(),
      errorStatistics: this.errorHandler.getErrorStatistics(),
      integrationCaches: this.integrationManager.getCacheStats(),
      performanceMetrics: this.performanceManager.getPerformanceMetrics(),
      queueStatus: this.performanceManager.getQueueStatus(),
      timestamp: new Date().toISOString()
    }
  }

  /**
   * Perform system maintenance
   */
  async performMaintenance() {
    console.log(`🧹 Starting system maintenance...`)

    const maintenanceResults = {
      resourceCleanup: 0,
      errorHistoryCleared: false,
      cacheCleared: false,
      inactiveConnectionsCleared: 0,
      timestamp: new Date().toISOString()
    }

    try {
      // Clean up stale resources
      maintenanceResults.resourceCleanup = this.resourceManager.cleanupStaleAllocations(30)

      // Clear error history if too large
      const errorStats = this.errorHandler.getErrorStatistics()
      if (errorStats.total > 500) {
        this.errorHandler.clearErrorHistory()
        maintenanceResults.errorHistoryCleared = true
      }

      // Clear integration caches
      this.integrationManager.clearCaches()
      maintenanceResults.cacheCleared = true

      // Clear performance caches
      this.performanceManager.clearCaches()

      // Clean up inactive WebSocket connections
      this.webSocketManager.cleanupInactiveConnections()

      console.log(`🧹 System maintenance completed:`, maintenanceResults)

    } catch (error) {
      console.error(`❌ System maintenance failed: ${error.message}`)
      await this.errorHandler.handleError(error, { operation: 'maintenance' })
    }

    return maintenanceResults
  }
}

module.exports = UnifiedWorkflowExecutionService
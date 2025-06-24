/**
 * Qubots Streaming Execution Service
 *
 * Provides real-time log streaming for qubots optimization execution.
 * Captures logs from within the optimization process and streams them via WebSocket.
 */

const k8s = require('@kubernetes/client-node')
const crypto = require('crypto')
const WebSocket = require('ws')

class QubotStreamingExecutionService {
  constructor() {
    this.kc = new k8s.KubeConfig()
    this.kc.loadFromDefault()

    this.batchV1Api = this.kc.makeApiClient(k8s.BatchV1Api)
    this.coreV1Api = this.kc.makeApiClient(k8s.CoreV1Api)

    // Use same configuration as working execution service
    this.namespace = process.env.PLAYGROUND_NAMESPACE || 'playground'
    this.baseImage = process.env.PLAYGROUND_IMAGE || 'registry.digitalocean.com/rastion/qubots-playground:latest'
    this.jobTimeout = 300 // 5 minutes

    // Debug logging for namespace
    console.log(`🔧 QubotStreamingExecutionService initialized with namespace: ${this.namespace}`)
    console.log(`🔧 Environment PLAYGROUND_NAMESPACE: ${process.env.PLAYGROUND_NAMESPACE}`)

    // Ensure namespace is never null/undefined
    if (!this.namespace) {
      console.error('❌ Namespace is null/undefined, forcing to "playground"')
      this.namespace = 'playground'
    }

    // Store active executions and their WebSocket connections
    this.activeExecutions = new Map()
  }

  /**
   * Execute qubots optimization with real-time log streaming
   * @param {Object} params - Execution parameters
   * @param {WebSocket} ws - WebSocket connection for streaming logs
   * @returns {Promise<Object>} Execution result
   */
  async executeOptimizationWithStreaming(params, ws) {
    const {
      problemName,
      optimizerName,
      problemUsername = 'default',
      optimizerUsername = 'default',
      problemParams = {},
      optimizerParams = {},
      timeout = 30000
    } = params

    const jobId = this.generateJobId()
    const jobName = `qubots-stream-${jobId}`
    const executionId = crypto.randomUUID()

    console.log(`🚀 Starting streaming qubots execution: ${jobName}`)
    console.log(`📊 Problem: ${problemUsername}/${problemName}`)
    console.log(`🔧 Optimizer: ${optimizerUsername}/${optimizerName}`)

    // Store execution info
    this.activeExecutions.set(executionId, {
      jobName,
      ws,
      startTime: Date.now(),
      params
    })

    try {
      // Send initial log
      this.sendLog(ws, 'info', 'Starting optimization execution...', 'system')

      // Create Kubernetes job for execution with streaming support
      const job = await this.createStreamingExecutionJob(jobName, params, executionId)

      this.sendLog(ws, 'info', `Execution job created: ${jobName}`, 'system')

      // Start log streaming from the pod
      const result = await this.waitForJobCompletionWithStreaming(jobName, executionId, ws)

      this.sendLog(ws, 'info', 'Optimization completed successfully!', 'system')

      // Clean up job
      await this.deleteJob(jobName)

      return result

    } catch (error) {
      console.error(`❌ Streaming execution error: ${error.message}`)
      this.sendLog(ws, 'error', `Execution failed: ${error.message}`, 'system')

      // Clean up job on error
      try {
        await this.deleteJob(jobName)
      } catch (cleanupError) {
        console.error(`Failed to cleanup job ${jobName}:`, cleanupError)
      }

      throw error
    } finally {
      // Clean up execution tracking
      this.activeExecutions.delete(executionId)
    }
  }

  /**
   * Create Kubernetes job with streaming support
   */
  async createStreamingExecutionJob(jobName, params, executionId) {
    const jobSpec = {
      metadata: {
        name: jobName,
        namespace: this.namespace,
        labels: {
          'app': 'qubots-streaming-execution',
          'execution-id': executionId
        }
      },
      spec: {
        template: {
          metadata: {
            labels: {
              'app': 'qubots-streaming-execution',
              'job': jobName,
              'execution-id': executionId
            }
          },
          spec: {
            containers: [{
              name: 'qubots-executor',
              image: this.baseImage,
              command: ['python3', '-u', '-c'],  // -u flag for unbuffered output
              args: [this.generateStreamingExecutionScript(params, executionId)],
              env: [
                { name: 'PROBLEM_REPO', value: params.problemName },
                { name: 'OPTIMIZER_REPO', value: params.optimizerName },
                { name: 'PROBLEM_USERNAME', value: params.problemUsername },
                { name: 'OPTIMIZER_USERNAME', value: params.optimizerUsername },
                { name: 'EXECUTION_ID', value: executionId },
                { name: 'GITEA_URL', value: process.env.GITEA_URL || 'https://hub.rastion.com' },
                { name: 'PLATFORM_API_BASE', value: process.env.PLATFORM_API_BASE || 'http://backend:4000/api' },
                { name: 'STREAMING_ENABLED', value: 'true' },
                { name: 'PYTHONUNBUFFERED', value: '1' },  // Force unbuffered output
                { name: 'PYTHONIOENCODING', value: 'utf-8' },  // Ensure proper encoding
                { name: 'PYTHONFLUSHOUTPUT', value: '1' }  // Additional flush control
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
        ttlSecondsAfterFinished: 300 // Clean up job and pods 5 minutes after completion
      }
    }

    // Safety check for namespace
    if (!this.namespace) {
      console.error('❌ Namespace is null/undefined at job creation time')
      this.namespace = 'playground'
    }

    // Additional validation and logging
    console.log(`🚀 Creating job in namespace: ${this.namespace}`)
    console.log(`🔍 Namespace type: ${typeof this.namespace}`)
    console.log(`🔍 Namespace value: "${this.namespace}"`)
    console.log(`🔍 Job spec metadata namespace: ${jobSpec.metadata.namespace}`)

    // Ensure namespace is a string and not empty
    const validatedNamespace = String(this.namespace).trim()
    if (!validatedNamespace) {
      throw new Error('Namespace validation failed: namespace is empty or invalid')
    }

    console.log(`✅ Using validated namespace: "${this.namespace}"`)

    // Debug the actual parameters being passed
    console.log(`🔍 About to call createNamespacedJob with:`)
    console.log(`🔍 - namespace: "${this.namespace}" (type: ${typeof this.namespace})`)
    console.log(`🔍 - jobSpec: ${JSON.stringify(jobSpec, null, 2)}`)

    // Ensure we're passing the parameters correctly
    const namespace = String(this.namespace).trim()
    if (!namespace) {
      throw new Error('Namespace is empty after validation')
    }

    console.log(`🔍 Final namespace parameter: "${namespace}"`)

    // Use object format for the API call (newer API style)
    console.log(`🔍 Creating job with object format: createNamespacedJob({ namespace, body: jobSpec })`)
    const response = await this.batchV1Api.createNamespacedJob({
      namespace: namespace,
      body: jobSpec
    })

    // Handle different response structures
    return response.body || response
  }

  /**
   * Generate Python script for streaming execution
   */
  generateStreamingExecutionScript(params, executionId) {
    const script = `
import sys
import json
import time
import traceback
import os
from datetime import datetime

# Force unbuffered output for real-time streaming in Kubernetes
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, line_buffering=True)
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, line_buffering=True)

# Add qubots to path
sys.path.insert(0, '/app')

# Set execution ID for this run
execution_id = '${executionId}'

def stream_log(level, message, source='qubots'):
    """Stream log message as JSON to stdout for real-time pickup"""
    log_entry = {
        'timestamp': datetime.now().isoformat(),
        'level': level,
        'message': message,
        'source': source,
        'execution_id': '${executionId}'
    }

    # Write to log file for backup
    log_file = f'/tmp/qubots_logs_{execution_id}.jsonl'
    try:
        with open(log_file, 'a') as f:
            f.write(json.dumps(log_entry) + '\\n')
            f.flush()
            os.fsync(f.fileno())  # Force write to disk
    except Exception as e:
        pass  # Don't fail on log file issues

    # Print with STREAM_LOG prefix for reliable parsing
    print(f"STREAM_LOG: {json.dumps(log_entry)}", flush=True)
    sys.stdout.flush()

# Enhanced log callback that captures all optimizer logs
def enhanced_log_callback(level, message, source='optimizer'):
    """Enhanced log callback that ensures all optimizer logs are captured"""
    # Stream the log immediately (this will handle all output)
    stream_log(level, message, source)

try:
    stream_log('info', 'Initializing qubots execution environment...', 'system')

    # Import qubots with proper AutoProblem and AutoOptimizer
    from qubots import AutoProblem, AutoOptimizer
    import qubots.rastion as rastion

    # Test the log streaming immediately
    stream_log('debug', 'Log streaming test - this should appear in terminal', 'system')
    stream_log('info', 'Setting up enhanced logging for optimizer feedback...', 'system')

    stream_log('info', 'Starting optimization with real-time logging...', 'system')

    # Get platform API base URL from environment
    platform_api_base = os.environ.get('PLATFORM_API_BASE', 'http://backend:4000/api')
    stream_log('info', f'Using platform API base: {platform_api_base}', 'system')

    # Prepare problem parameters with dataset connection if available
    problem_params = ${this.convertToPythonDict(params.problemParams)}
    if 'platform_api_base' not in problem_params:
        problem_params['platform_api_base'] = platform_api_base

    # Handle dataset connection for problems
    if 'dataset_id' in problem_params:
        stream_log('info', f'Connecting to dataset: {problem_params["dataset_id"]}', 'dataset')
        problem_params['dataset_source'] = 'platform'
        problem_params['rastion_dataset_id'] = problem_params['dataset_id']

    # Load problem from repository using AutoProblem
    stream_log('info', f'Loading problem from repository: ${params.problemUsername}/${params.problemName}', 'problem')
    problem = AutoProblem.from_repo(
        '${params.problemUsername}/${params.problemName}',
        override_params=problem_params
    )
    stream_log('info', 'Problem loaded successfully', 'problem')

    # Load optimizer from repository using AutoOptimizer
    stream_log('info', f'Loading optimizer from repository: ${params.optimizerUsername}/${params.optimizerName}', 'optimizer')
    optimizer = AutoOptimizer.from_repo(
        '${params.optimizerUsername}/${params.optimizerName}',
        override_params=${this.convertToPythonDict(params.optimizerParams)}
    )
    stream_log('info', 'Optimizer loaded successfully', 'optimizer')

    # Execute optimization with streaming logs
    stream_log('info', 'Starting optimization execution...', 'optimization')

    # Add progress tracking if the optimizer supports it
    try:
        result = optimizer.optimize(problem)
        stream_log('info', 'Optimization process completed', 'optimization')
    except Exception as opt_error:
        stream_log('error', f'Optimization failed: {str(opt_error)}', 'optimization')
        raise opt_error

    stream_log('info', 'Optimization execution completed', 'system')

    # Process and log optimization results
    if result:
        stream_log('info', '✅ Optimization completed successfully!', 'results')

        # Log key results for immediate feedback
        if hasattr(result, 'best_value') and result.best_value is not None:
            stream_log('info', f'🎯 Best value achieved: {result.best_value}', 'results')
        if hasattr(result, 'best_solution') and result.best_solution is not None:
            stream_log('info', f'📋 Solution found: {str(result.best_solution)[:100]}...', 'results')
        if hasattr(result, 'runtime_seconds') and result.runtime_seconds is not None:
            stream_log('info', f'⏱️ Runtime: {result.runtime_seconds:.3f} seconds', 'results')
        if hasattr(result, 'iterations') and result.iterations is not None:
            stream_log('info', f'🔄 Total iterations: {result.iterations}', 'results')

        # Convert result to dictionary for JSON serialization
        result_dict = {
            'success': True,
            'best_value': getattr(result, 'best_value', None),
            'best_solution': getattr(result, 'best_solution', None),
            'runtime_seconds': getattr(result, 'runtime_seconds', None),
            'iterations': getattr(result, 'iterations', None),
            'metadata': getattr(result, 'metadata', {}),
            'timestamp': datetime.now().isoformat()
        }
    else:
        stream_log('error', '❌ Optimization returned no result', 'results')
        result_dict = {
            'success': False,
            'error_message': 'No result returned from optimization',
            'timestamp': datetime.now().isoformat()
        }

    # Also print the complete result as JSON for parsing
    print("OPTIMIZATION_RESULT_JSON:", json.dumps(result_dict, default=str), flush=True)

    # Write final result
    result_file = f'/tmp/qubots_result_{execution_id}.json'
    with open(result_file, 'w') as f:
        json.dump(result_dict, f, indent=2, default=str)

    stream_log('info', f'Results written to {result_file}', 'system')

except Exception as e:
    error_msg = f"Execution failed: {str(e)}"
    stream_log('error', error_msg, 'system')
    stream_log('debug', f'Traceback: {traceback.format_exc()}', 'system')

    # Write error result
    error_result = {
        'success': False,
        'error_message': str(e),
        'error_type': type(e).__name__,
        'timestamp': datetime.now().isoformat()
    }

    result_file = f'/tmp/qubots_result_{execution_id}.json'
    with open(result_file, 'w') as f:
        json.dump(error_result, f, indent=2, default=str)

    sys.exit(1)
`
    return script
  }

  /**
   * Wait for job completion while streaming logs
   */
  async waitForJobCompletionWithStreaming(jobName, executionId, ws) {
    const maxAttempts = 60 // 5 minutes with 5-second intervals
    let attempts = 0

    // Start log streaming in parallel
    this.startLogStreaming(jobName, executionId, ws)

    while (attempts < maxAttempts) {
      try {
        const jobResponse = await this.batchV1Api.readNamespacedJobStatus({
          name: jobName,
          namespace: this.namespace
        })

        // Debug the response structure
        console.log(`🔍 Job response structure:`, JSON.stringify(jobResponse, null, 2))

        // Handle different response structures
        const job = jobResponse.body || jobResponse

        if (!job || !job.status) {
          console.log(`⚠️ Job status not available yet for ${jobName}`)
          continue
        }

        if (job.status.succeeded) {
          // Job completed successfully, get the result
          const result = await this.getJobResult(jobName, executionId)
          return result
        }

        if (job.status.failed) {
          throw new Error(`Job failed: ${JSON.stringify(job.status)}`)
        }

        // Job still running, wait and check again
        await new Promise(resolve => setTimeout(resolve, 5000))
        attempts++

      } catch (error) {
        if (error.response && error.response.statusCode === 404) {
          throw new Error('Job not found')
        }
        throw error
      }
    }

    throw new Error('Job timeout')
  }

  /**
   * Start streaming logs from the job pod
   */
  async startLogStreaming(jobName, executionId, ws) {
    try {
      // Wait a bit for pod to start
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Get pod name for the job
      const podName = await this.getPodNameForJob(jobName)
      if (!podName) {
        console.log('Pod not found for job:', jobName)
        return
      }

      // Stream logs from the pod
      this.streamPodLogs(podName, executionId, ws)

    } catch (error) {
      console.error('Error starting log streaming:', error)
      this.sendLog(ws, 'warning', 'Log streaming unavailable', 'system')
    }
  }

  /**
   * Stream logs from a specific pod using proper Kubernetes client streaming
   */
  async streamPodLogs(podName, executionId, ws) {
    try {
      console.log(`🔍 Starting log stream for pod: ${podName}, execution: ${executionId}`)
      this.sendLog(ws, 'debug', `Starting log stream for pod: ${podName}`, 'system')

      // Wait for pod to be ready before streaming logs
      await this.waitForPodReady(podName)

      console.log(`📡 Setting up real-time log streaming`)

      // Create a custom writable stream to capture logs
      const { Writable } = require('stream')
      let logBuffer = ''

      const self = this
      const logCaptureStream = new Writable({
        write(chunk, _encoding, callback) {
          const chunkStr = chunk.toString()
          console.log(`📥 Received log chunk (${chunkStr.length} chars):`, chunkStr.substring(0, 200))

          logBuffer += chunkStr
          const lines = logBuffer.split('\n')

          // Keep the last incomplete line in buffer
          logBuffer = lines.pop() || ''

          for (const line of lines) {
            if (line.trim()) {
              console.log(`🔍 Processing log line:`, line.trim())
              self.processLogLine(line.trim(), executionId, ws)
            }
          }

          callback()
        }
      })

      // Use the log method from the Kubernetes client that supports streaming
      const logStream = new k8s.Log(this.kc)

      // Stream logs with follow enabled
      await logStream.log(
        this.namespace,
        podName,
        'qubots-executor',
        logCaptureStream,
        {
          follow: true,
          tailLines: 50,
          pretty: false,
          timestamps: true
        }
      )

      console.log(`✅ Log stream established for pod: ${podName}`)

      // Handle stream events
      logCaptureStream.on('finish', () => {
        console.log('Log stream ended for pod:', podName)
        // Process any remaining buffer content
        if (logBuffer.trim()) {
          self.processLogLine(logBuffer.trim(), executionId, ws)
        }
        self.sendLog(ws, 'info', 'Log stream completed', 'system')
      })

      logCaptureStream.on('error', (error) => {
        console.error('Log capture stream error:', error)
        self.sendLog(ws, 'error', `Log stream error: ${error.message}`, 'system')
      })

    } catch (error) {
      console.error('Error streaming pod logs:', error)
      this.sendLog(ws, 'error', `Failed to stream logs: ${error.message}`, 'system')

      // Fall back to polling logs if streaming fails
      console.log('Falling back to polling logs...')
      this.pollPodLogs(podName, executionId, ws)
    }
  }

  /**
   * Wait for pod to be ready
   */
  async waitForPodReady(podName, maxWaitTime = 30000) {
    const startTime = Date.now()

    while (Date.now() - startTime < maxWaitTime) {
      try {
        const podResponse = await this.coreV1Api.readNamespacedPod({
          name: podName,
          namespace: this.namespace
        })

        // Handle different response structures
        const pod = podResponse.body || podResponse

        if (!pod || !pod.status) {
          console.log(`⏳ Pod ${podName} status not available yet`)
          await new Promise(resolve => setTimeout(resolve, 1000))
          continue
        }

        if (pod.status.phase === 'Running') {
          console.log(`✅ Pod ${podName} is ready`)
          return true
        }

        console.log(`⏳ Waiting for pod ${podName} to be ready, current phase: ${pod.status.phase}`)
        await new Promise(resolve => setTimeout(resolve, 1000))

      } catch (error) {
        console.log(`⏳ Pod ${podName} not found yet, waiting...`)
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }

    throw new Error(`Pod ${podName} did not become ready within ${maxWaitTime}ms`)
  }

  /**
   * Fallback method to poll logs if streaming fails
   */
  async pollPodLogs(podName, executionId, ws) {
    let lastLogLength = 0
    const pollInterval = 2000 // 2 seconds
    let pollCount = 0
    const maxPolls = 150 // 5 minutes max

    const pollLogs = async () => {
      try {
        if (pollCount >= maxPolls) {
          console.log('Max polling attempts reached')
          return
        }

        pollCount++

        // Get current logs
        const logResponse = await this.coreV1Api.readNamespacedPodLog({
          name: podName,
          namespace: this.namespace,
          container: 'qubots-executor'
        })

        const currentLogs = logResponse.body || logResponse

        // Only process new log content
        if (currentLogs.length > lastLogLength) {
          const newLogs = currentLogs.substring(lastLogLength)
          lastLogLength = currentLogs.length

          // Process new log lines
          const lines = newLogs.split('\n')
          for (const line of lines) {
            if (line.trim()) {
              this.processLogLine(line.trim(), executionId, ws)
            }
          }
        }

        // Continue polling
        setTimeout(pollLogs, pollInterval)

      } catch (error) {
        console.error('Error polling logs:', error)
        // Continue polling even on errors
        setTimeout(pollLogs, pollInterval)
      }
    }

    // Start polling
    pollLogs()
  }

  /**
   * Process individual log lines with enhanced parsing
   */
  processLogLine(line, executionId, ws) {
    try {
      // Remove timestamp prefix if present (Kubernetes adds timestamps)
      const trimmedLine = line.trim()
      const cleanLine = trimmedLine.replace(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d+Z\s+/, '')

      // Skip empty lines
      if (!cleanLine) {
        return
      }

      console.log(`🔍 Processing line for execution ${executionId}:`, cleanLine)

      // First, check for our custom STREAM_LOG format (this is our primary format)
      if (cleanLine.includes('STREAM_LOG:')) {
        console.log(`📋 Found STREAM_LOG format`)
        const jsonPart = cleanLine.substring(cleanLine.indexOf('STREAM_LOG:') + 11).trim()
        try {
          const logEntry = JSON.parse(jsonPart)
          console.log(`📊 Parsed log entry:`, logEntry)
          if (logEntry.execution_id === executionId) {
            // Filter out metrics duplicates - only show optimizer logs
            if (logEntry.source === 'metrics') {
              console.log(`🔇 Skipping metrics duplicate for: ${logEntry.message}`)
              return
            }
            console.log(`✅ Execution ID matches, sending log`)
            this.sendLog(ws, logEntry.level, logEntry.message, logEntry.source)
            return // Important: return here to avoid processing the same message multiple times
          } else {
            console.log(`❌ Execution ID mismatch: ${logEntry.execution_id} !== ${executionId}`)
          }
        } catch (e) {
          console.log('Failed to parse STREAM_LOG JSON:', e.message)
          // Fall through to other parsing methods
        }
      }

      // Skip lines that look like they might be duplicates of STREAM_LOG entries
      // (e.g., raw JSON without STREAM_LOG prefix)
      if (cleanLine.startsWith('{"timestamp"') && cleanLine.includes('"execution_id"')) {
        console.log('Skipping potential duplicate JSON log entry')
        return
      }

      // Check for structured logs with levels (from qubots library)
      if (cleanLine.includes('[INFO]') || cleanLine.includes('[DEBUG]') ||
          cleanLine.includes('[WARNING]') || cleanLine.includes('[ERROR]')) {
        const levelMatch = cleanLine.match(/\[(INFO|DEBUG|WARNING|ERROR)\]/)
        if (levelMatch) {
          const level = levelMatch[1].toLowerCase()
          const message = cleanLine.replace(/\[.*?\]\s*/, '').replace(/\[.*?\]\s*/, '')
          this.sendLog(ws, level, message, 'optimizer')
          return
        }
      }

      // Check for AutoProblem and AutoOptimizer loading messages
      if (cleanLine.includes('Loading problem from repository') ||
          cleanLine.includes('Problem loaded successfully') ||
          cleanLine.includes('Loading optimizer from repository') ||
          cleanLine.includes('Optimizer loaded successfully')) {
        this.sendLog(ws, 'info', cleanLine, 'qubots')
        return
      }

      // Check for optimization progress indicators (common patterns)
      if (cleanLine.includes('Generation') || cleanLine.includes('Iteration') ||
          cleanLine.includes('Progress') || cleanLine.includes('Best') ||
          cleanLine.includes('fitness') || cleanLine.includes('objective') ||
          cleanLine.includes('value:') || cleanLine.includes('improvement') ||
          cleanLine.includes('Starting optimization') || cleanLine.includes('Optimization completed')) {
        this.sendLog(ws, 'info', cleanLine, 'optimizer')
        return
      }

      // Check for dataset connection messages
      if (cleanLine.includes('Connecting to dataset') ||
          cleanLine.includes('Dataset loaded') ||
          cleanLine.includes('dataset_id')) {
        this.sendLog(ws, 'info', cleanLine, 'dataset')
        return
      }

      // Check for qubots-specific messages
      if (cleanLine.includes('qubots') || cleanLine.includes('optimization') ||
          cleanLine.includes('Executing') || cleanLine.includes('Loading') ||
          cleanLine.includes('Starting') || cleanLine.includes('Completed')) {
        this.sendLog(ws, 'info', cleanLine, 'qubots')
        return
      }

      // Check for error indicators
      if (cleanLine.toLowerCase().includes('error') || cleanLine.toLowerCase().includes('exception') ||
          cleanLine.toLowerCase().includes('failed') || cleanLine.toLowerCase().includes('traceback')) {
        this.sendLog(ws, 'error', cleanLine, 'pod')
        return
      }

      // Check for result indicators (qubots library specific)
      if (cleanLine.includes('Best value:') || cleanLine.includes('Runtime:') ||
          cleanLine.includes('Iterations:') || cleanLine.includes('Solution found')) {
        this.sendLog(ws, 'info', cleanLine, 'results')
        return
      }

      // Check for success indicators
      if (cleanLine.toLowerCase().includes('success') || cleanLine.toLowerCase().includes('complete') ||
          cleanLine.toLowerCase().includes('finished')) {
        this.sendLog(ws, 'info', cleanLine, 'system')
        return
      }

      // Any other non-empty line as debug (but filter out very verbose logs)
      if (cleanLine.length > 0 && !cleanLine.includes('kubernetes') && !cleanLine.includes('container')) {
        this.sendLog(ws, 'debug', cleanLine, 'pod')
      }

    } catch (error) {
      console.error('Error processing log line:', error)
      // Send the raw line as debug if processing fails
      this.sendLog(ws, 'debug', line, 'raw')
    }
  }

  /**
   * Send log message via WebSocket
   */
  sendLog(ws, level, message, source) {
    if (ws && ws.readyState === WebSocket.OPEN) {
      const logMessage = {
        type: 'optimization_log',
        data: {
          timestamp: new Date().toISOString(),
          level,
          message,
          source
        }
      }
      ws.send(JSON.stringify(logMessage))
    }
  }

  /**
   * Get job result from the completed pod
   */
  async getJobResult(jobName, executionId) {
    try {
      const podName = await this.getPodNameForJob(jobName)
      if (!podName) {
        throw new Error('Pod not found for completed job')
      }

      // Try to extract the result file from the pod
      const resultFile = `/tmp/qubots_result_${executionId}.json`

      try {
        // Use Kubernetes API to exec into pod and get result file
        const k8sExec = new k8s.Exec(this.kc)

        console.log(`📄 Extracting result file from pod: ${podName}`)

        // Create a promise to capture the exec output
        const execResult = await new Promise((resolve, reject) => {
          let stdout = ''
          let stderr = ''

          k8sExec.exec(
            this.namespace,
            podName,
            'qubots-executor',
            ['cat', resultFile],
            null, // stdout - we'll capture this ourselves
            null, // stderr - we'll capture this ourselves
            null, // stdin - not needed
            false, // tty
            (status) => {
              if (status.status === 'Success') {
                resolve(stdout)
              } else {
                reject(new Error(`Exec failed with status: ${status.status}, stderr: ${stderr}`))
              }
            }
          ).then((conn) => {
            // Capture stdout and stderr
            conn.on('data', (channel, data) => {
              if (channel === 1) { // stdout
                stdout += data.toString()
              } else if (channel === 2) { // stderr
                stderr += data.toString()
              }
            })

            conn.on('close', () => {
              if (stdout.trim()) {
                resolve(stdout.trim())
              } else {
                reject(new Error(`No output from result file. stderr: ${stderr}`))
              }
            })

            conn.on('error', (error) => {
              reject(new Error(`Connection error: ${error.message}`))
            })
          }).catch(reject)
        })

        if (execResult) {
          const result = JSON.parse(execResult)
          console.log(`✅ Successfully extracted optimization result:`, result)
          return result
        }
      } catch (extractError) {
        console.log(`⚠️ Could not extract result file: ${extractError.message}`)
      }

      // Enhanced fallback: extract results from execution logs
      console.log(`🔍 Attempting to extract results from execution logs for ${executionId}`)
      const logBasedResult = await this.extractResultFromLogs(jobName, executionId)

      if (logBasedResult) {
        console.log(`✅ Successfully extracted result from logs:`, logBasedResult)
        return logBasedResult
      }

      // Final fallback: return a basic success result with execution info
      const execution = this.activeExecutions.get(executionId)
      const params = execution ? execution.params : {}

      return {
        success: true,
        execution_time: execution ? (Date.now() - execution.startTime) / 1000 : 0,
        timestamp: new Date().toISOString(),
        message: 'Optimization completed with streaming logs',
        problem_name: params.problemName || 'unknown',
        optimizer_name: params.optimizerName || 'unknown',
        problem_username: params.problemUsername || 'unknown',
        optimizer_username: params.optimizerUsername || 'unknown'
      }

    } catch (error) {
      console.error('Error getting job result:', error)
      return {
        success: false,
        error_message: error.message,
        timestamp: new Date().toISOString()
      }
    }
  }

  /**
   * Extract optimization results from pod logs when result file is not available
   */
  async extractResultFromLogs(jobName, executionId) {
    try {
      const podName = await this.getPodNameForJob(jobName)
      if (!podName) {
        console.log('Pod not found for log extraction')
        return null
      }

      // Get execution info to include problem/optimizer names
      const execution = this.activeExecutions.get(executionId)
      const params = execution ? execution.params : {}

      // Get all logs from the pod using Kubernetes API
      console.log(`📋 Extracting logs from pod: ${podName}`)

      const logResponse = await this.coreV1Api.readNamespacedPodLog({
        name: podName,
        namespace: this.namespace,
        container: 'qubots-executor'
      })

      const stdout = logResponse.body || logResponse
      if (!stdout) {
        console.log('No logs found in pod')
        return null
      }

      // Parse logs to extract optimization results
      const lines = stdout.split('\n')
      const result = {
        success: true,
        timestamp: new Date().toISOString(),
        execution_time: 0,
        best_value: null,
        iterations: null,
        problem_name: params.problemName || null,
        optimizer_name: params.optimizerName || null,
        problem_username: params.problemUsername || null,
        optimizer_username: params.optimizerUsername || null
      }

      let executionStartTime = null
      let executionEndTime = null

      for (const line of lines) {
        const trimmedLine = line.trim()

        // Try to extract complete JSON result from our explicit JSON output
        if (trimmedLine.includes('OPTIMIZATION_RESULT_JSON:')) {
          try {
            const jsonPart = trimmedLine.substring(trimmedLine.indexOf('OPTIMIZATION_RESULT_JSON:') + 26).trim()
            const jsonResult = JSON.parse(jsonPart)
            if (jsonResult.success !== undefined) {
              console.log('Found complete optimization result JSON in logs:', jsonResult)
              // Use the complete result from logs
              return {
                success: jsonResult.success,
                best_value: jsonResult.best_value,
                iterations: jsonResult.iterations,
                execution_time: jsonResult.execution_time || result.execution_time,
                timestamp: new Date().toISOString(),
                problem_name: jsonResult.problem_name || result.problem_name,
                optimizer_name: jsonResult.optimizer_name || result.optimizer_name,
                problem_username: jsonResult.problem_username || result.problem_username,
                optimizer_username: jsonResult.optimizer_username || result.optimizer_username
              }
            }
          } catch (e) {
            console.log('Failed to parse OPTIMIZATION_RESULT_JSON:', e.message)
          }
        }

        // Try to extract complete JSON result if it's printed in logs (fallback)
        if (trimmedLine.startsWith('{') && trimmedLine.includes('best_value') && trimmedLine.includes('success')) {
          try {
            const jsonResult = JSON.parse(trimmedLine)
            if (jsonResult.success !== undefined) {
              console.log('Found complete JSON result in logs:', jsonResult)
              // Use the complete result from logs
              return {
                success: jsonResult.success,
                best_value: jsonResult.best_value,
                iterations: jsonResult.iterations,
                execution_time: jsonResult.execution_time || result.execution_time,
                timestamp: new Date().toISOString(),
                problem_name: jsonResult.problem_name || result.problem_name,
                optimizer_name: jsonResult.optimizer_name || result.optimizer_name,
                problem_username: jsonResult.problem_username || result.problem_username,
                optimizer_username: jsonResult.optimizer_username || result.optimizer_username
              }
            }
          } catch (e) {
            // Not valid JSON, continue with other parsing
          }
        }

        // Extract execution timing
        if (trimmedLine.includes('Starting optimization execution')) {
          const timeMatch = trimmedLine.match(/(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d+Z)/)
          if (timeMatch) {
            executionStartTime = new Date(timeMatch[1])
          }
        }

        if (trimmedLine.includes('Optimization execution completed')) {
          const timeMatch = trimmedLine.match(/(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d+Z)/)
          if (timeMatch) {
            executionEndTime = new Date(timeMatch[1])
          }
        }

        // Extract best value from structured logs
        if (trimmedLine.includes('🎯 Best value achieved:')) {
          const valueMatch = trimmedLine.match(/Best value achieved:\s*([\d.-]+)/)
          if (valueMatch) {
            result.best_value = parseFloat(valueMatch[1])
          }
        }

        // Extract iterations from structured logs
        if (trimmedLine.includes('🔄 Total iterations:')) {
          const iterMatch = trimmedLine.match(/Total iterations:\s*(\d+)/)
          if (iterMatch) {
            result.iterations = parseInt(iterMatch[1])
          }
        }

        // Extract from PlaygroundResult dictionary format (this is what we're actually getting)
        if (trimmedLine.includes("'best_value':") || trimmedLine.includes('"best_value":')) {
          const valueMatch = trimmedLine.match(/['"]best_value['"]:\s*([\d.-]+)/)
          if (valueMatch) {
            result.best_value = parseFloat(valueMatch[1])
          }
        }

        if (trimmedLine.includes("'iterations':") || trimmedLine.includes('"iterations":')) {
          const iterMatch = trimmedLine.match(/['"]iterations['"]:\s*(\d+)/)
          if (iterMatch) {
            result.iterations = parseInt(iterMatch[1])
          }
        }

        // Extract from Python print statements showing results
        if (trimmedLine.includes('best_value=') || trimmedLine.includes('best_value :')) {
          const valueMatch = trimmedLine.match(/best_value[=:]\s*([\d.-]+)/)
          if (valueMatch) {
            result.best_value = parseFloat(valueMatch[1])
          }
        }

        if (trimmedLine.includes('iterations=') || trimmedLine.includes('iterations :')) {
          const iterMatch = trimmedLine.match(/iterations[=:]\s*(\d+)/)
          if (iterMatch) {
            result.iterations = parseInt(iterMatch[1])
          }
        }

        // Extract execution time from logs
        if (trimmedLine.includes('⏱️ Execution time:')) {
          const timeMatch = trimmedLine.match(/Execution time:\s*([\d.]+)s/)
          if (timeMatch) {
            result.execution_time = parseFloat(timeMatch[1])
          }
        }

        // Extract runtime information
        if (trimmedLine.includes('Runtime:') && trimmedLine.includes('seconds')) {
          const runtimeMatch = trimmedLine.match(/Runtime:\s*([\d.]+)\s*seconds/)
          if (runtimeMatch) {
            result.execution_time = parseFloat(runtimeMatch[1])
          }
        }

        // Extract OR-Tools specific results
        if (trimmedLine.includes('OR-Tools objective:')) {
          const objMatch = trimmedLine.match(/OR-Tools objective:\s*([\d.-]+)/)
          if (objMatch) {
            result.best_value = parseFloat(objMatch[1])
          }
        }

        if (trimmedLine.includes('Verified value:')) {
          const verifiedMatch = trimmedLine.match(/Verified value:\s*([\d.-]+)/)
          if (verifiedMatch) {
            result.best_value = parseFloat(verifiedMatch[1])
          }
        }

        if (trimmedLine.includes('Branches:')) {
          const branchMatch = trimmedLine.match(/Branches:\s*(\d+)/)
          if (branchMatch) {
            result.iterations = parseInt(branchMatch[1])
          }
        }

        // Extract additional optimization metrics
        if (trimmedLine.includes('Final objective:') || trimmedLine.includes('Objective value:')) {
          const objMatch = trimmedLine.match(/(?:Final objective|Objective value):\s*([\d.-]+)/)
          if (objMatch) {
            result.best_value = parseFloat(objMatch[1])
          }
        }

        // Extract convergence information from genetic algorithm
        if (trimmedLine.includes('Generation') && trimmedLine.includes('Best:')) {
          const genMatch = trimmedLine.match(/Generation\s*(\d+).*Best:\s*([\d.-]+)/)
          if (genMatch) {
            result.iterations = parseInt(genMatch[1])
            result.best_value = parseFloat(genMatch[2])
          }
        }

        // Extract genetic algorithm specific patterns
        if (trimmedLine.includes('New best fitness')) {
          const fitnessMatch = trimmedLine.match(/New best fitness\s*([\d.-]+)/)
          if (fitnessMatch) {
            result.best_value = parseFloat(fitnessMatch[1])
          }
          // Extract generation number if present
          const genMatch = trimmedLine.match(/Generation\s*(\d+)/)
          if (genMatch) {
            result.iterations = parseInt(genMatch[1])
          }
        }

        // Extract final results from genetic algorithm
        if (trimmedLine.includes('Final best fitness:')) {
          const finalMatch = trimmedLine.match(/Final best fitness:\s*([\d.-]+)/)
          if (finalMatch) {
            result.best_value = parseFloat(finalMatch[1])
          }
        }

        // Extract total generations
        if (trimmedLine.includes('Total generations:')) {
          const totalGenMatch = trimmedLine.match(/Total generations:\s*(\d+)/)
          if (totalGenMatch) {
            result.iterations = parseInt(totalGenMatch[1])
          }
        }

        // Extract evolution completion info
        if (trimmedLine.includes('Evolution completed in')) {
          const timeMatch = trimmedLine.match(/Evolution completed in\s*([\d.]+)\s*seconds/)
          if (timeMatch) {
            result.execution_time = parseFloat(timeMatch[1])
          }
        }

        // Extract solution quality indicators
        if (trimmedLine.includes('Solution found') || trimmedLine.includes('Optimal solution')) {
          result.solution_quality = 'optimal'
        }

        // Check for error indicators
        if (trimmedLine.includes('❌ Optimization failed') ||
            trimmedLine.toLowerCase().includes('error:') ||
            trimmedLine.toLowerCase().includes('exception:')) {
          result.success = false
          result.error_message = trimmedLine
        }
      }

      // Calculate execution time from timestamps if not found in logs
      if (result.execution_time === 0 && executionStartTime && executionEndTime) {
        result.execution_time = (executionEndTime - executionStartTime) / 1000
      }

      // Only return result if we found meaningful data
      if (result.best_value !== null || result.iterations !== null || result.execution_time > 0) {
        console.log(`📊 Extracted result from logs:`, result)
        return result
      }

      console.log('No meaningful optimization data found in logs')
      return null

    } catch (error) {
      console.error('Error extracting result from logs:', error)
      return null
    }
  }

  /**
   * Get pod name for a job
   */
  async getPodNameForJob(jobName) {
    try {
      const podsResponse = await this.coreV1Api.listNamespacedPod({
        namespace: this.namespace,
        labelSelector: `job-name=${jobName}`
      })

      // Handle different response structures
      const responseBody = podsResponse.body || podsResponse
      const pods = responseBody.items || []

      if (pods.length > 0) {
        return pods[0].metadata.name
      }

      return null
    } catch (error) {
      console.error('Error getting pod for job:', error)
      return null
    }
  }

  /**
   * Delete a job
   */
  async deleteJob(jobName) {
    try {
      // Validate namespace before deletion
      const validatedNamespace = String(this.namespace).trim()
      if (!validatedNamespace) {
        throw new Error('Cannot delete job: namespace is empty or invalid')
      }

      console.log(`🗑️ Deleting job ${jobName} from namespace ${validatedNamespace}`)
      await this.batchV1Api.deleteNamespacedJob({
        name: jobName,
        namespace: validatedNamespace,
        propagationPolicy: 'Background'
      })
      console.log(`🗑️ Job deleted: ${jobName}`)
    } catch (error) {
      console.error(`Error deleting job ${jobName}:`, error.message)
    }
  }

  /**
   * Convert JavaScript object to Python dictionary string with proper boolean conversion
   */
  convertToPythonDict(obj) {
    if (!obj || typeof obj !== 'object') {
      return '{}'
    }

    const convertValue = (value) => {
      if (value === true) return 'True'
      if (value === false) return 'False'
      if (value === null) return 'None'
      if (typeof value === 'string') return `"${value.replace(/"/g, '\\"')}"`
      if (typeof value === 'number') return value.toString()
      if (Array.isArray(value)) {
        return `[${value.map(convertValue).join(', ')}]`
      }
      if (typeof value === 'object') {
        const pairs = Object.entries(value).map(([k, v]) => `"${k}": ${convertValue(v)}`)
        return `{${pairs.join(', ')}}`
      }
      return `"${value}"`
    }

    const pairs = Object.entries(obj).map(([key, value]) => `"${key}": ${convertValue(value)}`)
    return `{${pairs.join(', ')}}`
  }

  /**
   * Generate unique job ID
   */
  generateJobId() {
    return crypto.randomBytes(8).toString('hex')
  }

  /**
   * Stop an active execution
   */
  async stopExecution(executionId) {
    const execution = this.activeExecutions.get(executionId)
    if (execution) {
      try {
        await this.deleteJob(execution.jobName)
        this.sendLog(execution.ws, 'warning', 'Execution stopped by user', 'system')
        this.activeExecutions.delete(executionId)
      } catch (error) {
        console.error('Error stopping execution:', error)
      }
    }
  }
}

module.exports = QubotStreamingExecutionService

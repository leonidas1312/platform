/**
 * Qubots Execution Service
 *
 * Provides qubots optimization execution using Kubernetes jobs with the new AutoProblem and AutoOptimizer API.
 * Uses the simplified qubots workflow: AutoProblem.from_repo() + AutoOptimizer.from_repo() + optimizer.optimize(problem).
 * This approach matches local development patterns and eliminates the need for playground_integration.
 */

const k8s = require('@kubernetes/client-node')
const crypto = require('crypto')

class QubotExecutionService {
  constructor() {
    // Initialize Kubernetes client
    this.kc = new k8s.KubeConfig()
    this.kc.loadFromDefault()
    this.k8sApi = this.kc.makeApiClient(k8s.CoreV1Api)
    this.k8sBatchApi = this.kc.makeApiClient(k8s.BatchV1Api)

    // Configuration
    this.namespace = process.env.PLAYGROUND_NAMESPACE || 'playground'
    this.baseImage = process.env.PLAYGROUND_IMAGE || 'registry.digitalocean.com/rastion/qubots-playground:latest'
    this.jobTimeout = 300 // 5 minutes
  }

  /**
   * Send log message via WebSocket if available
   * @private
   */
  sendLog(ws, level, message, source = 'qubots') {
    if (ws && ws.readyState === 1) { // WebSocket.OPEN = 1
      const logMessage = {
        type: 'optimization_log',
        data: {
          timestamp: new Date().toISOString(),
          level,
          message,
          source
        }
      }
      try {
        ws.send(JSON.stringify(logMessage))
      } catch (error) {
        console.error('Error sending WebSocket log:', error)
      }
    }
  }

  /**
   * Execute qubots optimization using AutoProblem and AutoOptimizer in a Kubernetes job
   * @param {Object} params - Execution parameters
   * @param {WebSocket} ws - Optional WebSocket for real-time logging
   * @returns {Promise<Object>} Execution result with success, best_value, best_solution, etc.
   */
  async executeOptimization(params, ws = null) {
    const {
      problemName,
      optimizerName,
      problemUsername = 'default',
      optimizerUsername = 'default',
      problemParams = {},
      optimizerParams = {},
      hasDataset = false,
      timeout = 30000
    } = params

    const jobId = this.generateJobId()
    const jobName = `qubots-exec-${jobId}`

    console.log(`🚀 Starting qubots execution job: ${jobName}`)
    console.log(`📊 Problem: ${problemUsername}/${problemName}`)
    console.log(`🔧 Optimizer: ${optimizerUsername}/${optimizerName}`)
    console.log(`⚙️ Problem params:`, problemParams)
    console.log(`⚙️ Optimizer params:`, optimizerParams)

    // Send initial logs via WebSocket
    this.sendLog(ws, 'info', 'Starting optimization execution...', 'system')
    this.sendLog(ws, 'info', `Problem: ${problemUsername}/${problemName}`, 'config')
    this.sendLog(ws, 'info', `Optimizer: ${optimizerUsername}/${optimizerName}`, 'config')

    try {
      // Create Kubernetes job for execution
      this.sendLog(ws, 'info', 'Creating execution job...', 'system')
      await this.createExecutionJob(jobName, {
        problemName,
        optimizerName,
        problemUsername,
        optimizerUsername,
        problemParams,
        optimizerParams,
        hasDataset,
        timeout
      })

      console.log(`✅ Job created successfully: ${jobName}`)
      this.sendLog(ws, 'info', `Execution job created: ${jobName}`, 'system')

      // Wait for job completion with streaming
      const result = await this.waitForJobCompletion(jobName, this.jobTimeout, ws)

      console.log(`🎉 Job completed successfully: ${jobName}`)
      console.log(`📈 Result:`, result)
      this.sendLog(ws, 'info', 'Optimization completed successfully!', 'system')

      // Clean up job
      await this.deleteJob(jobName)

      return result

    } catch (error) {
      console.error(`❌ Qubots execution failed for job ${jobName}:`, error)

      // Get detailed error information
      try {
        const logs = await this.getJobLogs(jobName).catch(() => 'No logs available')
        console.error(`📋 Job logs:`, logs)
      } catch (logError) {
        console.error(`Failed to get job logs:`, logError)
      }

      // Clean up failed job
      await this.deleteJob(jobName).catch(() => {})

      throw new Error(`Qubots execution failed: ${error.message}`)
    }
  }

  /**
   * Create a Kubernetes job for qubots execution
   * @private
   */
  async createExecutionJob(jobName, params) {
    const job = {
      metadata: {
        name: jobName,
        namespace: this.namespace,
        labels: {
          'app': 'qubots-execution',
          'type': 'optimization-job'
        }
      },
      spec: {
        template: {
          metadata: {
            labels: {
              'app': 'qubots-execution',
              'job': jobName
            }
          },
          spec: {
            containers: [{
              name: 'qubots-executor',
              image: this.baseImage,
              command: ['python3', '-u', '-c'],  // -u flag for unbuffered output
              args: [this.generateExecutionScript(params)],
              env: [
                { name: 'PROBLEM_REPO', value: params.problemName },
                { name: 'OPTIMIZER_REPO', value: params.optimizerName },
                { name: 'PROBLEM_USERNAME', value: params.problemUsername },
                { name: 'OPTIMIZER_USERNAME', value: params.optimizerUsername },
                { name: 'GITEA_URL', value: process.env.GITEA_URL || 'https://hub.rastion.com' },
                { name: 'PLATFORM_API_BASE', value: process.env.PLATFORM_API_BASE || 'http://backend:4000/api' },
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

    return await this.k8sBatchApi.createNamespacedJob(this.namespace, job)
  }

  /**
   * Generate Python execution script for the job using new qubots API
   * @private
   */
  generateExecutionScript(params) {
    const script = `
import sys
import json
import traceback
import subprocess
import os
from pathlib import Path

try:
    print("� Starting qubots optimization execution...")
    print("� Using new AutoProblem and AutoOptimizer API...")

    # Import the new qubots API
    from qubots import AutoProblem, AutoOptimizer

    # Check if dataset is provided
    has_dataset = ${params.hasDataset || false}
    problem_params = ${this.convertToPythonDict(params.problemParams)}
    optimizer_params = ${this.convertToPythonDict(params.optimizerParams)}

    # Handle standardized problems
    problem_name = "${params.problemName}"
    problem_username = "${params.problemUsername}"

    if problem_name.startswith("standardized-problem-"):
        # Extract problem ID and load standardized problem
        problem_id = problem_name.replace("standardized-problem-", "")
        print(f"📊 Step 1: Loading standardized problem {problem_id}")

        # Use the standardized benchmarks from qubots
        from qubots.standardized_benchmarks import StandardizedBenchmarkRegistry

        # Get the problem specification by ID
        try:
            problem_id_int = int(problem_id)
            # Map problem IDs to benchmark specs (this should match the database seeding)
            benchmark_specs = StandardizedBenchmarkRegistry.get_benchmark_specs()

            if problem_id_int <= len(benchmark_specs):
                spec = benchmark_specs[problem_id_int - 1]  # 1-based indexing
                print(f"Using standardized benchmark: {spec.name}")

                # Create the standardized problem instance directly
                problem = StandardizedBenchmarkRegistry.create_problem(spec)
                print(f"✅ Step 1 Complete: Standardized problem loaded: {spec.name}")
            else:
                raise ValueError(f"Standardized problem ID {problem_id} not found")

        except (ValueError, IndexError) as e:
            print(f"❌ Error loading standardized problem {problem_id}: {e}")
            raise ValueError(f"Invalid standardized problem ID: {problem_id}")
    else:
        # Step 1: Load dataset (if provided)
        if has_dataset and 'dataset_id' in problem_params:
            print(f"📁 Step 1a: Loading dataset with ID: {problem_params['dataset_id']}")

            # Get platform API base URL from environment for dataset access
            platform_api_base = os.environ.get('PLATFORM_API_BASE', 'http://backend:4000/api')
            if 'platform_api_base' not in problem_params:
                problem_params['platform_api_base'] = platform_api_base

            print(f"🔗 Dataset source configured: {problem_params.get('dataset_source', 'platform')}")
            print(f"✅ Step 1a Complete: Dataset configuration ready")
        else:
            print("📝 Step 1a: No dataset provided - using problem defaults")

        # Step 1b: Load problem using AutoProblem
        repo_id = f"{problem_username}/{problem_name}"
        print(f"📊 Step 1b: Loading problem from repository: {repo_id}")
        print(f"🔧 Problem parameters: {problem_params}")

        problem = AutoProblem.from_repo(
            repo_id=repo_id,
            override_params=problem_params
        )
        print(f"✅ Step 1b Complete: Problem loaded: {repo_id}")

        # Verify dataset loading if applicable
        if has_dataset and hasattr(problem, 'has_dataset') and problem.has_dataset():
            try:
                dataset_content = problem.get_dataset_content()
                if dataset_content:
                    content_preview = dataset_content[:200] + "..." if len(dataset_content) > 200 else dataset_content
                    print(f"📁 Dataset loaded successfully. Preview: {content_preview}")
                else:
                    print("⚠️ Dataset configuration present but no content loaded")
            except Exception as e:
                print(f"⚠️ Dataset loading warning: {e}")

    # Step 2: Load optimizer using AutoOptimizer
    optimizer_repo_id = f"${params.optimizerUsername}/${params.optimizerName}"
    print(f"🔧 Step 2: Loading optimizer from repository: {optimizer_repo_id}")
    print(f"⚙️ Optimizer parameters: {optimizer_params}")

    optimizer = AutoOptimizer.from_repo(
        repo_id=optimizer_repo_id,
        override_params=optimizer_params
    )
    print(f"✅ Step 2 Complete: Optimizer loaded: {optimizer_repo_id}")

    # Step 3: Execute optimization
    print("⚡ Step 3: Starting optimization execution...")
    print(f"🎯 Problem: {problem}")
    print(f"🔧 Optimizer: {optimizer}")

    result = optimizer.optimize(problem)
    print("🎉 Step 3 Complete: Optimization finished!")

    # Step 4: Process and display results
    print("📊 Step 4: Processing optimization results...")

    if hasattr(result, 'best_value') and result.best_value is not None:
        print(f"🎯 Best Value: {result.best_value}")

    if hasattr(result, 'runtime_seconds') and result.runtime_seconds is not None:
        print(f"⏱️ Runtime: {result.runtime_seconds:.3f} seconds")

    if hasattr(result, 'best_solution') and result.best_solution is not None:
        solution_str = str(result.best_solution)
        if len(solution_str) > 100:
            solution_str = solution_str[:100] + "..."
        print(f"🔧 Solution: {solution_str}")

    print("✅ Step 4 Complete: Results processed successfully!")

    # Convert result to dictionary format for JSON serialization
    if hasattr(result, '__dict__'):
        # If result is an object, convert to dict
        result_dict = {
            "success": True,
            "best_value": getattr(result, 'best_value', None),
            "best_solution": getattr(result, 'best_solution', None),
            "runtime_seconds": getattr(result, 'runtime_seconds', None),
            "metadata": getattr(result, 'metadata', {}),
            "convergence_history": getattr(result, 'convergence_history', []),
            "algorithm_info": getattr(result, 'algorithm_info', {}),
            "problem_info": getattr(result, 'problem_info', {})
        }
    else:
        # If result is already a dict
        result_dict = result.copy() if isinstance(result, dict) else {"success": True, "result": result}
        if "success" not in result_dict:
            result_dict["success"] = True

    # Write result to stdout for collection
    print("QUBOTS_RESULT_START")
    print(json.dumps(result_dict, default=str))  # default=str handles non-serializable objects
    print("QUBOTS_RESULT_END")

except Exception as e:
    print(f"❌ Optimization failed: {e}")
    error_result = {
        "success": False,
        "error_message": str(e),
        "error_type": type(e).__name__,
        "traceback": traceback.format_exc()
    }
    print("QUBOTS_RESULT_START")
    print(json.dumps(error_result))
    print("QUBOTS_RESULT_END")
    sys.exit(1)
`
    return script
  }

  /**
   * Wait for job completion and extract result
   * @private
   */
  async waitForJobCompletion(jobName, timeoutSeconds, ws = null) {
    const startTime = Date.now()
    const timeoutMs = timeoutSeconds * 1000
    let lastLogTime = 0

    this.sendLog(ws, 'info', 'Waiting for optimization to complete...', 'system')

    while (Date.now() - startTime < timeoutMs) {
      try {
        // Check job status
        const job = await this.k8sBatchApi.readNamespacedJob(jobName, this.namespace)
        const status = job.body.status

        if (status.succeeded === 1) {
          // Job completed successfully, get logs
          this.sendLog(ws, 'info', 'Optimization job completed successfully', 'system')
          return await this.getJobResult(jobName)
        }

        if (status.failed === 1) {
          // Job failed, get error logs
          const logs = await this.getJobLogs(jobName)
          this.sendLog(ws, 'error', `Job failed: ${logs}`, 'system')
          throw new Error(`Job failed: ${logs}`)
        }

        // Send periodic status updates
        const currentTime = Date.now()
        if (currentTime - lastLogTime > 10000) { // Every 10 seconds
          const elapsedSeconds = Math.floor((currentTime - startTime) / 1000)
          this.sendLog(ws, 'info', `Optimization running... (${elapsedSeconds}s elapsed)`, 'system')
          lastLogTime = currentTime
        }

        // Wait before checking again
        await new Promise(resolve => setTimeout(resolve, 2000))

      } catch (error) {
        if (Date.now() - startTime >= timeoutMs) {
          this.sendLog(ws, 'error', 'Job timeout - optimization took too long', 'system')
          throw new Error(`Job timeout after ${timeoutSeconds} seconds`)
        }
        await new Promise(resolve => setTimeout(resolve, 2000))
      }
    }

    this.sendLog(ws, 'error', 'Job timeout - optimization took too long', 'system')
    throw new Error(`Job timeout after ${timeoutSeconds} seconds`)
  }

  /**
   * Extract result from job logs
   * @private
   */
  async getJobResult(jobName) {
    try {
      const logs = await this.getJobLogs(jobName)

      // Extract result from logs between markers
      const startMarker = 'QUBOTS_RESULT_START'
      const endMarker = 'QUBOTS_RESULT_END'

      const startIndex = logs.indexOf(startMarker)
      const endIndex = logs.indexOf(endMarker)

      if (startIndex === -1 || endIndex === -1) {
        throw new Error('Result markers not found in logs')
      }

      const resultJson = logs.substring(startIndex + startMarker.length, endIndex).trim()
      const result = JSON.parse(resultJson)

      return result

    } catch (error) {
      console.error(`Failed to extract job result for ${jobName}:`, error)
      throw new Error(`Failed to extract result: ${error.message}`)
    }
  }

  /**
   * Get logs from job pod
   * @private
   */
  async getJobLogs(jobName) {
    try {
      // Find the pod for this job
      const pods = await this.k8sApi.listNamespacedPod(
        this.namespace,
        undefined, undefined, undefined, undefined,
        `job-name=${jobName}`
      )

      if (pods.body.items.length === 0) {
        throw new Error('No pod found for job')
      }

      const podName = pods.body.items[0].metadata.name
      const logs = await this.k8sApi.readNamespacedPodLog(podName, this.namespace)

      return logs.body

    } catch (error) {
      console.error(`Failed to get logs for job ${jobName}:`, error)
      throw new Error(`Failed to get logs: ${error.message}`)
    }
  }

  /**
   * Delete a job and its pods
   * @private
   */
  async deleteJob(jobName) {
    try {
      await this.k8sBatchApi.deleteNamespacedJob(
        jobName,
        this.namespace,
        undefined,
        undefined,
        undefined,
        undefined,
        'Background'
      )
      console.log(`Deleted job: ${jobName}`)
    } catch (error) {
      console.error(`Failed to delete job ${jobName}:`, error)
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
   * @private
   */
  generateJobId() {
    const timestamp = Date.now().toString()
    const random = crypto.randomBytes(4).toString('hex')
    return `${timestamp.substring(-6)}-${random}`
  }
}

module.exports = QubotExecutionService

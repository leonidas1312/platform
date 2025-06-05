/**
 * Lightweight Qubots Execution Service
 *
 * Provides qubots optimization execution using Kubernetes jobs instead of persistent environments.
 * This is more efficient for one-off executions and doesn't require managing long-running containers.
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
   * Execute qubots optimization using a Kubernetes job
   * @param {Object} params - Execution parameters
   * @param {WebSocket} ws - Optional WebSocket for real-time logging
   * @returns {Promise<Object>} Execution result
   */
  async executeOptimization(params, ws = null) {
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
      const job = await this.createExecutionJob(jobName, {
        problemName,
        optimizerName,
        problemUsername,
        optimizerUsername,
        problemParams,
        optimizerParams,
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
                { name: 'GITEA_URL', value: process.env.GITEA_URL || 'http://gitea:3000' },
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
   * Generate Python execution script for the job
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

def clone_and_install_requirements(repo_name, username):
    """Clone repository and install requirements.txt if it exists."""
    try:
        # Get the cache directory where repositories are stored
        cache_dir = os.path.expanduser("~/.cache/rastion_hub")
        repo_path = Path(cache_dir) / repo_name  # Only repo name, not username-repo_name

        # Clone repository if it doesn't exist
        if not repo_path.exists():
            print(f"📥 Cloning repository {username}/{repo_name}...")
            base_url = "https://hub.rastion.com"
            repo_url = f"{base_url}/{username}/{repo_name}.git"

            result = subprocess.run([
                "git", "clone", "--branch", "main", repo_url, str(repo_path)
            ], capture_output=True, text=True, timeout=120)

            if result.returncode != 0:
                print(f"⚠️  Warning: Failed to clone {username}/{repo_name}")
                if result.stderr:
                    print(f"   Error: {result.stderr}")
                return
            else:
                print(f"✅ Successfully cloned {username}/{repo_name}")
        else:
            print(f"ℹ️  Repository {username}/{repo_name} already exists")

        # Look for requirements.txt
        requirements_file = repo_path / "requirements.txt"
        if requirements_file.exists():
            print(f"📦 Installing requirements from {username}/{repo_name}...")
            result = subprocess.run([
                sys.executable, "-m", "pip", "install", "--user", "-r", str(requirements_file)
            ], capture_output=True, text=True, timeout=300)

            if result.returncode == 0:
                print(f"✅ Successfully installed requirements from {username}/{repo_name}")
                if result.stdout:
                    # Print installation output for debugging
                    for line in result.stdout.split('\\n'):
                        if line.strip() and not line.startswith('Requirement already satisfied'):
                            print(f"   {line}")

                # Force refresh of Python path to ensure newly installed packages are available
                import site
                import importlib
                site.main()  # Refresh site-packages
                importlib.invalidate_caches()  # Clear import caches
            else:
                print(f"⚠️  Warning: Failed to install requirements from {username}/{repo_name}")
                if result.stderr:
                    print(f"   Error: {result.stderr}")
        else:
            print(f"ℹ️  No requirements.txt found in {username}/{repo_name}")
    except Exception as e:
        print(f"⚠️  Warning: Error processing {username}/{repo_name}: {e}")

try:
    print("🚀 Starting qubots optimization execution...")

    # Pre-clone repositories and install requirements
    print("📋 Preparing repositories and installing dependencies...")
    clone_and_install_requirements("${params.problemName}", "${params.problemUsername}")
    clone_and_install_requirements("${params.optimizerName}", "${params.optimizerUsername}")

    print("🔄 Loading qubots models and executing optimization...")

    # Ensure user site-packages is in Python path
    import site
    import sys
    user_site = site.getusersitepackages()
    if user_site not in sys.path:
        sys.path.insert(0, user_site)
        print(f"📍 Added user site-packages to path: {user_site}")

    # Test if pyomo is now available
    try:
        import pyomo.environ
        print("✅ Pyomo import test successful")
    except ImportError as e:
        print(f"❌ Pyomo import test failed: {e}")
        print(f"🔍 Python path: {sys.path[:3]}...")  # Show first 3 entries

    # Import after requirements installation
    from qubots.playground_integration import execute_playground_optimization

    result = execute_playground_optimization(
        problem_name="${params.problemName}",
        optimizer_name="${params.optimizerName}",
        problem_username="${params.problemUsername}",
        optimizer_username="${params.optimizerUsername}",
        problem_params=${this.convertToPythonDict(params.problemParams)},
        optimizer_params=${this.convertToPythonDict(params.optimizerParams)}
    )

    # Write result to stdout for collection
    print("QUBOTS_RESULT_START")
    print(json.dumps(result))
    print("QUBOTS_RESULT_END")

except Exception as e:
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

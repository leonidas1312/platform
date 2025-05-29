/**
 * Qubots Integration Service
 *
 * Handles execution of qubots optimizations for the playground interface.
 * Provides Python subprocess execution, model loading, and result formatting.
 */

const { spawn } = require('child_process')
const path = require('path')
const fs = require('fs').promises
const os = require('os')

class QubotService {
  constructor() {
    this.pythonExecutable = process.env.PYTHON_EXECUTABLE || 'python'
    this.qubotsCacheDir = process.env.QUBOTS_CACHE_DIR || path.join(os.homedir(), '.cache', 'rastion_hub')
  }

  /**
   * Execute a qubots optimization using Python subprocess
   * @param {string} problemName - Name of the problem repository
   * @param {string} optimizerName - Name of the optimizer repository
   * @param {string} problemUsername - Username of problem owner
   * @param {string} optimizerUsername - Username of optimizer owner
   * @param {Object} problemParams - Optional problem parameters
   * @param {Object} optimizerParams - Optional optimizer parameters
   * @param {Function} progressCallback - Optional progress callback
   * @returns {Promise<Object>} Optimization result
   */
  async executeOptimization(problemName, optimizerName, problemUsername = null, optimizerUsername = null, problemParams = {}, optimizerParams = {}, progressCallback = null) {
    try {
      // Create temporary Python script for execution
      const scriptPath = await this.createExecutionScript(
        problemName, optimizerName, problemUsername, optimizerUsername,
        problemParams, optimizerParams
      )

      // Execute Python script
      const result = await this.runPythonScript(scriptPath, progressCallback)

      // Clean up temporary script
      await fs.unlink(scriptPath).catch(() => {}) // Ignore cleanup errors

      return result
    } catch (error) {
      throw new Error(`Qubots execution failed: ${error.message}`)
    }
  }

  /**
   * Get available models for a user
   * @param {string} username - Username to filter by (optional)
   * @returns {Promise<Object>} Object with problems and optimizers arrays
   */
  async getAvailableModels(username = null) {
    try {
      const scriptContent = `
import sys
import json
from qubots.playground_integration import get_available_models

try:
    username = ${username ? `"${username}"` : 'None'}
    models = get_available_models(username)
    print(json.dumps(models))
except Exception as e:
    print(json.dumps({"error": str(e), "success": False}))
    sys.exit(1)
`

      const scriptPath = await this.createTempScript(scriptContent)
      const result = await this.runPythonScript(scriptPath)
      await fs.unlink(scriptPath).catch(() => {})

      return result
    } catch (error) {
      throw new Error(`Failed to get available models: ${error.message}`)
    }
  }

  /**
   * Search for models by query
   * @param {string} query - Search query
   * @param {string} modelType - Filter by 'problem' or 'optimizer' (optional)
   * @returns {Promise<Array>} Array of matching models
   */
  async searchModels(query, modelType = null) {
    try {
      const scriptContent = `
import sys
import json
from qubots.playground_integration import ModelDiscovery

try:
    discovery = ModelDiscovery()
    models = discovery.search_models("${query}", ${modelType ? `"${modelType}"` : 'None'})
    result = [model.__dict__ for model in models]
    print(json.dumps(result))
except Exception as e:
    print(json.dumps({"error": str(e), "success": False}))
    sys.exit(1)
`

      const scriptPath = await this.createTempScript(scriptContent)
      const result = await this.runPythonScript(scriptPath)
      await fs.unlink(scriptPath).catch(() => {})

      return result
    } catch (error) {
      throw new Error(`Failed to search models: ${error.message}`)
    }
  }

  /**
   * Validate that a model exists and is accessible
   * @param {string} modelName - Name of the model repository
   * @param {string} username - Username of model owner
   * @param {string} modelType - Expected model type ('problem' or 'optimizer')
   * @returns {Promise<Object>} Validation result
   */
  async validateModel(modelName, username, modelType) {
    try {
      const scriptContent = `
import sys
import json
from qubots.rastion import load_qubots_model
from qubots.base_problem import BaseProblem
from qubots.base_optimizer import BaseOptimizer

try:
    model = load_qubots_model("${modelName}", ${username ? `"${username}"` : 'None'})

    if "${modelType}" == "problem":
        is_valid = isinstance(model, BaseProblem)
    elif "${modelType}" == "optimizer":
        is_valid = isinstance(model, BaseOptimizer)
    else:
        is_valid = False

    result = {
        "success": True,
        "valid": is_valid,
        "model_class": model.__class__.__name__,
        "model_type": "${modelType}",
        "metadata": getattr(model, 'metadata', {})
    }
    print(json.dumps(result))
except Exception as e:
    print(json.dumps({"success": False, "error": str(e)}))
    sys.exit(1)
`

      const scriptPath = await this.createTempScript(scriptContent)
      const result = await this.runPythonScript(scriptPath)
      await fs.unlink(scriptPath).catch(() => {})

      return result
    } catch (error) {
      throw new Error(`Failed to validate model: ${error.message}`)
    }
  }

  /**
   * Create a temporary Python script for qubots execution
   * @private
   */
  async createExecutionScript(problemName, optimizerName, problemUsername, optimizerUsername, problemParams, optimizerParams) {
    const scriptContent = `
import sys
import json
from qubots.playground_integration import execute_playground_optimization

try:
    result = execute_playground_optimization(
        problem_name="${problemName}",
        optimizer_name="${optimizerName}",
        problem_username=${problemUsername ? `"${problemUsername}"` : 'None'},
        optimizer_username=${optimizerUsername ? `"${optimizerUsername}"` : 'None'},
        problem_params=${JSON.stringify(problemParams)},
        optimizer_params=${JSON.stringify(optimizerParams)}
    )
    print(json.dumps(result))
except Exception as e:
    import traceback
    error_result = {
        "success": False,
        "error_message": str(e),
        "error_type": type(e).__name__,
        "traceback": traceback.format_exc()
    }
    print(json.dumps(error_result))
    sys.exit(1)
`

    return await this.createTempScript(scriptContent)
  }

  /**
   * Create a temporary Python script file
   * @private
   */
  async createTempScript(content) {
    const tempDir = os.tmpdir()
    const scriptPath = path.join(tempDir, `qubots_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.py`)
    await fs.writeFile(scriptPath, content)
    return scriptPath
  }

  /**
   * Execute a Python script and return parsed JSON result
   * @private
   */
  async runPythonScript(scriptPath, progressCallback = null) {
    return new Promise((resolve, reject) => {
      const python = spawn(this.pythonExecutable, [scriptPath], {
        stdio: ['pipe', 'pipe', 'pipe']
      })

      let stdout = ''
      let stderr = ''

      python.stdout.on('data', (data) => {
        stdout += data.toString()

        // Report progress if callback provided
        if (progressCallback) {
          const lines = data.toString().split('\n')
          for (const line of lines) {
            if (line.includes('progress:')) {
              try {
                const progressData = JSON.parse(line.replace('progress:', ''))
                progressCallback(progressData.message, progressData.percent)
              } catch (e) {
                // Ignore progress parsing errors
              }
            }
          }
        }
      })

      python.stderr.on('data', (data) => {
        stderr += data.toString()
      })

      python.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`Python script failed with code ${code}: ${stderr}`))
          return
        }

        try {
          // Parse the JSON output
          const result = JSON.parse(stdout.trim())
          resolve(result)
        } catch (error) {
          reject(new Error(`Failed to parse Python output: ${error.message}\nOutput: ${stdout}\nError: ${stderr}`))
        }
      })

      python.on('error', (error) => {
        reject(new Error(`Failed to start Python process: ${error.message}`))
      })

      // Set timeout for long-running optimizations
      const timeout = setTimeout(() => {
        python.kill('SIGTERM')
        reject(new Error('Optimization timeout - execution took too long'))
      }, 300000) // 5 minutes timeout

      python.on('close', () => {
        clearTimeout(timeout)
      })
    })
  }

  /**
   * Check if qubots is properly installed and configured
   * @returns {Promise<Object>} Status information
   */
  async checkQubotStatus() {
    try {
      const scriptContent = `
import sys
import json

try:
    import qubots

    # Check if this is the mock version
    is_mock = hasattr(qubots, '__version__') and 'mock' in qubots.__version__

    if is_mock:
        result = {
            "success": False,
            "qubots_version": qubots.__version__,
            "python_version": sys.version,
            "is_mock": True,
            "error": "Qubots system not available - using mock implementation",
            "cache_dir": "${this.qubotsCacheDir}"
        }
    else:
        from qubots.playground_integration import ModelDiscovery
        from qubots.rastion_client import get_global_client

        # Test basic functionality
        discovery = ModelDiscovery()
        client = get_global_client()

        result = {
            "success": True,
            "qubots_version": qubots.__version__,
            "python_version": sys.version,
            "client_configured": hasattr(client, 'config') and bool(client.config),
            "is_mock": False,
            "cache_dir": "${this.qubotsCacheDir}"
        }

    print(json.dumps(result))
except ImportError as e:
    print(json.dumps({"success": False, "error": f"Qubots not installed: {str(e)}"}))
    sys.exit(1)
except Exception as e:
    print(json.dumps({"success": False, "error": str(e)}))
    sys.exit(1)
`

      const scriptPath = await this.createTempScript(scriptContent)
      const result = await this.runPythonScript(scriptPath)
      await fs.unlink(scriptPath).catch(() => {})

      return result
    } catch (error) {
      return {
        success: false,
        error: `Failed to check qubots status: ${error.message}`
      }
    }
  }

  /**
   * Get parameter schema for a qubots model from config.json (efficient - no model loading)
   * @param {string} modelName - Name of the model repository
   * @param {string} username - Username of model owner
   * @returns {Promise<Object>} Parameter schema
   */
  async getParameterSchema(modelName, username = null) {
    try {
      // Use Gitea service to fetch config.json directly instead of loading the full model
      const GiteaService = require('./giteaService')

      // Determine the repository owner
      const repoOwner = username || 'default'

      // Fetch config.json from the repository
      const configResponse = await GiteaService.getFileContent(null, repoOwner, modelName, 'config.json')

      if (!configResponse.ok) {
        return {
          error: `Failed to fetch config.json: ${configResponse.status} ${configResponse.statusText}`,
          model_name: modelName,
          parameters: {}
        }
      }

      const configData = await configResponse.json()
      const configContent = Buffer.from(configData.content, 'base64').toString('utf-8')
      const config = JSON.parse(configContent)

      // Extract parameter schema from config.json
      const parameters = config.parameters || {}
      const modelType = config.type || 'unknown'

      return {
        model_type: modelType,
        model_name: modelName,
        parameters: parameters
      }

    } catch (error) {
      return {
        error: `Failed to get parameter schema: ${error.message}`,
        model_name: modelName,
        parameters: {}
      }
    }
  }
}

module.exports = QubotService

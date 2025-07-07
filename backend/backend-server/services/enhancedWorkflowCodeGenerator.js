/**
 * Enhanced Workflow Code Generator
 * 
 * Converts ReactFlow visual workflows into executable Python scripts
 * following the Qubots modular architecture pattern:
 * 1. load_dataset_from_platform(token, datasetID)
 * 2. load_problem_from_repo(dataset) with user parameters
 * 3. load_optimizer_from_repo() with user parameters
 * 4. results = optimizer.optimize(problem)
 */

class EnhancedWorkflowCodeGenerator {
  constructor() {
    this.stepTemplates = {
      dataset: this.generateDatasetStep.bind(this),
      problem: this.generateProblemStep.bind(this),
      optimizer: this.generateOptimizerStep.bind(this),
      execution: this.generateExecutionStep.bind(this),
      results: this.generateResultsStep.bind(this)
    }
  }

  /**
   * Generate complete Python script from workflow configuration
   */
  generateWorkflowScript(workflowConfig, executionId, authToken = null) {
    const { dataset, problem, optimizer } = workflowConfig
    
    // Validate workflow configuration
    this.validateWorkflowConfig(workflowConfig)
    
    const script = `
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
print(f"EXECUTION_ID: {executionId}")
sys.stdout.flush()

def log_step(step_name, message, level="info"):
    """Log a step with proper formatting for frontend parsing"""
    timestamp = datetime.now().isoformat()
    log_entry = {
        "timestamp": timestamp,
        "step": step_name,
        "level": level,
        "message": message,
        "execution_id": "{executionId}"
    }
    print(f"STEP_LOG: {json.dumps(log_entry)}")
    sys.stdout.flush()

def log_progress(step_name, progress, message=""):
    """Log progress for a specific step"""
    timestamp = datetime.now().isoformat()
    progress_entry = {
        "timestamp": timestamp,
        "step": step_name,
        "progress": progress,
        "message": message,
        "execution_id": "{executionId}"
    }
    print(f"STEP_PROGRESS: {json.dumps(progress_entry)}")
    sys.stdout.flush()

def signal_handler(signum, frame):
    """Handle termination signals gracefully"""
    log_step("system", f"Received signal {signum}, terminating gracefully", "warning")
    sys.exit(1)

# Set up signal handlers
signal.signal(signal.SIGTERM, signal_handler)
signal.signal(signal.SIGINT, signal_handler)

# Execution timeout handler
def timeout_handler():
    log_step("system", "Execution timeout reached", "error")
    os._exit(1)

# Set execution timeout (5 minutes)
timeout_timer = threading.Timer(300.0, timeout_handler)
timeout_timer.start()

try:
    log_step("system", "Starting workflow execution...", "info")
    
    # Import qubots framework
    log_step("system", "Importing qubots framework...", "info")
    try:
        from qubots import AutoProblem, AutoOptimizer, load_dataset_from_platform
        log_step("system", "Qubots framework imported successfully", "info")
    except ImportError as e:
        log_step("system", f"Failed to import qubots: {e}", "error")
        raise
    
    ${this.generateDatasetStep(dataset, authToken)}

    ${this.generateProblemStep(problem, dataset, problem?.datasetParameter)}

    ${this.generateOptimizerStep(optimizer)}
    
    ${this.generateExecutionStep()}
    
    ${this.generateResultsStep()}
    
    log_step("system", "Workflow execution completed successfully!", "info")
    
except Exception as e:
    error_msg = f"Workflow execution failed: {str(e)}"
    log_step("system", error_msg, "error")
    log_step("system", f"Traceback: {traceback.format_exc()}", "error")
    
    # Print error in a format that can be parsed by the frontend
    error_result = {
        "success": False,
        "error": error_msg,
        "traceback": traceback.format_exc(),
        "execution_id": "{executionId}"
    }
    print(f"WORKFLOW_RESULT_START")
    print(json.dumps(error_result, indent=2))
    print(f"WORKFLOW_RESULT_END")
    sys.stdout.flush()
    sys.exit(1)
finally:
    # Cancel timeout timer
    timeout_timer.cancel()
    log_step("system", "Cleanup completed", "info")
`

    // Replace executionId placeholder with actual value
    return script.replace(/{executionId}/g, executionId)
  }

  /**
   * Generate dataset loading step
   */
  generateDatasetStep(dataset, authToken) {
    if (!dataset) {
      return `
    # Step 1: No dataset specified, skipping dataset loading
    log_step("dataset", "No dataset specified for this workflow", "info")
    dataset_content = None
    log_progress("dataset", 100, "Dataset step completed (no dataset)")
`
    }

    const datasetId = dataset.datasetId || dataset.data?.datasetId
    const hasAuthToken = authToken ? 'True' : 'False'
    
    return `
    # Step 1: Load Dataset
    log_step("dataset", "Starting dataset loading...", "info")
    log_progress("dataset", 10, "Initializing dataset loading")
    
    try:
        dataset_id = "${datasetId}"
        auth_token = "${authToken || ''}"
        
        if not dataset_id:
            raise ValueError("Dataset ID is required but not provided")
        
        if not auth_token:
            raise ValueError("Authentication token is required for dataset loading")
        
        log_step("dataset", f"Loading dataset: {dataset_id}", "info")
        log_progress("dataset", 30, f"Requesting dataset {dataset_id}")
        
        # Load dataset from platform
        dataset_content = load_dataset_from_platform(
            token=auth_token,
            dataset_id=dataset_id
        )
        
        log_progress("dataset", 80, "Dataset content received")
        log_step("dataset", f"Dataset loaded successfully. Size: {len(dataset_content)} characters", "info")
        log_progress("dataset", 100, "Dataset loading completed")
        
    except Exception as e:
        log_step("dataset", f"Failed to load dataset: {str(e)}", "error")
        raise RuntimeError(f"Dataset loading failed: {str(e)}")
`
  }

  /**
   * Generate problem loading step
   */
  generateProblemStep(problem, dataset, datasetParameter = null) {
    const repoId = problem.data?.repository || problem.data?.repo_id
    const parameters = problem.data?.parameters || {}
    const paramStr = JSON.stringify(parameters, null, 2)

    // Determine if we should pass dataset content and which parameter to use
    const useDatasetContent = dataset && dataset.datasetId
    const parameterName = datasetParameter || 'dataset_content'

    return `
    # Step 2: Load Problem
    log_step("problem", "Starting problem loading...", "info")
    log_progress("problem", 10, "Initializing problem loading")

    try:
        problem_repo = "${repoId}"
        problem_params = ${paramStr}

        if not problem_repo:
            raise ValueError("Problem repository is required but not provided")

        log_step("problem", f"Loading problem from repository: {problem_repo}", "info")
        log_progress("problem", 30, f"Requesting problem {problem_repo}")

        # Add dataset content to parameters if available
        ${useDatasetContent ? `
        if dataset_content is not None:
            problem_params["${parameterName}"] = dataset_content
            log_step("problem", f"Dataset content added to parameter '${parameterName}'", "info")
        ` : ''}

        # Load problem from repository
        problem = AutoProblem.from_repo(
            repo_id=problem_repo,
            override_params=problem_params if problem_params else None
        )
        
        log_progress("problem", 80, "Problem instance created")
        log_step("problem", f"Problem loaded successfully: {type(problem).__name__}", "info")
        log_step("problem", f"Problem parameters: {problem_params}", "info")
        log_progress("problem", 100, "Problem loading completed")
        
    except Exception as e:
        log_step("problem", f"Failed to load problem: {str(e)}", "error")
        raise RuntimeError(f"Problem loading failed: {str(e)}")
`
  }

  /**
   * Generate optimizer loading step
   */
  generateOptimizerStep(optimizer) {
    const repoId = optimizer.data?.repository || optimizer.data?.repo_id
    const parameters = optimizer.data?.parameters || {}
    const paramStr = JSON.stringify(parameters, null, 2)
    
    return `
    # Step 3: Load Optimizer
    log_step("optimizer", "Starting optimizer loading...", "info")
    log_progress("optimizer", 10, "Initializing optimizer loading")
    
    try:
        optimizer_repo = "${repoId}"
        optimizer_params = ${paramStr}
        
        if not optimizer_repo:
            raise ValueError("Optimizer repository is required but not provided")
        
        log_step("optimizer", f"Loading optimizer from repository: {optimizer_repo}", "info")
        log_progress("optimizer", 30, f"Requesting optimizer {optimizer_repo}")
        
        # Load optimizer from repository
        optimizer = AutoOptimizer.from_repo(
            repo_id=optimizer_repo,
            override_params=optimizer_params if optimizer_params else None
        )
        
        log_progress("optimizer", 80, "Optimizer instance created")
        log_step("optimizer", f"Optimizer loaded successfully: {type(optimizer).__name__}", "info")
        log_step("optimizer", f"Optimizer parameters: {optimizer_params}", "info")
        log_progress("optimizer", 100, "Optimizer loading completed")
        
    except Exception as e:
        log_step("optimizer", f"Failed to load optimizer: {str(e)}", "error")
        raise RuntimeError(f"Optimizer loading failed: {str(e)}")
`
  }

  /**
   * Generate execution step
   */
  generateExecutionStep() {
    return `
    # Step 4: Execute Optimization
    log_step("execution", "Starting optimization execution...", "info")
    log_progress("execution", 10, "Initializing optimization")
    
    try:
        log_step("execution", "Running optimizer.optimize(problem)...", "info")
        log_progress("execution", 30, "Optimization in progress")
        
        # Execute optimization
        start_time = time.time()
        result = optimizer.optimize(problem)
        end_time = time.time()
        
        execution_time = end_time - start_time
        log_progress("execution", 90, f"Optimization completed in {execution_time:.2f}s")
        log_step("execution", f"Optimization completed successfully in {execution_time:.2f} seconds", "info")
        log_progress("execution", 100, "Execution completed")
        
    except Exception as e:
        log_step("execution", f"Optimization execution failed: {str(e)}", "error")
        raise RuntimeError(f"Optimization execution failed: {str(e)}")
`
  }

  /**
   * Generate results processing step
   */
  generateResultsStep() {
    return `
    # Step 5: Process Results
    log_step("results", "Processing optimization results...", "info")
    log_progress("results", 10, "Extracting results")
    
    try:
        # Extract result information
        result_data = {
            "success": True,
            "best_value": getattr(result, 'best_value', None),
            "best_solution": getattr(result, 'best_solution', None),
            "runtime_seconds": getattr(result, 'runtime_seconds', execution_time),
            "iterations": getattr(result, 'iterations', None),
            "metadata": getattr(result, 'metadata', {}),
            "execution_id": "{executionId}",
            "timestamp": datetime.now().isoformat()
        }
        
        log_progress("results", 50, "Results extracted")
        log_step("results", f"Best value: {result_data['best_value']}", "info")
        log_step("results", f"Runtime: {result_data['runtime_seconds']:.3f} seconds", "info")
        
        # Print results in a format that can be parsed by the frontend
        log_progress("results", 90, "Formatting results")
        print(f"WORKFLOW_RESULT_START")
        print(json.dumps(result_data, indent=2, default=str))
        print(f"WORKFLOW_RESULT_END")
        sys.stdout.flush()
        
        log_step("results", "Results processing completed", "info")
        log_progress("results", 100, "Results processing completed")
        
    except Exception as e:
        log_step("results", f"Failed to process results: {str(e)}", "error")
        raise RuntimeError(f"Results processing failed: {str(e)}")
`
  }

  /**
   * Validate workflow configuration
   */
  validateWorkflowConfig(config) {
    const { dataset, problem, optimizer } = config
    
    if (!problem) {
      throw new Error("Problem node is required in workflow")
    }
    
    if (!optimizer) {
      throw new Error("Optimizer node is required in workflow")
    }
    
    if (!problem.data?.repository && !problem.data?.repo_id) {
      throw new Error("Problem repository is required")
    }
    
    if (!optimizer.data?.repository && !optimizer.data?.repo_id) {
      throw new Error("Optimizer repository is required")
    }
  }
}

module.exports = EnhancedWorkflowCodeGenerator

#!/usr/bin/env python3
"""
Qubots API Server for Playground Containers

This lightweight HTTP server runs inside playground containers to handle
qubots optimization execution requests from the Rastion platform.
"""

import os
import sys
import json
import time
import traceback
from flask import Flask, request, jsonify
from flask_cors import CORS
import subprocess
import tempfile
import shutil
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Configuration
# Use rastion.com by default
GITEA_URL = os.environ.get('GITEA_URL', 'https://rastion.com')
WORKSPACE_DIR = '/workspace'
REPOS_DIR = os.path.join(WORKSPACE_DIR, 'repos')

def ensure_directories():
    """Ensure required directories exist"""
    os.makedirs(REPOS_DIR, exist_ok=True)

def clone_repository(username, repo_name, target_dir):
    """Clone a repository from Gitea"""
    repo_url = f"{GITEA_URL}/{username}/{repo_name}.git"
    try:
        # Remove existing directory if it exists
        if os.path.exists(target_dir):
            shutil.rmtree(target_dir)

        # Clone the repository
        result = subprocess.run([
            'git', 'clone', repo_url, target_dir
        ], capture_output=True, text=True, timeout=30)

        if result.returncode != 0:
            logger.error(f"Failed to clone {repo_url}: {result.stderr}")
            return False

        logger.info(f"Successfully cloned {repo_url}")
        return True
    except subprocess.TimeoutExpired:
        logger.error(f"Timeout cloning {repo_url}")
        return False
    except Exception as e:
        logger.error(f"Error cloning {repo_url}: {e}")
        return False

def install_repository_requirements(repo_dir):
    """Install requirements.txt from repository if it exists"""
    requirements_path = os.path.join(repo_dir, 'requirements.txt')
    if not os.path.exists(requirements_path):
        logger.info(f"No requirements.txt found in {repo_dir}")
        return True

    try:
        logger.info(f"Installing requirements from {requirements_path}")
        result = subprocess.run([
            sys.executable, '-m', 'pip', 'install', '--user', '-r', requirements_path
        ], capture_output=True, text=True, timeout=300)  # 5 minute timeout

        if result.returncode != 0:
            logger.error(f"Failed to install requirements from {requirements_path}: {result.stderr}")
            return False

        logger.info(f"Successfully installed requirements from {requirements_path}")
        if result.stdout:
            logger.info(f"Pip output: {result.stdout}")
        return True
    except subprocess.TimeoutExpired:
        logger.error(f"Timeout installing requirements from {requirements_path}")
        return False
    except Exception as e:
        logger.error(f"Error installing requirements from {requirements_path}: {e}")
        return False

def load_config(repo_dir):
    """Load config.json from repository"""
    config_path = os.path.join(repo_dir, 'config.json')
    if not os.path.exists(config_path):
        return None

    try:
        with open(config_path, 'r') as f:
            return json.load(f)
    except Exception as e:
        logger.error(f"Error loading config from {config_path}: {e}")
        return None

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'qubots-api',
        'timestamp': time.time()
    })

@app.route('/execute', methods=['POST'])
def execute_optimization():
    """Execute qubots optimization"""
    start_time = time.time()

    try:
        # Parse request
        data = request.get_json()
        if not data:
            return jsonify({
                'success': False,
                'error_message': 'No JSON data provided',
                'error_type': 'invalid_request'
            }), 400

        # Extract parameters
        problem_name = data.get('problem_name')
        problem_username = data.get('problem_username', 'default')
        optimizer_name = data.get('optimizer_name')
        optimizer_username = data.get('optimizer_username', 'default')
        problem_params = data.get('problem_params', {})
        optimizer_params = data.get('optimizer_params', {})
        timeout = data.get('timeout', 30000) / 1000  # Convert to seconds

        if not problem_name or not optimizer_name:
            return jsonify({
                'success': False,
                'error_message': 'problem_name and optimizer_name are required',
                'error_type': 'invalid_request'
            }), 400

        logger.info(f"Executing optimization: {problem_username}/{problem_name} with {optimizer_username}/{optimizer_name}")

        # Note: Repository cloning, dependency installation, and configuration validation
        # are now handled automatically by AutoProblem.from_repo() and AutoOptimizer.from_repo()

        # Execute optimization using current qubots API (AutoProblem and AutoOptimizer)
        try:
            # Import the current qubots API
            from qubots import AutoProblem, AutoOptimizer

            # Load problem using AutoProblem.from_repo
            problem_repo_id = f"{problem_username}/{problem_name}"
            logger.info(f"Loading problem from repository: {problem_repo_id}")

            problem = AutoProblem.from_repo(
                repo_id=problem_repo_id,
                override_params=problem_params
            )
            logger.info(f"Problem loaded successfully: {problem_repo_id}")

            # Load optimizer using AutoOptimizer.from_repo
            optimizer_repo_id = f"{optimizer_username}/{optimizer_name}"
            logger.info(f"Loading optimizer from repository: {optimizer_repo_id}")

            optimizer = AutoOptimizer.from_repo(
                repo_id=optimizer_repo_id,
                override_params=optimizer_params
            )
            logger.info(f"Optimizer loaded successfully: {optimizer_repo_id}")

            # Execute the optimization
            logger.info("Starting optimization execution...")
            result = optimizer.optimize(problem)
            logger.info("Optimization completed successfully")

            execution_time = time.time() - start_time

            # Format result for API response (handle both dict and object results)
            api_result = {
                'success': True,
                'problem_name': problem_name,
                'optimizer_name': optimizer_name,
                'problem_username': problem_username,
                'optimizer_username': optimizer_username,
                'execution_time': execution_time,
                'runtime_seconds': getattr(result, 'runtime_seconds', execution_time),
                'timestamp': time.time(),
                'best_solution': getattr(result, 'best_solution', result.get('best_solution') if isinstance(result, dict) else None),
                'best_value': getattr(result, 'best_value', result.get('best_value') if isinstance(result, dict) else None),
                'iterations': getattr(result, 'iterations', result.get('iterations') if isinstance(result, dict) else None),
                'termination_reason': getattr(result, 'termination_reason', result.get('termination_reason') if isinstance(result, dict) else 'completed'),
                'history': getattr(result, 'history', result.get('history', []) if isinstance(result, dict) else []),
                'metadata': getattr(result, 'metadata', result.get('metadata', {}) if isinstance(result, dict) else {}),
                'dashboard_data': result.get('dashboard_data') if isinstance(result, dict) else None
            }

            logger.info(f"Optimization completed successfully in {execution_time:.3f}s")
            return jsonify(api_result)

        except Exception as e:
            execution_time = time.time() - start_time
            error_msg = str(e)
            error_trace = traceback.format_exc()

            logger.error(f"Optimization execution failed: {error_msg}")
            logger.error(f"Traceback: {error_trace}")

            return jsonify({
                'success': False,
                'problem_name': problem_name,
                'optimizer_name': optimizer_name,
                'problem_username': problem_username,
                'optimizer_username': optimizer_username,
                'execution_time': execution_time,
                'timestamp': time.time(),
                'error_message': error_msg,
                'error_type': 'execution_error',
                'error_trace': error_trace if app.debug else None
            })

    except Exception as e:
        execution_time = time.time() - start_time
        error_msg = str(e)
        error_trace = traceback.format_exc()

        logger.error(f"API request failed: {error_msg}")
        logger.error(f"Traceback: {error_trace}")

        return jsonify({
            'success': False,
            'execution_time': execution_time,
            'timestamp': time.time(),
            'error_message': error_msg,
            'error_type': 'api_error',
            'error_trace': error_trace if app.debug else None
        }), 500

@app.route('/status', methods=['GET'])
def get_status():
    """Get qubots system status"""
    try:
        import qubots
        qubots_version = getattr(qubots, '__version__', 'unknown')

        return jsonify({
            'success': True,
            'service': 'qubots-api',
            'qubots_version': qubots_version,
            'workspace_dir': WORKSPACE_DIR,
            'repos_dir': REPOS_DIR,
            'gitea_url': GITEA_URL,
            'timestamp': time.time()
        })
    except ImportError:
        return jsonify({
            'success': False,
            'error_message': 'Qubots library not available',
            'error_type': 'import_error'
        }), 500

if __name__ == '__main__':
    # Ensure directories exist
    ensure_directories()

    # Start the server
    port = int(os.environ.get('PORT', 8000))
    debug = os.environ.get('DEBUG', 'false').lower() == 'true'

    logger.info(f"Starting Qubots API server on port {port}")
    logger.info(f"Workspace directory: {WORKSPACE_DIR}")
    logger.info(f"Repositories directory: {REPOS_DIR}")

    app.run(host='0.0.0.0', port=port, debug=debug)

#!/usr/bin/env python3
"""
Direct Execution Script for Qubots Workflow Compatibility

This script provides direct execution capabilities for the playground container,
making it compatible with the current workflow execution service that uses
Kubernetes jobs with direct Python script execution.
"""

import sys
import json
import os
import traceback
import time
from qubots import AutoProblem, AutoOptimizer


def main():
    """Main execution function for direct qubots optimization."""
    start_time = time.time()
    
    try:
        print("🚀 Starting qubots optimization execution...")
        print("🔧 Using AutoProblem and AutoOptimizer API...")

        # Read execution parameters from environment variables
        problem_repo = os.environ.get("PROBLEM_REPO")
        optimizer_repo = os.environ.get("OPTIMIZER_REPO")
        problem_username = os.environ.get("PROBLEM_USERNAME", "default")
        optimizer_username = os.environ.get("OPTIMIZER_USERNAME", "default")
        
        # Parse parameters from environment (JSON format)
        problem_params = {}
        optimizer_params = {}
        
        try:
            if os.environ.get("PROBLEM_PARAMS"):
                problem_params = json.loads(os.environ.get("PROBLEM_PARAMS", "{}"))
        except json.JSONDecodeError as e:
            print(f"⚠️ Warning: Invalid PROBLEM_PARAMS JSON: {e}")
            
        try:
            if os.environ.get("OPTIMIZER_PARAMS"):
                optimizer_params = json.loads(os.environ.get("OPTIMIZER_PARAMS", "{}"))
        except json.JSONDecodeError as e:
            print(f"⚠️ Warning: Invalid OPTIMIZER_PARAMS JSON: {e}")

        if not problem_repo or not optimizer_repo:
            raise ValueError("PROBLEM_REPO and OPTIMIZER_REPO environment variables are required")

        # Step 1: Load problem using AutoProblem.from_repo
        problem_repo_id = f"{problem_username}/{problem_repo}"
        print(f"📊 Step 1: Loading problem from repository: {problem_repo_id}")
        print(f"🔧 Problem parameters: {problem_params}")
        
        problem = AutoProblem.from_repo(
            repo_id=problem_repo_id,
            override_params=problem_params
        )
        print(f"✅ Step 1 Complete: Problem loaded: {problem_repo_id}")

        # Step 2: Load optimizer using AutoOptimizer.from_repo
        optimizer_repo_id = f"{optimizer_username}/{optimizer_repo}"
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
        execution_time = time.time() - start_time
        
        output = {
            "success": True,
            "problem_name": problem_repo,
            "optimizer_name": optimizer_repo,
            "problem_username": problem_username,
            "optimizer_username": optimizer_username,
            "best_value": getattr(result, 'best_value', None),
            "best_solution": getattr(result, 'best_solution', None),
            "runtime_seconds": getattr(result, 'runtime_seconds', execution_time),
            "execution_time": execution_time,
            "iterations": getattr(result, 'iterations', None),
            "termination_reason": getattr(result, 'termination_reason', 'completed'),
            "timestamp": time.time()
        }

        # Output final result as JSON for the workflow execution service
        print("\n" + "="*50)
        print("QUBOTS_RESULT_JSON_START")
        print(json.dumps(output, indent=2))
        print("QUBOTS_RESULT_JSON_END")
        print("="*50)

        return output

    except Exception as e:
        execution_time = time.time() - start_time
        error_msg = str(e)
        error_trace = traceback.format_exc()
        
        print(f"❌ Optimization execution failed: {error_msg}")
        print(f"📋 Traceback: {error_trace}")
        
        # Output error result as JSON
        error_output = {
            "success": False,
            "error_message": error_msg,
            "error_type": "execution_error",
            "execution_time": execution_time,
            "timestamp": time.time(),
            "error_trace": error_trace
        }
        
        print("\n" + "="*50)
        print("QUBOTS_RESULT_JSON_START")
        print(json.dumps(error_output, indent=2))
        print("QUBOTS_RESULT_JSON_END")
        print("="*50)
        
        sys.exit(1)


if __name__ == "__main__":
    main()

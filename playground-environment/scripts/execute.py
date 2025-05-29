#!/usr/bin/env python3
"""
Ultra-Lightweight Qubots Execution Script
Minimal HTTP API that executes qubots optimizations and returns dashboard results.
"""

import json
import sys
import os
import time
from http.server import HTTPServer, BaseHTTPRequestHandler
import threading

# Add repository paths to Python path
sys.path.insert(0, '/workspace/problems')
sys.path.insert(0, '/workspace/optimizers')

try:
    from qubots import execute_playground_optimization
    QUBOTS_AVAILABLE = True
    print("✅ Qubots loaded successfully")
except ImportError as e:
    QUBOTS_AVAILABLE = False
    print(f"❌ Qubots not available: {e}")

class OptimizationHandler(BaseHTTPRequestHandler):
    def do_POST(self):
        """Handle optimization execution requests."""
        if self.path == '/execute':
            try:
                # Read request body
                content_length = int(self.headers['Content-Length'])
                post_data = self.rfile.read(content_length)
                request_data = json.loads(post_data.decode('utf-8'))
                
                print(f"🚀 Executing optimization: {request_data.get('optimizer_name')} on {request_data.get('problem_name')}")
                
                if QUBOTS_AVAILABLE:
                    # Execute using qubots with built-in dashboard
                    result = execute_playground_optimization(
                        problem_name=request_data.get('problem_name'),
                        optimizer_name=request_data.get('optimizer_name'),
                        problem_username=request_data.get('problem_username', ''),
                        optimizer_username=request_data.get('optimizer_username', ''),
                        problem_params=request_data.get('problem_params', {}),
                        optimizer_params=request_data.get('optimizer_params', {})
                    )
                    print(f"✅ Optimization complete: {result.get('success')}")
                else:
                    # Mock result for testing
                    result = {
                        "success": False,
                        "error_message": "Qubots not available in this environment",
                        "problem_name": request_data.get('problem_name', ''),
                        "optimizer_name": request_data.get('optimizer_name', ''),
                        "execution_time": 0.0,
                        "timestamp": time.time()
                    }
                
                # Send response
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps(result).encode('utf-8'))
                
            except Exception as e:
                print(f"❌ Execution error: {e}")
                # Send error response
                error_result = {
                    "success": False,
                    "error_message": str(e),
                    "execution_time": 0.0,
                    "timestamp": time.time()
                }
                
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps(error_result).encode('utf-8'))
        else:
            self.send_response(404)
            self.end_headers()
    
    def do_GET(self):
        """Handle health check requests."""
        if self.path == '/health':
            health_status = {
                "status": "healthy",
                "qubots_available": QUBOTS_AVAILABLE,
                "timestamp": time.time(),
                "message": "Qubots playground ready" if QUBOTS_AVAILABLE else "Qubots not available"
            }
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps(health_status).encode('utf-8'))
        else:
            self.send_response(404)
            self.end_headers()
    
    def do_OPTIONS(self):
        """Handle CORS preflight requests."""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
    
    def log_message(self, format, *args):
        """Override to reduce logging noise."""
        pass

def setup_repositories():
    """Set up repository directories and clone if needed."""
    os.makedirs('/workspace/problems', exist_ok=True)
    os.makedirs('/workspace/optimizers', exist_ok=True)
    
    # Clone repositories if environment variables are set
    problem_repo = os.environ.get('PROBLEM_REPO')
    optimizer_repo = os.environ.get('OPTIMIZER_REPO')
    problem_username = os.environ.get('PROBLEM_USERNAME')
    optimizer_username = os.environ.get('OPTIMIZER_USERNAME')
    gitea_url = os.environ.get('GITEA_URL', 'http://gitea:3000')
    
    if problem_repo and problem_username:
        problem_url = f"{gitea_url}/{problem_username}/{problem_repo}.git"
        problem_path = f"/workspace/problems/{problem_repo}"
        if not os.path.exists(problem_path):
            print(f"📥 Cloning problem repository: {problem_url}")
            os.system(f"git clone {problem_url} {problem_path} 2>/dev/null || echo 'Clone failed'")
    
    if optimizer_repo and optimizer_username:
        optimizer_url = f"{gitea_url}/{optimizer_username}/{optimizer_repo}.git"
        optimizer_path = f"/workspace/optimizers/{optimizer_repo}"
        if not os.path.exists(optimizer_path):
            print(f"📥 Cloning optimizer repository: {optimizer_url}")
            os.system(f"git clone {optimizer_url} {optimizer_path} 2>/dev/null || echo 'Clone failed'")

def main():
    """Main execution function."""
    print("🎮 Starting ultra-lightweight qubots playground...")
    
    # Set up repositories
    setup_repositories()
    
    # Start HTTP server
    port = int(os.environ.get('PORT', 8000))
    server = HTTPServer(('0.0.0.0', port), OptimizationHandler)
    
    print(f"🌐 Server running on port {port}")
    print(f"📊 Qubots available: {QUBOTS_AVAILABLE}")
    print("🎯 Ready for fast prototyping with qubots!")
    
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n🛑 Shutting down server...")
        server.shutdown()

if __name__ == "__main__":
    main()

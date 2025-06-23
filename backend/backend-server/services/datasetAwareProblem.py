"""
Dataset-Aware Problem Base Class for Qubots Framework

This module provides enhanced problem classes that can load datasets from multiple sources:
- Platform-hosted datasets (via dataset ID)
- External URLs
- Local files (backward compatibility)
"""

import os
import requests
import json
from typing import Optional, Dict, Any, Union
from abc import ABC, abstractmethod

class DatasetAwareProblem(ABC):
    """
    Enhanced problem base class that can load datasets from multiple sources.
    
    Supports:
    - Platform datasets via dataset_id
    - External URLs via dataset_url
    - Local files via instance_file (backward compatibility)
    """
    
    def __init__(self, 
                 dataset_source: str = "local",
                 dataset_id: Optional[str] = None,
                 dataset_url: Optional[str] = None,
                 instance_file: Optional[str] = None,
                 platform_api_base: str = "https://rastion.com/api",
                 auth_token: Optional[str] = None,
                 **kwargs):
        """
        Initialize dataset-aware problem.
        
        Args:
            dataset_source: Source type ("platform", "url", "local")
            dataset_id: Platform dataset ID
            dataset_url: External dataset URL
            instance_file: Local file path (backward compatibility)
            platform_api_base: Base URL for platform API
            auth_token: Authentication token for platform access
            **kwargs: Additional parameters
        """
        self.dataset_source = dataset_source
        self.dataset_id = dataset_id
        self.dataset_url = dataset_url
        self.instance_file = instance_file
        self.platform_api_base = platform_api_base
        self.auth_token = auth_token
        
        # Load dataset content
        self.dataset_content = None
        self.dataset_metadata = {}
        self._load_dataset()
        
        # Initialize any additional parameters
        for key, value in kwargs.items():
            setattr(self, key, value)
    
    def _load_dataset(self):
        """Load dataset based on configured source."""
        try:
            if self.dataset_source == "platform" and self.dataset_id:
                self._load_from_platform()
            elif self.dataset_source == "url" and self.dataset_url:
                self._load_from_url()
            elif self.instance_file:
                self._load_from_local()
            else:
                raise ValueError("No valid dataset source specified")
                
        except Exception as e:
            print(f"Warning: Failed to load dataset: {e}")
            self.dataset_content = None
    
    def _load_from_platform(self):
        """Load dataset from Rastion platform."""
        if not self.dataset_id:
            raise ValueError("dataset_id required for platform source")
        
        # Get dataset metadata
        metadata_url = f"{self.platform_api_base}/datasets/{self.dataset_id}"
        headers = {}
        if self.auth_token:
            headers["Authorization"] = f"Bearer {self.auth_token}"
        
        response = requests.get(metadata_url, headers=headers)
        response.raise_for_status()
        
        dataset_info = response.json()["dataset"]
        self.dataset_metadata = dataset_info.get("metadata", {})
        
        # Download dataset content
        download_url = f"{self.platform_api_base}/datasets/{self.dataset_id}/download"
        content_response = requests.get(download_url, headers=headers)
        content_response.raise_for_status()
        
        self.dataset_content = content_response.text
        print(f"Loaded dataset from platform: {dataset_info['name']}")
    
    def _load_from_url(self):
        """Load dataset from external URL."""
        if not self.dataset_url:
            raise ValueError("dataset_url required for url source")
        
        response = requests.get(self.dataset_url)
        response.raise_for_status()
        
        self.dataset_content = response.text
        print(f"Loaded dataset from URL: {self.dataset_url}")
    
    def _load_from_local(self):
        """Load dataset from local file (backward compatibility)."""
        if not self.instance_file:
            raise ValueError("instance_file required for local source")
        
        # Handle relative paths
        if not os.path.isabs(self.instance_file):
            # Look for file relative to the problem module
            import inspect
            caller_frame = inspect.currentframe().f_back.f_back
            caller_file = caller_frame.f_globals.get('__file__')
            if caller_file:
                base_dir = os.path.dirname(os.path.abspath(caller_file))
                file_path = os.path.join(base_dir, self.instance_file)
            else:
                file_path = self.instance_file
        else:
            file_path = self.instance_file
        
        with open(file_path, 'r', encoding='utf-8') as f:
            self.dataset_content = f.read()
        
        print(f"Loaded dataset from local file: {file_path}")
    
    def get_dataset_content(self) -> Optional[str]:
        """Get the raw dataset content."""
        return self.dataset_content
    
    def get_dataset_metadata(self) -> Dict[str, Any]:
        """Get dataset metadata (if available)."""
        return self.dataset_metadata
    
    def validate_dataset_format(self, expected_format: str) -> bool:
        """
        Validate that the dataset matches expected format.
        
        Args:
            expected_format: Expected format type (e.g., 'tsplib', 'vrp', 'json')
            
        Returns:
            True if format matches, False otherwise
        """
        if not self.dataset_content:
            return False
        
        # Check metadata format if available
        if self.dataset_metadata.get('format') == expected_format:
            return True
        
        # Basic format validation based on content
        if expected_format == 'tsplib':
            return 'DIMENSION:' in self.dataset_content and 'TYPE:' in self.dataset_content
        elif expected_format == 'json':
            try:
                json.loads(self.dataset_content)
                return True
            except:
                return False
        elif expected_format == 'csv':
            lines = self.dataset_content.strip().split('\n')
            return len(lines) > 1 and ',' in lines[0]
        
        return True  # Default to accepting unknown formats
    
    def get_dataset_size_info(self) -> Dict[str, Any]:
        """Get information about dataset size and characteristics."""
        if not self.dataset_content:
            return {}
        
        info = {
            'content_length': len(self.dataset_content),
            'line_count': len(self.dataset_content.split('\n'))
        }
        
        # Add metadata info if available
        if self.dataset_metadata:
            for key in ['dimension', 'num_cities', 'num_customers', 'num_vertices']:
                if key in self.dataset_metadata:
                    info[key] = self.dataset_metadata[key]
        
        return info

    @abstractmethod
    def evaluate_solution(self, solution: Any) -> Union[float, Dict[str, Any]]:
        """
        Evaluate a solution for this problem.
        
        Args:
            solution: The solution to evaluate
            
        Returns:
            Objective value or detailed evaluation result
        """
        pass

# Example implementations for common problem types

class DatasetAwareTSPProblem(DatasetAwareProblem):
    """TSP problem that can load datasets from multiple sources."""
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.cities = []
        self.distance_matrix = None
        self._parse_tsp_data()
    
    def _parse_tsp_data(self):
        """Parse TSP data from dataset content."""
        if not self.dataset_content:
            return
        
        lines = self.dataset_content.strip().split('\n')
        
        # Parse TSPLIB format
        dimension = 0
        coord_section = False
        edge_weight_section = False
        
        for line in lines:
            line = line.strip()
            
            if line.startswith('DIMENSION:'):
                dimension = int(line.split(':')[1].strip())
            elif line == 'NODE_COORD_SECTION':
                coord_section = True
                continue
            elif line == 'EDGE_WEIGHT_SECTION':
                edge_weight_section = True
                continue
            elif line == 'EOF':
                break
            
            if coord_section and line:
                parts = line.split()
                if len(parts) >= 3:
                    city_id = int(parts[0])
                    x = float(parts[1])
                    y = float(parts[2])
                    self.cities.append((x, y))
        
        # Calculate distance matrix if we have coordinates
        if self.cities:
            self._calculate_distance_matrix()
    
    def _calculate_distance_matrix(self):
        """Calculate Euclidean distance matrix from coordinates."""
        n = len(self.cities)
        self.distance_matrix = [[0.0] * n for _ in range(n)]
        
        for i in range(n):
            for j in range(n):
                if i != j:
                    x1, y1 = self.cities[i]
                    x2, y2 = self.cities[j]
                    distance = ((x1 - x2) ** 2 + (y1 - y2) ** 2) ** 0.5
                    self.distance_matrix[i][j] = distance
    
    def evaluate_solution(self, tour):
        """Evaluate a TSP tour."""
        if not self.distance_matrix or not tour:
            return float('inf')
        
        total_distance = 0.0
        n = len(tour)
        
        for i in range(n):
            current_city = tour[i]
            next_city = tour[(i + 1) % n]
            total_distance += self.distance_matrix[current_city][next_city]
        
        return total_distance

class DatasetAwareVRPProblem(DatasetAwareProblem):
    """VRP problem that can load datasets from multiple sources."""
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.customers = []
        self.demands = []
        self.vehicle_capacity = 100
        self.depot = (0, 0)
        self._parse_vrp_data()
    
    def _parse_vrp_data(self):
        """Parse VRP data from dataset content."""
        if not self.dataset_content:
            return
        
        # Simple VRP format parsing
        lines = self.dataset_content.strip().split('\n')
        
        for line in lines:
            line = line.strip()
            if 'CAPACITY' in line:
                self.vehicle_capacity = int(line.split()[-1])
            elif line.startswith('DEMAND_SECTION'):
                # Parse demands
                continue
            # Add more parsing logic as needed
    
    def evaluate_solution(self, routes):
        """Evaluate VRP routes."""
        if not routes:
            return float('inf')
        
        total_cost = 0.0
        
        for route in routes:
            route_cost = 0.0
            current_pos = self.depot
            
            for customer in route:
                if customer < len(self.customers):
                    customer_pos = self.customers[customer]
                    # Calculate distance (simplified)
                    distance = ((current_pos[0] - customer_pos[0]) ** 2 + 
                               (current_pos[1] - customer_pos[1]) ** 2) ** 0.5
                    route_cost += distance
                    current_pos = customer_pos
            
            # Return to depot
            distance = ((current_pos[0] - self.depot[0]) ** 2 + 
                       (current_pos[1] - self.depot[1]) ** 2) ** 0.5
            route_cost += distance
            total_cost += route_cost
        
        return total_cost

# Factory function for creating dataset-aware problems
def create_dataset_aware_problem(problem_type: str, **kwargs):
    """
    Factory function to create dataset-aware problems.
    
    Args:
        problem_type: Type of problem ('tsp', 'vrp', etc.)
        **kwargs: Problem configuration parameters
        
    Returns:
        Dataset-aware problem instance
    """
    if problem_type.lower() == 'tsp':
        return DatasetAwareTSPProblem(**kwargs)
    elif problem_type.lower() == 'vrp':
        return DatasetAwareVRPProblem(**kwargs)
    else:
        raise ValueError(f"Unknown problem type: {problem_type}")

# Example usage
if __name__ == "__main__":
    # Example 1: Load from platform
    tsp_problem = DatasetAwareTSPProblem(
        dataset_source="platform",
        dataset_id="some-uuid",
        auth_token="your-token"
    )
    
    # Example 2: Load from local file
    local_tsp = DatasetAwareTSPProblem(
        dataset_source="local",
        instance_file="instances/berlin52.tsp"
    )
    
    # Example 3: Load from URL
    url_tsp = DatasetAwareTSPProblem(
        dataset_source="url",
        dataset_url="https://example.com/dataset.tsp"
    )

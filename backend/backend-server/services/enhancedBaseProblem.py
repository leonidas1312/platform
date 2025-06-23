"""
Enhanced BaseProblem with Optional Dataset Support

This module provides an enhanced base class for optimization problems that supports
multiple data sources while maintaining backward compatibility.

Features:
- Backward compatible with existing problems
- Optional platform dataset support
- Auto-detection of data sources
- Lazy loading for performance
- Convenience methods for different usage patterns
"""

import os
import json
from typing import Optional, Dict, Any, Union
from abc import ABC, abstractmethod


class BaseProblem(ABC):
    """
    Enhanced base class for optimization problems with optional dataset support.
    
    Supports multiple usage patterns:
    1. Traditional: Local files only (backward compatible)
    2. Dataset-aware: Platform/URL datasets when parameters provided
    3. Hybrid: Can switch between sources dynamically
    
    Examples:
        # Traditional usage (backward compatible)
        problem = TSPProblem(instance_file="berlin52.tsp")
        
        # Platform dataset
        problem = TSPProblem(dataset_id="uuid-123", auth_token="token")
        
        # External URL
        problem = TSPProblem(dataset_url="https://example.com/data.tsp")
        
        # Auto-detection
        problem = TSPProblem(dataset_id="uuid-123")  # Auto-selects platform
        
        # Convenience methods
        problem = TSPProblem.from_platform("uuid-123", auth_token="token")
        problem = TSPProblem.from_url("https://example.com/data.tsp")
        problem = TSPProblem.from_file("local.tsp")
    """
    
    def __init__(self, 
                 # Traditional parameters (backward compatible)
                 instance_file: Optional[str] = None,
                 
                 # Dataset-aware parameters (optional)
                 dataset_source: str = "auto",
                 dataset_id: Optional[str] = None,
                 dataset_url: Optional[str] = None,
                 platform_api_base: str = "https://rastion.com/api",
                 auth_token: Optional[str] = None,
                 
                 # Additional parameters
                 **kwargs):
        """
        Initialize the problem with optional dataset support.
        
        Args:
            instance_file: Local file path (backward compatible)
            dataset_source: Data source type ("auto", "platform", "url", "local", "none")
            dataset_id: Platform dataset ID
            dataset_url: External dataset URL
            platform_api_base: Base URL for platform API
            auth_token: Authentication token for platform access
            **kwargs: Additional parameters passed to subclasses
        """
        
        # Determine data source automatically
        self.dataset_source = self._determine_data_source(
            dataset_source, dataset_id, dataset_url, instance_file
        )
        
        # Initialize dataset state (lazy loading)
        self.dataset_content = None
        self.dataset_metadata = {}
        self._dataset_loaded = False
        self._dataset_error = None
        
        # Store parameters
        self.dataset_id = dataset_id
        self.dataset_url = dataset_url
        self.instance_file = instance_file
        self.platform_api_base = platform_api_base
        self.auth_token = auth_token
        
        # Store additional parameters for subclasses
        for key, value in kwargs.items():
            setattr(self, key, value)
        
        # Initialize problem-specific attributes
        self._initialize_problem()
    
    def _determine_data_source(self, dataset_source: str, dataset_id: Optional[str], 
                              dataset_url: Optional[str], instance_file: Optional[str]) -> str:
        """
        Automatically determine the best data source based on provided parameters.
        
        Args:
            dataset_source: Explicit source specification
            dataset_id: Platform dataset ID
            dataset_url: External URL
            instance_file: Local file path
            
        Returns:
            Determined data source type
        """
        if dataset_source != "auto":
            return dataset_source
        
        # Auto-detection logic (priority order)
        if dataset_id:
            return "platform"
        elif dataset_url:
            return "url"
        elif instance_file:
            return "local"
        else:
            return "none"  # No dataset required
    
    def get_dataset_content(self) -> Optional[str]:
        """
        Get dataset content with lazy loading.
        
        Returns:
            Dataset content as string, or None if no dataset
            
        Raises:
            Exception: If dataset loading fails
        """
        if not self._dataset_loaded:
            self._load_dataset()
        
        if self._dataset_error:
            raise self._dataset_error
            
        return self.dataset_content
    
    def get_dataset_metadata(self) -> Dict[str, Any]:
        """
        Get dataset metadata.
        
        Returns:
            Dictionary containing dataset metadata
        """
        if not self._dataset_loaded:
            self._load_dataset()
        
        return self.dataset_metadata
    
    def has_dataset(self) -> bool:
        """Check if problem has dataset support enabled."""
        return self.dataset_source != "none"
    
    def _load_dataset(self):
        """Load dataset based on determined source."""
        try:
            if self.dataset_source == "none":
                self.dataset_content = None
                self.dataset_metadata = {}
            elif self.dataset_source == "platform":
                self._load_from_platform()
            elif self.dataset_source == "url":
                self._load_from_url()
            elif self.dataset_source == "local":
                self._load_from_local()
            else:
                raise ValueError(f"Unknown dataset source: {self.dataset_source}")
                
        except Exception as e:
            self._dataset_error = e
            print(f"Warning: Failed to load dataset from {self.dataset_source}: {e}")
        finally:
            self._dataset_loaded = True
    
    def _load_from_platform(self):
        """Load dataset from Rastion platform."""
        if not self.dataset_id:
            raise ValueError("dataset_id required for platform source")
        
        try:
            import requests
        except ImportError:
            raise ImportError(
                "Platform dataset support requires 'requests' library.\n"
                "Install with: pip install requests\n"
                "Or install qubots with platform support: pip install qubots[platform]"
            )
        
        # Get dataset metadata
        metadata_url = f"{self.platform_api_base}/datasets/{self.dataset_id}"
        headers = {}
        if self.auth_token:
            headers["Authorization"] = f"Bearer {self.auth_token}"
        
        try:
            response = requests.get(metadata_url, headers=headers, timeout=30)
            response.raise_for_status()
            
            dataset_info = response.json()["dataset"]
            self.dataset_metadata = dataset_info.get("metadata", {})
            
            # Download dataset content
            download_url = f"{self.platform_api_base}/datasets/{self.dataset_id}/download"
            content_response = requests.get(download_url, headers=headers, timeout=60)
            content_response.raise_for_status()
            
            self.dataset_content = content_response.text
            print(f"✅ Loaded dataset from platform: {dataset_info.get('name', self.dataset_id)}")
            
        except requests.exceptions.RequestException as e:
            raise Exception(f"Failed to load dataset from platform: {e}")
    
    def _load_from_url(self):
        """Load dataset from external URL."""
        if not self.dataset_url:
            raise ValueError("dataset_url required for url source")
        
        try:
            import requests
        except ImportError:
            raise ImportError(
                "URL dataset support requires 'requests' library.\n"
                "Install with: pip install requests"
            )
        
        try:
            response = requests.get(self.dataset_url, timeout=60)
            response.raise_for_status()
            
            self.dataset_content = response.text
            print(f"✅ Loaded dataset from URL: {self.dataset_url}")
            
        except requests.exceptions.RequestException as e:
            raise Exception(f"Failed to load dataset from URL: {e}")
    
    def _load_from_local(self):
        """Load dataset from local file."""
        if not self.instance_file:
            raise ValueError("instance_file required for local source")
        
        # Handle relative paths
        file_path = self._resolve_file_path(self.instance_file)
        
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                self.dataset_content = f.read()
            
            print(f"✅ Loaded dataset from local file: {file_path}")
            
        except FileNotFoundError:
            raise FileNotFoundError(f"Dataset file not found: {file_path}")
        except Exception as e:
            raise Exception(f"Failed to load local dataset: {e}")
    
    def _resolve_file_path(self, instance_file: str) -> str:
        """Resolve file path relative to the problem module."""
        if os.path.isabs(instance_file):
            return instance_file
        
        # Look for file relative to the problem module
        import inspect
        frame = inspect.currentframe()
        try:
            # Walk up the call stack to find the problem module
            while frame:
                frame = frame.f_back
                if frame and '__file__' in frame.f_globals:
                    caller_file = frame.f_globals['__file__']
                    if caller_file and not caller_file.endswith('enhancedBaseProblem.py'):
                        base_dir = os.path.dirname(os.path.abspath(caller_file))
                        file_path = os.path.join(base_dir, instance_file)
                        if os.path.exists(file_path):
                            return file_path
        finally:
            del frame
        
        # Fallback to current working directory
        return instance_file
    
    def _initialize_problem(self):
        """
        Initialize problem-specific attributes.
        Override in subclasses for custom initialization.
        """
        pass
    
    # Convenience class methods for different usage patterns
    @classmethod
    def from_platform(cls, dataset_id: str, auth_token: Optional[str] = None, **kwargs):
        """
        Create problem instance from platform dataset.
        
        Args:
            dataset_id: Platform dataset ID
            auth_token: Authentication token
            **kwargs: Additional parameters
            
        Returns:
            Problem instance configured for platform dataset
        """
        return cls(dataset_source="platform", dataset_id=dataset_id, 
                  auth_token=auth_token, **kwargs)
    
    @classmethod
    def from_url(cls, dataset_url: str, **kwargs):
        """
        Create problem instance from URL dataset.
        
        Args:
            dataset_url: External dataset URL
            **kwargs: Additional parameters
            
        Returns:
            Problem instance configured for URL dataset
        """
        return cls(dataset_source="url", dataset_url=dataset_url, **kwargs)
    
    @classmethod
    def from_file(cls, instance_file: str, **kwargs):
        """
        Create problem instance from local file.
        
        Args:
            instance_file: Local file path
            **kwargs: Additional parameters
            
        Returns:
            Problem instance configured for local file
        """
        return cls(dataset_source="local", instance_file=instance_file, **kwargs)
    
    # Abstract methods that subclasses must implement
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
    
    # Optional methods that subclasses can override
    def is_valid_solution(self, solution: Any) -> bool:
        """
        Check if a solution is valid for this problem.
        
        Args:
            solution: The solution to validate
            
        Returns:
            True if solution is valid, False otherwise
        """
        return True
    
    def get_random_solution(self) -> Any:
        """
        Generate a random valid solution.
        
        Returns:
            A random solution for this problem
        """
        raise NotImplementedError("get_random_solution not implemented")
    
    def get_problem_info(self) -> Dict[str, Any]:
        """
        Get information about the problem instance.
        
        Returns:
            Dictionary containing problem information
        """
        return {
            'dataset_source': self.dataset_source,
            'has_dataset': self.has_dataset(),
            'dataset_metadata': self.get_dataset_metadata() if self.has_dataset() else {}
        }



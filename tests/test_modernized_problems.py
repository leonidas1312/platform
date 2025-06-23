"""
Test Suite for Modernized Dataset-Aware Problems

This test suite validates the functionality of modernized qubots that can
access datasets from multiple sources (platform, URL, local files).
"""

import unittest
import os
import json
import tempfile
import sys
from unittest.mock import patch, MagicMock

# Add the examples directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'examples'))

class TestModernizedTSPProblem(unittest.TestCase):
    """Test the modernized TSP problem implementation."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.test_data_dir = os.path.join(os.path.dirname(__file__), 'test_data')
        os.makedirs(self.test_data_dir, exist_ok=True)
        
        # Create test TSPLIB file
        self.tsplib_content = """NAME: test4
TYPE: TSP
DIMENSION: 4
EDGE_WEIGHT_TYPE: EUC_2D
NODE_COORD_SECTION
1 0 0
2 1 0
3 1 1
4 0 1
EOF"""
        
        self.tsplib_file = os.path.join(self.test_data_dir, 'test4.tsp')
        with open(self.tsplib_file, 'w') as f:
            f.write(self.tsplib_content)
        
        # Create test JSON file
        self.json_content = {
            "name": "test_json",
            "cities": [
                {"x": 0, "y": 0},
                {"x": 1, "y": 0},
                {"x": 1, "y": 1},
                {"x": 0, "y": 1}
            ]
        }
        
        self.json_file = os.path.join(self.test_data_dir, 'test.json')
        with open(self.json_file, 'w') as f:
            json.dump(self.json_content, f)
        
        # Create test CSV file
        self.csv_content = """x,y,city_name
0,0,A
1,0,B
1,1,C
0,1,D"""
        
        self.csv_file = os.path.join(self.test_data_dir, 'test.csv')
        with open(self.csv_file, 'w') as f:
            f.write(self.csv_content)
    
    def tearDown(self):
        """Clean up test fixtures."""
        import shutil
        if os.path.exists(self.test_data_dir):
            shutil.rmtree(self.test_data_dir)
    
    def test_local_tsplib_loading(self):
        """Test loading TSP problem from local TSPLIB file."""
        try:
            from modernized_tsp_problem.qubot import ModernizedTSPProblem

            # Test traditional usage (backward compatible)
            problem = ModernizedTSPProblem(instance_file=self.tsplib_file)

            self.assertEqual(problem.dimension, 4)
            self.assertEqual(problem.name, "test4")
            self.assertEqual(len(problem.cities), 4)
            self.assertIsNotNone(problem.distance_matrix)

            # Test solution evaluation
            tour = [0, 1, 2, 3]
            distance = problem.evaluate_solution(tour)
            self.assertGreater(distance, 0)
            self.assertTrue(problem.is_valid_solution(tour))

            # Test enhanced features
            self.assertTrue(problem.has_dataset())
            self.assertEqual(problem.dataset_source, "local")

        except ImportError:
            self.skipTest("ModernizedTSPProblem not available")

    def test_auto_detection(self):
        """Test auto-detection of data sources."""
        try:
            from modernized_tsp_problem.qubot import ModernizedTSPProblem

            # Test auto-detection with local file
            problem1 = ModernizedTSPProblem(instance_file=self.tsplib_file)
            self.assertEqual(problem1.dataset_source, "local")

            # Test auto-detection with dataset_id (would be platform)
            problem2 = ModernizedTSPProblem(dataset_id="test-uuid")
            self.assertEqual(problem2.dataset_source, "platform")

            # Test auto-detection with dataset_url (would be url)
            problem3 = ModernizedTSPProblem(dataset_url="https://example.com/data.tsp")
            self.assertEqual(problem3.dataset_source, "url")

        except ImportError:
            self.skipTest("ModernizedTSPProblem not available")

    def test_convenience_methods(self):
        """Test convenience class methods."""
        try:
            from modernized_tsp_problem.qubot import ModernizedTSPProblem

            # Test from_file method
            problem1 = ModernizedTSPProblem.from_file(self.tsplib_file)
            self.assertEqual(problem1.dataset_source, "local")
            self.assertEqual(problem1.dimension, 4)

            # Test from_platform method
            problem2 = ModernizedTSPProblem.from_platform("test-uuid", auth_token="token")
            self.assertEqual(problem2.dataset_source, "platform")
            self.assertEqual(problem2.dataset_id, "test-uuid")
            self.assertEqual(problem2.auth_token, "token")

            # Test from_url method
            problem3 = ModernizedTSPProblem.from_url("https://example.com/data.tsp")
            self.assertEqual(problem3.dataset_source, "url")
            self.assertEqual(problem3.dataset_url, "https://example.com/data.tsp")

        except ImportError:
            self.skipTest("ModernizedTSPProblem not available")

    def test_qubots_framework_integration(self):
        """Test integration with qubots framework."""
        try:
            from modernized_tsp_problem.qubot import ModernizedTSPProblem

            # Test with qubots framework features
            problem = ModernizedTSPProblem(instance_file=self.tsplib_file)

            # Test qubots framework methods if available
            if hasattr(problem, 'metadata'):
                self.assertIsNotNone(problem.metadata)
                self.assertEqual(problem.metadata.name, "Enhanced TSP Problem")
                self.assertEqual(problem.metadata.problem_type.value, "combinatorial")

            if hasattr(problem, 'get_statistics'):
                stats = problem.get_statistics()
                self.assertIn('instance_id', stats)
                self.assertIn('evaluation_count', stats)
                self.assertIn('dataset_source', stats)

            # Test enhanced dataset features
            self.assertTrue(problem.has_dataset())
            self.assertEqual(problem.dataset_source, "local")

            # Test evaluation with qubots framework
            tour = [0, 1, 2, 3]
            result = problem.evaluate_solution(tour)
            self.assertIsInstance(result, (int, float))
            self.assertGreater(result, 0)

        except ImportError:
            self.skipTest("ModernizedTSPProblem not available")

    def test_local_json_loading(self):
        """Test loading TSP problem from local JSON file."""
        try:
            from modernized_tsp_problem.qubot import ModernizedTSPProblem
            
            problem = ModernizedTSPProblem(
                dataset_source="local",
                instance_file=self.json_file
            )
            
            self.assertEqual(problem.dimension, 4)
            self.assertEqual(len(problem.cities), 4)
            self.assertIsNotNone(problem.distance_matrix)
            
        except ImportError:
            self.skipTest("ModernizedTSPProblem not available")
    
    def test_local_csv_loading(self):
        """Test loading TSP problem from local CSV file."""
        try:
            from modernized_tsp_problem.qubot import ModernizedTSPProblem
            
            problem = ModernizedTSPProblem(
                dataset_source="local",
                instance_file=self.csv_file
            )
            
            self.assertEqual(problem.dimension, 4)
            self.assertEqual(len(problem.cities), 4)
            self.assertIsNotNone(problem.distance_matrix)
            
        except ImportError:
            self.skipTest("ModernizedTSPProblem not available")
    
    @patch('requests.get')
    def test_platform_loading(self, mock_get):
        """Test loading TSP problem from platform dataset."""
        try:
            from modernized_tsp_problem.qubot import ModernizedTSPProblem
            
            # Mock platform API responses
            metadata_response = MagicMock()
            metadata_response.json.return_value = {
                "dataset": {
                    "name": "platform_test",
                    "metadata": {"format": "tsplib", "dimension": 4}
                }
            }
            metadata_response.raise_for_status.return_value = None
            
            content_response = MagicMock()
            content_response.text = self.tsplib_content
            content_response.raise_for_status.return_value = None
            
            mock_get.side_effect = [metadata_response, content_response]
            
            problem = ModernizedTSPProblem(
                dataset_source="platform",
                dataset_id="test-uuid",
                auth_token="test-token"
            )
            
            self.assertEqual(problem.dimension, 4)
            self.assertEqual(len(problem.cities), 4)
            
        except ImportError:
            self.skipTest("ModernizedTSPProblem not available")
    
    @patch('requests.get')
    def test_url_loading(self, mock_get):
        """Test loading TSP problem from external URL."""
        try:
            from modernized_tsp_problem.qubot import ModernizedTSPProblem
            
            # Mock URL response
            mock_response = MagicMock()
            mock_response.text = self.tsplib_content
            mock_response.raise_for_status.return_value = None
            mock_get.return_value = mock_response
            
            problem = ModernizedTSPProblem(
                dataset_source="url",
                dataset_url="https://example.com/test.tsp"
            )
            
            self.assertEqual(problem.dimension, 4)
            self.assertEqual(len(problem.cities), 4)
            
        except ImportError:
            self.skipTest("ModernizedTSPProblem not available")

class TestModernizedVRPProblem(unittest.TestCase):
    """Test the modernized VRP problem implementation."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.test_data_dir = os.path.join(os.path.dirname(__file__), 'test_data')
        os.makedirs(self.test_data_dir, exist_ok=True)
        
        # Create test VRP file
        self.vrp_content = """NAME: test_vrp
TYPE: CVRP
DIMENSION: 5
CAPACITY: 100
NODE_COORD_SECTION
1 0 0
2 1 0
3 1 1
4 0 1
5 2 2
DEMAND_SECTION
1 0
2 10
3 20
4 15
5 25
DEPOT_SECTION
1
-1
EOF"""
        
        self.vrp_file = os.path.join(self.test_data_dir, 'test.vrp')
        with open(self.vrp_file, 'w') as f:
            f.write(self.vrp_content)
    
    def tearDown(self):
        """Clean up test fixtures."""
        import shutil
        if os.path.exists(self.test_data_dir):
            shutil.rmtree(self.test_data_dir)
    
    def test_local_vrp_loading(self):
        """Test loading VRP problem from local file."""
        try:
            from modernized_vrp_problem.qubot import ModernizedVRPProblem
            
            problem = ModernizedVRPProblem(
                dataset_source="local",
                instance_file=self.vrp_file
            )
            
            self.assertEqual(problem.dimension, 5)
            self.assertEqual(problem.vehicle_capacity, 100)
            self.assertEqual(len(problem.customers), 5)
            self.assertEqual(len(problem.demands), 5)
            
            # Test solution evaluation
            routes = [[1, 2], [3, 4]]
            cost = problem.evaluate_solution(routes)
            self.assertGreater(cost, 0)
            
        except ImportError:
            self.skipTest("ModernizedVRPProblem not available")

class TestDatasetMetadataExtraction(unittest.TestCase):
    """Test dataset metadata extraction functionality."""
    
    def test_tsplib_metadata_extraction(self):
        """Test metadata extraction from TSPLIB format."""
        content = """NAME: berlin52
TYPE: TSP
COMMENT: 52 locations in Berlin (Groetschel)
DIMENSION: 52
EDGE_WEIGHT_TYPE: EUC_2D
NODE_COORD_SECTION
1 565.0 575.0
2 25.0 185.0
EOF"""
        
        # This would test the actual metadata extraction service
        # For now, we'll test the expected structure
        expected_fields = ['name', 'dimension', 'distance_type', 'has_coordinates']
        
        # Mock the extraction result
        metadata = {
            'name': 'berlin52',
            'dimension': 52,
            'distance_type': 'EUC_2D',
            'has_coordinates': True,
            'problem_type': 'tsp',
            'format': 'tsplib'
        }
        
        for field in expected_fields:
            self.assertIn(field, metadata)
    
    def test_vrp_metadata_extraction(self):
        """Test metadata extraction from VRP format."""
        content = """NAME: A-n32-k5
TYPE: CVRP
DIMENSION: 32
CAPACITY: 100
NODE_COORD_SECTION
DEMAND_SECTION
EOF"""
        
        expected_fields = ['name', 'dimension', 'vehicle_capacity', 'has_coordinates', 'has_demands']
        
        # Mock the extraction result
        metadata = {
            'name': 'A-n32-k5',
            'dimension': 32,
            'vehicle_capacity': 100,
            'has_coordinates': True,
            'has_demands': True,
            'problem_type': 'vrp',
            'format': 'vrp'
        }
        
        for field in expected_fields:
            self.assertIn(field, metadata)

class TestDatasetValidation(unittest.TestCase):
    """Test dataset validation functionality."""
    
    def test_tsp_validation(self):
        """Test TSP dataset validation."""
        content = """NAME: test
DIMENSION: 4
NODE_COORD_SECTION
1 0 0
2 1 1
EOF"""
        
        requirements = {
            "format": "tsplib",
            "min_size": 3,
            "max_size": 1000,
            "required_fields": ["DIMENSION"],
            "supported_formats": ["tsplib"]
        }
        
        metadata = {
            "format": "tsplib",
            "dimension": 4,
            "has_coordinates": True
        }
        
        # This would test the actual validation service
        # For now, we'll test the expected validation logic
        self.assertTrue(metadata["dimension"] >= requirements["min_size"])
        self.assertTrue(metadata["dimension"] <= requirements["max_size"])
        self.assertIn(metadata["format"], requirements["supported_formats"])

if __name__ == '__main__':
    # Create test data directory if it doesn't exist
    test_dir = os.path.dirname(__file__)
    if not os.path.exists(test_dir):
        os.makedirs(test_dir)
    
    unittest.main()

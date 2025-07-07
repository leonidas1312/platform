/**
 * Test script for leaderboard export functionality
 * This script tests the new workflow-to-leaderboard export feature
 */

const fetch = require('node-fetch');

const API_BASE = 'http://localhost:3001/api';

// Test data for leaderboard export
const testExportData = {
  name: "Test TSP Challenge",
  description: "A test traveling salesman problem challenge exported from workflow automation",
  problem_type: "tsp",
  difficulty_level: "medium",
  tags: ["test", "tsp", "workflow-export"],
  dataset_info: {
    name: "test-cities.csv",
    description: "A small dataset with 20 cities for testing",
    size: "2KB"
  },
  problem_config: {
    repository: "examples/tsp-problem",
    workflow_nodes: [
      {
        id: "dataset-1",
        type: "dataset",
        data: { name: "test-cities.csv" }
      },
      {
        id: "problem-1", 
        type: "problem",
        data: { name: "TSP Problem", repository: "examples/tsp-problem" }
      }
    ],
    workflow_connections: [
      {
        source: "dataset-1",
        target: "problem-1"
      }
    ]
  }
};

async function testLeaderboardExport() {
  console.log('🧪 Testing Leaderboard Export API...\n');

  try {
    // Test 1: Export workflow to leaderboard (requires authentication)
    console.log('📤 Testing workflow export to leaderboard...');
    
    const exportResponse = await fetch(`${API_BASE}/workflow-automation/export-to-leaderboard`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Note: In real usage, this would include authentication headers
        'x-user-id': 'test-user'
      },
      body: JSON.stringify(testExportData)
    });

    if (exportResponse.ok) {
      const exportResult = await exportResponse.json();
      console.log('✅ Export successful:', exportResult);
      
      if (exportResult.problem_id) {
        // Test 2: Fetch the created challenge
        console.log('\n📋 Testing challenge retrieval...');
        
        const challengesResponse = await fetch(`${API_BASE}/leaderboard/problems?include_stats=true&include_tags=true`);
        
        if (challengesResponse.ok) {
          const challengesResult = await challengesResponse.json();
          console.log('✅ Challenges retrieved:', challengesResult.problems.length, 'challenges found');
          
          // Find our test challenge
          const testChallenge = challengesResult.problems.find(p => p.id === exportResult.problem_id);
          if (testChallenge) {
            console.log('✅ Test challenge found:', {
              id: testChallenge.id,
              name: testChallenge.name,
              problem_type: testChallenge.problem_type,
              created_from_workflow: testChallenge.created_from_workflow,
              tags: testChallenge.tags
            });
          } else {
            console.log('❌ Test challenge not found in results');
          }
        } else {
          console.log('❌ Failed to retrieve challenges:', challengesResponse.status);
        }
      }
    } else {
      const errorResult = await exportResponse.text();
      console.log('❌ Export failed:', exportResponse.status, errorResult);
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

async function testLeaderboardBrowse() {
  console.log('\n🔍 Testing Leaderboard Browse API...\n');

  try {
    // Test different filter combinations
    const testCases = [
      { name: 'All challenges', params: '' },
      { name: 'TSP challenges only', params: '?problem_type=tsp' },
      { name: 'Medium difficulty', params: '?difficulty_level=medium' },
      { name: 'Workflow challenges', params: '?created_from_workflow=true' },
      { name: 'With stats and tags', params: '?include_stats=true&include_tags=true' }
    ];

    for (const testCase of testCases) {
      console.log(`📊 Testing: ${testCase.name}`);
      
      const response = await fetch(`${API_BASE}/leaderboard/problems${testCase.params}`);
      
      if (response.ok) {
        const result = await response.json();
        console.log(`✅ ${result.problems.length} challenges found`);
        
        if (result.problems.length > 0) {
          const sample = result.problems[0];
          console.log(`   Sample: ${sample.name} (${sample.problem_type}, ${sample.difficulty_level})`);
          if (sample.tags) {
            console.log(`   Tags: ${sample.tags.join(', ')}`);
          }
        }
      } else {
        console.log(`❌ Failed: ${response.status}`);
      }
      console.log('');
    }

  } catch (error) {
    console.error('❌ Browse test failed:', error.message);
  }
}

// Run tests
async function runTests() {
  console.log('🚀 Starting Leaderboard Export Tests\n');
  console.log('Note: These tests require the backend server to be running on localhost:3001\n');
  
  await testLeaderboardBrowse();
  // Note: Export test requires authentication, so it's commented out for now
  // await testLeaderboardExport();
  
  console.log('🏁 Tests completed!');
}

// Run if called directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = {
  testLeaderboardExport,
  testLeaderboardBrowse,
  runTests
};

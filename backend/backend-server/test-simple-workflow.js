/**
 * Simple test to verify workflow execution and log streaming
 */

async function testSimpleWorkflow() {
  console.log('🧪 Testing simple workflow execution...')
  
  try {
    // Import the unified workflow service
    const UnifiedWorkflowExecutionService = require('./services/unifiedWorkflowExecutionService')
    
    // Create a mock WebSocket for testing
    const mockWS = {
      readyState: 1, // OPEN
      send: (data) => {
        try {
          const message = JSON.parse(data)
          if (message.type === 'log') {
            console.log(`📝 [${message.data.level.toUpperCase()}] ${message.data.source}: ${message.data.message}`)
          } else {
            console.log(`📤 WebSocket message:`, message)
          }
        } catch (error) {
          console.log(`📤 Raw WebSocket data:`, data)
        }
      },
      on: () => {}, // Mock event handler
      close: () => {}
    }
    
    // Create service instance
    const service = UnifiedWorkflowExecutionService.getInstance()
    
    // Simple test workflow
    const nodes = [
      {
        id: 'problem-1',
        type: 'problem',
        data: {
          repository: 'rastion/tsp-problem',
          parameters: {
            num_cities: 5
          }
        }
      },
      {
        id: 'optimizer-1',
        type: 'optimizer', 
        data: {
          repository: 'rastion/genetic-algorithm',
          parameters: {
            population_size: 10,
            generations: 5
          }
        }
      }
    ]
    
    const connections = [
      {
        source: 'problem-1',
        target: 'optimizer-1'
      }
    ]
    
    const executionId = `test_${Date.now()}`
    
    console.log(`🚀 Starting workflow execution: ${executionId}`)
    
    // Execute workflow
    const result = await service.executeWorkflow(
      executionId,
      nodes,
      connections,
      {},
      mockWS,
      null // No auth token for test
    )
    
    console.log('✅ Workflow execution completed!')
    console.log('📊 Result:', result)
    
    return true
    
  } catch (error) {
    console.error('❌ Workflow execution failed:', error.message)
    console.error('🔍 Stack trace:', error.stack)
    return false
  }
}

// Run the test
if (require.main === module) {
  testSimpleWorkflow()
    .then((success) => {
      if (success) {
        console.log('🎉 Test completed successfully!')
        process.exit(0)
      } else {
        console.log('💥 Test failed!')
        process.exit(1)
      }
    })
    .catch((error) => {
      console.error('💥 Test execution failed:', error.message)
      process.exit(1)
    })
}

module.exports = { testSimpleWorkflow }

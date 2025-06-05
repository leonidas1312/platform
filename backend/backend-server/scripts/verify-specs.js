#!/usr/bin/env node
/**
 * Verification script to check environment specifications
 * Run with: node scripts/verify-specs.js
 */

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args))

async function verifySpecs() {
  console.log('🔍 Verifying Environment Specifications...\n')
  
  const baseUrl = process.env.API_BASE_URL || 'http://localhost:4000'
  
  try {
    // Test the verified specs endpoint
    console.log('📡 Fetching verified specs from Kubernetes configuration...')
    const specsResponse = await fetch(`${baseUrl}/api/playground/qubots/specs`)
    const specsData = await specsResponse.json()
    
    if (specsData.success) {
      console.log('✅ Verified specs retrieved successfully!')
      console.log('\n📋 Environment Specifications:')
      console.log('─'.repeat(50))
      
      const specs = specsData.environment_specs
      
      console.log(`⏱️  Session Duration: ${specs.runtime_limit.value} ${specs.runtime_limit.unit}`)
      console.log(`🖥️  CPU: ${specs.cpu.cores} cores (${specs.cpu.requests} guaranteed)`)
      console.log(`💾 Memory: ${specs.memory.value}${specs.memory.unit} (${specs.memory.requests} guaranteed)`)
      console.log(`💿 Storage: ${specs.storage.value}`)
      console.log(`🐍 Python: ${specs.python_version}`)
      console.log(`🔒 Container Isolation: ${specs.container_isolation ? 'Yes' : 'No'}`)
      console.log(`📦 Qubots Support: ${specs.qubots_support ? 'Yes' : 'No'}`)
      console.log(`🌐 Max Environments: ${specs.max_environments}`)
      
      console.log('\n🔌 Available Ports:')
      console.log(`   • Qubots API: ${specs.ports.qubots_api}`)
      console.log(`   • Jupyter: ${specs.ports.jupyter}`)
      console.log(`   • VS Code: ${specs.ports.vscode}`)
      
      console.log(`\n🐳 Base Image: ${specs.base_image}`)
      console.log(`\n✅ Verified: ${specsData.verified}`)
      console.log(`📅 Timestamp: ${specsData.timestamp}`)
      
    } else {
      console.log('❌ Failed to get verified specs:', specsData.message)
    }
    
    // Test the regular status endpoint
    console.log('\n' + '─'.repeat(50))
    console.log('📡 Fetching regular status endpoint...')
    const statusResponse = await fetch(`${baseUrl}/api/playground/qubots/status`)
    const statusData = await statusResponse.json()
    
    if (statusData.success) {
      console.log('✅ Status endpoint working!')
      console.log(`📋 Environment specs in status: ${statusData.environment_specs ? 'Present' : 'Missing'}`)
    } else {
      console.log('❌ Status endpoint failed')
    }
    
  } catch (error) {
    console.error('❌ Error verifying specs:', error.message)
    console.log('\n💡 Make sure the backend server is running on', baseUrl)
  }
}

// Run the verification
verifySpecs()

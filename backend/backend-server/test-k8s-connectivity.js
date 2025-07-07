/**
 * Test Kubernetes connectivity and diagnose workflow execution issues
 */

async function testKubernetesConnectivity() {
  // Dynamic import for ES module
  const k8s = await import('@kubernetes/client-node')
  console.log('🧪 Testing Kubernetes connectivity...')
  
  try {
    // Initialize Kubernetes client
    const kc = new k8s.KubeConfig()
    kc.loadFromDefault()
    const k8sApi = kc.makeApiClient(k8s.CoreV1Api)
    const k8sBatchApi = kc.makeApiClient(k8s.BatchV1Api)
    
    console.log('✅ Kubernetes client initialized')
    
    // Test 1: Check cluster connectivity
    console.log('\n📋 Test 1: Cluster connectivity')
    try {
      const nodes = await k8sApi.listNode()
      console.log(`✅ Connected to cluster with ${nodes.body?.items?.length || 0} nodes`)
      
      const readyNodes = nodes.body?.items?.filter(node => {
        const conditions = node.status?.conditions || []
        return conditions.some(condition => 
          condition.type === 'Ready' && condition.status === 'True'
        )
      }) || []
      
      console.log(`📋 Ready nodes: ${readyNodes.length}/${nodes.body?.items?.length || 0}`)
      
      if (readyNodes.length === 0) {
        console.warn('⚠️ No ready nodes found!')
      }
    } catch (error) {
      console.error('❌ Cluster connectivity failed:', error.message)
      return false
    }
    
    // Test 2: Check namespace
    console.log('\n📋 Test 2: Namespace access')
    const namespace = process.env.PLAYGROUND_NAMESPACE || 'playground'
    try {
      await k8sApi.readNamespace({ name: namespace })
      console.log(`✅ Namespace '${namespace}' exists and accessible`)
    } catch (error) {
      if (error.response?.statusCode === 404) {
        console.log(`📦 Namespace '${namespace}' not found, attempting to create...`)
        try {
          await k8sApi.createNamespace({
            body: {
              metadata: {
                name: namespace,
                labels: {
                  'app': 'rastion-playground',
                  'managed-by': 'test-script'
                }
              }
            }
          })
          console.log(`✅ Namespace '${namespace}' created successfully`)
        } catch (createError) {
          console.error(`❌ Failed to create namespace: ${createError.message}`)
          return false
        }
      } else {
        console.error(`❌ Namespace access failed: ${error.message}`)
        return false
      }
    }
    
    // Test 3: Check permissions
    console.log('\n📋 Test 3: RBAC permissions')
    try {
      // Test job creation permissions
      await k8sBatchApi.listNamespacedJob({ namespace })
      console.log('✅ Job list permission granted')
      
      // Test pod list permissions
      await k8sApi.listNamespacedPod({ namespace })
      console.log('✅ Pod list permission granted')
      
      // Test event list permissions
      await k8sApi.listNamespacedEvent({ namespace })
      console.log('✅ Event list permission granted')
      
    } catch (error) {
      console.error(`❌ Permission check failed: ${error.message}`)
      console.error('🔍 This might be an RBAC issue - check service account permissions')
    }
    
    // Test 4: Create a test job
    console.log('\n📋 Test 4: Test job creation')
    const testJobName = `test-job-${Date.now()}`
    const testJob = {
      metadata: {
        name: testJobName,
        namespace: namespace
      },
      spec: {
        template: {
          spec: {
            containers: [{
              name: 'test-container',
              image: 'busybox:latest',
              command: ['echo', 'Hello from test job'],
              resources: {
                limits: { cpu: '100m', memory: '128Mi' },
                requests: { cpu: '50m', memory: '64Mi' }
              }
            }],
            restartPolicy: 'Never'
          }
        },
        backoffLimit: 1,
        activeDeadlineSeconds: 60
      }
    }
    
    try {
      const result = await k8sBatchApi.createNamespacedJob({ namespace, body: testJob })
      console.log(`✅ Test job '${testJobName}' created successfully`)
      console.log(`📋 Job UID: ${result.body?.metadata?.uid}`)
      
      // Wait a bit and check job status
      await new Promise(resolve => setTimeout(resolve, 5000))
      
      try {
        const jobStatus = await k8sBatchApi.readNamespacedJob({ name: testJobName, namespace })
        console.log(`📋 Job status:`, {
          active: jobStatus.body?.status?.active || 0,
          succeeded: jobStatus.body?.status?.succeeded || 0,
          failed: jobStatus.body?.status?.failed || 0
        })
        
        // Check for pods
        const pods = await k8sApi.listNamespacedPod({
          namespace,
          labelSelector: `job-name=${testJobName}`
        })
        
        console.log(`📋 Found ${pods.body?.items?.length || 0} pods for test job`)
        
        if (pods.body?.items?.length > 0) {
          const pod = pods.body.items[0]
          console.log(`📋 Pod status: ${pod.status?.phase}`)
          
          if (pod.status?.containerStatuses) {
            for (const container of pod.status.containerStatuses) {
              console.log(`📋 Container '${container.name}': ready=${container.ready}, restartCount=${container.restartCount}`)
              if (container.state?.waiting) {
                console.log(`📋 Container waiting: ${container.state.waiting.reason} - ${container.state.waiting.message}`)
              }
            }
          }
        }
        
      } catch (statusError) {
        console.warn(`⚠️ Could not check job status: ${statusError.message}`)
      }
      
      // Clean up test job
      try {
        await k8sBatchApi.deleteNamespacedJob({ name: testJobName, namespace })
        console.log(`🧹 Test job '${testJobName}' cleaned up`)
      } catch (cleanupError) {
        console.warn(`⚠️ Could not clean up test job: ${cleanupError.message}`)
      }
      
    } catch (error) {
      console.error(`❌ Test job creation failed: ${error.message}`)
      if (error.response?.body) {
        console.error('🔍 Error details:', JSON.stringify(error.response.body, null, 2))
      }
      return false
    }
    
    // Test 5: Check image availability
    console.log('\n📋 Test 5: Image availability')
    const image = process.env.PLAYGROUND_IMAGE || 'registry.digitalocean.com/rastion/qubots-playground:latest'
    console.log(`📋 Configured image: ${image}`)
    
    // Note: We can't directly test image pull without creating a pod, 
    // but we can check if it's a public image or if we have registry access
    if (image.includes('registry.digitalocean.com')) {
      console.log('📋 Using DigitalOcean registry - ensure cluster has pull access')
    } else if (image.includes('docker.io') || !image.includes('/')) {
      console.log('📋 Using Docker Hub image - should be publicly accessible')
    }
    
    console.log('\n🎉 Kubernetes connectivity test completed successfully!')
    return true
    
  } catch (error) {
    console.error('💥 Kubernetes connectivity test failed:', error.message)
    console.error('🔍 Stack trace:', error.stack)
    return false
  }
}

// Run the test
if (require.main === module) {
  testKubernetesConnectivity()
    .then((success) => {
      if (success) {
        console.log('✅ All tests passed!')
        process.exit(0)
      } else {
        console.log('❌ Some tests failed!')
        process.exit(1)
      }
    })
    .catch((error) => {
      console.error('💥 Test execution failed:', error.message)
      process.exit(1)
    })
}

module.exports = { testKubernetesConnectivity }

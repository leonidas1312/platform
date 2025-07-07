/**
 * Comprehensive Test Suite for Workflow Execution System
 * 
 * Tests all components of the enhanced workflow execution system including
 * code generation, security, resource management, logging, and performance optimization.
 */

const { expect } = require('chai')
const sinon = require('sinon')
const UnifiedWorkflowExecutionService = require('../services/unifiedWorkflowExecutionService')
const EnhancedWorkflowCodeGenerator = require('../services/enhancedWorkflowCodeGenerator')
const WorkflowConfigurationParser = require('../services/workflowConfigurationParser')
const ResourceManager = require('../services/resourceManager')
const SecurityManager = require('../services/securityManager')
const EnhancedLoggingManager = require('../services/enhancedLoggingManager')
const EnhancedWebSocketManager = require('../services/enhancedWebSocketManager')
const IntegrationManager = require('../services/integrationManager')
const ErrorHandlingManager = require('../services/errorHandlingManager')
const PerformanceOptimizationManager = require('../services/performanceOptimizationManager')

describe('Workflow Execution System', () => {
  let workflowService
  let mockWebSocket

  beforeEach(() => {
    // Mock WebSocket
    mockWebSocket = {
      readyState: 1, // OPEN
      send: sinon.stub(),
      on: sinon.stub(),
      close: sinon.stub(),
      terminate: sinon.stub(),
      ping: sinon.stub()
    }

    // Initialize service with mocked dependencies
    workflowService = new UnifiedWorkflowExecutionService()
    
    // Mock Kubernetes client to avoid actual cluster calls
    workflowService.k8sInitialized = true
    workflowService.k8sApi = {
      listNamespace: sinon.stub().resolves({ body: { items: [] } }),
      readNamespace: sinon.stub().resolves({}),
      createNamespace: sinon.stub().resolves({})
    }
    workflowService.k8sBatchApi = {
      createNamespacedJob: sinon.stub().resolves({ body: { metadata: { uid: 'test-uid' } } }),
      readNamespacedJob: sinon.stub().resolves({ body: { status: {} } }),
      deleteNamespacedJob: sinon.stub().resolves({})
    }
  })

  afterEach(() => {
    sinon.restore()
  })

  describe('Enhanced Workflow Code Generator', () => {
    let codeGenerator

    beforeEach(() => {
      codeGenerator = new EnhancedWorkflowCodeGenerator()
    })

    it('should generate valid Python script for complete workflow', () => {
      const workflowConfig = {
        dataset: {
          datasetId: 'test-dataset-123',
          metadata: { file_size: 1024 }
        },
        problem: {
          data: {
            repository: 'test-user/test-problem',
            parameters: { n_vertices: 10 }
          }
        },
        optimizer: {
          data: {
            repository: 'test-user/test-optimizer',
            parameters: { time_limit: 60 }
          }
        }
      }

      const script = codeGenerator.generateWorkflowScript(workflowConfig, 'test-exec-123', 'test-token')

      expect(script).to.be.a('string')
      expect(script).to.include('from qubots import AutoProblem, AutoOptimizer, load_dataset_from_platform')
      expect(script).to.include('load_dataset_from_platform')
      expect(script).to.include('AutoProblem.from_repo')
      expect(script).to.include('AutoOptimizer.from_repo')
      expect(script).to.include('optimizer.optimize(problem)')
      expect(script).to.include('WORKFLOW_RESULT_START')
      expect(script).to.include('WORKFLOW_RESULT_END')
    })

    it('should handle workflow without dataset', () => {
      const workflowConfig = {
        dataset: null,
        problem: {
          data: {
            repository: 'test-user/test-problem',
            parameters: {}
          }
        },
        optimizer: {
          data: {
            repository: 'test-user/test-optimizer',
            parameters: {}
          }
        }
      }

      const script = codeGenerator.generateWorkflowScript(workflowConfig, 'test-exec-123')

      expect(script).to.include('No dataset specified')
      expect(script).to.include('dataset_content = None')
    })

    it('should validate workflow configuration', () => {
      expect(() => {
        codeGenerator.validateWorkflowConfig({})
      }).to.throw('Problem node is required')

      expect(() => {
        codeGenerator.validateWorkflowConfig({
          problem: { data: {} }
        })
      }).to.throw('Optimizer node is required')

      expect(() => {
        codeGenerator.validateWorkflowConfig({
          problem: { data: {} },
          optimizer: { data: {} }
        })
      }).to.throw('Problem repository is required')
    })
  })

  describe('Workflow Configuration Parser', () => {
    let configParser

    beforeEach(() => {
      configParser = new WorkflowConfigurationParser()
    })

    it('should parse valid workflow nodes and connections', () => {
      const nodes = [
        {
          id: 'dataset-1',
          type: 'dataset',
          data: { datasetId: 'test-dataset', name: 'Test Dataset' }
        },
        {
          id: 'problem-1',
          type: 'problem',
          data: { repository: 'user/problem', name: 'Test Problem' }
        },
        {
          id: 'optimizer-1',
          type: 'optimizer',
          data: { repository: 'user/optimizer', name: 'Test Optimizer' }
        }
      ]

      const connections = [
        { source: 'dataset-1', target: 'problem-1' },
        { source: 'problem-1', target: 'optimizer-1' }
      ]

      const config = configParser.parseWorkflow(nodes, connections)

      expect(config).to.have.property('dataset')
      expect(config).to.have.property('problem')
      expect(config).to.have.property('optimizer')
      expect(config).to.have.property('executionOrder')
      expect(config.executionOrder).to.have.length(3)
    })

    it('should detect circular dependencies', () => {
      const nodes = [
        { id: 'problem-1', type: 'problem', data: { repository: 'user/problem' } },
        { id: 'optimizer-1', type: 'optimizer', data: { repository: 'user/optimizer' } }
      ]

      const connections = [
        { source: 'problem-1', target: 'optimizer-1' },
        { source: 'optimizer-1', target: 'problem-1' } // Circular dependency
      ]

      expect(() => {
        configParser.parseWorkflow(nodes, connections)
      }).to.throw('Circular dependency detected')
    })

    it('should validate required components', () => {
      expect(() => {
        configParser.parseWorkflow([], [])
      }).to.throw('Workflow must contain at least one node')

      expect(() => {
        configParser.parseWorkflow([
          { id: 'dataset-1', type: 'dataset', data: {} }
        ], [])
      }).to.throw('Workflow must contain a problem node')
    })
  })

  describe('Resource Manager', () => {
    let resourceManager

    beforeEach(() => {
      resourceManager = new ResourceManager()
    })

    it('should determine appropriate resource profile', () => {
      const smallWorkflow = {
        dataset: { metadata: { file_size: 1024 } },
        problem: { data: { parameters: { n: 10 } } },
        optimizer: { data: { parameters: { time_limit: 30 } } }
      }

      const largeWorkflow = {
        dataset: { metadata: { file_size: 100 * 1024 * 1024 } },
        problem: { data: { parameters: { n: 1000, complexity: 'high' } } },
        optimizer: { data: { name: 'genetic-algorithm', parameters: { population: 1000 } } }
      }

      expect(resourceManager.determineResourceProfile(smallWorkflow)).to.equal('small')
      expect(resourceManager.determineResourceProfile(largeWorkflow)).to.equal('large')
    })

    it('should manage resource allocation and release', () => {
      const executionId = 'test-exec-123'
      
      // Check initial availability
      expect(resourceManager.canAllocateResources('small')).to.be.true

      // Allocate resources
      const spec = resourceManager.allocateResources(executionId, 'small')
      expect(spec).to.have.property('cpu')
      expect(spec).to.have.property('memory')

      // Check utilization
      const utilization = resourceManager.getResourceUtilization()
      expect(utilization.activeExecutions).to.equal(1)

      // Release resources
      resourceManager.releaseResources(executionId)
      const utilizationAfter = resourceManager.getResourceUtilization()
      expect(utilizationAfter.activeExecutions).to.equal(0)
    })

    it('should prevent over-allocation of resources', () => {
      // Allocate all available resources
      for (let i = 0; i < 10; i++) {
        if (resourceManager.canAllocateResources('large')) {
          resourceManager.allocateResources(`exec-${i}`, 'large')
        }
      }

      // Should not be able to allocate more
      expect(resourceManager.canAllocateResources('large')).to.be.false
    })
  })

  describe('Security Manager', () => {
    let securityManager

    beforeEach(() => {
      securityManager = new SecurityManager()
    })

    it('should validate execution environment', () => {
      const safeScript = `
        from qubots import AutoProblem
        problem = AutoProblem.from_repo("user/repo")
        print("Safe execution")
      `

      const dangerousScript = `
        import os
        os.system("rm -rf /")
        eval("malicious_code()")
      `

      const safeValidation = securityManager.validateExecutionEnvironment(safeScript, 'test-exec')
      expect(safeValidation.isValid).to.be.true
      expect(safeValidation.errors).to.be.empty

      const dangerousValidation = securityManager.validateExecutionEnvironment(dangerousScript, 'test-exec')
      expect(dangerousValidation.warnings).to.not.be.empty
    })

    it('should create secure job manifest', () => {
      const manifest = securityManager.createSecureJobManifest(
        'test-job',
        'print("test")',
        'test-exec',
        { cpu: '250m', memory: '512Mi', cpuLimit: '500m', memoryLimit: '1Gi' }
      )

      expect(manifest).to.have.property('apiVersion', 'batch/v1')
      expect(manifest).to.have.property('kind', 'Job')
      expect(manifest.spec.template.spec.securityContext.runAsNonRoot).to.be.true
      expect(manifest.spec.template.spec.containers[0].securityContext.allowPrivilegeEscalation).to.be.false
    })

    it('should log security events', () => {
      securityManager.logSecurityEvent('test_event', 'test-exec', { test: true })
      
      const events = securityManager.getSecurityEvents(10)
      expect(events).to.have.length(1)
      expect(events[0]).to.have.property('type', 'test_event')
      expect(events[0]).to.have.property('executionId', 'test-exec')
    })
  })

  describe('Enhanced Logging Manager', () => {
    let loggingManager

    beforeEach(() => {
      loggingManager = new EnhancedLoggingManager()
    })

    it('should initialize execution logging', () => {
      const executionId = 'test-exec-123'
      loggingManager.initializeExecution(executionId)

      const stepProgress = loggingManager.getStepProgress(executionId)
      expect(stepProgress).to.have.property('currentStep', 'dataset')
      expect(stepProgress.steps).to.have.property('dataset')
      expect(stepProgress.steps).to.have.property('problem')
      expect(stepProgress.steps).to.have.property('optimizer')
      expect(stepProgress.steps).to.have.property('execution')
      expect(stepProgress.steps).to.have.property('results')
    })

    it('should process log output and categorize by steps', () => {
      const executionId = 'test-exec-123'
      loggingManager.initializeExecution(executionId)

      const rawLogs = `
        STEP_LOG: {"step": "dataset", "level": "info", "message": "Loading dataset..."}
        STEP_PROGRESS: {"step": "dataset", "progress": 50, "message": "Dataset loading in progress"}
        Dataset loaded successfully. Size: 1024 characters
        STEP_LOG: {"step": "problem", "level": "info", "message": "Loading problem..."}
        Problem loaded successfully: TSPProblem
      `

      const processed = loggingManager.processLogOutput(executionId, rawLogs)
      
      expect(processed.logs).to.have.length.greaterThan(0)
      expect(processed.stepProgress).to.have.property('steps')
      expect(processed.summary).to.have.property('totalSteps', 5)
    })

    it('should extract workflow results from logs', () => {
      const logsWithResult = `
        Some log output...
        WORKFLOW_RESULT_START
        {"success": true, "best_value": 42, "runtime_seconds": 1.5}
        WORKFLOW_RESULT_END
        More log output...
      `

      const result = loggingManager.extractWorkflowResult(logsWithResult)
      expect(result).to.deep.equal({
        success: true,
        best_value: 42,
        runtime_seconds: 1.5
      })
    })
  })

  describe('Performance Optimization Manager', () => {
    let performanceManager

    beforeEach(() => {
      performanceManager = new PerformanceOptimizationManager()
    })

    it('should queue executions when at capacity', async () => {
      const executionRequest = {
        executionId: 'test-exec-123',
        nodes: [{ type: 'problem' }, { type: 'optimizer' }],
        connections: [],
        parameters: {}
      }

      const queueResult = await performanceManager.queueExecution(executionRequest)
      
      expect(queueResult.queued).to.be.true
      expect(queueResult.position).to.equal(1)
      expect(performanceManager.executionQueue).to.have.length(1)
    })

    it('should calculate execution priority correctly', () => {
      const highPriorityRequest = {
        resourceProfile: 'small',
        authToken: 'valid-token',
        nodes: [{ type: 'problem' }]
      }

      const lowPriorityRequest = {
        resourceProfile: 'large',
        authToken: null,
        nodes: Array(10).fill({ type: 'problem' })
      }

      const highPriority = performanceManager.calculatePriority(highPriorityRequest)
      const lowPriority = performanceManager.calculatePriority(lowPriorityRequest)

      expect(highPriority).to.be.greaterThan(lowPriority)
    })

    it('should manage cache operations', () => {
      const key = 'test-key'
      const value = { test: 'data' }

      // Add to cache
      performanceManager.addToCache(performanceManager.scriptCache, key, value)
      
      // Retrieve from cache
      const retrieved = performanceManager.getFromCache(performanceManager.scriptCache, key)
      expect(retrieved).to.deep.equal(value)

      // Clear caches
      performanceManager.clearCaches()
      const afterClear = performanceManager.getFromCache(performanceManager.scriptCache, key)
      expect(afterClear).to.be.null
    })
  })

  describe('Integration Tests', () => {
    it('should execute complete workflow end-to-end', async function() {
      this.timeout(10000) // Increase timeout for integration test

      const nodes = [
        {
          id: 'problem-1',
          type: 'problem',
          data: { repository: 'test-user/test-problem', parameters: {} }
        },
        {
          id: 'optimizer-1',
          type: 'optimizer',
          data: { repository: 'test-user/test-optimizer', parameters: {} }
        }
      ]

      const connections = [
        { source: 'problem-1', target: 'optimizer-1' }
      ]

      // Mock successful job execution
      workflowService.waitForJobCompletionAndRetrieveLogsEnhanced = sinon.stub().resolves({
        success: true,
        best_value: 42,
        runtime_seconds: 1.5
      })

      const result = await workflowService.executeWorkflow(
        'integration-test-123',
        nodes,
        connections,
        {},
        mockWebSocket,
        'test-token'
      )

      expect(result.success).to.be.true
      expect(result.executionId).to.equal('integration-test-123')
    })

    it('should handle execution errors gracefully', async () => {
      const nodes = [
        {
          id: 'problem-1',
          type: 'problem',
          data: { repository: 'invalid/repo' }
        }
      ]

      // Mock job creation failure
      workflowService.createSecureWorkflowJob = sinon.stub().rejects(new Error('Job creation failed'))

      const result = await workflowService.executeWorkflow(
        'error-test-123',
        nodes,
        [],
        {},
        mockWebSocket
      )

      expect(result.success).to.be.false
      expect(result.error).to.include('Job creation failed')
      expect(result).to.have.property('recommendation')
    })
  })

  describe('Performance Tests', () => {
    it('should handle multiple concurrent executions', async function() {
      this.timeout(15000)

      const promises = []
      for (let i = 0; i < 5; i++) {
        const promise = workflowService.executeWorkflow(
          `perf-test-${i}`,
          [{ id: 'problem-1', type: 'problem', data: { repository: 'test/repo' } }],
          [],
          {},
          mockWebSocket
        )
        promises.push(promise)
      }

      const results = await Promise.allSettled(promises)
      
      // Some should be queued due to resource constraints
      const queuedResults = results.filter(r => r.value?.queued === true)
      expect(queuedResults.length).to.be.greaterThan(0)
    })

    it('should maintain performance metrics', () => {
      const metrics = workflowService.getExecutionStatistics()
      
      expect(metrics).to.have.property('performanceMetrics')
      expect(metrics).to.have.property('queueStatus')
      expect(metrics).to.have.property('resourceUtilization')
      expect(metrics.performanceMetrics).to.have.property('cacheHitRate')
    })
  })
})

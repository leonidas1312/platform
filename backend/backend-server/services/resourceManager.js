/**
 * Resource Manager for Workflow Execution
 * 
 * Manages resource allocation and optimization for the DigitalOcean Kubernetes cluster
 * Current constraints: 2 vCPUs, 4GB memory, 140GB disk
 */

class ResourceManager {
  constructor() {
    // Current infrastructure constraints (DigitalOcean)
    this.clusterResources = {
      totalCPU: 2000, // 2 vCPUs in millicores
      totalMemory: 4096, // 4GB in MB
      totalDisk: 140 * 1024, // 140GB in MB
      reservedCPU: 500, // Reserve 0.5 CPU for system
      reservedMemory: 1024, // Reserve 1GB for system
      reservedDisk: 20 * 1024 // Reserve 20GB for system
    }
    
    // Available resources for workloads
    this.availableResources = {
      cpu: this.clusterResources.totalCPU - this.clusterResources.reservedCPU,
      memory: this.clusterResources.totalMemory - this.clusterResources.reservedMemory,
      disk: this.clusterResources.totalDisk - this.clusterResources.reservedDisk
    }
    
    // Resource profiles for different workflow types
    this.resourceProfiles = {
      small: {
        cpu: '250m',
        memory: '512Mi',
        cpuLimit: '500m',
        memoryLimit: '1Gi'
      },
      medium: {
        cpu: '500m',
        memory: '1Gi',
        cpuLimit: '1000m',
        memoryLimit: '2Gi'
      },
      large: {
        cpu: '750m',
        memory: '1.5Gi',
        cpuLimit: '1500m',
        memoryLimit: '3Gi'
      }
    }
    
    // Active resource allocations
    this.activeAllocations = new Map()
    
    console.log(`🔧 ResourceManager initialized`)
    console.log(`📊 Available resources: CPU=${this.availableResources.cpu}m, Memory=${this.availableResources.memory}MB`)
  }

  /**
   * Determine optimal resource profile for a workflow
   */
  determineResourceProfile(workflowConfig) {
    const { dataset, problem, optimizer } = workflowConfig
    
    // Scoring factors
    let complexityScore = 0
    
    // Dataset size factor
    if (dataset?.metadata?.file_size) {
      const sizeInMB = dataset.metadata.file_size / (1024 * 1024)
      if (sizeInMB > 100) complexityScore += 2
      else if (sizeInMB > 10) complexityScore += 1
    }
    
    // Problem complexity factor
    if (problem?.data?.parameters) {
      const paramCount = Object.keys(problem.data.parameters).length
      if (paramCount > 10) complexityScore += 2
      else if (paramCount > 5) complexityScore += 1
    }
    
    // Optimizer complexity factor
    if (optimizer?.data?.parameters) {
      const paramCount = Object.keys(optimizer.data.parameters).length
      if (paramCount > 10) complexityScore += 2
      else if (paramCount > 5) complexityScore += 1
    }
    
    // Algorithm type heuristics
    const optimizerName = optimizer?.data?.name?.toLowerCase() || ''
    if (optimizerName.includes('genetic') || optimizerName.includes('evolutionary')) {
      complexityScore += 2
    } else if (optimizerName.includes('simulated') || optimizerName.includes('tabu')) {
      complexityScore += 1
    }
    
    // Determine profile based on score
    if (complexityScore >= 5) {
      return 'large'
    } else if (complexityScore >= 3) {
      return 'medium'
    } else {
      return 'small'
    }
  }

  /**
   * Get resource specification for a profile
   */
  getResourceSpec(profile) {
    const spec = this.resourceProfiles[profile]
    if (!spec) {
      console.warn(`⚠️ Unknown resource profile: ${profile}, using small`)
      return this.resourceProfiles.small
    }
    return spec
  }

  /**
   * Check if resources are available for allocation
   */
  canAllocateResources(profile) {
    const spec = this.getResourceSpec(profile)
    const requestedCPU = this.parseCPUValue(spec.cpu)
    const requestedMemory = this.parseMemoryValue(spec.memory)
    
    // Calculate currently allocated resources
    let allocatedCPU = 0
    let allocatedMemory = 0
    
    for (const allocation of this.activeAllocations.values()) {
      allocatedCPU += this.parseCPUValue(allocation.cpu)
      allocatedMemory += this.parseMemoryValue(allocation.memory)
    }
    
    const availableCPU = this.availableResources.cpu - allocatedCPU
    const availableMemory = this.availableResources.memory - allocatedMemory
    
    console.log(`🔍 Resource check: Requested CPU=${requestedCPU}m, Available=${availableCPU}m`)
    console.log(`🔍 Resource check: Requested Memory=${requestedMemory}MB, Available=${availableMemory}MB`)
    
    return requestedCPU <= availableCPU && requestedMemory <= availableMemory
  }

  /**
   * Allocate resources for an execution
   */
  allocateResources(executionId, profile) {
    if (!this.canAllocateResources(profile)) {
      throw new Error(`Insufficient resources for profile: ${profile}`)
    }
    
    const spec = this.getResourceSpec(profile)
    this.activeAllocations.set(executionId, {
      profile,
      cpu: spec.cpu,
      memory: spec.memory,
      allocatedAt: new Date()
    })
    
    console.log(`✅ Resources allocated for ${executionId}: ${profile} profile`)
    return spec
  }

  /**
   * Release resources for an execution
   */
  releaseResources(executionId) {
    const allocation = this.activeAllocations.get(executionId)
    if (allocation) {
      this.activeAllocations.delete(executionId)
      console.log(`🔄 Resources released for ${executionId}: ${allocation.profile} profile`)
    }
  }

  /**
   * Get current resource utilization
   */
  getResourceUtilization() {
    let allocatedCPU = 0
    let allocatedMemory = 0
    
    for (const allocation of this.activeAllocations.values()) {
      allocatedCPU += this.parseCPUValue(allocation.cpu)
      allocatedMemory += this.parseMemoryValue(allocation.memory)
    }
    
    return {
      cpu: {
        allocated: allocatedCPU,
        available: this.availableResources.cpu,
        utilization: (allocatedCPU / this.availableResources.cpu) * 100
      },
      memory: {
        allocated: allocatedMemory,
        available: this.availableResources.memory,
        utilization: (allocatedMemory / this.availableResources.memory) * 100
      },
      activeExecutions: this.activeAllocations.size
    }
  }

  /**
   * Parse CPU value to millicores
   */
  parseCPUValue(cpuStr) {
    if (cpuStr.endsWith('m')) {
      return parseInt(cpuStr.slice(0, -1))
    } else {
      return parseFloat(cpuStr) * 1000
    }
  }

  /**
   * Parse memory value to MB
   */
  parseMemoryValue(memoryStr) {
    if (memoryStr.endsWith('Mi')) {
      return parseInt(memoryStr.slice(0, -2))
    } else if (memoryStr.endsWith('Gi')) {
      return parseInt(memoryStr.slice(0, -2)) * 1024
    } else if (memoryStr.endsWith('M')) {
      return parseInt(memoryStr.slice(0, -1))
    } else if (memoryStr.endsWith('G')) {
      return parseInt(memoryStr.slice(0, -1)) * 1024
    } else {
      return parseInt(memoryStr) / (1024 * 1024) // Assume bytes
    }
  }

  /**
   * Get security context for containers
   */
  getSecurityContext() {
    return {
      runAsNonRoot: true,
      runAsUser: 1001,
      runAsGroup: 1001,
      allowPrivilegeEscalation: false,
      readOnlyRootFilesystem: false, // Qubots needs to write cache files
      capabilities: {
        drop: ['ALL']
      },
      seccompProfile: {
        type: 'RuntimeDefault'
      }
    }
  }

  /**
   * Get network policies for isolation
   */
  getNetworkPolicy() {
    return {
      podSelector: {
        matchLabels: {
          'app': 'workflow-execution'
        }
      },
      policyTypes: ['Ingress', 'Egress'],
      egress: [
        {
          // Allow DNS resolution
          ports: [
            { protocol: 'UDP', port: 53 },
            { protocol: 'TCP', port: 53 }
          ]
        },
        {
          // Allow HTTPS to Rastion platform
          ports: [{ protocol: 'TCP', port: 443 }],
          to: [{}] // Allow to any destination for now
        },
        {
          // Allow HTTP for Git operations
          ports: [{ protocol: 'TCP', port: 80 }],
          to: [{}]
        }
      ],
      ingress: [] // No ingress allowed
    }
  }

  /**
   * Clean up stale allocations
   */
  cleanupStaleAllocations(maxAgeMinutes = 30) {
    const now = new Date()
    const staleAllocations = []
    
    for (const [executionId, allocation] of this.activeAllocations) {
      const ageMinutes = (now - allocation.allocatedAt) / (1000 * 60)
      if (ageMinutes > maxAgeMinutes) {
        staleAllocations.push(executionId)
      }
    }
    
    for (const executionId of staleAllocations) {
      this.releaseResources(executionId)
      console.log(`🧹 Cleaned up stale allocation: ${executionId}`)
    }
    
    return staleAllocations.length
  }
}

module.exports = ResourceManager

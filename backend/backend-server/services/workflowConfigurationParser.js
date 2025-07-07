/**
 * Workflow Configuration Parser
 * 
 * Parses ReactFlow nodes and connections into a structured workflow configuration
 * that can be used by the enhanced code generator.
 */

class WorkflowConfigurationParser {
  constructor() {
    this.nodeTypeHandlers = {
      'dataset': this.parseDatasetNode.bind(this),
      'problem': this.parseProblemNode.bind(this),
      'optimizer': this.parseOptimizerNode.bind(this)
    }
  }

  /**
   * Parse workflow nodes and connections into execution configuration
   */
  parseWorkflow(nodes, connections) {
    console.log(`🔧 Parsing workflow with ${nodes.length} nodes and ${connections.length} connections`)
    
    // Validate input
    if (!nodes || !Array.isArray(nodes) || nodes.length === 0) {
      throw new Error("Workflow must contain at least one node")
    }

    // Group nodes by type
    const nodesByType = this.groupNodesByType(nodes)
    
    // Build execution graph
    const executionGraph = this.buildExecutionGraph(nodes, connections)
    
    // Parse individual nodes
    const config = {
      dataset: this.parseDatasetNodes(nodesByType.dataset || []),
      problem: this.parseProblemNodes(nodesByType.problem || [], executionGraph),
      optimizer: this.parseOptimizerNodes(nodesByType.optimizer || [], executionGraph),
      executionOrder: this.determineExecutionOrder(executionGraph)
    }

    // Validate configuration
    this.validateWorkflowConfiguration(config)
    
    console.log(`🔧 Parsed workflow configuration:`, JSON.stringify(config, null, 2))
    return config
  }

  /**
   * Group nodes by their type
   */
  groupNodesByType(nodes) {
    const grouped = {}
    
    for (const node of nodes) {
      const type = node.type
      if (!grouped[type]) {
        grouped[type] = []
      }
      grouped[type].push(node)
    }
    
    return grouped
  }

  /**
   * Build execution graph from connections
   */
  buildExecutionGraph(nodes, connections) {
    const graph = new Map()

    // Initialize graph with all nodes
    for (const node of nodes) {
      graph.set(node.id, {
        node,
        inputs: [],
        outputs: [],
        connections: [] // Store connection details including dataset parameters
      })
    }

    // Add connections
    for (const connection of connections) {
      const sourceNode = graph.get(connection.source)
      const targetNode = graph.get(connection.target)

      if (sourceNode && targetNode) {
        sourceNode.outputs.push(connection.target)
        targetNode.inputs.push(connection.source)

        // Store the full connection details for dataset parameter mapping
        targetNode.connections.push({
          sourceId: connection.source,
          targetId: connection.target,
          datasetParameter: connection.datasetParameter, // This will contain the selected parameter
          sourceType: sourceNode.node.type,
          targetType: targetNode.node.type
        })
      }
    }

    return graph
  }

  /**
   * Parse dataset nodes
   */
  parseDatasetNodes(datasetNodes) {
    if (datasetNodes.length === 0) {
      return null
    }
    
    if (datasetNodes.length > 1) {
      console.warn(`⚠️ Multiple dataset nodes found, using the first one`)
    }
    
    return this.parseDatasetNode(datasetNodes[0])
  }

  /**
   * Parse a single dataset node
   */
  parseDatasetNode(node) {
    const data = node.data || {}
    
    return {
      id: node.id,
      type: 'dataset',
      datasetId: data.datasetId || data.dataset_id,
      name: data.name,
      description: data.description,
      metadata: {
        original_filename: data.original_filename,
        format_type: data.format_type,
        file_size: data.file_size,
        username: data.username
      }
    }
  }

  /**
   * Parse problem nodes
   */
  parseProblemNodes(problemNodes, executionGraph) {
    if (problemNodes.length === 0) {
      throw new Error("Workflow must contain at least one problem node")
    }
    
    if (problemNodes.length > 1) {
      console.warn(`⚠️ Multiple problem nodes found, using the first one`)
    }
    
    return this.parseProblemNode(problemNodes[0], executionGraph)
  }

  /**
   * Parse a single problem node
   */
  parseProblemNode(node, executionGraph) {
    const data = node.data || {}
    const graphNode = executionGraph.get(node.id)

    // Check if this problem node has a dataset input and get parameter mapping
    const datasetConnection = graphNode?.connections.find(conn =>
      conn.sourceType === 'dataset' && conn.targetType === 'problem'
    )

    const hasDatasetInput = !!datasetConnection
    const datasetParameter = datasetConnection?.datasetParameter || null

    return {
      id: node.id,
      type: 'problem',
      data: {
        repository: data.repository || `${data.username}/${data.name}`,
        repo_id: data.repo_id,
        parameters: data.parameters || {},
        name: data.name,
        username: data.username,
        description: data.description,
        version: data.version,
        tags: data.tags
      },
      hasDatasetInput,
      datasetParameter, // Include the selected parameter for dataset connection
      metadata: {
        position: node.position,
        selected: node.selected
      }
    }
  }

  /**
   * Parse optimizer nodes
   */
  parseOptimizerNodes(optimizerNodes, executionGraph) {
    if (optimizerNodes.length === 0) {
      throw new Error("Workflow must contain at least one optimizer node")
    }
    
    if (optimizerNodes.length > 1) {
      console.warn(`⚠️ Multiple optimizer nodes found, using the first one`)
    }
    
    return this.parseOptimizerNode(optimizerNodes[0], executionGraph)
  }

  /**
   * Parse a single optimizer node
   */
  parseOptimizerNode(node, executionGraph) {
    const data = node.data || {}
    const graphNode = executionGraph.get(node.id)
    
    // Check if this optimizer node has a problem input
    const hasProblemInput = graphNode?.inputs.some(inputId => {
      const inputNode = executionGraph.get(inputId)?.node
      return inputNode?.type === 'problem'
    })
    
    return {
      id: node.id,
      type: 'optimizer',
      data: {
        repository: data.repository || `${data.username}/${data.name}`,
        repo_id: data.repo_id,
        parameters: data.parameters || {},
        name: data.name,
        username: data.username,
        description: data.description,
        version: data.version,
        tags: data.tags
      },
      hasProblemInput,
      metadata: {
        position: node.position,
        selected: node.selected
      }
    }
  }

  /**
   * Determine execution order based on graph topology
   */
  determineExecutionOrder(executionGraph) {
    const order = []
    const visited = new Set()
    const visiting = new Set()
    
    // Topological sort to determine execution order
    const visit = (nodeId) => {
      if (visiting.has(nodeId)) {
        throw new Error(`Circular dependency detected involving node: ${nodeId}`)
      }
      
      if (visited.has(nodeId)) {
        return
      }
      
      visiting.add(nodeId)
      
      const graphNode = executionGraph.get(nodeId)
      if (graphNode) {
        // Visit all input nodes first
        for (const inputId of graphNode.inputs) {
          visit(inputId)
        }
        
        order.push({
          id: nodeId,
          type: graphNode.node.type,
          name: graphNode.node.data?.name || nodeId
        })
      }
      
      visiting.delete(nodeId)
      visited.add(nodeId)
    }
    
    // Start with nodes that have no inputs (root nodes)
    for (const [nodeId, graphNode] of executionGraph) {
      if (graphNode.inputs.length === 0) {
        visit(nodeId)
      }
    }
    
    // Visit any remaining nodes (in case of disconnected components)
    for (const [nodeId] of executionGraph) {
      if (!visited.has(nodeId)) {
        visit(nodeId)
      }
    }
    
    return order
  }

  /**
   * Validate the parsed workflow configuration
   */
  validateWorkflowConfiguration(config) {
    // Check required components
    if (!config.problem) {
      throw new Error("Workflow must contain a problem node")
    }
    
    if (!config.optimizer) {
      throw new Error("Workflow must contain an optimizer node")
    }
    
    // Validate problem configuration
    if (!config.problem.data?.repository && !config.problem.data?.repo_id) {
      throw new Error("Problem node must specify a repository")
    }
    
    // Validate optimizer configuration
    if (!config.optimizer.data?.repository && !config.optimizer.data?.repo_id) {
      throw new Error("Optimizer node must specify a repository")
    }
    
    // Validate execution order
    if (!config.executionOrder || config.executionOrder.length === 0) {
      throw new Error("Could not determine execution order")
    }
    
    console.log(`✅ Workflow configuration validation passed`)
  }

  /**
   * Get workflow summary for logging
   */
  getWorkflowSummary(config) {
    const summary = {
      hasDataset: !!config.dataset,
      problemRepo: config.problem?.data?.repository,
      optimizerRepo: config.optimizer?.data?.repository,
      executionSteps: config.executionOrder?.length || 0
    }
    
    return summary
  }
}

module.exports = WorkflowConfigurationParser

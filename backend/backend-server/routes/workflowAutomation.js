const express = require("express")
const { auth } = require("../middleware/auth")
const GiteaService = require("../services/giteaService")
const { knex } = require("../config/database")
const WorkflowExecutionService = require("../services/workflowExecutionService")

const router = express.Router()

// Create workflow execution service instance
const workflowExecutionService = new WorkflowExecutionService()

/**
 * GET /api/workflow-automation/user-datasets
 * Get user's datasets for workflow automation
 */
router.get("/user-datasets", auth, async (req, res) => {
  try {
    const user_id = req.session?.user_data?.user?.login || req.headers['x-user-id']
    
    if (!user_id) {
      return res.status(401).json({ 
        success: false, 
        message: "Authentication required" 
      })
    }

    const { format_type, limit = 50 } = req.query

    let query = knex('datasets').select([
      'id', 'name', 'description', 'format_type', 'metadata',
      'file_size', 'original_filename', 'is_public', 'created_at'
    ]).where('user_id', user_id)

    if (format_type) {
      query = query.where('format_type', format_type)
    }

    query = query.orderBy('created_at', 'desc').limit(parseInt(limit))

    const datasets = await query

    res.json({
      success: true,
      datasets,
      total: datasets.length
    })

  } catch (error) {
    console.error("Error fetching user datasets:", error)
    res.status(500).json({
      success: false,
      message: "Internal server error"
    })
  }
})

/**
 * GET /api/workflow-automation/user-problems
 * Get user's problem repositories for workflow automation
 */
router.get("/user-problems", auth, async (req, res) => {
  try {
    const token = req.session?.user_data?.token

    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: "Authentication required" 
      })
    }

    const { limit = 50 } = req.query

    // Get user info from Gitea
    const userRes = await GiteaService.getUserProfile(token)
    
    if (!userRes.ok) {
      return res.status(userRes.status).json({ 
        success: false, 
        message: "Failed to fetch user info" 
      })
    }

    const user = await userRes.json()

    // Get user's repositories
    const reposRes = await GiteaService.getUserRepositories(token, user.login)
    
    if (!reposRes.ok) {
      return res.status(reposRes.status).json({ 
        success: false, 
        message: "Failed to fetch repositories" 
      })
    }

    const repos = await reposRes.json()

    // Filter for problem repositories and get their config
    const problems = []
    
    for (const repo of repos.slice(0, parseInt(limit))) {
      try {
        // Try to get config.json to determine if it's a problem
        const configRes = await GiteaService.getFileContent(
          token,
          user.login,
          repo.name,
          'config.json',
          'main'
        )

        if (configRes.ok) {
          const configData = await configRes.json()
          const config = JSON.parse(Buffer.from(configData.content, 'base64').toString())
          
          if (config.qubot_type === 'problem') {
            problems.push({
              id: repo.id.toString(),
              name: repo.name,
              username: user.login,
              description: repo.description || '',
              repository: `${user.login}/${repo.name}`,
              model_type: 'problem',
              tags: repo.topics || [],
              metadata: {
                stars: repo.stars_count || 0,
                forks: repo.forks_count || 0,
                size: repo.size || 0,
                problem_type: config.metadata?.problem_type || 'unknown',
                difficulty: config.metadata?.difficulty || 'unknown'
              },
              last_updated: repo.updated_at
            })
          }
        }
      } catch (error) {
        // Skip repositories without valid config
        continue
      }
    }

    res.json({
      success: true,
      problems,
      total: problems.length
    })

  } catch (error) {
    console.error("Error fetching user problems:", error)
    res.status(500).json({
      success: false,
      message: "Internal server error"
    })
  }
})

/**
 * GET /api/workflow-automation/user-optimizers
 * Get user's optimizer repositories for workflow automation
 */
router.get("/user-optimizers", auth, async (req, res) => {
  try {
    const token = req.session?.user_data?.token

    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: "Authentication required" 
      })
    }

    const { limit = 50 } = req.query

    // Get user info from Gitea
    const userRes = await GiteaService.getUserProfile(token)
    
    if (!userRes.ok) {
      return res.status(userRes.status).json({ 
        success: false, 
        message: "Failed to fetch user info" 
      })
    }

    const user = await userRes.json()

    // Get user's repositories
    const reposRes = await GiteaService.getUserRepositories(token, user.login)
    
    if (!reposRes.ok) {
      return res.status(reposRes.status).json({ 
        success: false, 
        message: "Failed to fetch repositories" 
      })
    }

    const repos = await reposRes.json()

    // Filter for optimizer repositories and get their config
    const optimizers = []
    
    for (const repo of repos.slice(0, parseInt(limit))) {
      try {
        // Try to get config.json to determine if it's an optimizer
        const configRes = await GiteaService.getFileContent(
          token,
          user.login,
          repo.name,
          'config.json',
          'main'
        )

        if (configRes.ok) {
          const configData = await configRes.json()
          const config = JSON.parse(Buffer.from(configData.content, 'base64').toString())
          
          if (config.qubot_type === 'optimizer') {
            optimizers.push({
              id: repo.id.toString(),
              name: repo.name,
              username: user.login,
              description: repo.description || '',
              repository: `${user.login}/${repo.name}`,
              model_type: 'optimizer',
              tags: repo.topics || [],
              metadata: {
                stars: repo.stars_count || 0,
                forks: repo.forks_count || 0,
                size: repo.size || 0,
                optimizer_type: config.metadata?.optimizer_type || 'unknown',
                algorithm_family: config.metadata?.algorithm_family || 'unknown'
              },
              last_updated: repo.updated_at
            })
          }
        }
      } catch (error) {
        // Skip repositories without valid config
        continue
      }
    }

    res.json({
      success: true,
      optimizers,
      total: optimizers.length
    })

  } catch (error) {
    console.error("Error fetching user optimizers:", error)
    res.status(500).json({
      success: false,
      message: "Internal server error"
    })
  }
})

/**
 * GET /api/workflow-automation/user-content
 * Get all user's content (datasets, problems, optimizers) in one call
 */
router.get("/user-content", auth, async (req, res) => {
  try {
    const token = req.session?.user_data?.token
    const user_id = req.session?.user_data?.user?.login || req.headers['x-user-id']

    if (!token || !user_id) {
      return res.status(401).json({ 
        success: false, 
        message: "Authentication required" 
      })
    }

    // Fetch datasets from database
    const datasets = await knex('datasets').select([
      'id', 'name', 'description', 'format_type', 'metadata',
      'file_size', 'original_filename', 'is_public', 'created_at', 'user_id'
    ]).where('user_id', user_id).orderBy('created_at', 'desc').limit(20)

    // Get user info from Gitea
    const userRes = await GiteaService.getUserProfile(token)
    
    if (!userRes.ok) {
      return res.status(userRes.status).json({ 
        success: false, 
        message: "Failed to fetch user info" 
      })
    }

    const user = await userRes.json()

    // Add username to datasets
    const datasetsWithUsername = datasets.map(dataset => ({
      ...dataset,
      username: user.login
    }))

    // Get user's repositories
    const reposRes = await GiteaService.getUserRepositories(token, user.login)

    if (!reposRes.ok) {
      return res.status(reposRes.status).json({
        success: false,
        message: "Failed to fetch repositories"
      })
    }

    const repos = await reposRes.json()

    // Separate problems and optimizers
    const problems = []
    const optimizers = []
    
    for (const repo of repos.slice(0, 30)) {
      try {
        // Try to get config.json to determine repository type
        const configRes = await GiteaService.getFileContent(
          token,
          user.login,
          repo.name,
          'config.json',
          'main'
        )

        if (configRes.ok) {
          const configData = await configRes.json()
          const config = JSON.parse(Buffer.from(configData.content, 'base64').toString())
          
          const repoData = {
            id: repo.id.toString(),
            name: repo.name,
            username: user.login,
            description: repo.description || '',
            repository: `${user.login}/${repo.name}`,
            model_type: config.qubot_type,
            tags: repo.topics || [],
            metadata: {
              stars: repo.stars_count || 0,
              forks: repo.forks_count || 0,
              size: repo.size || 0
            },
            last_updated: repo.updated_at
          }
          
          if (config.qubot_type === 'problem') {
            repoData.metadata.problem_type = config.metadata?.problem_type || 'unknown'
            repoData.metadata.difficulty = config.metadata?.difficulty || 'unknown'
            problems.push(repoData)
          } else if (config.qubot_type === 'optimizer') {
            repoData.metadata.optimizer_type = config.metadata?.optimizer_type || 'unknown'
            repoData.metadata.algorithm_family = config.metadata?.algorithm_family || 'unknown'
            optimizers.push(repoData)
          }
        }
      } catch (error) {
        // Skip repositories without valid config
        continue
      }
    }

    res.json({
      success: true,
      datasets: datasetsWithUsername,
      problems,
      optimizers,
      totals: {
        datasets: datasetsWithUsername.length,
        problems: problems.length,
        optimizers: optimizers.length
      }
    })

  } catch (error) {
    console.error("Error fetching user content:", error)
    res.status(500).json({
      success: false,
      message: "Internal server error"
    })
  }
})

/**
 * GET /api/workflow-automation/user-models
 * Get user's qubots models using the same logic as playground
 */
router.get("/user-models", auth, async (req, res) => {
  try {
    const token = req.session?.user_data?.token
    const user_id = req.session?.user_data?.user?.login || req.headers['x-user-id']

    if (!token || !user_id) {
      return res.status(401).json({
        success: false,
        message: "Authentication required"
      })
    }

    const username = req.query.username || user_id
    const GiteaService = require("../services/giteaService")

    // Fetch user's repositories from Gitea
    const reposResponse = await GiteaService.getUserRepositories(token, username)

    if (!reposResponse.ok) {
      return res.status(reposResponse.status).json({
        success: false,
        message: "Failed to fetch repositories"
      })
    }

    const repositories = await reposResponse.json()

    // Filter repositories that have qubots config
    const problems = []
    const optimizers = []

    for (const repo of repositories) {
      try {
        // Check if repository has config.json indicating it's a qubots model
        const configResponse = await GiteaService.getFileContent(
          token,
          username,
          repo.name,
          "config.json"
        )

        if (configResponse.ok) {
          const configData = await configResponse.json()
          const config = JSON.parse(Buffer.from(configData.content, 'base64').toString())

          const modelInfo = {
            id: `${username}/${repo.name}`,
            name: repo.name,
            username: username,
            description: repo.description || config.metadata?.description || "",
            repository: `${username}/${repo.name}`,
            model_type: config.type,
            repository_url: repo.html_url,
            last_updated: repo.updated_at,
            tags: config.metadata?.tags || [],
            metadata: {
              stars: repo.stars_count || 0,
              forks: repo.forks_count || 0,
              size: repo.size || 0,
              ...(config.type === 'problem' && {
                problem_type: config.metadata?.problem_type || 'unknown',
                difficulty: config.metadata?.difficulty || 'unknown'
              }),
              ...(config.type === 'optimizer' && {
                optimizer_type: config.metadata?.optimizer_type || 'unknown',
                algorithm_family: config.metadata?.algorithm_family || 'unknown'
              })
            }
          }

          if (config.type === 'problem') {
            problems.push(modelInfo)
          } else if (config.type === 'optimizer') {
            optimizers.push(modelInfo)
          }
        }
      } catch (error) {
        // Skip repositories without valid qubots config
        continue
      }
    }

    res.json({
      success: true,
      problems,
      optimizers,
      total: problems.length + optimizers.length
    })

  } catch (error) {
    console.error("Error fetching user models:", error)
    res.status(500).json({
      success: false,
      message: "Internal server error"
    })
  }
})

/**
 * POST /api/workflow-automation/execute
 * Execute a workflow
 */
router.post("/execute", auth, async (req, res) => {
  try {
    const token = req.session?.user_data?.token
    const user_id = req.session?.user_data?.user?.login || req.headers['x-user-id']

    if (!token || !user_id) {
      return res.status(401).json({
        success: false,
        message: "Authentication required"
      })
    }

    const { nodes, connections, parameters = {} } = req.body

    if (!nodes || !Array.isArray(nodes) || nodes.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Workflow must contain at least one node"
      })
    }

    // Validate workflow structure
    const validation = validateWorkflow(nodes, connections)
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: "Invalid workflow",
        errors: validation.errors
      })
    }

    // Generate execution ID
    const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Store execution in database (you might want to create an executions table)
    // For now, we'll simulate the execution

    // Start workflow execution asynchronously
    executeWorkflowAsync(executionId, nodes, connections, parameters, token, user_id)

    res.json({
      success: true,
      executionId,
      message: "Workflow execution started"
    })

  } catch (error) {
    console.error("Error executing workflow:", error)
    res.status(500).json({
      success: false,
      message: "Internal server error"
    })
  }
})

/**
 * GET /api/workflow-automation/execution/:executionId
 * Get execution status and results
 */
router.get("/execution/:executionId", auth, async (req, res) => {
  try {
    const { executionId } = req.params

    // In a real implementation, you would fetch this from a database
    // For now, we'll return a mock response
    const mockResult = {
      executionId,
      status: 'completed',
      progress: 100,
      logs: [
        {
          id: '1',
          timestamp: new Date(),
          level: 'info',
          message: 'Starting workflow execution...',
          source: 'system'
        },
        {
          id: '2',
          timestamp: new Date(),
          level: 'info',
          message: 'Processing dataset node...',
          source: 'dataset'
        },
        {
          id: '3',
          timestamp: new Date(),
          level: 'info',
          message: 'Executing problem formulation...',
          source: 'problem'
        },
        {
          id: '4',
          timestamp: new Date(),
          level: 'info',
          message: 'Running optimizer...',
          source: 'optimizer'
        },
        {
          id: '5',
          timestamp: new Date(),
          level: 'info',
          message: 'Workflow execution completed successfully.',
          source: 'system'
        }
      ],
      metrics: {
        totalSteps: 3,
        completedSteps: 3,
        executionTime: 45.2
      },
      results: [
        {
          nodeId: 'optimizer-123',
          output: {
            best_solution: [1, 0, 1, 0, 1],
            best_fitness: 42.5,
            iterations: 150,
            convergence_time: 45.2
          }
        }
      ]
    }

    res.json(mockResult)

  } catch (error) {
    console.error("Error fetching execution status:", error)
    res.status(500).json({
      success: false,
      message: "Internal server error"
    })
  }
})

/**
 * POST /api/workflow-automation/execution/:executionId/stop
 * Stop a running execution
 */
router.post("/execution/:executionId/stop", auth, async (req, res) => {
  try {
    const { executionId } = req.params

    // In a real implementation, you would stop the actual execution
    // For now, we'll just return success

    res.json({
      success: true,
      message: "Execution stopped successfully"
    })

  } catch (error) {
    console.error("Error stopping execution:", error)
    res.status(500).json({
      success: false,
      message: "Internal server error"
    })
  }
})

/**
 * POST /api/workflow-automation/validate
 * Validate a workflow before execution
 */
router.post("/validate", auth, async (req, res) => {
  try {
    const { nodes, connections } = req.body

    const validation = validateWorkflow(nodes, connections)

    res.json({
      success: true,
      isValid: validation.isValid,
      errors: validation.errors,
      warnings: validation.warnings
    })

  } catch (error) {
    console.error("Error validating workflow:", error)
    res.status(500).json({
      success: false,
      message: "Internal server error"
    })
  }
})

/**
 * GET /api/workflow-automation/config/:username/:repository
 * Get config.json data for a specific repository
 */
router.get("/config/:username/:repository", auth, async (req, res) => {
  try {
    const token = req.session?.user_data?.token
    const { username, repository } = req.params

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication required"
      })
    }

    const GiteaService = require("../services/giteaService")

    // Fetch config.json from the repository
    const configResponse = await GiteaService.getFileContent(
      token,
      username,
      repository,
      'config.json'
    )

    if (!configResponse.ok) {
      return res.status(404).json({
        success: false,
        message: "Config file not found"
      })
    }

    const configData = await configResponse.json()
    const config = JSON.parse(Buffer.from(configData.content, 'base64').toString())

    res.json({
      success: true,
      config
    })

  } catch (error) {
    console.error("Error fetching config:", error)
    res.status(500).json({
      success: false,
      message: "Internal server error"
    })
  }
})

// Helper functions
function validateWorkflow(nodes, connections) {
  const errors = []
  const warnings = []

  // Check for required node types
  const hasDataset = nodes.some(node => node.type === 'dataset')
  const hasProblem = nodes.some(node => node.type === 'problem')
  const hasOptimizer = nodes.some(node => node.type === 'optimizer')

  if (!hasDataset) {
    errors.push("Workflow must contain at least one dataset node")
  }
  if (!hasProblem) {
    errors.push("Workflow must contain at least one problem node")
  }
  if (!hasOptimizer) {
    errors.push("Workflow must contain at least one optimizer node")
  }

  // Check connections
  if (connections && connections.length > 0) {
    for (const connection of connections) {
      const sourceNode = nodes.find(n => n.id === connection.source)
      const targetNode = nodes.find(n => n.id === connection.target)

      if (!sourceNode) {
        errors.push(`Connection source node ${connection.source} not found`)
      }
      if (!targetNode) {
        errors.push(`Connection target node ${connection.target} not found`)
      }

      // Validate connection types
      if (sourceNode && targetNode) {
        if (sourceNode.type === 'optimizer') {
          errors.push("Optimizer nodes cannot be source nodes")
        }
        if (targetNode.type === 'dataset') {
          errors.push("Dataset nodes cannot be target nodes")
        }
      }
    }
  } else {
    warnings.push("No connections defined between nodes")
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * POST /api/workflow-automation/workflows
 * Save a new workflow
 */
router.post("/workflows", auth, async (req, res) => {
  try {
    const user_id = req.session?.user_data?.user?.login || req.headers['x-user-id']

    if (!user_id) {
      return res.status(401).json({
        success: false,
        message: "Authentication required"
      })
    }

    const {
      name,
      description = '',
      nodes = [],
      connections = [],
      tags = [],
      isPublic = false
    } = req.body

    if (!name || name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Workflow name is required"
      })
    }

    if (!Array.isArray(nodes) || nodes.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Workflow must contain at least one node"
      })
    }

    // Check if workflow name already exists for this user
    const existingWorkflow = await knex('workflows')
      .where({ user_id, name: name.trim() })
      .first()

    if (existingWorkflow) {
      return res.status(409).json({
        success: false,
        message: "A workflow with this name already exists"
      })
    }

    // Insert new workflow
    const [workflowId] = await knex('workflows').insert({
      name: name.trim(),
      description: description.trim(),
      user_id,
      nodes: JSON.stringify(nodes),
      connections: JSON.stringify(connections),
      tags,
      is_public: isPublic
    }).returning('id')

    res.json({
      success: true,
      workflowId: workflowId.id || workflowId,
      message: "Workflow saved successfully"
    })

  } catch (error) {
    console.error("Error saving workflow:", error)
    res.status(500).json({
      success: false,
      message: "Internal server error"
    })
  }
})

/**
 * GET /api/workflow-automation/workflows
 * List user's workflows
 */
router.get("/workflows", auth, async (req, res) => {
  try {
    const user_id = req.session?.user_data?.user?.login || req.headers['x-user-id']

    if (!user_id) {
      return res.status(401).json({
        success: false,
        message: "Authentication required"
      })
    }

    const { page = 1, limit = 20, search = '' } = req.query

    let query = knex('workflows')
      .select([
        'id', 'name', 'description', 'version', 'tags', 'is_public',
        'execution_count', 'last_executed_at', 'created_at', 'updated_at'
      ])
      .where('user_id', user_id)

    if (search) {
      query = query.where(function() {
        this.where('name', 'ilike', `%${search}%`)
            .orWhere('description', 'ilike', `%${search}%`)
      })
    }

    const offset = (parseInt(page) - 1) * parseInt(limit)
    const workflows = await query
      .orderBy('updated_at', 'desc')
      .limit(parseInt(limit))
      .offset(offset)

    // Get total count
    const totalQuery = knex('workflows').where('user_id', user_id)
    if (search) {
      totalQuery.where(function() {
        this.where('name', 'ilike', `%${search}%`)
            .orWhere('description', 'ilike', `%${search}%`)
      })
    }
    const [{ count: total }] = await totalQuery.count()

    res.json({
      success: true,
      workflows: workflows.map(workflow => ({
        ...workflow,
        metadata: {
          id: workflow.id,
          name: workflow.name,
          description: workflow.description,
          author: user_id,
          version: workflow.version,
          created: workflow.created_at,
          modified: workflow.updated_at,
          tags: workflow.tags,
          isPublic: workflow.is_public
        }
      })),
      total: parseInt(total),
      page: parseInt(page),
      limit: parseInt(limit)
    })

  } catch (error) {
    console.error("Error listing workflows:", error)
    res.status(500).json({
      success: false,
      message: "Internal server error"
    })
  }
})

/**
 * GET /api/workflow-automation/workflows/:id
 * Load a specific workflow
 */
router.get("/workflows/:id", auth, async (req, res) => {
  try {
    const user_id = req.session?.user_data?.user?.login || req.headers['x-user-id']
    const { id } = req.params

    if (!user_id) {
      return res.status(401).json({
        success: false,
        message: "Authentication required"
      })
    }

    const workflow = await knex('workflows')
      .where({ id, user_id })
      .first()

    if (!workflow) {
      return res.status(404).json({
        success: false,
        message: "Workflow not found"
      })
    }

    res.json({
      success: true,
      workflow: {
        metadata: {
          id: workflow.id,
          name: workflow.name,
          description: workflow.description,
          author: workflow.user_id,
          version: workflow.version,
          created: workflow.created_at,
          modified: workflow.updated_at,
          tags: workflow.tags,
          isPublic: workflow.is_public
        },
        state: {
          nodes: JSON.parse(workflow.nodes),
          connections: JSON.parse(workflow.connections),
          selectedNodeId: null,
          executionState: {
            status: 'idle',
            progress: 0,
            logs: [],
            metrics: {
              totalSteps: 0,
              completedSteps: 0,
              executionTime: 0
            }
          },
          isDirty: false
        }
      }
    })

  } catch (error) {
    console.error("Error loading workflow:", error)
    res.status(500).json({
      success: false,
      message: "Internal server error"
    })
  }
})

/**
 * PUT /api/workflow-automation/workflows/:id
 * Update an existing workflow
 */
router.put("/workflows/:id", auth, async (req, res) => {
  try {
    const user_id = req.session?.user_data?.user?.login || req.headers['x-user-id']
    const { id } = req.params

    if (!user_id) {
      return res.status(401).json({
        success: false,
        message: "Authentication required"
      })
    }

    const {
      name,
      description,
      nodes,
      connections,
      tags,
      isPublic
    } = req.body

    // Check if workflow exists and belongs to user
    const existingWorkflow = await knex('workflows')
      .where({ id, user_id })
      .first()

    if (!existingWorkflow) {
      return res.status(404).json({
        success: false,
        message: "Workflow not found"
      })
    }

    // Update workflow
    await knex('workflows')
      .where({ id, user_id })
      .update({
        name: name || existingWorkflow.name,
        description: description !== undefined ? description : existingWorkflow.description,
        nodes: nodes ? JSON.stringify(nodes) : existingWorkflow.nodes,
        connections: connections ? JSON.stringify(connections) : existingWorkflow.connections,
        tags: tags || existingWorkflow.tags,
        is_public: isPublic !== undefined ? isPublic : existingWorkflow.is_public
      })

    res.json({
      success: true,
      workflowId: id,
      message: "Workflow updated successfully"
    })

  } catch (error) {
    console.error("Error updating workflow:", error)
    res.status(500).json({
      success: false,
      message: "Internal server error"
    })
  }
})

/**
 * DELETE /api/workflow-automation/workflows/:id
 * Delete a workflow
 */
router.delete("/workflows/:id", auth, async (req, res) => {
  try {
    const user_id = req.session?.user_data?.user?.login || req.headers['x-user-id']
    const { id } = req.params

    if (!user_id) {
      return res.status(401).json({
        success: false,
        message: "Authentication required"
      })
    }

    const deletedCount = await knex('workflows')
      .where({ id, user_id })
      .del()

    if (deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Workflow not found"
      })
    }

    res.json({
      success: true,
      message: "Workflow deleted successfully"
    })

  } catch (error) {
    console.error("Error deleting workflow:", error)
    res.status(500).json({
      success: false,
      message: "Internal server error"
    })
  }
})

/**
 * GET /api/workflow-automation/templates
 * Get workflow templates
 */
router.get("/templates", auth, async (req, res) => {
  try {
    const { category, difficulty } = req.query

    let query = knex('workflow_templates')
      .select([
        'id', 'name', 'description', 'category', 'nodes', 'connections',
        'tags', 'difficulty_level', 'estimated_time_minutes', 'usage_count'
      ])

    if (category) {
      query = query.where('category', category)
    }

    if (difficulty) {
      query = query.where('difficulty_level', difficulty)
    }

    const templates = await query.orderBy('usage_count', 'desc')

    res.json({
      success: true,
      templates: templates.map(template => ({
        id: template.id.toString(),
        name: template.name,
        description: template.description,
        category: template.category,
        nodes: JSON.parse(template.nodes),
        connections: JSON.parse(template.connections),
        tags: template.tags,
        difficulty: template.difficulty_level,
        estimatedTime: template.estimated_time_minutes,
        usageCount: template.usage_count
      }))
    })

  } catch (error) {
    console.error("Error fetching templates:", error)
    res.status(500).json({
      success: false,
      message: "Internal server error"
    })
  }
})

/**
 * POST /api/workflow-automation/workflows/from-template
 * Create workflow from template
 */
router.post("/workflows/from-template", auth, async (req, res) => {
  try {
    const user_id = req.session?.user_data?.user?.login || req.headers['x-user-id']

    if (!user_id) {
      return res.status(401).json({
        success: false,
        message: "Authentication required"
      })
    }

    const { templateId, name } = req.body

    if (!templateId || !name) {
      return res.status(400).json({
        success: false,
        message: "Template ID and workflow name are required"
      })
    }

    // Get template
    const template = await knex('workflow_templates')
      .where('id', templateId)
      .first()

    if (!template) {
      return res.status(404).json({
        success: false,
        message: "Template not found"
      })
    }

    // Check if workflow name already exists for this user
    const existingWorkflow = await knex('workflows')
      .where({ user_id, name: name.trim() })
      .first()

    if (existingWorkflow) {
      return res.status(409).json({
        success: false,
        message: "A workflow with this name already exists"
      })
    }

    // Create workflow from template
    const [workflowId] = await knex('workflows').insert({
      name: name.trim(),
      description: `Created from template: ${template.name}`,
      user_id,
      nodes: template.nodes,
      connections: template.connections,
      tags: template.tags,
      is_public: false
    }).returning('id')

    // Increment template usage count
    await knex('workflow_templates')
      .where('id', templateId)
      .increment('usage_count', 1)

    res.json({
      success: true,
      workflowId: workflowId.id || workflowId,
      message: "Workflow created from template successfully"
    })

  } catch (error) {
    console.error("Error creating workflow from template:", error)
    res.status(500).json({
      success: false,
      message: "Internal server error"
    })
  }
})

async function executeWorkflowAsync(executionId, nodes, connections, parameters, token, userId) {
  console.log(`Starting workflow execution ${executionId} for user ${userId}`)
  console.log(`Nodes: ${nodes.length}, Connections: ${connections.length}`)

  // Store execution for WebSocket connection
  global.pendingWorkflowExecutions = global.pendingWorkflowExecutions || new Map()
  global.pendingWorkflowExecutions.set(executionId, {
    nodes,
    connections,
    parameters,
    token,
    userId,
    timestamp: new Date().toISOString()
  })

  console.log(`📋 Stored workflow execution parameters. Total pending: ${global.pendingWorkflowExecutions.size}`)
}

/**
 * WebSocket endpoint for workflow execution streaming
 * GET /api/workflow-automation/stream/:executionId
 */
router.get("/stream/:executionId", async (req, res) => {
  const { executionId } = req.params

  // Check if this is a WebSocket upgrade request
  if (req.headers.upgrade !== 'websocket') {
    return res.status(400).json({
      success: false,
      message: "This endpoint requires WebSocket connection"
    })
  }

  // The WebSocket upgrade will be handled by the WebSocket server
  // This endpoint just validates the execution ID exists
  global.pendingWorkflowExecutions = global.pendingWorkflowExecutions || new Map()

  if (!global.pendingWorkflowExecutions.has(executionId)) {
    return res.status(404).json({
      success: false,
      message: "Execution not found"
    })
  }

  res.status(200).json({
    success: true,
    message: "WebSocket connection available"
  })
})

/**
 * Handle WebSocket connections for workflow execution
 */
function handleWorkflowWebSocket(ws, req) {
  const url = new URL(req.url, `http://${req.headers.host}`)
  const pathParts = url.pathname.split('/')

  // Check if this is a workflow execution stream
  if (pathParts.includes('workflow-automation') && pathParts.includes('stream')) {
    const executionId = pathParts[pathParts.length - 1]

    console.log(`🔌 WebSocket connected for workflow execution: ${executionId}`)

    global.pendingWorkflowExecutions = global.pendingWorkflowExecutions || new Map()

    if (!global.pendingWorkflowExecutions.has(executionId)) {
      ws.close(1000, 'Execution not found')
      return
    }

    const executionData = global.pendingWorkflowExecutions.get(executionId)
    global.pendingWorkflowExecutions.delete(executionId)

    // Start workflow execution with WebSocket streaming
    workflowExecutionService.executeWorkflow(
      executionId,
      executionData.nodes,
      executionData.connections,
      executionData.parameters,
      ws
    ).then(result => {
      console.log(`✅ Workflow execution completed: ${executionId}`)

      // Send final result
      if (ws.readyState === ws.OPEN) {
        ws.send(JSON.stringify({
          type: 'result',
          data: result
        }))
        ws.close(1000, 'Execution completed')
      }
    }).catch(error => {
      console.error(`❌ Workflow execution failed: ${executionId}`, error)

      // Send error
      if (ws.readyState === ws.OPEN) {
        ws.send(JSON.stringify({
          type: 'error',
          data: {
            message: error.message,
            executionId
          }
        }))
        ws.close(1000, 'Execution failed')
      }
    })

    // Handle WebSocket close
    ws.on('close', () => {
      console.log(`🔌 WebSocket disconnected for workflow execution: ${executionId}`)
    })

    return true // Indicate that this WebSocket was handled
  }

  return false // Not a workflow execution WebSocket
}

// Export the WebSocket handler
router.handleWorkflowWebSocket = handleWorkflowWebSocket

module.exports = router

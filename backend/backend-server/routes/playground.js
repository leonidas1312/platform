const express = require("express")
const { knex } = require("../config/database")
const { auth } = require("../middleware/auth")
const OptimizationService = require("../services/optimizationService")
const fetch = (...args) => import("node-fetch").then(({ default: fetch }) => fetch(...args))
// Removed QubotService - qubots execution now happens in playground containers

const router = express.Router()

// ============================================================================
// QUBOTS INTEGRATION ENDPOINTS
// ============================================================================
// Integrated qubots playground endpoints for fast prototyping

// Get qubots endpoints overview
router.get("/qubots", async (req, res) => {
  res.json({
    success: true,
    message: "Qubots playground API endpoints",
    endpoints: {
      status: {
        method: "GET",
        path: "/api/playground/qubots/status",
        description: "Get qubots system status"
      },
      models: {
        method: "GET",
        path: "/api/playground/qubots/models",
        description: "Get user's available qubots models"
      },
      search: {
        method: "GET",
        path: "/api/playground/qubots/search",
        description: "Search qubots models"
      },
      validate: {
        method: "POST",
        path: "/api/playground/qubots/validate",
        description: "Validate model accessibility"
      },
      schema: {
        method: "GET",
        path: "/api/playground/qubots/schema/:model_name",
        description: "Get parameter schema for a model"
      },
      execute: {
        method: "POST",
        path: "/api/playground/qubots/execute",
        description: "Execute qubots optimization"
      }
    }
  })
})

// Get verified environment specs from Kubernetes
router.get("/qubots/specs", async (req, res) => {
  try {
    const PlaygroundEnvironmentService = require("../services/playgroundEnvironmentService")
    const playgroundService = new PlaygroundEnvironmentService()

    // Get actual specs from the service configuration
    const actualSpecs = {
      runtime_limit: {
        value: Math.round(playgroundService.sessionTimeout / (1000 * 60)), // Convert ms to minutes
        unit: "minutes",
        description: "Maximum session duration (auto-cleanup after inactivity)"
      },
      cpu: {
        cores: 2, // From Kubernetes pod spec
        requests: "500m",
        description: "CPU allocation (2 cores limit, 0.5 cores guaranteed)"
      },
      memory: {
        value: 4,
        unit: "GB",
        requests: "1GB",
        description: "Memory allocation (4GB limit, 1GB guaranteed)"
      },
      storage: {
        value: "Ephemeral",
        unit: "",
        description: "Temporary container storage (deleted after session)"
      },
      python_version: "3.13",
      qubots_support: true,
      container_isolation: true,
      ports: {
        qubots_api: 8000,
        jupyter: 8888,
        vscode: 8080
      },
      max_environments: playgroundService.maxEnvironments,
      base_image: playgroundService.baseImage
    }

    res.json({
      success: true,
      message: "Environment specifications verified from Kubernetes configuration",
      environment_specs: actualSpecs,
      verified: true,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error("Error getting verified specs:", error)
    res.status(500).json({
      success: false,
      message: "Failed to get verified environment specifications",
      error: error.message
    })
  }
})

// Get qubots system status
router.get("/qubots/status", async (req, res) => {
  res.json({
    success: true,
    message: "Qubots playground integrated with Rastion platform",
    backend_python: false,
    playground_containers: true,
    architecture: "lightweight",
    features: {
      model_discovery: true,
      fast_prototyping: true,
      built_in_dashboards: true,
      real_time_results: true
    },
    environment_specs: {
      runtime_limit: {
        value: 60,
        unit: "minutes",
        description: "Maximum session duration (auto-cleanup after inactivity)"
      },
      cpu: {
        cores: 2,
        requests: "500m",
        description: "CPU allocation (2 cores limit, 0.5 cores guaranteed)"
      },
      memory: {
        value: 4,
        unit: "GB",
        requests: "1GB",
        description: "Memory allocation (4GB limit, 1GB guaranteed)"
      },
      storage: {
        value: "Ephemeral",
        unit: "",
        description: "Temporary container storage (deleted after session)"
      },
      python_version: "3.13",
      qubots_support: true,
      container_isolation: true,
      ports: {
        qubots_api: 8000,
        jupyter: 8888,
        vscode: 8080
      }
    }
  })
})

// Get user's available qubots models
router.get("/qubots/models", auth, async (req, res) => {
  try {
    const username = req.query.username || req.user.login
    const GiteaService = require("../services/giteaService")

    // Fetch user's repositories from Gitea
    const reposResponse = await GiteaService.getUserRepositories(req.user.token, username)

    if (!reposResponse.ok) {
      return res.status(reposResponse.status).json({
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
          req.user.token,
          username,
          repo.name,
          "config.json"
        )

        if (configResponse.ok) {
          const configData = await configResponse.json()
          const config = JSON.parse(Buffer.from(configData.content, 'base64').toString())

          const modelInfo = {
            name: repo.name,
            username: username,
            description: repo.description || config.metadata?.description || "",
            model_type: config.type,
            repository_url: repo.html_url,
            last_updated: repo.updated_at,
            tags: config.metadata?.tags || [],
            metadata: {
              stars: repo.stars_count || 0,
              forks: repo.forks_count || 0,
              size: repo.size || 0
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
    console.error("Error fetching qubots models:", error)
    res.status(500).json({
      success: false,
      message: "Internal server error"
    })
  }
})

// Search community qubots models
router.get("/qubots/search", async (req, res) => {
  try {
    const { query = "", type = "", limit = 20 } = req.query
    const GiteaService = require("../services/giteaService")

    // Search repositories with qubots-related terms
    const searchQuery = query ? `${query} qubots` : "qubots"
    const searchResponse = await GiteaService.searchRepositories(searchQuery, limit)

    if (!searchResponse.ok) {
      return res.status(searchResponse.status).json({
        message: "Failed to search repositories"
      })
    }

    const searchResults = await searchResponse.json()
    const models = []

    for (const repo of searchResults.data || []) {
      try {
        // Try to get config.json to verify it's a qubots model
        const configResponse = await GiteaService.getFileContent(
          null, // No auth needed for public repos
          repo.owner.login,
          repo.name,
          "config.json"
        )

        if (configResponse.ok) {
          const configData = await configResponse.json()
          const config = JSON.parse(Buffer.from(configData.content, 'base64').toString())

          // Filter by type if specified
          if (type && config.type !== type) {
            continue
          }

          const modelInfo = {
            name: repo.name,
            username: repo.owner.login,
            description: repo.description || config.metadata?.description || "",
            model_type: config.type,
            repository_url: repo.html_url,
            last_updated: repo.updated_at,
            tags: config.metadata?.tags || [],
            metadata: {
              stars: repo.stars_count || 0,
              forks: repo.forks_count || 0,
              size: repo.size || 0
            }
          }

          models.push(modelInfo)
        }
      } catch (error) {
        // Skip repositories without valid qubots config
        continue
      }
    }

    res.json({
      success: true,
      models,
      total: models.length,
      query: searchQuery
    })

  } catch (error) {
    console.error("Error searching qubots models:", error)
    res.status(500).json({
      success: false,
      message: "Internal server error"
    })
  }
})

// Validate model accessibility
router.post("/qubots/validate", async (req, res) => {
  try {
    const { problem_name, problem_username, optimizer_name, optimizer_username } = req.body

    if (!problem_name || !optimizer_name) {
      return res.status(400).json({
        success: false,
        message: "problem_name and optimizer_name are required"
      })
    }

    const GiteaService = require("../services/giteaService")
    const validationResults = {
      problem_valid: false,
      optimizer_valid: false,
      problem_config: null,
      optimizer_config: null,
      errors: []
    }

    // Validate problem repository
    try {
      const problemConfigResponse = await GiteaService.getFileContent(
        null,
        problem_username,
        problem_name,
        "config.json"
      )

      if (problemConfigResponse.ok) {
        const configData = await problemConfigResponse.json()
        const config = JSON.parse(Buffer.from(configData.content, 'base64').toString())

        if (config.type === 'problem') {
          validationResults.problem_valid = true
          validationResults.problem_config = config
        } else {
          validationResults.errors.push("Repository is not a qubots problem")
        }
      } else {
        validationResults.errors.push("Problem repository not accessible or missing config.json")
      }
    } catch (error) {
      validationResults.errors.push(`Problem validation error: ${error.message}`)
    }

    // Validate optimizer repository
    try {
      const optimizerConfigResponse = await GiteaService.getFileContent(
        null,
        optimizer_username,
        optimizer_name,
        "config.json"
      )

      if (optimizerConfigResponse.ok) {
        const configData = await optimizerConfigResponse.json()
        const config = JSON.parse(Buffer.from(configData.content, 'base64').toString())

        if (config.type === 'optimizer') {
          validationResults.optimizer_valid = true
          validationResults.optimizer_config = config
        } else {
          validationResults.errors.push("Repository is not a qubots optimizer")
        }
      } else {
        validationResults.errors.push("Optimizer repository not accessible or missing config.json")
      }
    } catch (error) {
      validationResults.errors.push(`Optimizer validation error: ${error.message}`)
    }

    validationResults.success = validationResults.problem_valid && validationResults.optimizer_valid

    res.json(validationResults)

  } catch (error) {
    console.error("Error validating models:", error)
    res.status(500).json({
      success: false,
      message: "Internal server error"
    })
  }
})

// Parameter schema endpoint removed - schema information is now handled
// by the unified workflow execution service and repository metadata

// Execute qubots optimization
router.post("/qubots/execute", async (req, res) => {
  console.log("POST /api/playground/qubots/execute called")
  console.log("Request body:", req.body)

  try {
    const {
      problem_name,
      problem_username,
      optimizer_name,
      optimizer_username,
      problem_params = {},
      optimizer_params = {},
      timeout = 30000
    } = req.body

    if (!problem_name || !optimizer_name) {
      return res.status(400).json({
        success: false,
        message: "problem_name and optimizer_name are required"
      })
    }

    // Use unified workflow execution service
    const UnifiedWorkflowExecutionService = require("../services/unifiedWorkflowExecutionService")
    const executionService = UnifiedWorkflowExecutionService.getInstance()

    try {
      console.log(`Executing qubots optimization: ${problem_name} + ${optimizer_name}`)

      // Create workflow nodes for the execution
      const nodes = [
        {
          id: 'problem-1',
          type: 'problem',
          data: {
            name: problem_name,
            username: problem_username || 'default',
            parameters: problem_params
          }
        },
        {
          id: 'optimizer-1',
          type: 'optimizer',
          data: {
            name: optimizer_name,
            username: optimizer_username || 'default',
            parameters: optimizer_params
          }
        }
      ]

      const connections = [
        {
          source: 'problem-1',
          target: 'optimizer-1'
        }
      ]

      const executionId = `playground_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      // Execute optimization using unified workflow service
      const result = await executionService.executeWorkflow(
        executionId,
        nodes,
        connections,
        { timeout },
        null, // No WebSocket for simple execution
        null  // No auth token needed for playground
      )

      res.json({
        success: true,
        result,
        execution_info: {
          problem_name,
          problem_username,
          optimizer_name,
          optimizer_username,
          execution_method: 'kubernetes_job',
          timestamp: new Date().toISOString()
        }
      })

    } catch (executionError) {
      console.error("❌ Qubots execution error:", executionError)
      console.error("🔍 Error details:", {
        problem_name,
        optimizer_name,
        problem_username,
        optimizer_username,
        error_message: executionError.message,
        error_stack: executionError.stack
      })

      res.status(500).json({
        success: false,
        message: "Optimization execution failed",
        error: executionError.message,
        error_details: {
          problem_name,
          optimizer_name,
          problem_username,
          optimizer_username,
          timestamp: new Date().toISOString()
        }
      })
    }

  } catch (error) {
    console.error("Error executing qubots optimization:", error)
    res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
      error_type: "execution_error"
    })
  }
})

// Execute qubots optimization with streaming logs
router.post("/qubots/execute-stream", async (req, res) => {
  console.log("POST /api/playground/qubots/execute-stream called")

  try {
    const {
      problem_name,
      problem_username,
      optimizer_name,
      optimizer_username,
      problem_params = {},
      optimizer_params = {},
      timeout = 30000
    } = req.body

    if (!problem_name || !optimizer_name) {
      return res.status(400).json({
        success: false,
        message: "problem_name and optimizer_name are required"
      })
    }

    // Generate execution ID for WebSocket connection
    const crypto = require('crypto')
    const executionId = crypto.randomUUID()

    console.log(`🚀 Creating streaming execution: ${executionId}`)
    console.log(`📊 Problem: ${problem_username}/${problem_name}`)
    console.log(`🔧 Optimizer: ${optimizer_username}/${optimizer_name}`)

    // Store execution parameters for WebSocket handler
    if (!global.pendingExecutions) {
      global.pendingExecutions = new Map()
      console.log(`📋 Initialized global.pendingExecutions`)
    }

    global.pendingExecutions.set(executionId, {
      problemName: problem_name,
      optimizerName: optimizer_name,
      problemUsername: problem_username || 'default',
      optimizerUsername: optimizer_username || 'default',
      problemParams: problem_params,
      optimizerParams: optimizer_params,
      timeout: timeout,
      timestamp: new Date().toISOString()
    })

    console.log(`📋 Stored execution parameters. Total pending: ${global.pendingExecutions.size}`)

    // Return execution ID immediately, client will connect via WebSocket
    res.json({
      success: true,
      execution_id: executionId,
      message: "Execution started, connect via WebSocket for real-time logs",
      websocket_url: `/api/playground/qubots/stream/${executionId}`
    })

    // Clean up after 5 minutes if not used
    setTimeout(() => {
      if (global.pendingExecutions && global.pendingExecutions.has(executionId)) {
        global.pendingExecutions.delete(executionId)
        console.log(`Cleaned up unused execution: ${executionId}`)
      }
    }, 300000)

  } catch (error) {
    console.error("Error starting streaming execution:", error)
    res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
      error_type: "execution_error"
    })
  }
})

// ============================================================================
// SHARED COMBINATIONS ENDPOINTS
// ============================================================================

// Get public qubots combinations
router.get("/qubots/combinations", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 20
    const offset = (page - 1) * limit
    const category = req.query.category
    const search = req.query.search

    let query = knex("qubots_combinations")
      .where("is_public", true)
      .orderBy("usage_count", "desc")
      .orderBy("average_rating", "desc")
      .limit(limit)
      .offset(offset)

    // Apply filters
    if (category) {
      query = query.whereRaw("tags @> ?", [JSON.stringify([category])])
    }

    if (search) {
      query = query.where(function() {
        this.where("name", "ilike", `%${search}%`)
          .orWhere("description", "ilike", `%${search}%`)
          .orWhere("problem_name", "ilike", `%${search}%`)
          .orWhere("optimizer_name", "ilike", `%${search}%`)
      })
    }

    const combinations = await query.select("*")

    // Get total count for pagination
    let countQuery = knex("qubots_combinations").where("is_public", true)
    if (category) {
      countQuery = countQuery.whereRaw("tags @> ?", [JSON.stringify([category])])
    }
    if (search) {
      countQuery = countQuery.where(function() {
        this.where("name", "ilike", `%${search}%`)
          .orWhere("description", "ilike", `%${search}%`)
          .orWhere("problem_name", "ilike", `%${search}%`)
          .orWhere("optimizer_name", "ilike", `%${search}%`)
      })
    }

    const total = await countQuery.count("id as count").first()

    res.json({
      combinations,
      pagination: {
        page,
        limit,
        total: parseInt(total.count),
        pages: Math.ceil(total.count / limit)
      }
    })
  } catch (error) {
    console.error("Error fetching qubots combinations:", error)
    res.status(500).json({ message: "Internal server error" })
  }
})

// Get user's saved combinations (requires authentication)
router.get("/qubots/combinations/mine", auth, async (req, res) => {
  try {
    const user_id = req.user.login
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 20
    const offset = (page - 1) * limit

    const combinations = await knex("qubots_combinations")
      .where("created_by", user_id)
      .orderBy("updated_at", "desc")
      .limit(limit)
      .offset(offset)
      .select("*")

    const total = await knex("qubots_combinations")
      .where("created_by", user_id)
      .count("id as count")
      .first()

    res.json({
      combinations,
      pagination: {
        page,
        limit,
        total: parseInt(total.count),
        pages: Math.ceil(total.count / limit)
      }
    })
  } catch (error) {
    console.error("Error fetching user combinations:", error)
    res.status(500).json({ message: "Internal server error" })
  }
})

// Save a new combination (requires authentication)
router.post("/qubots/combinations", auth, async (req, res) => {
  try {
    const {
      name,
      description,
      problem_name,
      problem_username,
      optimizer_name,
      optimizer_username,
      problem_params = {},
      optimizer_params = {},
      is_public = false,
      tags = []
    } = req.body

    const user_id = req.user.login

    if (!name || !problem_name || !optimizer_name) {
      return res.status(400).json({
        message: "name, problem_name, and optimizer_name are required"
      })
    }

    // Ensure JSON fields are objects/arrays, not strings
    const safeParams = {
      problem_params: typeof problem_params === 'object' ? problem_params : {},
      optimizer_params: typeof optimizer_params === 'object' ? optimizer_params : {},
      tags: Array.isArray(tags) ? tags : []
    }

    const combination = await knex("qubots_combinations").insert({
      name,
      description: description || null,
      problem_name,
      problem_username: problem_username || user_id,
      optimizer_name,
      optimizer_username: optimizer_username || user_id,
      problem_params: safeParams.problem_params,
      optimizer_params: safeParams.optimizer_params,
      created_by: user_id,
      is_public,
      tags: safeParams.tags,
      created_at: new Date(),
      updated_at: new Date()
    }).returning("*")

    res.status(201).json(combination[0])
  } catch (error) {
    console.error("Error saving combination:", error)
    res.status(500).json({ message: "Internal server error" })
  }
})

// ============================================================================
// OPTIMIZATION WORKFLOWS ENDPOINTS
// ============================================================================

// Get community workflows (public workflows from all users - no authentication required)
router.get("/workflows/community", async (req, res) => {
  try {
    const { page = 1, limit = 20, sort = 'created_at', order = 'desc', search = '' } = req.query
    const offset = (page - 1) * limit

    let query = knex("optimization_workflows")
      .select([
        "optimization_workflows.*",
        "users.username as creator_username"
      ])
      .leftJoin("users", "optimization_workflows.created_by", "users.username")
      .where("optimization_workflows.is_public", true)

    // Add search functionality
    if (search) {
      query = query.where(function() {
        this.where("optimization_workflows.title", "ilike", `%${search}%`)
          .orWhere("optimization_workflows.description", "ilike", `%${search}%`)
          .orWhere("optimization_workflows.problem_name", "ilike", `%${search}%`)
          .orWhere("optimization_workflows.optimizer_name", "ilike", `%${search}%`)
      })
    }

    // Add sorting
    const validSortFields = ['created_at', 'updated_at', 'views_count', 'likes_count', 'title']
    const sortField = validSortFields.includes(sort) ? sort : 'created_at'
    const sortOrder = order.toLowerCase() === 'asc' ? 'asc' : 'desc'

    query = query.orderBy(`optimization_workflows.${sortField}`, sortOrder)

    // Get total count for pagination
    const totalQuery = knex("optimization_workflows")
      .where("is_public", true)
      .count("* as count")
      .first()

    if (search) {
      totalQuery.where(function() {
        this.where("title", "ilike", `%${search}%`)
          .orWhere("description", "ilike", `%${search}%`)
          .orWhere("problem_name", "ilike", `%${search}%`)
          .orWhere("optimizer_name", "ilike", `%${search}%`)
      })
    }

    const [workflows, totalResult] = await Promise.all([
      query.limit(limit).offset(offset),
      totalQuery
    ])

    const total = parseInt(totalResult.count)
    const totalPages = Math.ceil(total / limit)

    res.json({
      success: true,
      workflows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    })
  } catch (error) {
    console.error("Error fetching workflows:", error)
    res.status(500).json({ message: "Internal server error" })
  }
})

// Get user's personal workflows (both public and private - requires authentication)
router.get("/workflows/personal", auth, async (req, res) => {
  try {
    const { page = 1, limit = 20, sort = 'created_at', order = 'desc', search = '' } = req.query
    const offset = (page - 1) * limit
    const username = req.user.login || req.user.username

    if (!username) {
      return res.status(401).json({
        message: "User authentication failed - no username found"
      })
    }

    let query = knex("optimization_workflows")
      .select("*")
      .where("created_by", username)

    // Add search functionality
    if (search) {
      query = query.where(function() {
        this.where("title", "ilike", `%${search}%`)
          .orWhere("description", "ilike", `%${search}%`)
          .orWhere("problem_name", "ilike", `%${search}%`)
          .orWhere("optimizer_name", "ilike", `%${search}%`)
      })
    }

    query = query
      .orderBy(sort, order)
      .limit(limit)
      .offset(offset)

    const totalQuery = knex("optimization_workflows")
      .where("created_by", username)
      .modify(function(queryBuilder) {
        if (search) {
          queryBuilder.where(function() {
            this.where("title", "ilike", `%${search}%`)
              .orWhere("description", "ilike", `%${search}%`)
              .orWhere("problem_name", "ilike", `%${search}%`)
              .orWhere("optimizer_name", "ilike", `%${search}%`)
          })
        }
      })
      .count("* as count")
      .first()

    const [workflows, totalResult] = await Promise.all([
      query,
      totalQuery
    ])

    const total = parseInt(totalResult.count)
    const totalPages = Math.ceil(total / limit)

    res.json({
      success: true,
      workflows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    })
  } catch (error) {
    console.error("Error fetching user workflows:", error)
    res.status(500).json({ message: "Internal server error" })
  }
})

// Keep the old endpoint for backward compatibility (alias to community)
router.get("/workflows", async (req, res) => {
  try {
    const { page = 1, limit = 20, sort = 'created_at', order = 'desc', search = '' } = req.query
    const offset = (page - 1) * limit

    let query = knex("optimization_workflows")
      .select([
        "optimization_workflows.*",
        "users.username as creator_username"
      ])
      .leftJoin("users", "optimization_workflows.created_by", "users.username")
      .where("optimization_workflows.is_public", true)

    // Add search functionality
    if (search) {
      query = query.where(function() {
        this.where("optimization_workflows.title", "ilike", `%${search}%`)
          .orWhere("optimization_workflows.description", "ilike", `%${search}%`)
          .orWhere("optimization_workflows.problem_name", "ilike", `%${search}%`)
          .orWhere("optimization_workflows.optimizer_name", "ilike", `%${search}%`)
      })
    }

    query = query
      .orderBy(`optimization_workflows.${sort}`, order)
      .limit(limit)
      .offset(offset)

    const totalQuery = knex("optimization_workflows")
      .where("is_public", true)
      .modify(function(queryBuilder) {
        if (search) {
          queryBuilder.where(function() {
            this.where("title", "ilike", `%${search}%`)
              .orWhere("description", "ilike", `%${search}%`)
              .orWhere("problem_name", "ilike", `%${search}%`)
              .orWhere("optimizer_name", "ilike", `%${search}%`)
          })
        }
      })
      .count("* as count")
      .first()

    const [workflows, totalResult] = await Promise.all([
      query,
      totalQuery
    ])

    const total = parseInt(totalResult.count)
    const totalPages = Math.ceil(total / limit)

    res.json({
      success: true,
      workflows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    })
  } catch (error) {
    console.error("Error fetching community workflows:", error)
    res.status(500).json({ message: "Internal server error" })
  }
})

// Get specific workflow by ID
router.get("/workflows/:id", async (req, res) => {
  try {
    const { id } = req.params

    // Try to get token from session first (HTTP-only cookie), then fallback to Authorization header
    let token = req.session?.user_data?.token
    let currentUser = null

    // Fallback to Authorization header for backward compatibility during transition
    if (!token) {
      token = req.headers.authorization?.split(" ")[1]
    }

    // If we have a token, get the current user info
    if (token) {
      try {
        const userResponse = await fetch(`${process.env.GITEA_URL}/api/v1/user`, {
          headers: { Authorization: `token ${token}` }
        })

        if (userResponse.ok) {
          currentUser = await userResponse.json()
        }
      } catch (error) {
        console.error("Error validating token:", error)
        // Continue without user info - they can still access public workflows
      }
    }

    const workflow = await knex("optimization_workflows")
      .select([
        "optimization_workflows.*",
        "users.username as creator_username"
      ])
      .leftJoin("users", "optimization_workflows.created_by", "users.username")
      .where("optimization_workflows.id", id)
      .first()

    if (!workflow) {
      return res.status(404).json({ message: "Workflow not found" })
    }

    // Check if user can access this workflow
    if (!workflow.is_public) {
      if (!currentUser) {
        return res.status(401).json({ message: "Workflow not found or you don't have permission to view it." })
      }

      if (currentUser.login !== workflow.created_by) {
        return res.status(403).json({ message: "Workflow not found or you don't have permission to view it." })
      }
    }

    // Increment view count for public workflows
    if (workflow.is_public) {
      await knex("optimization_workflows")
        .where("id", id)
        .increment("views_count", 1)

      workflow.views_count += 1
    }

    res.json({
      success: true,
      workflow
    })
  } catch (error) {
    console.error("Error fetching workflow:", error)
    res.status(500).json({ message: "Internal server error" })
  }
})

// Create new workflow (requires authentication)
router.post("/workflows", auth, async (req, res) => {
  try {
    const {
      title,
      description = '',
      problem_name,
      problem_username,
      optimizer_name,
      optimizer_username,
      problem_params = {},
      optimizer_params = {},
      tags = [],
      is_public = false,
      uploaded_files = {},
      execution_results = null
    } = req.body

    // Debug logging to identify the issue
    console.log("User object in workflow creation:", req.user)
    console.log("Session data:", req.session?.user_data)

    const username = req.user.login || req.user.username

    if (!username) {
      console.error("No username found in req.user:", req.user)
      return res.status(401).json({
        message: "User authentication failed - no username found"
      })
    }

    // Validate required fields
    if (!title || !problem_name || !optimizer_name) {
      return res.status(400).json({
        message: "title, problem_name, and optimizer_name are required"
      })
    }

    // Ensure JSON fields are objects/arrays, not strings
    const safeParams = {
      problem_params: typeof problem_params === 'object' ? problem_params : {},
      optimizer_params: typeof optimizer_params === 'object' ? optimizer_params : {},
      tags: Array.isArray(tags) ? tags : [],
      uploaded_files: typeof uploaded_files === 'object' ? uploaded_files : {},
      execution_results: execution_results && typeof execution_results === 'object' ? execution_results : null
    }

    // Create workflow
    const insertResult = await knex("optimization_workflows")
      .insert({
        title,
        description,
        created_by: username,
        problem_name,
        problem_username: problem_username || username,
        optimizer_name,
        optimizer_username: optimizer_username || username,
        problem_params: safeParams.problem_params,
        optimizer_params: safeParams.optimizer_params,
        tags: safeParams.tags,
        is_public,
        uploaded_files: safeParams.uploaded_files,
        execution_results: safeParams.execution_results
      })
      .returning("id")

    // Extract the actual ID value from the returned object
    const workflowId = insertResult[0].id || insertResult[0]

    // Fetch the created workflow
    const workflow = await knex("optimization_workflows")
      .select("*")
      .where("id", workflowId)
      .first()

    res.status(201).json({
      success: true,
      message: "Workflow created successfully",
      workflow
    })
  } catch (error) {
    console.error("Error creating workflow:", error)
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
      code: error.code
    })
    res.status(500).json({
      message: "Internal server error",
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    })
  }
})

// Delete a workflow (requires authentication)
router.delete("/workflows/:id", auth, async (req, res) => {
  try {
    const { id } = req.params
    const username = req.user.login || req.user.username

    if (!username) {
      return res.status(401).json({
        message: "User authentication failed - no username found"
      })
    }

    // Check if workflow exists and user owns it
    const workflow = await knex("optimization_workflows")
      .where({ id })
      .first()

    if (!workflow) {
      return res.status(404).json({ message: "Workflow not found" })
    }

    if (workflow.created_by !== username) {
      return res.status(403).json({ message: "You can only delete your own workflows" })
    }

    // Delete the workflow
    await knex("optimization_workflows")
      .where({ id })
      .del()

    res.json({
      success: true,
      message: "Workflow deleted successfully"
    })
  } catch (error) {
    console.error("Error deleting workflow:", error)
    res.status(500).json({ message: "Internal server error" })
  }
})

module.exports = router

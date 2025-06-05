const express = require("express")
const { knex } = require("../config/database")
const { auth } = require("../middleware/auth")
const upload = require("../middleware/upload")
const fs = require("fs")

const router = express.Router()

// Helper function to check benchmark access permissions
async function checkBenchmarkAccess(benchmarkId, req) {
  try {
    const benchmark = await knex("benchmarks")
      .where({ id: benchmarkId })
      .first()

    if (!benchmark) {
      return { hasAccess: false, error: "Benchmark not found", statusCode: 404 }
    }

    // If benchmark is public, allow access
    if (benchmark.is_public) {
      return { hasAccess: true, benchmark }
    }

    // For private benchmarks, check if user is the owner
    let token = req.session?.user_data?.token

    // Fallback to Authorization header for backward compatibility during transition
    if (!token) {
      token = req.headers.authorization?.split(" ")[1]
    }

    let currentUser = null
    if (token) {
      try {
        const GiteaService = require('../services/giteaService')
        const userResponse = await GiteaService.getCurrentUser(token)
        if (userResponse.ok) {
          currentUser = await userResponse.json()
        }
      } catch (error) {
        console.error('Error getting current user:', error)
      }
    }

    // If benchmark is private and user is not the owner, deny access
    if (!currentUser || currentUser.login !== benchmark.created_by) {
      return { hasAccess: false, error: "Access denied. This benchmark is private.", statusCode: 403 }
    }

    return { hasAccess: true, benchmark }
  } catch (error) {
    console.error('Error checking benchmark access:', error)
    return { hasAccess: false, error: "Internal server error", statusCode: 500 }
  }
}

// Test endpoint to check database connection
router.get("/test", async (req, res) => {
  try {
    console.log("Testing database connection...")

    // Test basic connection
    const result = await knex.raw("SELECT 1 as test")
    console.log("Database connection test result:", result)

    // Check if tables exist
    const tables = await knex.raw(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('benchmarks', 'benchmark_connections', 'benchmark_results')
    `)
    console.log("Available benchmark tables:", tables.rows)

    // Count records in each table
    const benchmarkCount = await knex("benchmarks").count("id as count").first()
    const connectionCount = await knex("benchmark_connections").count("id as count").first()

    res.json({
      database_connected: true,
      tables: tables.rows,
      counts: {
        benchmarks: parseInt(benchmarkCount.count) || 0,
        connections: parseInt(connectionCount.count) || 0,
      }
    })
  } catch (error) {
    console.error("Database test error:", error)
    res.status(500).json({
      database_connected: false,
      error: error.message
    })
  }
})

// Get all benchmarks
router.get("/", async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      search = '',
      sort = 'created_at',
      order = 'desc',
      personal = 'false'
    } = req.query

    const offset = (parseInt(page) - 1) * parseInt(limit)

    console.log(`Fetching benchmarks - page: ${page}, limit: ${limit}, offset: ${offset}, search: ${search}, personal: ${personal}`)

    // Try to get token from session first (HTTP-only cookie), then fallback to Authorization header
    let token = req.session?.user_data?.token

    // Fallback to Authorization header for backward compatibility during transition
    if (!token) {
      token = req.headers.authorization?.split(" ")[1]
    }

    let currentUser = null
    if (token) {
      try {
        const GiteaService = require('../services/giteaService')
        const userResponse = await GiteaService.getCurrentUser(token)
        if (userResponse.ok) {
          currentUser = await userResponse.json()
        }
      } catch (error) {
        console.error('Error getting current user:', error)
      }
    }

    // Check if benchmarks table exists
    const tableExists = await knex.schema.hasTable('benchmarks')
    if (!tableExists) {
      console.log('Benchmarks table does not exist, returning empty result')
      return res.json({
        benchmarks: [],
        total: 0,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: 0
      })
    }

    // Build base query for filtering
    let baseQuery = knex("benchmarks")

    // Add search filter
    if (search) {
      baseQuery = baseQuery.where(function() {
        this.where('title', 'ilike', `%${search}%`)
          .orWhere('description', 'ilike', `%${search}%`)
          .orWhere('created_by', 'ilike', `%${search}%`)
      })
    }

    // Add personal/community filter
    if (personal === 'true' && currentUser) {
      // Personal tab: show only user's benchmarks (both public and private)
      baseQuery = baseQuery.where('created_by', currentUser.login)
    } else {
      // Community tab: show only public benchmarks
      baseQuery = baseQuery.where('is_public', true)
    }

    // Get total count with filters (separate query)
    const totalCountResult = await baseQuery.clone().count("id as count").first()
    const totalCount = parseInt(totalCountResult.count) || 0
    console.log(`Total benchmarks count: ${totalCount}`)

    // Build main query with all columns, sorting and pagination
    const benchmarks = await baseQuery.clone()
      .select("*")
      .orderBy(sort, order)
      .limit(parseInt(limit))
      .offset(offset)
    console.log(`Found ${benchmarks.length} benchmarks for this page`)

    // Get connections and stats for each benchmark
    for (const benchmark of benchmarks) {
      // Check if benchmark_connections table exists
      const connectionsTableExists = await knex.schema.hasTable('benchmark_connections')
      let connections = []

      if (connectionsTableExists) {
        try {
          connections = await knex("benchmark_connections")
            .where("benchmark_id", benchmark.id)
            .select("*")
        } catch (error) {
          console.warn("Error fetching benchmark connections:", error)
          connections = []
        }
      }

      // Transform connections to problem_repositories array
      benchmark.problem_repositories = connections.map(conn => conn.connected_repo_path)
      benchmark.connections = connections // Keep for backward compatibility

      // Calculate actual results count
      try {
        const resultsTableExists = await knex.schema.hasTable('benchmark_results')
        if (resultsTableExists) {
          const resultsCount = await knex("benchmark_results")
            .where("benchmark_id", benchmark.id)
            .count("id as count")
            .first()
          benchmark.participants_count = parseInt(resultsCount?.count) || 0
        } else {
          benchmark.participants_count = 0
        }
      } catch (resultsError) {
        console.warn("Error counting benchmark results:", resultsError)
        benchmark.participants_count = 0
      }

      // Remove mock stats - these will be calculated from actual data when needed

      // Parse tags from JSON string to array
      try {
        benchmark.tags = benchmark.tags ? JSON.parse(benchmark.tags) : []
      } catch (error) {
        console.warn("Error parsing tags for benchmark", benchmark.id, ":", error)
        benchmark.tags = []
      }

      benchmark.is_public = benchmark.is_public !== false // Default to true if not set
      benchmark.has_notebook = false // TODO: Check if notebook exists
    }

    const response = {
      benchmarks: benchmarks,
      total: totalCount,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(totalCount / parseInt(limit))
    }

    console.log("Sending response with", benchmarks.length, "benchmarks")

    // Return paginated response
    res.json(response)
  } catch (error) {
    console.error("Error fetching benchmarks:", error)
    res.status(500).json({ message: "Internal server error" })
  }
})

// Get a specific benchmark
router.get("/:id", async (req, res) => {
  const { id } = req.params

  try {
    // Check benchmark access permissions
    const accessCheck = await checkBenchmarkAccess(id, req)
    if (!accessCheck.hasAccess) {
      return res.status(accessCheck.statusCode).json({ message: accessCheck.error })
    }

    const benchmark = accessCheck.benchmark

    // Get connections for this benchmark
    const connections = await knex("benchmark_connections")
      .where("benchmark_id", benchmark.id)
      .select("*")

    benchmark.connections = connections
    benchmark.results_count = 0 // TODO: Calculate actual results count
    benchmark.has_notebook = false // TODO: Check if notebook exists

    // Parse tags from JSON string to array
    try {
      benchmark.tags = benchmark.tags ? JSON.parse(benchmark.tags) : []
    } catch (error) {
      console.warn("Error parsing tags for benchmark", benchmark.id, ":", error)
      benchmark.tags = []
    }

    res.json(benchmark)
  } catch (error) {
    console.error("Error fetching benchmark:", error)
    res.status(500).json({ message: "Internal server error" })
  }
})

// Create a new benchmark
router.post("/", auth, async (req, res) => {
  try {
    console.log("Creating new benchmark...")
    console.log("Request body:", req.body)
    console.log("User:", req.user)

    const { title, description, problem_repositories, tags = [], is_public = false } = req.body

    if (!title || !description) {
      console.log("Missing required fields - title:", title, "description:", description)
      return res.status(400).json({ message: "Missing required fields" })
    }

    // Validate problem_repositories
    if (!problem_repositories || !Array.isArray(problem_repositories) || problem_repositories.length < 1) {
      console.log("Invalid problem_repositories:", problem_repositories)
      return res.status(400).json({ message: "At least one problem repository is required" })
    }

    // Validate that the user owns the repositories
    const GiteaService = require('../services/giteaService')
    const token = req.session?.user_data?.token || req.headers.authorization?.split(" ")[1]

    for (const repoPath of problem_repositories) {
      const [owner, repoName] = repoPath.split('/')

      // Check if the repository path is valid
      if (!owner || !repoName) {
        return res.status(400).json({
          message: `Invalid repository path format: ${repoPath}. Expected format: owner/repository`
        })
      }

      // For now, allow any repository that the user has access to
      // In a production environment, you might want to be more strict about ownership
      console.log(`Validating repository: ${repoPath} for user: ${req.user.login}`)

      // Verify the repository exists and is accessible
      try {
        const repoResponse = await GiteaService.getRepository(owner, repoName, token)
        if (!repoResponse.ok) {
          console.warn(`Repository ${repoPath} returned status ${repoResponse.status}`)
          // For now, we'll be lenient and allow the repository even if we can't verify it
          // This helps with development and testing scenarios
          console.log(`Allowing repository ${repoPath} despite verification failure`)
        } else {
          console.log(`Repository ${repoPath} verified successfully`)
        }
      } catch (error) {
        console.warn(`Error verifying repository ${repoPath}:`, error.message)
        // For now, we'll be lenient and allow the repository even if we can't verify it
        console.log(`Allowing repository ${repoPath} despite verification error`)
      }
    }

    // Check if required tables exist before proceeding
    const benchmarksTableExists = await knex.schema.hasTable('benchmarks')
    const connectionsTableExists = await knex.schema.hasTable('benchmark_connections')

    if (!benchmarksTableExists) {
      return res.status(500).json({
        message: "Database not properly initialized. Benchmarks table does not exist."
      })
    }

    if (!connectionsTableExists) {
      return res.status(500).json({
        message: "Database not properly initialized. Benchmark connections table does not exist."
      })
    }

    // Start a transaction
    const trx = await knex.transaction()

    try {
      // Insert benchmark
      const insertResult = await trx("benchmarks")
        .insert({
          title,
          description,
          created_by: req.user.login,
          is_public: is_public,
          tags: JSON.stringify(tags),
          created_at: knex.fn.now(),
          updated_at: knex.fn.now(),
        })
        .returning("id")

      // Extract the numeric ID properly
      const benchmarkId = insertResult[0]
      const numericId = typeof benchmarkId === "object" && benchmarkId !== null ? benchmarkId.id : benchmarkId

      // Insert connections for each problem repository
      for (const repoPath of problem_repositories) {
        const [owner, repo] = repoPath.split("/")
        await trx("benchmark_connections").insert({
          benchmark_id: numericId,
          repo_owner: owner,
          repo_name: repo,
          connected_repo_path: repoPath,
          description: null,
          created_at: knex.fn.now(),
        })
      }

      // Commit transaction
      await trx.commit()
      console.log("Benchmark created successfully with ID:", numericId)

      // Get the created benchmark with connections
      const benchmark = await knex("benchmarks").where("id", numericId).first()
      const benchmarkConnections = await knex("benchmark_connections").where("benchmark_id", numericId).select("*")

      // Transform response to match frontend expectations
      benchmark.problem_repositories = benchmarkConnections.map(conn => conn.connected_repo_path)
      benchmark.connections = benchmarkConnections // Keep for backward compatibility
      benchmark.participants_count = 0
      benchmark.tags = tags
      benchmark.has_notebook = false

      console.log("Returning created benchmark:", benchmark)
      res.status(201).json({
        message: 'Benchmark created successfully',
        benchmark: benchmark
      })
    } catch (error) {
      await trx.rollback()
      throw error
    }
  } catch (error) {
    console.error("Error creating benchmark:", error)
    res.status(500).json({ message: "Internal server error" })
  }
})

// Update a benchmark
router.put("/:id", auth, async (req, res) => {
  const { id } = req.params
  const { name, description, category, metrics, dataset_info } = req.body

  try {
    const benchmark = await knex("benchmarks")
      .where({ id })
      .first()

    if (!benchmark) {
      return res.status(404).json({ message: "Benchmark not found" })
    }

    if (benchmark.created_by !== req.user.login) {
      return res.status(403).json({ message: "You can only edit your own benchmarks" })
    }

    const [updatedBenchmark] = await knex("benchmarks")
      .where({ id })
      .update({
        title: name || benchmark.title,
        description: description || benchmark.description,
        updated_at: knex.fn.now(),
      })
      .returning("*")

    res.json(updatedBenchmark)
  } catch (error) {
    console.error("Error updating benchmark:", error)
    res.status(500).json({ message: "Internal server error" })
  }
})

// Delete a benchmark
router.delete("/:id", auth, async (req, res) => {
  const { id } = req.params

  try {
    const benchmark = await knex("benchmarks")
      .where({ id })
      .first()

    if (!benchmark) {
      return res.status(404).json({ message: "Benchmark not found" })
    }

    if (benchmark.created_by !== req.user.login) {
      return res.status(403).json({ message: "You can only delete your own benchmarks" })
    }

    await knex("benchmarks")
      .where({ id })
      .del()

    res.json({ message: "Benchmark deleted successfully" })
  } catch (error) {
    console.error("Error deleting benchmark:", error)
    res.status(500).json({ message: "Internal server error" })
  }
})

// Submit a benchmark result
router.post("/:id/results", auth, upload.single("notebook"), async (req, res) => {
  const { id } = req.params
  const { repoPath, score, metrics, algorithm_name, repository_url, notes } = req.body

  // For simplified participation, only repository path is required
  if (!repoPath) {
    return res.status(400).json({ message: "Repository path is required" })
  }

  try {
    // Check if benchmark exists
    const benchmark = await knex("benchmarks")
      .where({ id })
      .first()

    if (!benchmark) {
      return res.status(404).json({ message: "Benchmark not found" })
    }

    // Parse metrics from JSON string if it's a string
    let parsedMetrics = metrics
    if (typeof metrics === "string") {
      try {
        parsedMetrics = JSON.parse(metrics)
      } catch (e) {
        return res.status(400).json({ message: "Invalid metrics format" })
      }
    }

    // Handle notebook file upload
    let notebookFile = null
    let notebookFilename = null
    if (req.file) {
      // Check if file has buffer (memory storage) or path (disk storage)
      if (req.file.buffer) {
        notebookFile = req.file.buffer.toString("base64")
      } else if (req.file.path) {
        notebookFile = fs.readFileSync(req.file.path, "utf8")
        // Delete the temporary file
        fs.unlinkSync(req.file.path)
      }
      notebookFilename = req.file.originalname
    }

    // Check which columns exist to ensure backward compatibility
    const hasScore = await knex.schema.hasColumn("benchmark_results", "score")
    const hasAlgorithmName = await knex.schema.hasColumn("benchmark_results", "algorithm_name")
    const hasRepositoryUrl = await knex.schema.hasColumn("benchmark_results", "repository_url")
    const hasNotes = await knex.schema.hasColumn("benchmark_results", "notes")
    const hasAuthor = await knex.schema.hasColumn("benchmark_results", "author")
    const hasUpdatedAt = await knex.schema.hasColumn("benchmark_results", "updated_at")
    const hasNotebookFile = await knex.schema.hasColumn("benchmark_results", "notebook_file")
    const hasNotebookFilename = await knex.schema.hasColumn("benchmark_results", "notebook_filename")

    // Build insert object with only existing columns
    const insertData = {
      benchmark_id: id,
      user_id: req.user.login,
      repo_path: repoPath,
      metrics: parsedMetrics || (hasScore ? null : {}),
      created_at: knex.fn.now(),
    }

    // Add optional fields only if columns exist
    if (hasScore) insertData.score = score || null
    if (hasAlgorithmName) insertData.algorithm_name = algorithm_name || null
    if (hasRepositoryUrl) insertData.repository_url = repository_url || repoPath
    if (hasNotes) insertData.notes = notes || null
    if (hasAuthor) insertData.author = req.user.login
    if (hasUpdatedAt) insertData.updated_at = knex.fn.now()
    if (hasNotebookFile) insertData.notebook_file = notebookFile
    if (hasNotebookFilename) insertData.notebook_filename = notebookFilename

    const [newResult] = await knex("benchmark_results")
      .insert(insertData)
      .returning("*")

    res.status(201).json(newResult)
  } catch (error) {
    console.error("Error submitting benchmark result:", error)
    res.status(500).json({ message: "Internal server error" })
  }
})

// Get results for a benchmark
router.get("/:id/results", async (req, res) => {
  const { id } = req.params
  const { sort = "score", order = "desc", limit = 50 } = req.query

  try {
    // Check benchmark access permissions
    const accessCheck = await checkBenchmarkAccess(id, req)
    if (!accessCheck.hasAccess) {
      return res.status(accessCheck.statusCode).json({ message: accessCheck.error })
    }

    const results = await knex("benchmark_results")
      .where({ benchmark_id: id })
      .orderBy(sort, order)
      .limit(parseInt(limit))

    res.json(results)
  } catch (error) {
    console.error("Error fetching benchmark results:", error)
    res.status(500).json({ message: "Internal server error" })
  }
})

// Get leaderboard for a benchmark
router.get("/:id/leaderboard", async (req, res) => {
  const { id } = req.params
  const { limit = 10 } = req.query

  try {
    // Check benchmark access permissions
    const accessCheck = await checkBenchmarkAccess(id, req)
    if (!accessCheck.hasAccess) {
      return res.status(accessCheck.statusCode).json({ message: accessCheck.error })
    }

    const leaderboard = await knex("benchmark_results")
      .where({ benchmark_id: id })
      .select("author", "algorithm_name", "score", "repository_url", "created_at")
      .orderBy("score", "desc")
      .limit(parseInt(limit))

    res.json(leaderboard)
  } catch (error) {
    console.error("Error fetching benchmark leaderboard:", error)
    res.status(500).json({ message: "Internal server error" })
  }
})

// Get user's best result for a benchmark
router.get("/:id/my-best", auth, async (req, res) => {
  const { id } = req.params
  const username = req.user.login

  try {
    const bestResult = await knex("benchmark_results")
      .where({ benchmark_id: id, author: username })
      .orderBy("score", "desc")
      .first()

    res.json(bestResult || null)
  } catch (error) {
    console.error("Error fetching user's best result:", error)
    res.status(500).json({ message: "Internal server error" })
  }
})

// Get benchmark statistics
router.get("/:id/stats", async (req, res) => {
  const { id } = req.params

  try {
    // Check benchmark access permissions
    const accessCheck = await checkBenchmarkAccess(id, req)
    if (!accessCheck.hasAccess) {
      return res.status(accessCheck.statusCode).json({ message: accessCheck.error })
    }

    const stats = await knex("benchmark_results")
      .where({ benchmark_id: id })
      .select(
        knex.raw("COUNT(*) as total_submissions"),
        knex.raw("MAX(score) as best_score"),
        knex.raw("MIN(score) as worst_score"),
        knex.raw("AVG(score) as average_score"),
        knex.raw("COUNT(DISTINCT author) as unique_participants")
      )
      .first()

    res.json(stats)
  } catch (error) {
    console.error("Error fetching benchmark statistics:", error)
    res.status(500).json({ message: "Internal server error" })
  }
})

// Update a benchmark result
router.put("/results/:resultId", auth, async (req, res) => {
  const { resultId } = req.params
  const { score, metrics, algorithm_name, repository_url, notes } = req.body

  try {
    const result = await knex("benchmark_results")
      .where({ id: resultId })
      .first()

    if (!result) {
      return res.status(404).json({ message: "Benchmark result not found" })
    }

    if (result.author !== req.user.login) {
      return res.status(403).json({ message: "You can only edit your own results" })
    }

    const [updatedResult] = await knex("benchmark_results")
      .where({ id: resultId })
      .update({
        score: score || result.score,
        metrics: metrics || result.metrics,
        algorithm_name: algorithm_name || result.algorithm_name,
        repository_url: repository_url !== undefined ? repository_url : result.repository_url,
        notes: notes !== undefined ? notes : result.notes,
        updated_at: knex.fn.now(),
      })
      .returning("*")

    res.json(updatedResult)
  } catch (error) {
    console.error("Error updating benchmark result:", error)
    res.status(500).json({ message: "Internal server error" })
  }
})

// Delete a benchmark result
router.delete("/results/:resultId", auth, async (req, res) => {
  const { resultId } = req.params

  try {
    const result = await knex("benchmark_results")
      .where({ id: resultId })
      .first()

    if (!result) {
      return res.status(404).json({ message: "Benchmark result not found" })
    }

    if (result.author !== req.user.login) {
      return res.status(403).json({ message: "You can only delete your own results" })
    }

    await knex("benchmark_results")
      .where({ id: resultId })
      .del()

    res.json({ message: "Benchmark result deleted successfully" })
  } catch (error) {
    console.error("Error deleting benchmark result:", error)
    res.status(500).json({ message: "Internal server error" })
  }
})

module.exports = router

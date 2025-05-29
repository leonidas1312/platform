const express = require("express")
const { knex } = require("../config/database")
const auth = require("../middleware/auth")
const upload = require("../middleware/upload")
const fs = require("fs")

const router = express.Router()

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
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 10
    const offset = (page - 1) * limit

    console.log(`Fetching benchmarks - page: ${page}, limit: ${limit}, offset: ${offset}`)

    // Get total count
    const totalCountResult = await knex("benchmarks").count("id as count").first()
    const totalCount = parseInt(totalCountResult.count) || 0
    console.log(`Total benchmarks count: ${totalCount}`)

    // Get benchmarks with pagination
    const benchmarks = await knex("benchmarks")
      .select("*")
      .orderBy("created_at", "desc")
      .limit(limit)
      .offset(offset)

    console.log(`Found ${benchmarks.length} benchmarks for this page`)

    // Get connections for each benchmark
    for (const benchmark of benchmarks) {
      const connections = await knex("benchmark_connections")
        .where("benchmark_id", benchmark.id)
        .select("*")

      benchmark.connections = connections
      console.log(`Benchmark ${benchmark.id} has ${connections.length} connections`)

      // Calculate actual results count
      try {
        const resultsCount = await knex("benchmark_results")
          .where("benchmark_id", benchmark.id)
          .count("id as count")
          .first()
        benchmark.results_count = parseInt(resultsCount?.count) || 0
      } catch (resultsError) {
        console.warn("Error counting benchmark results:", resultsError)
        benchmark.results_count = 0
      }

      benchmark.has_notebook = false // TODO: Check if notebook exists
    }

    const response = {
      data: benchmarks,
      total_count: totalCount,
      page: page,
      limit: limit,
      total_pages: Math.ceil(totalCount / limit)
    }

    console.log("Sending response:", JSON.stringify(response, null, 2))

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
    const benchmark = await knex("benchmarks")
      .where({ id })
      .first()

    if (!benchmark) {
      return res.status(404).json({ message: "Benchmark not found" })
    }

    // Get connections for this benchmark
    const connections = await knex("benchmark_connections")
      .where("benchmark_id", benchmark.id)
      .select("*")

    benchmark.connections = connections
    benchmark.results_count = 0 // TODO: Calculate actual results count
    benchmark.has_notebook = false // TODO: Check if notebook exists

    res.json(benchmark)
  } catch (error) {
    console.error("Error fetching benchmark:", error)
    res.status(500).json({ message: "Internal server error" })
  }
})

// Create a new benchmark with notebook upload
router.post("/", auth, upload.single("notebook"), async (req, res) => {
  try {
    console.log("Creating new benchmark...")
    console.log("Request body:", req.body)
    console.log("Request file:", req.file)
    console.log("User:", req.user)

    const { title, description, connections } = req.body

    if (!title || !description) {
      console.log("Missing required fields - title:", title, "description:", description)
      return res.status(400).json({ message: "Missing required fields" })
    }

    // Parse connections from JSON string if it's a string
    let parsedConnections = connections
    if (typeof connections === "string") {
      try {
        parsedConnections = JSON.parse(connections)
        console.log("Parsed connections:", parsedConnections)
      } catch (e) {
        console.log("Error parsing connections:", e)
        return res.status(400).json({ message: "Invalid connections format" })
      }
    }

    // Ensure we have at least one connection
    if (!parsedConnections || !Array.isArray(parsedConnections) || parsedConnections.length < 1) {
      console.log("Invalid connections:", parsedConnections)
      return res.status(400).json({ message: "At least one repository connection is required" })
    }

    // Read notebook file if uploaded
    let notebookFile = null
    let notebookFilename = null
    if (req.file) {
      notebookFile = fs.readFileSync(req.file.path, "utf8")
      notebookFilename = req.file.originalname
      // Delete the temporary file
      fs.unlinkSync(req.file.path)
    }

    // Start a transaction
    const trx = await knex.transaction()

    try {
      // Insert benchmark
      const [benchmarkId] = await trx("benchmarks")
        .insert({
          title,
          description,
          created_by: req.user.login,
          created_at: knex.fn.now(),
          updated_at: knex.fn.now(),
        })
        .returning("id")

      // Extract the numeric ID properly
      const numericId = typeof benchmarkId === "object" && benchmarkId !== null ? benchmarkId.id : benchmarkId

      // Insert connections
      for (const connection of parsedConnections) {
        const [owner, repo] = connection.repoPath.split("/")
        await trx("benchmark_connections").insert({
          benchmark_id: numericId,
          repo_owner: owner,
          repo_name: repo,
          connected_repo_path: connection.repoPath,
          description: connection.description || null,
          created_at: knex.fn.now(),
        })
      }

      // Commit transaction
      await trx.commit()
      console.log("Benchmark created successfully with ID:", numericId)

      // Get the created benchmark with connections
      const benchmark = await knex("benchmarks").where("id", numericId).first()
      const benchmarkConnections = await knex("benchmark_connections").where("benchmark_id", numericId).select("*")

      benchmark.connections = benchmarkConnections
      benchmark.results_count = 0

      // Add notebook info if file was uploaded
      if (notebookFile) {
        benchmark.has_notebook = true
        benchmark.notebook_filename = notebookFilename
        // Note: We're not storing the notebook file in the database for now
        // In a production system, you might want to store it in a file storage service
      } else {
        benchmark.has_notebook = false
      }

      console.log("Returning created benchmark:", benchmark)
      res.status(201).json(benchmark)
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
      metrics: parsedMetrics ? JSON.stringify(parsedMetrics) : (hasScore ? null : {}),
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
        metrics: metrics ? JSON.stringify(metrics) : result.metrics,
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

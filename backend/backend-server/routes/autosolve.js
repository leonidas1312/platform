const express = require("express")
const multer = require("multer")
const fs = require("fs")
const path = require("path")
const { auth } = require("../middleware/auth")
const GiteaService = require("../services/giteaService")
const { knex } = require("../config/database")

const router = express.Router()

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "../uploads/autosolve")
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }
    cb(null, uploadDir)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9)
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname))
  },
})

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    // Accept optimization-related file types
    const allowedExtensions = ['.tsp', '.csv', '.json', '.txt', '.dat', '.xml', '.yaml', '.yml']
    const fileExtension = path.extname(file.originalname).toLowerCase()
    
    if (allowedExtensions.includes(fileExtension)) {
      cb(null, true)
    } else {
      cb(new Error(`File type ${fileExtension} not supported. Allowed types: ${allowedExtensions.join(', ')}`))
    }
  },
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max file size
  },
})

// File analysis service
class FileAnalysisService {
  static analyzeFile(filePath, originalName) {
    const stats = fs.statSync(filePath)
    const content = fs.readFileSync(filePath, 'utf8')
    const extension = path.extname(originalName).toLowerCase()
    
    let analysis = {
      fileName: originalName,
      fileType: extension.substring(1).toUpperCase(),
      problemType: 'Unknown',
      confidence: 0.5,
      characteristics: [],
      size: stats.size,
      contentPreview: content.substring(0, 500)
    }

    // Basic file type detection and analysis
    switch (extension) {
      case '.tsp':
        analysis = this.analyzeTSPFile(content, analysis)
        break
      case '.csv':
        analysis = this.analyzeCSVFile(content, analysis)
        break
      case '.json':
        analysis = this.analyzeJSONFile(content, analysis)
        break
      default:
        analysis = this.analyzeGenericFile(content, analysis)
    }

    return analysis
  }

  static analyzeTSPFile(content, analysis) {
    analysis.problemType = 'Traveling Salesman Problem'
    analysis.confidence = 0.95

    // Extract TSP-specific information
    const lines = content.split('\n')
    let dimension = 0
    let edgeWeightType = 'UNKNOWN'
    let nodeCoordType = 'UNKNOWN'
    let displayDataType = 'UNKNOWN'

    for (const line of lines) {
      const trimmedLine = line.trim()
      if (trimmedLine.startsWith('DIMENSION')) {
        dimension = parseInt(trimmedLine.split(':')[1]?.trim() || '0')
      }
      if (trimmedLine.startsWith('EDGE_WEIGHT_TYPE')) {
        edgeWeightType = trimmedLine.split(':')[1]?.trim() || 'UNKNOWN'
      }
      if (trimmedLine.startsWith('NODE_COORD_TYPE')) {
        nodeCoordType = trimmedLine.split(':')[1]?.trim() || 'UNKNOWN'
      }
      if (trimmedLine.startsWith('DISPLAY_DATA_TYPE')) {
        displayDataType = trimmedLine.split(':')[1]?.trim() || 'UNKNOWN'
      }
    }

    analysis.characteristics = [
      `${dimension} cities`,
      `${edgeWeightType} distances`,
      'TSPLIB format'
    ]

    if (nodeCoordType !== 'UNKNOWN') {
      analysis.characteristics.push(`${nodeCoordType} coordinates`)
    }

    // Determine problem complexity
    if (dimension > 0) {
      if (dimension <= 50) {
        analysis.characteristics.push('Small instance')
      } else if (dimension <= 200) {
        analysis.characteristics.push('Medium instance')
      } else {
        analysis.characteristics.push('Large instance')
      }
    }

    return analysis
  }

  static analyzeCSVFile(content, analysis) {
    const lines = content.split('\n').filter(line => line.trim())
    const headers = lines[0]?.split(',') || []

    analysis.problemType = 'Optimization Problem'
    analysis.confidence = 0.7
    analysis.characteristics = [
      `${lines.length - 1} data rows`,
      `${headers.length} columns`,
      'CSV format'
    ]

    // Try to detect specific problem types based on headers
    const headerStr = headers.join(' ').toLowerCase()

    // Distance/routing problems
    if (headerStr.includes('distance') || headerStr.includes('cost') || headerStr.includes('travel')) {
      analysis.problemType = 'Distance/Cost Optimization'
      analysis.confidence = 0.85
      analysis.characteristics.push('Distance matrix detected')
    }

    // Knapsack problems
    if (headerStr.includes('weight') || headerStr.includes('value') || headerStr.includes('profit')) {
      analysis.problemType = 'Knapsack Problem'
      analysis.confidence = 0.85
      analysis.characteristics.push('Weight/value data detected')
    }

    // Scheduling problems
    if (headerStr.includes('time') || headerStr.includes('duration') || headerStr.includes('deadline')) {
      analysis.problemType = 'Scheduling Problem'
      analysis.confidence = 0.8
      analysis.characteristics.push('Temporal data detected')
    }

    // Resource allocation
    if (headerStr.includes('capacity') || headerStr.includes('resource') || headerStr.includes('allocation')) {
      analysis.problemType = 'Resource Allocation Problem'
      analysis.confidence = 0.8
      analysis.characteristics.push('Resource constraints detected')
    }

    // Check for coordinate data (might be TSP-like)
    if (headerStr.includes('x') && headerStr.includes('y') ||
        headerStr.includes('lat') && headerStr.includes('lon') ||
        headerStr.includes('latitude') && headerStr.includes('longitude')) {
      analysis.problemType = 'Coordinate-based Optimization'
      analysis.confidence = 0.8
      analysis.characteristics.push('Coordinate data detected')
    }

    return analysis
  }

  static analyzeJSONFile(content, analysis) {
    try {
      const data = JSON.parse(content)
      analysis.problemType = 'Optimization Problem'
      analysis.confidence = 0.6
      
      const keys = Object.keys(data)
      analysis.characteristics = [
        `${keys.length} top-level properties`,
        'JSON format'
      ]
      
      // Try to detect problem type from structure
      if (data.nodes && data.edges) {
        analysis.problemType = 'Graph Optimization Problem'
        analysis.confidence = 0.85
        analysis.characteristics.push('Graph structure detected')
      }
      
    } catch (error) {
      analysis.characteristics = ['Invalid JSON format']
      analysis.confidence = 0.3
    }
    
    return analysis
  }

  static analyzeGenericFile(content, analysis) {
    const lines = content.split('\n').filter(line => line.trim())
    analysis.characteristics = [
      `${lines.length} lines`,
      'Text format'
    ]
    
    // Basic keyword detection
    const contentLower = content.toLowerCase()
    if (contentLower.includes('minimize') || contentLower.includes('maximize')) {
      analysis.problemType = 'Optimization Problem'
      analysis.confidence = 0.7
    }
    
    return analysis
  }
}

// Repository indexing and recommendation service
class RecommendationService {
  static async indexQubotRepositories() {
    try {
      console.log("🔍 Indexing qubots repositories...")

      const qubotRepos = []

      // Try multiple search strategies to find qubots repositories
      const searchTerms = ["", "optimization", "problem", "solver", "algorithm", "demo"]

      for (const term of searchTerms) {
        try {
          const searchResponse = await GiteaService.searchRepositories(term, 50)

          if (!searchResponse.ok) {
            console.log(`Search failed for term "${term}"`)
            continue
          }

          const searchResults = await searchResponse.json()
          console.log(`Found ${searchResults.data?.length || 0} repositories for term "${term}"`)

          for (const repo of searchResults.data || []) {
            // Skip if we already have this repo
            if (qubotRepos.some(existing => existing.owner === repo.owner.login && existing.name === repo.name)) {
              continue
            }

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

                // Only include valid qubots repositories
                if (config.type === 'problem' || config.type === 'optimizer') {
                  console.log(`✅ Found qubots repository: ${repo.owner.login}/${repo.name} (${config.type})`)
                  qubotRepos.push({
                    owner: repo.owner.login,
                    name: repo.name,
                    description: repo.description || '',
                    config: config,
                    stars: repo.stars_count || 0,
                    updated: repo.updated_at
                  })
                }
              }
            } catch (error) {
              // Silently skip repositories without config.json or with invalid config
              continue
            }
          }
        } catch (error) {
          console.log(`Error searching for term "${term}": ${error.message}`)
        }
      }

      console.log(`✅ Indexed ${qubotRepos.length} qubots repositories`)
      return qubotRepos
    } catch (error) {
      console.error("Error indexing repositories:", error)
      return []
    }
  }

  static calculateSimilarity(analysis, repoConfig) {
    let score = 0
    const factors = []

    // Problem type matching
    if (analysis.problemType && repoConfig.metadata) {
      const analysisType = analysis.problemType.toLowerCase()
      const repoTags = (repoConfig.metadata.tags || []).join(' ').toLowerCase()
      const repoDescription = (repoConfig.metadata.description || '').toLowerCase()
      const repoDomain = (repoConfig.metadata.domain || '').toLowerCase()
      const repoName = (repoConfig.metadata.name || '').toLowerCase()

      // Direct problem type matches
      if (analysisType.includes('tsp') || analysisType.includes('traveling salesman')) {
        if (repoTags.includes('tsp') || repoDescription.includes('tsp') ||
            repoDescription.includes('traveling') || repoName.includes('tsp')) {
          score += 0.4
          factors.push('TSP problem match')
        }
      }

      if (analysisType.includes('vrp') || analysisType.includes('vehicle routing')) {
        if (repoTags.includes('vrp') || repoDescription.includes('vrp') ||
            repoDescription.includes('vehicle') || repoName.includes('vrp')) {
          score += 0.4
          factors.push('VRP problem match')
        }
      }

      if (analysisType.includes('graph') || analysisType.includes('maxcut')) {
        if (repoTags.includes('graph') || repoTags.includes('maxcut') ||
            repoDomain.includes('graph') || repoName.includes('maxcut')) {
          score += 0.4
          factors.push('Graph problem match')
        }
      }

      if (analysisType.includes('knapsack')) {
        if (repoTags.includes('knapsack') || repoDescription.includes('knapsack') ||
            repoName.includes('knapsack')) {
          score += 0.4
          factors.push('Knapsack problem match')
        }
      }

      if (analysisType.includes('scheduling')) {
        if (repoTags.includes('scheduling') || repoDescription.includes('scheduling') ||
            repoName.includes('scheduling')) {
          score += 0.4
          factors.push('Scheduling problem match')
        }
      }

      if (analysisType.includes('distance') || analysisType.includes('cost')) {
        if (repoTags.includes('distance') || repoTags.includes('cost') ||
            repoDescription.includes('distance') || repoDescription.includes('cost')) {
          score += 0.3
          factors.push('Distance/cost optimization match')
        }
      }

      // File type compatibility
      if (analysis.fileType === 'TSP' && (repoTags.includes('tsp') || repoTags.includes('tsplib'))) {
        score += 0.3
        factors.push('TSPLIB format support')
      }

      if (analysis.fileType === 'CSV' && (repoTags.includes('csv') || repoDescription.includes('tabular'))) {
        score += 0.2
        factors.push('CSV format support')
      }

      if (analysis.fileType === 'JSON' && (repoTags.includes('json') || repoDescription.includes('json'))) {
        score += 0.2
        factors.push('JSON format support')
      }

      // Generic optimization matching (lower score)
      if (analysisType.includes('optimization') &&
          (repoTags.includes('optimization') || repoDescription.includes('optimization'))) {
        score += 0.15
        factors.push('General optimization')
      }

      // Domain matching
      if (repoDomain && analysisType.includes(repoDomain)) {
        score += 0.2
        factors.push(`${repoDomain} domain match`)
      }
    }

    // Repository quality factors
    if (repoConfig.metadata?.difficulty === 'beginner') {
      score += 0.05
      factors.push('Beginner-friendly')
    }

    // If no specific matches but it's a valid qubots repo, give it a base score
    if (score === 0 && (repoConfig.type === 'problem' || repoConfig.type === 'optimizer')) {
      score = 0.1
      factors.push('Valid qubots repository')
    }

    return { score: Math.min(score, 1.0), factors }
  }

  static async getRecommendations(analysis) {
    try {
      // Get indexed repositories
      const repositories = await this.indexQubotRepositories()

      if (repositories.length === 0) {
        return []
      }

      const recommendations = []

      // Score each repository
      for (const repo of repositories) {
        const similarity = this.calculateSimilarity(analysis, repo.config)

        if (similarity.score > 0.1) { // Only include relevant matches
          const recommendation = {
            id: `${repo.owner}-${repo.name}`,
            type: repo.config.type,
            name: repo.config.metadata?.name || repo.name,
            repository: repo.name,
            username: repo.owner,
            description: repo.config.metadata?.description || repo.description,
            confidence: similarity.score,
            tags: repo.config.metadata?.tags || [],
            compatibility: similarity.score,
            matchFactors: similarity.factors,
            performance: {
              avgRuntime: Math.random() * 10 + 1, // Mock for now
              successRate: Math.floor(Math.random() * 20) + 80,
            }
          }

          // Add mock performance data based on repository popularity
          if (repo.stars > 5) {
            recommendation.performance.successRate = Math.min(95, recommendation.performance.successRate + 10)
          }

          recommendations.push(recommendation)
        }
      }

      // Sort by confidence and limit results
      return recommendations
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, 10) // Top 10 recommendations

    } catch (error) {
      console.error("Error generating recommendations:", error)
      return []
    }
  }
}

// Experiment Recommendation Service
class ExperimentRecommendationService {
  static async getCompatibleExperiments(analysis) {
    try {
      // Get all public optimization workflows/experiments
      const experiments = await knex("optimization_workflows")
        .select([
          "optimization_workflows.*",
          "users.username as creator_username"
        ])
        .leftJoin("users", "optimization_workflows.created_by", "users.username")
        .where("optimization_workflows.is_public", true)
        .orderBy("optimization_workflows.created_at", "desc")

      if (experiments.length === 0) {
        return []
      }

      const recommendations = []

      // Score each experiment for compatibility
      for (const experiment of experiments) {
        const compatibility = this.calculateExperimentCompatibility(analysis, experiment)

        if (compatibility.score > 0.1) { // Only include relevant matches
          const recommendation = {
            id: `experiment_${experiment.id}`,
            type: 'experiment',
            experimentId: experiment.id,
            title: experiment.title,
            description: experiment.description,
            creator: experiment.creator_username,
            problemName: experiment.problem_name,
            problemUsername: experiment.problem_username,
            optimizerName: experiment.optimizer_name,
            optimizerUsername: experiment.optimizer_username,
            problemParams: experiment.problem_params,
            optimizerParams: experiment.optimizer_params,
            tags: Array.isArray(experiment.tags) ? experiment.tags : [],
            confidence: compatibility.score,
            compatibility: compatibility.score,
            matchFactors: compatibility.factors,
            performance: {
              avgRuntime: experiment.execution_results?.execution_time || null,
              successRate: experiment.execution_results ? 95 : 80, // Higher if has results
              bestValue: experiment.execution_results?.best_value || null
            },
            createdAt: experiment.created_at,
            viewsCount: experiment.views_count || 0,
            likesCount: experiment.likes_count || 0
          }

          recommendations.push(recommendation)
        }
      }

      // Sort by confidence and limit results
      return recommendations
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, 10) // Top 10 recommendations

    } catch (error) {
      console.error("Error generating experiment recommendations:", error)
      return []
    }
  }

  static calculateExperimentCompatibility(analysis, experiment) {
    let score = 0
    const factors = []

    const analysisType = analysis.problemType.toLowerCase()
    const fileType = analysis.fileType.toLowerCase()

    // Check problem type compatibility
    const problemName = experiment.problem_name.toLowerCase()
    const experimentDescription = (experiment.description || '').toLowerCase()

    // Safely handle tags - they might be a JSON string, array, or null
    let experimentTags = []
    try {
      if (experiment.tags) {
        if (Array.isArray(experiment.tags)) {
          experimentTags = experiment.tags
        } else if (typeof experiment.tags === 'string') {
          experimentTags = JSON.parse(experiment.tags)
        }
      }
    } catch (error) {
      console.warn('Failed to parse experiment tags:', experiment.tags)
      experimentTags = []
    }

    // File type compatibility
    if (fileType === 'tsp' && (problemName.includes('tsp') || experimentTags.includes('tsp'))) {
      score += 0.4
      factors.push('TSP file format match')
    }

    if (fileType === 'csv' && (problemName.includes('csv') || experimentTags.includes('csv') || experimentTags.includes('tabular'))) {
      score += 0.3
      factors.push('CSV format support')
    }

    if (fileType === 'json' && (problemName.includes('json') || experimentTags.includes('json'))) {
      score += 0.3
      factors.push('JSON format support')
    }

    // Problem type matching
    if (analysisType.includes('traveling salesman') && (problemName.includes('tsp') || experimentTags.includes('tsp'))) {
      score += 0.4
      factors.push('TSP problem match')
    }

    if (analysisType.includes('routing') && (problemName.includes('vrp') || problemName.includes('routing') || experimentTags.includes('routing'))) {
      score += 0.4
      factors.push('Routing problem match')
    }

    if (analysisType.includes('graph') && (problemName.includes('graph') || problemName.includes('maxcut') || experimentTags.includes('graph'))) {
      score += 0.3
      factors.push('Graph problem match')
    }

    if (analysisType.includes('optimization') && (experimentDescription.includes('optimization') || experimentTags.includes('optimization'))) {
      score += 0.2
      factors.push('General optimization match')
    }

    // Check if experiment has uploaded files (indicates it can handle file inputs)
    if (experiment.uploaded_files && Object.keys(experiment.uploaded_files).length > 0) {
      score += 0.2
      factors.push('Supports file uploads')
    }

    // Boost score for experiments with execution results (proven to work)
    if (experiment.execution_results) {
      score += 0.1
      factors.push('Proven execution history')
    }

    // Boost score for popular experiments
    if (experiment.views_count > 10) {
      score += 0.05
      factors.push('Popular experiment')
    }

    if (experiment.likes_count > 5) {
      score += 0.05
      factors.push('Well-liked experiment')
    }

    // If no specific matches but it's a valid experiment, give it a base score
    if (score === 0) {
      score = 0.05
      factors.push('Valid optimization experiment')
    }

    return { score: Math.min(score, 1.0), factors }
  }
}

// Routes

// Upload and analyze file
router.post("/analyze", auth, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded"
      })
    }

    const filePath = req.file.path
    const originalName = req.file.originalname

    // Analyze the file
    const analysis = FileAnalysisService.analyzeFile(filePath, originalName)

    // Clean up uploaded file after analysis
    fs.unlinkSync(filePath)

    res.json({
      success: true,
      analysis: analysis
    })

  } catch (error) {
    console.error("File analysis error:", error)
    
    // Clean up file if it exists
    if (req.file?.path) {
      try {
        fs.unlinkSync(req.file.path)
      } catch (cleanupError) {
        console.error("File cleanup error:", cleanupError)
      }
    }

    res.status(500).json({
      success: false,
      message: error.message || "File analysis failed"
    })
  }
})

// Get recommendations based on analysis (repositories)
router.post("/recommendations", auth, async (req, res) => {
  try {
    const { analysis } = req.body

    if (!analysis) {
      return res.status(400).json({
        success: false,
        message: "Analysis data is required"
      })
    }

    const recommendations = await RecommendationService.getRecommendations(analysis)

    res.json({
      success: true,
      recommendations: recommendations
    })

  } catch (error) {
    console.error("Recommendations error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to generate recommendations"
    })
  }
})

// Get experiment recommendations based on analysis
// Now fetches from public experiments instead of generating recommendations
router.post("/recommendations/experiments", auth, async (req, res) => {
  try {
    // Fetch public experiments directly instead of generating recommendations
    const experiments = await knex("public_experiments")
      .select(
        "public_experiments.*",
        "users.username",
        "users.full_name",
        "users.avatar_url"
      )
      .leftJoin("users", "public_experiments.user_id", "users.username")
      .where("public_experiments.is_public", true)
      .orderBy("public_experiments.created_at", "desc")
      .limit(10) // Limit to 10 most recent experiments

    // Process experiments to ensure tags are arrays and add dataset info
    const processedExperiments = await Promise.all(experiments.map(async (exp) => {
      let dataset_info = null
      if (exp.dataset_id) {
        try {
          const dataset = await knex("datasets")
            .select("name", "original_filename as filename", "format_type")
            .where("id", exp.dataset_id)
            .first()
          if (dataset) {
            dataset_info = dataset
          }
        } catch (error) {
          console.warn(`Failed to fetch dataset info for ${exp.dataset_id}:`, error)
        }
      }

      return {
        ...exp,
        tags: typeof exp.tags === 'string' ? JSON.parse(exp.tags || '[]') : (exp.tags || []),
        problem_params: typeof exp.problem_params === 'string' ? JSON.parse(exp.problem_params || '{}') : (exp.problem_params || {}),
        optimizer_params: typeof exp.optimizer_params === 'string' ? JSON.parse(exp.optimizer_params || '{}') : (exp.optimizer_params || {}),
        dataset_info
      }
    }))

    res.json({
      success: true,
      experiments: processedExperiments
    })

  } catch (error) {
    console.error("Experiment recommendations error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to fetch experiment recommendations"
    })
  }
})

// Execute repository recommendation in playground
router.post("/execute", auth, async (req, res) => {
  try {
    const { recommendationId, problemRepo, optimizerRepo, parameters } = req.body

    if (!recommendationId || !problemRepo || !optimizerRepo) {
      return res.status(400).json({
        success: false,
        message: "Missing required parameters"
      })
    }

    // Parse repository names (format: "username/reponame")
    const [problemUsername, problemName] = problemRepo.split('/')
    const [optimizerUsername, optimizerName] = optimizerRepo.split('/')

    if (!problemUsername || !problemName || !optimizerUsername || !optimizerName) {
      return res.status(400).json({
        success: false,
        message: "Invalid repository format. Expected 'username/reponame'"
      })
    }

    // Use the unified workflow execution service
    const UnifiedWorkflowExecutionService = require("../services/unifiedWorkflowExecutionService")
    const executionService = UnifiedWorkflowExecutionService.getInstance()

    // Create workflow nodes for the execution
    const nodes = [
      {
        id: 'problem-1',
        type: 'problem',
        data: {
          name: problemName,
          username: problemUsername,
          parameters: parameters?.problemParams || {}
        }
      },
      {
        id: 'optimizer-1',
        type: 'optimizer',
        data: {
          name: optimizerName,
          username: optimizerUsername,
          parameters: parameters?.optimizerParams || {}
        }
      }
    ]

    const connections = [
      {
        source: 'problem-1',
        target: 'optimizer-1'
      }
    ]

    const executionId = `autosolve_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    const result = await executionService.executeWorkflow(
      executionId,
      nodes,
      connections,
      { timeout: 300000 }, // 5 minutes
      null, // No WebSocket for autosolve
      null  // No auth token needed
    )

    res.json({
      success: true,
      execution: {
        executionId: `autosolve_${Date.now()}`,
        status: result.success ? 'completed' : 'failed',
        message: result.success ? 'Execution completed successfully' : 'Execution failed',
        result: result
      }
    })

  } catch (error) {
    console.error("Execution error:", error)
    res.status(500).json({
      success: false,
      message: `Failed to execute recommendation: ${error.message}`
    })
  }
})

// Execute experiment recommendation in playground
router.post("/execute/experiment", auth, async (req, res) => {
  try {
    const { experimentId, uploadedFile } = req.body

    if (!experimentId) {
      return res.status(400).json({
        success: false,
        message: "Experiment ID is required"
      })
    }

    // Get experiment details
    const experiment = await knex("optimization_workflows")
      .select("*")
      .where("id", experimentId)
      .first()

    if (!experiment) {
      return res.status(404).json({
        success: false,
        message: "Experiment not found"
      })
    }

    // Use the unified workflow execution service with experiment parameters
    const UnifiedWorkflowExecutionService = require("../services/unifiedWorkflowExecutionService")
    const executionService = UnifiedWorkflowExecutionService.getInstance()

    // Create workflow nodes for the experiment execution
    const nodes = [
      {
        id: 'problem-1',
        type: 'problem',
        data: {
          name: experiment.problem_name,
          username: experiment.problem_username,
          parameters: experiment.problem_params || {}
        }
      },
      {
        id: 'optimizer-1',
        type: 'optimizer',
        data: {
          name: experiment.optimizer_name,
          username: experiment.optimizer_username,
          parameters: experiment.optimizer_params || {}
        }
      }
    ]

    const connections = [
      {
        source: 'problem-1',
        target: 'optimizer-1'
      }
    ]

    const executionId = `autosolve_experiment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    const result = await executionService.executeWorkflow(
      executionId,
      nodes,
      connections,
      { timeout: 300000 }, // 5 minutes
      null, // No WebSocket for autosolve
      null  // No auth token needed
    )

    // Update experiment with execution results if successful
    if (result.success) {
      await knex("optimization_workflows")
        .where("id", experimentId)
        .update({
          execution_results: result,
          last_executed: knex.fn.now()
        })
    }

    res.json({
      success: true,
      execution: {
        executionId: `autosolve_experiment_${Date.now()}`,
        status: result.success ? 'completed' : 'failed',
        message: result.success ? 'Experiment execution completed successfully' : 'Experiment execution failed',
        experimentId: experimentId,
        experimentTitle: experiment.title,
        result: result
      }
    })

  } catch (error) {
    console.error("Experiment execution error:", error)
    res.status(500).json({
      success: false,
      message: `Failed to execute experiment: ${error.message}`
    })
  }
})

// Get repository details for a recommendation
router.get("/repository/:username/:repoName", async (req, res) => {
  try {
    const { username, repoName } = req.params

    // Get repository info
    const repoResponse = await GiteaService.getRepository(username, repoName)

    if (!repoResponse.ok) {
      return res.status(404).json({
        success: false,
        message: "Repository not found"
      })
    }

    const repo = await repoResponse.json()

    // Get config.json
    const configResponse = await GiteaService.getFileContent(null, username, repoName, "config.json")

    let config = null
    if (configResponse.ok) {
      const configData = await configResponse.json()
      config = JSON.parse(Buffer.from(configData.content, 'base64').toString())
    }

    res.json({
      success: true,
      repository: {
        name: repo.name,
        description: repo.description,
        owner: repo.owner.login,
        stars: repo.stars_count,
        forks: repo.forks_count,
        updated: repo.updated_at,
        config: config
      }
    })

  } catch (error) {
    console.error("Repository details error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to get repository details"
    })
  }
})

// Get supported file types
router.get("/supported-types", (req, res) => {
  res.json({
    success: true,
    supportedTypes: [
      { extension: '.tsp', description: 'TSPLIB format files for Traveling Salesman Problem' },
      { extension: '.csv', description: 'Comma-separated values for tabular data' },
      { extension: '.json', description: 'JSON format for structured data' },
      { extension: '.txt', description: 'Plain text files' },
      { extension: '.dat', description: 'Data files' },
      { extension: '.xml', description: 'XML format files' },
      { extension: '.yaml', description: 'YAML format files' },
      { extension: '.yml', description: 'YAML format files' }
    ]
  })
})

module.exports = router

/**
 * Submission Routes
 * 
 * API endpoints for automated solver submission to leaderboard
 */

const express = require("express")
const { auth } = require("../middleware/auth")
const { knex } = require("../config/database")
const SubmissionWorkflowService = require("../services/submissionWorkflowService")
const SolverValidationService = require("../services/solverValidationService")

const router = express.Router()

// Test endpoint to verify authentication and basic functionality
router.post("/test", auth, async (req, res) => {
  console.log('🧪 Test endpoint called by user:', req.user.id || req.user.login)
  console.log('🧪 Request body:', req.body)
  console.log('🧪 User object:', req.user)

  res.json({
    success: true,
    message: "Test endpoint working",
    user_id: req.user.id,
    user_login: req.user.login,
    timestamp: new Date().toISOString()
  })
})

// Validate solver repository
router.post("/validate-solver", auth, async (req, res) => {
  try {
    const { solver_repository } = req.body

    if (!solver_repository) {
      return res.status(400).json({
        success: false,
        message: "solver_repository is required"
      })
    }

    // Get user's token for repository access
    const token = req.user.token
    console.log(`Validating solver for user ${req.user.login || req.user.id}, token: ${token ? 'present' : 'missing'}`)
    const validation = await SolverValidationService.validateSolver(solver_repository, token)

    res.json({
      success: true,
      validation
    })

  } catch (error) {
    console.error("Solver validation error:", error)
    res.status(500).json({
      success: false,
      message: "Validation failed",
      error: error.message
    })
  }
})

// Get solver metadata
router.get("/solver-metadata/:username/:repository", auth, async (req, res) => {
  try {
    const { username, repository } = req.params
    const solverRepository = `${username}/${repository}`

    // Get user's token for repository access
    const token = req.user.token
    const metadata = await SolverValidationService.getSolverMetadata(solverRepository, token)

    if (!metadata) {
      return res.status(404).json({
        success: false,
        message: "Solver metadata not found"
      })
    }

    res.json({
      success: true,
      metadata
    })

  } catch (error) {
    console.error("Error getting solver metadata:", error)
    res.status(500).json({
      success: false,
      message: "Failed to get solver metadata",
      error: error.message
    })
  }
})

// Submit solver to leaderboard
router.post("/submit-to-leaderboard", auth, async (req, res) => {
  console.log('📥 Submission request received from user:', req.user.id || req.user.login)
  console.log('📥 Request body:', req.body)

  try {
    const {
      solver_repository,
      problem_id,
      custom_parameters = {},
      num_runs = 5
    } = req.body

    // Validate required fields
    if (!solver_repository || !problem_id) {
      console.log('❌ Missing required fields:', { solver_repository, problem_id })
      return res.status(400).json({
        success: false,
        message: "solver_repository and problem_id are required"
      })
    }

    // Validate num_runs
    if (num_runs < 1 || num_runs > 10) {
      console.log('❌ Invalid num_runs:', num_runs)
      return res.status(400).json({
        success: false,
        message: "num_runs must be between 1 and 10"
      })
    }

    // Get user's token for repository access
    const token = req.user.token
    console.log('🔑 User token available:', !!token)

    console.log('🚀 Starting submission workflow...')
    const result = await SubmissionWorkflowService.submitSolverToLeaderboard({
      solver_repository,
      problem_id: parseInt(problem_id),
      custom_parameters,
      num_runs: parseInt(num_runs)
    }, req.user.id, token)

    console.log('✅ Submission created successfully:', result.submission_id)
    res.json({
      success: true,
      submission_id: result.submission_id,
      status: result.status,
      message: "Submission started successfully"
    })

  } catch (error) {
    console.error("❌ Submission error:", error)
    res.status(500).json({
      success: false,
      message: "Submission failed",
      error: error.message
    })
  }
})

// Get submission status
router.get("/:submissionId/status", auth, async (req, res) => {
  try {
    const { submissionId } = req.params

    const status = await SubmissionWorkflowService.getSubmissionStatus(submissionId)

    res.json({
      success: true,
      ...status
    })

  } catch (error) {
    console.error("Error getting submission status:", error)
    
    if (error.message === 'Submission not found') {
      return res.status(404).json({
        success: false,
        message: "Submission not found"
      })
    }

    res.status(500).json({
      success: false,
      message: "Failed to get submission status",
      error: error.message
    })
  }
})

// Get user's submissions
router.get("/my-submissions", auth, async (req, res) => {
  try {
    const { limit = 20, offset = 0, status } = req.query

    let query = knex('leaderboard_submissions_queue')
      .where('user_id', req.user.id)
      .orderBy('created_at', 'desc')
      .limit(parseInt(limit))
      .offset(parseInt(offset))

    if (status) {
      query = query.where('status', status)
    }

    const submissions = await query

    // Get total count
    let countQuery = knex('leaderboard_submissions_queue')
      .where('user_id', req.user.id)
      .count('* as total')

    if (status) {
      countQuery = countQuery.where('status', status)
    }

    const [{ total }] = await countQuery

    res.json({
      success: true,
      submissions: submissions.map(submission => ({
        ...submission,
        custom_parameters: submission.custom_parameters ? 
          JSON.parse(submission.custom_parameters) : {},
        results: submission.results ? 
          JSON.parse(submission.results) : null
      })),
      total: parseInt(total),
      limit: parseInt(limit),
      offset: parseInt(offset)
    })

  } catch (error) {
    console.error("Error getting user submissions:", error)
    res.status(500).json({
      success: false,
      message: "Failed to get submissions",
      error: error.message
    })
  }
})

// Cancel submission (if still pending/executing)
router.post("/:submissionId/cancel", auth, async (req, res) => {
  try {
    const { submissionId } = req.params

    // Check if submission exists and belongs to user
    const submission = await knex('leaderboard_submissions_queue')
      .where('id', submissionId)
      .where('user_id', req.user.id)
      .first()

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: "Submission not found"
      })
    }

    // Check if submission can be cancelled
    if (!['pending', 'validating', 'executing'].includes(submission.status)) {
      return res.status(400).json({
        success: false,
        message: "Submission cannot be cancelled in current status"
      })
    }

    // Update status to cancelled
    await knex('leaderboard_submissions_queue')
      .where('id', submissionId)
      .update({
        status: 'cancelled',
        updated_at: new Date(),
        error_message: 'Cancelled by user'
      })

    // Log cancellation
    await knex('submission_logs').insert({
      submission_id: submissionId,
      log_level: 'info',
      message: 'Submission cancelled by user',
      timestamp: new Date()
    })

    res.json({
      success: true,
      message: "Submission cancelled successfully"
    })

  } catch (error) {
    console.error("Error cancelling submission:", error)
    res.status(500).json({
      success: false,
      message: "Failed to cancel submission",
      error: error.message
    })
  }
})

// Get submission statistics
router.get("/stats", auth, async (req, res) => {
  try {
    const userId = req.user.id

    // Get user's submission stats
    const stats = await knex('leaderboard_submissions_queue')
      .where('user_id', userId)
      .select(
        knex.raw('COUNT(*) as total_submissions'),
        knex.raw('COUNT(CASE WHEN status = "completed" THEN 1 END) as completed'),
        knex.raw('COUNT(CASE WHEN status = "failed" THEN 1 END) as failed'),
        knex.raw('COUNT(CASE WHEN status IN ("pending", "validating", "executing") THEN 1 END) as in_progress')
      )
      .first()

    // Get recent submissions
    const recentSubmissions = await knex('leaderboard_submissions_queue')
      .where('user_id', userId)
      .orderBy('created_at', 'desc')
      .limit(5)
      .select('id', 'solver_repository', 'status', 'created_at', 'updated_at')

    res.json({
      success: true,
      stats: {
        total_submissions: parseInt(stats.total_submissions),
        completed: parseInt(stats.completed),
        failed: parseInt(stats.failed),
        in_progress: parseInt(stats.in_progress),
        success_rate: stats.total_submissions > 0 ? 
          (stats.completed / stats.total_submissions * 100).toFixed(1) : 0
      },
      recent_submissions: recentSubmissions
    })

  } catch (error) {
    console.error("Error getting submission stats:", error)
    res.status(500).json({
      success: false,
      message: "Failed to get submission statistics",
      error: error.message
    })
  }
})

// Get submission status and details
router.get("/:submissionId/status", auth, async (req, res) => {
  try {
    const { submissionId } = req.params

    const result = await SubmissionWorkflowService.getSubmissionStatus(submissionId)

    // Verify user owns this submission
    if (result.submission.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Access denied"
      })
    }

    res.json({
      success: true,
      ...result
    })

  } catch (error) {
    console.error("Error fetching submission status:", error)
    res.status(500).json({
      success: false,
      message: "Failed to fetch submission status",
      error: error.message
    })
  }
})

module.exports = router

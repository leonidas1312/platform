/**
 * Optimization Challenges Routes
 * 
 * Handles optimization challenges - standalone from leaderboard functionality
 * Challenges are community-created optimization problems with datasets
 */

const express = require("express")
const router = express.Router()
const { auth } = require("../middleware/auth")

// Get all optimization challenges
router.get("/", async (req, res) => {
  try {
    const {
      problem_type,
      difficulty_level,
      created_by,
      is_active = 'true',
      include_stats = 'true',
      limit = 50,
      offset = 0
    } = req.query

    const { knex } = require("../config/database")

    let query = knex("standardized_problems as sp")
      .select([
        "sp.id",
        "sp.name",
        "sp.problem_type",
        "sp.difficulty_level", 
        "sp.description",
        "sp.created_by",
        "sp.created_at",
        "sp.dataset_info",
        "sp.problem_config",
        "sp.challenge_type",
        "sp.view_count"
      ])
      .where("sp.challenge_type", "challenge") // Only get challenges, not leaderboard problems

    // Apply filters
    if (problem_type) {
      query = query.where("sp.problem_type", problem_type)
    }

    if (difficulty_level) {
      query = query.where("sp.difficulty_level", difficulty_level)
    }

    if (created_by) {
      query = query.where("sp.created_by", created_by)
    }

    if (is_active !== undefined) {
      query = query.where("sp.is_active", is_active === 'true')
    }

    // Add submission statistics if requested
    if (include_stats === 'true') {
      query = query
        .leftJoin("leaderboard_submissions as ls", "sp.id", "ls.problem_id")
        .select([
          knex.raw("COUNT(DISTINCT ls.id) as submission_count"),
          knex.raw("MIN(ls.best_value) as best_value"),
          knex.raw("MAX(ls.submitted_at) as last_submission_at")
        ])
        .groupBy("sp.id", "sp.name", "sp.problem_type", "sp.difficulty_level", "sp.description", "sp.created_by", "sp.created_at", "sp.dataset_info", "sp.problem_config", "sp.challenge_type", "sp.view_count")
    }

    query = query
      .orderBy("sp.created_at", "desc")
      .limit(parseInt(limit))
      .offset(parseInt(offset))

    const challenges = await query

    // Parse JSON fields
    const parsedChallenges = challenges.map(challenge => ({
      ...challenge,
      dataset_info: challenge.dataset_info ? JSON.parse(challenge.dataset_info) : null,
      problem_config: challenge.problem_config ? JSON.parse(challenge.problem_config) : null,
      submission_count: parseInt(challenge.submission_count) || 0,
      best_value: challenge.best_value ? parseFloat(challenge.best_value) : null
    }))

    res.json({
      success: true,
      problems: parsedChallenges,
      total: parsedChallenges.length
    })

  } catch (error) {
    console.error("Error fetching optimization challenges:", error)
    res.status(500).json({
      success: false,
      message: "Failed to fetch optimization challenges"
    })
  }
})

// Create a new optimization challenge
router.post("/", auth, async (req, res) => {
  try {
    const {
      challengeName,
      description,
      problemType,
      difficultyLevel,
      datasetInfo,
      problemConfig,
      tags = []
    } = req.body

    if (!challengeName || !problemType || !description || !difficultyLevel) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: challengeName, problemType, description, difficultyLevel"
      })
    }

    const { knex } = require("../config/database")

    // Create the challenge
    const [challenge] = await knex("standardized_problems")
      .insert({
        name: challengeName,
        problem_type: problemType,
        description,
        difficulty_level: difficultyLevel,
        problem_config: JSON.stringify(problemConfig || {}),
        evaluation_config: JSON.stringify({
          metric: "objective_value",
          minimize: true
        }),
        dataset_info: JSON.stringify(datasetInfo || {}),
        challenge_type: "challenge", // Mark as challenge, not leaderboard problem
        created_by: req.user.login,
        created_from_workflow: false,
        is_active: true,
        view_count: 0
      })
      .returning("*")

    // Add tags if provided
    if (tags.length > 0) {
      const tagInserts = tags.map(tag => ({
        problem_id: challenge.id,
        tag: tag.toLowerCase().trim()
      }))

      await knex("challenge_tags").insert(tagInserts)
    }

    res.status(201).json({
      success: true,
      challenge: {
        ...challenge,
        dataset_info: JSON.parse(challenge.dataset_info),
        problem_config: JSON.parse(challenge.problem_config),
        tags
      }
    })

  } catch (error) {
    console.error("Error creating optimization challenge:", error)
    
    if (error.code === '23505') { // Unique constraint violation
      return res.status(409).json({
        success: false,
        message: "A challenge with this name already exists"
      })
    }

    res.status(500).json({
      success: false,
      message: "Failed to create optimization challenge"
    })
  }
})

// Get a specific challenge
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params
    const { knex } = require("../config/database")

    const challenge = await knex("standardized_problems")
      .where("id", parseInt(id))
      .where("challenge_type", "challenge")
      .first()

    if (!challenge) {
      return res.status(404).json({
        success: false,
        message: "Challenge not found"
      })
    }

    // Get tags
    const tags = await knex("challenge_tags")
      .where("problem_id", challenge.id)
      .pluck("tag")

    // Get submission stats
    const stats = await knex("leaderboard_submissions")
      .where("problem_id", challenge.id)
      .select([
        knex.raw("COUNT(*) as submission_count"),
        knex.raw("MIN(best_value) as best_value"),
        knex.raw("COUNT(DISTINCT submitted_by) as unique_solvers")
      ])
      .first()

    // Increment view count
    await knex("standardized_problems")
      .where("id", challenge.id)
      .increment("view_count", 1)

    res.json({
      success: true,
      challenge: {
        ...challenge,
        dataset_info: challenge.dataset_info ? JSON.parse(challenge.dataset_info) : null,
        problem_config: challenge.problem_config ? JSON.parse(challenge.problem_config) : null,
        tags,
        submission_count: parseInt(stats.submission_count) || 0,
        best_value: stats.best_value ? parseFloat(stats.best_value) : null,
        unique_solvers: parseInt(stats.unique_solvers) || 0
      }
    })

  } catch (error) {
    console.error("Error fetching challenge:", error)
    res.status(500).json({
      success: false,
      message: "Failed to fetch challenge"
    })
  }
})

// Delete a challenge (only by creator or admin)
router.delete("/:id", auth, async (req, res) => {
  try {
    const { id } = req.params
    const { knex } = require("../config/database")

    const challenge = await knex("standardized_problems")
      .where("id", parseInt(id))
      .where("challenge_type", "challenge")
      .first()

    if (!challenge) {
      return res.status(404).json({
        success: false,
        message: "Challenge not found"
      })
    }

    // Check permissions
    const adminUsers = ['Rastion']
    if (challenge.created_by !== req.user.login && !adminUsers.includes(req.user.login)) {
      return res.status(403).json({
        success: false,
        message: "You can only delete your own challenges"
      })
    }

    // Delete the challenge (cascade will handle related records)
    await knex("standardized_problems")
      .where("id", parseInt(id))
      .del()

    res.json({
      success: true,
      message: "Challenge deleted successfully"
    })

  } catch (error) {
    console.error("Error deleting challenge:", error)
    res.status(500).json({
      success: false,
      message: "Failed to delete challenge"
    })
  }
})

module.exports = router

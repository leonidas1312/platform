/**
 * Leaderboard API Routes
 * 
 * Handles leaderboard operations including submissions, rankings, and solver profiles.
 */

const express = require("express")
const { auth } = require("../middleware/auth")
const LeaderboardService = require("../services/leaderboardService")
const GiteaService = require("../services/giteaService")

const router = express.Router()

// Get all standardized problems
router.get("/problems", async (req, res) => {
  try {
    const {
      problem_type,
      difficulty_level,
      challenge_type,
      created_from_workflow,
      is_active,
      include_stats = 'true',
      include_tags = 'true',
      limit = 50,
      offset = 0
    } = req.query

    const problems = await LeaderboardService.getStandardizedProblemsWithMetadata({
      problemType: problem_type,
      difficultyLevel: difficulty_level,
      challengeType: challenge_type,
      createdFromWorkflow: created_from_workflow !== undefined ? created_from_workflow === 'true' : undefined,
      isActive: is_active !== undefined ? is_active === 'true' : true,
      includeStats: include_stats === 'true',
      includeTags: include_tags === 'true',
      limit: parseInt(limit),
      offset: parseInt(offset)
    })

    res.json({
      success: true,
      problems,
      total: problems.length
    })
  } catch (error) {
    console.error("Error fetching standardized problems:", error)
    res.status(500).json({
      success: false,
      message: "Internal server error"
    })
  }
})

// Create a new standardized problem (admin only)
router.post("/problems", auth, async (req, res) => {
  try {
    // Check admin privileges
    const adminUsers = ['Rastion'] // Add your admin usernames here
    if (!adminUsers.includes(req.user.login)) {
      return res.status(403).json({
        success: false,
        message: "Admin access required"
      })
    }

    const {
      name,
      problem_type,
      description,
      difficulty_level,
      problem_config,
      evaluation_config,
      reference_solution,
      reference_value,
      time_limit_seconds,
      memory_limit_mb
    } = req.body

    if (!name || !problem_type || !description || !difficulty_level || !problem_config) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields"
      })
    }

    const problem = await LeaderboardService.createStandardizedProblem({
      name,
      problemType: problem_type,
      description,
      difficultyLevel: difficulty_level,
      problemConfig: problem_config,
      evaluationConfig: evaluation_config || {},
      referenceSolution: reference_solution,
      referenceValue: reference_value,
      timeLimitSeconds: time_limit_seconds || 300,
      memoryLimitMb: memory_limit_mb || 1024,
      createdBy: req.user.login
    })

    res.status(201).json({
      success: true,
      problem
    })
  } catch (error) {
    console.error("Error creating standardized problem:", error)
    res.status(500).json({
      success: false,
      message: "Internal server error"
    })
  }
})

// Create a new leaderboard problem from repository (admin only)
router.post("/problems/from-repository", auth, async (req, res) => {
  try {
    // Check admin privileges
    const adminUsers = ['Rastion'] // Add your admin usernames here
    if (!adminUsers.includes(req.user.login)) {
      return res.status(403).json({
        success: false,
        message: "Admin access required"
      })
    }

    const {
      name,
      repository_path,
      optimization_type = 'minimize'
    } = req.body

    if (!name || !repository_path) {
      return res.status(400).json({
        success: false,
        message: "Problem name and repository path are required"
      })
    }

    // Validate repository path format (owner/repo)
    if (!repository_path.includes('/')) {
      return res.status(400).json({
        success: false,
        message: "Repository path must be in format 'owner/repository'"
      })
    }

    const [owner, repoName] = repository_path.split('/')

    // Create standardized problem with repository reference
    const problem = await LeaderboardService.createStandardizedProblem({
      name,
      problemType: 'repository', // Special type for repository-based problems
      description: `Leaderboard problem based on repository ${repository_path}`,
      difficultyLevel: 'medium', // Default difficulty
      problemConfig: {
        repository_path,
        owner,
        repo_name: repoName,
        optimization_type: optimization_type // Store optimization type in config
      },
      evaluationConfig: {
        time_limit_seconds: 300,
        memory_limit_mb: 1024,
        optimization_type: optimization_type
      },
      timeLimitSeconds: 300,
      memoryLimitMb: 1024,
      createdBy: req.user.login
    })

    res.status(201).json({
      success: true,
      problem
    })
  } catch (error) {
    console.error("Error creating repository-based problem:", error)
    res.status(500).json({
      success: false,
      message: "Internal server error"
    })
  }
})

// Get leaderboard for a specific problem
router.get("/problems/:problemId/leaderboard", async (req, res) => {
  try {
    const { problemId } = req.params
    const {
      limit = 50,
      offset = 0,
      sort_by = 'rank_overall',
      sort_order = 'asc',
      validated_only = 'false'
    } = req.query

    const leaderboard = await LeaderboardService.getLeaderboard(problemId, {
      limit: parseInt(limit),
      offset: parseInt(offset),
      sortBy: sort_by,
      sortOrder: sort_order,
      validatedOnly: validated_only === 'true'
    })

    // Convert decimal fields to numbers
    const convertedLeaderboard = leaderboard.map(entry =>
      convertDecimalFields(entry, ['best_value', 'runtime_seconds', 'normalized_score', 'percentile_score', 'relative_performance'])
    )

    res.json({
      success: true,
      leaderboard: convertedLeaderboard,
      total: convertedLeaderboard.length
    })
  } catch (error) {
    console.error("Error fetching leaderboard:", error)
    res.status(500).json({
      success: false,
      message: "Internal server error"
    })
  }
})

// Submit a result to the leaderboard
router.post("/problems/:problemId/submit", auth, async (req, res) => {
  try {
    const { problemId } = req.params
    const {
      solver_name,
      solver_username,
      solver_repository,
      solver_version,
      solver_config,
      best_value,
      mean_value,
      std_value,
      runtime_seconds,
      iterations,
      evaluations,
      success_rate,
      hardware_info,
      execution_metadata
    } = req.body

    if (!solver_name || !solver_repository || best_value === undefined || !runtime_seconds) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields"
      })
    }

    const submission = await LeaderboardService.submitResult({
      problemId: parseInt(problemId),
      solverName: solver_name,
      solverUsername: solver_username || req.user.login,
      solverRepository: solver_repository,
      solverVersion: solver_version,
      solverConfig: solver_config || {},
      bestValue: parseFloat(best_value),
      meanValue: mean_value ? parseFloat(mean_value) : null,
      stdValue: std_value ? parseFloat(std_value) : null,
      runtimeSeconds: parseFloat(runtime_seconds),
      iterations: iterations ? parseInt(iterations) : null,
      evaluations: evaluations ? parseInt(evaluations) : null,
      successRate: success_rate ? parseFloat(success_rate) : 100.0,
      hardwareInfo: hardware_info || {},
      submittedBy: req.user.login,
      executionMetadata: execution_metadata || {}
    })

    // Automatically recompute rankings after submission
    try {
      await LeaderboardService.recomputeRankings(parseInt(problemId))
    } catch (rankingError) {
      console.error("Error recomputing rankings after submission:", rankingError)
      // Don't fail the submission if ranking computation fails
    }

    res.status(201).json({
      success: true,
      submission
    })
  } catch (error) {
    console.error("Error submitting result:", error)

    if (error.code === '23505') { // Unique constraint violation
      return res.status(409).json({
        success: false,
        message: "Duplicate submission detected"
      })
    }

    res.status(500).json({
      success: false,
      message: "Internal server error"
    })
  }
})

// Submit playground result to leaderboard (simplified)
router.post("/problems/:problemId/submit-playground", auth, async (req, res) => {
  try {
    const { problemId } = req.params
    const {
      problem_name,
      problem_username,
      optimizer_name,
      optimizer_username,
      best_value,
      runtime_seconds,
      iterations,
      evaluations,
      problem_params,
      optimizer_params
    } = req.body

    console.log(`[PLAYGROUND SUBMISSION] Problem ID: ${problemId}`)
    console.log(`[PLAYGROUND SUBMISSION] User: ${req.user.login}`)
    console.log(`[PLAYGROUND SUBMISSION] Data:`, {
      optimizer_name,
      best_value,
      runtime_seconds
    })

    if (!optimizer_name || best_value === undefined || !runtime_seconds) {
      console.log(`[PLAYGROUND SUBMISSION] Missing required fields`)
      return res.status(400).json({
        success: false,
        message: "Missing required fields: optimizer_name, best_value, runtime_seconds"
      })
    }

    const { knex } = require("../config/database")

    // VALIDATION 1: Check that the problem used matches the leaderboard problem
    const leaderboardProblem = await knex("standardized_problems")
      .where("id", parseInt(problemId))
      .first()

    if (!leaderboardProblem) {
      return res.status(404).json({
        success: false,
        message: "Leaderboard problem not found"
      })
    }

    // Check if the problem used in playground matches the leaderboard problem
    if (leaderboardProblem.problem_config?.repository_path) {
      const [expectedOwner, expectedRepo] = leaderboardProblem.problem_config.repository_path.split('/')

      if (problem_username !== expectedOwner || problem_name !== expectedRepo) {
        console.log(`[PLAYGROUND SUBMISSION] Problem mismatch: expected ${expectedOwner}/${expectedRepo}, got ${problem_username}/${problem_name}`)
        return res.status(400).json({
          success: false,
          message: `Problem mismatch: This leaderboard requires using problem ${expectedOwner}/${expectedRepo}, but you used ${problem_username}/${problem_name}`
        })
      }
    }

    // VALIDATION 2: Check that the optimizer repository is owned by the submitting user
    const solver_repository = `${optimizer_username || req.user.login}/${optimizer_name}`
    const [repoOwner, repoName] = solver_repository.split('/')

    // Get user's token for repository access
    const token = req.user.token || req.session?.user_data?.token

    if (repoOwner !== req.user.login) {
      console.log(`[PLAYGROUND SUBMISSION] Repository ownership check: ${repoOwner} !== ${req.user.login}`)
      return res.status(403).json({
        success: false,
        message: "You can only submit optimizers from repositories you own"
      })
    }

    // Verify the repository exists and is accessible
    try {
      const repoResponse = await GiteaService.getRepository(repoOwner, repoName, token)

      if (!repoResponse.ok) {
        console.log(`[PLAYGROUND SUBMISSION] Repository access failed: ${repoResponse.status}`)
        return res.status(400).json({
          success: false,
          message: `Repository ${solver_repository} not found or not accessible`
        })
      }

      const repoData = await repoResponse.json()

      // Double-check ownership through repository data
      if (repoData.owner?.login !== req.user.login) {
        console.log(`[PLAYGROUND SUBMISSION] Repository owner mismatch: ${repoData.owner?.login} !== ${req.user.login}`)
        return res.status(403).json({
          success: false,
          message: "You can only submit optimizers from repositories you own"
        })
      }
    } catch (repoError) {
      console.error(`[PLAYGROUND SUBMISSION] Repository validation error:`, repoError)
      return res.status(400).json({
        success: false,
        message: "Failed to validate repository ownership"
      })
    }

    // Ensure user exists in database with current username
    let currentUser = await knex("users").where({ username: req.user.login }).first()

    if (!currentUser) {
      // Check if there's a user with the same token but different username (username changed in Gitea)
      const userWithSameToken = await knex("users").where({ gitea_token: req.user.token }).first()

      if (userWithSameToken && userWithSameToken.username !== req.user.login) {
        const oldUsername = userWithSameToken.username
        const newUsername = req.user.login

        console.log(`Username changed from ${oldUsername} to ${newUsername}`)

        // Check if the new username already exists (different user)
        const existingNewUser = await knex("users").where({ username: newUsername }).first()

        if (existingNewUser) {
          // Merge: Update the existing new user with the token from the old user
          console.log(`Merging ${oldUsername} into existing ${newUsername} user`)
          await knex.transaction(async (trx) => {
            // Update the existing new user with the token
            await trx("users")
              .where({ username: newUsername })
              .update({
                gitea_token: userWithSameToken.gitea_token,
                email: req.user.email || existingNewUser.email,
                updated_at: knex.fn.now()
              })

            // Update all references from old username to new username
            await trx("features").where("created_by_username", oldUsername).update({ created_by_username: newUsername })
            await trx("feature_votes").where("username", oldUsername).update({ username: newUsername }).catch(() => {})
            await trx("feature_comments").where("username", oldUsername).update({ username: newUsername }).catch(() => {})
            await trx("user_activities").where("username", oldUsername).update({ username: newUsername }).catch(() => {})
            await trx("benchmarks").where("created_by", oldUsername).update({ created_by: newUsername }).catch(() => {})
            await trx("benchmark_results").where("user_id", oldUsername).update({ user_id: newUsername }).catch(() => {})
            await trx("leaderboard_submissions").where("submitted_by", oldUsername).update({ submitted_by: newUsername }).catch(() => {})
            await trx("solver_profiles").where("created_by", oldUsername).update({ created_by: newUsername }).catch(() => {})

            // Delete the old user record
            await trx("users").where({ username: oldUsername }).del()
          })

          currentUser = await knex("users").where({ username: newUsername }).first()
        } else {
          // Simple rename: just update the username
          console.log(`Renaming user from ${oldUsername} to ${newUsername}`)

          // Temporarily disable foreign key constraints, update username, then re-enable
          console.log(`Disabling foreign key constraints to update username`)

          await knex.raw('SET session_replication_role = replica;')

          try {
            // Now update the username without foreign key constraints
            await knex("users")
              .where({ gitea_token: req.user.token })
              .update({
                username: newUsername,
                email: req.user.email || userWithSameToken.email,
                updated_at: knex.fn.now()
              })

            console.log(`Successfully updated username from ${oldUsername} to ${newUsername}`)
          } finally {
            // Re-enable foreign key constraints
            await knex.raw('SET session_replication_role = DEFAULT;')
            console.log(`Re-enabled foreign key constraints`)
          }

          currentUser = await knex("users").where({ username: newUsername }).first()
        }
      } else {
        // Create completely new user record
        await knex("users").insert({
          username: req.user.login,
          email: req.user.email || '',
          password: null,
          gitea_token: req.user.token
        })
        console.log(`Created new user record for ${req.user.login}`)
        currentUser = await knex("users").where({ username: req.user.login }).first()
      }
    }

    const [submission] = await knex("leaderboard_submissions")
      .insert({
        problem_id: parseInt(problemId),
        solver_name: optimizer_name,
        solver_username: optimizer_username || req.user.login,
        solver_repository: solver_repository,
        solver_version: 'playground',
        solver_config: JSON.stringify(optimizer_params || {}),
        best_value: parseFloat(best_value),
        runtime_seconds: parseFloat(runtime_seconds),
        iterations: iterations ? parseInt(iterations) : null,
        evaluations: evaluations ? parseInt(evaluations) : null,
        success_rate: 100.0,
        submitted_by: req.user.login,
        is_validated: true, // Auto-validate playground submissions
        validated_at: knex.fn.now(),
        execution_metadata: JSON.stringify({
          source: 'playground',
          problem_name: problem_name || 'unknown',
          optimizer_params: optimizer_params || {}
        })
      })
      .returning("*")

    console.log(`[PLAYGROUND SUBMISSION] Submission created with ID: ${submission.id}`)

    // Recompute rankings for the problem to ensure correct ranking
    try {
      await LeaderboardService.recomputeRankings(parseInt(problemId))
      console.log(`[PLAYGROUND SUBMISSION] Rankings recomputed for problem ${problemId}`)
    } catch (rankingError) {
      console.error("Error recomputing rankings after playground submission:", rankingError)
      // Don't fail the submission if ranking computation fails
    }

    res.status(201).json({
      success: true,
      submission: {
        id: submission.id,
        best_value: submission.best_value,
        runtime_seconds: submission.runtime_seconds
      },
      message: "Successfully submitted to leaderboard"
    })
  } catch (error) {
    console.error("Error submitting playground result:", error)

    if (error.code === '23505') { // Unique constraint violation
      return res.status(409).json({
        success: false,
        message: "You have already submitted this configuration"
      })
    }

    res.status(500).json({
      success: false,
      message: "Failed to submit to leaderboard"
    })
  }
})

// Get solver profile
router.get("/solvers/:solverRepository", async (req, res) => {
  try {
    const { solverRepository } = req.params
    const decodedRepository = decodeURIComponent(solverRepository)

    const profile = await LeaderboardService.getSolverProfile(decodedRepository)

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Solver profile not found"
      })
    }

    // Convert decimal fields to numbers in profile
    const convertedProfile = convertDecimalFields(profile, ['average_rank', 'best_rank', 'success_rate'])

    // Convert decimal fields in recent submissions
    if (convertedProfile.recent_submissions) {
      convertedProfile.recent_submissions = convertedProfile.recent_submissions.map(submission =>
        convertDecimalFields(submission, ['best_value', 'runtime_seconds', 'percentile_score'])
      )
    }

    res.json({
      success: true,
      profile: convertedProfile
    })
  } catch (error) {
    console.error("Error fetching solver profile:", error)
    res.status(500).json({
      success: false,
      message: "Internal server error"
    })
  }
})

// Helper function to convert decimal strings to numbers
const convertDecimalFields = (obj, fields) => {
  const converted = { ...obj }
  fields.forEach(field => {
    if (converted[field] !== null && converted[field] !== undefined) {
      converted[field] = parseFloat(converted[field])
    }
  })
  return converted
}

// Get leaderboard statistics
router.get("/stats", async (req, res) => {
  try {
    const { knex } = require("../config/database")

    // Get overall statistics
    const [
      totalProblems,
      totalSubmissions,
      totalSolvers,
      recentSubmissions
    ] = await Promise.all([
      knex("standardized_problems").where("is_active", true).count("* as count").first(),
      knex("leaderboard_submissions").count("* as count").first(),
      knex("solver_profiles").count("* as count").first(),
      knex("leaderboard_submissions as ls")
        .join("standardized_problems as sp", "ls.problem_id", "sp.id")
        .select([
          "ls.solver_name",
          "ls.solver_username",
          "sp.name as problem_name",
          "ls.best_value",
          "ls.runtime_seconds",
          "ls.submitted_at"
        ])
        .orderBy("ls.submitted_at", "desc")
        .limit(10)
    ])

    // Get problem type distribution
    const problemTypes = await knex("standardized_problems")
      .select("problem_type")
      .count("* as count")
      .where("is_active", true)
      .groupBy("problem_type")

    // Get top performers
    const topPerformers = await knex("solver_profiles")
      .select("solver_name", "solver_username", "average_rank", "problems_solved")
      .whereNotNull("average_rank")
      .orderBy("average_rank", "asc")
      .limit(10)

    // Convert decimal fields to numbers
    const convertedRecentSubmissions = recentSubmissions.map(submission =>
      convertDecimalFields(submission, ['best_value', 'runtime_seconds'])
    )

    const convertedTopPerformers = topPerformers.map(performer =>
      convertDecimalFields(performer, ['average_rank'])
    )

    res.json({
      success: true,
      stats: {
        total_problems: parseInt(totalProblems.count),
        total_submissions: parseInt(totalSubmissions.count),
        total_solvers: parseInt(totalSolvers.count),
        problem_types: problemTypes,
        recent_submissions: convertedRecentSubmissions,
        top_performers: convertedTopPerformers
      }
    })
  } catch (error) {
    console.error("Error fetching leaderboard stats:", error)
    res.status(500).json({
      success: false,
      message: "Internal server error"
    })
  }
})

// Recompute rankings for a problem (admin only)
router.post("/problems/:problemId/recompute", auth, async (req, res) => {
  try {
    const { problemId } = req.params

    // Check admin privileges
    const adminUsers = ['Rastion'] // Add your admin usernames here
    if (!adminUsers.includes(req.user.login)) {
      return res.status(403).json({
        success: false,
        message: "Admin access required"
      })
    }

    await LeaderboardService.recomputeRankings(parseInt(problemId))

    res.json({
      success: true,
      message: "Rankings recomputed successfully"
    })
  } catch (error) {
    console.error("Error recomputing rankings:", error)
    res.status(500).json({
      success: false,
      message: "Internal server error"
    })
  }
})

// Delete a user's own submission
router.delete("/submissions/:submissionId", auth, async (req, res) => {
  try {
    const { submissionId } = req.params
    const { knex } = require("../config/database")

    // Get the submission to verify ownership
    const submission = await knex("leaderboard_submissions")
      .where("id", parseInt(submissionId))
      .first()

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: "Submission not found"
      })
    }

    // Check if the user owns this submission
    if (submission.submitted_by !== req.user.login) {
      return res.status(403).json({
        success: false,
        message: "You can only delete your own submissions"
      })
    }

    // Delete the submission and associated ranking in a transaction
    await knex.transaction(async (trx) => {
      // Delete ranking first (foreign key constraint)
      await trx("leaderboard_rankings")
        .where("submission_id", parseInt(submissionId))
        .del()

      // Delete the submission
      await trx("leaderboard_submissions")
        .where("id", parseInt(submissionId))
        .del()
    })

    // Recompute rankings for the problem
    try {
      await LeaderboardService.recomputeRankings(submission.problem_id)
    } catch (rankingError) {
      console.error("Error recomputing rankings after deletion:", rankingError)
      // Don't fail the deletion if ranking computation fails
    }

    res.json({
      success: true,
      message: "Submission deleted successfully"
    })
  } catch (error) {
    console.error("Error deleting submission:", error)
    res.status(500).json({
      success: false,
      message: "Internal server error"
    })
  }
})

// Delete a problem and all associated data (admin only)
router.delete("/problems/:problemId", auth, async (req, res) => {
  try {
    const { problemId } = req.params

    // Check admin privileges
    const adminUsers = ['Rastion'] // Add your admin usernames here
    if (!adminUsers.includes(req.user.login)) {
      return res.status(403).json({
        success: false,
        message: "Admin access required"
      })
    }

    await LeaderboardService.deleteProblem(parseInt(problemId))

    res.json({
      success: true,
      message: "Problem deleted successfully"
    })
  } catch (error) {
    console.error("Error deleting problem:", error)
    res.status(500).json({
      success: false,
      message: "Internal server error"
    })
  }
})

// Get available repositories for admin problem creation
router.get("/admin/repositories", auth, async (req, res) => {
  try {
    // Check admin privileges
    const adminUsers = ['Rastion'] // Add your admin usernames here
    if (!adminUsers.includes(req.user.login)) {
      return res.status(403).json({
        success: false,
        message: "Admin access required"
      })
    }

    const { search, qubot_type } = req.query
    const GiteaService = require("../services/giteaService")

    // Get all public repositories
    const publicReposRes = await GiteaService.getPublicRepos(req.user.token || req.session?.user_data?.token)

    if (!publicReposRes.ok) {
      return res.status(500).json({
        success: false,
        message: "Failed to fetch repositories"
      })
    }

    let repositories = await publicReposRes.json()

    // Filter by search term if provided
    if (search) {
      const searchLower = search.toLowerCase()
      repositories = repositories.filter(repo =>
        repo.name.toLowerCase().includes(searchLower) ||
        repo.full_name.toLowerCase().includes(searchLower) ||
        (repo.description && repo.description.toLowerCase().includes(searchLower))
      )
    }

    // Filter by qubot_type if provided
    if (qubot_type) {
      // This would require fetching config.json for each repo, which might be expensive
      // For now, we'll return all repos and let the frontend handle filtering
    }

    // Format repositories for admin interface
    const formattedRepos = repositories.map(repo => ({
      id: repo.id,
      name: repo.name,
      full_name: repo.full_name,
      description: repo.description || '',
      owner: repo.owner,
      private: repo.private,
      html_url: repo.html_url,
      clone_url: repo.clone_url,
      updated_at: repo.updated_at
    }))

    res.json({
      success: true,
      repositories: formattedRepos,
      total: formattedRepos.length
    })
  } catch (error) {
    console.error("Error fetching admin repositories:", error)
    res.status(500).json({
      success: false,
      message: "Internal server error"
    })
  }
})

// Get leaderboard overview (all problems summary)
router.get("/overview", async (req, res) => {
  try {
    const { knex } = require("../config/database")

    const overview = await knex("standardized_problems as sp")
      .leftJoin("leaderboard_submissions as ls", "sp.id", "ls.problem_id")
      .leftJoin("leaderboard_rankings as lr", "ls.id", "lr.submission_id")
      .select([
        "sp.id",
        "sp.name",
        "sp.problem_type",
        "sp.difficulty_level",
        "sp.description"
      ])
      .count("ls.id as submission_count")
      .min("lr.rank_overall as best_rank")
      .min("ls.best_value as best_value")
      .where("sp.is_active", true)
      .groupBy("sp.id", "sp.name", "sp.problem_type", "sp.difficulty_level", "sp.description")
      .orderBy("sp.problem_type")
      .orderBy("sp.difficulty_level")

    // Convert decimal fields to numbers
    const convertedOverview = overview.map(problem =>
      convertDecimalFields(problem, ['best_value'])
    )

    res.json({
      success: true,
      overview: convertedOverview
    })
  } catch (error) {
    console.error("Error fetching leaderboard overview:", error)
    res.status(500).json({
      success: false,
      message: "Internal server error"
    })
  }
})

module.exports = router

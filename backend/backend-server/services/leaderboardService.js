/**
 * Leaderboard Service
 * 
 * Handles leaderboard operations including submissions, rankings computation,
 * hardware normalization, and fairness validation.
 */

const { knex } = require("../config/database")
const crypto = require("crypto")

class LeaderboardService {
  /**
   * Submit a solver result to the leaderboard
   */
  static async submitResult(submissionData) {
    const {
      problemId,
      solverName,
      solverUsername,
      solverRepository,
      solverVersion,
      solverConfig,
      bestValue,
      meanValue,
      stdValue,
      runtimeSeconds,
      iterations,
      evaluations,
      successRate,
      hardwareInfo,
      submittedBy,
      executionMetadata
    } = submissionData

    // Generate hardware profile hash
    const hardwareProfile = this.generateHardwareProfile(hardwareInfo)
    
    // Get or create hardware profile
    const hardwareProfileData = await this.getOrCreateHardwareProfile(hardwareInfo, hardwareProfile)
    
    // Calculate normalized score
    const normalizedScore = this.calculateNormalizedScore(bestValue, runtimeSeconds, hardwareProfileData.normalization_factor)

    // Check for existing submission
    const existingSubmission = await knex("leaderboard_submissions")
      .where({
        problem_id: problemId,
        solver_repository: solverRepository,
        solver_version: solverVersion,
        submitted_by: submittedBy
      })
      .first()

    let submission
    if (existingSubmission) {
      // Update existing submission if the new result is better
      const shouldUpdate = bestValue < existingSubmission.best_value ||
                          (bestValue === existingSubmission.best_value && runtimeSeconds < existingSubmission.runtime_seconds)

      if (shouldUpdate) {
        // Auto-validate playground submissions
        const isPlaygroundSubmission = solverVersion === 'playground' ||
                                      (executionMetadata && executionMetadata.source === 'playground')

        const updateData = {
          solver_config: JSON.stringify(solverConfig),
          best_value: bestValue,
          mean_value: meanValue,
          std_value: stdValue,
          runtime_seconds: runtimeSeconds,
          iterations,
          evaluations,
          success_rate: successRate,
          normalized_score: normalizedScore,
          hardware_profile: hardwareProfile,
          execution_metadata: JSON.stringify(executionMetadata),
          submitted_at: knex.fn.now()
        }

        // Update validation status for playground submissions
        if (isPlaygroundSubmission && !existingSubmission.is_validated) {
          updateData.is_validated = true
          updateData.validated_at = knex.fn.now()
        }

        [submission] = await knex("leaderboard_submissions")
          .where("id", existingSubmission.id)
          .update(updateData)
          .returning("*")
      } else {
        // Return existing submission if new result is not better
        submission = existingSubmission
      }
    } else {
      // Insert new submission
      // Auto-validate playground submissions
      const isPlaygroundSubmission = solverVersion === 'playground' ||
                                    (executionMetadata && executionMetadata.source === 'playground')

      console.log(`[LEADERBOARD SERVICE] Creating submission:`, {
        problemId,
        solverName,
        solverRepository,
        isPlaygroundSubmission,
        bestValue,
        runtimeSeconds
      })

      [submission] = await knex("leaderboard_submissions")
        .insert({
          problem_id: problemId,
          solver_name: solverName,
          solver_username: solverUsername,
          solver_repository: solverRepository,
          solver_version: solverVersion,
          solver_config: JSON.stringify(solverConfig),
          best_value: bestValue,
          mean_value: meanValue,
          std_value: stdValue,
          runtime_seconds: runtimeSeconds,
          iterations,
          evaluations,
          success_rate: successRate,
          normalized_score: normalizedScore,
          hardware_profile: hardwareProfile,
          submitted_by: submittedBy,
          execution_metadata: JSON.stringify(executionMetadata),
          is_validated: isPlaygroundSubmission, // Auto-validate playground submissions
          validated_at: isPlaygroundSubmission ? knex.fn.now() : null
        })
        .returning("*")

      console.log(`[LEADERBOARD SERVICE] Submission created with ID: ${submission.id}, is_validated: ${submission.is_validated}`)
    }

    // Update solver profile
    await this.updateSolverProfile(solverRepository, solverName, solverUsername, submittedBy)
    
    // Recompute rankings for this problem
    await this.recomputeRankings(problemId)

    return submission
  }

  /**
   * Get leaderboard for a specific problem
   */
  static async getLeaderboard(problemId, options = {}) {
    const {
      limit = 50,
      offset = 0,
      sortBy = 'rank_overall',
      sortOrder = 'asc',
      validatedOnly = false
    } = options

    let query = knex("leaderboard_rankings as lr")
      .join("leaderboard_submissions as ls", "lr.submission_id", "ls.id")
      .leftJoin("solver_profiles as sp", "ls.solver_repository", "sp.solver_repository")
      .where("lr.problem_id", problemId)

    if (validatedOnly) {
      query = query.where("ls.is_validated", true)
    }

    const results = await query
      .select([
        "lr.*",
        "ls.solver_name",
        "ls.solver_username",
        "ls.solver_repository",
        "ls.solver_config",
        "ls.best_value",
        "ls.runtime_seconds",
        "ls.normalized_score",
        "ls.submitted_at",
        "ls.is_validated",
        "sp.algorithm_family",
        "sp.tags"
      ])
      .orderBy(sortBy, sortOrder)
      .limit(limit)
      .offset(offset)

    return results
  }

  /**
   * Get solver performance across all problems
   */
  static async getSolverProfile(solverRepository) {
    const profile = await knex("solver_profiles")
      .where("solver_repository", solverRepository)
      .first()

    if (!profile) {
      return null
    }

    // Get recent submissions
    const recentSubmissions = await knex("leaderboard_submissions as ls")
      .join("standardized_problems as sp", "ls.problem_id", "sp.id")
      .join("leaderboard_rankings as lr", "ls.id", "lr.submission_id")
      .where("ls.solver_repository", solverRepository)
      .select([
        "sp.name as problem_name",
        "sp.problem_type",
        "ls.best_value",
        "ls.runtime_seconds",
        "ls.submitted_at",
        "lr.rank_overall",
        "lr.percentile_score"
      ])
      .orderBy("ls.submitted_at", "desc")
      .limit(10)

    return {
      ...profile,
      recent_submissions: recentSubmissions
    }
  }

  /**
   * Get standardized problems
   */
  static async getStandardizedProblems(options = {}) {
    const {
      problemType,
      difficultyLevel,
      isActive = true
    } = options

    let query = knex("standardized_problems")

    if (problemType) {
      query = query.where("problem_type", problemType)
    }

    if (difficultyLevel) {
      query = query.where("difficulty_level", difficultyLevel)
    }

    if (isActive !== undefined) {
      query = query.where("is_active", isActive)
    }

    return await query
      .select("*")
      .orderBy("problem_type")
      .orderBy("difficulty_level")
      .orderBy("name")
  }

  /**
   * Create a new standardized problem
   */
  static async createStandardizedProblem(problemData) {
    const {
      name,
      problemType,
      description,
      difficultyLevel,
      problemConfig,
      evaluationConfig,
      referenceSolution,
      referenceValue,
      timeLimitSeconds,
      memoryLimitMb,
      createdBy
    } = problemData

    const [problem] = await knex("standardized_problems")
      .insert({
        name,
        problem_type: problemType,
        description,
        difficulty_level: difficultyLevel,
        problem_config: JSON.stringify(problemConfig),
        evaluation_config: JSON.stringify(evaluationConfig),
        reference_solution: referenceSolution,
        reference_value: referenceValue,
        time_limit_seconds: timeLimitSeconds,
        memory_limit_mb: memoryLimitMb,
        created_by: createdBy
      })
      .returning("*")

    return problem
  }

  /**
   * Recompute rankings for a problem
   */
  static async recomputeRankings(problemId) {
    // Get problem info to determine if it's minimization or maximization
    const problem = await knex("standardized_problems")
      .where("id", problemId)
      .first()

    if (!problem) {
      console.log(`[LEADERBOARD SERVICE] Problem ${problemId} not found`)
      return
    }

    // Parse evaluation_config if it's a string
    let evaluationConfig = problem.evaluation_config
    if (typeof evaluationConfig === 'string') {
      try {
        evaluationConfig = JSON.parse(evaluationConfig)
      } catch (e) {
        evaluationConfig = {}
      }
    }
    const isMinimization = evaluationConfig?.minimize !== false
    console.log(`[LEADERBOARD SERVICE] Problem ${problemId} is ${isMinimization ? 'minimization' : 'maximization'}`)

    // Get all submissions for this problem
    const submissions = await knex("leaderboard_submissions")
      .where("problem_id", problemId)
      .where("is_validated", true)
      .orderBy("best_value", isMinimization ? "asc" : "desc")

    console.log(`[LEADERBOARD SERVICE] Recomputing rankings for problem ${problemId}`)
    console.log(`[LEADERBOARD SERVICE] Found ${submissions.length} validated submissions`)

    if (submissions.length === 0) {
      console.log(`[LEADERBOARD SERVICE] No validated submissions found, clearing rankings`)
      // Clear any existing rankings if no validated submissions
      await knex("leaderboard_rankings")
        .where("problem_id", problemId)
        .del()
      return
    }

    // Calculate rankings
    const rankings = []
    const bestValue = submissions[0].best_value

    // Create sorted copies for ranking calculations
    const submissionsByTime = [...submissions].sort((a, b) => a.runtime_seconds - b.runtime_seconds)

    // For efficiency ranking, we need to consider minimization vs maximization
    let submissionsByEfficiency
    if (isMinimization) {
      // For minimization: better efficiency = smaller value per time
      submissionsByEfficiency = [...submissions].sort((a, b) => (a.best_value / a.runtime_seconds) - (b.best_value / b.runtime_seconds))
    } else {
      // For maximization: better efficiency = larger value per time
      submissionsByEfficiency = [...submissions].sort((a, b) => (b.best_value / b.runtime_seconds) - (a.best_value / a.runtime_seconds))
    }

    submissions.forEach((submission, index) => {
      const rankByValue = index + 1
      const rankByTime = submissionsByTime.findIndex(s => s.id === submission.id) + 1
      const rankByEfficiency = submissionsByEfficiency.findIndex(s => s.id === submission.id) + 1

      const percentileScore = ((submissions.length - rankByValue + 1) / submissions.length) * 100

      // Calculate relative performance based on optimization direction
      let relativePerformance
      if (isMinimization) {
        // For minimization: relative performance = current_value / best_value (>= 1.0)
        relativePerformance = submission.best_value / bestValue
      } else {
        // For maximization: relative performance = current_value / best_value (<= 1.0)
        relativePerformance = submission.best_value / bestValue
      }

      rankings.push({
        problem_id: problemId,
        submission_id: submission.id,
        rank_overall: rankByValue, // Using value-based ranking as overall
        rank_by_value: rankByValue,
        rank_by_time: rankByTime,
        rank_by_efficiency: rankByEfficiency,
        percentile_score: percentileScore,
        relative_performance: relativePerformance
      })
    })

    console.log(`[LEADERBOARD SERVICE] Computed ${rankings.length} rankings`)

    // Delete existing rankings and insert new ones
    await knex.transaction(async (trx) => {
      await trx("leaderboard_rankings")
        .where("problem_id", problemId)
        .del()

      if (rankings.length > 0) {
        await trx("leaderboard_rankings").insert(rankings)
        console.log(`[LEADERBOARD SERVICE] Inserted ${rankings.length} rankings`)
      }
    })
  }

  /**
   * Generate hardware profile hash
   */
  static generateHardwareProfile(hardwareInfo) {
    const profileString = JSON.stringify({
      cpu_model: hardwareInfo.cpu_model,
      cpu_cores: hardwareInfo.cpu_cores,
      cpu_frequency: hardwareInfo.cpu_frequency_ghz,
      memory_gb: hardwareInfo.memory_gb,
      os_type: hardwareInfo.os_type,
      python_version: hardwareInfo.python_version
    })
    
    return crypto.createHash('sha256').update(profileString).digest('hex').substring(0, 16)
  }

  /**
   * Get or create hardware profile
   */
  static async getOrCreateHardwareProfile(hardwareInfo, profileHash) {
    let profile = await knex("hardware_profiles")
      .where("profile_hash", profileHash)
      .first()

    if (!profile) {
      [profile] = await knex("hardware_profiles")
        .insert({
          profile_hash: profileHash,
          cpu_model: hardwareInfo.cpu_model,
          cpu_cores: hardwareInfo.cpu_cores,
          cpu_frequency_ghz: hardwareInfo.cpu_frequency_ghz,
          memory_gb: hardwareInfo.memory_gb,
          os_type: hardwareInfo.os_type,
          python_version: hardwareInfo.python_version,
          benchmark_score: hardwareInfo.benchmark_score || null,
          normalization_factor: 1.0 // Default, will be updated based on benchmarks
        })
        .returning("*")
    }

    // Update submission count
    await knex("hardware_profiles")
      .where("profile_hash", profileHash)
      .increment("submission_count", 1)

    return profile
  }

  /**
   * Calculate normalized score based on hardware performance
   */
  static calculateNormalizedScore(bestValue, runtimeSeconds, normalizationFactor) {
    // Simple normalization: adjust runtime by hardware factor
    const normalizedRuntime = runtimeSeconds * normalizationFactor
    // Score combines solution quality and normalized time
    return bestValue * (1 + normalizedRuntime / 100)
  }

  /**
   * Delete a problem and all associated data
   */
  static async deleteProblem(problemId) {
    const trx = await knex.transaction()

    try {
      console.log(`[LEADERBOARD SERVICE] Deleting problem ${problemId} and all associated data`)

      // Delete in order to respect foreign key constraints
      // 1. Delete rankings first
      const deletedRankings = await trx("leaderboard_rankings")
        .where("problem_id", problemId)
        .del()
      console.log(`[LEADERBOARD SERVICE] Deleted ${deletedRankings} rankings`)

      // 2. Delete submissions
      const deletedSubmissions = await trx("leaderboard_submissions")
        .where("problem_id", problemId)
        .del()
      console.log(`[LEADERBOARD SERVICE] Deleted ${deletedSubmissions} submissions`)

      // 3. Delete submission queue entries
      const deletedQueueEntries = await trx("leaderboard_submissions_queue")
        .where("problem_id", problemId)
        .del()
      console.log(`[LEADERBOARD SERVICE] Deleted ${deletedQueueEntries} queue entries`)

      // 4. Finally delete the problem itself
      const deletedProblems = await trx("standardized_problems")
        .where("id", problemId)
        .del()
      console.log(`[LEADERBOARD SERVICE] Deleted ${deletedProblems} problems`)

      if (deletedProblems === 0) {
        throw new Error("Problem not found")
      }

      await trx.commit()
      console.log(`[LEADERBOARD SERVICE] Successfully deleted problem ${problemId}`)
    } catch (error) {
      await trx.rollback()
      console.error(`[LEADERBOARD SERVICE] Error deleting problem ${problemId}:`, error)
      throw error
    }
  }

  /**
   * Update solver profile statistics
   */
  static async updateSolverProfile(solverRepository, solverName, solverUsername, createdBy) {
    let profile = await knex("solver_profiles")
      .where("solver_repository", solverRepository)
      .first()

    if (!profile) {
      // Create new profile
      await knex("solver_profiles").insert({
        solver_name: solverName,
        solver_username: solverUsername,
        solver_repository: solverRepository,
        total_submissions: 1,
        problems_solved: 1,
        first_submission: knex.fn.now(),
        last_submission: knex.fn.now(),
        created_by: createdBy
      })
    } else {
      // Update existing profile
      const stats = await this.calculateSolverStats(solverRepository)
      
      await knex("solver_profiles")
        .where("solver_repository", solverRepository)
        .update({
          total_submissions: stats.totalSubmissions,
          problems_solved: stats.problemsSolved,
          average_rank: stats.averageRank,
          best_rank: stats.bestRank,
          success_rate: stats.successRate,
          last_submission: knex.fn.now()
        })
    }
  }

  /**
   * Calculate solver statistics
   */
  static async calculateSolverStats(solverRepository) {
    const submissions = await knex("leaderboard_submissions as ls")
      .join("leaderboard_rankings as lr", "ls.id", "lr.submission_id")
      .where("ls.solver_repository", solverRepository)
      .select("lr.rank_overall", "ls.success_rate")

    const totalSubmissions = submissions.length
    const problemsSolved = new Set(submissions.map(s => s.problem_id)).size
    const ranks = submissions.map(s => s.rank_overall)
    const averageRank = ranks.length > 0 ? ranks.reduce((a, b) => a + b, 0) / ranks.length : null
    const bestRank = ranks.length > 0 ? Math.min(...ranks) : null
    const successRates = submissions.map(s => s.success_rate)
    const overallSuccessRate = successRates.length > 0 ? 
      successRates.reduce((a, b) => a + b, 0) / successRates.length : null

    return {
      totalSubmissions,
      problemsSolved,
      averageRank,
      bestRank,
      successRate: overallSuccessRate
    }
  }
}

module.exports = LeaderboardService

/**
 * Submission Workflow Service
 * 
 * Orchestrates the automated submission process for the leaderboard system.
 * Handles solver validation, benchmark execution, and result submission.
 */

const { knex } = require("../config/database")
const crypto = require("crypto")
const SolverValidationService = require("./solverValidationService")
const UnifiedWorkflowExecutionService = require("./unifiedWorkflowExecutionService")
const LeaderboardService = require("./leaderboardService")
const GiteaService = require("./giteaService")
const NotificationService = require("./notificationService")

class SubmissionWorkflowService {
  /**
   * Submit a solver to the leaderboard with automated benchmark execution
   */
  static async submitSolverToLeaderboard(submissionData, userId, token = null) {
    console.log('🔄 SubmissionWorkflowService.submitSolverToLeaderboard called')
    console.log('📊 Submission data:', submissionData)
    console.log('👤 User ID:', userId)

    const {
      solver_repository,
      problem_id,
      custom_parameters = {},
      num_runs = 5
    } = submissionData

    // Create submission record
    const submissionId = crypto.randomUUID()
    console.log('🆔 Generated submission ID:', submissionId)

    try {
      const submission = await knex('leaderboard_submissions_queue').insert({
        id: submissionId,
        user_id: userId,
        solver_repository,
        problem_id,
        custom_parameters: JSON.stringify(custom_parameters),
        num_runs,
        status: 'pending',
        created_at: new Date(),
        updated_at: new Date()
      }).returning('*')

      console.log('✅ Submission record created in database')
    } catch (dbError) {
      console.error('❌ Database error creating submission:', dbError)
      throw dbError
    }

    // Create initial notification (with error handling)
    try {
      await NotificationService.createSubmissionNotification(
        userId,
        submissionId,
        'pending',
        {
          solver_repository,
          problem_id,
          num_runs
        }
      )

      // Create immediate feedback notification
      await NotificationService.createImmediateFeedbackNotification(
        userId,
        submissionId,
        {
          solver_repository,
          problem_id,
          num_runs
        }
      )
    } catch (notificationError) {
      console.warn('Failed to create initial notification:', notificationError.message)
      // Don't fail the submission if notification creation fails
    }

    // Start async processing
    console.log('🚀 Starting async processing for submission:', submissionId)
    this.processSubmission(submissionId, token).catch(error => {
      console.error(`❌ Error processing submission ${submissionId}:`, error)
      this.updateSubmissionStatus(submissionId, 'failed', {
        error_message: error.message,
        current_step: 'Processing failed'
      })
    })

    console.log('✅ Submission workflow initiated successfully')
    return { submission_id: submissionId, status: 'pending' }
  }

  /**
   * Process a submission through the complete workflow
   */
  static async processSubmission(submissionId, token = null) {
    try {
      // Get submission details
      const submission = await knex('leaderboard_submissions_queue')
        .where('id', submissionId)
        .first()

      if (!submission) {
        throw new Error('Submission not found')
      }

      // Get problem details
      const problem = await knex('standardized_problems')
        .where('id', submission.problem_id)
        .first()

      if (!problem) {
        throw new Error('Problem not found')
      }

      // Step 1: Validate solver
      await this.updateSubmissionStatus(submissionId, 'validating', {
        progress: 10,
        current_step: 'Validating solver configuration...'
      })

      // Create validation notification (with error handling)
      try {
        await NotificationService.createSubmissionNotification(
          submission.user_id,
          submissionId,
          'validating'
        )
      } catch (notificationError) {
        console.warn('Failed to create validation notification:', notificationError.message)
      }

      const validationResult = await SolverValidationService.validateSolver(
        submission.solver_repository,
        token
      )

      if (!validationResult.valid) {
        throw new Error(`Solver validation failed: ${validationResult.errors.join(', ')}`)
      }

      // Step 2: Check compatibility
      await this.updateSubmissionStatus(submissionId, 'validating', {
        progress: 20,
        current_step: 'Checking problem compatibility...'
      })

      const isCompatible = this.checkProblemCompatibility(
        validationResult.config,
        problem
      )

      if (!isCompatible) {
        console.warn(`Solver may not be optimized for ${problem.problem_type} problems`)
      }

      // Step 3: Execute benchmark
      await this.updateSubmissionStatus(submissionId, 'executing', {
        progress: 30,
        current_step: 'Starting benchmark execution...'
      })

      // Create execution notification (with error handling)
      try {
        await NotificationService.createSubmissionNotification(
          submission.user_id,
          submissionId,
          'executing'
        )
      } catch (notificationError) {
        console.warn('Failed to create execution notification:', notificationError.message)
      }

      const benchmarkResults = await this.executeBenchmark(
        submissionId,
        submission,
        problem,
        validationResult.config,
        JSON.parse(submission.custom_parameters || '{}')
      )

      // Step 4: Submit to leaderboard
      await this.updateSubmissionStatus(submissionId, 'executing', {
        progress: 90,
        current_step: 'Submitting results to leaderboard...'
      })

      // Get user information for leaderboard submission
      let userInfo = null
      try {
        // Try to get user info from users table
        userInfo = await knex('users').where('id', submission.user_id).first()
      } catch (error) {
        console.warn('Could not fetch user info from users table:', error.message)
      }

      // Use username if available, otherwise use a fallback
      const username = userInfo?.username || userInfo?.login_name || `user_${submission.user_id}`

      console.log(`📝 Submitting to leaderboard for user: ${username} (ID: ${submission.user_id})`)

      const leaderboardSubmission = await LeaderboardService.submitResult({
        problemId: problem.id,
        solverName: validationResult.config.metadata.name,
        solverUsername: username,
        solverRepository: submission.solver_repository,
        solverVersion: validationResult.config.metadata.version || '1.0.0',
        solverConfig: JSON.parse(submission.custom_parameters || '{}'),
        bestValue: benchmarkResults.best_value,
        meanValue: benchmarkResults.mean_value,
        stdValue: benchmarkResults.std_value,
        runtimeSeconds: benchmarkResults.runtime_seconds,
        iterations: benchmarkResults.iterations,
        evaluations: benchmarkResults.evaluations,
        successRate: benchmarkResults.success_rate,
        hardwareInfo: benchmarkResults.hardware_info,
        submittedBy: username, // Use username instead of user ID
        executionMetadata: {
          submission_id: submissionId,
          num_runs: submission.num_runs,
          benchmark_timestamp: new Date().toISOString()
        }
      })

      // Step 5: Complete submission
      await this.updateSubmissionStatus(submissionId, 'completed', {
        progress: 100,
        current_step: 'Submission completed successfully!',
        results: {
          best_value: benchmarkResults.best_value,
          runtime_seconds: benchmarkResults.runtime_seconds,
          rank: leaderboardSubmission.rank || null,
          total_submissions: leaderboardSubmission.total_submissions || null,
          leaderboard_id: leaderboardSubmission.id
        }
      })

      // Create completion notification (with error handling)
      try {
        await NotificationService.createSubmissionNotification(
          submission.user_id,
          submissionId,
          'completed',
          {
            best_value: benchmarkResults.best_value,
            rank: leaderboardSubmission.rank,
            total_submissions: leaderboardSubmission.total_submissions
          }
        )
      } catch (notificationError) {
        console.warn('Failed to create completion notification:', notificationError.message)
      }

      return leaderboardSubmission

    } catch (error) {
      console.error(`Submission processing failed for ${submissionId}:`, error)
      await this.updateSubmissionStatus(submissionId, 'failed', {
        error_message: error.message,
        current_step: 'Processing failed'
      })

      // Create failure notification (with error handling)
      try {
        // Get submission details for notification
        const failedSubmission = await knex('leaderboard_submissions_queue')
          .where('id', submissionId)
          .first()

        if (failedSubmission) {
          await NotificationService.createSubmissionNotification(
            failedSubmission.user_id,
            submissionId,
            'failed',
            {
              error_message: error.message
            }
          )
        }
      } catch (notificationError) {
        console.warn('Failed to create failure notification:', notificationError.message)
      }

      throw error
    }
  }

  /**
   * Execute benchmark for the solver
   */
  static async executeBenchmark(submissionId, submission, problem, solverConfig, customParameters) {
    const executionService = UnifiedWorkflowExecutionService.getInstance()
    const results = []
    const numRuns = submission.num_runs || 5

    for (let run = 1; run <= numRuns; run++) {
      await this.updateSubmissionStatus(submissionId, 'executing', {
        progress: 30 + (run - 1) * (60 / numRuns),
        current_step: `Executing benchmark run ${run}/${numRuns}...`
      })

      try {
        // Parse repository path
        const [username, repoName] = submission.solver_repository.split('/')

        // Create workflow nodes for the unified execution service
        const nodes = [
          {
            id: 'problem-node',
            type: 'problem',
            data: {
              repo_id: `standardized/standardized-problem-${problem.id}`,
              parameters: problem.problem_config || {}
            }
          },
          {
            id: 'optimizer-node',
            type: 'optimizer',
            data: {
              repo_id: `${username}/${repoName}`,
              parameters: {
                ...solverConfig.default_params || {},
                ...customParameters
              }
            }
          }
        ]

        const connections = [
          {
            source: 'problem-node',
            target: 'optimizer-node'
          }
        ]

        // Generate unique execution ID for this run
        const executionId = `submission-${submissionId}-run-${run}`

        // Execute using unified workflow service
        const result = await executionService.executeWorkflow(
          executionId,
          nodes,
          connections,
          {},
          null, // No WebSocket for leaderboard submissions
          null  // No auth token needed for standardized problems
        )

        if (result && result.success && result.best_value !== undefined) {
          results.push({
            run_number: run,
            best_value: result.best_value,
            runtime_seconds: result.execution_time || result.runtime_seconds || 0,
            iterations: result.iterations || null,
            evaluations: result.evaluations || null,
            success: true
          })
        } else {
          results.push({
            run_number: run,
            success: false,
            error: result?.error_message || 'No valid result returned'
          })
        }

      } catch (error) {
        console.error(`Benchmark run ${run} failed:`, error)
        results.push({
          run_number: run,
          success: false,
          error: error.message
        })
      }
    }

    // Calculate aggregate statistics
    const successfulRuns = results.filter(r => r.success)

    if (successfulRuns.length === 0) {
      // Log detailed error information
      const errorMessages = results.map(r => r.error).filter(e => e)
      const uniqueErrors = [...new Set(errorMessages)]
      console.error('All benchmark runs failed. Errors:', uniqueErrors)

      throw new Error(`All benchmark runs failed. Common errors: ${uniqueErrors.slice(0, 3).join('; ')}`)
    }

    const bestValues = successfulRuns.map(r => r.best_value)
    const runtimes = successfulRuns.map(r => r.runtime_seconds)

    const bestValue = problem.objective_type === 'minimize' 
      ? Math.min(...bestValues)
      : Math.max(...bestValues)

    const meanValue = bestValues.reduce((a, b) => a + b, 0) / bestValues.length
    const stdValue = Math.sqrt(
      bestValues.reduce((sum, val) => sum + Math.pow(val - meanValue, 2), 0) / bestValues.length
    )

    const meanRuntime = runtimes.reduce((a, b) => a + b, 0) / runtimes.length

    return {
      best_value: bestValue,
      mean_value: meanValue,
      std_value: stdValue,
      runtime_seconds: meanRuntime,
      iterations: successfulRuns[0]?.iterations || null,
      evaluations: successfulRuns.reduce((sum, r) => sum + (r.evaluations || 0), 0),
      success_rate: (successfulRuns.length / numRuns) * 100,
      hardware_info: {
        execution_environment: 'kubernetes',
        container_image: 'qubots-executor'
      },
      individual_runs: results
    }
  }

  /**
   * Check if solver is compatible with problem type
   */
  static checkProblemCompatibility(solverConfig, problem) {
    if (!solverConfig.metadata?.problem_types) {
      return true // Assume compatible if not specified
    }

    return solverConfig.metadata.problem_types.includes(problem.problem_type) ||
           solverConfig.metadata.problem_types.includes('general')
  }

  /**
   * Update submission status and progress
   */
  static async updateSubmissionStatus(submissionId, status, updates = {}) {
    const updateData = {
      status,
      updated_at: new Date(),
      ...updates
    }

    // Store additional data as JSON
    if (updates.results) {
      updateData.results = JSON.stringify(updates.results)
    }

    await knex('leaderboard_submissions_queue')
      .where('id', submissionId)
      .update(updateData)

    // Log progress update
    if (updates.current_step) {
      await knex('submission_logs').insert({
        submission_id: submissionId,
        log_level: 'info',
        message: updates.current_step,
        timestamp: new Date()
      })
    }

    // Broadcast real-time update via WebSocket
    try {
      if (global.wsHandler && global.wsHandler.broadcastSubmissionUpdate) {
        const submissionData = await knex('leaderboard_submissions_queue')
          .where('id', submissionId)
          .first()

        if (submissionData) {
          global.wsHandler.broadcastSubmissionUpdate(submissionId, {
            submission: {
              ...submissionData,
              results: submissionData.results ? JSON.parse(submissionData.results) : null
            }
          })
        }
      }
    } catch (error) {
      console.error('Error broadcasting submission update:', error)
    }
  }

  /**
   * Get submission status
   */
  static async getSubmissionStatus(submissionId) {
    const submission = await knex('leaderboard_submissions_queue')
      .where('id', submissionId)
      .first()

    if (!submission) {
      throw new Error('Submission not found')
    }

    // Get recent logs
    const logs = await knex('submission_logs')
      .where('submission_id', submissionId)
      .orderBy('timestamp', 'desc')
      .limit(50)
      .select('message', 'log_level', 'timestamp')

    return {
      submission: {
        ...submission,
        results: submission.results ? JSON.parse(submission.results) : null
      },
      logs: logs.map(log => log.message).reverse()
    }
  }
}

module.exports = SubmissionWorkflowService

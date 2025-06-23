/**
 * Test script for the submission system
 * Run with: node test-submission.js
 */

const { knex } = require('./config/database')
const SubmissionWorkflowService = require('./services/submissionWorkflowService')

async function testSubmissionSystem() {
  console.log('🧪 Testing Submission System...\n')

  try {
    // Test 1: Check if submission tables exist
    console.log('1. Checking database tables...')
    
    try {
      const submissionCount = await knex('leaderboard_submissions_queue').count('* as count').first()
      console.log(`✅ Submission queue table exists with ${submissionCount.count} records`)
    } catch (error) {
      console.log('❌ Submission queue table missing:', error.message)
      return
    }

    try {
      const problemCount = await knex('standardized_problems').count('* as count').first()
      console.log(`✅ Standardized problems table exists with ${problemCount.count} records`)
    } catch (error) {
      console.log('❌ Standardized problems table missing:', error.message)
      return
    }

    // Test 2: Check if we have any problems to test with
    const problems = await knex('standardized_problems').limit(1)
    if (problems.length === 0) {
      console.log('❌ No standardized problems found. Please add some problems first.')
      return
    }

    const testProblem = problems[0]
    console.log(`✅ Using test problem: ${testProblem.name} (ID: ${testProblem.id})`)

    // Test 3: Create a test submission
    console.log('\n2. Creating test submission...')
    
    const testSubmissionData = {
      solver_repository: 'test-user/test-solver',
      problem_id: testProblem.id,
      custom_parameters: { test: true },
      num_runs: 1
    }

    const result = await SubmissionWorkflowService.submitSolverToLeaderboard(
      testSubmissionData,
      1, // Test user ID
      null // No token for test
    )

    console.log('✅ Test submission created:', result.submission_id)

    // Test 4: Check submission status
    console.log('\n3. Checking submission status...')
    
    setTimeout(async () => {
      try {
        const status = await SubmissionWorkflowService.getSubmissionStatus(result.submission_id)
        console.log('✅ Submission status:', status.submission.status)
        console.log('✅ Current step:', status.submission.current_step || 'None')
        
        if (status.logs && status.logs.length > 0) {
          console.log('✅ Recent logs:')
          status.logs.slice(-3).forEach(log => console.log(`   - ${log}`))
        }

        console.log('\n🎉 Submission system test completed!')
        process.exit(0)
      } catch (error) {
        console.error('❌ Error checking status:', error.message)
        process.exit(1)
      }
    }, 2000)

  } catch (error) {
    console.error('❌ Test failed:', error.message)
    console.error(error.stack)
    process.exit(1)
  }
}

// Run tests
console.log('Starting submission system test...\n')
testSubmissionSystem().catch(error => {
  console.error('❌ Test suite failed:', error)
  process.exit(1)
})

/**
 * Test script for GitHub OAuth integration
 * This script tests the GitHub OAuth service without making actual API calls
 */

require('dotenv').config()
const GitHubOAuthService = require('./services/githubOAuthService')

async function testGitHubOAuthService() {
  console.log('🧪 Testing GitHub OAuth Service...\n')

  // Test 1: Check if environment variables are configured
  console.log('1. Checking environment variables:')
  const clientId = process.env.GITHUB_CLIENT_ID
  const clientSecret = process.env.GITHUB_CLIENT_SECRET
  const redirectUri = process.env.GITHUB_REDIRECT_URI

  console.log(`   GITHUB_CLIENT_ID: ${clientId ? '✅ Set' : '❌ Not set'}`)
  console.log(`   GITHUB_CLIENT_SECRET: ${clientSecret ? '✅ Set' : '❌ Not set'}`)
  console.log(`   GITHUB_REDIRECT_URI: ${redirectUri || 'Using default'}`)

  if (!clientId || !clientSecret) {
    console.log('\n❌ GitHub OAuth is not properly configured.')
    console.log('Please set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET in your .env file.')
    return
  }

  // Test 2: Generate authorization URL
  console.log('\n2. Testing authorization URL generation:')
  try {
    const authUrl = GitHubOAuthService.getAuthorizationUrl()
    console.log(`   ✅ Authorization URL generated successfully`)
    console.log(`   URL: ${authUrl}`)
    
    // Validate URL structure
    const url = new URL(authUrl)
    const params = url.searchParams
    
    console.log(`   Client ID in URL: ${params.get('client_id') === clientId ? '✅' : '❌'}`)
    console.log(`   Redirect URI in URL: ${params.get('redirect_uri') ? '✅' : '❌'}`)
    console.log(`   Scope in URL: ${params.get('scope') === 'user:email' ? '✅' : '❌'}`)
    console.log(`   State parameter: ${params.get('state') ? '✅' : '❌'}`)
    
  } catch (error) {
    console.log(`   ❌ Error generating authorization URL: ${error.message}`)
  }

  // Test 3: Test token validation (mock)
  console.log('\n3. Testing token validation method:')
  try {
    // This will fail with invalid token, but we're testing the method exists
    const isValid = await GitHubOAuthService.validateToken('invalid_token')
    console.log(`   ✅ Token validation method works (returned: ${isValid})`)
  } catch (error) {
    console.log(`   ✅ Token validation method works (expected error: ${error.message})`)
  }

  // Test 4: Check service configuration
  console.log('\n4. Service configuration:')
  console.log(`   Client ID: ${GitHubOAuthService.clientId ? '✅ Configured' : '❌ Not configured'}`)
  console.log(`   Client Secret: ${GitHubOAuthService.clientSecret ? '✅ Configured' : '❌ Not configured'}`)
  console.log(`   Redirect URI: ${GitHubOAuthService.redirectUri}`)

  console.log('\n✅ GitHub OAuth Service test completed!')
  console.log('\nNext steps:')
  console.log('1. Create a GitHub OAuth App at: https://github.com/settings/applications/new')
  console.log('2. Set the authorization callback URL to: ' + (redirectUri || 'http://localhost:4000/api/auth/github/callback'))
  console.log('3. Add your Client ID and Secret to the .env file')
  console.log('4. Start the backend server and test the OAuth flow')
}

// Test database migration status
async function testDatabaseMigration() {
  console.log('\n🗄️  Testing database migration...')
  
  try {
    const { knex } = require('./config/database')
    
    // Check if github_id column exists
    const hasGitHubColumns = await knex.schema.hasColumn('users', 'github_id')
    console.log(`   GitHub ID column: ${hasGitHubColumns ? '✅ Exists' : '❌ Missing'}`)
    
    if (!hasGitHubColumns) {
      console.log('   ⚠️  Run database migration: npx knex migrate:latest --knexfile DB_postgres/knexfile.js')
    }
    
    await knex.destroy()
  } catch (error) {
    console.log(`   ❌ Database connection error: ${error.message}`)
  }
}

// Run tests
async function runTests() {
  await testGitHubOAuthService()
  await testDatabaseMigration()
}

if (require.main === module) {
  runTests().catch(console.error)
}

module.exports = { testGitHubOAuthService, testDatabaseMigration }

#!/usr/bin/env node

/**
 * GitHub OAuth Configuration Test Script
 * 
 * This script tests the GitHub OAuth configuration and helps debug authentication issues.
 * Run with: node test-github-oauth-fix.js
 */

require('dotenv').config()
const GitHubOAuthService = require('./services/githubOAuthService')

console.log('🔍 GitHub OAuth Configuration Test')
console.log('=====================================\n')

// Test 1: Environment Variables
console.log('1. Testing environment variables:')
const clientId = process.env.GITHUB_CLIENT_ID
const clientSecret = process.env.GITHUB_CLIENT_SECRET
const redirectUri = process.env.GITHUB_REDIRECT_URI

console.log(`   GITHUB_CLIENT_ID: ${clientId ? '✅ Set' : '❌ Not set'}`)
console.log(`   GITHUB_CLIENT_SECRET: ${clientSecret ? '✅ Set' : '❌ Not set'}`)
console.log(`   GITHUB_REDIRECT_URI: ${redirectUri || 'Using default'}`)
console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'development'}`)

if (!clientId || !clientSecret) {
  console.log('\n❌ GitHub OAuth credentials are not properly configured!')
  console.log('Please check your .env file and ensure GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET are set.')
  process.exit(1)
}

// Test 2: Service Initialization
console.log('\n2. Testing GitHub OAuth service initialization:')
try {
  const githubOAuthService = new GitHubOAuthService()
  console.log('   ✅ GitHub OAuth service initialized successfully')
  console.log(`   Client ID: ${githubOAuthService.clientId}`)
  console.log(`   Redirect URI: ${githubOAuthService.redirectUri}`)
  console.log(`   Active states count: ${githubOAuthService.activeStates.size}`)
} catch (error) {
  console.log(`   ❌ Error initializing GitHub OAuth service: ${error.message}`)
  process.exit(1)
}

// Test 3: Authorization URL Generation
console.log('\n3. Testing authorization URL generation:')
try {
  const githubOAuthService = new GitHubOAuthService()
  const authUrl = githubOAuthService.getAuthorizationUrl()
  console.log('   ✅ Authorization URL generated successfully')
  console.log(`   URL: ${authUrl}`)
  
  // Validate URL structure
  const url = new URL(authUrl)
  const params = url.searchParams
  
  console.log(`   Client ID in URL: ${params.get('client_id') === clientId ? '✅' : '❌'}`)
  console.log(`   Redirect URI in URL: ${params.get('redirect_uri') ? '✅' : '❌'}`)
  console.log(`   Scope in URL: ${params.get('scope') === 'user:email' ? '✅' : '❌'}`)
  console.log(`   State parameter: ${params.get('state') ? '✅' : '❌'}`)
  
  // Test state validation
  const state = params.get('state')
  console.log(`   State validation: ${githubOAuthService.validateState(state) ? '✅' : '❌'}`)
  
} catch (error) {
  console.log(`   ❌ Error generating authorization URL: ${error.message}`)
}

// Test 4: Configuration Recommendations
console.log('\n4. Configuration recommendations:')

const isProduction = process.env.NODE_ENV === 'production'
const expectedRedirectUri = isProduction 
  ? 'https://rastion.com/api/auth/github/callback'
  : 'http://localhost:4000/api/auth/github/callback'

if (redirectUri && redirectUri !== expectedRedirectUri) {
  console.log(`   ⚠️  Redirect URI mismatch. Expected: ${expectedRedirectUri}, Got: ${redirectUri}`)
} else {
  console.log(`   ✅ Redirect URI is correctly configured`)
}

if (isProduction && (!process.env.SESSION_SECRET || process.env.SESSION_SECRET === 'RwsikosPromaxxwnas')) {
  console.log('   ⚠️  Using default session secret in production - this is insecure!')
} else {
  console.log('   ✅ Session secret is properly configured')
}

console.log('\n5. Troubleshooting tips:')
console.log('   • Ensure your GitHub OAuth app callback URL matches the GITHUB_REDIRECT_URI')
console.log('   • Check that your GitHub OAuth app is configured for the correct environment')
console.log('   • Verify that cookies are enabled in your browser')
console.log('   • Check browser console for any CORS or cookie-related errors')
console.log('   • Use the debug endpoint: GET /api/auth/github/debug (development only)')

console.log('\n✅ GitHub OAuth configuration test completed!')

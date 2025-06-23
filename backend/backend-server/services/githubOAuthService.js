const fetch = (...args) => import("node-fetch").then(({ default: fetch }) => fetch(...args))

class GitHubOAuthService {
  constructor() {
    this.clientId = process.env.GITHUB_CLIENT_ID
    this.clientSecret = process.env.GITHUB_CLIENT_SECRET
    this.redirectUri = process.env.GITHUB_REDIRECT_URI ||
      (process.env.NODE_ENV === 'production'
        ? 'https://rastion.com/api/auth/github/callback'
        : 'http://localhost:4000/api/auth/github/callback')

    // Store active state parameters for validation
    this.activeStates = new Map()

    if (!this.clientId || !this.clientSecret) {
      console.warn('GitHub OAuth credentials not configured. GitHub authentication will not be available.')
    }
  }

  /**
   * Generate GitHub OAuth authorization URL
   * @returns {string} Authorization URL
   */
  getAuthorizationUrl() {
    if (!this.clientId) {
      throw new Error('GitHub OAuth not configured')
    }

    const state = this.generateState()

    // Store state with timestamp for validation
    this.activeStates.set(state, {
      timestamp: Date.now(),
      used: false
    })

    // Clean up old states (older than 10 minutes)
    this.cleanupOldStates()

    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      scope: 'user:email',
      state: state
    })

    return `https://github.com/login/oauth/authorize?${params.toString()}`
  }

  /**
   * Exchange authorization code for access token
   * @param {string} code - Authorization code from GitHub
   * @returns {Promise<Object>} Token data
   */
  async exchangeCodeForToken(code) {
    if (!this.clientId || !this.clientSecret) {
      throw new Error('GitHub OAuth not configured')
    }

    const response = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        code: code,
        redirect_uri: this.redirectUri
      })
    })

    if (!response.ok) {
      throw new Error(`GitHub token exchange failed: ${response.statusText}`)
    }

    const data = await response.json()
    
    if (data.error) {
      throw new Error(`GitHub OAuth error: ${data.error_description || data.error}`)
    }

    return data
  }

  /**
   * Get user profile from GitHub API
   * @param {string} accessToken - GitHub access token
   * @returns {Promise<Object>} User profile data
   */
  async getUserProfile(accessToken) {
    const response = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `token ${accessToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Rastion-Platform'
      }
    })

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.statusText}`)
    }

    const user = await response.json()

    // Get user email if not public
    if (!user.email) {
      try {
        const emailResponse = await fetch('https://api.github.com/user/emails', {
          headers: {
            'Authorization': `token ${accessToken}`,
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'Rastion-Platform'
          }
        })

        if (emailResponse.ok) {
          const emails = await emailResponse.json()
          const primaryEmail = emails.find(email => email.primary && email.verified)
          if (primaryEmail) {
            user.email = primaryEmail.email
          }
        }
      } catch (error) {
        console.warn('Could not fetch user email from GitHub:', error.message)
      }
    }

    return user
  }

  /**
   * Validate OAuth state parameter
   * @param {string} state - State parameter to validate
   * @returns {boolean} True if state is valid
   */
  validateState(state) {
    if (!state) {
      console.error('No state parameter provided')
      return false
    }

    const stateData = this.activeStates.get(state)
    if (!stateData) {
      console.error('Invalid or expired state parameter:', state)
      return false
    }

    if (stateData.used) {
      console.error('State parameter already used:', state)
      return false
    }

    // Check if state is not older than 10 minutes
    const maxAge = 10 * 60 * 1000 // 10 minutes
    if (Date.now() - stateData.timestamp > maxAge) {
      console.error('State parameter expired:', state)
      this.activeStates.delete(state)
      return false
    }

    // Mark state as used
    stateData.used = true
    this.activeStates.set(state, stateData)

    return true
  }

  /**
   * Clean up old state parameters
   */
  cleanupOldStates() {
    const maxAge = 10 * 60 * 1000 // 10 minutes
    const now = Date.now()

    for (const [state, data] of this.activeStates.entries()) {
      if (now - data.timestamp > maxAge) {
        this.activeStates.delete(state)
      }
    }
  }

  /**
   * Generate a random state parameter for OAuth security
   * @returns {string} Random state string
   */
  generateState() {
    return Math.random().toString(36).substring(2, 15) +
           Math.random().toString(36).substring(2, 15)
  }

  /**
   * Validate GitHub access token
   * @param {string} accessToken - GitHub access token
   * @returns {Promise<boolean>} True if token is valid
   */
  async validateToken(accessToken) {
    try {
      const response = await fetch('https://api.github.com/user', {
        headers: {
          'Authorization': `token ${accessToken}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'Rastion-Platform'
        }
      })

      return response.ok
    } catch (error) {
      console.error('Error validating GitHub token:', error)
      return false
    }
  }

  /**
   * Revoke GitHub access token
   * @param {string} accessToken - GitHub access token
   * @returns {Promise<boolean>} True if revocation was successful
   */
  async revokeToken(accessToken) {
    try {
      const response = await fetch(`https://api.github.com/applications/${this.clientId}/token`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64')}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'Rastion-Platform'
        },
        body: JSON.stringify({
          access_token: accessToken
        })
      })

      return response.ok
    } catch (error) {
      console.error('Error revoking GitHub token:', error)
      return false
    }
  }
}

module.exports = new GitHubOAuthService()

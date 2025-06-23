const express = require("express")
const crypto = require("crypto")
const { knex } = require("../config/database")
const GiteaService = require("../services/giteaService")
const EmailService = require("../services/emailService")
const githubOAuthService = require("../services/githubOAuthService")
const GitHubOAuthService = githubOAuthService // Alias for consistency

const router = express.Router()

// Set admin token endpoint
router.post("/set-admin-token", (req, res) => {
  const { value } = req.body

  if (!value) {
    return res.status(400).json({ error: "Could not parse value" })
  }

  GiteaService.setAdminToken(value)
  res.send(`Admin token successfully updated!`)
})

// Register user for first time
router.post("/register", async (req, res) => {
  const { username, email, password } = req.body

  try {
    const createUserRes = await GiteaService.createUser({
      username,
      email,
      password,
      restricted: true,
      must_change_password: false,
      send_notify: true,
    })

    if (!createUserRes.ok) {
      const error = await createUserRes.json()
      return res.status(createUserRes.status).json({ message: error.message })
    }

    const verificationToken = crypto.randomBytes(32).toString("hex")

    await knex("email_verifications").insert({
      username,
      email,
      password,
      token: verificationToken,
    })

    const baseUrl = process.env.NODE_ENV === 'production' ? 'https://rastion.com' : 'http://localhost:4000'
    const verificationLink = `${baseUrl}/api/auth/email-verify?token=${verificationToken}`

    await EmailService.sendVerificationEmail(email, verificationLink)

    res.status(201).json({ message: "User created. Check your email for verification." })
  } catch (error) {
    console.error("Registration error:", error)
    res.status(500).json({ message: "Internal server error" })
  }
})

// Email verification endpoint
router.get("/email-verify", async (req, res) => {
  const token = req.query.token

  try {
    const record = await knex("email_verifications").where({ token }).first()

    if (!record) {
      const frontendUrl = process.env.NODE_ENV === 'production' ? 'https://rastion.com' : 'http://localhost:8080'
      return res.redirect(`${frontendUrl}/email-verify?status=expired`)
    }

    // Activate user in Gitea
    const activateRes = await GiteaService.activateUser(record.username, {
      active: true,
      admin: false,
      prohibit_login: false,
      login_name: record.username,
      password: record.password,
      allow_create_organization: true,
      allow_git_hook: true,
      allow_import_local: true,
      restricted: false,
    })

    if (!activateRes.ok) {
      const error = await activateRes.json()
      const frontendUrl = process.env.NODE_ENV === 'production' ? 'https://rastion.com' : 'http://localhost:8080'
      return res.redirect(`${frontendUrl}/email-verify?status=error&msg=${encodeURIComponent(error.message)}`)
    }

    // Generate a personal access token for the user
    const basicAuth = `Basic ${Buffer.from(`${record.username}:${record.password}`).toString("base64")}`

    const tokenRes = await GiteaService.createUserToken(record.username, {
      name: `token-for-${record.username}-${Date.now()}`,
      scopes: ["read:repository", "write:user", "write:repository"],
    }, basicAuth)

    if (!tokenRes.ok) {
      const error = await tokenRes.json()
      console.error("Failed to create personal access token:", error)
    }

    const tokenData = await tokenRes.json()
    const userPersonalToken = tokenData.sha1 || null

    await knex("users").insert({
      username: record.username,
      email: record.email,
      password: record.password,
      gitea_token: userPersonalToken,
    })

    // Remove the verification token
    await knex("email_verifications").where({ token }).del()

    const frontendUrl = process.env.NODE_ENV === 'production' ? 'https://rastion.com' : 'http://localhost:8080'
    res.redirect(`${frontendUrl}/email-verify?status=success`)
  } catch (error) {
    console.error("Email verification error:", error)
    const frontendUrl = process.env.NODE_ENV === 'production' ? 'https://rastion.com' : 'http://localhost:8080'
    res.redirect(`${frontendUrl}/email-verify?status=error`)
  }
})

// Login endpoint
router.post("/login", async (req, res) => {
  const { username, password } = req.body

  try {
    // First, check if user exists in our database and has a stored token
    const existingUser = await knex("users").where({ username }).first()
    let userToken = null

    if (existingUser && existingUser.gitea_token) {
      // Validate the existing token with Gitea
      try {
        const validateRes = await GiteaService.getUserProfile(existingUser.gitea_token)
        if (validateRes.ok) {
          // Existing token is valid, use it
          userToken = existingUser.gitea_token
          console.log(`Reusing existing valid token for user: ${username}`)
        }
      } catch (error) {
        console.log(`Existing token invalid for user ${username}, will create new one`)
      }
    }

    // If no valid existing token, create a new one
    if (!userToken) {
      const createTokenRes = await GiteaService.createUserToken(username, {
        name: `rastion-token-${username}`,
        scopes: ["all"],
      }, "Basic " + Buffer.from(`${username}:${password}`).toString("base64"))

      if (!createTokenRes.ok) {
        const createTokenErr = await createTokenRes.json()
        console.error("Failed to create Gitea token:", createTokenErr)
        return res.status(createTokenRes.status).json({
          message: createTokenErr.message.split("[")[0] || "Failed to authenticate with Gitea.",
        })
      }

      const createdToken = await createTokenRes.json()
      userToken = createdToken["sha1"]

      // Update or insert the token in our database
      if (existingUser) {
        await knex("users").where({ username }).update({ gitea_token: userToken })
        console.log(`Updated token for existing user: ${username}`)
      } else {
        // This shouldn't happen in normal flow, but handle it just in case
        await knex("users").insert({
          username,
          email: "", // Will be updated from Gitea profile
          password: "", // Not storing password
          gitea_token: userToken,
        })
        console.log(`Created new user record with token: ${username}`)
      }
    }

    // Use the token to fetch the user's Gitea profile
    const profileRes = await GiteaService.getUserProfile(userToken)

    if (!profileRes.ok) {
      const profileErr = await profileRes.json()
      console.error("Failed to fetch Gitea profile:", profileErr)
      return res.status(profileRes.status).json({
        message: profileErr.message || "Failed to fetch user profile from Gitea.",
      })
    }

    const userProfile = await profileRes.json()

    req.session.user_data = {
      user: userProfile,
      token: userToken,
    }

    // Set HTTP-only cookie for authentication
    res.cookie("gitea_token", userToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'lax' : 'lax',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      domain: process.env.NODE_ENV === 'production' ? 'rastion.com' : undefined
    })

    return res.json({
      message: "Login successful",
      user: userProfile,
      // Remove token from response for security
    })
  } catch (err) {
    console.error("Login error:", err)
    return res.status(500).json({ message: "Internal server error" })
  }
})

// Change password endpoint
router.post("/change-password", async (req, res) => {
  const { old_password, new_password } = req.body

  // Try to get token from session first (HTTP-only cookie), then fallback to Authorization header
  let token = req.session?.user_data?.token

  // Fallback to Authorization header for backward compatibility during transition
  if (!token) {
    token = req.headers.authorization?.split(" ")[1]
  }

  if (!token) {
    return res.status(401).json({ message: "Unauthorized" })
  }

  if (!old_password || !new_password) {
    return res.status(400).json({ message: "Both old and new passwords are required" })
  }

  try {
    // Get user info from token
    const userRes = await GiteaService.getUserProfile(token)

    if (!userRes.ok) {
      const userErr = await userRes.json()
      return res.status(userRes.status).json({
        message: userErr.message || "Failed to authenticate user",
      })
    }

    const userData = await userRes.json()
    const username = userData.login

    // Change password using Gitea service
    await GiteaService.changePassword(username, old_password, new_password)

    return res.status(200).json({ message: "Password changed successfully" })
  } catch (error) {
    console.error("Error changing password:", error)
    if (error.message === "Current password is incorrect") {
      return res.status(401).json({ message: error.message })
    }
    return res.status(500).json({ message: "Internal server error" })
  }
})

// Logout endpoint
router.post("/logout", async (req, res) => {
  try {
    // Check if this is a GitHub OAuth user and revoke GitHub token
    if (req.session?.user_data?.auth_method === 'github' && req.session?.user_data?.github_user) {
      try {
        // Get the user's GitHub access token from database
        const user = await knex("users")
          .where({ github_id: req.session.user_data.github_user.id })
          .first()

        if (user && user.github_access_token) {
          // Revoke GitHub access token
          await GitHubOAuthService.revokeToken(user.github_access_token)
          console.log(`Revoked GitHub access token for user: ${user.username}`)

          // Clear GitHub access token from database
          await knex("users")
            .where({ id: user.id })
            .update({ github_access_token: null })
        }
      } catch (error) {
        console.error("Error revoking GitHub token during logout:", error)
        // Continue with logout even if token revocation fails
      }
    }

    // Clear session
    req.session.destroy((err) => {
      if (err) {
        console.error("Session destruction error:", err)
      }
    })

    // Clear HTTP-only cookie
    res.clearCookie("gitea_token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'lax' : 'lax',
      domain: process.env.NODE_ENV === 'production' ? 'rastion.com' : undefined
    })

    res.json({ message: "Logout successful" })
  } catch (err) {
    console.error("Logout error:", err)
    res.status(500).json({ message: "Internal server error" })
  }
})

// Get user's token for display in settings (requires authentication)
router.get("/token", async (req, res) => {
  try {
    // Get token from session first
    let token = req.session?.user_data?.token

    // If no token in session, try to restore from cookie
    if (!token) {
      const cookieToken = req.cookies?.gitea_token

      if (cookieToken) {
        try {
          // Validate the cookie token with Gitea
          const fetch = (...args) => import("node-fetch").then(({ default: fetch }) => fetch(...args))
          const response = await fetch(`${process.env.GITEA_URL}/api/v1/user`, {
            headers: { Authorization: `token ${cookieToken}` },
          })

          if (response.ok) {
            const userData = await response.json()

            // Restore session data
            req.session.user_data = {
              user: userData,
              token: cookieToken,
            }

            token = cookieToken
            console.log(`Session restored for token endpoint, user: ${userData.login}`)
          }
        } catch (error) {
          console.error("Error validating cookie token in /auth/token:", error)
        }
      }
    }

    // Check if we have GitHub authentication without Gitea token
    if (!token && req.session?.user_data?.auth_method === 'github') {
      console.log("GitHub user without Gitea token requesting token, returning placeholder")
      return res.json({
        token: "github_auth_placeholder",
        auth_method: "github",
        message: "GitHub authentication active, limited Rastion functionality"
      })
    }

    if (!token) {
      console.log("No valid token found in session or cookie for /auth/token endpoint")
      return res.status(401).json({ message: "Not authenticated" })
    }

    res.json({ token })
  } catch (err) {
    console.error("Token fetch error:", err)
    res.status(500).json({ message: "Internal server error" })
  }
})

// GitHub OAuth routes
router.get("/github", (req, res) => {
  try {
    console.log("Initiating GitHub OAuth flow...")
    const authUrl = githubOAuthService.getAuthorizationUrl()
    console.log("Redirecting to GitHub OAuth URL:", authUrl)
    res.redirect(authUrl)
  } catch (error) {
    console.error("Error initiating GitHub OAuth:", error)
    const frontendUrl = process.env.NODE_ENV === 'production' ? 'https://rastion.com' : 'http://localhost:8080'
    res.redirect(`${frontendUrl}/auth?error=oauth_init_failed`)
  }
})

// Debug endpoint for OAuth configuration
router.get("/github/debug", (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).json({ error: "Not found" })
  }

  res.json({
    github_oauth_configured: !!(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET),
    client_id: process.env.GITHUB_CLIENT_ID ? 'Set' : 'Not set',
    client_secret: process.env.GITHUB_CLIENT_SECRET ? 'Set' : 'Not set',
    redirect_uri: githubOAuthService.redirectUri,
    active_states_count: githubOAuthService.activeStates.size,
    environment: process.env.NODE_ENV
  })
})

router.get("/github/callback", async (req, res) => {
  const { code, error, state } = req.query
  const frontendUrl = process.env.NODE_ENV === 'production' ? 'https://rastion.com' : 'http://localhost:8080'

  console.log("GitHub OAuth callback received:", { code: !!code, error, state: !!state })

  if (error) {
    console.error("GitHub OAuth error:", error)
    return res.redirect(`${frontendUrl}/auth?error=oauth_error&details=${encodeURIComponent(error)}`)
  }

  if (!code) {
    console.error("No authorization code received from GitHub")
    return res.redirect(`${frontendUrl}/auth?error=no_code`)
  }

  // Validate state parameter
  if (!githubOAuthService.validateState(state)) {
    console.error("Invalid state parameter in GitHub OAuth callback")
    return res.redirect(`${frontendUrl}/auth?error=invalid_state`)
  }

  try {
    console.log("Attempting to exchange code for token...")

    // Exchange code for access token
    const tokenData = await githubOAuthService.exchangeCodeForToken(code)

    if (!tokenData.access_token) {
      console.error("Failed to get access token from GitHub:", tokenData)
      return res.redirect(`${frontendUrl}/auth?error=token_exchange_failed`)
    }

    console.log("Successfully obtained GitHub access token")

    // Get user profile from GitHub
    const githubUser = await githubOAuthService.getUserProfile(tokenData.access_token)

    if (!githubUser) {
      console.error("Failed to get user profile from GitHub")
      return res.redirect(`${frontendUrl}/auth?error=profile_fetch_failed`)
    }

    console.log("Successfully obtained GitHub user profile:", {
      id: githubUser.id,
      login: githubUser.login,
      email: githubUser.email
    })

    // Check if user already exists in our database (by GitHub ID, username, or email)
    let existingUser = await knex("users")
      .where({ github_id: githubUser.id })
      .orWhere({ username: githubUser.login })
      .orWhere({ email: githubUser.email })
      .first()

    console.log("Existing user lookup:", { found: !!existingUser, username: githubUser.login })

    let userToken = null

    if (existingUser) {
      // User exists, update GitHub info and reuse or create Gitea token
      if (existingUser.gitea_token) {
        // Validate existing Gitea token
        try {
          const validateRes = await GiteaService.getUserProfile(existingUser.gitea_token)
          if (validateRes.ok) {
            userToken = existingUser.gitea_token
            console.log(`Reusing existing Gitea token for GitHub user: ${githubUser.login}`)
          }
        } catch (error) {
          console.log(`Existing Gitea token invalid for GitHub user ${githubUser.login}, will create new one`)
        }
      }

      // Update user with GitHub info
      await knex("users")
        .where({ id: existingUser.id })
        .update({
          github_id: githubUser.id,
          github_username: githubUser.login,
          github_access_token: tokenData.access_token,
          email: githubUser.email || existingUser.email,
          full_name: githubUser.name || existingUser.full_name,
          avatar_url: githubUser.avatar_url || existingUser.avatar_url,
          updated_at: new Date()
        })
    } else {
      // New user, create account
      const userData = {
        username: githubUser.login,
        email: githubUser.email,
        github_id: githubUser.id,
        github_username: githubUser.login,
        github_access_token: tokenData.access_token,
        full_name: githubUser.name,
        avatar_url: githubUser.avatar_url,
        created_at: new Date(),
        updated_at: new Date()
      }

      try {
        // Insert new user
        const insertResult = await knex("users").insert(userData).returning('id')
        const userId = insertResult[0]?.id || insertResult[0]
        existingUser = { ...userData, id: userId }
      } catch (dbError) {
        // Handle duplicate key errors
        if (dbError.code === '23505') { // PostgreSQL unique constraint violation
          console.log("User already exists with this email/username, attempting to find and update...")

          // Try to find the existing user again with more specific criteria
          existingUser = await knex("users")
            .where({ email: githubUser.email })
            .orWhere({ username: githubUser.login })
            .first()

          if (existingUser) {
            // Update existing user with GitHub info
            await knex("users")
              .where({ id: existingUser.id })
              .update({
                github_id: githubUser.id,
                github_username: githubUser.login,
                github_access_token: tokenData.access_token,
                full_name: githubUser.name || existingUser.full_name,
                avatar_url: githubUser.avatar_url || existingUser.avatar_url,
                updated_at: new Date()
              })
          } else {
            // If we still can't find the user, this is an unexpected error
            throw dbError
          }
        } else {
          throw dbError
        }
      }
    }

    // Create or get Gitea token if we don't have one
    if (!userToken) {
      try {
        let giteaPassword = null

        // Check if user exists in Gitea
        const giteaUserRes = await GiteaService.getUserByUsername(githubUser.login)

        if (!giteaUserRes.ok) {
          // Generate a password for the Gitea user
          giteaPassword = crypto.randomBytes(32).toString('hex')

          // Create user in Gitea with GitHub data
          const createUserRes = await GiteaService.createUser({
            username: githubUser.login,
            email: githubUser.email || `${githubUser.login}@github.local`,
            password: giteaPassword,
            full_name: githubUser.name || githubUser.login,
            restricted: false,
            must_change_password: false,
            send_notify: false,
          })

          if (!createUserRes.ok) {
            console.error("Failed to create Gitea user for GitHub user:", githubUser.login)
            return res.redirect(`${frontendUrl}/auth?error=gitea_user_creation_failed`)
          }

          console.log("Successfully created Gitea user for GitHub user:", githubUser.login)
        } else {
          // User exists, but we need to get/set a password to create token
          // For existing GitHub users, we'll generate a new password and update it
          giteaPassword = crypto.randomBytes(32).toString('hex')

          // Update the user's password using admin API
          const updatePasswordRes = await fetch(`${process.env.GITEA_URL}/api/v1/admin/users/${githubUser.login}`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `token ${GiteaService.getAdminToken()}`,
            },
            body: JSON.stringify({
              password: giteaPassword,
              login_name: githubUser.login,
            }),
          })

          if (!updatePasswordRes.ok) {
            console.error("Failed to update password for existing Gitea user:", githubUser.login)
            // Continue anyway, maybe the user already has a password
          } else {
            console.log("Successfully updated password for existing Gitea user:", githubUser.login)
          }
        }

        // Create personal access token using basic auth with the password
        const tokenRes = await GiteaService.createUserToken(githubUser.login, {
          name: `rastion-token-${Date.now()}`,
          scopes: ["read:repository", "write:user", "write:repository", "read:user"],
        }, `Basic ${Buffer.from(`${githubUser.login}:${giteaPassword}`).toString('base64')}`)

        if (tokenRes.ok) {
          const tokenData = await tokenRes.json()
          userToken = tokenData.sha1

          console.log("Successfully created Rastion token for GitHub user:", githubUser.login)

          // Update user with Gitea token
          await knex("users")
            .where({ id: existingUser.id })
            .update({ gitea_token: userToken })

          // For security, change the password to a new random one after token creation
          // This ensures the temporary password can't be used for login
          if (giteaPassword) {
            try {
              const newSecurePassword = crypto.randomBytes(64).toString('hex')
              await fetch(`${process.env.GITEA_URL}/api/v1/admin/users/${githubUser.login}`, {
                method: "PATCH",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `token ${GiteaService.getAdminToken()}`,
                },
                body: JSON.stringify({
                  password: newSecurePassword,
                  login_name: githubUser.login,
                }),
              })
              console.log("Successfully updated password for security for GitHub user:", githubUser.login)
            } catch (passwordError) {
              console.warn("Failed to update password for security:", passwordError.message)
            }
          }

          // Update Gitea user avatar with GitHub avatar if available
          if (githubUser.avatar_url && userToken) {
            try {
              // Fetch the GitHub avatar image
              const avatarResponse = await fetch(githubUser.avatar_url)
              if (avatarResponse.ok) {
                const avatarBuffer = await avatarResponse.arrayBuffer()
                const base64Avatar = Buffer.from(avatarBuffer).toString('base64')

                // Update Gitea user avatar
                await GiteaService.updateUserAvatar(userToken, base64Avatar)
                console.log("Successfully updated Gitea avatar for GitHub user:", githubUser.login)
              }
            } catch (avatarError) {
              console.warn("Failed to update Gitea avatar for GitHub user:", githubUser.login, avatarError.message)
            }
          }
        } else {
          const errorData = await tokenRes.json()
          console.error("Failed to create Rastion token for GitHub user:", githubUser.login, errorData)
        }
      } catch (error) {
        console.error("Error creating Rastion token for GitHub user:", githubUser.login, error)
        console.error("Error details:", error.message)
        console.error("Error stack:", error.stack)
      }
    }

    // Get user profile for session - merge GitHub and Gitea data
    let userProfile = {
      // Start with GitHub data as base
      id: githubUser.id,
      login: githubUser.login,
      full_name: githubUser.name,
      avatar_url: githubUser.avatar_url,
      email: githubUser.email,
      // Add GitHub-specific fields
      github_id: githubUser.id,
      github_username: githubUser.login,
      auth_method: 'github'
    }

    if (userToken) {
      try {
        const giteaProfileRes = await GiteaService.getUserProfile(userToken)
        if (giteaProfileRes.ok) {
          const giteaProfile = await giteaProfileRes.json()
          // Merge GitHub data with Gitea profile, prioritizing GitHub data for avatar and name
          userProfile = {
            ...giteaProfile,
            // Use GitHub data for these fields as they're more up-to-date
            full_name: githubUser.name || giteaProfile.full_name,
            avatar_url: githubUser.avatar_url || giteaProfile.avatar_url,
            email: githubUser.email || giteaProfile.email,
            // Add GitHub-specific fields
            github_id: githubUser.id,
            github_username: githubUser.login,
            auth_method: 'github'
          }
        }
      } catch (error) {
        console.log("Could not fetch Gitea profile, using GitHub profile")
      }
    } else {
      console.log("No Rastion token available, using GitHub profile data only")
    }

    // Set session data
    req.session.user_data = {
      user: userProfile,
      token: userToken,
      github_user: githubUser,
      auth_method: 'github'
    }

    console.log("Session data set successfully for user:", githubUser.login)

    // Set HTTP-only cookie for authentication
    if (userToken) {
      const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax', // Use 'lax' for both dev and prod to allow OAuth redirects
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        path: '/' // Ensure cookie is available for all paths
      }

      // Only set domain in production
      if (process.env.NODE_ENV === 'production') {
        cookieOptions.domain = 'rastion.com'
      }

      res.cookie("gitea_token", userToken, cookieOptions)
      console.log("Authentication cookie set for user:", githubUser.login, "with options:", cookieOptions)
    } else {
      console.warn("No Rastion token available, user may have limited functionality")
    }

    // Save session before redirect
    req.session.save((err) => {
      if (err) {
        console.error("Failed to save session:", err)
        return res.redirect(`${frontendUrl}/auth?error=session_save_failed`)
      }

      console.log("GitHub OAuth authentication successful for user:", githubUser.login)
      // Redirect to profile page
      res.redirect(`${frontendUrl}/u/${githubUser.login}`)
    })

  } catch (error) {
    console.error("GitHub OAuth callback error:", error)
    console.error("Error stack:", error.stack)

    // Provide more specific error information
    let errorType = 'oauth_callback_failed'
    if (error.message.includes('GitHub token exchange')) {
      errorType = 'token_exchange_failed'
    } else if (error.message.includes('GitHub API')) {
      errorType = 'github_api_error'
    } else if (error.message.includes('database') || error.message.includes('knex')) {
      errorType = 'database_error'
    }

    res.redirect(`${frontendUrl}/auth?error=${errorType}&details=${encodeURIComponent(error.message)}`)
  }
})

module.exports = router

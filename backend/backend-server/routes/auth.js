const express = require("express")
const crypto = require("crypto")
const { knex } = require("../config/database")
const GiteaService = require("../services/giteaService")
const EmailService = require("../services/emailService")

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
router.post("/logout", (req, res) => {
  try {
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

module.exports = router

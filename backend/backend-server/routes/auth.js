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
    const createTokenRes = await GiteaService.createUserToken(username, {
      name: Date.now().toString(),
      scopes: ["all"],
    }, "Basic " + Buffer.from(`${username}:${password}`).toString("base64"))

    if (!createTokenRes.ok) {
      const createTokenErr = await createTokenRes.json()
      console.error("Failed to fetch Gitea profile:", createTokenErr)
      return res.status(createTokenRes.status).json({
        message: createTokenErr.message.split("[")[0] || "Failed to fetch user profile from Gitea.",
      })
    }

    const createdToken = await createTokenRes.json()
    const userToken = createdToken["sha1"]

    // Use the Gitea token to fetch the user's Gitea profile
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
    res.cookie("user_data", req.session.user_data)

    return res.json({
      message: "Login successful",
      user: userProfile,
      token: userToken,
    })
  } catch (err) {
    console.error("Login error:", err)
    return res.status(500).json({ message: "Internal server error" })
  }
})

// Change password endpoint
router.post("/change-password", async (req, res) => {
  const { old_password, new_password } = req.body
  const token = req.headers.authorization?.split(" ")[1]

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

module.exports = router

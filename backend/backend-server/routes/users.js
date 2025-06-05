const express = require("express")
const { knex } = require("../config/database")
const GiteaService = require("../services/giteaService")
const { auth } = require("../middleware/auth")

const router = express.Router()

// Get user profile
router.get("/profile", async (req, res) => {
  // Try to get token from session first (HTTP-only cookie), then fallback to Authorization header
  let token = req.session?.user_data?.token

  // Fallback to Authorization header for backward compatibility during transition
  if (!token) {
    token = req.headers.authorization?.split(" ")[1]
  }

  if (!token) {
    return res.status(401).json({ message: "Unrecognised request." })
  }

  try {
    const giteaRes = await GiteaService.getUserProfile(token)

    if (!giteaRes.ok) {
      const errData = await giteaRes.json()
      return res.status(giteaRes.status).json({ message: errData.message || "Failed to fetch user" })
    }

    const userData = await giteaRes.json()
    res.json(userData)
  } catch (error) {
    console.error("Profile fetch error:", error)
    res.status(500).json({ message: "Internal server error" })
  }
})

// Get user profile by username (public endpoint for avatars)
router.get("/:username/public", async (req, res) => {
  const { username } = req.params

  try {
    // Use admin token for public user data access
    const adminToken = GiteaService.getAdminToken()

    if (!adminToken) {
      return res.status(500).json({ message: "Service configuration error" })
    }

    const giteaRes = await GiteaService.getUserByUsername(username, adminToken)

    if (!giteaRes.ok) {
      const errData = await giteaRes.json()
      return res.status(giteaRes.status).json({ message: errData.message || "Failed to fetch user" })
    }

    const userData = await giteaRes.json()

    // Return only public information needed for avatars
    const publicUserData = {
      login: userData.login,
      avatar_url: userData.avatar_url,
      full_name: userData.full_name
    }

    res.json(publicUserData)
  } catch (error) {
    console.error("Public user fetch error:", error)
    res.status(500).json({ message: "Internal server error" })
  }
})

// Get user profile by username
router.get("/:username", async (req, res) => {
  const { username } = req.params

  // Try to get token from session first (HTTP-only cookie), then fallback to Authorization header
  let token = req.session?.user_data?.token

  // Fallback to Authorization header for backward compatibility during transition
  if (!token) {
    token = req.headers.authorization?.split(" ")[1]
  }

  if (!token) {
    return res.status(401).json({ message: "Not logged in." })
  }

  try {
    const giteaRes = await GiteaService.getUserByUsername(username, token)

    if (!giteaRes.ok) {
      const errData = await giteaRes.json()
      return res.status(giteaRes.status).json({ message: errData.message || "Failed to fetch user" })
    }

    const userData = await giteaRes.json()
    res.json(userData)
  } catch (error) {
    console.error("User fetch error:", error)
    res.status(500).json({ message: "Internal server error" })
  }
})

// Get user repositories by username
router.get("/:username/repos", async (req, res) => {
  const { username } = req.params

  // Try to get token from session first (HTTP-only cookie), then fallback to Authorization header
  let token = req.session?.user_data?.token

  // Fallback to Authorization header for backward compatibility during transition
  if (!token) {
    token = req.headers.authorization?.split(" ")[1]
  }

  if (!token) {
    return res.status(401).json({ message: "Unrecognised request." })
  }

  try {
    const giteaRes = await GiteaService.getUserRepos(username, token)

    if (!giteaRes.ok) {
      const errData = await giteaRes.json()
      return res.status(giteaRes.status).json({ message: errData.message || "Failed to fetch user repositories" })
    }

    const reposData = await giteaRes.json()
    res.json(reposData)
  } catch (error) {
    console.error("User repositories fetch error:", error)
    res.status(500).json({ message: "Internal server error" })
  }
})

// Update user profile
router.patch("/profile", async (req, res) => {
  // Try to get token from session first (HTTP-only cookie), then fallback to Authorization header
  let token = req.session?.user_data?.token

  // Fallback to Authorization header for backward compatibility during transition
  if (!token) {
    token = req.headers.authorization?.split(" ")[1]
  }

  if (!token) {
    return res.status(401).json({ message: "Unrecognised request." })
  }

  const { full_name, location, website, description } = req.body

  const currentSettings = {
    diff_view_style: req.body.diff_view_style || "unified",
    hide_activity: req.body.hide_activity !== undefined ? req.body.hide_activity : false,
    hide_email: req.body.hide_email !== undefined ? req.body.hide_email : false,
    language: req.body.language || "en-US",
    theme: req.body.theme || "default",
    full_name: full_name || "",
    location: location || "",
    website: website || "",
    description: description || "",
  }

  const payload = {
    description: currentSettings.description,
    diff_view_style: currentSettings.diff_view_style,
    full_name: currentSettings.full_name,
    hide_activity: currentSettings.hide_activity,
    hide_email: currentSettings.hide_email,
    language: currentSettings.language,
    location: currentSettings.location,
    theme: currentSettings.theme,
    website: currentSettings.website,
  }

  try {
    const giteaResponse = await GiteaService.updateUserSettings(token, payload)

    if (!giteaResponse.ok) {
      const errText = await giteaResponse.text()
      return res.status(giteaResponse.status).json({ message: errText || "Failed to update user settings" })
    }

    if (giteaResponse.status === 204) {
      return res.json({ message: "Profile updated successfully." })
    }

    const responseText = await giteaResponse.text()
    const updatedUserData = responseText ? JSON.parse(responseText) : { message: "Profile updated successfully." }

    res.json(updatedUserData)
  } catch (error) {
    console.error("Profile update error:", error)
    res.status(500).json({ message: "Internal server error" })
  }
})

// Update user avatar
router.post("/update-avatar", async (req, res) => {
  // Try to get token from session first (HTTP-only cookie), then fallback to Authorization header
  let userToken = req.session?.user_data?.token

  // Fallback to Authorization header for backward compatibility during transition
  if (!userToken) {
    const authHeader = req.headers.authorization
    if (authHeader) {
      userToken = authHeader.split(" ")[1]
    }
  }

  if (!userToken) {
    return res.status(401).json({ message: "Unrecognized request." })
  }

  const { image } = req.body

  if (!image) {
    return res.status(400).json({ message: "Image data is required" })
  }

  try {
    // Verify the token and get the username
    const userResponse = await GiteaService.getUserProfile(userToken)

    if (!userResponse.ok) {
      const errData = await userResponse.json()
      return res.status(userResponse.status).json({
        message: errData.message || "Failed to authenticate user",
      })
    }

    const userData = await userResponse.json()
    const username = userData.login

    // Update avatar
    const avatarResponse = await GiteaService.updateUserAvatar(userToken, image)

    if (!avatarResponse.ok) {
      const errData = await avatarResponse.json()
      return res.status(avatarResponse.status).json({
        message: errData.message || "Failed to update avatar",
      })
    }

    res.status(200).json({ message: "Avatar updated successfully" })
  } catch (error) {
    console.error("Error updating avatar:", error)
    res.status(500).json({ message: "Internal server error" })
  }
})

// Get user's repositories
router.get("/user-repos", async (req, res) => {
  try {
    // Try to get token from session first (HTTP-only cookie), then fallback to Authorization header
    let token = req.session?.user_data?.token

    // Fallback to Authorization header for backward compatibility during transition
    if (!token) {
      token = req.headers.authorization?.split(" ")[1]
    }

    if (!token) {
      return res.status(401).json({ message: "Unrecognised request." })
    }

    // Get user info from Gitea
    const userRes = await GiteaService.getUserProfile(token)

    if (!userRes.ok) {
      const userErr = await userRes.json()
      return res.status(userRes.status).json({ message: userErr.message || "Failed to fetch user info." })
    }

    const userData = await userRes.json()

    // Fetch the list of repos for that user
    const reposRes = await GiteaService.getUserRepos(userData.login, token)

    if (!reposRes.ok) {
      const reposErr = await reposRes.json()
      return res.status(reposRes.status).json({ message: reposErr.message || "Failed to fetch user repos." })
    }

    const reposData = await reposRes.json()
    return res.json(reposData)
  } catch (error) {
    console.error("Error fetching user repos:", error)
    return res.status(500).json({ message: "Internal server error" })
  }
})

// Check if the authenticated user is following a specific user
router.get("/following/:username", auth, async (req, res) => {
  const { username } = req.params

  try {
    const response = await GiteaService.checkFollowStatus(req.user.token, username)

    if (response.status === 204) {
      return res.status(204).send()
    } else {
      return res.status(404).json({ message: "Not following this user" })
    }
  } catch (error) {
    console.error("Error checking follow status:", error)
    return res.status(500).json({ message: "Internal server error" })
  }
})

// Follow a user
router.put("/following/:username", auth, async (req, res) => {
  const { username } = req.params

  try {
    const response = await GiteaService.followUser(req.user.token, username)

    if (response.status === 204) {
      // Record the follow activity
      try {
        await knex("user_activities").insert({
          username: req.user.login,
          activity_type: "user_followed",
          target_user: username,
          created_at: knex.fn.now(),
        })
      } catch (dbError) {
        console.error("Error recording follow activity:", dbError)
      }

      return res.status(204).send()
    } else {
      const errorData = await response.json()
      return res.status(response.status).json({
        message: errorData.message || "Failed to follow user",
      })
    }
  } catch (error) {
    console.error("Error following user:", error)
    return res.status(500).json({ message: "Internal server error" })
  }
})

// Unfollow a user
router.delete("/following/:username", auth, async (req, res) => {
  const { username } = req.params

  try {
    const response = await GiteaService.unfollowUser(req.user.token, username)

    if (response.status === 204) {
      return res.status(204).send()
    } else {
      const errorData = await response.json()
      return res.status(response.status).json({
        message: errorData.message || "Failed to unfollow user",
      })
    }
  } catch (error) {
    console.error("Error unfollowing user:", error)
    return res.status(500).json({ message: "Internal server error" })
  }
})

// Get a user's followers
router.get("/:username/followers", async (req, res) => {
  const { username } = req.params

  // Try to get token from session first (HTTP-only cookie), then fallback to Authorization header
  let token = req.session?.user_data?.token

  // Fallback to Authorization header for backward compatibility during transition
  if (!token) {
    token = req.headers.authorization?.split(" ")[1]
  }

  try {
    const response = await GiteaService.getUserFollowers(username, token)

    if (!response.ok) {
      const errorData = await response.json()
      return res.status(response.status).json({
        message: errorData.message || "Failed to fetch followers",
      })
    }

    const followers = await response.json()
    return res.json(followers)
  } catch (error) {
    console.error("Error fetching followers:", error)
    return res.status(500).json({ message: "Internal server error" })
  }
})

// Get users that a user is following
router.get("/:username/following", async (req, res) => {
  const { username } = req.params

  // Try to get token from session first (HTTP-only cookie), then fallback to Authorization header
  let token = req.session?.user_data?.token

  // Fallback to Authorization header for backward compatibility during transition
  if (!token) {
    token = req.headers.authorization?.split(" ")[1]
  }

  try {
    const response = await GiteaService.getUserFollowing(username, token)

    if (!response.ok) {
      const errorData = await response.json()
      return res.status(response.status).json({
        message: errorData.message || "Failed to fetch following",
      })
    }

    const following = await response.json()
    return res.json(following)
  } catch (error) {
    console.error("Error fetching following:", error)
    return res.status(500).json({ message: "Internal server error" })
  }
})

// Get user activities
router.get("/activities", auth, async (req, res) => {
  try {
    const activities = await knex("user_activities")
      .where({ username: req.user.login })
      .orderBy("created_at", "desc")
      .limit(50)

    return res.json(activities)
  } catch (error) {
    console.error("Error fetching user activities:", error)
    return res.status(500).json({ message: "Internal server error" })
  }
})

// Get activities for a specific user
router.get("/:username/activities", async (req, res) => {
  const { username } = req.params

  try {
    const activities = await knex("user_activities").where({ username }).orderBy("created_at", "desc").limit(50)

    return res.json(activities)
  } catch (error) {
    console.error(`Error fetching activities for user ${username}:`, error)
    return res.status(500).json({ message: "Internal server error" })
  }
})

// Record a follow activity
router.post("/follow-activity", auth, async (req, res) => {
  const { targetUsername } = req.body

  if (!targetUsername) {
    return res.status(400).json({ error: "Target username is required" })
  }

  try {
    await knex("user_activities").insert({
      username: req.user.login,
      activity_type: "user_followed",
      target_user: targetUsername,
      created_at: knex.fn.now(),
    })

    return res.status(201).json({ message: "Follow activity recorded successfully" })
  } catch (error) {
    console.error("Error recording follow activity:", error)
    return res.status(500).json({ message: "Internal server error" })
  }
})

module.exports = router

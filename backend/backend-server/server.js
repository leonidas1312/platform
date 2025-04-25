const fetch = (...args) => import("node-fetch").then(({ default: fetch }) => fetch(...args))
const express = require("express")
const session = require("express-session")
const cors = require("cors")
const crypto = require("crypto")
const knex = require("knex")(require("./DB_postgres/knexfile").production)
const nodemailer = require("nodemailer")
require("dotenv").config()

const app = express()
app.use(express.json())
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true)
      if (origin.startsWith("http://localhost") || origin.startsWith("http://127.0.0.1")) {
        return callback(null, true)
      }
      return callback(new Error("Not allowed by CORS"))
    },
    credentials: true,
  }),
)

// Session Middleware
app.use(
  session({
    secret: "RwsikosPromaxxwnas",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, httpOnly: true, maxAge: 6000000 }, // 100 min expiry
  }),
)

const GITEA_URL = process.env.GITEA_URL
let ADMIN_TOKEN = "not_set"

// Authentication middleware
const auth = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1] // Get token from header
  if (!token) {
    return res.status(401).json({ message: "Authentication required" })
  }

  // Store the token in the request object for use in route handlers
  req.user = { token }

  // Fetch user info from Gitea
  fetch(`${GITEA_URL}/api/v1/user`, {
    headers: { Authorization: `token ${token}` },
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Invalid token")
      }
      return response.json()
    })
    .then((userData) => {
      req.user = { ...req.user, ...userData }
      next()
    })
    .catch((error) => {
      console.error("Auth error:", error)
      res.status(401).json({ message: "Authentication failed" })
    })
}

app.post("/set-admin-token", (req, res) => {
  const { value } = req.body

  if (!value) {
    return res.status(400).json({ error: "Could not parse value" })
  }

  ADMIN_TOKEN = value
  res.send(`Admin token successfully updated!`)
})

const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: "gleonidas303@gmail.com",
    pass: "kukg nnvi plpp wtfx",
  },
})

async function sendVerificationEmail(email, verificationLink) {
  await transporter.sendMail({
    from: "Rastion platform <gleonidas303@gmail.com>",
    to: email,
    subject: "Verify Your Email",
    html: `<p>Please verify your account by clicking this <a href="${verificationLink}">link</a>.</p>`,
  })
}

// This route registers user for first time
app.post("/api/register", async (req, res) => {
  const { username, email, password } = req.body
  console.log(ADMIN_TOKEN)
  const createUserRes = await fetch(`${GITEA_URL}/api/v1/admin/users`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `token ${ADMIN_TOKEN}`,
    },
    body: JSON.stringify({
      username,
      email,
      password,
      restricted: true,
      must_change_password: false,
      send_notify: true,
    }),
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

  const verificationLink = `http://localhost:4000/api/email-verify?token=${verificationToken}`

  await sendVerificationEmail(email, verificationLink)

  res.status(201).json({ message: "User created. Check your email for verification." })
})

// This route accepts the verification link from the user and verifies the user
app.get("/api/email-verify", async (req, res) => {
  const token = req.query.token
  const record = await knex("email_verifications").where({ token }).first()

  if (!record) {
    return res.redirect("http://localhost:8080/email-verify?status=expired")
  }

  // 1) Activate user in Gitea
  const activateRes = await fetch(`${GITEA_URL}/api/v1/admin/users/${record.username}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `token ${ADMIN_TOKEN}`,
    },
    body: JSON.stringify({
      active: true,
      admin: false,
      prohibit_login: false,
      login_name: record.username,
      password: record.password,
      allow_create_organization: true,
      allow_git_hook: true,
      allow_import_local: true,
      restricted: false,
    }),
  })

  if (!activateRes.ok) {
    const error = await activateRes.json()
    return res.redirect(`http://localhost:8080/email-verify?status=error&msg=${encodeURIComponent(error.message)}`)
  }

  // 2) Generate a personal access token for the user
  // 1) Build Basic Auth
  const basicAuth = `Basic ${Buffer.from(`${record.username}:${record.password}`).toString("base64")}`

  const tokenRes = await fetch(`${GITEA_URL}/api/v1/users/${record.username}/tokens`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: basicAuth, // Use admin token to create user token
    },
    body: JSON.stringify({
      name: `token-for-${record.username}-${Date.now()}`, // unique name
      scopes: ["read:repository", "write:user", "write:repository"],
    }),
  })

  if (!tokenRes.ok) {
    const error = await tokenRes.json()
    console.error("Failed to create personal access token:", error)
    // Depending on your workflow, you can still proceed or show an error
  }

  const tokenData = await tokenRes.json()
  // Gitea returns the *plain-text* token in `sha1` field when first created
  const userPersonalToken = tokenData.sha1 || null

  await knex("users").insert({
    username: record.username,
    email: record.email,
    password: record.password, // hashed password from your record
    gitea_token: userPersonalToken,
    // etc...
  })
  // ↑ This is optional, if you want to update instead of error on conflict

  // 3) Insert (or update) user in your local DB
  await knex("email_verifications").where({ token }).del() // remove the verification token

  // 4) Redirect on success
  res.redirect("http://localhost:8080/email-verify?status=success")
})

// This route logs in the user after clicking login
app.post("/api/login", async (req, res) => {
  const { username, password } = req.body

  try {
    const createTokenRes = await fetch(`${GITEA_URL}/api/v1/users/${username}/tokens`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Basic " + Buffer.from(`${username}:${password}`).toString("base64"),
      },
      body: JSON.stringify({
        name: Date.now().toString(),
        scopes: ["all"],
      }),
    })

    if (!createTokenRes.ok) {
      const createTokenErr = await createTokenRes.json()
      console.error("Failed to fetch Gitea profile:", createTokenErr)
      return res.status(createTokenRes.status).json({
        message: createTokenErr.message.split("[")[0] || "Failed to fetch user profile from Gitea.",
      })
    }

    const createdToken = await createTokenRes.json()

    const userToken = createdToken["sha1"]

    // 4) Use the Gitea token to fetch the user's Gitea profile
    const profileRes = await fetch(`${GITEA_URL}/api/v1/user`, {
      method: "GET",
      headers: {
        Authorization: `token ${userToken}`,
      },
    })

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
    // 6) Return whatever data you want the frontend to have
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

// This route returns user information for the profile page
app.get("/api/profile", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1] // Get token from header
  if (!token) {
    return res.status(401).json({ message: "Unrecognised request." })
  }

  try {
    const giteaRes = await fetch(`${GITEA_URL}/api/v1/user`, {
      headers: { Authorization: `token ${token}` },
    })

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

// Get user profile by username
app.get("/api/users/:username", async (req, res) => {
  const { username } = req.params

  const token = req.headers.authorization?.split(" ")[1] // Get token from header
  if (!token) {
    return res.status(401).json({ message: "Not logged in." })
  }

  try {
    const giteaRes = await fetch(`${GITEA_URL}/api/v1/users/${username}`, {
      headers: { Authorization: `token ${token}` },
    })

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
app.get("/api/users/:username/repos", async (req, res) => {
  const { username } = req.params

  const token = req.headers.authorization?.split(" ")[1] // Get token from header
  if (!token) {
    return res.status(401).json({ message: "Unrecognised request." })
  }

  try {
    const giteaRes = await fetch(`${GITEA_URL}/api/v1/users/${username}/repos`, {
      headers: { Authorization: `token ${token}` },
    })

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

// PATCH /api/profile
app.patch("/api/profile", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1] // Get token from header
  if (!token) {
    return res.status(401).json({ message: "Unrecognised request." })
  }

  // Extract only the fields that the user wants to update.
  // The frontend may send only the changed fields.
  const { full_name, location, website, description } = req.body

  // Merge with the existing user settings.
  // Ideally, you would have the full current settings available.
  // For demonstration, we assume default values if not available.
  const currentSettings = {
    diff_view_style: req.body.diff_view_style || "unified", // default or current value
    hide_activity: req.body.hide_activity !== undefined ? req.body.hide_activity : false,
    hide_email: req.body.hide_email !== undefined ? req.body.hide_email : false,
    language: req.body.language || "en-US",
    theme: req.body.theme || "default",
    // The following come from the update or current values
    full_name: full_name || "",
    location: location || "",
    website: website || "",
    description: description || "",
  }

  // Build the full payload
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
    const giteaResponse = await fetch(`${GITEA_URL}/api/v1/user/settings`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `token ${token}`,
      },
      body: JSON.stringify(payload),
    })

    if (!giteaResponse.ok) {
      const errText = await giteaResponse.text()
      return res.status(giteaResponse.status).json({ message: errText || "Failed to update user settings" })
    }

    // Some endpoints might return a 204 No Content response.
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

// This route returns a user's repos in Gitea
app.get("/api/user-repos", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1] // Get token from header
    if (!token) {
      return res.status(401).json({ message: "Unrecognised request." })
    }

    // 2) (Optional) figure out the user's username by calling /api/v1/user
    //    Because we need their actual username for the next step
    const userRes = await fetch(`${GITEA_URL}/api/v1/user`, {
      headers: { Authorization: `token ${token}` },
    })

    if (!userRes.ok) {
      const userErr = await userRes.json()
      return res.status(userRes.status).json({ message: userErr.message || "Failed to fetch user info." })
    }

    const userData = await userRes.json()
    // userData.login is the Gitea username

    // 3) Fetch the list of repos for that user
    //    For Gitea, you can call GET /users/:username/repos
    //    or if the user is the same as the token, GET /user/repos might also work
    const reposRes = await fetch(`${GITEA_URL}/api/v1/users/${userData.login}/repos`, {
      headers: { Authorization: `token ${token}` },
    })

    if (!reposRes.ok) {
      const reposErr = await reposRes.json()
      return res.status(reposRes.status).json({ message: reposErr.message || "Failed to fetch user repos." })
    }

    const reposData = await reposRes.json()
    // This should be an array of repo objects

    // 4) Return the repos array to the frontend
    return res.json(reposData)
  } catch (error) {
    console.error("Error fetching user repos:", error)
    return res.status(500).json({ message: "Internal server error" })
  }
})

// Add this new endpoint to fetch repository config files
app.get("/api/repos/:owner/:repo/config", async (req, res) => {
  const { owner, repo } = req.params
  const authHeader = req.headers.authorization
  const headers = {}

  if (authHeader) {
    headers.Authorization = authHeader
  }

  try {
    // Try to fetch the config.json file from the repository
    const configResponse = await fetch(`${GITEA_URL}/api/v1/repos/${owner}/${repo}/contents/config.json`, {
      headers,
    })

    if (!configResponse.ok) {
      // If config.json doesn't exist, return empty object
      return res.json({ keywords: [] })
    }

    const configData = await configResponse.json()

    // Decode the content from base64
    if (configData.content) {
      const decodedContent = Buffer.from(configData.content, "base64").toString("utf-8")
      try {
        const parsedConfig = JSON.parse(decodedContent)
        return res.json(parsedConfig)
      } catch (parseError) {
        console.error("Error parsing config.json:", parseError)
        return res.json({ keywords: [] })
      }
    } else {
      return res.json({ keywords: [] })
    }
  } catch (error) {
    console.error("Error fetching config.json:", error)
    res.status(500).json({ message: "Failed to fetch repository config", error: error.message })
  }
})

// API endpoint for searching public repositories with filtering and sorting
app.get("/api/public-repos", async (req, res) => {
  try {
    const {
      q = "", // Search query
      page = 1, // Page number
      limit = 26, // Items per page
      sort = "updated", // Sort field (updated, stars, forks, created)
      order = "desc", // Sort order (asc, desc)
      languages = "", // Comma-separated list of languages
      keywords = "", // Comma-separated list of keywords
    } = req.query

    // Get auth token if available (for accessing private repos the user has access to)
    const authHeader = req.headers.authorization
    const headers = {}
    if (authHeader) {
      headers.Authorization = authHeader
    }

    // Build query parameters for Gitea API
    const repoParams = new URLSearchParams({
      q,
      page,
      limit,
      sort: mapSortField(sort),
      order: sort === "alpha" ? "asc" : "desc", // alpha is sorted asc by default, others desc
      includeDesc: "true",
    })

    // Fetch repositories from Gitea API
    const repoResponse = await fetch(`${GITEA_URL}/api/v1/repos/search?${repoParams.toString()}`, { headers })

    if (!repoResponse.ok) {
      throw new Error(`Failed to fetch repositories: ${repoResponse.status} ${repoResponse.statusText}`)
    }

    const repoData = await repoResponse.json()
    let repos = repoData.data || []
    let totalCount = repoData.total_count || 0

    // Apply language filtering if specified
    if (languages) {
      const languageList = languages.split(",").map((lang) => lang.trim().toLowerCase())
      repos = repos.filter((repo) => repo.language && languageList.includes(repo.language.toLowerCase()))
    }

    // If keyword filtering is specified and we want to search in config.json files
    if (keywords) {
      const keywordList = keywords.split(",").map((kw) => kw.trim().toLowerCase())

      // First, filter by name and description as usual
      const filteredRepos = repos.filter((repo) => {
        const description = (repo.description || "").toLowerCase()
        const name = repo.name.toLowerCase()
        return keywordList.some((kw) => description.includes(kw) || name.includes(kw))
      })

      // For repositories that don't match by name/description, check their config.json
      const remainingRepos = repos.filter((repo) => !filteredRepos.some((filteredRepo) => filteredRepo.id === repo.id))

      // Only process a reasonable number of repos to avoid too many requests
      const reposToCheck = remainingRepos.slice(0, 20)

      // Fetch and check config.json for each remaining repo
      for (const repo of reposToCheck) {
        try {
          const configResponse = await fetch(
            `${GITEA_URL}/api/v1/repos/${repo.owner.login}/${repo.name}/contents/config.json`,
            { headers },
          )

          if (configResponse.ok) {
            const configData = await configResponse.json()
            if (configData.content) {
              const decodedContent = Buffer.from(configData.content, "base64").toString("utf-8")
              try {
                const parsedConfig = JSON.parse(decodedContent)

                // Check if any of the keywords match the config.json keywords
                if (parsedConfig.keywords && Array.isArray(parsedConfig.keywords)) {
                  const configKeywords = parsedConfig.keywords.map((kw) =>
                    typeof kw === "string" ? kw.toLowerCase() : "",
                  )

                  if (keywordList.some((kw) => configKeywords.includes(kw))) {
                    // Add this repo to the filtered list
                    filteredRepos.push(repo)

                    // Store the matching keywords in the repo object for frontend display
                    repo.matching_keywords = keywordList.filter((kw) => configKeywords.includes(kw))
                  }
                }
              } catch (parseError) {
                console.error(`Error parsing config.json for ${repo.full_name}:`, parseError)
              }
            }
          }
        } catch (error) {
          console.error(`Error fetching config.json for ${repo.full_name}:`, error)
        }
      }

      // Update the repos list with the filtered results
      repos = filteredRepos
    }

    // If searching usernames is enabled and there's a search query
    if (q) {
      // Search for users
      const userParams = new URLSearchParams({
        q,
        page: "1", // Always get first page of users
        limit: "5", // Limit to 5 users to avoid too many requests
      })

      const userResponse = await fetch(`${GITEA_URL}/api/v1/users/search?${userParams.toString()}`, { headers })

      if (userResponse.ok) {
        const userData = await userResponse.json()
        const users = userData.data || []

        // If users are found, fetch their repositories
        if (users.length > 0) {
          const userRepos = []

          // For each user, fetch their repositories
          for (const user of users) {
            const userRepoParams = new URLSearchParams({
              limit: "50", // Limit to 50 repos per user
            })

            const userRepoResponse = await fetch(
              `${GITEA_URL}/api/v1/users/${user.login}/repos?${userRepoParams.toString()}`,
              { headers },
            )

            if (userRepoResponse.ok) {
              const userRepoData = await userRepoResponse.json()

              // Filter user repos by language and keywords if needed
              let filteredUserRepos = userRepoData

              if (languages) {
                const languageList = languages.split(",").map((lang) => lang.trim().toLowerCase())
                filteredUserRepos = filteredUserRepos.filter(
                  (repo) => repo.language && languageList.includes(repo.language.toLowerCase()),
                )
              }

              userRepos.push(...filteredUserRepos)
            }
          }

          // Add user repositories to the results if they're not already included
          // and update the total count
          const newRepos = userRepos.filter((userRepo) => !repos.some((repo) => repo.id === userRepo.id))

          // Only add user repos if we're on the first page
          if (Number.parseInt(page) === 1) {
            // Calculate how many user repos we can add without exceeding the limit
            const availableSlots = Number.parseInt(limit) - repos.length
            const reposToAdd = newRepos.slice(0, availableSlots)

            repos = [...repos, ...reposToAdd]
            totalCount += newRepos.length // Update total count with new repos
          } else {
            totalCount += newRepos.length // Still update total count even if not adding to current page
          }
        }
      }
    }

    // Apply sorting (in case we've added repos from user search)
    repos = sortRepositories(repos, sort)

    // Return the results
    res.json({
      data: repos.slice((page - 1) * limit, page * limit), // Paginate the results
      total_count: totalCount,
      page: Number.parseInt(page),
      limit: Number.parseInt(limit),
      totalPages: Math.ceil(totalCount / Number.parseInt(limit)),
    })
  } catch (error) {
    console.error("Error searching repositories:", error)
    res.status(500).json({ message: "Failed to search repositories", error: error.message })
  }
})

// Helper function to map frontend sort fields to Gitea API sort fields
function mapSortField(sort) {
  switch (sort) {
    case "updated":
      return "updated"
    case "stars":
      return "stars"
    case "forks":
      return "forks"
    case "created":
      return "created"
    default:
      return "updated"
  }
}

// Helper function to sort repositories
function sortRepositories(repos, sortBy) {
  switch (sortBy) {
    case "updated":
      return repos.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
    case "stars":
      return repos.sort((a, b) => (b.stars_count || 0) - (a.stars_count || 0))
    case "forks":
      return repos.sort((a, b) => (b.forks_count || 0) - (a.forks_count || 0))
    case "created":
      return repos.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    default:
      return repos
  }
}

// Add this endpoint to handle avatar updates
app.post("/api/update-avatar", async (req, res) => {
  const authHeader = req.headers.authorization
  if (!authHeader) {
    return res.status(401).json({ message: "Missing authorization header" })
  }

  const userToken = authHeader.split(" ")[1] // Get token from header
  if (!userToken) {
    return res.status(401).json({ message: "Unrecognized request." })
  }

  const { image } = req.body

  if (!image) {
    return res.status(400).json({ message: "Image data is required" })
  }

  try {
    // First, get the current user to verify the token and get the username
    const userResponse = await fetch(`${GITEA_URL}/api/v1/user`, {
      headers: { Authorization: `token ${userToken}` },
    })

    if (!userResponse.ok) {
      const errData = await userResponse.json()
      return res.status(userResponse.status).json({
        message: errData.message || "Failed to authenticate user",
      })
    }

    const userData = await userResponse.json()
    const username = userData.login

    // Send the base64-encoded image as JSON
    const avatarResponse = await fetch(`${GITEA_URL}/api/v1/user/avatar`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `token ${userToken}`,
      },
      body: JSON.stringify({ image }),
    })

    if (!avatarResponse.ok) {
      const errData = await avatarResponse.json()
      return res.status(avatarResponse.status).json({
        message: errData.message || "Failed to update avatar",
      })
    }

    // Return success
    res.status(200).json({ message: "Avatar updated successfully" })
  } catch (error) {
    console.error("Error updating avatar:", error)
    res.status(500).json({ message: "Internal server error" })
  }
})

// POST /api/create-repo
app.post("/api/create-repo", async (req, res) => {
  const { name, license, isPrivate } = req.body

  const token = req.headers.authorization?.split(" ")[1] // Get token from header
  if (!token) {
    return res.status(401).json({ message: "Unrecognised request." })
  }

  try {
    // 1) Create a new repo in Gitea using the user's token
    //    POST /api/v1/user/repos
    const createRes = await fetch(`${GITEA_URL}/api/v1/user/repos`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `token ${token}`,
      },
      body: JSON.stringify({
        name, // required
        license_template: license || "", // Gitea supports e.g. "apache-2.0", "mit"
        private: isPrivate, // boolean
        auto_init: true, // optional, if you want an initial commit
      }),
    })

    if (!createRes.ok) {
      const errorData = await createRes.json()
      return res.status(createRes.status).json({
        message: errorData.message || "Failed to create repository in Gitea.",
      })
    }

    const newRepo = await createRes.json()
    // newRepo => the newly created repository data from Gitea

    res.json({ message: "Repository created successfully", repo: newRepo })
  } catch (error) {
    console.error("Error creating repo:", error)
    res.status(500).json({ message: "Internal server error" })
  }
})

// Get repository details, README, config.json, and file listing
app.get("/api/repos/:owner/:repoName", async (req, res) => {
  const { owner, repoName } = req.params
  try {
    const token = req.headers.authorization?.split(" ")[1] // Get token from header
    const repoRes = await fetch(`${GITEA_URL}/api/v1/repos/${owner}/${repoName}`, {
      headers: {
        ...(token && { Authorization: `token ${token}` }),
      },
    })
    if (!repoRes.ok) {
      const errData = await repoRes.json()
      return res.status(repoRes.status).json({
        message: errData.message || "Failed to fetch repository details from Gitea.",
      })
    }
    const repoData = await repoRes.json()
    const branch = repoData.default_branch || "main"

    // Fetch README
    let readmeContent = ""
    try {
      const readmeRes = await fetch(`${GITEA_URL}/api/v1/repos/${owner}/${repoName}/contents/README.md?ref=${branch}`)
      if (readmeRes.ok) {
        const readmeJson = await readmeRes.json()
        if (readmeJson.content) {
          readmeContent = Buffer.from(readmeJson.content, "base64").toString("utf-8")
        }
      }
    } catch (e) {
      console.log("No README.md found:", e)
    }

    // Fetch config.json
    let configData = null
    try {
      const configRes = await fetch(`${GITEA_URL}/api/v1/repos/${owner}/${repoName}/contents/config.json?ref=${branch}`)
      if (configRes.ok) {
        const configJson = await configRes.json()
        if (configJson.content) {
          const decoded = Buffer.from(configJson.content, "base64").toString("utf-8")
          configData = JSON.parse(decoded)
        }
      }
    } catch (e) {
      console.log("No config.json found:", e)
    }

    // Fetch file listing (root)
    let fileList = []
    try {
      const filesRes = await fetch(`${GITEA_URL}/api/v1/repos/${owner}/${repoName}/contents?ref=${branch}`)
      if (filesRes.ok) {
        fileList = await filesRes.json()
      }
    } catch (e) {
      console.log("Error fetching file list:", e)
    }

    return res.json({
      repo: repoData,
      readme: readmeContent,
      config: configData,
      files: fileList,
    })
  } catch (err) {
    console.error("Error fetching single repo:", err)
    return res.status(500).json({ message: "Internal server error" })
  }
})

// Delete repository from Gitea
app.delete("/api/repos/:owner/:repoName", async (req, res) => {
  const { owner, repoName } = req.params

  try {
    const token = req.headers.authorization?.split(" ")[1] // Get token from header

    if (!token) {
      return res.status(401).json({ message: "Unauthorized" })
    }

    // Call the Gitea API to delete the repository
    const deleteRes = await fetch(`${GITEA_URL}/api/v1/repos/${owner}/${repoName}`, {
      method: "DELETE",
      headers: {
        Authorization: `token ${token}`,
      },
    })

    if (!deleteRes.ok) {
      const errData = await deleteRes.json()
      return res.status(deleteRes.status).json({
        message: errData.message || "Failed to delete repository from Gitea.",
      })
    }

    // If the repository is deleted successfully
    return res.status(200).json({ message: "Repository deleted successfully" })
  } catch (err) {
    console.error("Error deleting repository:", err)
    return res.status(500).json({ message: "Internal server error" })
  }
})

// Get repository contents for a specific path
app.get("/api/repos/:owner/:repoName/contents/:path(*)", async (req, res) => {
  const { owner, repoName, path } = req.params
  const { ref } = req.query // Branch or commit SHA

  try {
    const branch = ref || "main"
    const encodedPath = encodeURIComponent(path)

    const contentsUrl = `${GITEA_URL}/api/v1/repos/${owner}/${repoName}/contents/${encodedPath}?ref=${branch}`

    const contentsRes = await fetch(contentsUrl)

    if (!contentsRes.ok) {
      const errData = await contentsRes.json()
      return res.status(contentsRes.status).json({
        message: errData.message || "Failed to fetch repository contents.",
      })
    }

    const contentsData = await contentsRes.json()
    return res.json(contentsData)
  } catch (err) {
    console.error("Error fetching repository contents:", err)
    return res.status(500).json({ message: "Internal server error" })
  }
})

// Create or update a file in a repository
app.put("/api/repos/:owner/:repoName/contents/:filepath(*)", async (req, res) => {
  const { owner, repoName, filepath } = req.params
  const { content, message, branch, sha } = req.body

  const token = req.headers.authorization?.split(" ")[1] // Get token from header
  if (!token) {
    return res.status(401).json({ message: "Unrecognised request." })
  }

  try {
    const encodedPath = encodeURIComponent(filepath)
    const payload = {
      content,
      message: message || `Update ${filepath}`,
      branch: branch || "main",
    }

    if (sha) {
      payload.sha = sha
    }

    const giteaUrl = `${GITEA_URL}/api/v1/repos/${owner}/${repoName}/contents/${encodedPath}`
    const giteaRes = await fetch(giteaUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `token ${token}`,
      },
      body: JSON.stringify(payload),
    })

    if (giteaRes.ok) {
      const result = await giteaRes.json()
      return res.json({ message: "File updated successfully", result })
    } else {
      const errData = await giteaRes.json()
      return res.status(giteaRes.status).json({ message: errData.message || "Failed to update file" })
    }
  } catch (err) {
    console.error("Error updating file:", err)
    return res.status(500).json({ message: "Internal server error" })
  }
})

// Get repository branches
app.get("/api/repos/:owner/:repoName/branches", async (req, res) => {
  const { owner, repoName } = req.params

  try {
    const branchesUrl = `${GITEA_URL}/api/v1/repos/${owner}/${repoName}/branches`

    const branchesRes = await fetch(branchesUrl)

    if (!branchesRes.ok) {
      const errData = await branchesRes.json()
      return res.status(branchesRes.status).json({
        message: errData.message || "Failed to fetch repository branches.",
      })
    }

    const branchesData = await branchesRes.json()
    return res.json(branchesData)
  } catch (err) {
    console.error("Error fetching repository branches:", err)
    return res.status(500).json({ message: "Internal server error" })
  }
})

// Create or Update a file in a repository (POST)
app.post("/api/repos/:owner/:repo/contents/:filepath(*)", async (req, res) => {
  const { owner, repo, filepath } = req.params
  const { author, branch, committer, content, dates, message, new_branch, signoff } = req.body

  // Validate required fields for creation
  if (!content) {
    return res.status(400).json({ message: "Content is required" })
  }

  const base64Content = Buffer.from(content, "utf8").toString("base64")

  const token = req.headers.authorization?.split(" ")[1] // Get token from header
  if (!token) {
    return res.status(401).json({ message: "Unrecognised request." })
  }

  try {
    // 1) Check if the file already exists in Gitea
    // Using `encodeURIComponent(filepath)` ensures special chars/spaces are handled.
    const checkUrl = `${GITEA_URL}/api/v1/repos/${owner}/${repo}/contents/${encodeURIComponent(filepath)}?ref=${branch || "main"}`
    const checkRes = await fetch(checkUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `token ${token}`,
      },
    })

    // Common payload fields
    const payload = {
      author,
      branch: branch || undefined,
      committer,
      content: base64Content,
      dates,
      message: message || `Create or update ${filepath}`,
      new_branch: new_branch || undefined,
      signoff: signoff || false,
    }

    if (checkRes.ok) {
      // -------------------------
      // FILE EXISTS => DO A PUT
      // -------------------------
      const fileData = await checkRes.json()
      // The Gitea "GET a file" response typically has a `.sha` property in the JSON.
      // If the shape is different, adjust accordingly.
      const existingSha = fileData.sha || fileData?.content?.sha

      // If we cannot find the sha in the response, handle that error
      if (!existingSha) {
        return res.status(400).json({ message: "Unable to locate existing file SHA for update." })
      }

      // For a PUT, Gitea requires the sha
      const updatePayload = {
        ...payload,
        sha: existingSha,
      }

      const updateUrl = `${GITEA_URL}/api/v1/repos/${owner}/${repo}/contents/${encodeURIComponent(filepath)}`
      const updateRes = await fetch(updateUrl, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `token ${token}`,
        },
        body: JSON.stringify(updatePayload),
      })

      if (updateRes.ok) {
        const result = await updateRes.json()
        return res.status(200).json({
          message: "File updated successfully",
          result,
        })
      } else {
        const errData = await updateRes.json()
        return res.status(updateRes.status).json({ message: errData.message || "Failed to update file" })
      }
    } else {
      // --------------------------------
      // FILE DOES NOT EXIST => DO A POST
      // --------------------------------
      const createUrl = `${GITEA_URL}/api/v1/repos/${owner}/${repo}/contents/${encodeURIComponent(filepath)}`
      const createRes = await fetch(createUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `token ${token}`,
        },
        body: JSON.stringify(payload),
      })

      if (createRes.status === 201) {
        const result = await createRes.json()
        return res.status(201).json({ message: "File created successfully", result })
      } else {
        const errData = await createRes.json()
        return res.status(createRes.status).json({ message: errData.message || "Failed to create file" })
      }
    }
  } catch (err) {
    console.error("Error creating/updating file:", err)
    return res.status(500).json({ message: "Internal server error" })
  }
})

// Modify multiple files in a repository (POST)
app.post("/api/repos/:owner/:repo/contents", async (req, res) => {
  const { owner, repo } = req.params
  const {
    author,
    branch,
    committer,
    dates,
    files, // Array of file change operations
    message,
    new_branch,
    signoff,
  } = req.body

  // Validate required field files array
  if (!files || !Array.isArray(files) || files.length === 0) {
    return res.status(400).json({ message: "Files array is required" })
  }

  const token = req.headers.authorization?.split(" ")[1] // Get token from header
  if (!token) {
    return res.status(401).json({ message: "Unrecognised request." })
  }

  try {
    // For each file, if content is provided as raw text, encode it.
    const formattedFiles = files.map((file) => {
      const encoded = file.content ? Buffer.from(file.content, "utf8").toString("base64") : undefined
      return {
        ...file,
        content: encoded,
      }
    })

    const payload = {
      author,
      branch: branch || undefined,
      committer,
      dates,
      files: formattedFiles,
      message: message || "Update multiple files",
      new_branch: new_branch || undefined,
      signoff: signoff || false,
    }

    const giteaUrl = `${GITEA_URL}/api/v1/repos/${owner}/${repo}/contents`
    const giteaRes = await fetch(giteaUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `token ${token}`,
      },
      body: JSON.stringify(payload),
    })

    if (giteaRes.status === 201) {
      const result = await giteaRes.json()
      return res.status(201).json({ message: "Files updated successfully", result })
    } else {
      const errData = await giteaRes.json()
      return res.status(giteaRes.status).json({ message: errData.message || "Failed to update files" })
    }
  } catch (err) {
    console.error("Error modifying files:", err)
    return res.status(500).json({ message: "Internal server error" })
  }
})

// Add a new endpoint to fetch commit history for a repository
app.get("/api/repos/:owner/:repoName/commits", async (req, res) => {
  const { owner, repoName } = req.params
  const { path, limit = 10, page = 1 } = req.query

  const token = req.headers.authorization?.split(" ")[1] // Get token from header
  if (!token) {
    return res.status(401).json({ message: "Not logged in." })
  }

  try {
    // Construct the URL for Gitea's commits API
    let commitsUrl = `${GITEA_URL}/api/v1/repos/${owner}/${repoName}/commits`

    // Add query parameters
    const queryParams = new URLSearchParams()
    if (path) queryParams.append("path", String(path))
    if (limit) queryParams.append("limit", String(limit))
    if (page) queryParams.append("page", String(page))

    // Add query string to URL if we have parameters
    if (queryParams.toString()) {
      commitsUrl += `?${queryParams.toString()}`
    }

    console.log(`Fetching commits from: ${commitsUrl}`)

    const commitsRes = await fetch(commitsUrl, {
      headers: {
        Authorization: `token ${token}`,
        Accept: "application/json",
      },
    })

    if (!commitsRes.ok) {
      const contentType = commitsRes.headers.get("content-type")
      if (contentType && contentType.includes("application/json")) {
        const errData = await commitsRes.json()
        return res.status(commitsRes.status).json({
          message: errData.message || "Failed to fetch commit history.",
        })
      } else {
        // Handle non-JSON error response
        const errText = await commitsRes.text()
        console.error("Non-JSON error response:", errText)
        return res.status(commitsRes.status).json({
          message: "Failed to fetch commit history. Server returned a non-JSON response.",
        })
      }
    }

    const commitsData = await commitsRes.json()
    return res.json(commitsData)
  } catch (err) {
    console.error("Error fetching commit history:", err)
    return res.status(500).json({ message: "Internal server error" })
  }
})

// Delete a file in a repository
app.delete("/api/repos/:owner/:repo/contents/:filepath(*)", async (req, res) => {
  const { owner, repo, filepath } = req.params
  const { message, branch, sha } = req.body

  // Validate required fields
  if (!sha) {
    return res.status(400).json({ message: "SHA is required for file deletion" })
  }

  const token = req.headers.authorization?.split(" ")[1] // Get token from header
  if (!token) {
    return res.status(401).json({ message: "Unrecognised request." })
  }

  try {
    const encodedPath = encodeURIComponent(filepath)
    const payload = {
      message: message || `Delete ${filepath}`,
      branch: branch || "main",
      sha: sha,
    }

    const giteaUrl = `${GITEA_URL}/api/v1/repos/${owner}/${repo}/contents/${encodedPath}`
    const giteaRes = await fetch(giteaUrl, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `token ${token}`,
      },
      body: JSON.stringify(payload),
    })

    if (giteaRes.ok) {
      const result = await giteaRes.json()
      return res.json({ message: "File deleted successfully", result })
    } else {
      const errData = await giteaRes.json()
      return res.status(giteaRes.status).json({ message: errData.message || "Failed to delete file" })
    }
  } catch (err) {
    console.error("Error deleting file:", err)
    return res.status(500).json({ message: "Internal server error" })
  }
})

// Create a new post
app.post("/api/community/posts", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1] // Get token from header
    if (!token) {
      return res.status(401).json({ message: "Unrecognised request." })
    }

    const { content } = req.body

    if (!content || !content.trim()) {
      return res.status(400).json({ message: "Content is required" })
    }

    // 1) Get user info from Gitea to know who is creating the post
    const userRes = await fetch(`${GITEA_URL}/api/v1/user`, {
      headers: { Authorization: `token ${token}` },
    })

    if (!userRes.ok) {
      const userErr = await userRes.json()
      return res.status(userRes.status).json({
        message: userErr.message || "Failed to fetch user info from Gitea",
      })
    }

    const giteaUser = await userRes.json()
    const authorUsername = giteaUser.login

    // 2) Insert the post into the "posts" table
    const [newPost] = await knex("posts")
      .insert({
        author_username: authorUsername,
        content: content.trim(),
        // likes_count, comments_count, reposts_count default to 0
      })
      .returning("id")

    // 3) Fetch the newly inserted post row
    const insertedPost = await knex("posts").where({ id: newPost.id }).first()

    return res.status(201).json(insertedPost)
  } catch (error) {
    console.error("Error creating post:", error)
    return res.status(500).json({ message: "Internal server error" })
  }
})

// Update the "Get all posts" route to include like status and proper counts
// Replace the existing route with this improved version:

// Get all posts
app.get("/api/community/posts", async (req, res) => {
  try {
    // Get the current user if authenticated
    let currentUsername = null
    if (req.headers.authorization) {
      const token = req.headers.authorization.split(" ")[1]
      try {
        const userRes = await fetch(`${GITEA_URL}/api/v1/user`, {
          headers: { Authorization: `token ${token}` },
        })
        if (userRes.ok) {
          const userData = await userRes.json()
          currentUsername = userData.login
        }
      } catch (err) {
        console.error("Error fetching user:", err)
      }
    }

    // 1) Fetch all posts with counts from DB, sorted by newest first
    const posts = await knex("posts")
      .select(
        "posts.*",
        knex.raw("COALESCE(COUNT(DISTINCT post_likes.id), 0) as likes_count"),
        knex.raw("COALESCE(COUNT(DISTINCT post_comments.id), 0) as comments_count"),
      )
      .leftJoin("post_likes", "posts.id", "post_likes.post_id")
      .leftJoin("post_comments", "posts.id", "post_comments.post_id")
      .groupBy("posts.id")
      .orderBy("posts.created_at", "desc")

    // 2) If user is authenticated, get their likes 
    let userLikes = []

    if (currentUsername) {
      userLikes = await knex("post_likes").select("post_id").where("username", currentUsername)

    }

    const userLikesSet = new Set(userLikes.map((like) => like.post_id))

    // 3) For each post, fetch user data from Gitea
    const augmentedPosts = []
    for (const p of posts) {
      let authorData = null
      try {
        const userRes = await fetch(`${GITEA_URL}/api/v1/users/${p.author_username}`)
        if (userRes.ok) {
          authorData = await userRes.json()
        }
      } catch (err) {
        // If we fail to get Gitea user, fallback to minimal data
        authorData = { id: 0, login: p.author_username, full_name: p.author_username, avatar_url: "", email: "" }
      }

      augmentedPosts.push({
        id: p.id,
        content: p.content,
        created_at: p.created_at,
        likes: Number(p.likes_count),
        comments: Number(p.comments_count),
        reposts: p.reposts_count || 0,
        isLiked: userLikesSet.has(p.id),
        isReposted: false, // To be implemented
        author: {
          id: authorData.id,
          login: authorData.login,
          full_name: authorData.full_name,
          avatar_url: authorData.avatar_url,
          email: authorData.email,
        },
      })
    }

    // 4) Return the array
    return res.json(augmentedPosts)
  } catch (error) {
    console.error("Error fetching posts:", error)
    return res.status(500).json({ message: "Internal server error" })
  }
})

// Wether or not the active user is starring the repo
app.get("/api/hasStar/:owner/:repo", async (req, res) => {
  const { owner, repo } = req.params
  const token = req.headers.authorization?.split(" ")[1] // Get token from header
  if (!token) {
    return res.status(401).json({ message: "Unrecognised request." })
  }

  try {
    const checkStarUrl = `${GITEA_URL}/api/v1/user/starred/${owner}/${repo}`
    const starredRes = await fetch(checkStarUrl, {
      method: "GET",
      headers: {
        Authorization: `token ${token}`,
      },
    })

    const isStarred = (await starredRes.status) === 204
    return res.json({ starred: isStarred })
  } catch (err) {
    console.error("Error modifying files:", err)
    return res.status(500).json({ message: "Internal server error" })
  }
})

// Toggle starred state of repo
app.post("/api/toggleStar/:owner/:repo", async (req, res) => {
  const { owner, repo } = req.params
  const token = req.headers.authorization?.split(" ")[1] // Get token from header
  if (!token) {
    return res.status(401).json({ message: "Unrecognised request." })
  }

  try {
    const checkStarUrl = `${GITEA_URL}/api/v1/user/starred/${owner}/${repo}`
    const starredRes = await fetch(checkStarUrl, {
      method: "GET",
      headers: {
        Authorization: `token ${token}`,
      },
    })

    const isStarred = (await starredRes.status) === 204

    const toggleRes = await fetch(checkStarUrl, {
      method: isStarred ? "DELETE" : "PUT",
      headers: {
        Authorization: `token ${token}`,
      },
    })

    return res.status(toggleRes.status).json({ message: "Toggled star." })
  } catch (err) {
    console.error("Error modifying files:", err)
    return res.status(500).json({ message: "Internal server error" })
  }
})

// Create a new blog
app.post("/api/blogs", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1] // Get token from header
    if (!token) {
      return res.status(401).json({ message: "Unrecognised request." })
    }

    const content = req.body

    if (!content) {
      return res.status(400).json({ message: "Content is required" })
    }

    // 1) Get user info from Gitea to know who is creating the blog
    const userRes = await fetch(`${GITEA_URL}/api/v1/user`, {
      headers: { Authorization: `token ${token}` },
    })

    if (!userRes.ok) {
      const userErr = await userRes.json()
      return res.status(userRes.status).json({
        message: userErr.message || "Failed to fetch user info from Gitea",
      })
    }

    const giteaUser = await userRes.json()
    const authorUsername = giteaUser.login

    content.author_username = authorUsername
    console.log("this is my test:", content)
    // 2) Insert the blog into the "blogs" table
    const [newBlog] = await knex("blogs").insert(content).returning("id")

    // 3) Fetch the newly inserted blog row
    const insertedBlog = await knex("blogs").where({ id: newBlog.id }).first()

    return res.status(201).json(insertedBlog)
  } catch (error) {
    console.error("Error creating blog:", error)
    return res.status(500).json({ message: "Internal server error" })
  }
})

// Get all blogs
app.get("/api/blogs/:blogId", async (req, res) => {
  const { blogId } = req.params
  try {
    // 1) Fetch all blogs from DB, sorted by newest first
    const blog = await knex("blogs").where({ id: blogId }).first()

    let authorData = null
    try {
      const userRes = await fetch(`${GITEA_URL}/api/v1/users/${blog.author_username}`)
      if (userRes.ok) {
        authorData = await userRes.json()
      }
    } catch (err) {
      // If we fail to get Gitea user, fallback to minimal data
      authorData = { id: 0, login: blog.author_username, full_name: blog.author_username, avatar_url: "", email: "" }
    }
    // 3) Return the array
    return res.json({
      id: blog.id,
      title: blog.title,
      summary: blog.summary,
      content: blog.content,
      category: blog.category,
      image_url: blog.image_url,
      optimizer_name: blog.optimizer_name,
      optimizer_url: blog.optimizer_url,
      problem_name: blog.problem_name,
      problem_description: blog.problem_description,
      tags: JSON.parse(blog.tags),
      created_at: blog.created_at,
      likes: blog.likes_count,
      comments: blog.comments_count,
      reposts: blog.reposts_count,
      isLiked: false, // to keep it simple for now
      isReposted: false,
      author: {
        id: authorData.id,
        login: authorData.login,
        full_name: authorData.full_name,
        avatar_url: authorData.avatar_url,
        email: authorData.email,
      },
    })
  } catch (error) {
    console.error("Error fetching blogs:", error)
    return res.status(500).json({ message: "Internal server error" })
  }
})

// ===== FEATURE BACKLOG API ROUTES =====

// Get all features
app.get("/api/features", async (req, res) => {
  try {
    // Get features with their tags
    const features = await knex("features")
      .select(
        "features.*",
        knex.raw("COALESCE(COUNT(DISTINCT feature_votes.id), 0) as votes_count"),
        knex.raw("COALESCE(COUNT(DISTINCT feature_comments.id), 0) as comments_count"),
      )
      .leftJoin("feature_votes", "features.id", "feature_votes.feature_id")
      .leftJoin("feature_comments", "features.id", "feature_comments.feature_id")
      .groupBy("features.id")
      .orderBy("features.created_at", "desc")

    // Get tags for each feature
    const featureTags = await knex("feature_tags").select("feature_id", "tag_name")

    // Get user info for each feature
    const usernames = [...new Set(features.map((f) => f.created_by_username))]
    const users = await knex("users").select("username", "email").whereIn("username", usernames)

    const usersMap = users.reduce((acc, user) => {
      acc[user.username] = user
      return acc
    }, {})

    // Check if user has voted on features
    let userVotes = []
    if (req.headers.authorization) {
      const token = req.headers.authorization.split(" ")[1]

      // Get user info from Gitea
      const userRes = await fetch(`${GITEA_URL}/api/v1/user`, {
        headers: { Authorization: `token ${token}` },
      })

      if (userRes.ok) {
        const userData = await userRes.json()
        userVotes = await knex("feature_votes").select("feature_id").where("username", userData.login)
      }
    }

    const userVotesSet = new Set(userVotes.map((v) => v.feature_id))

    // Format response
    const formattedFeatures = features.map((feature) => {
      const tags = featureTags.filter((tag) => tag.feature_id === feature.id).map((tag) => tag.tag_name)

      const user = usersMap[feature.created_by_username] || { username: feature.created_by_username }

      return {
        id: feature.id.toString(),
        title: feature.title,
        description: feature.description,
        status: feature.status,
        votes: Number.parseInt(feature.votes_count),
        comments: Number.parseInt(feature.comments_count),
        createdAt: feature.created_at,
        createdBy: {
          name: user.username,
          avatar: `/placeholder.svg?height=40&width=40`,
        },
        priority: feature.priority,
        tags,
        hasVoted: userVotesSet.has(feature.id),
      }
    })

    res.json(formattedFeatures)
  } catch (error) {
    console.error("Error fetching features:", error)
    res.status(500).json({ error: "Failed to fetch features" })
  }
})

// Create a new feature
app.post("/api/features", auth, async (req, res) => {
  try {
    const { title, description, priority, status, tags } = req.body

    if (!title || !description) {
      return res.status(400).json({ error: "Title and description are required" })
    }

    // Start a transaction
    const trx = await knex.transaction()

    try {
      // Check if the user exists in the users table
      const userExists = await trx("users").where("username", req.user.login).first()

      // If user doesn't exist in the local database, create a record
      if (!userExists) {
        await trx("users").insert({
          username: req.user.login,
          email: req.user.email || `${req.user.login}@example.com`, // Fallback email if not available
          gitea_token: req.user.token,
          password: crypto.randomBytes(16).toString("hex"), // Generate a random password as placeholder
          // Add any other required fields with default values
        })
      }

      // Insert the feature
      const [featureId] = await trx("features")
        .insert({
          title,
          description,
          priority: priority || "medium",
          status: status || "backlog",
          created_by_username: req.user.login,
        })
        .returning("id")

      // Insert tags if provided
      if (tags && tags.length > 0) {
        const tagInserts = tags.map((tag) => ({
          feature_id: featureId,
          tag_name: tag,
        }))

        await trx("feature_tags").insert(tagInserts)
      }

      // Commit the transaction
      await trx.commit()

      // Get the created feature with tags
      const feature = await knex("features").where("id", featureId).first()

      const featureTags = await knex("feature_tags").select("tag_name").where("feature_id", featureId)

      // Format response
      const formattedFeature = {
        id: feature.id.toString(),
        title: feature.title,
        description: feature.description,
        status: feature.status,
        votes: 0,
        comments: 0,
        createdAt: feature.created_at,
        createdBy: {
          name: req.user.login,
          avatar: `/placeholder.svg?height=40&width=40`,
        },
        priority: feature.priority,
        tags: featureTags.map((tag) => tag.tag_name),
        hasVoted: false,
      }

      res.status(201).json(formattedFeature)
    } catch (error) {
      // Rollback the transaction on error
      await trx.rollback()
      throw error
    }
  } catch (error) {
    console.error("Error creating feature:", error)
    res.status(500).json({ error: "Failed to create feature" })
  }
})

// Get a specific feature
app.get("/api/features/:id", async (req, res) => {
  try {
    const { id } = req.params

    const feature = await knex("features").where("id", id).first()

    if (!feature) {
      return res.status(404).json({ error: "Feature not found" })
    }

    const tags = await knex("feature_tags").select("tag_name").where("feature_id", id)

    const votesCount = await knex("feature_votes").where("feature_id", id).count("id as count").first()

    const commentsCount = await knex("feature_comments").where("feature_id", id).count("id as count").first()

    // Check if user has voted
    let hasVoted = false
    if (req.headers.authorization) {
      const token = req.headers.authorization.split(" ")[1]

      // Get user info from Gitea
      const userRes = await fetch(`${GITEA_URL}/api/v1/user`, {
        headers: { Authorization: `token ${token}` },
      })

      if (userRes.ok) {
        const userData = await userRes.json()
        const vote = await knex("feature_votes")
          .where({
            feature_id: id,
            username: userData.login,
          })
          .first()

        hasVoted = !!vote
      }
    }

    // Get user info
    const user = await knex("users").select("username", "email").where("username", feature.created_by_username).first()

    // Format response
    const formattedFeature = {
      id: feature.id.toString(),
      title: feature.title,
      description: feature.description,
      status: feature.status,
      votes: Number.parseInt(votesCount.count),
      comments: Number.parseInt(commentsCount.count),
      createdAt: feature.created_at,
      createdBy: {
        name: user ? user.username : feature.created_by_username,
        avatar: `/placeholder.svg?height=40&width=40`,
      },
      priority: feature.priority,
      tags: tags.map((tag) => tag.tag_name),
      hasVoted,
    }

    res.json(formattedFeature)
  } catch (error) {
    console.error("Error fetching feature:", error)
    res.status(500).json({ error: "Failed to fetch feature" })
  }
})

// Update a feature
app.put("/api/features/:id", auth, async (req, res) => {
  try {
    const { id } = req.params
    const { title, description, priority, status, tags } = req.body

    // Check if feature exists
    const feature = await knex("features").where("id", id).first()

    if (!feature) {
      return res.status(404).json({ error: "Feature not found" })
    }

    // Start a transaction
    const trx = await knex.transaction()

    try {
      // Update the feature
      await trx("features")
        .where("id", id)
        .update({
          title: title || feature.title,
          description: description || feature.description,
          priority: priority || feature.priority,
          status: status || feature.status,
          updated_at: knex.fn.now(),
        })

      // Update tags if provided
      if (tags) {
        // Delete existing tags
        await trx("feature_tags").where("feature_id", id).delete()

        // Insert new tags
        if (tags.length > 0) {
          const tagInserts = tags.map((tag) => ({
            feature_id: id,
            tag_name: tag,
          }))

          await trx("feature_tags").insert(tagInserts)
        }
      }

      // Commit the transaction
      await trx.commit()

      // Get the updated feature with tags
      const updatedFeature = await knex("features").where("id", id).first()

      const featureTags = await knex("feature_tags").select("tag_name").where("feature_id", id)

      const votesCount = await knex("feature_votes").where("feature_id", id).count("id as count").first()

      const commentsCount = await knex("feature_comments").where("feature_id", id).count("id as count").first()

      // Check if user has voted
      const vote = await knex("feature_votes")
        .where({
          feature_id: id,
          username: req.user.login,
        })
        .first()

      // Get user info
      const user = await knex("users")
        .select("username", "email")
        .where("username", updatedFeature.created_by_username)
        .first()

      // Format response
      const formattedFeature = {
        id: updatedFeature.id.toString(),
        title: updatedFeature.title,
        description: updatedFeature.description,
        status: updatedFeature.status,
        votes: Number.parseInt(votesCount.count),
        comments: Number.parseInt(commentsCount.count),
        createdAt: updatedFeature.created_at,
        createdBy: {
          name: user ? user.username : updatedFeature.created_by_username,
          avatar: `/placeholder.svg?height=40&width=40`,
        },
        priority: updatedFeature.priority,
        tags: featureTags.map((tag) => tag.tag_name),
        hasVoted: !!vote,
      }

      res.json(formattedFeature)
    } catch (error) {
      // Rollback the transaction on error
      await trx.rollback()
      throw error
    }
  } catch (error) {
    console.error("Error updating feature:", error)
    res.status(500).json({ error: "Failed to update feature" })
  }
})

// Delete a feature
app.delete("/api/features/:id", auth, async (req, res) => {
  try {
    const { id } = req.params

    // Check if feature exists
    const feature = await knex("features").where("id", id).first()

    if (!feature) {
      return res.status(404).json({ error: "Feature not found" })
    }

    // Delete the feature (cascade will delete related tags, votes, and comments)
    await knex("features").where("id", id).delete()

    res.json({ message: "Feature deleted successfully" })
  } catch (error) {
    console.error("Error deleting feature:", error)
    res.status(500).json({ error: "Failed to delete feature" })
  }
})

// Update feature status
app.put("/api/features/:id/status", auth, async (req, res) => {
  try {
    const { id } = req.params
    const { status } = req.body

    if (!status || !["backlog", "in-progress", "completed"].includes(status)) {
      return res.status(400).json({ error: "Valid status is required" })
    }

    // Check if feature exists
    const feature = await knex("features").where("id", id).first()

    if (!feature) {
      return res.status(404).json({ error: "Feature not found" })
    }

    // Update the feature status
    await knex("features").where("id", id).update({
      status,
      updated_at: knex.fn.now(),
    })

    res.json({ message: "Feature status updated successfully" })
  } catch (error) {
    console.error("Error updating feature status:", error)
    res.status(500).json({ error: "Failed to update feature status" })
  }
})

// Vote for a feature
app.post("/api/features/:id/vote", auth, async (req, res) => {
  try {
    const { id } = req.params

    // Check if feature exists
    const feature = await knex("features").where("id", id).first()

    if (!feature) {
      return res.status(404).json({ error: "Feature not found" })
    }

    // Start a transaction
    const trx = await knex.transaction()

    try {
      // Check if the user exists in the users table
      const userExists = await trx("users").where("username", req.user.login).first()

      // If user doesn't exist in the local database, create a record
      if (!userExists) {
        await trx("users").insert({
          username: req.user.login,
          email: req.user.email || `${req.user.login}@example.com`, // Fallback email if not available
          gitea_token: req.user.token,
          password: crypto.randomBytes(16).toString("hex"), // Generate a random password as placeholder
        })
      }

      // Check if user has already voted
      const existingVote = await trx("feature_votes")
        .where({
          feature_id: id,
          username: req.user.login,
        })
        .first()

      if (existingVote) {
        // Remove vote if already voted
        await trx("feature_votes")
          .where({
            feature_id: id,
            username: req.user.login,
          })
          .delete()

        // Get updated vote count
        const votesCount = await trx("feature_votes").where("feature_id", id).count("id as count").first()

        // Commit the transaction
        await trx.commit()

        res.json({
          message: "Vote removed successfully",
          votes: Number.parseInt(votesCount.count),
          hasVoted: false,
        })
      } else {
        // Add vote
        await trx("feature_votes").insert({
          feature_id: id,
          username: req.user.login,
        })

        // Get updated vote count
        const votesCount = await trx("feature_votes").where("feature_id", id).count("id as count").first()

        // Commit the transaction
        await trx.commit()

        res.json({
          message: "Vote added successfully",
          votes: Number.parseInt(votesCount.count),
          hasVoted: true,
        })
      }
    } catch (error) {
      // Rollback the transaction on error
      await trx.rollback()
      throw error
    }
  } catch (error) {
    console.error("Error voting for feature:", error)
    res.status(500).json({ error: "Failed to vote for feature" })
  }
})

// Get comments for a feature
app.get("/api/features/:id/comments", async (req, res) => {
  try {
    const { id } = req.params

    // Check if feature exists
    const feature = await knex("features").where("id", id).first()

    if (!feature) {
      return res.status(404).json({ error: "Feature not found" })
    }

    // Get comments
    const comments = await knex("feature_comments").where("feature_id", id).orderBy("created_at", "desc")

    // Get user info for each comment
    const usernames = [...new Set(comments.map((c) => c.username))]
    const users = await knex("users").select("username", "email").whereIn("username", usernames)

    const usersMap = users.reduce((acc, user) => {
      acc[user.username] = user
      return acc
    }, {})

    // Format response
    const formattedComments = comments.map((comment) => {
      const user = usersMap[comment.username] || { username: comment.username }

      return {
        id: comment.id,
        content: comment.content,
        created_at: comment.created_at,
        user: {
          username: user.username,
          avatar_url: `/placeholder.svg?height=32&width=32`,
        },
      }
    })

    res.json(formattedComments)
  } catch (error) {
    console.error("Error fetching comments:", error)
    res.status(500).json({ error: "Failed to fetch comments" })
  }
})

// Also update the "Add a comment to a feature" route to handle the same issue:

// Add a comment to a feature
app.post("/api/features/:id/comments", auth, async (req, res) => {
  try {
    const { id } = req.params
    const { content } = req.body

    if (!content) {
      return res.status(400).json({ error: "Comment content is required" })
    }

    // Check if feature exists
    const feature = await knex("features").where("id", id).first()

    if (!feature) {
      return res.status(404).json({ error: "Feature not found" })
    }

    // Start a transaction
    const trx = await knex.transaction()

    try {
      // Check if the user exists in the users table
      const userExists = await trx("users").where("username", req.user.login).first()

      // If user doesn't exist in the local database, create a record
      if (!userExists) {
        await trx("users").insert({
          username: req.user.login,
          email: req.user.email || `${req.user.login}@example.com`, // Fallback email if not available
          gitea_token: req.user.token,
          password: crypto.randomBytes(16).toString("hex"), // Generate a random password as placeholder
          // Add any other required fields with default values
        })
      }

      // Add comment
      const [commentIdObj] = await trx("feature_comments")
        .insert({
          feature_id: id,
          username: req.user.login,
          content,
        })
        .returning("id")

      // Extract the actual ID value
      const commentId = commentIdObj.id || commentIdObj

      // Get the created comment
      const comment = await trx("feature_comments").where("id", commentId).first()

      // Commit the transaction
      await trx.commit()

      // Format response
      const formattedComment = {
        id: comment.id,
        content: comment.content,
        created_at: comment.created_at,
        user: {
          username: req.user.login,
          avatar_url: `/placeholder.svg?height=32&width=32`,
        },
      }

      res.status(201).json(formattedComment)
    } catch (error) {
      // Rollback the transaction on error
      await trx.rollback()
      throw error
    }
  } catch (error) {
    console.error("Error adding comment:", error)
    res.status(500).json({ error: "Failed to add comment" })
  }
})

// Add these routes for community post interactions

// Update the like/unlike post endpoint to update the post's likes_count
// Replace the existing route with this improved version:

// Like/unlike a post
app.post("/api/community/posts/:id/like", auth, async (req, res) => {
  try {
    const { id } = req.params

    // Check if post exists
    const post = await knex("posts").where("id", id).first()

    if (!post) {
      return res.status(404).json({ error: "Post not found" })
    }

    // Start a transaction
    const trx = await knex.transaction()

    try {
      // Check if the user exists in the users table
      const userExists = await trx("users").where("username", req.user.login).first()

      // If user doesn't exist in the local database, create a record
      if (!userExists) {
        await trx("users").insert({
          username: req.user.login,
          email: req.user.email || `${req.user.login}@example.com`, // Fallback email if not available
          gitea_token: req.user.token,
          password: crypto.randomBytes(16).toString("hex"), // Generate a random password as placeholder
        })
      }

      // Check if user has already liked
      const existingLike = await trx("post_likes")
        .where({
          post_id: id,
          username: req.user.login,
        })
        .first()

      if (existingLike) {
        // Remove like if already liked
        await trx("post_likes")
          .where({
            post_id: id,
            username: req.user.login,
          })
          .delete()

        // Update the post's likes_count
        await trx("posts").where("id", id).decrement("likes_count", 1)

        // Get updated like count
        const likesCount = await trx("post_likes").where("post_id", id).count("id as count").first()

        // Commit the transaction
        await trx.commit()

        res.json({
          message: "Like removed successfully",
          likes: Number.parseInt(likesCount.count),
          isLiked: false,
        })
      } else {
        // Add like
        await trx("post_likes").insert({
          post_id: id,
          username: req.user.login,
        })

        // Update the post's likes_count
        await trx("posts").where("id", id).increment("likes_count", 1)

        // Get updated like count
        const likesCount = await trx("post_likes").where("post_id", id).count("id as count").first()

        // Commit the transaction
        await trx.commit()

        res.json({
          message: "Post liked successfully",
          likes: Number.parseInt(likesCount.count),
          isLiked: true,
        })
      }
    } catch (error) {
      // Rollback the transaction on error
      await trx.rollback()
      throw error
    }
  } catch (error) {
    console.error("Error liking post:", error)
    res.status(500).json({ error: "Failed to like post" })
  }
})

// Add a comment to a post
app.post("/api/community/posts/:id/comments", auth, async (req, res) => {
  try {
    const { id } = req.params
    const { content } = req.body

    if (!content) {
      return res.status(400).json({ error: "Comment content is required" })
    }

    // Check if post exists
    const post = await knex("posts").where("id", id).first()

    if (!post) {
      return res.status(404).json({ error: "Post not found" })
    }

    // Start a transaction
    const trx = await knex.transaction()

    try {
      // Check if the user exists in the users table
      const userExists = await trx("users").where("username", req.user.login).first()

      // If user doesn't exist in the local database, create a record
      if (!userExists) {
        await trx("users").insert({
          username: req.user.login,
          email: req.user.email || `${req.user.login}@example.com`, // Fallback email if not available
          gitea_token: req.user.token,
          password: crypto.randomBytes(16).toString("hex"), // Generate a random password as placeholder
        })
      }

      // Add comment
      const [commentIdObj] = await trx("post_comments")
        .insert({
          post_id: id,
          username: req.user.login,
          content,
        })
        .returning("id")

      // Extract the actual ID value
      const commentId = commentIdObj.id || commentIdObj

      // Update the post's comments_count
      await trx("posts").where("id", id).increment("comments_count", 1)

      // Get the created comment
      const comment = await trx("post_comments").where("id", commentId).first()

      // Commit the transaction
      await trx.commit()

      // Format response
      const formattedComment = {
        id: comment.id,
        content: comment.content,
        created_at: comment.created_at,
        user: {
          username: req.user.login,
          avatar_url: `/placeholder.svg?height=32&width=32`,
        },
      }

      res.status(201).json(formattedComment)
    } catch (error) {
      // Rollback the transaction on error
      await trx.rollback()
      throw error
    }
  } catch (error) {
    console.error("Error adding comment:", error)
    res.status(500).json({ error: "Failed to add comment" })
  }
})

// Get comments for a post
app.get("/api/community/posts/:id/comments", async (req, res) => {
  try {
    const { id } = req.params

    // Check if post exists
    const post = await knex("posts").where("id", id).first()

    if (!post) {
      return res.status(404).json({ error: "Post not found" })
    }

    // Get comments
    const comments = await knex("post_comments").where("post_id", id).orderBy("created_at", "desc")

    // Get user info for each comment
    const usernames = [...new Set(comments.map((c) => c.username))]
    const users = await knex("users").select("username", "email").whereIn("username", usernames)

    const usersMap = users.reduce((acc, user) => {
      acc[user.username] = user
      return acc
    }, {})

    // Format response
    const formattedComments = comments.map((comment) => {
      const user = usersMap[comment.username] || { username: comment.username }

      return {
        id: comment.id,
        content: comment.content,
        created_at: comment.created_at,
        user: {
          username: user.username,
          avatar_url: `/placeholder.svg?height=32&width=32`,
        },
      }
    })

    res.json(formattedComments)
  } catch (error) {
    console.error("Error fetching comments:", error)
    res.status(500).json({ error: "Failed to fetch comments" })
  }
})


// Add these routes for repository connections after the existing routes

// Get connections for a repository
app.get("/api/repos/:owner/:repoName/connections", async (req, res) => {
  const { owner, repoName } = req.params

  try {
    const connections = await knex("repo_connections")
      .where({
        repo_owner: owner,
        repo_name: repoName,
      })
      .orderBy("created_at", "desc")

    // Format the response
    const formattedConnections = connections.map((conn) => ({
      id: conn.id,
      repoPath: conn.connected_repo_path,
      description: conn.description || "",
      codeSnippet: conn.code_snippet,
      createdAt: conn.created_at,
    }))

    res.json(formattedConnections)
  } catch (error) {
    console.error("Error fetching repository connections:", error)
    res.status(500).json({ error: "Failed to fetch repository connections" })
  }
})

// Add a new connection
app.post("/api/repos/:owner/:repoName/connections", auth, async (req, res) => {
  const { owner, repoName } = req.params
  const { repoPath, description, codeSnippet } = req.body

  if (!repoPath || !codeSnippet) {
    return res.status(400).json({ error: "Repository path and code snippet are required" })
  }

  // Validate the repoPath format (should be owner/repoName)
  if (!repoPath.includes("/")) {
    return res.status(400).json({ error: "Repository path must be in the format 'owner/repoName'" })
  }

  const [targetOwner, targetRepo] = repoPath.split("/")

  try {
    // Check if the target repository exists
    const token = req.user.token
    const repoCheckResponse = await fetch(`${GITEA_URL}/api/v1/repos/${targetOwner}/${targetRepo}`, {
      headers: {
        Authorization: `token ${token}`,
      },
    })

    if (!repoCheckResponse.ok) {
      // Repository doesn't exist or user doesn't have access
      return res.status(404).json({
        error: "The repository you're trying to connect to doesn't exist or you don't have access to it",
      })
    }

    // Insert the connection and get the ID
    const result = await knex("repo_connections")
      .insert({
        repo_owner: owner,
        repo_name: repoName,
        connected_repo_path: repoPath,
        description: description || null,
        code_snippet: codeSnippet,
      })
      .returning("id")

    // Extract the ID value properly
    const connectionId = result[0].id || result[0]

    // Fetch the newly created connection
    const newConnection = await knex("repo_connections").where({ id: connectionId }).first()

    res.status(201).json({
      id: newConnection.id,
      repoPath: newConnection.connected_repo_path,
      description: newConnection.description || "",
      codeSnippet: newConnection.code_snippet,
      createdAt: newConnection.created_at,
    })
  } catch (error) {
    console.error("Error creating repository connection:", error)
    res.status(500).json({ error: "Failed to create repository connection" })
  }
})

// Update an existing connection
app.put("/api/repos/:owner/:repoName/connections/:connectionId", auth, async (req, res) => {
  const { owner, repoName, connectionId } = req.params
  const { repoPath, description, codeSnippet } = req.body

  if (!repoPath || !codeSnippet) {
    return res.status(400).json({ error: "Repository path and code snippet are required" })
  }

  // Validate the repoPath format (should be owner/repoName)
  if (!repoPath.includes("/")) {
    return res.status(400).json({ error: "Repository path must be in the format 'owner/repoName'" })
  }

  const [targetOwner, targetRepo] = repoPath.split("/")

  try {
    // Check if the connection exists and belongs to the specified repository
    const existingConnection = await knex("repo_connections")
      .where({
        id: connectionId,
        repo_owner: owner,
        repo_name: repoName,
      })
      .first()

    if (!existingConnection) {
      return res.status(404).json({ error: "Connection not found" })
    }

    // Check if the target repository exists
    const token = req.user.token
    const repoCheckResponse = await fetch(`${GITEA_URL}/api/v1/repos/${targetOwner}/${targetRepo}`, {
      headers: {
        Authorization: `token ${token}`,
      },
    })

    if (!repoCheckResponse.ok) {
      // Repository doesn't exist or user doesn't have access
      return res.status(404).json({
        error: "The repository you're trying to connect to doesn't exist or you don't have access to it",
      })
    }

    await knex("repo_connections")
      .where({ id: connectionId })
      .update({
        connected_repo_path: repoPath,
        description: description || null,
        code_snippet: codeSnippet,
        updated_at: knex.fn.now(),
      })

    const updatedConnection = await knex("repo_connections").where({ id: connectionId }).first()

    res.json({
      id: updatedConnection.id,
      repoPath: updatedConnection.connected_repo_path,
      description: updatedConnection.description || "",
      codeSnippet: updatedConnection.code_snippet,
      createdAt: updatedConnection.created_at,
      updatedAt: updatedConnection.updated_at,
    })
  } catch (error) {
    console.error("Error updating repository connection:", error)
    res.status(500).json({ error: "Failed to update repository connection" })
  }
})

// Delete a connection
app.delete("/api/repos/:owner/:repoName/connections/:connectionId", auth, async (req, res) => {
  const { owner, repoName, connectionId } = req.params

  try {
    // Check if the connection exists and belongs to the specified repository
    const existingConnection = await knex("repo_connections")
      .where({
        id: connectionId,
        repo_owner: owner,
        repo_name: repoName,
      })
      .first()

    if (!existingConnection) {
      return res.status(404).json({ error: "Connection not found" })
    }

    await knex("repo_connections").where({ id: connectionId }).delete()

    res.json({ message: "Connection deleted successfully" })
  } catch (error) {
    console.error("Error deleting repository connection:", error)
    res.status(500).json({ error: "Failed to delete repository connection" })
  }
})

app.listen(4000, () => console.log("Backend running at port 4000"))

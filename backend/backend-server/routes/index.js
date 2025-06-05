const express = require("express")

const authRoutes = require("./auth")
const userRoutes = require("./users")
const repoRoutes = require("./repos")
const repoFileRoutes = require("./repoFiles")
const communityRoutes = require("./community")
const featureRoutes = require("./features")
const benchmarkRoutes = require("./benchmarks")
const playgroundRoutes = require("./playground")
const playgroundEnvironmentRoutes = require("./playgroundEnvironments")

// Import auth middleware
const { auth } = require("../middleware/auth")

const router = express.Router()

// Mount routes with their respective prefixes
router.use("/auth", authRoutes)
router.use("/users", userRoutes)
router.use("/repos", repoRoutes)
router.use("/repo-files", repoFileRoutes)
router.use("/community", communityRoutes)
router.use("/features", featureRoutes)
router.use("/benchmarks", benchmarkRoutes)
router.use("/playground", playgroundRoutes)
router.use("/playground", playgroundEnvironmentRoutes)

// Root level endpoints for backward compatibility
const GiteaService = require("../services/giteaService")
const fetch = (...args) => import("node-fetch").then(({ default: fetch }) => fetch(...args))
const GITEA_URL = process.env.GITEA_URL

// Profile endpoint (was /api/profile)
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

// User repos endpoint (was /api/user-repos)
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

    const userRes = await GiteaService.getUserProfile(token)

    if (!userRes.ok) {
      const userErr = await userRes.json()
      return res.status(userRes.status).json({ message: userErr.message || "Failed to fetch user info." })
    }

    const userData = await userRes.json()
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

// Keyword normalization and fuzzy matching utilities
function normalizeKeyword(keyword) {
  const normalized = keyword.toLowerCase().trim()

  // Common keyword aliases and variations
  const aliases = {
    'ortools': 'or-tools',
    'or_tools': 'or-tools',
    'cvxpy': 'cvxpy',
    'scipy': 'scipy',
    'scikit-learn': 'sklearn',
    'sklearn': 'scikit-learn',
    'scikit-optimize': 'skopt',
    'skopt': 'scikit-optimize',
    'genetic-algorithm': 'genetic algorithm',
    'genetic_algorithm': 'genetic algorithm',
    'ga': 'genetic algorithm',
    'simulated-annealing': 'simulated annealing',
    'simulated_annealing': 'simulated annealing',
    'sa': 'simulated annealing',
    'particle-swarm': 'particle swarm',
    'particle_swarm': 'particle swarm',
    'pso': 'particle swarm',
    'tsp': 'traveling salesman',
    'vrp': 'vehicle routing',
    'milp': 'mixed integer programming',
    'ilp': 'integer programming',
    'lp': 'linear programming',
    'qp': 'quadratic programming',
    'nlp': 'nonlinear programming'
  }

  return aliases[normalized] || normalized
}

function calculateStringSimilarity(str1, str2) {
  // Simple Levenshtein distance-based similarity
  const longer = str1.length > str2.length ? str1 : str2
  const shorter = str1.length > str2.length ? str2 : str1

  if (longer.length === 0) return 1.0

  const editDistance = levenshteinDistance(longer, shorter)
  return (longer.length - editDistance) / longer.length
}

function levenshteinDistance(str1, str2) {
  const matrix = []

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i]
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        )
      }
    }
  }

  return matrix[str2.length][str1.length]
}

function fuzzyMatchKeywords(searchKeywords, targetKeywords, threshold = 0.7) {
  const matches = []

  for (const searchKw of searchKeywords) {
    const normalizedSearch = normalizeKeyword(searchKw)

    for (const targetKw of targetKeywords) {
      const normalizedTarget = normalizeKeyword(targetKw)

      // Exact match after normalization
      if (normalizedSearch === normalizedTarget) {
        matches.push({ keyword: targetKw, similarity: 1.0, type: 'exact' })
        continue
      }

      // Substring match
      if (normalizedTarget.includes(normalizedSearch) || normalizedSearch.includes(normalizedTarget)) {
        matches.push({ keyword: targetKw, similarity: 0.9, type: 'substring' })
        continue
      }

      // Fuzzy match
      const similarity = calculateStringSimilarity(normalizedSearch, normalizedTarget)
      if (similarity >= threshold) {
        matches.push({ keyword: targetKw, similarity, type: 'fuzzy' })
      }
    }
  }

  return matches.sort((a, b) => b.similarity - a.similarity)
}

// Public repos endpoint (was /api/public-repos)
router.get("/public-repos", async (req, res) => {
  try {
    const q = req.query.q || ""
    const pageNum = Number.parseInt(req.query.page || "1", 10)
    const limitNum = Number.parseInt(req.query.limit || "10", 10)
    const sortField = req.query.sort || "updated"
    const order = (req.query.order || "desc").toLowerCase() === "asc" ? "asc" : "desc"
    const languages = (req.query.languages || "")
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean)
    const keywords = (req.query.keywords || "")
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean)

    // Helper function to map sort fields
    function mapSortField(field) {
      switch (field) {
        case "stars":
          return "stars"
        case "forks":
          return "forks"
        case "created":
          return "created"
        case "alpha":
          return "alpha"
        default:
          return "updated"
      }
    }

    // Build Gitea search URL
    const sp = new URLSearchParams({
      q,
      page: String(pageNum),
      limit: String(limitNum),
      sort: mapSortField(sortField),
      order,
      includeDesc: "true",
      is_private: "false",
    })
    const url = `${GITEA_URL}/api/v1/repos/search?${sp}`

    // Use header token if present, else fallback to backend service token
    const headerToken = req.headers.authorization?.split(" ")[1]
    const adminToken = GiteaService.getAdminToken()
    const token = headerToken || adminToken

    if (!token) {
      console.error("No authentication token available for public repos request")
      return res.status(500).json({
        message: "Service configuration error: No authentication token available"
      })
    }

    const headers = { Authorization: `token ${token}` }

    // Fetch repositories
    const repoResp = await fetch(url, { headers })
    if (!repoResp.ok) {
      return res.status(repoResp.status).json({ message: `Gitea error ${repoResp.status}` })
    }
    const body = await repoResp.json()
    let repos = Array.isArray(body.data) ? body.data : []
    let totalCount = Number.parseInt(repoResp.headers.get("x-total-count") || "0", 10)

    // Apply language filter
    if (languages.length) {
      repos = repos.filter((r) => r.language && languages.includes(r.language.toLowerCase()))
      totalCount = repos.length
    }

    // Apply keyword filter with normalization and fuzzy matching
    if (keywords.length) {
      // Normalize search keywords
      const normalizedKeywords = keywords.map(normalizeKeyword)

      const matched = repos.filter((r) => {
        // Check repository name and description with normalization
        const repoText = `${r.name || ""} ${r.description || ""}`.toLowerCase()
        return normalizedKeywords.some(kw => repoText.includes(kw))
      })

      // Check config.json for additional matches with fuzzy matching
      const rest = repos.filter((r) => !matched.includes(r)).slice(0, 20)
      await Promise.all(
        rest.map(async (repo) => {
          try {
            const c = await fetch(`${GITEA_URL}/api/v1/repos/${repo.owner.login}/${repo.name}/contents/config.json`, {
              headers,
            })
            if (!c.ok) return
            const cfg = await c.json()
            if (!cfg.content) return
            const txt = Buffer.from(cfg.content, "base64").toString("utf8")
            const parsed = JSON.parse(txt)

            // Check both legacy keywords and new metadata.tags format
            let allTags = []
            if (Array.isArray(parsed.keywords)) {
              allTags = [...allTags, ...parsed.keywords]
            }
            if (parsed.metadata && Array.isArray(parsed.metadata.tags)) {
              allTags = [...allTags, ...parsed.metadata.tags]
            }

            if (allTags.length > 0) {
              const tagStrings = allTags.map((k) => String(k).toLowerCase())

              // Use fuzzy matching to find keyword matches
              const fuzzyMatches = fuzzyMatchKeywords(normalizedKeywords, tagStrings, 0.7)

              if (fuzzyMatches.length > 0) {
                // Store both exact matches and fuzzy matches with metadata
                repo.matching_keywords = fuzzyMatches.map(match => ({
                  keyword: match.keyword,
                  similarity: match.similarity,
                  type: match.type
                }))
                matched.push(repo)
              }
            }
          } catch {}
        }),
      )

      repos = matched
      totalCount = repos.length
    }

    // Merge in user-repos if query present
    let didMerge = false
    if (q) {
      const up = new URLSearchParams({ q, page: "1", limit: "5" })
      const ur = await fetch(`${GITEA_URL}/api/v1/users/search?${up}`, { headers })
      if (ur.ok) {
        const users = (await ur.json()).data || []
        const userRepos = []
        for (const u of users) {
          // PRIVACY FIX: Only fetch public repositories for username searches
          const repoParams = new URLSearchParams({
            limit: "50",
            type: "public"  // Ensure only public repos are returned
          })
          const r = await fetch(`${GITEA_URL}/api/v1/users/${u.login}/repos?${repoParams}`, { headers })
          if (!r.ok) continue
          let list = await r.json()

          // Additional privacy check: filter out any private repositories that might slip through
          list = list.filter((repo) => !repo.private)

          if (languages.length) {
            list = list.filter((r) => r.language && languages.includes(r.language.toLowerCase()))
          }
          userRepos.push(...list)
        }
        if (pageNum === 1) {
          const slots = limitNum - repos.length
          repos = repos.concat(userRepos.filter((r) => !repos.find((x) => x.id === r.id)).slice(0, slots))
        }
        totalCount += userRepos.length
        didMerge = true
      }
    }

    // Check for repository type in config.json
    await Promise.all(
      repos.map(async (repo) => {
        try {
          const configResponse = await fetch(
            `${GITEA_URL}/api/v1/repos/${repo.owner.login}/${repo.name}/contents/config.json`,
            { headers }
          )

          if (configResponse.ok) {
            const configData = await configResponse.json()
            if (configData.content) {
              const decodedContent = Buffer.from(configData.content, "base64").toString("utf-8")
              try {
                const parsedConfig = JSON.parse(decodedContent)
                if (parsedConfig.type === "problem" || parsedConfig.type === "optimizer") {
                  repo.qubot_type = parsedConfig.type
                }
              } catch (parseError) {
                console.error(`Error parsing config.json for ${repo.full_name}:`, parseError)
              }
            }
          }
        } catch (error) {
          console.error(`Error fetching config.json for ${repo.full_name}:`, error)
        }
      }),
    )

    // Slice if needed
    let pageItems = repos
    if ((keywords.length || didMerge) && repos.length > limitNum) {
      pageItems = repos.slice(0, limitNum)
    }

    res.json({
      data: pageItems,
      total_count: totalCount,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(totalCount / limitNum),
    })
  } catch (err) {
    console.error("Search failed:", err)
    res.status(500).json({ message: "Search failed", error: err.message })
  }
})

// Public repos count endpoint (was /api/public-repos/count)
router.get("/public-repos/count", async (req, res) => {
  try {
    const headerToken = req.headers.authorization?.split(" ")[1]
    const adminToken = GiteaService.getAdminToken()
    const token = headerToken || adminToken

    if (!token) {
      console.error("No authentication token available for public repos count request")
      return res.status(500).json({
        message: "Service configuration error: No authentication token available"
      })
    }

    const headers = { Authorization: `token ${token}` }

    const countResponse = await fetch(`${GITEA_URL}/api/v1/repos/search?limit=1`, {
      headers,
    })

    if (!countResponse.ok) {
      throw new Error(`Gitea returned ${countResponse.status} ${countResponse.statusText}`)
    }

    const totalCountHeader = countResponse.headers.get("x-total-count")
    const total_count = totalCountHeader ? Number.parseInt(totalCountHeader, 10) : 0

    res.json({ total_count })
  } catch (error) {
    console.error("Error fetching repository count:", error)
    res.status(500).json({ message: "Failed to fetch repository count", error: error.message })
  }
})

// Popular license keys to filter from Gitea
const popularLicenseKeys = [
  "mit",
  "apache-2.0",
  "gpl-3.0-only",
  "gpl-2.0-only",
  "lgpl-3.0-only",
  "lgpl-2.1-only",
  "bsd-3-clause",
  "bsd-2-clause",
  "mpl-2.0",
  "agpl-3.0-only",
  "unlicense",
  "isc",
  "epl-2.0",
  "cc0-1.0",
]

// Get all license templates from Gitea
router.get("/licenses", async (req, res) => {
  try {
    const response = await fetch(`${GITEA_URL}/api/v1/licenses`)
    if (!response.ok) {
      const { message } = await response.json()
      return res.status(response.status).json({ message: message || "Failed to fetch license templates" })
    }
    const licenses = await response.json()
    // Filter to only include popular licenses
    const filtered = licenses.filter((lic) => popularLicenseKeys.includes(lic.key.toLowerCase()))
    return res.json(filtered)
  } catch (error) {
    console.error("Error fetching license templates:", error)
    // Fallback to hardcoded licenses if Gitea API fails
    const fallbackLicenses = [
      { key: "mit", name: "MIT License" },
      { key: "apache-2.0", name: "Apache License 2.0" },
      { key: "gpl-3.0", name: "GNU General Public License v3.0" },
      { key: "bsd-3-clause", name: "BSD 3-Clause License" },
      { key: "bsd-2-clause", name: "BSD 2-Clause License" },
      { key: "lgpl-3.0", name: "GNU Lesser General Public License v3.0" },
      { key: "mpl-2.0", name: "Mozilla Public License 2.0" },
      { key: "unlicense", name: "The Unlicense" },
    ]
    return res.json(fallbackLicenses)
  }
})

// Create repository endpoint
router.post("/create-repo", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1]
    if (!token) {
      return res.status(401).json({ message: "Authentication required" })
    }

    const { name, description, isPrivate, license, readme } = req.body

    if (!name) {
      return res.status(400).json({ message: "Repository name is required" })
    }

    console.log("Creating repository with license:", license)

    // Create repository via Gitea API
    const createRepoRes = await fetch(`${GITEA_URL}/api/v1/user/repos`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `token ${token}`,
      },
      body: JSON.stringify({
        name,
        description: description || "",
        private: isPrivate || false,
        license: license && license !== "none" ? license : "",
        readme: readme || "Default",
        auto_init: true,
      }),
    })

    if (!createRepoRes.ok) {
      const errorData = await createRepoRes.json()
      return res.status(createRepoRes.status).json({
        message: errorData.message || "Failed to create repository",
      })
    }

    const repoData = await createRepoRes.json()
    res.status(201).json(repoData)
  } catch (error) {
    console.error("Error creating repository:", error)
    res.status(500).json({ message: "Internal server error" })
  }
})

// Waitlist endpoint
router.post("/waitlist", async (req, res) => {
  try {
    const { email, username, description } = req.body

    // Validate required fields
    if (!email || !username) {
      return res.status(400).json({
        success: false,
        message: "Email and username are required"
      })
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address"
      })
    }

    // Basic username validation
    if (username.length < 2 || username.length > 50) {
      return res.status(400).json({
        success: false,
        message: "Username must be between 2 and 50 characters"
      })
    }

    // Get client information for analytics
    const clientInfo = {
      ip_address: req.ip || req.connection.remoteAddress,
      user_agent: req.headers['user-agent'],
      referrer: req.headers.referer || req.headers.referrer
    }

    // Save to database
    const waitlistService = require("../services/waitlistService")
    const entry = await waitlistService.addEntry({
      email,
      username,
      description: description || null,
      ...clientInfo
    })

    console.log(`✅ New waitlist entry: ${username} (${email}) - ID: ${entry.id}`)

    res.status(200).json({
      success: true,
      message: "Successfully joined waitlist! We'll review your application and get back to you soon.",
      entry_id: entry.id,
      position: "We'll notify you about your position soon"
    })

  } catch (error) {
    console.error("Waitlist submission error:", error)

    // Handle specific database errors
    if (error.message.includes('already registered') || error.message.includes('already taken')) {
      return res.status(409).json({
        success: false,
        message: error.message
      })
    }

    res.status(500).json({
      success: false,
      message: "Failed to process waitlist application. Please try again."
    })
  }
})

// Admin waitlist endpoints
router.get("/admin/waitlist", auth, async (req, res) => {
  try {
    // Simple admin check - you can enhance this later
    const adminUsers = ['ileo'] // Add your admin usernames here
    console.log('Admin check - user login:', req.user.login, 'admin users:', adminUsers)
    if (!adminUsers.includes(req.user.login)) {
      return res.status(403).json({
        success: false,
        message: "Admin access required"
      })
    }

    const { page = 1, limit = 50, status } = req.query
    const waitlistService = require("../services/waitlistService")

    const result = await waitlistService.getEntries(
      parseInt(page),
      parseInt(limit),
      status
    )

    res.json({
      success: true,
      ...result
    })
  } catch (error) {
    console.error("Error fetching waitlist:", error)
    res.status(500).json({
      success: false,
      message: "Failed to fetch waitlist entries"
    })
  }
})

router.get("/admin/waitlist/stats", auth, async (req, res) => {
  try {
    // Simple admin check - you can enhance this later
    const adminUsers = ['ileo'] // Add your admin usernames here
    if (!adminUsers.includes(req.user.login)) {
      return res.status(403).json({
        success: false,
        message: "Admin access required"
      })
    }

    const waitlistService = require("../services/waitlistService")
    const stats = await waitlistService.getStats()

    res.json({
      success: true,
      stats
    })
  } catch (error) {
    console.error("Error fetching waitlist stats:", error)
    res.status(500).json({
      success: false,
      message: "Failed to fetch waitlist statistics"
    })
  }
})

router.put("/admin/waitlist/:id", auth, async (req, res) => {
  try {
    // Simple admin check - you can enhance this later
    const adminUsers = ['ileo'] // Add your admin usernames here
    if (!adminUsers.includes(req.user.login)) {
      return res.status(403).json({
        success: false,
        message: "Admin access required"
      })
    }

    const { id } = req.params
    const { status, admin_notes } = req.body

    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Must be: pending, approved, or rejected"
      })
    }

    const waitlistService = require("../services/waitlistService")
    const entry = await waitlistService.updateStatus(id, status, admin_notes)

    res.json({
      success: true,
      entry
    })
  } catch (error) {
    console.error("Error updating waitlist entry:", error)
    res.status(500).json({
      success: false,
      message: "Failed to update waitlist entry"
    })
  }
})

router.get("/admin/waitlist/export", auth, async (req, res) => {
  try {
    // Simple admin check - you can enhance this later
    const adminUsers = ['ileo'] // Add your admin usernames here
    if (!adminUsers.includes(req.user.login)) {
      return res.status(403).json({
        success: false,
        message: "Admin access required"
      })
    }

    const { format = 'json' } = req.query
    const waitlistService = require("../services/waitlistService")
    const data = await waitlistService.exportData(format)

    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv')
      res.setHeader('Content-Disposition', 'attachment; filename=waitlist.csv')
      res.send(data)
    } else {
      res.json({
        success: true,
        data
      })
    }
  } catch (error) {
    console.error("Error exporting waitlist:", error)
    res.status(500).json({
      success: false,
      message: "Failed to export waitlist data"
    })
  }
})

// Test database connection and waitlist table
router.get("/waitlist/test", async (req, res) => {
  try {
    const { knex } = require("../config/database")

    // Test database connection
    await knex.raw('SELECT 1')
    console.log('Database connection successful')

    // Check if waitlist table exists
    const tableExists = await knex.schema.hasTable('waitlist')
    console.log('Waitlist table exists:', tableExists)

    // Get table info if it exists
    let entryCount = 0
    if (tableExists) {
      try {
        entryCount = await knex('waitlist').count('* as count').first()
        entryCount = parseInt(entryCount.count)
        console.log('Waitlist entry count:', entryCount)
      } catch (error) {
        console.error('Error counting entries:', error)
      }
    }

    res.json({
      success: true,
      database_connected: true,
      table_exists: tableExists,
      entry_count: entryCount
    })
  } catch (error) {
    console.error("Database test error:", error)
    res.status(500).json({
      success: false,
      message: "Database test failed",
      error: error.message
    })
  }
})

// Public waitlist stats (limited info)
router.get("/waitlist/stats", async (req, res) => {
  try {
    const waitlistService = require("../services/waitlistService")
    const stats = await waitlistService.getStats()

    // Only return public stats
    res.json({
      success: true,
      stats: {
        total_signups: stats.total,
        recent_signups: stats.recent
      }
    })
  } catch (error) {
    console.error("Error fetching public waitlist stats:", error)
    res.status(500).json({
      success: false,
      message: "Failed to fetch waitlist statistics"
    })
  }
})

// Email test endpoint
router.get("/test-email", async (req, res) => {
  try {
    const emailService = require("../services/emailService")
    const isConnected = await emailService.testConnection()

    res.json({
      status: isConnected ? "OK" : "FAILED",
      email_service: isConnected,
      timestamp: new Date().toISOString(),
      message: isConnected ? "Email service is working" : "Email service connection failed"
    })
  } catch (error) {
    res.status(500).json({
      status: "ERROR",
      email_service: false,
      error: error.message,
      timestamp: new Date().toISOString()
    })
  }
})

// Health check endpoint
router.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    message: "API is running"
  })
})

// Backward compatibility route for login (redirect to auth/login)
router.post("/login", async (req, res) => {
  const { username, password } = req.body
  const { knex } = require("../config/database")

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

    // Set HTTP-only cookie for authentication (consistent with auth/login)
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
      token: userToken, // Keep token in response for backward compatibility
    })
  } catch (err) {
    console.error("Login error:", err)
    return res.status(500).json({ message: "Internal server error" })
  }
})

// API info endpoint
router.get("/", (req, res) => {
  res.json({
    name: "Rastion Backend API",
    version: "1.0.0",
    description: "Backend API for the Rastion platform",
    endpoints: {
      auth: "/api/auth",
      users: "/api/users",
      repos: "/api/repos",
      repositories: "/api/repositories",
      repoFiles: "/api/repo-files",
      community: "/api/community",
      features: "/api/features",
      benchmarks: "/api/benchmarks",
      playground: "/api/playground"
    }
  })
})

// Repositories endpoint (for user's repositories with qubot_type filtering)
router.get("/repositories", async (req, res) => {
  try {
    // Try to get token from session first (HTTP-only cookie), then fallback to Authorization header
    let token = req.session?.user_data?.token

    // Fallback to Authorization header for backward compatibility during transition
    if (!token) {
      token = req.headers.authorization?.split(" ")[1]
    }

    if (!token) {
      return res.status(401).json({ message: "Authentication required" })
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

    // Enhance repositories with config.json data to determine qubot_type
    const enhancedRepos = await Promise.all(
      reposData.map(async (repo) => {
        try {
          // Try to fetch config.json from the repository
          const configUrl = `${GITEA_URL}/api/v1/repos/${repo.full_name}/contents/config.json`
          const configRes = await fetch(configUrl, {
            headers: { Authorization: `token ${token}` }
          })

          if (configRes.ok) {
            const configData = await configRes.json()
            if (configData.content) {
              // Decode base64 content
              const configContent = Buffer.from(configData.content, 'base64').toString('utf-8')
              const config = JSON.parse(configContent)

              // Add qubot_type from config
              repo.qubot_type = config.type || null
              repo.config = config
            }
          }
        } catch (error) {
          console.error(`Error fetching config.json for ${repo.full_name}:`, error)
          repo.qubot_type = null
          repo.config = null
        }
        return repo
      })
    )

    return res.json(enhancedRepos)
  } catch (error) {
    console.error("Error fetching user repositories:", error)
    return res.status(500).json({ message: "Internal server error" })
  }
})

// Keyword suggestions endpoint
router.get("/keyword-suggestions", async (req, res) => {
  try {
    const query = req.query.q || ""
    const limit = Number.parseInt(req.query.limit || "10", 10)

    // Comprehensive keyword taxonomy
    const standardKeywords = [
      // Libraries and Frameworks
      "qubots", "or-tools", "cvxpy", "scipy", "pyomo", "gurobi", "cplex", "mosek",
      "optuna", "hyperopt", "deap", "pygad", "platypus", "pyswarms", "scikit-optimize",
      "pymoo", "simanneal", "inspyred", "nevergrad", "ax", "numpy", "pandas",

      // Optimization Algorithms
      "linear programming", "integer programming", "mixed integer programming",
      "genetic algorithm", "simulated annealing", "particle swarm", "gradient descent",
      "bayesian optimization", "evolutionary algorithms", "tabu search",
      "ant colony optimization", "hill climbing", "branch and bound",
      "dynamic programming", "constraint programming", "stochastic gradient descent",
      "admm", "nelder-mead", "differential evolution", "quantum annealing",

      // Problem Types
      "scheduling", "routing", "assignment", "knapsack", "facility location",
      "network flow", "traveling salesman", "bin packing", "resource allocation",
      "portfolio optimization", "vehicle routing", "job shop", "flow shop",
      "cutting stock", "set covering", "maximum flow", "minimum cost flow",
      "quadratic assignment", "nurse scheduling", "crew scheduling",

      // Domains
      "logistics", "supply chain", "transportation", "manufacturing", "finance",
      "healthcare", "energy", "telecommunications", "aerospace", "automotive"
    ]

    if (!query.trim()) {
      // Return popular keywords if no query
      return res.json({
        suggestions: standardKeywords.slice(0, limit).map(kw => ({
          keyword: kw,
          normalized: normalizeKeyword(kw),
          type: 'popular'
        }))
      })
    }

    const normalizedQuery = normalizeKeyword(query.toLowerCase())
    const suggestions = []

    // Find exact matches and similar keywords
    for (const keyword of standardKeywords) {
      const normalizedKeyword = normalizeKeyword(keyword)

      // Exact match after normalization
      if (normalizedKeyword === normalizedQuery) {
        suggestions.push({
          keyword,
          normalized: normalizedKeyword,
          similarity: 1.0,
          type: 'exact'
        })
        continue
      }

      // Substring match
      if (normalizedKeyword.includes(normalizedQuery) || normalizedQuery.includes(normalizedKeyword)) {
        suggestions.push({
          keyword,
          normalized: normalizedKeyword,
          similarity: 0.9,
          type: 'substring'
        })
        continue
      }

      // Fuzzy match
      const similarity = calculateStringSimilarity(normalizedQuery, normalizedKeyword)
      if (similarity >= 0.6) {
        suggestions.push({
          keyword,
          normalized: normalizedKeyword,
          similarity,
          type: 'fuzzy'
        })
      }
    }

    // Sort by similarity and limit results
    const sortedSuggestions = suggestions
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit)

    res.json({ suggestions: sortedSuggestions })

  } catch (err) {
    console.error("Keyword suggestions failed:", err)
    res.status(500).json({ message: "Keyword suggestions failed", error: err.message })
  }
})

module.exports = router

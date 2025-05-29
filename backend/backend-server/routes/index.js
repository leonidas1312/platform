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
  const token = req.headers.authorization?.split(" ")[1]
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
    const token = req.headers.authorization?.split(" ")[1]
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

    // Apply keyword filter
    if (keywords.length) {
      const matched = repos.filter((r) =>
        keywords.some(
          (kw) => (r.name || "").toLowerCase().includes(kw) || (r.description || "").toLowerCase().includes(kw),
        ),
      )

      // Check config.json for additional matches
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
              const lower = allTags.map((k) => String(k).toLowerCase())
              const hits = keywords.filter((kw) => lower.includes(kw))
              if (hits.length) {
                repo.matching_keywords = hits
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
          const r = await fetch(`${GITEA_URL}/api/v1/users/${u.login}/repos?limit=50`, { headers })
          if (!r.ok) continue
          let list = await r.json()
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

// API info endpoint
router.get("/", (req, res) => {
  res.json({
    name: "Tsiaou Backend API",
    version: "1.0.0",
    description: "Backend API for the Tsiaou platform",
    endpoints: {
      auth: "/api/auth",
      users: "/api/users",
      repos: "/api/repos",
      repoFiles: "/api/repo-files",
      community: "/api/community",
      features: "/api/features",
      benchmarks: "/api/benchmarks",
      playground: "/api/playground"
    }
  })
})

module.exports = router

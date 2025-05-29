const express = require("express")
const { knex } = require("../config/database")
const GiteaService = require("../services/giteaService")
const auth = require("../middleware/auth")

const router = express.Router()
const fetch = (...args) => import("node-fetch").then(({ default: fetch }) => fetch(...args))

const GITEA_URL = process.env.GITEA_URL

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

// Get repository config files
router.get("/:owner/:repo/config", async (req, res) => {
  const { owner, repo } = req.params
  const authHeader = req.headers.authorization
  const headers = {}

  if (authHeader) {
    headers.Authorization = authHeader
  }

  try {
    const configResponse = await fetch(`${GITEA_URL}/api/v1/repos/${owner}/${repo}/contents/config.json`, {
      headers,
    })

    if (!configResponse.ok) {
      return res.json({ keywords: [] })
    }

    const configData = await configResponse.json()

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

// Note: public-repos endpoints moved to main routes/index.js for backward compatibility
// Note: create-repo endpoint is handled in main routes/index.js for backward compatibility

// Get repository details, README, config.json, and file listing
router.get("/:owner/:repoName", async (req, res) => {
  const { owner, repoName } = req.params

  try {
    const token = req.headers.authorization?.split(" ")[1]
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

// Delete repository
router.delete("/:owner/:repoName", async (req, res) => {
  const { owner, repoName } = req.params
  const token = req.headers.authorization?.split(" ")[1]

  if (!token) {
    return res.status(401).json({ message: "Unauthorized" })
  }

  try {
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

    return res.status(200).json({ message: "Repository deleted successfully" })
  } catch (err) {
    console.error("Error deleting repository:", err)
    return res.status(500).json({ message: "Internal server error" })
  }
})

// Get repository contents for a specific path
router.get("/:owner/:repoName/contents/:path(*)", async (req, res) => {
  const { owner, repoName, path } = req.params
  const { ref } = req.query

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

// Get repository contents for root path (when path is empty)
router.get("/:owner/:repoName/contents/", async (req, res) => {
  const { owner, repoName } = req.params
  const { ref } = req.query

  try {
    const branch = ref || "main"
    const contentsUrl = `${GITEA_URL}/api/v1/repos/${owner}/${repoName}/contents?ref=${branch}`
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

// Create or Update a file in a repository (POST) - Alias for repo-files route
router.post("/:owner/:repoName/contents/:filepath(*)", async (req, res) => {
  const { owner, repoName, filepath } = req.params
  const { author, branch, committer, content, dates, message, new_branch, signoff } = req.body

  if (!content) {
    return res.status(400).json({ message: "Content is required" })
  }

  const base64Content = Buffer.from(content, "utf8").toString("base64")
  const token = req.headers.authorization?.split(" ")[1]

  if (!token) {
    return res.status(401).json({ message: "Unrecognised request." })
  }

  try {
    // Check if the file already exists
    const checkUrl = `${GITEA_URL}/api/v1/repos/${owner}/${repoName}/contents/${encodeURIComponent(filepath)}?ref=${branch || "main"}`
    const checkRes = await fetch(checkUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `token ${token}`,
      },
    })

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
      // File exists - do a PUT
      const fileData = await checkRes.json()
      const existingSha = fileData.sha || fileData?.content?.sha

      if (!existingSha) {
        return res.status(400).json({ message: "Unable to locate existing file SHA for update." })
      }

      const updatePayload = {
        ...payload,
        sha: existingSha,
      }

      const updateUrl = `${GITEA_URL}/api/v1/repos/${owner}/${repoName}/contents/${encodeURIComponent(filepath)}`
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
      // File does not exist - do a POST
      const createUrl = `${GITEA_URL}/api/v1/repos/${owner}/${repoName}/contents/${encodeURIComponent(filepath)}`
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

// Get connections for a repository
router.get("/:owner/:repoName/connections", async (req, res) => {
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
router.post("/:owner/:repoName/connections", auth, async (req, res) => {
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
    // Verify that the target repository exists
    const token = req.headers.authorization?.split(" ")[1]
    const headers = token ? { Authorization: `token ${token}` } : {}

    const repoCheckRes = await fetch(`${GITEA_URL}/api/v1/repos/${targetOwner}/${targetRepo}`, { headers })
    if (!repoCheckRes.ok) {
      return res.status(400).json({ error: "Target repository does not exist or is not accessible" })
    }

    const [newConnection] = await knex("repo_connections")
      .insert({
        repo_owner: owner,
        repo_name: repoName,
        connected_repo_path: repoPath,
        description: description || null,
        code_snippet: codeSnippet,
        created_at: knex.fn.now(),
      })
      .returning("*")

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
router.put("/:owner/:repoName/connections/:connectionId", auth, async (req, res) => {
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
    // Check if connection exists
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

    // Verify that the target repository exists
    const token = req.headers.authorization?.split(" ")[1]
    const headers = token ? { Authorization: `token ${token}` } : {}

    const repoCheckRes = await fetch(`${GITEA_URL}/api/v1/repos/${targetOwner}/${targetRepo}`, { headers })
    if (!repoCheckRes.ok) {
      return res.status(400).json({ error: "Target repository does not exist or is not accessible" })
    }

    const [updatedConnection] = await knex("repo_connections")
      .where({ id: connectionId })
      .update({
        connected_repo_path: repoPath,
        description: description || null,
        code_snippet: codeSnippet,
        updated_at: knex.fn.now(),
      })
      .returning("*")

    res.json({
      id: updatedConnection.id,
      repoPath: updatedConnection.connected_repo_path,
      description: updatedConnection.description || "",
      codeSnippet: updatedConnection.code_snippet,
      createdAt: updatedConnection.created_at,
    })
  } catch (error) {
    console.error("Error updating repository connection:", error)
    res.status(500).json({ error: "Failed to update repository connection" })
  }
})

// Delete a connection
router.delete("/:owner/:repoName/connections/:connectionId", auth, async (req, res) => {
  const { owner, repoName, connectionId } = req.params

  try {
    // Check if connection exists
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

    await knex("repo_connections")
      .where({ id: connectionId })
      .del()

    res.json({ message: "Connection deleted successfully" })
  } catch (error) {
    console.error("Error deleting repository connection:", error)
    res.status(500).json({ error: "Failed to delete repository connection" })
  }
})

module.exports = router

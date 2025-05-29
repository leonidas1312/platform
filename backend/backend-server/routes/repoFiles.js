const express = require("express")

const router = express.Router()
const fetch = (...args) => import("node-fetch").then(({ default: fetch }) => fetch(...args))

const GITEA_URL = process.env.GITEA_URL

// Create or update a file in a repository
router.put("/:owner/:repoName/contents/:filepath(*)", async (req, res) => {
  const { owner, repoName, filepath } = req.params
  const { content, message, branch, sha } = req.body
  const token = req.headers.authorization?.split(" ")[1]

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
router.get("/:owner/:repoName/branches", async (req, res) => {
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
router.post("/:owner/:repo/contents/:filepath(*)", async (req, res) => {
  const { owner, repo, filepath } = req.params
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
    const checkUrl = `${GITEA_URL}/api/v1/repos/${owner}/${repo}/contents/${encodeURIComponent(filepath)}?ref=${branch || "main"}`
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
      // File does not exist - do a POST
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
router.post("/:owner/:repo/contents", async (req, res) => {
  const { owner, repo } = req.params
  const {
    author,
    branch,
    committer,
    dates,
    files,
    message,
    new_branch,
    signoff,
  } = req.body

  if (!files || !Array.isArray(files) || files.length === 0) {
    return res.status(400).json({ message: "Files array is required" })
  }

  const token = req.headers.authorization?.split(" ")[1]
  if (!token) {
    return res.status(401).json({ message: "Unrecognised request." })
  }

  try {
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

// Get commit history for a repository
router.get("/:owner/:repoName/commits", async (req, res) => {
  const { owner, repoName } = req.params
  const { path, limit = 10, page = 1 } = req.query
  const token = req.headers.authorization?.split(" ")[1]

  if (!token) {
    return res.status(401).json({ message: "Not logged in." })
  }

  try {
    let commitsUrl = `${GITEA_URL}/api/v1/repos/${owner}/${repoName}/commits`

    const queryParams = new URLSearchParams()
    if (path) queryParams.append("path", String(path))
    if (limit) queryParams.append("limit", String(limit))
    if (page) queryParams.append("page", String(page))

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
router.delete("/:owner/:repo/contents/:filepath(*)", async (req, res) => {
  const { owner, repo, filepath } = req.params
  const { message, branch, sha } = req.body

  if (!sha) {
    return res.status(400).json({ message: "SHA is required for file deletion" })
  }

  const token = req.headers.authorization?.split(" ")[1]
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

module.exports = router

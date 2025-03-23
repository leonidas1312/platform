const fetch = (...args) => import("node-fetch").then(({ default: fetch }) => fetch(...args))
const express = require("express")
const cors = require("cors")
const crypto = require("crypto")
const knex = require("knex")(require("./DB_postgres/knexfile").production)
const nodemailer = require("nodemailer")
require("dotenv").config()

const app = express()
app.use(express.json())
app.use(cors())

const GITEA_URL = process.env.GITEA_URL
let ADMIN_TOKEN = "not_set"

app.post("/set-admin-token", (req, res) => {
  const { SECRET_TOKEN, value } = req.body

  if (!SECRET_TOKEN || SECRET_TOKEN !== process.env.SECRET_TOKEN) {
    return res.status(403).json({ error: "Unauthorized" })
  }

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
    // Redirect user to a page that shows 'Expired link' or similar
    return res.redirect("http://localhost:8080/email-verify?status=expired")
  }

  // Try to activate user in Gitea
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
      allow_create_organization: true,
      allow_git_hook: true,
      allow_import_local: true,
      restricted: false,
    }),
  })

  if (!activateRes.ok) {
    const error = await activateRes.json()
    // Pass error message back to the frontend route if you want
    return res.redirect(`http://localhost:8080/email-verify?status=error&msg=${encodeURIComponent(error.message)}`)
  }

  // Delete the token after successful activation
  await knex("email_verifications").where({ token }).del()

  // Redirect user with success status
  res.redirect("http://localhost:8080/email-verify?status=success")
})

// This route logs in the user after clicking login
app.post("/api/login", async (req, res) => {
  const { username, password } = req.body

  try {
    // 1) Build Basic Auth
    const basicAuth = `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`

    // 2) Create a new token every time with a timestamp-based name
    const tokenName = `auto-created-${Date.now()}` // e.g. "auto-created-1678902135678"

    const createTokenRes = await fetch(`${GITEA_URL}/api/v1/users/${username}/tokens`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: basicAuth,
      },
      body: JSON.stringify({
        name: tokenName,
        scopes: ["read:repository", "write:user", "write:repository"],
      }),
    })

    if (!createTokenRes.ok) {
      const createErrData = await createTokenRes.json()
      return res.status(createTokenRes.status).json({
        message: createErrData.message || "Could not create a personal token.",
      })
    }

    const newTokenData = await createTokenRes.json()
    const userToken = newTokenData.sha1

    // 3) Fetch user profile using the new token
    const profileRes = await fetch(`${GITEA_URL}/api/v1/user`, {
      headers: {
        Authorization: `token ${userToken}`,
      },
    })

    if (!profileRes.ok) {
      const profileErr = await profileRes.json()
      return res.status(profileRes.status).json({
        message: profileErr.message || "Failed to fetch user profile.",
      })
    }

    const userProfile = await profileRes.json()

    // 4) Return newly created token + user data
    return res.json({
      message: "Login successful",
      token: userToken,
      user: userProfile,
    })
  } catch (err) {
    console.error("Login error:", err)
    return res.status(500).json({ message: "Internal server error" })
  }
})

// This route returns user information for the profile page
app.get("/api/profile", async (req, res) => {
  const authHeader = req.headers.authorization
  // Expecting: 'token <theGiteaToken>' or something similar
  if (!authHeader) {
    return res.status(401).json({ message: "Missing authorization header" })
  }

  // Parse the token from the header. For example:
  // 'token 123abc...' => we strip out 'token '
  const userToken = authHeader.replace(/^token\s+/, "")

  try {
    const giteaRes = await fetch(`${GITEA_URL}/api/v1/user`, {
      headers: { Authorization: `token ${userToken}` },
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
  const authHeader = req.headers.authorization

  if (!authHeader) {
    return res.status(401).json({ message: "Missing authorization header" })
  }

  const userToken = authHeader.replace(/^token\s+/, "")

  try {
    const giteaRes = await fetch(`${GITEA_URL}/api/v1/users/${username}`, {
      headers: { Authorization: `token ${userToken}` },
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
  const authHeader = req.headers.authorization

  if (!authHeader) {
    return res.status(401).json({ message: "Missing authorization header" })
  }

  const userToken = authHeader.replace(/^token\s+/, "")

  try {
    const giteaRes = await fetch(`${GITEA_URL}/api/v1/users/${username}/repos`, {
      headers: { Authorization: `token ${userToken}` },
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
  const authHeader = req.headers.authorization
  if (!authHeader) {
    return res.status(401).json({ message: "Missing authorization header" })
  }

  const userToken = authHeader.replace(/^token\s+/, "")
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
        Authorization: `token ${userToken}`,
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
    // 1) Extract the Gitea token from the request header: "Authorization: token <theToken>"
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith("token ")) {
      return res.status(401).json({ message: "Missing or invalid token in Authorization header." })
    }
    const userToken = authHeader.slice("token ".length).trim()

    // 2) (Optional) figure out the user's username by calling /api/v1/user
    //    Because we need their actual username for the next step
    const userRes = await fetch(`${GITEA_URL}/api/v1/user`, {
      headers: { Authorization: `token ${userToken}` },
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
      headers: { Authorization: `token ${userToken}` },
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

// This route lists all public repos in Gitea
app.get("/api/public-repos", async (req, res) => {
  const { page = 1, limit = 10, q = "" } = req.query

  try {
    // 1) Construct query to Gitea's search
    //    For example: GET /api/v1/repos/search?private=false&limit=10&page=1&q=someSearch
    const searchUrl = new URL(`${GITEA_URL}/api/v1/repos/search`)
    searchUrl.searchParams.set("private", "false")
    searchUrl.searchParams.set("limit", limit)
    searchUrl.searchParams.set("page", page)
    if (q) {
      searchUrl.searchParams.set("q", q) // optional search by name
    }

    // 2) Make the request to Gitea
    const giteaRes = await fetch(searchUrl, {
      headers: {
        "Content-Type": "application/json",
        // For strictly public repos, you may not need a token.
        // If Gitea requires a token to see these, add an admin or user token:
        // 'Authorization': `token ${ADMIN_TOKEN}`
      },
    })

    if (!giteaRes.ok) {
      const errData = await giteaRes.json()
      return res.status(giteaRes.status).json({
        message: errData.message || "Failed to fetch public repos from Gitea.",
      })
    }

    // 3) Gitea's response includes { data: [...], total_count, ok }
    const result = await giteaRes.json()
    // For example:
    // {
    //   "data": [
    //     {
    //       "id": 123,
    //       "name": "myrepo",
    //       "full_name": "username/myrepo",
    //       "owner": { "login": "username", ...},
    //       "stars_count": 5,
    //       "updated_at": "2023-01-01T12:34:56Z",
    //       ...
    //     }
    //   ],
    //   "ok": true,
    //   "total_count": 15
    // }

    return res.json(result)
  } catch (error) {
    console.error("Error fetching public repos:", error)
    res.status(500).json({ message: "Internal server error" })
  }
})

// POST /api/create-repo
app.post("/api/create-repo", async (req, res) => {
  const { name, license, isPrivate } = req.body
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith("token ")) {
    return res.status(401).json({ message: "Missing or invalid token" })
  }
  const userToken = authHeader.replace(/^token\s+/, "")

  try {
    // 1) Create a new repo in Gitea using the user's token
    //    POST /api/v1/user/repos
    const createRes = await fetch(`${GITEA_URL}/api/v1/user/repos`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `token ${userToken}`,
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
    const repoRes = await fetch(`${GITEA_URL}/api/v1/repos/${owner}/${repoName}`)
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

  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith("token ")) {
    return res.status(401).json({ message: "Missing or invalid token" })
  }
  const userToken = authHeader.replace(/^token\s+/, "")

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
        Authorization: `token ${userToken}`,
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

  const base64Content = Buffer.from(content, "utf8").toString("base64");

  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith("token ")) {
    return res.status(401).json({ message: "Missing or invalid token" })
  }
  const userToken = authHeader.replace(/^token\s+/, "")

  try {
    // 1) Check if the file already exists in Gitea
    // Using `encodeURIComponent(filepath)` ensures special chars/spaces are handled.
    const checkUrl = `${GITEA_URL}/api/v1/repos/${owner}/${repo}/contents/${encodeURIComponent(filepath)}?ref=${branch || "main"}`
    const checkRes = await fetch(checkUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `token ${userToken}`,
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
          Authorization: `token ${userToken}`,
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
          Authorization: `token ${userToken}`,
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

  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith("token ")) {
    return res.status(401).json({ message: "Missing or invalid token" })
  }
  const userToken = authHeader.replace(/^token\s+/, "")

  try {
    // For each file, if content is provided as raw text, encode it.
    const formattedFiles = files.map((file) => {
      const encoded = file.content ? Buffer.from(file.content, "utf-8").toString("base64") : undefined
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
        Authorization: `token ${userToken}`,
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

app.listen(4000, () => console.log("Backend running at port 4000"))


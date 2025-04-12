const fetch = (...args) => import("node-fetch").then(({ default: fetch }) => fetch(...args))
const express = require("express")
const session = require('express-session');
const cors = require("cors")
const crypto = require("crypto")
const knex = require("knex")(require("./DB_postgres/knexfile").production)
const nodemailer = require("nodemailer")
require("dotenv").config()

const app = express()
app.use(express.json())

app.use(cors({
  origin: (origin, callback) => {
      if (!origin) return callback(null, true)
      if (origin.startsWith("http://localhost") || origin.startsWith("http://127.0.0.1")) {
          return callback(null, true)
      }
      return callback(new Error("Not allowed by CORS"))
  },
  credentials: true
}))

// Session Middleware
app.use(session({
  secret: 'RwsikosPromaxxwnas',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, httpOnly: true, maxAge: 6000000 } // 100 min expiry
}));

const GITEA_URL = process.env.GITEA_URL
let ADMIN_TOKEN = "not_set"

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
  const token = req.query.token;
  const record = await knex("email_verifications").where({ token }).first();

  if (!record) {
    return res.redirect("http://localhost:8080/email-verify?status=expired");
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
  });

  if (!activateRes.ok) {
    const error = await activateRes.json();
    return res.redirect(
      `http://localhost:8080/email-verify?status=error&msg=${encodeURIComponent(error.message)}`
    );
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
  });

  if (!tokenRes.ok) {
    const error = await tokenRes.json();
    console.error("Failed to create personal access token:", error);
    // Depending on your workflow, you can still proceed or show an error
  }

  const tokenData = await tokenRes.json();
  // Gitea returns the *plain-text* token in `sha1` field when first created
  const userPersonalToken = tokenData.sha1 || null;


  await knex("users").insert({
    username: record.username,
    email: record.email,
    password: record.password, // hashed password from your record
    gitea_token: userPersonalToken,
    // etc...
  }); 
  // ↑ This is optional, if you want to update instead of error on conflict

  // 3) Insert (or update) user in your local DB
  await knex("email_verifications").where({ token }).del(); // remove the verification token


  // 4) Redirect on success
  res.redirect("http://localhost:8080/email-verify?status=success");
});


// This route logs in the user after clicking login
app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const createTokenRes = await fetch(`${GITEA_URL}/api/v1/users/${username}/tokens`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Basic " + Buffer.from(`${username}:${password}`).toString("base64")
      },
      body: JSON.stringify({
        name: Date.now().toString(),
        scopes: ["all"]
      })
    });

    if (!createTokenRes.ok) {
      const createTokenErr = await createTokenRes.json();
      console.error("Failed to fetch Gitea profile:", createTokenErr);
      return res.status(createTokenRes.status).json({
        message: createTokenErr.message.split("[")[0] || "Failed to fetch user profile from Gitea.",
      });
    }

    const createdToken = await createTokenRes.json();

    const userToken = createdToken['sha1'];

    // 4) Use the Gitea token to fetch the user's Gitea profile
    const profileRes = await fetch(`${GITEA_URL}/api/v1/user`, {
      method: "GET",
      headers: {
        Authorization: `token ${userToken}`,
      },
    });

    if (!profileRes.ok) {
      const profileErr = await profileRes.json();
      console.error("Failed to fetch Gitea profile:", profileErr);
      return res.status(profileRes.status).json({
        message: profileErr.message || "Failed to fetch user profile from Gitea.",
      });
    }

    const userProfile = await profileRes.json();

    req.session.user_data = {
      user: userProfile,
      token: userToken
    };
    res.cookie("user_data", req.session.user_data)
    // 6) Return whatever data you want the frontend to have
    return res.json({
      message: "Login successful",
      user: userProfile,
      token: userToken
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});


// This route returns user information for the profile page
app.get("/api/profile", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1]; // Get token from header
  if (! token) {
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

  const token = req.headers.authorization?.split(" ")[1]; // Get token from header
  if (! token) {
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

  const token = req.headers.authorization?.split(" ")[1]; // Get token from header
  if (! token) {
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
  const token = req.headers.authorization?.split(" ")[1]; // Get token from header
  if (! token) {
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
    const token = req.headers.authorization?.split(" ")[1]; // Get token from header
    if (! token) {
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

    return res.json(result)
  } catch (error) {
    console.error("Error fetching public repos:", error)
    res.status(500).json({ message: "Internal server error" })
  }
})

// POST /api/create-repo
app.post("/api/create-repo", async (req, res) => {
  const { name, license, isPrivate } = req.body

  const token = req.headers.authorization?.split(" ")[1]; // Get token from header
  if (! token) {
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
    const token = req.headers.authorization?.split(" ")[1]; // Get token from header
    const repoRes = await fetch(`${GITEA_URL}/api/v1/repos/${owner}/${repoName}`, {
      headers: {
        ...(token && { Authorization: `token ${token}` })
      }
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

  const token = req.headers.authorization?.split(" ")[1]; // Get token from header
  if (! token) {
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

  const base64Content = Buffer.from(content, "utf8").toString("base64");

  const token = req.headers.authorization?.split(" ")[1]; // Get token from header
  if (! token) {
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

  const token = req.headers.authorization?.split(" ")[1]; // Get token from header
  if (! token) {
    return res.status(401).json({ message: "Unrecognised request." })
  }

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

  const token = req.headers.authorization?.split(" ")[1]; // Get token from header
  if (! token) {
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

  const token = req.headers.authorization?.split(" ")[1]; // Get token from header
  if (! token) {
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
    const token = req.headers.authorization?.split(" ")[1]; // Get token from header
    if (! token) {
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


// Get all posts
app.get("/api/community/posts", async (req, res) => {
  try {
    // 1) Fetch all posts from DB, sorted by newest first
    let posts = await knex("posts")
      .select("*")
      .orderBy("created_at", "desc")

    // 2) For each post, fetch user data from Gitea
    //    so that the frontend can show avatar, full_name, etc.
    //    (If you have many posts, consider caching or joining some data.)
    const authHeader = req.headers.authorization
    // If there's a token, we'll attempt to fetch user info. Otherwise, treat as public.
    // For this example, we don't strictly require a token to view posts. If you do, check below.

    // We'll map each post to an object that includes { ...post, author: {...} }
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
        authorData = { login: p.author_username, full_name: p.author_username }
      }

      augmentedPosts.push({
        id: p.id,
        content: p.content,
        created_at: p.created_at,
        likes: p.likes_count,      // rename for the frontend's structure
        comments: p.comments_count,
        reposts: p.reposts_count,
        isLiked: false,           // to keep it simple for now
        isReposted: false,
        isBookmarked: false,
        author: authorData
          ? {
              id: authorData.id,
              login: authorData.login,
              full_name: authorData.full_name || authorData.login,
              avatar_url: authorData.avatar_url,
              email: authorData.email || "",
            }
          : {
              id: 0,
              login: p.author_username,
              full_name: p.author_username,
              avatar_url: "",
              email: "",
            },
      })
    }

    // 3) Return the array
    return res.json(augmentedPosts)
  } catch (error) {
    console.error("Error fetching posts:", error)
    return res.status(500).json({ message: "Internal server error" })
  }
})

// Wether or not the active user is starring the repo
app.get("/api/hasStar/:owner/:repo", async (req, res) => {
  const { owner, repo } = req.params
  const token = req.headers.authorization?.split(" ")[1]; // Get token from header
  if (! token) {
    return res.status(401).json({ message: "Unrecognised request." })
  }

  try {
    const checkStarUrl = `${GITEA_URL}/api/v1/user/starred/${owner}/${repo}`
    const starredRes = await fetch(checkStarUrl, {
      method: "GET",
      headers: {
        Authorization: `token ${token}`,
      },
    });

    const isStarred = await starredRes.status === 204;
    return res.json({starred: isStarred})
  } catch (err) {
    console.error("Error modifying files:", err)
    return res.status(500).json({ message: "Internal server error" })
  }
})

// Toggle starred state of repo
app.post("/api/toggleStar/:owner/:repo", async (req, res) => {
  const { owner, repo } = req.params
  const token = req.headers.authorization?.split(" ")[1]; // Get token from header
  if (! token) {
    return res.status(401).json({ message: "Unrecognised request." })
  }

  try {
    const checkStarUrl = `${GITEA_URL}/api/v1/user/starred/${owner}/${repo}`
    const starredRes = await fetch(checkStarUrl, {
      method: "GET",
      headers: {
        Authorization: `token ${token}`,
      },
    });

    const isStarred = await starredRes.status === 204;
    
    const toggleRes = await fetch(checkStarUrl, {
      method: isStarred ? "DELETE" : "PUT",
      headers: {
        Authorization: `token ${token}`,
      },
    });
    
    return res.status(toggleRes.status).json({ message: "Toggled star." })
  } catch (err) {
    console.error("Error modifying files:", err)
    return res.status(500).json({ message: "Internal server error" })
  }
})


app.listen(4000, () => console.log("Backend running at port 4000"))


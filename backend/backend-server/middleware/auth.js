const fetch = (...args) => import("node-fetch").then(({ default: fetch }) => fetch(...args))

const GITEA_URL = process.env.GITEA_URL

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

module.exports = auth

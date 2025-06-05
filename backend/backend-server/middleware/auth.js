const fetch = (...args) => import("node-fetch").then(({ default: fetch }) => fetch(...args))

const GITEA_URL = process.env.GITEA_URL

// Middleware to restore session from gitea_token cookie if session is missing
const restoreSessionFromCookie = async (req, res, next) => {
  // If session already has user data, continue
  if (req.session?.user_data?.token) {
    return next()
  }

  // Try to get token from gitea_token cookie
  const token = req.cookies?.gitea_token

  if (token) {
    try {
      // Fetch user profile to validate token and get user data
      const response = await fetch(`${GITEA_URL}/api/v1/user`, {
        headers: { Authorization: `token ${token}` },
      })

      if (response.ok) {
        const userData = await response.json()

        // Restore session data
        req.session.user_data = {
          user: userData,
          token: token,
        }

        console.log(`Session restored for user: ${userData.login}`)
      }
    } catch (error) {
      console.error("Error restoring session from cookie:", error)
      // Clear invalid cookie
      res.clearCookie("gitea_token", {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'lax' : 'lax',
        domain: process.env.NODE_ENV === 'production' ? 'rastion.com' : undefined
      })
    }
  }

  next()
}

// Authentication middleware
const auth = (req, res, next) => {
  // Try to get token from session first (HTTP-only cookie), then fallback to Authorization header
  let token = req.session?.user_data?.token

  // Fallback to Authorization header for backward compatibility during transition
  if (!token) {
    token = req.headers.authorization?.split(" ")[1]
  }

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

module.exports = { auth, restoreSessionFromCookie }

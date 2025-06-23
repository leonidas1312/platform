const fetch = (...args) => import("node-fetch").then(({ default: fetch }) => fetch(...args))

const GITEA_URL = process.env.GITEA_URL
let ADMIN_TOKEN = process.env.GITEA_ADMIN_TOKEN_ILEO

class GiteaService {
  static setAdminToken(token) {
    ADMIN_TOKEN = token
  }

  static getAdminToken() {
    return ADMIN_TOKEN
  }

  static async createUser(userData) {
    const response = await fetch(`${GITEA_URL}/api/v1/admin/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `token ${ADMIN_TOKEN}`,
      },
      body: JSON.stringify(userData),
    })
    return response
  }

  static async activateUser(username, userData) {
    const response = await fetch(`${GITEA_URL}/api/v1/admin/users/${username}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `token ${ADMIN_TOKEN}`,
      },
      body: JSON.stringify(userData),
    })
    return response
  }

  static async createUserToken(username, tokenData, authHeader) {
    const response = await fetch(`${GITEA_URL}/api/v1/users/${username}/tokens`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
      body: JSON.stringify(tokenData),
    })
    return response
  }

  // Create user token as admin using sudo feature
  static async createUserTokenAsAdmin(username, tokenData) {
    const response = await fetch(`${GITEA_URL}/api/v1/users/${username}/tokens`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `token ${ADMIN_TOKEN}`,
        Sudo: username,
      },
      body: JSON.stringify(tokenData),
    })
    return response
  }

  static async deleteUserToken(username, tokenId) {
    const response = await fetch(`${GITEA_URL}/api/v1/users/${username}/tokens/${tokenId}`, {
      method: "DELETE",
      headers: {
        Authorization: `token ${ADMIN_TOKEN}`,
      },
    })
    return response
  }

  static async getUserTokens(username) {
    const response = await fetch(`${GITEA_URL}/api/v1/users/${username}/tokens`, {
      headers: {
        Authorization: `token ${ADMIN_TOKEN}`,
      },
    })
    return response
  }

  static async getUserProfile(token) {
    const response = await fetch(`${GITEA_URL}/api/v1/user`, {
      headers: { Authorization: `token ${token}` },
    })
    return response
  }

  // Alias for getUserProfile for consistency
  static async getCurrentUser(token) {
    return this.getUserProfile(token)
  }

  static async getUserByUsername(username, token = null) {
    const headers = token ? { Authorization: `token ${token}` } : {}
    const response = await fetch(`${GITEA_URL}/api/v1/users/${username}`, {
      headers,
    })
    return response
  }

  static async getUserRepos(username, token) {
    const response = await fetch(`${GITEA_URL}/api/v1/users/${username}/repos`, {
      headers: { Authorization: `token ${token}` },
    })
    return response
  }

  // Alias for getUserRepos for consistency
  static async getUserRepositories(token, username) {
    return this.getUserRepos(username, token)
  }

  static async getFileContent(token, owner, repo, path, ref = "main") {
    const headers = token ? { Authorization: `token ${token}` } : {}
    const encodedPath = encodeURIComponent(path)
    const response = await fetch(
      `${GITEA_URL}/api/v1/repos/${owner}/${repo}/contents/${encodedPath}?ref=${ref}`,
      { headers }
    )
    return response
  }

  static async searchRepositories(query, limit = 20) {
    const params = new URLSearchParams({
      q: query,
      limit: limit.toString(),
      is_private: "false"
    })
    const response = await fetch(`${GITEA_URL}/api/v1/repos/search?${params}`)
    return response
  }

  static async getRepository(owner, repo, token = null) {
    const headers = token ? { Authorization: `token ${token}` } : {}
    const response = await fetch(`${GITEA_URL}/api/v1/repos/${owner}/${repo}`, {
      headers,
    })
    return response
  }

  static async updateUserSettings(token, settings) {
    const response = await fetch(`${GITEA_URL}/api/v1/user/settings`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `token ${token}`,
      },
      body: JSON.stringify(settings),
    })
    return response
  }

  static async updateUserAvatar(token, imageData) {
    const response = await fetch(`${GITEA_URL}/api/v1/user/avatar`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `token ${token}`,
      },
      body: JSON.stringify({ image: imageData }),
    })
    return response
  }

  static async followUser(token, username) {
    const response = await fetch(`${GITEA_URL}/api/v1/user/following/${username}`, {
      method: "PUT",
      headers: {
        Authorization: `token ${token}`,
      },
    })
    return response
  }

  static async unfollowUser(token, username) {
    const response = await fetch(`${GITEA_URL}/api/v1/user/following/${username}`, {
      method: "DELETE",
      headers: {
        Authorization: `token ${token}`,
      },
    })
    return response
  }

  static async checkFollowStatus(token, username) {
    const response = await fetch(`${GITEA_URL}/api/v1/user/following/${username}`, {
      method: "GET",
      headers: {
        Authorization: `token ${token}`,
      },
    })
    return response
  }

  static async getUserFollowers(username, token = null) {
    const headers = token ? { Authorization: `token ${token}` } : {}
    const response = await fetch(`${GITEA_URL}/api/v1/users/${username}/followers`, {
      headers,
    })
    return response
  }

  static async getUserFollowing(username, token = null) {
    const headers = token ? { Authorization: `token ${token}` } : {}
    const response = await fetch(`${GITEA_URL}/api/v1/users/${username}/following`, {
      headers,
    })
    return response
  }

  static async changePassword(username, oldPassword, newPassword) {
    // First verify old password
    const basicAuth = `Basic ${Buffer.from(`${username}:${oldPassword}`).toString("base64")}`

    const verifyRes = await fetch(`${GITEA_URL}/api/v1/users/${username}/tokens`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: basicAuth,
      },
      body: JSON.stringify({
        name: `verify-password-${Date.now()}`,
        scopes: ["all"],
      }),
    })

    if (!verifyRes.ok) {
      throw new Error("Current password is incorrect")
    }

    const verifyData = await verifyRes.json()
    const tempToken = verifyData["sha1"]

    // Change password using admin API
    const changeRes = await fetch(`${GITEA_URL}/api/v1/admin/users/${username}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `token ${ADMIN_TOKEN}`,
      },
      body: JSON.stringify({
        password: newPassword,
        login_name: username,
      }),
    })

    // Clean up temporary token
    if (tempToken) {
      await fetch(`${GITEA_URL}/api/v1/users/${username}/tokens/${verifyData.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `token ${ADMIN_TOKEN}`,
        },
      })
    }

    return changeRes
  }
}

module.exports = GiteaService

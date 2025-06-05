/**
 * Utility functions for downloading files and repositories
 */

const API = import.meta.env.VITE_API_BASE

/**
 * Downloads a file from a repository
 * @param owner - Repository owner
 * @param repoName - Repository name
 * @param filePath - Path to the file in the repository
 * @param branch - Branch name (optional, defaults to main)
 * @param token - Authentication token
 */
export const downloadRepoFile = async (
  owner: string,
  repoName: string,
  filePath: string,
  branch: string = 'main',
  token?: string
) => {
  try {
    const headers: HeadersInit = {}
    if (token) {
      headers.Authorization = `token ${token}`
    }

    const response = await fetch(
      `${API}/api/repos/${owner}/${repoName}/contents/${filePath}?ref=${branch}`,
      { headers }
    )

    if (!response.ok) {
      throw new Error('Failed to fetch file')
    }

    const fileData = await response.json()

    // Decode base64 content
    const content = atob(fileData.content)

    // Create blob and download
    const blob = new Blob([content], { type: 'application/octet-stream' })
    const url = URL.createObjectURL(blob)

    const a = document.createElement('a')
    a.href = url
    a.download = filePath.split('/').pop() || 'file'
    document.body.appendChild(a)
    a.click()

    // Clean up
    URL.revokeObjectURL(url)
    document.body.removeChild(a)

    return true
  } catch (error) {
    console.error('Error downloading file:', error)
    return false
  }
}

/**
 * Downloads all .ipynb files from a repository
 * @param owner - Repository owner
 * @param repoName - Repository name
 * @param branch - Branch name (optional, defaults to main)
 * @param token - Authentication token
 */
export const downloadAllNotebooks = async (
  owner: string,
  repoName: string,
  branch: string = 'main',
  token?: string
) => {
  try {
    const headers: HeadersInit = {}
    if (token) {
      headers.Authorization = `token ${token}`
    }

    // Get repository contents recursively
    const notebooks = await findNotebooksInRepo(owner, repoName, '', branch, token)

    if (notebooks.length === 0) {
      throw new Error('No Jupyter notebooks found in this repository')
    }

    // Download each notebook
    const downloadPromises = notebooks.map(notebook =>
      downloadRepoFile(owner, repoName, notebook.path, branch, token)
    )

    const results = await Promise.allSettled(downloadPromises)
    const successful = results.filter(result => result.status === 'fulfilled').length

    return {
      total: notebooks.length,
      successful,
      failed: notebooks.length - successful
    }
  } catch (error) {
    console.error('Error downloading notebooks:', error)
    throw error
  }
}

/**
 * Recursively finds all .ipynb files in a repository
 * @param owner - Repository owner
 * @param repoName - Repository name
 * @param path - Current path (for recursion)
 * @param branch - Branch name
 * @param token - Authentication token
 */
const findNotebooksInRepo = async (
  owner: string,
  repoName: string,
  path: string = '',
  branch: string = 'main',
  token?: string
): Promise<Array<{ name: string; path: string }>> => {
  try {
    const headers: HeadersInit = {}
    if (token) {
      headers.Authorization = `token ${token}`
    }

    const url = path
      ? `${API}/api/repos/${owner}/${repoName}/contents/${path}?ref=${branch}`
      : `${API}/api/repos/${owner}/${repoName}/contents?ref=${branch}`

    const response = await fetch(url, { headers })

    if (!response.ok) {
      return []
    }

    const contents = await response.json()
    const notebooks: Array<{ name: string; path: string }> = []

    for (const item of contents) {
      if (item.type === 'file' && item.name.endsWith('.ipynb')) {
        notebooks.push({
          name: item.name,
          path: item.path
        })
      } else if (item.type === 'dir') {
        // Recursively search subdirectories
        const subNotebooks = await findNotebooksInRepo(
          owner,
          repoName,
          item.path,
          branch,
          token
        )
        notebooks.push(...subNotebooks)
      }
    }

    return notebooks
  } catch (error) {
    console.error('Error finding notebooks:', error)
    return []
  }
}

/**
 * Downloads a repository as a ZIP file
 * @param owner - Repository owner
 * @param repoName - Repository name
 * @param branch - Branch name (optional, defaults to main)
 * @param token - Authentication token
 */
export const downloadRepoAsZip = async (
  owner: string,
  repoName: string,
  branch: string = 'main',
  token?: string
) => {
  try {
    const headers: HeadersInit = {}
    if (token) {
      headers.Authorization = `token ${token}`
    }

    // Use Gitea's archive endpoint
    const response = await fetch(
      `${API}/api/repos/${owner}/${repoName}/archive/${branch}.zip`,
      { headers }
    )

    if (!response.ok) {
      throw new Error('Failed to download repository')
    }

    const blob = await response.blob()
    const url = URL.createObjectURL(blob)

    const a = document.createElement('a')
    a.href = url
    a.download = `${repoName}-${branch}.zip`
    document.body.appendChild(a)
    a.click()

    // Clean up
    URL.revokeObjectURL(url)
    document.body.removeChild(a)

    return true
  } catch (error) {
    console.error('Error downloading repository:', error)
    return false
  }
}

/**
 * Gets the count of .ipynb files in a repository
 * @param owner - Repository owner
 * @param repoName - Repository name
 * @param branch - Branch name (optional, defaults to main)
 * @param token - Authentication token
 */
export const getNotebookCount = async (
  owner: string,
  repoName: string,
  branch: string = 'main',
  token?: string
): Promise<number> => {
  try {
    const notebooks = await findNotebooksInRepo(owner, repoName, '', branch, token)
    return notebooks.length
  } catch (error) {
    console.error('Error counting notebooks:', error)
    return 0
  }
}

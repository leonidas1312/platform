/**
 * Utility functions for Google Colab integration
 */

/**
 * Opens a Jupyter notebook in Google Colab
 * @param notebookContent - The JSON content of the notebook
 * @param filename - The filename for the notebook
 */
export const openInColab = async (notebookContent: string, filename: string) => {
  try {
    // Create a blob with the notebook content
    const blob = new Blob([notebookContent], { type: 'application/json' })
    const url = URL.createObjectURL(blob)

    // Create a temporary download link
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()

    // Clean up
    URL.revokeObjectURL(url)
    document.body.removeChild(a)

    // Open Google Colab upload page
    // Since we can't directly pass content to Colab, we'll open the upload page
    // and the user can upload the downloaded file
    const colabUrl = 'https://colab.research.google.com/#create=true'
    window.open(colabUrl, '_blank')

    return true
  } catch (error) {
    console.error('Error opening notebook in Colab:', error)
    return false
  }
}

/**
 * Opens a repository in Google Colab by creating a GitHub URL
 * @param owner - Repository owner
 * @param repoName - Repository name
 * @param branch - Branch name (optional, defaults to main)
 */
export const openRepoInColab = (owner: string, repoName: string, branch: string = 'main') => {
  try {
    // Create GitHub URL for the repository
    const githubUrl = `https://github.com/${owner}/${repoName}/tree/${branch}`

    // Create Colab URL that opens the GitHub repository
    const colabUrl = `https://colab.research.google.com/github/${owner}/${repoName}/`

    // Open in new tab
    window.open(colabUrl, '_blank')

    return true
  } catch (error) {
    console.error('Error opening repository in Colab:', error)
    return false
  }
}

/**
 * Downloads a notebook and provides instructions for opening in Colab
 * @param notebookContent - The JSON content of the notebook
 * @param filename - The filename for the notebook
 */
export const downloadForColab = (notebookContent: string, filename: string) => {
  try {
    // Create a blob with the notebook content
    const blob = new Blob([notebookContent], { type: 'application/json' })
    const url = URL.createObjectURL(blob)

    // Create a temporary download link
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()

    // Clean up
    URL.revokeObjectURL(url)
    document.body.removeChild(a)

    return true
  } catch (error) {
    console.error('Error downloading notebook:', error)
    return false
  }
}

/**
 * Creates a Google Colab URL for opening a notebook
 * This approach uses GitHub gist as an intermediary
 * @param notebookContent - The JSON content of the notebook
 * @param filename - The filename for the notebook
 */
export const createColabGistUrl = async (notebookContent: string, filename: string) => {
  try {
    // For now, we'll use the direct approach of downloading and opening Colab
    // In the future, this could be enhanced to create a temporary gist
    const colabUrl = 'https://colab.research.google.com/'
    return colabUrl
  } catch (error) {
    console.error('Error creating Colab gist URL:', error)
    return null
  }
}

/**
 * Handles the complete flow of opening a notebook in Google Colab
 * Downloads the notebook and opens Colab for the user to upload it
 * @param notebookContent - The JSON content of the notebook
 * @param filename - The filename for the notebook
 */
export const handleColabOpen = async (notebookContent: string, filename: string) => {
  try {
    // First, download the notebook
    const downloadSuccess = downloadForColab(notebookContent, filename)

    if (downloadSuccess) {
      // Then open Google Colab
      setTimeout(() => {
        const colabUrl = 'https://colab.research.google.com/'
        window.open(colabUrl, '_blank')
      }, 500) // Small delay to ensure download starts first

      return true
    }

    return false
  } catch (error) {
    console.error('Error handling Colab open:', error)
    return false
  }
}

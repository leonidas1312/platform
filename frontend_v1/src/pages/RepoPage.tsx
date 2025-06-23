"use client"

import type React from "react"

import { useEffect, useState, useRef } from "react"
import { useParams, useNavigate, useLocation } from "react-router-dom"
import Layout from "@/components/Layout"
import { useToast } from "@/components/ui/use-toast"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Loader2 } from "lucide-react"

// Import components
import RepoHeader from "@/components/repo/RepoHeader"
import SetupDialog from "@/components/repo/SetupDialog"
import DeleteRepoDialog from "@/components/repo/DeleteRepoDialog"
import QubotEditDialog from "@/components/repo/QubotEditDialog"

import RepositoryFileExplorer from "@/components/repo/RepositoryFileExplorer"
import GitHubStyleFileExplorer from "@/components/repo/GitHubStyleFileExplorer"
import OptimizationToolConfigCard from "@/components/repo/OptimizationToolConfigCard"
import NotebookViewer from "@/components/repo/NotebookViewer"

import OptimizationToolCardDisplay from "@/components/OptimizationToolCardDisplay"
import CodeViewer from "@/components/CodeViewerRepoPage"
import FileUploadDialog from "@/components/FileUploadDialog"
import FileSearchDialog from "@/components/FileSearchDialog"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText } from "lucide-react"

const API = import.meta.env.VITE_API_BASE

// Authentication is now handled via HTTP-only cookies

interface GiteaRepo {
  id: number
  name: string
  full_name: string
  html_url: string
  owner: { login: string }
  private: boolean
  description?: string
  stars_count: number
  forks_count: number
  watchers_count?: number
  updated_at: string
  default_branch?: string
}

interface RepoResponse {
  repo: GiteaRepo
  readme: string // markdown content
  config: any // parsed config.json (or null)
  files: any[] // file listing in the repo root
}

export default function RepoPage() {
  const { owner, repoName, "*": splat } = useParams<{ owner: string; repoName: string; "*": string }>()
  const location = useLocation()
  const navigate = useNavigate()
  const { toast } = useToast()

  // Add a ref to track if we're currently processing a URL change
  const processingUrlChange = useRef(false)

  const [repo, setRepo] = useState<GiteaRepo | null>(null)
  const [readme, setReadme] = useState("")
  const [config, setConfig] = useState<any>(null)
  const [files, setFiles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [activeTab, setActiveTab] = useState("overview")

  const [qubotSubTab, setQubotSubTab] = useState("readme")

  // Parse the current path from the URL
  const [currentPath, setCurrentPath] = useState("")
  const [currentBranch, setCurrentBranch] = useState("")
  const [selectedFile, setSelectedFile] = useState<string | null>(null)

  // Code editor state
  const [selectedFileSha, setSelectedFileSha] = useState<string | null>(null)
  const [fileContent, setFileContent] = useState<string>("")
  const [editorLoading, setEditorLoading] = useState(false)
  const [forceRawView, setForceRawView] = useState(false) // Force raw file view instead of formatted card

  // Qubot Card state
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [qubotCardContent, setQubotCardContent] = useState<string>("")

  // File upload dialog state
  const [showFileUploadDialog, setShowFileUploadDialog] = useState(false)
  const [branches, setBranches] = useState<string[]>([])

  // File search dialog state
  const [showFileSearchDialog, setShowFileSearchDialog] = useState(false)
  const [allRepoFiles, setAllRepoFiles] = useState<any[]>([])

  // Caching for performance
  const [branchCache, setBranchCache] = useState<Map<string, string[]>>(new Map())
  const [fileContentCache, setFileContentCache] = useState<Map<string, string>>(new Map())
  const [commitCache, setCommitCache] = useState<Map<string, any>>(new Map())

  const [hasRepoStarred, setHasRepoStarred] = useState(false)

  // New state variables for connections
  const [connections, setConnections] = useState<
    Array<{
      id?: number
      repoPath: string
      description: string
      codeSnippet: string
    }>
  >([])
  const [showConnectionDialog, setShowConnectionDialog] = useState(false)
  const [editingConnectionIndex, setEditingConnectionIndex] = useState<number | null>(null)
  const [connectionForm, setConnectionForm] = useState({
    repoPath: "",
    description: "",
    codeSnippet: "",
  })

  // Add a new state variable for the delete repository dialog
  const [showDeleteRepoDialog, setShowDeleteRepoDialog] = useState(false)
  const [deleteRepoConfirmation, setDeleteRepoConfirmation] = useState("")
  const [isDeletingRepo, setIsDeletingRepo] = useState(false)

  // First-time setup state
  const [isNewRepo, setIsNewRepo] = useState(false)
  const [showSetupDialog, setShowSetupDialog] = useState(false)

  // Qubot setup state
  const [entrypointFile, setEntrypointFile] = useState<string | null>(null)
  const [qubotParameters, setQubotParameters] = useState<Array<{ name: string; value: string }>>([])
  const [setupComplete, setSetupComplete] = useState(false)
  const [currentSetupStep, setCurrentSetupStep] = useState(1)
  const [newParameterName, setNewParameterName] = useState("")
  const [newParameterValue, setNewParameterValue] = useState("")

  // Enhance the qubot setup state with new fields
  const [qubotType, setQubotType] = useState<"problem" | "optimizer">("problem")
  const [entrypointClass, setEntrypointClass] = useState<string>("")
  const [arxivLinks, setArxivLinks] = useState<string[]>([])
  const [newArxivLink, setNewArxivLink] = useState<string>("")
  const [qubotKeywords, setQubotKeywords] = useState<string[]>(["qubot"])
  const [newKeyword, setNewKeyword] = useState<string>("")

  // File upload for step 2
  const [pythonFileToUpload, setPythonFileToUpload] = useState<File | null>(null)

  // Welcome dialog state
  const [showWelcomeDialog, setShowWelcomeDialog] = useState(false)

  // Edit dialog state
  const [showEditDialog, setShowEditDialog] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Parse the URL to determine current path, branch, and file
  useEffect(() => {
    if (processingUrlChange.current) return
    processingUrlChange.current = true

    console.log("Processing URL change, splat:", splat)

    if (splat) {
      const parts = splat.split("/")
      if (parts.length >= 3 && parts[0] === "src" && parts[1] === "branch") {
        const branch = parts[2]
        setCurrentBranch(branch)

        if (parts.length > 3) {
          const filePath = parts.slice(3).join("/")
          console.log("Detected file path:", filePath)

          if (filePath.includes(".")) {
            // This is a file
            console.log("Setting selected file:", filePath)
            setSelectedFile(filePath)
            setCurrentPath(filePath.split("/").slice(0, -1).join("/"))

            // Load the file content when a file is selected from the URL
            if (owner && repoName && branch) {
              console.log("Loading file content for:", filePath)
              loadFileContent(filePath)
            }
          } else {
            // This is a directory
            console.log("Setting directory path:", filePath)
            setSelectedFile(null)
            setCurrentPath(filePath)
          }
        } else {
          // Root directory
          console.log("Setting to root directory")
          setSelectedFile(null)
          setCurrentPath("")
        }
      }
    } else {
      // Default to main branch and root directory if no path specified
      console.log("No path specified, defaulting to root")
      setCurrentBranch("")
      setCurrentPath("")
      setSelectedFile(null)
    }

    // Force the Files tab to be active when viewing a file or directory
    if (splat && splat.startsWith("src/branch/")) {
      console.log("Setting active tab to files")
      if (activeTab !== "files") {
        setActiveTab("files")
      }
    } else {
      // Default to overview tab for repository root
      if (activeTab !== "overview") {
        setActiveTab("overview")
      }
    }

    processingUrlChange.current = false
  }, [splat, owner, repoName, location.pathname])

  // Add some sample commit data to files for demo purposes
  const enhanceFilesWithCommitData = (files: any[]) => {
    return files.map((file) => ({
      ...file,
      commit: {
        date: new Date(Date.now() - Math.random() * 10000000000).toISOString(),
      },
    }))
  }

  // Load repository data
  useEffect(() => {
    if (!owner || !repoName) {
      setError("No owner or repository name provided.")
      setLoading(false)
      return
    }

    // Set active tab based on URL only if not already processing a URL change
    if (!processingUrlChange.current && location.pathname.includes("/src/branch/")) {
      setActiveTab("files")
    }

    fetch(`${API}/api/repos/${owner}/${repoName}`, {
      credentials: 'include', // Include cookies for authentication
    })
      .then((res) => {
        if (!res.ok) {
          return res.json().then((data) => {
            throw new Error(data.message || "Failed to fetch repo details")
          })
        }
        return res.json()
      })
      .then((data: RepoResponse) => {
        setRepo(data.repo)
        setReadme(data.readme)
        setConfig(data.config)

        // Check URL for new=true parameter to force new repo state
        if (location.search.includes("new=true")) {
          setIsNewRepo(true)
          console.log("New repository detected from URL parameter")

          // Remove the query parameter by replacing the current URL
          const newUrl = location.pathname
          window.history.replaceState({}, document.title, newUrl)
        }

        // Check if this is a new repository (no config.json)
        // We're only checking for config.json now since that's the definitive marker of qubot setup
        if (!data.config) {
          setIsNewRepo(true)
          console.log("New repository detected - showing welcome screen")
        }

        // Set default branch if not already set
        const branch = currentBranch || data.repo.default_branch || "main"
        setCurrentBranch(branch)

        // Set files immediately without commit data for faster initial load
        setFiles(data.files)
        setLoading(false)

        // Start parallel operations for better performance
        const parallelOperations = [
          // Load branches in parallel
          loadBranches(data.repo.owner.login, data.repo.name),
          // Load all files for search functionality in parallel
          loadAllFiles(data.repo.owner.login, data.repo.name, data.repo.default_branch || "main")
        ]

        // If a file is selected, load its content
        if (selectedFile) {
          parallelOperations.push(loadFileContent(selectedFile))
        }

        // Execute parallel operations
        Promise.allSettled(parallelOperations).then(() => {
          console.log("Parallel operations completed")
        })

        // Fetch commit information in the background (deferred for performance)
        setTimeout(() => {
          fetchFileCommits(data.files, branch).then((filesWithCommits) => {
            setFiles(filesWithCommits)
            console.log("Commit data loaded and applied to files")
          }).catch(error => {
            console.error("Failed to fetch commit data:", error)
            // Keep the files without commit data if commit fetching fails
          })
        }, 500) // Increased delay to let the UI render and be interactive first
      })
      .catch((err) => {
        setError(err.message || "Unknown error")
        setLoading(false)
      })
  }, [owner, repoName, location.search])

  // Load branches with caching
  const loadBranches = async (repoOwner: string, repoName: string) => {
    const cacheKey = `${repoOwner}/${repoName}`

    // Check cache first
    if (branchCache.has(cacheKey)) {
      setBranches(branchCache.get(cacheKey)!)
      return
    }

    try {
      const response = await fetch(`${API}/repos/${repoOwner}/${repoName}/branches`)
      if (response.ok) {
        const branchesData = await response.json()
        const branchNames = branchesData.map((branch: any) => branch.name)
        setBranches(branchNames)

        // Cache the result
        setBranchCache(prev => new Map(prev.set(cacheKey, branchNames)))
      }
    } catch (error) {
      console.error("Failed to load branches:", error)
    }
  }

  // Add this useEffect hook after the other useEffect hooks to handle hash navigation
  useEffect(() => {
    // Check if there's a hash in the URL
    if (location.hash) {
      // Remove the # character
      const id = location.hash.substring(1)

      // Wait for content to be loaded and rendered
      setTimeout(() => {
        const element = document.getElementById(id)
        if (element) {
          // Scroll to the element
          element.scrollIntoView({ behavior: "smooth" })
        }
      }, 500) // Small delay to ensure content is rendered
    }
  }, [location.hash, readme, selectedFile, fileContent])

  const reloadRepoData = async () => {
    if (!owner || !repoName) return
    const res = await fetch(`${API}/api/repos/${owner}/${repoName}`)
    const data = await res.json()
    setRepo(data.repo)
    setReadme(data.readme)
    setConfig(data.config)
    const filesWithCommits = await fetchFileCommits(data.files, data.repo.default_branch || "main")
    setFiles(filesWithCommits)

    // If config exists now, we're no longer in new repo state
    if (data.config) {
      setIsNewRepo(false)
      setSetupComplete(true)
    }

    // Check if user has starred the repo
    try {
      const resStar = await fetch(`${API}/api/hasStar/${owner}/${repoName}`, {
        credentials: 'include', // Include cookies for authentication
      })
      const starJson = await resStar.json()
      console.log("starjson:", starJson)
      setHasRepoStarred(starJson.starred)
    } catch (error) {
      console.error("Error checking star status:", error)
    }
  }

  // Load file content with caching
  const loadFileContent = async (filePath: string) => {
    if (!owner || !repoName) return

    const branch = currentBranch || repo?.default_branch || "main"
    if (!branch) return

    const cacheKey = `${owner}/${repoName}/${branch}/${filePath}`

    // Check cache first
    if (fileContentCache.has(cacheKey)) {
      const cachedContent = fileContentCache.get(cacheKey)!
      setFileContent(cachedContent)
      setSelectedFileSha("cached")
      return
    }

    console.log(`Loading file content: ${filePath} from branch: ${branch}`)
    setEditorLoading(true)
    try {
      const fileRes = await fetch(`${API}/api/repos/${owner}/${repoName}/contents/${filePath}?ref=${branch}`, {
        credentials: 'include',
        signal: AbortSignal.timeout(10000), // 10 second timeout
      })

      if (fileRes.ok) {
        const fileJson = await fileRes.json()
        if (fileJson.content) {
          const decoded = atob(fileJson.content)
          console.log("File content loaded successfully, length:", decoded.length)
          setFileContent(decoded)
          setSelectedFileSha(fileJson.sha)

          // Cache the content (limit cache size to prevent memory issues)
          if (fileContentCache.size > 50) {
            const firstKey = fileContentCache.keys().next().value
            fileContentCache.delete(firstKey)
          }
          setFileContentCache(prev => new Map(prev.set(cacheKey, decoded)))
        } else {
          console.log("File content is empty")
          setFileContent("")
          setSelectedFileSha(null)
        }
      } else {
        console.log(`Error loading file: ${filePath}, status: ${fileRes.status}`)
        // For demo purposes, generate some content based on file type
        let fallbackContent = ""
        if (filePath.endsWith(".md")) {
          fallbackContent = `# ${filePath.split("/").pop()?.replace(".md", "")}\n\nThis is a sample markdown file.`
        } else if (filePath.endsWith(".json")) {
          fallbackContent = JSON.stringify({ sample: "data" }, null, 2)
        } else if (filePath.endsWith(".py")) {
          fallbackContent = 'def hello_world():\n    print("Hello, World!")\n\nif __name__ == "__main__":\n    hello_world()'
        } else {
          fallbackContent = `Sample content for ${filePath}`
        }
        setFileContent(fallbackContent)
        setSelectedFileSha("sample-sha")
      }
    } catch (err) {
      console.error("Error fetching file content:", err)
      setFileContent("Error fetching file content.")
      setSelectedFileSha(null)
    } finally {
      setEditorLoading(false)
    }
  }

  // Qubot Card Handlers
  const toggleStar = async () => {
    console.log("test")
    if (!owner || !repoName) return
    try {
      const starRes = await fetch(`${API}/api/toggleStar/${owner}/${repoName}`, {
        method: "POST",
        credentials: 'include', // Include cookies for authentication
      })
      if (starRes.ok) {
        reloadRepoData()
      } else {
        console.log(`Error toggling star state: ${starRes.status}`)
      }
    } catch (err) {
      console.error("Error toggling star state:", err)
    } finally {
      setEditorLoading(false)
    }
  }

  const handleEditQubotCard = () => {
    setShowEditDialog(true)
  }

  const handleSaveQubotCard = async (formData: any) => {
    if (!owner || !repoName || !repo) return
    setLoading(true)
    try {
      // Save config.json
      const configResponse = await fetch(`${API}/repos/${owner}/${repoName}/contents/config.json`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: 'include', // Include cookies for authentication
        body: JSON.stringify({
          content: JSON.stringify(formData, null, 2),
          message: "Create/update config.json (Qubot card)",
          branch: currentBranch || repo.default_branch || "main",
        }),
      })

      if (!configResponse.ok) {
        const errData = await configResponse.json()
        throw new Error(errData.message || "Failed to create config.json")
      }

      await reloadRepoData()
      setShowCreateForm(false)
      setConfig(formData)

      // If this was a new repo, it's no longer new
      if (isNewRepo) {
        setIsNewRepo(false)
        setSetupComplete(true)
      }

      // Close the setup dialog if it was open
      setShowSetupDialog(false)
      setShowWelcomeDialog(false)
      setShowEditDialog(false)

      toast({
        title: "Success",
        description: "Qubot card updated successfully",
      })
    } catch (err: any) {
      console.error(err)
      setError(err.message || "Error creating Qubot card")
      toast({
        title: "Error",
        description: err.message || "Failed to update qubot card",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // File selection handler
  const handleFileClick = (file: any) => {
    const branch = currentBranch || repo?.default_branch || "main"

    if (file.type === "dir") {
      // Handle navigation to directory or back to root
      let newPath: string

      // Check if this is a navigation back to root (empty name and path)
      if (file.name === '' && file.path === '') {
        newPath = ''
        console.log("Navigating back to repository root")
      } else if (file.path) {
        // Use the provided path (from breadcrumb navigation)
        newPath = file.path
        console.log("Navigating to path:", newPath)
      } else {
        // Regular directory navigation
        newPath = currentPath ? `${currentPath}/${file.name}` : file.name
        console.log("Navigating to directory:", newPath)
      }

      // Set processing flag to prevent URL parsing conflicts
      processingUrlChange.current = true

      // Determine the API URL based on whether we're going to root or a specific path
      const apiUrl = newPath
        ? `${API}/api/repos/${owner}/${repoName}/contents/${newPath}?ref=${branch}`
        : `${API}/api/repos/${owner}/${repoName}/contents?ref=${branch}`

      setLoading(true)

      fetch(apiUrl, {
        credentials: 'include', // Include cookies for authentication
      })
        .then(async (res) => {
          if (!res.ok) {
            // Try to get error message from response
            let errorMessage = "Failed to fetch directory contents"
            try {
              const errorData = await res.json()
              errorMessage = errorData.message || errorMessage
            } catch (e) {
              // If response is not JSON, use status text
              errorMessage = `${res.status}: ${res.statusText}`
            }
            throw new Error(errorMessage)
          }
          return res.json()
        })
        .then(async (data) => {
          console.log("Directory contents loaded:", data.length, "files")
          // Fetch commit information for each file
          const filesWithCommits = await fetchFileCommits(data, branch)
          setFiles(filesWithCommits)
          setLoading(false)

          // Update the current path after successful load
          setCurrentPath(newPath)

          // Ensure we stay in files tab
          setActiveTab("files")

          // Navigate to the appropriate URL
          if (newPath) {
            navigate(`/${owner}/${repoName}/src/branch/${branch}/${newPath}`)
          } else {
            navigate(`/${owner}/${repoName}/src/branch/${branch}`)
          }

          // Reset processing flag after navigation
          setTimeout(() => {
            processingUrlChange.current = false
          }, 100)
        })
        .catch((err) => {
          console.error("Error loading directory:", err)
          setLoading(false)
          processingUrlChange.current = false
          toast({
            title: "Error",
            description: "Failed to load directory contents",
            variant: "destructive",
          })
        })
    } else {
      // Display file inline without URL navigation
      const filePath = currentPath ? `${currentPath}/${file.name}` : file.name
      console.log("Displaying file inline:", filePath)

      // Set the selected file to display it inline
      setSelectedFile(filePath)

      // Reset force raw view flag for normal file clicks
      setForceRawView(false)

      // Load the file content immediately
      loadFileContent(filePath)

      // Ensure we stay in the Files tab when viewing a file
      setActiveTab("files")

      // Do not navigate to a new URL - keep the current URL and display inline
    }
  }





  // Add this function to handle repository deletion
  const handleDeleteRepository = async () => {
    if (!owner || !repoName) return

    setIsDeletingRepo(true)
    try {
      const response = await fetch(`${API}/api/repos/${owner}/${repoName}`, {
        method: "DELETE",
        credentials: 'include', // Include cookies for authentication
      })

      if (!response.ok) {
        const errData = await response.json()
        throw new Error(errData.message || "Failed to delete repository")
      }

      toast({
        title: "Success",
        description: "Repository deleted successfully",
      })

      // Navigate to the user's profile page
      navigate(`/u/${owner}`)
    } catch (err: any) {
      console.error("Error deleting repository:", err)
      toast({
        title: "Error",
        description: err.message || "Failed to delete repository",
        variant: "destructive",
      })
    } finally {
      setIsDeletingRepo(false)
      setShowDeleteRepoDialog(false)
      setDeleteRepoConfirmation("")
    }
  }

  // Handle file selection for Python file upload in step 2
  const handlePythonFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0]
      if (file.name.endsWith(".py")) {
        setPythonFileToUpload(file)
        // Set the entrypoint file name
        setEntrypointFile(file.name)
      } else {
        toast({
          title: "Invalid file type",
          description: "Please select a Python (.py) file",
          variant: "destructive",
        })
      }
    }
  }

  // Handle Python file upload in step 2
  const handleUploadPythonFile = async () => {
    if (!pythonFileToUpload || !owner || !repoName) return

    try {
      const branch = currentBranch || repo?.default_branch || "main"

      // Read the file content
      const fileContent = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => {
          if (reader.result) {
            resolve(reader.result as string)
          } else {
            reject(new Error("Failed to read file"))
          }
        }
        reader.onerror = () => reject(reader.error)
        reader.readAsText(pythonFileToUpload)
      })

      // Upload the file
      const response = await fetch(`${API}/repos/${owner}/${repoName}/contents/${pythonFileToUpload.name}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: 'include', // Include cookies for authentication
        body: JSON.stringify({
          content: fileContent,
          message: `Add ${pythonFileToUpload.name}`,
          branch: branch,
        }),
      })

      if (!response.ok) {
        const errData = await response.json()
        throw new Error(errData.message || "Failed to upload file")
      }

      // Reload all files to include the new one
      await loadAllFiles(owner, repoName, branch)

      toast({
        title: "Success",
        description: "Python file uploaded successfully!",
      })

      return true
    } catch (err: any) {
      console.error("Error uploading Python file:", err)
      toast({
        title: "Error",
        description: err.message || "Failed to upload Python file",
        variant: "destructive",
      })
      return false
    }
  }

  // Let's update the handleCompleteSetup function to handle both uploaded and existing files
  const handleCompleteSetup = async () => {
    if (!entrypointFile || !owner || !repoName) return

    try {
      setLoading(true)

      // Create a config object with the proper structure
      const configData = {
        type: qubotType,
        entry_point: entrypointFile.replace(/\.[^/.]+$/, ""), // Remove file extension
        class_name: entrypointClass,
        default_params: {},
        link_to_arxiv: arxivLinks.length > 0 ? arxivLinks : undefined,
        keywords: qubotKeywords.length > 0 ? qubotKeywords : ["qubot"],
      }

      // Add parameters to the config
      qubotParameters.forEach((param) => {
        configData.default_params[param.name] = param.value
      })

      // Format the JSON with proper indentation
      const formattedJson = JSON.stringify(configData, null, 2)

      // Save the config to config.json
      const configResponse = await fetch(`${API}/repos/${owner}/${repoName}/contents/config.json`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: 'include', // Include cookies for authentication
        body: JSON.stringify({
          content: formattedJson,
          message: "Update config.json with qubot setup",
          branch: currentBranch || repo?.default_branch || "main",
        }),
      })

      if (!configResponse.ok) {
        const errData = await configResponse.json()
        throw new Error(errData.message || "Failed to save qubot configuration")
      }

      // Update the config state
      setConfig(configData)

      // Mark setup as complete
      setSetupComplete(true)

      // No longer a new repo
      setIsNewRepo(false)

      // Close the setup dialog
      setShowSetupDialog(false)

      // Close the welcome dialog if it's open
      setShowWelcomeDialog(false)

      toast({
        title: "Success",
        description: "Qubot setup completed successfully!",
      })

      // Reload repo data to reflect changes
      await reloadRepoData()

      return true
    } catch (err) {
      console.error("Error completing qubot setup:", err)
      toast({
        title: "Error",
        description: err.message || "Failed to complete qubot setup",
        variant: "destructive",
      })
      return false
    } finally {
      setLoading(false)
    }
  }

  // Handle path navigation
  const handlePathNavigation = (path: string) => {
    const branch = currentBranch || repo?.default_branch || "main"
    if (path === "") {
      // Navigate to root
      navigate(`/${owner}/${repoName}/src/branch/${branch}`)
    } else {
      // Navigate to specific path
      navigate(`/${owner}/${repoName}/src/branch/${branch}/${path}`)
    }
  }

  // Handle back button from code viewer
  const handleBackToFiles = () => {
    // Simply clear the selected file state to return to file explorer view
    setSelectedFile(null)

    // Reset force raw view flag
    setForceRawView(false)

    // No URL navigation needed - stay in the same view
  }

  // Handle branch change
  const handleBranchChange = (newBranch: string) => {
    if (selectedFile) {
      navigate(`/${owner}/${repoName}/src/branch/${newBranch}/${selectedFile}`)
    } else if (currentPath) {
      navigate(`/${owner}/${repoName}/src/branch/${newBranch}/${currentPath}`)
    } else {
      navigate(`/${owner}/${repoName}/src/branch/${newBranch}`)
    }
  }

  // Handle file upload
  const handleFileUpload = async (file: File, commitMessage: string, branch?: string) => {
    if (!owner || !repoName) return

    try {
      // Read the file using a Promise
      const fileText = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => {
          if (reader.result !== null) {
            resolve(reader.result as string)
          } else {
            reject(new Error("FileReader result is null"))
          }
        }
        reader.onerror = () => reject(reader.error)
        reader.readAsText(file)
      })

      // Determine the file path using currentPath (if any)
      const filePath = currentPath ? `${currentPath}/${file.name}` : file.name

      // Call your server's API to create/update the file using a PUT request
      const response = await fetch(`${API}/api/repo-files/${owner}/${repoName}/contents/${filePath}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: 'include', // Include cookies for authentication
        body: JSON.stringify({
          content: fileText,
          message: commitMessage || `Add ${file.name}`,
          branch: branch || currentBranch || repo?.default_branch || "main",
        }),
      })

      if (!response.ok) {
        const errData = await response.json()
        throw new Error(errData.message || "Failed to upload file")
      }

      // Reload the current directory to show the new file
      if (currentPath) {
        const dirResponse = await fetch(
          `${API}/api/repos/${owner}/${repoName}/contents/${currentPath}?ref=${branch || currentBranch || repo?.default_branch || "main"}`,
          { credentials: 'include' }, // Include cookies for authentication
        )
        if (dirResponse.ok) {
          const dirData = await dirResponse.json()
          const filesWithCommits = await fetchFileCommits(dirData, branch || currentBranch || repo?.default_branch || "main")
          setFiles(filesWithCommits)
        }
      } else {
        await reloadRepoData()
      }

      toast({
        title: "Success",
        description: "File uploaded successfully!",
      })

      // Close the file upload dialog
      setShowFileUploadDialog(false)
    } catch (error: any) {
      console.error("Error uploading file:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to upload file",
        variant: "destructive",
      })
      throw error
    }
  }

  // Handle folder upload
  const handleFolderUpload = async (files: FileList, commitMessage: string, branch?: string) => {
    if (!owner || !repoName) return

    try {
      const uploadBranch = branch || currentBranch || repo?.default_branch || "main"
      const filesToUpload: Array<{ path: string; content: string }> = []

      // Process all files in the folder
      for (let i = 0; i < files.length; i++) {
        const file = files[i]

        // Read file content
        const fileText = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => {
            if (reader.result !== null) {
              resolve(reader.result as string)
            } else {
              reject(new Error("FileReader result is null"))
            }
          }
          reader.onerror = () => reject(reader.error)
          reader.readAsText(file)
        })

        // Determine the file path using currentPath and webkitRelativePath
        const relativePath = file.webkitRelativePath
        const filePath = currentPath ? `${currentPath}/${relativePath}` : relativePath

        filesToUpload.push({
          path: filePath,
          content: fileText
        })
      }

      // Use bulk upload API endpoint
      const response = await fetch(`${API}/api/repo-files/${owner}/${repoName}/contents`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: 'include',
        body: JSON.stringify({
          files: filesToUpload.map(file => ({
            path: file.path,
            content: file.content
          })),
          message: commitMessage,
          branch: uploadBranch,
        }),
      })

      if (!response.ok) {
        const errData = await response.json()
        throw new Error(errData.message || "Failed to upload folder")
      }

      // Reload the current directory to show the new files
      if (currentPath) {
        const dirResponse = await fetch(
          `${API}/api/repos/${owner}/${repoName}/contents/${currentPath}?ref=${uploadBranch}`,
          { credentials: 'include' }
        )
        if (dirResponse.ok) {
          const dirData = await dirResponse.json()
          const filesWithCommits = await fetchFileCommits(dirData, uploadBranch)
          setFiles(filesWithCommits)
        }
      } else {
        await reloadRepoData()
      }

      toast({
        title: "Success",
        description: `Folder uploaded successfully! ${filesToUpload.length} files added.`,
      })

      // Close the file upload dialog
      setShowFileUploadDialog(false)
    } catch (error: any) {
      console.error("Error uploading folder:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to upload folder",
        variant: "destructive",
      })
      throw error
    }
  }

  // Function to display a specific file inline in the repository
  const handleGoToFile = (filePath: string) => {
    // Set the selected file for inline display
    setSelectedFile(filePath)

    // Load the file content
    loadFileContent(filePath)

    // Always set the active tab to files when viewing a file
    setActiveTab("files")

    // No URL navigation - display inline in current view
  }

  // Function to force raw file view (for "View File" button in config card)
  const handleViewRawFile = (filePath: string) => {
    // Set the selected file for inline display
    setSelectedFile(filePath)

    // Force raw view instead of formatted card
    setForceRawView(true)

    // Load the file content
    loadFileContent(filePath)

    // Always set the active tab to files when viewing a file
    setActiveTab("files")

    // No URL navigation - display inline in current view
  }

  // Function to navigate to parent directory
  const handleNavigateToParentDirectory = () => {
    if (!currentPath) return

    const pathParts = currentPath.split("/")
    pathParts.pop() // Remove the last part
    const parentPath = pathParts.join("/")

    const branch = currentBranch || repo?.default_branch || "main"

    // Update the current path
    setCurrentPath(parentPath)

    // Immediately load the parent directory contents
    const apiUrl = parentPath
      ? `${API}/api/repos/${owner}/${repoName}/contents/${parentPath}?ref=${branch}`
      : `${API}/api/repos/${owner}/${repoName}/contents?ref=${branch}`

    setLoading(true)

    fetch(apiUrl, {
      credentials: 'include', // Include cookies for authentication
    })
      .then(async (res) => {
        if (!res.ok) {
          // Try to get error message from response
          let errorMessage = "Failed to fetch directory contents"
          try {
            const errorData = await res.json()
            errorMessage = errorData.message || errorMessage
          } catch (e) {
            // If response is not JSON, use status text
            errorMessage = `${res.status}: ${res.statusText}`
          }
          throw new Error(errorMessage)
        }
        return res.json()
      })
      .then(async (data) => {
        console.log("Parent directory contents loaded:", data.length, "files")
        // Fetch commit information for each file
        const filesWithCommits = await fetchFileCommits(data, branch)
        setFiles(filesWithCommits)
        setLoading(false)

        // Navigate to the parent directory
        if (parentPath) {
          navigate(`/${owner}/${repoName}/src/branch/${branch}/${parentPath}`)
        } else {
          navigate(`/${owner}/${repoName}/src/branch/${branch}`)
        }
      })
      .catch((err) => {
        console.error("Error loading parent directory:", err)
        setLoading(false)
        toast({
          title: "Error",
          description: "Failed to load parent directory contents",
          variant: "destructive",
        })
      })
  }

  // Handle file search
  const handleFileSearch = (filePath: string) => {
    handleGoToFile(filePath)
  }

  // Fetch commit information for files in the current directory with optimizations
  const fetchFileCommits = async (files: any[], branch: string) => {
    if (!owner || !repoName || files.length === 0) return files

    console.log(`Fetching commits for ${files.length} files in branch ${branch}, currentPath: ${currentPath}`)

    try {
      const enhancedFiles = [...files]

      // For performance, only fetch commits for the first 10 files
      const filesToProcess = enhancedFiles.slice(0, 10)

      // Process files with a simple Promise.all but with individual error handling
      const commitPromises = filesToProcess.map(async (file, index) => {
        const filePath = currentPath ? `${currentPath}/${file.name}` : file.name
        const commitCacheKey = `${owner}/${repoName}/${branch}/${filePath}`

        console.log(`Fetching commit for file: ${filePath}`)

        // Check cache first
        if (commitCache.has(commitCacheKey)) {
          console.log(`Using cached commit for: ${filePath}`)
          return {
            index,
            commit: commitCache.get(commitCacheKey)!,
          }
        }

        try {
          const commitUrl = `${API}/api/repos/${owner}/${repoName}/commits?path=${encodeURIComponent(filePath)}&limit=1&ref=${branch}`
          console.log(`Fetching from URL: ${commitUrl}`)

          const commitResponse = await fetch(commitUrl, {
            credentials: 'include',
            signal: AbortSignal.timeout(5000), // Increased timeout
          })

          console.log(`Commit response for ${filePath}: ${commitResponse.status}`)

          if (commitResponse.ok) {
            const commits = await commitResponse.json()
            console.log(`Commits data for ${filePath}:`, commits)

            if (commits && commits.length > 0) {
              const commitData = {
                message: commits[0].commit.message,
                date: commits[0].commit.author.date,
                author: commits[0].author?.login || commits[0].commit.author.name,
                authorAvatar: commits[0].author?.avatar_url || null,
                sha: commits[0].sha,
              }

              console.log(`Successfully fetched commit for ${filePath}:`, commitData)

              // Cache the commit data (limit cache size)
              if (commitCache.size > 100) {
                const firstKey = commitCache.keys().next().value
                commitCache.delete(firstKey)
              }
              setCommitCache(prev => new Map(prev.set(commitCacheKey, commitData)))

              return {
                index,
                commit: commitData,
              }
            } else {
              console.log(`No commits found for ${filePath}`)
            }
          } else {
            console.log(`Failed to fetch commits for ${filePath}: ${commitResponse.status}`)
          }
        } catch (error) {
          console.warn(`Failed to fetch commit for ${filePath}:`, error)
        }

        // Return fallback data
        return {
          index,
          commit: {
            message: "No commit history",
            date: null,
            author: "Unknown",
            authorAvatar: null,
            sha: null,
          },
        }
      })

      // Wait for all commit requests to complete
      const results = await Promise.allSettled(commitPromises)

      // Apply commit data to files
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          enhancedFiles[result.value.index] = {
            ...enhancedFiles[result.value.index],
            commit: result.value.commit,
          }
        } else {
          // Fallback for rejected promises
          enhancedFiles[index] = {
            ...enhancedFiles[index],
            commit: {
              message: "Unable to fetch commit data",
              date: null,
              author: "Unknown",
              authorAvatar: null,
              sha: null,
            },
          }
        }
      })

      console.log(`Finished processing commits, returning ${enhancedFiles.length} files`)
      return enhancedFiles
    } catch (error) {
      console.error("Error fetching file commits:", error)
      return files
    }
  }

  // Function to load all files in the repository for the file search dialog (optimized)
  const loadAllFiles = async (repoOwner: string, repoName: string, defaultBranch: string) => {
    try {
      // Limit recursion depth for performance
      const MAX_DEPTH = 3

      // Instead of using a non-existent endpoint, we'll recursively fetch all files
      // starting from the root directory with depth limiting
      const fetchFilesRecursively = async (path = "", depth = 0): Promise<any[]> => {
        if (depth > MAX_DEPTH) {
          return []
        }

        const response = await fetch(`${API}/api/repos/${repoOwner}/${repoName}/contents/${path}?ref=${defaultBranch}`, {
          credentials: 'include',
          signal: AbortSignal.timeout(5000), // 5 second timeout
        })

        if (!response.ok) {
          console.error(`Failed to load files for path ${path}:`, response.status)
          return []
        }

        const items = await response.json()
        let allFiles: any[] = []

        // Process files first (they're more important for search)
        for (const item of items) {
          if (item.type === "file") {
            allFiles.push({
              name: item.name,
              path: path ? `${path}/${item.name}` : item.name,
              type: item.type,
              size: item.size,
              sha: item.sha,
            })
          }
        }

        // Process directories with limited concurrency
        const directories = items.filter((item: any) => item.type === "dir").slice(0, 10) // Limit to 10 directories
        const dirPromises = directories.map(async (item: any) => {
          const subPath = path ? `${path}/${item.name}` : item.name
          return fetchFilesRecursively(subPath, depth + 1)
        })

        const dirResults = await Promise.allSettled(dirPromises)
        dirResults.forEach(result => {
          if (result.status === 'fulfilled') {
            allFiles = [...allFiles, ...result.value]
          }
        })

        return allFiles
      }

      const files = await fetchFilesRecursively()
      setAllRepoFiles(files)
    } catch (error) {
      console.error("Failed to load all files:", error)
    }
  }

  // Fetch connections from the server
  const fetchConnections = async () => {
    if (!owner || !repoName) return

    try {
      const response = await fetch(`${API}/api/repos/${owner}/${repoName}/connections`)

      if (response.ok) {
        const data = await response.json()
        setConnections(data)
      } else {
        console.error("Failed to fetch connections:", response.status)
      }
    } catch (error) {
      console.error("Error fetching connections:", error)
    }
  }

  // Update the useEffect that loads connections to call fetchConnections
  useEffect(() => {
    if (repo) {
      // Fetch connections from the server
      fetchConnections()
    }
  }, [repo])

  // Handle tab change
  const handleTabChange = (tab: string) => {
    // Prevent processing URL changes during tab navigation
    processingUrlChange.current = true

    setActiveTab(tab)
    if (tab === "overview") {
      navigate(`/${owner}/${repoName}`)
    } else if (tab === "files") {
      const branch = currentBranch || repo?.default_branch || "main"
      // If we're already in files view, don't navigate again
      if (!location.pathname.includes("/src/branch/")) {
        navigate(`/${owner}/${repoName}/src/branch/${branch}`)
      }
    }

    // Reset the flag after a short delay
    setTimeout(() => {
      processingUrlChange.current = false
    }, 100)
  }



  // Handle setup qubot
  const handleSetupQubot = () => {
    setShowWelcomeDialog(true)
  }

  if (loading) {
    return (
      <Layout>
        <div className="p-8 text-center">
          <Loader2 className="animate-spin w-8 h-8 mx-auto text-muted-foreground" />
          <p className="mt-4 text-muted-foreground">Loading repository...</p>
        </div>
      </Layout>
    )
  }

  if (error) {
    return (
      <Layout>
        <div className="p-8 text-center text-destructive">{error}</div>
      </Layout>
    )
  }

  if (!repo) {
    return (
      <Layout>
        <div className="p-8 text-center">No repository found.</div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 bg-background text-foreground">
        <RepoHeader
          owner={owner || ""}
          repoName={repoName || ""}
          repo={repo}
          config={config}
          hasRepoStarred={hasRepoStarred}
          toggleStar={toggleStar}
          onEditQubotCard={handleEditQubotCard}
          onDeleteRepo={() => setShowDeleteRepoDialog(true)}
          onSaveQubotCard={handleSaveQubotCard}
          allRepoFiles={allRepoFiles}
        />

        {/* GitHub-style tabbed layout */}
        <div className="space-y-6">
          {/* Tab Navigation */}
          <div className="border-b border-border">
            <nav className="flex space-x-8">
              <button
                onClick={() => handleTabChange("overview")}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === "overview"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => handleTabChange("files")}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === "files"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                }`}
              >
                Files
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          {activeTab === "overview" ? (
            /* Overview Tab - GitHub-style layout with config and README */
            <div className="space-y-6">
              {/* Desktop: Side-by-side layout, Mobile: Stacked */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Config and Quick Info */}
                <div className="lg:col-span-1 space-y-6">
                  {/* Optimization Tool Configuration Card */}
                  {config && (
                    <OptimizationToolConfigCard
                      config={config}
                      fileName="config.json"
                      onViewFile={() => handleViewRawFile("config.json")}
                    />
                  )}


                </div>

                {/* Right Column - README */}
                <div className="lg:col-span-2">
                  {readme ? (
                    <OptimizationToolCardDisplay
                      readme={readme}
                      data={config}
                      onGoToFile={handleGoToFile}
                      onSaveOptimizationToolSetup={handleSaveQubotCard}
                      allRepoFiles={allRepoFiles}
                    />
                  ) : (
                    <Card className="border-border/60">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <FileText className="h-5 w-5" />
                          README
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="text-center py-12">
                        <FileText className="h-16 w-16 mx-auto text-muted-foreground opacity-30 mb-4" />
                        <h3 className="text-lg font-medium mb-2">No README found</h3>
                        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                          Add a README.md file to provide documentation and information about your project.
                        </p>
                        <Button
                          onClick={() => handleGoToFile("README.md")}
                          className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary"
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          Create README.md
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* Files Tab - Enhanced file browser */
            <div className="space-y-4">
              {/* File Browser or File Viewer */}
              {!selectedFile ? (
                <GitHubStyleFileExplorer
                  files={files.map(file => ({
                    name: file.name,
                    type: file.type,
                    size: file.size,
                    path: file.path || file.name,
                    sha: file.sha,
                    commit: file.commit
                  }))}
                  onFileClick={handleFileClick}
                  onAddFile={() => setShowFileUploadDialog(true)}
                  path={currentPath}
                  branch={currentBranch || repo?.default_branch || "main"}
                  branches={branches}
                  onBranchChange={handleBranchChange}
                  repositoryName={repoName}
                  repositoryOwner={owner}
                  commitCount={repo?.watchers_count} // Using watchers as commit count placeholder
                  lastCommit={files.length > 0 && files[0].commit ? {
                    message: files[0].commit.message,
                    sha: files[0].commit.sha || '',
                    author: files[0].commit.author || 'Unknown',
                    authorAvatar: files[0].commit.authorAvatar || null,
                    date: files[0].commit.date
                  } : undefined}
                  className="w-full"
                />
              ) : (
                <div className="space-y-4">
                  {/* File viewer with enhanced features */}
                  {selectedFile.endsWith('.ipynb') ? (
                    <NotebookViewer
                      content={fileContent}
                      fileName={selectedFile.split("/").pop() || ""}
                      onDownload={() => {
                        const blob = new Blob([fileContent], { type: 'application/json' })
                        const url = URL.createObjectURL(blob)
                        const a = document.createElement('a')
                        a.href = url
                        a.download = selectedFile.split("/").pop() || "notebook.ipynb"
                        document.body.appendChild(a)
                        a.click()
                        document.body.removeChild(a)
                        URL.revokeObjectURL(url)
                      }}
                    />
                  ) : (
                    <div className="h-[calc(100vh-250px)] min-h-[600px]">
                      <CodeViewer
                        fileName={selectedFile.split("/").pop() || ""}
                        content={fileContent}
                        isLoading={editorLoading}
                        isEditing={false}
                        onEdit={() => {}}
                        onSave={() => {}}
                        onCancel={() => {}}
                        onChange={() => {}}
                        onBack={handleBackToFiles}
                        onDelete={() => {}}
                        className="w-full h-full"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* File Upload Dialog */}
      <FileUploadDialog
        isOpen={showFileUploadDialog}
        onClose={() => setShowFileUploadDialog(false)}
        onUpload={handleFileUpload}
        onFolderUpload={handleFolderUpload}
        currentPath={currentPath}
        defaultBranch={currentBranch || repo.default_branch || "main"}
        branches={branches}
      />

      {/* File Search Dialog */}
      <FileSearchDialog
        isOpen={showFileSearchDialog}
        onClose={() => setShowFileSearchDialog(false)}
        files={allRepoFiles}
        currentPath={currentPath}
        onFileSelect={handleFileSearch}
      />

      {/* Delete Repository Dialog */}
      <DeleteRepoDialog
        open={showDeleteRepoDialog}
        onOpenChange={setShowDeleteRepoDialog}
        owner={owner || ""}
        repoName={repoName || ""}
        onDelete={handleDeleteRepository}
        isDeleting={isDeletingRepo}
      />





      {/* Setup Dialog */}
      <Dialog open={showSetupDialog} onOpenChange={setShowSetupDialog}>
        <SetupDialog
          open={showSetupDialog}
          onOpenChange={setShowSetupDialog}
          onComplete={handleCompleteSetup}
          qubotType={qubotType}
          setQubotType={setQubotType}
          entrypointFile={entrypointFile}
          setEntrypointFile={setEntrypointFile}
          entrypointClass={entrypointClass}
          setEntrypointClass={setEntrypointClass}
          qubotParameters={qubotParameters}
          setQubotParameters={setQubotParameters}
          arxivLinks={arxivLinks}
          setArxivLinks={setArxivLinks}
          qubotKeywords={qubotKeywords}
          setQubotKeywords={setQubotKeywords}
          currentSetupStep={currentSetupStep}
          setCurrentSetupStep={setCurrentSetupStep}
          pythonFileToUpload={pythonFileToUpload}
          setPythonFileToUpload={setPythonFileToUpload}
          handleUploadPythonFile={handleUploadPythonFile}
        />
      </Dialog>

      {/* Edit Qubot Dialog */}
      <QubotEditDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        owner={owner || ""}
        repoName={repoName || ""}
        config={config}
        onSaveQubotCard={handleSaveQubotCard}
        allRepoFiles={allRepoFiles}
      />

    </Layout>
  )
}

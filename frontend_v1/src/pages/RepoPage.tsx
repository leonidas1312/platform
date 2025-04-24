"use client"

import { DialogFooter } from "@/components/ui/dialog"

import { useEffect, useState, useRef } from "react"
import { useParams, useNavigate, useLocation } from "react-router-dom"
import Layout from "../components/Layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  Book,
  Code,
  Copy,
  FileText,
  GitBranch,
  Loader2,
  Star,
  MoreVertical,
  GitFork,
  Plus,
  Trash2,
  ExternalLink,
  Tag,
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Edit } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

import QubotCardForm from "@/components/CreateQubotCard"
import QubotCardDisplay from "@/components/QubotCardDisplay"
import FileExplorer from "@/components/FileExplorer"
import CodeViewer from "@/components/CodeViewerRepoPage"
import FileUploadDialog from "@/components/FileUploadDialog"
import FileSearchDialog from "@/components/FileSearchDialog"

// For demo purposes, we retrieve the user token from localStorage.
const getUserToken = () => localStorage.getItem("gitea_token") || ""

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
  const [activeTab, setActiveTab] = useState("qubot")
  const [qubotSubTab, setQubotSubTab] = useState("readme")

  // Parse the current path from the URL
  const [currentPath, setCurrentPath] = useState("")
  const [currentBranch, setCurrentBranch] = useState("")
  const [selectedFile, setSelectedFile] = useState<string | null>(null)

  // Code editor state
  const [selectedFileSha, setSelectedFileSha] = useState<string | null>(null)
  const [fileContent, setFileContent] = useState<string>("")
  const [editorLoading, setEditorLoading] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  // Qubot Card state
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [qubotCardContent, setQubotCardContent] = useState<string>("")

  // File upload dialog state
  const [showFileUploadDialog, setShowFileUploadDialog] = useState(false)
  const [branches, setBranches] = useState<string[]>([])

  // File search dialog state
  const [showFileSearchDialog, setShowFileSearchDialog] = useState(false)
  const [allRepoFiles, setAllRepoFiles] = useState<any[]>([])

  const [hasRepoStarred, setHasRepoStarred] = useState(false)

  // New state variables for connections
  const [connections, setConnections] = useState<
    Array<{
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
      setActiveTab("files")
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

    // Set active tab based on URL
    if (location.pathname.includes("/src/branch/")) {
      setActiveTab("files")
    }

    const token = getUserToken()

    fetch(`http://localhost:4000/api/repos/${owner}/${repoName}`, {
      headers: {
        ...(token && { Authorization: `token ${token}` }),
      },
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
        // Set default branch if not already set
        const branch = currentBranch || data.repo.default_branch || "main"
        setCurrentBranch(branch)

        // Fetch commit information for files
        fetchFileCommits(data.files, branch).then((filesWithCommits) => {
          setFiles(filesWithCommits)
        })

        setLoading(false)

        // If a file is selected, load its content
        if (selectedFile) {
          loadFileContent(selectedFile)
        }

        // Load branches
        loadBranches(data.repo.owner.login, data.repo.name)

        // Load all files for search functionality
        loadAllFiles(data.repo.owner.login, data.repo.name, data.repo.default_branch || "main")
      })
      .catch((err) => {
        setError(err.message || "Unknown error")
        setLoading(false)
      })
  }, [owner, repoName])

  // Load branches
  const loadBranches = async (repoOwner: string, repoName: string) => {
    try {
      const response = await fetch(`http://localhost:4000/api/repos/${repoOwner}/${repoName}/branches`)
      if (response.ok) {
        const branchesData = await response.json()
        setBranches(branchesData.map((branch: any) => branch.name))
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
    const res = await fetch(`http://localhost:4000/api/repos/${owner}/${repoName}`)
    const data = await res.json()
    setRepo(data.repo)
    setReadme(data.readme)
    setConfig(data.config)
    setFiles(enhanceFilesWithCommitData(data.files))

    const token = getUserToken()
    if (token !== "") {
      const resStar = await fetch(`http://localhost:4000/api/hasStar/${owner}/${repoName}`, {
        headers: {
          Authorization: `token ${token}`,
        },
      })
      const starJson = await resStar.json()
      console.log("starjson:", starJson)
      setHasRepoStarred(starJson.starred)
    }
  }

  // Load file content
  const loadFileContent = async (filePath: string) => {
    if (!owner || !repoName) return

    const branch = currentBranch || repo?.default_branch || "main"
    if (!branch) return

    console.log(`Loading file content: ${filePath} from branch: ${branch}`)
    setEditorLoading(true)
    try {
      const fileRes = await fetch(
        `http://localhost:4000/api/repos/${owner}/${repoName}/contents/${filePath}?ref=${branch}`,
        {
          headers: {
            Authorization: `token ${getUserToken()}`,
          },
        },
      )

      if (fileRes.ok) {
        const fileJson = await fileRes.json()
        if (fileJson.content) {
          const decoded = atob(fileJson.content)
          console.log("File content loaded successfully, length:", decoded.length)
          setFileContent(decoded)
          setSelectedFileSha(fileJson.sha)
        } else {
          console.log("File content is empty")
          setFileContent("")
          setSelectedFileSha(null)
        }
      } else {
        console.log(`Error loading file: ${filePath}, status: ${fileRes.status}`)
        // For demo purposes, generate some content based on file type
        if (filePath.endsWith(".md")) {
          setFileContent(`# ${filePath.split("/").pop()?.replace(".md", "")}\n\nThis is a sample markdown file.`)
        } else if (filePath.endsWith(".json")) {
          setFileContent(JSON.stringify({ sample: "data" }, null, 2))
        } else if (filePath.endsWith(".py")) {
          setFileContent(
            'def hello_world():\n    print("Hello, World!")\n\nif __name__ == "__main__":\n    hello_world()',
          )
        } else {
          setFileContent(`Sample content for ${filePath}`)
        }
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
      const starRes = await fetch(`http://localhost:4000/api/toggleStar/${owner}/${repoName}`, {
        method: "POST",
        headers: {
          Authorization: `token ${getUserToken()}`,
        },
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

  const handleSaveQubotCard = async (formData: any) => {
    if (!owner || !repoName || !repo) return
    setLoading(true)
    try {
      const token = getUserToken()

      // Save config.json
      const configResponse = await fetch(`http://localhost:4000/api/repos/${owner}/${repoName}/contents/config.json`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `token ${token}`,
        },
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
    } catch (err: any) {
      console.error(err)
      setError(err.message || "Error creating Qubot card")
    } finally {
      setLoading(false)
    }
  }

  // File selection handler
  const handleFileClick = (file: any) => {
    const branch = currentBranch || repo?.default_branch || "main"

    if (file.type === "dir") {
      // Navigate to directory
      const newPath = currentPath ? `${currentPath}/${file.name}` : file.name
      console.log("Navigating to directory:", newPath)

      // Set the current path before navigation
      setCurrentPath(newPath)

      // Immediately load the directory contents
      const branch = currentBranch || repo?.default_branch || "main"
      const apiUrl = `http://localhost:4000/api/repos/${owner}/${repoName}/contents/${newPath}?ref=${branch}`
      setLoading(true)

      fetch(apiUrl)
        .then((res) => {
          if (!res.ok) {
            throw new Error("Failed to fetch directory contents")
          }
          return res.json()
        })
        .then(async (data) => {
          console.log("Directory contents loaded:", data.length, "files")
          // Fetch commit information for each file
          const filesWithCommits = await fetchFileCommits(data, branch)
          setFiles(filesWithCommits)
          setLoading(false)

          // Then navigate to the directory URL
          navigate(`/${owner}/${repoName}/src/branch/${branch}/${newPath}`)
        })
        .catch((err) => {
          console.error("Error loading directory:", err)
          setLoading(false)
          toast({
            title: "Error",
            description: "Failed to load directory contents",
            variant: "destructive",
          })
        })
    } else {
      // Navigate to file
      const filePath = currentPath ? `${currentPath}/${file.name}` : file.name
      console.log("Navigating to file:", filePath)

      // Set the selected file before navigation to ensure it's available immediately
      setSelectedFile(filePath)

      // Load the file content immediately
      loadFileContent(filePath)

      // Then navigate to the file URL
      navigate(`/${owner}/${repoName}/src/branch/${branch}/${filePath}`)
    }
  }

  // Save file updates
  const handleSaveFile = async () => {
    if (!selectedFile || !owner || !repoName || !selectedFileSha) return
    try {
      setEditorLoading(true)
      const token = getUserToken()
      const encodedContent = btoa(fileContent)
      const response = await fetch(`http://localhost:4000/api/repos/${owner}/${repoName}/contents/${selectedFile}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `token ${token}`,
        },
        body: JSON.stringify({
          content: encodedContent,
          message: `Update ${selectedFile}`,
          branch: currentBranch || repo?.default_branch || "main",
          sha: selectedFileSha,
        }),
      })
      if (!response.ok) {
        const errData = await response.json()
        throw new Error(errData.message || "Failed to update file")
      }

      // Reload the file content
      await loadFileContent(selectedFile)
      setIsEditing(false)
      toast({
        title: "Success",
        description: "File saved successfully!",
      })
    } catch (err: any) {
      console.error(err)
      setError(err.message || "Error saving file")
      toast({
        title: "Error",
        description: err.message || "Failed to save file",
        variant: "destructive",
      })
    } finally {
      setEditorLoading(false)
    }
  }

  // Add a handleDeleteFile function after the handleSaveFile function
  const handleDeleteFile = async () => {
    if (!selectedFile || !owner || !repoName || !selectedFileSha) return
    try {
      setEditorLoading(true)
      const token = getUserToken()

      const response = await fetch(`http://localhost:4000/api/repos/${owner}/${repoName}/contents/${selectedFile}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `token ${token}`,
        },
        body: JSON.stringify({
          message: `Delete ${selectedFile}`,
          branch: currentBranch || repo?.default_branch || "main",
          sha: selectedFileSha,
        }),
      })

      if (!response.ok) {
        const errData = await response.json()
        throw new Error(errData.message || "Failed to delete file")
      }

      // Clear the selected file state
      setSelectedFile(null)
      setFileContent("")
      setSelectedFileSha(null)

      // Navigate back to the directory
      const branch = currentBranch || repo?.default_branch || "main"
      if (currentPath) {
        navigate(`/${owner}/${repoName}/src/branch/${branch}/${currentPath}`)
      } else {
        navigate(`/${owner}/${repoName}/src/branch/${branch}`)
      }

      // Reload the directory contents
      if (currentPath) {
        const dirResponse = await fetch(
          `http://localhost:4000/api/repos/${owner}/${repoName}/contents/${currentPath}?ref=${branch}`,
          { headers: { Authorization: `token ${token}` } },
        )
        if (dirResponse.ok) {
          const dirData = await dirResponse.json()
          setFiles(enhanceFilesWithCommitData(dirData))
        }
      } else {
        await reloadRepoData()
      }

      toast({
        title: "Success",
        description: "File deleted successfully!",
      })
    } catch (err: any) {
      console.error(err)
      setError(err.message || "Error deleting file")
      toast({
        title: "Error",
        description: err.message || "Failed to delete file",
        variant: "destructive",
      })
    } finally {
      setEditorLoading(false)
    }
  }

  // Add this function to handle repository deletion
  const handleDeleteRepository = async () => {
    if (!owner || !repoName) return
    if (deleteRepoConfirmation !== `${owner}/${repoName}`) return

    setIsDeletingRepo(true)
    try {
      const token = getUserToken()
      const response = await fetch(`http://localhost:4000/api/repos/${owner}/${repoName}`, {
        method: "DELETE",
        headers: {
          Authorization: `token ${token}`,
        },
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
    const branch = currentBranch || repo?.default_branch || "main"

    // Clear the selected file state
    setSelectedFile(null)

    if (currentPath) {
      navigate(`/${owner}/${repoName}/src/branch/${branch}/${currentPath}`)
    } else {
      navigate(`/${owner}/${repoName}/src/branch/${branch}`)
    }
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
      const token = getUserToken()

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
      const response = await fetch(`http://localhost:4000/api/repos/${owner}/${repoName}/contents/${filePath}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `token ${token}`,
        },
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
          `http://localhost:4000/api/repos/${owner}/${repoName}/contents/${currentPath}?ref=${branch || currentBranch || repo?.default_branch || "main"}`,
          { headers: { Authorization: `token ${token}` } },
        )
        if (dirResponse.ok) {
          const dirData = await dirResponse.json()
          setFiles(enhanceFilesWithCommitData(dirData))
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

  // Function to navigate to a specific file in the repository
  const handleGoToFile = (filePath: string) => {
    const branch = currentBranch || repo?.default_branch || "main"

    // Set the selected file
    setSelectedFile(filePath)

    // Load the file content
    loadFileContent(filePath)

    // Set the active tab to files
    setActiveTab("files")

    // Navigate to the file URL
    navigate(`/${owner}/${repoName}/src/branch/${branch}/${filePath}`)
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
      ? `http://localhost:4000/api/repos/${owner}/${repoName}/contents/${parentPath}?ref=${branch}`
      : `http://localhost:4000/api/repos/${owner}/${repoName}`

    setLoading(true)

    fetch(apiUrl)
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to fetch directory contents")
        }
        return res.json()
      })
      .then((data) => {
        console.log("Parent directory contents loaded:", data.length, "files")
        setFiles(enhanceFilesWithCommitData(data.files))
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
    const branch = currentBranch || repo?.default_branch || "main"
    handleGoToFile(filePath)
  }

  // Update the fetchFiles function to include commit information for each file
  // Add this function after the loadAllFiles function

  // Fetch commit information for files in the current directory
  const fetchFileCommits = async (files: any[], branch: string) => {
    if (!owner || !repoName || files.length === 0) return files

    try {
      const token = getUserToken()
      const enhancedFiles = [...files]

      // For each file, fetch its latest commit
      for (let i = 0; i < enhancedFiles.length; i++) {
        const file = enhancedFiles[i]
        const filePath = currentPath ? `${currentPath}/${file.name}` : file.name

        const commitResponse = await fetch(
          `http://localhost:4000/api/repos/${owner}/${repoName}/commits?path=${encodeURIComponent(filePath)}&limit=1&ref=${branch}`,
          {
            headers: token ? { Authorization: `token ${token}` } : {},
          },
        )

        if (commitResponse.ok) {
          const commits = await commitResponse.json()
          if (commits && commits.length > 0) {
            enhancedFiles[i] = {
              ...file,
              commit: {
                message: commits[0].commit.message,
                date: commits[0].commit.author.date,
                author: commits[0].author?.login || commits[0].commit.author.name,
                sha: commits[0].sha,
              },
            }
          }
        }
      }

      return enhancedFiles
    } catch (error) {
      console.error("Error fetching file commits:", error)
      return files
    }
  }

  // Function to load all files in the repository for the file search dialog
  const loadAllFiles = async (repoOwner: string, repoName: string, defaultBranch: string) => {
    try {
      const response = await fetch(
        `http://localhost:4000/api/repos/${repoOwner}/${repoName}/files?ref=${defaultBranch}`,
      )
      if (response.ok) {
        const filesData = await response.json()
        setAllRepoFiles(filesData)
      } else {
        console.error("Failed to load all files:", response.status)
      }
    } catch (error) {
      console.error("Failed to load all files:", error)
    }
  }

  const handleCopySnippet = (snippet: string) => {
    navigator.clipboard.writeText(snippet)
    toast({
      title: "Copied to clipboard",
      description: "Code snippet copied to clipboard",
    })
  }

  const handleEditConnection = (index: number) => {
    const connection = connections[index]
    setConnectionForm({
      repoPath: connection.repoPath,
      description: connection.description,
      codeSnippet: connection.codeSnippet,
    })
    setEditingConnectionIndex(index)
    setShowConnectionDialog(true)
  }

  const handleDeleteConnection = (index: number) => {
    const updatedConnections = [...connections]
    updatedConnections.splice(index, 1)
    setConnections(updatedConnections)

    // In a real app, you would save this to the backend
    toast({
      title: "Connection removed",
      description: "The repository connection has been removed",
    })
  }

  const handleSaveConnection = () => {
    if (!connectionForm.repoPath || !connectionForm.codeSnippet) {
      toast({
        title: "Required fields missing",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    const updatedConnections = [...connections]

    if (editingConnectionIndex !== null) {
      // Edit existing connection
      updatedConnections[editingConnectionIndex] = connectionForm
    } else {
      // Add new connection
      updatedConnections.push(connectionForm)
    }

    setConnections(updatedConnections)
    setShowConnectionDialog(false)
    setEditingConnectionIndex(null)
    setConnectionForm({
      repoPath: "",
      description: "",
      codeSnippet: "",
    })

    // In a real app, you would save this to the backend
    toast({
      title: editingConnectionIndex !== null ? "Connection updated" : "Connection added",
      description:
        editingConnectionIndex !== null
          ? "The repository connection has been updated"
          : "The repository connection has been added",
    })
  }

  // Add this effect to load connections when the repo data is loaded
  useEffect(() => {
    if (repo) {
      // In a real app, you would fetch connections from the backend
      // For now, we'll just set some example connections if none exist
      if (connections.length === 0) {
        // Don't set example connections as requested
      }
    }
  }, [repo])

  // Debug output
  console.log("Current state:", {
    selectedFile,
    currentPath,
    currentBranch,
    activeTab,
    fileContentLength: fileContent.length,
    isLoading: loading,
    isEditorLoading: editorLoading,
  })

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
      <div className="container mx-auto px-4 py-8 mt-32 bg-background text-foreground">
        {/* Repository Header with gradient background */}
        <div className="flex flex-col space-y-4 mb-8 bg-gradient-to-r from-background via-background/80 to-primary/5 rounded-xl p-6 border border-border/40 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Book className="h-5 w-5 text-primary" />
              <button
                onClick={() => navigate(`/u/${repo.owner.login}`)}
                className="text-muted-foreground hover:text-primary hover:underline transition-colors"
              >
                {repo.owner.login}
              </button>
              <span className="text-muted-foreground">/</span>
              <button
                onClick={() => {
                  setActiveTab("qubot")
                  navigate(`/${owner}/${repoName}`)
                }}
                className="font-semibold hover:text-primary hover:underline transition-colors"
              >
                {repo.name}
              </button>
              <Badge variant="outline" className="ml-2 bg-background/80 backdrop-blur-sm">
                {repo.private ? "Private" : "Public"}
              </Badge>
            </div>
          </div>

          <div className="flex flex-wrap items-start justify-between gap-4">
            {/* Show Qubot description under repo name if available */}
            <p className="text-muted-foreground max-w-6xl">
              {config?.description || repo.description || "No description provided."}
            </p>
            <div className="flex gap-2 items-center ml-auto">
              <Button
                onClick={() => {
                  toggleStar()
                }}
                variant="outline"
                size="sm"
                className={`h-8 transition-all ${hasRepoStarred ? "bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800/30 dark:hover:bg-amber-900/50" : ""}`}
              >
                <Star className={`mr-1 h-4 w-4 ${hasRepoStarred ? "fill-current" : ""}`} />
                {hasRepoStarred ? "Unstar" : "Star"}
                <Badge variant="secondary" className="ml-1 rounded-sm px-1">
                  {repo.stars_count}
                </Badge>
              </Button>

              <Dialog>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DialogTrigger asChild>
                      <DropdownMenuItem>
                        <GitFork className="mr-2 h-4 w-4" />
                        Clone Repository
                      </DropdownMenuItem>
                    </DialogTrigger>
                    {config && (
                      <DropdownMenuItem
                        onClick={() => {
                          setActiveTab("qubot")
                          setShowCreateForm(true)
                          navigate(`/${owner}/${repoName}`)
                        }}
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Edit Qubot Card
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      onClick={() => setShowDeleteRepoDialog(true)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Repository
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Clone Repository</DialogTitle>
                    <DialogDescription>Use these commands to clone this repository</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <div>
                      <p className="text-sm font-medium mb-2">HTTPS</p>
                      <div className="flex">
                        <Input
                          readOnly
                          value={`git clone https://gitea.example.com/${owner}/${repoName}.git`}
                          className="font-mono text-sm"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          className="ml-2"
                          onClick={() => {
                            navigator.clipboard.writeText(
                              `git clone https://gitea.example.com/${owner}/${repoName}.git`,
                            )
                            toast({
                              title: "Copied to clipboard",
                              description: "Clone URL copied to clipboard",
                            })
                          }}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm font-medium mb-2">SSH</p>
                      <div className="flex">
                        <Input
                          readOnly
                          value={`git clone git@gitea.example.com:${owner}/${repoName}.git`}
                          className="font-mono text-sm"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          className="ml-2"
                          onClick={() => {
                            navigator.clipboard.writeText(`git clone git@gitea.example.com:${owner}/${repoName}.git`)
                            toast({
                              title: "Copied to clipboard",
                              description: "Clone URL copied to clipboard",
                            })
                          }}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        {/* Main content with sidebar layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar with Qubot Card */}
          <div className="lg:col-span-1 space-y-4">
            <div className="sticky top-24">
              <Card className="hover:shadow-md transition-all duration-300 border-border/60">
                <CardHeader className="pb-2 bg-gradient-to-br from-background to-muted/30 border-b border-border/30">
                  <CardTitle className="text-lg flex items-center gap-2">{"Qubot card"}</CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  {showCreateForm ? (
                    <div className="text-center py-4">
                      <p className="text-sm text-muted-foreground mb-4">
                        You're currently editing the Qubot card in the main panel.
                      </p>
                    </div>
                  ) : config ? (
                    <div className="space-y-4">
                      {/* Type badge with improved styling */}
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={`px-3 py-1 text-sm font-medium border-none text-white ${
                            config.type === "problem"
                              ? "bg-gradient-to-r from-blue-500 to-cyan-500"
                              : "bg-gradient-to-r from-orange-500 to-red-500"
                          }`}
                        >
                          {config.type.charAt(0).toUpperCase() + config.type.slice(1)}
                        </Badge>
                      </div>

                      {/* Metadata section with improved styling */}
                      {(config.creator || config.problem_name || config.link_to_arxiv) && (
                        <div className="space-y-2 bg-muted/20 rounded-md p-3 border border-border/40">
                          {/* Creator */}

                          {config.link_to_arxiv && (
                            <div className="flex items-start gap-2">
                              <ExternalLink className="h-4 w-4 text-primary mt-0.5" />
                              <div>
                                <span className="text-xs text-muted-foreground">arXiv Link</span>
                                <a
                                  href={config.link_to_arxiv}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm font-medium text-primary hover:underline block"
                                >
                                  View Paper
                                </a>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Keywords with improved styling */}
                      {config.keywords && config.keywords.length > 0 && (
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-1.5">
                            <Tag className="h-3.5 w-3.5 text-primary" />
                            <span className="text-xs font-medium text-muted-foreground">Keywords</span>
                          </div>
                          <div className="flex flex-wrap gap-1.5 mt-1 bg-muted/20 p-2 rounded-md border border-border/40">
                            {config.keywords.slice(0, 20).map((keyword: string) => (
                              <Badge
                                key={keyword}
                                variant="outline"
                                className="text-xs bg-background hover:bg-primary/5 transition-colors border-primary/20"
                              >
                                {keyword}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-sm text-muted-foreground mb-4">No Qubot Card found.</p>
                      <Button
                        onClick={() => {
                          setActiveTab("qubot")
                          setShowCreateForm(true)
                          navigate(`/${owner}/${repoName}`)
                        }}
                        size="sm"
                        className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary"
                      >
                        Create Qubot Card
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Use with qubots button */}
              {config && (
                <Card className="mt-4 hover:shadow-md transition-all duration-300 border-border/60">
                  <CardHeader className="pb-2 bg-gradient-to-br from-background to-muted/30 border-b border-border/30">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Code className="h-3.5 w-3.5 text-primary" />
                      Use with qubots library
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    {/* Snippet block based on config.type */}
                    <div className="bg-muted/20 rounded-md p-2 text-xs font-mono overflow-x-auto border border-border/40">
                      <code className="text-primary">
                        {config.type === "problem" ? (
                          <>
                            <span className="text-blue-500 dark:text-blue-400">from</span>{" "}
                            <span className="text-green-600 dark:text-green-400">qubots</span>{" "}
                            <span className="text-blue-500 dark:text-blue-400">import</span> AutoProblem
                            <br />
                            problem = AutoProblem.from_repo(
                            <span className="text-amber-600 dark:text-amber-400">
                              "{repo.owner.login}/{repo.name}"
                            </span>
                            )
                          </>
                        ) : (
                          <>
                            <span className="text-blue-500 dark:text-blue-400">from</span>{" "}
                            <span className="text-green-600 dark:text-green-400">qubots</span>{" "}
                            <span className="text-blue-500 dark:text-blue-400">import</span> AutoOptimizer
                            <br />
                            optimizer = AutoOptimizer.from_repo(
                            <span className="text-amber-600 dark:text-amber-400">
                              "{repo.owner.login}/{repo.name}"
                            </span>
                            )
                          </>
                        )}
                      </code>
                    </div>

                    {/* Copy button */}
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full mt-3 h-8 text-xs border-primary/20 hover:bg-primary/5 hover:text-primary transition-colors"
                      onClick={() => {
                        const snippet =
                          config.type === "problem"
                            ? `pip install qubots\nfrom qubots import AutoProblem\nproblem = AutoProblem.from_repo("${repo.owner.login}/${repo.name}")`
                            : `pip install qubots\nfrom qubots import AutoOptimizer\noptimizer = AutoOptimizer.from_repo("${repo.owner.login}/${repo.name}")`
                        navigator.clipboard.writeText(snippet)
                        toast({
                          title: "Copied to clipboard",
                          description: "Code snippet copied to clipboard",
                        })
                      }}
                    >
                      <Copy className="h-3 w-3 mr-1" /> Copy code
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Main content area */}
          <div className="lg:col-span-3">
            <Tabs
              defaultValue="files"
              className="w-full"
              value={activeTab}
              onValueChange={(tab) => {
                setActiveTab(tab)
                if (tab === "qubot") {
                  navigate(`/${owner}/${repoName}`)
                } else if (tab === "files") {
                  const branch = currentBranch || repo.default_branch || "main"
                  navigate(`/${owner}/${repoName}/src/branch/${branch}`)
                }
              }}
            >
              <div className="border-b">
                <TabsList className="h-10 bg-transparent">
                  <TabsTrigger
                    value="qubot"
                    className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none transition-colors"
                  >
                    <Code className="mr-2 h-4 w-4" />
                    Readme
                  </TabsTrigger>
                  <TabsTrigger
                    value="files"
                    className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none transition-colors"
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Files
                  </TabsTrigger>
                  <TabsTrigger
                    value="others"
                    className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none transition-colors"
                  >
                    <GitBranch className="mr-2 h-4 w-4" />
                    Qubot connections
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* Qubot Card Tab */}
              <TabsContent value="qubot" className="mt-6 space-y-4">
                {showCreateForm ? (
                  <QubotCardForm
                    initialData={config}
                    onSave={handleSaveQubotCard}
                    onCancel={() => setShowCreateForm(false)}
                  />
                ) : readme ? (
                  <QubotCardDisplay readme={readme} onGoToFile={handleGoToFile} />
                ) : (
                  <div className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle>Readme</CardTitle>
                        <CardDescription>Add a readme file to your repository in the files section.</CardDescription>
                      </CardHeader>
                    </Card>
                  </div>
                )}
              </TabsContent>

              {/* Files Tab */}
              <TabsContent value="files" className="mt-6 space-y-4">
                {!selectedFile ? (
                  <FileExplorer
                    files={files}
                    onFileClick={handleFileClick}
                    defaultBranch={currentBranch || repo?.default_branch || "main"}
                    path={currentPath}
                    className="w-full"
                    onAddFile={() => setShowFileUploadDialog(true)}
                    onNavigateToParent={handleNavigateToParentDirectory}
                    onGoToFile={handleGoToFile}
                    isLoading={loading}
                    allRepoFiles={allRepoFiles}
                    repoOwner={owner}
                    repoName={repoName}
                  />
                ) : (
                  <div className="h-[calc(100vh-250px)] min-h-[600px]">
                    <CodeViewer
                      fileName={selectedFile.split("/").pop() || ""}
                      content={fileContent}
                      isLoading={editorLoading}
                      isEditing={isEditing}
                      onEdit={() => setIsEditing(true)}
                      onSave={handleSaveFile}
                      onCancel={() => setIsEditing(false)}
                      onChange={setFileContent}
                      onBack={handleBackToFiles}
                      onDelete={handleDeleteFile}
                      className="w-full h-full"
                    />
                  </div>
                )}
              </TabsContent>

              {/* Other Qubots Tab */}
              <TabsContent value="others" className="mt-6 space-y-4">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Qubot connections</CardTitle>
                      <Button size="sm" onClick={() => setShowConnectionDialog(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Connection
                      </Button>
                    </div>
                    <CardDescription>Connect your repository with other qubot repositories</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {connections.length === 0 ? (
                      <div className="text-center py-12">
                        <GitBranch className="h-12 w-12 text-muted-foreground opacity-50 mx-auto mb-4" />
                        <h3 className="text-lg font-medium">No connections yet</h3>
                        <p className="text-muted-foreground mt-1 mb-4">
                          Connect your repository with other Qubot repositories
                        </p>
                        <Button
                          onClick={() => setShowConnectionDialog(true)}
                          className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add First Connection
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {connections.map((connection, index) => (
                          <div key={index} className="border rounded-lg p-4">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h3 className="font-medium flex items-center gap-2">
                                  <GitBranch className="h-4 w-4 text-primary" />
                                  <button
                                    onClick={() => navigate(`/${connection.repoPath}`)}
                                    className="text-primary hover:underline"
                                  >
                                    {connection.repoPath}
                                  </button>
                                </h3>
                                {connection.description && (
                                  <p className="text-sm text-muted-foreground mt-1">{connection.description}</p>
                                )}
                              </div>
                              <div className="flex gap-2">
                                <Button variant="ghost" size="sm" onClick={() => handleEditConnection(index)}>
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => handleDeleteConnection(index)}>
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            </div>
                            <div className="bg-muted rounded-md p-3 mt-2 relative">
                              <pre className="text-xs font-mono overflow-x-auto whitespace-pre-wrap">
                                {connection.codeSnippet}
                              </pre>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="absolute top-2 right-2 h-7 w-7 p-0"
                                onClick={() => handleCopySnippet(connection.codeSnippet)}
                              >
                                <Copy className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      {/* File Upload Dialog */}
      <FileUploadDialog
        isOpen={showFileUploadDialog}
        onClose={() => setShowFileUploadDialog(false)}
        onUpload={handleFileUpload}
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

      {/* Connection Dialog */}
      <Dialog
        open={showConnectionDialog}
        onOpenChange={(open) => {
          if (!open) {
            setEditingConnectionIndex(null)
            setConnectionForm({
              repoPath: "",
              description: "",
              codeSnippet: "",
            })
          }
          setShowConnectionDialog(open)
        }}
      >
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {editingConnectionIndex !== null ? "Edit Connection" : "Add Repository Connection"}
            </DialogTitle>
            <DialogDescription>
              Connect your repository with another Qubot repository to extend functionality
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="repoPath">
                Repository Path <span className="text-destructive">*</span>
              </Label>
              <Input
                id="repoPath"
                placeholder="some_username/repo-name"
                value={connectionForm.repoPath}
                onChange={(e) => setConnectionForm({ ...connectionForm, repoPath: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Format: username/repository-name (e.g., papaflesas/VRP_solver)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                placeholder="Brief description of how this connection is used"
                value={connectionForm.description}
                onChange={(e) => setConnectionForm({ ...connectionForm, description: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="codeSnippet">
                Code Snippet <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="codeSnippet"
                placeholder="from qubots.auto_problem import AutoProblem                           
                from qubots.auto_optimizer import AutoOptimizer                                                                           
                problem = AutoProblem.from_repo('some_username/repo-name')

                optimizer = AutoOptimizer.from_repo('my_username/my-repo-name')

                solution, cost_value = optimizer.optimize(problem)"
                value={connectionForm.codeSnippet}
                onChange={(e) => setConnectionForm({ ...connectionForm, codeSnippet: e.target.value })}
                className="font-mono text-sm"
                rows={6}
              />
              <p className="text-xs text-muted-foreground">Add the code that shows how to connect to this repository</p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConnectionDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveConnection}>
              {editingConnectionIndex !== null ? "Update Connection" : "Add Connection"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Repository Dialog */}
      <Dialog open={showDeleteRepoDialog} onOpenChange={setShowDeleteRepoDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-destructive">Delete Repository</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the repository, wiki, issues, comments,
              packages, secrets, workflow runs, and remove all collaborator associations.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="rounded-md bg-destructive/10 p-4 mb-4 border border-destructive/30">
              <p className="text-sm text-destructive font-medium">
                Please type{" "}
                <span className="font-bold">
                  {owner}/{repoName}
                </span>{" "}
                to confirm.
              </p>
            </div>
            <Input
              value={deleteRepoConfirmation}
              onChange={(e) => setDeleteRepoConfirmation(e.target.value)}
              placeholder={`${owner}/${repoName}`}
              className="w-full"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteRepoDialog(false)} disabled={isDeletingRepo}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteRepository}
              disabled={deleteRepoConfirmation !== `${owner}/${repoName}` || isDeletingRepo}
            >
              {isDeletingRepo ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Repository"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  )
}

"use client"

import type React from "react"

import { useEffect, useState, useRef } from "react"
import { useParams, useNavigate, useLocation } from "react-router-dom"
import Layout from "@/components/Layout"
import { useToast } from "@/components/ui/use-toast"
import { Dialog } from "@/components/ui/dialog"
import { Loader2 } from "lucide-react"

// Import components
import RepoHeader from "@/components/repo/RepoHeader"
import QubotSidebar from "@/components/repo/QubotSidebar"
import NewRepoWelcome from "@/components/repo/NewRepoWelcome"
import SetupDialog from "@/components/repo/SetupDialog"
import DeleteRepoDialog from "@/components/repo/DeleteRepoDialog"
import TabsContainer from "@/components/repo/TabsContainer"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

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

        // Check if this is a new repository (no config.json and empty or no readme)
        if (!data.config && (!data.readme || data.readme.trim() === "")) {
          setIsNewRepo(true)
        }

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

    // If config exists now, we're no longer in new repo state
    if (data.config) {
      setIsNewRepo(false)
      setSetupComplete(true)
    }

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

      // If this was a new repo, it's no longer new
      if (isNewRepo) {
        setIsNewRepo(false)
        setSetupComplete(true)
      }

      // Close the setup dialog if it was open
      setShowSetupDialog(false)
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
      const token = getUserToken()
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
      const response = await fetch(
        `http://localhost:4000/api/repos/${owner}/${repoName}/contents/${pythonFileToUpload.name}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `token ${token}`,
          },
          body: JSON.stringify({
            content: fileContent,
            message: `Add ${pythonFileToUpload.name}`,
            branch: branch,
          }),
        },
      )

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

      // Move to the next step
      setCurrentSetupStep(3)
    } catch (err: any) {
      console.error("Error uploading Python file:", err)
      toast({
        title: "Error",
        description: err.message || "Failed to upload Python file",
        variant: "destructive",
      })
    }
  }

  // Update the handleCompleteSetup function to include the new fields
  const handleCompleteSetup = async () => {
    if (!entrypointFile || !owner || !repoName) return

    try {
      setLoading(true)
      const token = getUserToken()

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
      const configResponse = await fetch(`http://localhost:4000/api/repos/${owner}/${repoName}/contents/config.json`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `token ${token}`,
        },
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

      toast({
        title: "Success",
        description: "Qubot setup completed successfully!",
      })

      // Reload repo data to reflect changes
      await reloadRepoData()
    } catch (err) {
      console.error("Error completing qubot setup:", err)
      toast({
        title: "Error",
        description: err.message || "Failed to complete qubot setup",
        variant: "destructive",
      })
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
    handleGoToFile(filePath)
  }

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
      const token = getUserToken()
      // Instead of using a non-existent endpoint, we'll recursively fetch all files
      // starting from the root directory
      const fetchFilesRecursively = async (path = ""): Promise<any[]> => {
        const response = await fetch(
          `http://localhost:4000/api/repos/${repoOwner}/${repoName}/contents/${path}?ref=${defaultBranch}`,
          {
            headers: token ? { Authorization: `token ${token}` } : {},
          },
        )

        if (!response.ok) {
          console.error(`Failed to load files for path ${path}:`, response.status)
          return []
        }

        const items = await response.json()
        let allFiles: any[] = []

        for (const item of items) {
          if (item.type === "file") {
            allFiles.push({
              name: item.name,
              path: path ? `${path}/${item.name}` : item.name,
              type: item.type,
              size: item.size,
              sha: item.sha,
            })
          } else if (item.type === "dir") {
            const subPath = path ? `${path}/${item.name}` : item.name
            const subFiles = await fetchFilesRecursively(subPath)
            allFiles = [...allFiles, ...subFiles]
          }
        }

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
      const response = await fetch(`http://localhost:4000/api/repos/${owner}/${repoName}/connections`)

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
    setActiveTab(tab)
    if (tab === "qubot") {
      navigate(`/${owner}/${repoName}`)
    } else if (tab === "files") {
      const branch = currentBranch || repo?.default_branch || "main"
      navigate(`/${owner}/${repoName}/src/branch/${branch}`)
    }
  }

  // Handle edit qubot card
  const handleEditQubotCard = () => {
    setActiveTab("qubot")
    setShowCreateForm(true)
    navigate(`/${owner}/${repoName}`)
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

  // First-time user experience for new repositories
  if (isNewRepo) {
    return (
      <Layout>
        <NewRepoWelcome
          owner={owner || ""}
          repoName={repoName || ""}
          repo={repo}
          onCreateQubotCard={() => setShowSetupDialog(true)}
        />

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
      </Layout>
    )
  }

  // Render the main repository view
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 mt-32 bg-background text-foreground">
        <RepoHeader
          owner={owner || ""}
          repoName={repoName || ""}
          repo={repo}
          config={config}
          hasRepoStarred={hasRepoStarred}
          toggleStar={toggleStar}
          onEditQubotCard={handleEditQubotCard}
          onDeleteRepo={() => setShowDeleteRepoDialog(true)}
        />

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar with Qubot Card */}
          <div className="lg:col-span-1 space-y-4">
            <QubotSidebar config={config} onEditQubotCard={handleEditQubotCard} />
          </div>

          {/* Main content area */}
          <div className="lg:col-span-3">
            <TabsContainer
              activeTab={activeTab}
              onTabChange={handleTabChange}
              readmeContent={
                showCreateForm ? (
                  <QubotCardForm
                    initialData={config}
                    onSave={handleSaveQubotCard}
                    onCancel={() => setShowCreateForm(false)}
                  />
                ) : readme ? (
                  <QubotCardDisplay
                    readme={readme}
                    data={config}
                    onGoToFile={handleGoToFile}
                    onSaveQubotSetup={handleSaveQubotCard}
                    allRepoFiles={allRepoFiles}
                  />
                ) : (
                  <div className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle>Readme</CardTitle>
                        <CardDescription>Add a readme file to your repository in the files section.</CardDescription>
                      </CardHeader>
                    </Card>
                  </div>
                )
              }
              filesContent={
                !selectedFile ? (
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
                    repoOwner={owner || ""}
                    repoName={repoName || ""}
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
                )
              }
            />
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
    </Layout>
  )
}

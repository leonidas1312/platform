"use client"

import { useEffect, useState, useRef } from "react"
import { useParams, useNavigate, useLocation } from "react-router-dom"
import Layout from "../components/Layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
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
  FolderOpen,
  GitFork,
  Edit,
  FileCode,
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

import QubotCardForm from "@/components/CreateQubotCard"
import QubotCardDisplay from "@/components/QubotCardDisplay"
import TechnicalDetails from "@/components/QubotTechDetails"
import FileExplorer from "@/components/FileExplorer"
import CodeViewer from "@/components/CodeViewerRepoPage"
import FileUploadDialog from "@/components/FileUploadDialog"

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

  // Dummy data for Other Qubots tab
  const otherQubots = [
    { id: 1, title: "Optimizer A", description: "Optimize your workflow with A." },
    { id: 2, title: "Optimizer B", description: "Improve performance with B." },
    { id: 3, title: "Optimizer C", description: "Advanced techniques with C." },
  ]

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
        message:
          file.name === "README.md"
            ? "Update documentation"
            : file.name === "config.json"
              ? "Update configuration"
              : file.name.endsWith(".py")
                ? "Fix bug in algorithm"
                : "Initial commit",
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

    fetch(`http://localhost:4000/api/repos/${owner}/${repoName}`)
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
        // Enhance files with dummy commit data for demo
        setFiles(enhanceFilesWithCommitData(data.files))

        // Set default branch if not already set
        if (!currentBranch) {
          setCurrentBranch(data.repo.default_branch || "main")
        }

        setLoading(false)

        // If a file is selected, load its content
        if (selectedFile) {
          loadFileContent(selectedFile)
        }

        // Load branches
        loadBranches(data.repo.owner.login, data.repo.name)
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

  // Load directory contents when path changes
  useEffect(() => {
    if (!owner || !repoName || !currentBranch) return

    if (currentPath) {
      console.log("Loading directory contents for path:", currentPath)
      // Load directory contents for the current path
      fetch(`http://localhost:4000/api/repos/${owner}/${repoName}/contents/${currentPath}?ref=${currentBranch}`)
        .then((res) => {
          if (!res.ok) {
            throw new Error("Failed to fetch directory contents")
          }
          return res.json()
        })
        .then((data) => {
          console.log("Directory contents loaded:", data.length, "files")
          setFiles(enhanceFilesWithCommitData(data))
        })
        .catch((err) => {
          console.error("Error loading directory:", err)
        })
    }
  }, [owner, repoName, currentBranch, currentPath])

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
  const handleCreateQubotCardClick = () => {
    setShowCreateForm(true)
  }

  const handleSaveQubotCard = async (formData: any) => {
    if (!owner || !repoName || !repo) return
    setLoading(true)
    try {
      const token = getUserToken()

      // Save config.json
      const configResponse = await fetch(`http://localhost:4000/api/repos/${owner}/${repoName}/contents/config.json`, {
        method: "PUT",
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
      navigate(`/${owner}/${repoName}/src/branch/${branch}/${newPath}`)
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
  // Handle file upload using your Gitea API
  const handleFileUpload = async (file: File, commitMessage: string, branch?: string) => {
    if (!owner || !repoName) return

    try {
      const token = getUserToken()

      // Read the file as a data URL using a Promise
      const fileDataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => {
          if (reader.result) {
            resolve(reader.result as string)
          } else {
            reject(new Error("Failed to read file."))
          }
        }
        reader.onerror = () => reject(reader.error)
        reader.readAsDataURL(file)
      })

      // Extract the Base64 part of the data URL (removing the "data:..." prefix)
      const base64Content = fileDataUrl.split(",")[1]

      // Determine the file path using currentPath (if any)
      const filePath = currentPath ? `${currentPath}/${file.name}` : file.name

      // Call your server's API to create/update the file using a PUT request
      const response = await fetch(`http://localhost:4000/api/repos/${owner}/${repoName}/contents/${filePath}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `token ${token}`,
        },
        body: JSON.stringify({
          content: base64Content,
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
        {/* Repository Header */}
        <div className="flex flex-col space-y-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Book className="h-5 w-5 text-muted-foreground" />
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
              <Badge variant="outline" className="ml-2">
                {repo.private ? "Private" : "Public"}
              </Badge>
            </div>
          </div>

          <div className="flex flex-wrap items-start justify-between gap-4">
            {/* Show Qubot description under repo name if available */}
            <p className="text-muted-foreground max-w">
              {config?.description || repo.description || "No description provided."}
            </p>
            <div className="flex gap-2 items-center ml-auto">
              <Button variant="outline" size="sm" className="h-8">
                <Star className="mr-1 h-4 w-4" />
                Star
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
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Code className="h-4 w-4" />
                    {config?.problem_name || "Qubot"}
                  </CardTitle>
                  
                </CardHeader>
                <CardContent>
                  {showCreateForm ? (
                    <div className="text-center py-4">
                      <p className="text-sm text-muted-foreground mb-4">
                        You're currently editing the Qubot Card in the main panel.
                      </p>
                    </div>
                  ) : config ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Badge variant={config.type === "problem" ? "default" : "secondary"}>{config.type}</Badge>
                      </div>
                      {config.keywords && config.keywords.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {config.keywords.slice(0, 10).map((keyword: string) => (
                            <Badge key={keyword} variant="outline" className="text-xs">
                              {keyword}
                            </Badge>
                          ))}
                          {config.keywords.length > 10 && (
                            <Badge variant="outline" className="text-xs">
                              +{config.keywords.length - 3} more
                            </Badge>
                          )}
                        </div>
                      )}

                      
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-sm text-muted-foreground mb-4">
                        No Qubot Card found.
                      </p>
                      <Button
                        onClick={() => {
                          setActiveTab("qubot")
                          setShowCreateForm(true)
                          navigate(`/${owner}/${repoName}`)
                        }}
                        size="sm"
                      >
                        Create Qubot Card
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Use with qubots button */}
              {config && (
                <Card className="mt-4">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Use with qubots library</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {/* Snippet block based on config.type */}
                    <div className="bg-muted rounded-md p-2 text-xs font-mono overflow-x-auto">
                      <code>
                        pip install qubots
                        <br />
                        {config.type === "problem" ? (
                          <>
                            from qubots import AutoProblem
                            <br />
                            problem = AutoProblem.from_repo("{repo.owner.login}/{repo.name}")
                          </>
                        ) : (
                          <>
                            from qubots import AutoOptimizer
                            <br />
                            optimizer = AutoOptimizer.from_repo("{repo.owner.login}/{repo.name}")
                          </>
                        )}
                      </code>
                    </div>

                    {/* Copy button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full mt-2 h-7 text-xs"
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
                    className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
                  >
                    <Code className="mr-2 h-4 w-4" />
                    Readme
                  </TabsTrigger>
                  <TabsTrigger
                    value="files"
                    className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Files
                  </TabsTrigger>
                  <TabsTrigger
                    value="others"
                    className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
                  >
                    <GitBranch className="mr-2 h-4 w-4" />
                    Other Qubots
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
                    defaultBranch={currentBranch || repo.default_branch || "main"}
                    path={currentPath}
                    className="w-full"
                    onAddFile={() => setShowFileUploadDialog(true)}
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
                      className="w-full h-full"
                    />
                  </div>
                )}
              </TabsContent>

              {/* Other Qubots Tab */}
              <TabsContent value="others" className="mt-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {otherQubots.map((qb) => (
                    <Card key={qb.id} className="overflow-hidden">
                      <CardHeader className="pb-2">
                        <CardTitle>{qb.title}</CardTitle>
                        <CardDescription>{qb.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="h-24 bg-muted rounded-md mb-4 flex items-center justify-center">
                          <Code className="h-8 w-8 text-muted-foreground opacity-50" />
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Learn more about {qb.title} and how it can help optimize your projects.
                        </p>
                      </CardContent>
                      <CardFooter>
                        <Button size="sm">View Details</Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
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
    </Layout>
  )
}


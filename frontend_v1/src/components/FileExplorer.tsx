"use client"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  FileCode,
  FileJson,
  FileText,
  Folder,
  FolderOpen,
  GitBranch,
  GitCommit,
  History,
  Package,
  Plus,
  Search,
  ArrowLeft,
  X,
} from "lucide-react"

const API = import.meta.env.VITE_API_BASE;


interface FileExplorerProps {
  files: any[]
  onFileClick: (file: any) => void
  defaultBranch: string
  path?: string
  className?: string
  onAddFile?: () => void
  onNavigateToParent?: () => void
  onGoToFile?: (path: any) => void
  isLoading?: boolean
  allRepoFiles?: any[]
  repoOwner: string
  repoName: string
}

interface FileRowProps {
  name: string
  type: string
  lastCommit: string
  timeAgo: string
  size?: number
  onClick?: () => void
}

// Add a new interface for search results
interface SearchResult {
  name: string
  path: string
  type: string
}

// Function to determine the appropriate icon for a file based on its name/extension
const getFileIcon = (fileName: string) => {
  if (fileName.endsWith(".md")) return <FileText className="h-4 w-4 text-blue-500" />
  if (fileName.endsWith(".json")) return <FileJson className="h-4 w-4 text-yellow-500" />
  if (fileName.endsWith(".py")) return <FileCode className="h-4 w-4 text-green-500" />
  if (fileName.endsWith(".js") || fileName.endsWith(".ts") || fileName.endsWith(".tsx"))
    return <FileCode className="h-4 w-4 text-yellow-400" />
  if (fileName === "package.json" || fileName === "requirements.txt")
    return <Package className="h-4 w-4 text-red-500" />
  return <FileCode className="h-4 w-4 text-muted-foreground" />
}

// Format file size to human-readable format
const formatFileSize = (bytes?: number) => {
  if (!bytes) return ""
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// Format date to relative time (e.g., "2 days ago")
const formatRelativeTime = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) return "just now"
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 604800)} weeks ago`

  return date.toLocaleDateString()
}

function FileRow({ name, type, lastCommit, timeAgo, onClick, size }: FileRowProps & { size?: number }) {
  return (
    <tr onClick={onClick} className="cursor-pointer hover:bg-muted/50 transition-colors">
      <td className="py-2 px-4">
        <div className="flex items-center gap-2">
          {type === "dir" ? <Folder className="h-4 w-4 text-muted-foreground" /> : getFileIcon(name)}
          <span className={type === "dir" ? "font-medium" : ""}>{name}</span>
        </div>
      </td>
      <td className="py-2 px-4 hidden md:table-cell text-sm text-muted-foreground">{lastCommit || "No commit data"}</td>
      <td className="py-2 px-4 text-right text-sm text-muted-foreground">
        {type === "dir" ? "-" : formatFileSize(size)}
      </td>
    </tr>
  )
}

// Update the FileExplorer component to include search functionality
export default function FileExplorer({
  files,
  onFileClick,
  defaultBranch,
  path = "",
  className = "",
  onAddFile,
  onNavigateToParent,
  onGoToFile,
  isLoading = false,
  allRepoFiles = [],
  repoOwner,
  repoName,
}: FileExplorerProps) {
  // Add state for search
  const [isSearchExpanded, setIsSearchExpanded] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Add state for commit history
  const [commitHistory, setCommitHistory] = useState<any>(null)
  const [isCommitLoading, setIsCommitLoading] = useState(false)

  // Sort files: directories first, then files alphabetically
  const sortedFiles = [...files].sort((a, b) => {
    if (a.type === "dir" && b.type !== "dir") return -1
    if (a.type !== "dir" && b.type === "dir") return 1
    return a.name.localeCompare(b.name)
  })

  // Focus search input when expanded
  useEffect(() => {
    if (isSearchExpanded && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [isSearchExpanded])

  // Fetch commit history
  useEffect(() => {
    const fetchCommitHistory = async () => {
      if (!repoOwner || !repoName) return

      setIsCommitLoading(true)
      try {
        const token = localStorage.getItem("gitea_token")
        const response = await fetch(`${API}/repos/${repoOwner}/${repoName}/commits?limit=1`, {
          headers: {
            Authorization: `token ${token}`,
          },
        })

        if (!response.ok) {
          console.error(`Error fetching commits: ${response.status} ${response.statusText}`)
          const errorText = await response.text()
          console.error("Error response:", errorText)
          setCommitHistory(null)
          return
        }

        const data = await response.json()
        setCommitHistory(data.length > 0 ? data[0] : null)
      } catch (error) {
        console.error("Error fetching commit history:", error)
        setCommitHistory(null)
      } finally {
        setIsCommitLoading(false)
      }
    }
    
    fetchCommitHistory()
  }, [repoOwner, repoName])

  // Handle search
  const handleSearch = (term: string) => {
    setSearchTerm(term)

    if (!term.trim()) {
      setSearchResults([])
      return
    }

    const lowerTerm = term.toLowerCase()

    // First search in current directory
    const localResults = sortedFiles
      .filter((file) => file.name.toLowerCase().includes(lowerTerm))
      .map((file) => ({
        name: file.name,
        path: path ? `${path}/${file.name}` : file.name,
        type: file.type,
      }))

    // Then search in all repo files if provided
    const globalResults = allRepoFiles
      .filter(
        (file) =>
          (file.name.toLowerCase().includes(lowerTerm) || (file.path && file.path.toLowerCase().includes(lowerTerm))) &&
          // Exclude files that are already in local results
          !localResults.some((local) => local.path === file.path),
      )
      .map((file) => ({
        name: file.name,
        path: file.path || file.name,
        type: file.type,
      }))

    setSearchResults([...localResults, ...globalResults])
  }

  // Handle file selection from search results
  const handleSearchResultClick = (result: SearchResult) => {
    // Find the file in the current directory or all repo files
    const fileInCurrentDir = sortedFiles.find((f) => (path ? `${path}/${f.name}` : f.name) === result.path)

    if (fileInCurrentDir) {
      onFileClick(fileInCurrentDir)
    } else {
      // For files outside current directory, use the onGoToFile callback
      if (onGoToFile) {
        onGoToFile(result.path)
      }
    }

    // Reset search
    setSearchTerm("")
    setIsSearchExpanded(false)
    setSearchResults([])
  }

  // Close search
  const handleCloseSearch = () => {
    setIsSearchExpanded(false)
    setSearchTerm("")
    setSearchResults([])
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Directory navigation header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          

          {path && (
            <Button variant="outline" size="sm" onClick={onNavigateToParent} className="h-8">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          )}

          
        </div>
        <div className="flex gap-2">
          {isSearchExpanded ? (
            <div className="relative flex-grow max-w-md">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                ref={searchInputRef}
                placeholder="Search for files..."
                className="pl-9 pr-9 h-8"
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-8 w-8"
                onClick={handleCloseSearch}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Button variant="outline" size="sm" className="h-8" onClick={() => setIsSearchExpanded(true)}>
              <Search className="mr-2 h-4 w-4" />
              Go to file
            </Button>
          )}
          <Button size="sm" className="h-8" onClick={onAddFile}>
            <Plus className="mr-2 h-4 w-4" />
            Add file
          </Button>
        </div>
      </div>

      {/* Search Results */}
      {isSearchExpanded && searchResults.length > 0 && (
        <Card className="absolute z-10 mt-1 right-4 w-full max-w-md">
          <ScrollArea className="max-h-80">
            <div className="p-2 space-y-1">
              {searchResults.map((result, index) => (
                <Button
                  key={`${result.path}-${index}`}
                  variant="ghost"
                  className="w-full justify-start text-sm font-normal"
                  onClick={() => handleSearchResultClick(result)}
                >
                  <div className="flex items-center gap-2 truncate">
                    {result.type === "dir" ? (
                      <Folder className="h-4 w-4 text-muted-foreground" />
                    ) : result.name.endsWith(".md") ? (
                      <FileText className="h-4 w-4 text-blue-500" />
                    ) : result.name.endsWith(".json") ? (
                      <FileJson className="h-4 w-4 text-yellow-500" />
                    ) : result.name.endsWith(".py") ? (
                      <FileCode className="h-4 w-4 text-green-500" />
                    ) : result.name.endsWith(".js") || result.name.endsWith(".ts") || result.name.endsWith(".tsx") ? (
                      <FileCode className="h-4 w-4 text-yellow-400" />
                    ) : (
                      <FileCode className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className="truncate">{result.path}</span>
                  </div>
                </Button>
              ))}
            </div>
          </ScrollArea>
        </Card>
      )}

      {/* Current directory indicator */}
      {path && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <FolderOpen className="h-4 w-4" />
          <span>
            Current directory: <span className="font-medium">{path.split("/").pop()}</span>
          </span>
        </div>
      )}

      <Card>
        <CardHeader className="py-3 px-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="h-4 w-4 text-muted-foreground" />
              {isCommitLoading ? (
                <span className="text-sm">Loading commit history...</span>
              ) : commitHistory ? (
                <span className="text-sm">
                  <span className="font-medium">{commitHistory.commit.message}</span>
                  {" by "}
                  {commitHistory.author?.login || commitHistory.commit.author.name}
                </span>
              ) : (
                <span className="text-sm">No commit history available</span>
              )}
            </div>
            <div className="text-sm text-muted-foreground">
              {commitHistory && (
                <code className="px-1 py-0.5 bg-muted rounded text-xs">{commitHistory.sha.substring(0, 10)}</code>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="py-8 text-center">
              <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
              <p className="mt-2 text-sm text-muted-foreground">Loading directory contents...</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr className="text-left text-xs text-muted-foreground">
                  <th className="py-2 px-4 font-medium">Name</th>
                  <th className="py-2 px-4 font-medium hidden md:table-cell">Last commit</th>
                  <th className="py-2 px-4 font-medium text-right">Size</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {sortedFiles.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-muted-foreground">
                      This directory is empty.
                    </td>
                  </tr>
                ) : (
                  sortedFiles.map((file) => (
                    <FileRow
                      key={file.sha || file.name}
                      name={file.name}
                      type={file.type}
                      lastCommit={file.commit?.message || "Initial commit"}
                      timeAgo={file.commit?.date ? formatRelativeTime(file.commit.date) : ""}
                      size={file.size}
                      onClick={() => onFileClick(file)}
                    />
                  ))
                )}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


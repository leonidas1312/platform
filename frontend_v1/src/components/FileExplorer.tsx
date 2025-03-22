"use client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { FileCode, FileJson, FileText, Folder, GitBranch, GitCommit, History, Package, Plus, Search } from 'lucide-react'

interface FileExplorerProps {
  files: any[]
  onFileClick: (file: any) => void
  defaultBranch: string
  path?: string
  className?: string
  onAddFile?: () => void
}

interface FileRowProps {
  name: string
  type: string
  lastCommit: string
  timeAgo: string
  size?: number
  onClick?: () => void
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
          {type === "dir" ? (
            <Folder className="h-4 w-4 text-muted-foreground" />
          ) : type === "markdown" ? (
            <FileText className="h-4 w-4 text-muted-foreground" />
          ) : (
            <FileCode className="h-4 w-4 text-muted-foreground" />
          )}
          <span className={type === "dir" ? "font-medium" : ""}>{name}</span>
        </div>
      </td>
      <td className="py-2 px-4 hidden md:table-cell text-sm text-muted-foreground">
        {lastCommit}
      </td>
      <td className="py-2 px-4 text-right text-sm text-muted-foreground">
        {type === "folder" ? "-" : formatFileSize(size)}
      </td>
    </tr>
  );
}


export default function FileExplorer({
  files,
  onFileClick,
  defaultBranch,
  path = "",
  className = "",
  onAddFile,
}: FileExplorerProps) {
  // Sort files: directories first, then files alphabetically
  const sortedFiles = [...files].sort((a, b) => {
    if (a.type === "dir" && b.type !== "dir") return -1
    if (a.type !== "dir" && b.type === "dir") return 1
    return a.name.localeCompare(b.name)
  })

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8">
            <GitBranch className="mr-2 h-4 w-4" />
            {defaultBranch}
          </Button>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" className="text-xs text-muted-foreground">
                  <GitCommit className="mr-1 h-3 w-3" />
                  <span className="hidden sm:inline">Latest commit</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>View commit history</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="h-8">
            <Search className="mr-2 h-4 w-4" />
            Go to file
          </Button>
          <Button size="sm" className="h-8" onClick={onAddFile}>
            <Plus className="mr-2 h-4 w-4" />
            Add file
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="py-3 px-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                <span className="font-medium">Last commit</span> 2 days ago
              </span>
            </div>
            <div className="text-sm text-muted-foreground">
              <code className="px-1 py-0.5 bg-muted rounded text-xs">a1b2c3d</code>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
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
                    This repository is empty. Create a file to get started.
                  </td>
                </tr>
              ) : (
                sortedFiles.map((file) => (
                  <FileRow
                    key={file.sha || file.name}
                    name={file.name}
                    type={file.type === "dir" ? "folder" : file.name.endsWith(".md") ? "markdown" : "file"}
                    lastCommit={file.commit?.message || "Initial commit"}
                    timeAgo={file.commit?.date ? formatRelativeTime(file.commit.date) : ""}
                    size={file.size}
                    onClick={() => onFileClick(file)}
                  />
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}

"use client"

import { useState, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Folder,
  File,
  Plus,
  Search,
  GitBranch,
  Clock,
  User,
  ChevronDown,
  History
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { getFileTypeInfo, getFolderIcon } from "./FileTypeIcons"
import { formatFileSize, formatRelativeTime } from "./FileTreeUtils"
import { cn } from "@/lib/utils"

interface FileItem {
  name: string
  type: 'file' | 'dir'
  size?: number
  path: string
  sha?: string
  commit?: {
    message: string
    date: string
    author?: string
    authorAvatar?: string | null
    sha?: string
  }
}

interface GitHubStyleFileExplorerProps {
  files: FileItem[]
  onFileClick: (file: FileItem) => void
  onAddFile?: () => void
  path?: string
  branch?: string
  branches?: string[]
  onBranchChange?: (branch: string) => void
  className?: string
  repositoryName?: string
  repositoryOwner?: string
  commitCount?: number
  lastCommit?: {
    message: string
    sha: string
    author: string
    authorAvatar?: string | null
    date: string
  }
}

export default function GitHubStyleFileExplorer({
  files,
  onFileClick,
  onAddFile,
  path = "",
  branch = "main",
  branches = [],
  onBranchChange,
  className,
  repositoryName,
  repositoryOwner,
  commitCount,
  lastCommit
}: GitHubStyleFileExplorerProps) {
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set())

  // Sort files: directories first, then files, both alphabetically
  const sortedFiles = useMemo(() => {
    return [...files].sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === 'dir' ? -1 : 1
      }
      return a.name.localeCompare(b.name)
    })
  }, [files])

  // Build breadcrumb path
  const breadcrumbs = useMemo(() => {
    if (!path) return []
    return path.split('/').filter(Boolean)
  }, [path])

  const handleFileSelect = (fileName: string, isSelected: boolean) => {
    const newSelected = new Set(selectedFiles)
    if (isSelected) {
      newSelected.add(fileName)
    } else {
      newSelected.delete(fileName)
    }
    setSelectedFiles(newSelected)
  }

  const renderFileIcon = (file: FileItem) => {
    if (file.type === 'dir') {
      return <Folder className="h-4 w-4 text-blue-500" />
    }
    const fileInfo = getFileTypeInfo(file.name)
    return <span className={fileInfo.color}>{fileInfo.icon}</span>
  }

  const renderCommitMessage = (file: FileItem) => {
    if (!file.commit) {
      return <span className="text-muted-foreground text-sm">-</span>
    }

    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        {file.commit.authorAvatar ? (
          <img
            src={file.commit.authorAvatar}
            alt={file.commit.author || 'Author'}
            className="w-4 h-4 rounded-full flex-shrink-0"
          />
        ) : (
          <User className="h-3 w-3 text-muted-foreground flex-shrink-0" />
        )}
        <span className="truncate max-w-[250px]" title={file.commit.message}>
          {file.commit.message}
        </span>
      </div>
    )
  }

  const handleNavigation = (file: FileItem) => {
    if (file.type === 'dir') {
      // For directories, we want to navigate into them
      const newPath = path ? `${path}/${file.name}` : file.name
      onFileClick({ ...file, path: newPath })
    } else {
      // For files, open them
      onFileClick(file)
    }
  }

  return (
    <div className={cn("w-full", className)}>
      {/* Repository Header */}
      <div className="border border-border rounded-t-lg bg-muted/30 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Branch Selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-2">
                  <GitBranch className="h-3 w-3" />
                  <span className="font-medium">{branch}</span>
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {branches.length > 0 ? (
                  branches.map((branchName) => (
                    <DropdownMenuItem
                      key={branchName}
                      onClick={() => onBranchChange?.(branchName)}
                    >
                      {branchName}
                    </DropdownMenuItem>
                  ))
                ) : (
                  <DropdownMenuItem disabled>
                    No branches available
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Breadcrumb Navigation */}
            <div className="flex items-center gap-1 text-sm">
              <Button
                variant="link"
                size="sm"
                className="h-auto p-0 font-semibold text-blue-600 hover:text-blue-800 hover:underline"
                onClick={() => onFileClick({ name: '', type: 'dir', path: '' })}
              >
                {repositoryName || 'repository'}
              </Button>
              {breadcrumbs.map((crumb, index) => (
                <div key={index} className="flex items-center gap-1">
                  <span className="text-muted-foreground">/</span>
                  <Button
                    variant="link"
                    size="sm"
                    className="h-auto p-0 font-semibold text-blue-600 hover:text-blue-800 hover:underline"
                    onClick={() => {
                      const newPath = breadcrumbs.slice(0, index + 1).join('/')
                      onFileClick({ name: crumb, type: 'dir', path: newPath })
                    }}
                  >
                    {crumb}
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onAddFile && (
              <Button variant="outline" size="sm" onClick={onAddFile} className="h-8 gap-2">
                <Plus className="h-3 w-3" />
                Add file
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Last Commit Info */}
      {lastCommit && (
        <div className="border-x border-border bg-background px-4 py-2 text-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {lastCommit.authorAvatar ? (
                <img
                  src={lastCommit.authorAvatar}
                  alt={lastCommit.author}
                  className="w-4 h-4 rounded-full flex-shrink-0"
                />
              ) : (
                <User className="h-3 w-3 text-muted-foreground" />
              )}
              <span className="font-medium">{lastCommit.author}</span>
              <span className="text-muted-foreground truncate max-w-[350px]">
                {lastCommit.message}
              </span>
            </div>
            <div className="flex items-center gap-4 text-muted-foreground">
              <span>{formatRelativeTime(lastCommit.date)}</span>
              <Button variant="link" size="sm" className="h-auto p-0 gap-1">
                <History className="h-3 w-3" />
                {commitCount || 0} commits
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* File List */}
      <Card className="rounded-t-none border-t-0">
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {sortedFiles.map((file, index) => (
              <div
                key={file.path || file.name}
                className="flex items-center gap-3 px-4 py-2 hover:bg-muted/50 cursor-pointer transition-colors group"
                onClick={() => handleNavigation(file)}
              >
                {/* File Icon and Name */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {renderFileIcon(file)}
                  <span className="font-medium text-sm truncate text-blue-600 hover:text-blue-800">
                    {file.name}
                  </span>
                </div>

                {/* Commit Message */}
                <div className="flex-1 min-w-0 hidden md:block">
                  {renderCommitMessage(file)}
                </div>

                {/* Last Modified */}
                <div className="text-sm text-muted-foreground text-right min-w-[100px] hidden sm:block">
                  {file.commit?.date ? formatRelativeTime(file.commit.date) : '-'}
                </div>
              </div>
            ))}
          </div>

          {/* Empty State */}
          {sortedFiles.length === 0 && (
            <div className="p-8 text-center">
              <Folder className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground">This directory is empty</p>
              {onAddFile && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onAddFile}
                  className="mt-4 gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add your first file
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

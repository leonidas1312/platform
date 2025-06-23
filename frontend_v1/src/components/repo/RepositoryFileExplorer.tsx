"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Search,
  Filter,
  Plus,
  ArrowUp,
  Clock,
  User,
  FileText,
  Loader2,
  SortAsc,
  SortDesc,
  Grid,
  List,
  TreePine
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from "@/components/ui/dropdown-menu"
import { getFileTypeInfo, getFolderIcon, isNotebook, isQubotConfig } from "./FileTypeIcons"
import { formatFileSize, formatRelativeTime } from "./FileTreeUtils"
import { cn } from "@/lib/utils"
import EnhancedFileTree from "./EnhancedFileTree"

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
  }
}

interface RepositoryFileExplorerProps {
  files: FileItem[]
  onFileClick: (file: FileItem) => void
  onAddFile?: () => void
  onNavigateToParent?: () => void
  path?: string
  isLoading?: boolean
  className?: string
}

type SortField = 'name' | 'type' | 'size' | 'modified'
type SortOrder = 'asc' | 'desc'
type ViewMode = 'list' | 'grid' | 'tree'

export default function RepositoryFileExplorer({
  files,
  onFileClick,
  onAddFile,
  onNavigateToParent,
  path = "",
  isLoading = false,
  className
}: RepositoryFileExplorerProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [sortField, setSortField] = useState<SortField>('type')
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc')
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [filterType, setFilterType] = useState<string>('all')
  const [useEnhancedTree, setUseEnhancedTree] = useState(false)

  // Filter and sort files
  const processedFiles = useMemo(() => {
    let filtered = files.filter(file => {
      // Search filter
      if (searchTerm && !file.name.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false
      }

      // Type filter
      if (filterType !== 'all') {
        if (filterType === 'folders' && file.type !== 'dir') return false
        if (filterType === 'notebooks' && !isNotebook(file.name)) return false
        if (filterType === 'qubot' && !isQubotConfig(file.name)) return false
        if (filterType === 'code') {
          const info = getFileTypeInfo(file.name)
          if (info.category !== 'code') return false
        }
      }

      return true
    })

    // Sort files
    filtered.sort((a, b) => {
      let comparison = 0

      switch (sortField) {
        case 'name':
          comparison = a.name.localeCompare(b.name)
          break
        case 'type':
          // Directories first, then by name
          if (a.type !== b.type) {
            comparison = a.type === 'dir' ? -1 : 1
          } else {
            comparison = a.name.localeCompare(b.name)
          }
          break
        case 'size':
          comparison = (a.size || 0) - (b.size || 0)
          break
        case 'modified':
          const aDate = a.commit?.date ? new Date(a.commit.date) : new Date(0)
          const bDate = b.commit?.date ? new Date(b.commit.date) : new Date(0)
          comparison = aDate.getTime() - bDate.getTime()
          break
      }

      return sortOrder === 'asc' ? comparison : -comparison
    })

    return filtered
  }, [files, searchTerm, sortField, sortOrder, filterType])

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '-'
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`
  }

  const formatRelativeTime = (dateString?: string) => {
    if (!dateString) return 'No commit data'
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return 'Invalid date'
      return formatDistanceToNow(date, { addSuffix: true })
    } catch {
      return 'Invalid date'
    }
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('asc')
    }
  }

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return null
    return sortOrder === 'asc' ? <SortAsc className="h-3 w-3" /> : <SortDesc className="h-3 w-3" />
  }

  if (isLoading) {
    return (
      <Card className={cn("border-border/60", className)}>
        <CardContent className="p-8 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
          <p className="mt-4 text-muted-foreground">Loading files...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn("border-border/60 overflow-hidden shadow-sm", className)}>
      <CardHeader className="pb-4 bg-gradient-to-r from-background via-background/80 to-primary/5 border-b border-border/30">
        {/* Header controls */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 flex-1">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search files..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-9"
              />
            </div>

            {/* Filter dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-9">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                  {filterType !== 'all' && (
                    <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-xs">
                      1
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Filter by type</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setFilterType('all')}>
                  All files
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterType('folders')}>
                  Folders only
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterType('code')}>
                  Code files
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterType('notebooks')}>
                  Jupyter notebooks
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterType('qubot')}>
                  Qubot configs
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex items-center gap-2">
            {/* View mode toggle */}
            <div className="flex items-center border border-border/40 rounded-md">
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="h-8 px-3 rounded-r-none"
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'tree' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('tree')}
                className="h-8 px-3 rounded-none border-l border-border/40"
                title="Tree view"
              >
                <TreePine className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="h-8 px-3 rounded-l-none border-l border-border/40"
              >
                <Grid className="h-4 w-4" />
              </Button>
            </div>

            
          </div>
        </div>

        {/* File count and stats */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {processedFiles.length} {processedFiles.length === 1 ? 'item' : 'items'}
            {searchTerm && ` matching "${searchTerm}"`}
          </span>
          {path && onNavigateToParent && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onNavigateToParent}
              className="h-7 text-xs"
            >
              <ArrowUp className="h-3 w-3 mr-1" />
              Parent directory
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {processedFiles.length === 0 ? (
          <div className="p-8 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground">
              {searchTerm ? `No files found matching "${searchTerm}"` : "This directory is empty"}
            </p>
          </div>
        ) : viewMode === 'tree' ? (
          <EnhancedFileTree
            files={files}
            onFileClick={onFileClick}
            onDirectoryClick={(dirPath) => {
              // Handle directory navigation
              console.log('Directory clicked:', dirPath)
            }}
            onAddFile={onAddFile}
            onNavigateToParent={onNavigateToParent}
            path={path}
            isLoading={isLoading}
            className="border-0 shadow-none"
          />
        ) : viewMode === 'list' ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/30 border-b border-border/30">
                <tr className="text-xs text-muted-foreground">
                  <th className="text-left p-3 font-medium">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort('name')}
                      className="h-6 px-0 font-medium text-muted-foreground hover:text-foreground"
                    >
                      Name
                      {getSortIcon('name')}
                    </Button>
                  </th>
                  <th className="text-left p-3 font-medium">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort('modified')}
                      className="h-6 px-0 font-medium text-muted-foreground hover:text-foreground"
                    >
                      Last modified
                      {getSortIcon('modified')}
                    </Button>
                  </th>
                  <th className="text-right p-3 font-medium">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort('size')}
                      className="h-6 px-0 font-medium text-muted-foreground hover:text-foreground"
                    >
                      Size
                      {getSortIcon('size')}
                    </Button>
                  </th>
                </tr>
              </thead>
              <tbody>
                {processedFiles.map((file, index) => {
                  const fileInfo = file.type === 'dir' ? getFolderIcon() : getFileTypeInfo(file.name)

                  return (
                    <tr
                      key={file.sha || file.name}
                      className="border-b border-border/20 hover:bg-muted/30 cursor-pointer transition-colors"
                      onClick={() => onFileClick(file)}
                    >
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          <span className={fileInfo.color}>
                            {fileInfo.icon}
                          </span>
                          <span className="font-medium text-sm">{file.name}</span>
                          {isNotebook(file.name) && (
                            <Badge variant="outline" className="text-xs bg-orange-500/10 text-orange-600 border-orange-200">
                              Notebook
                            </Badge>
                          )}
                          {isQubotConfig(file.name) && (
                            <Badge variant="outline" className="text-xs bg-purple-500/10 text-purple-600 border-purple-200">
                              Qubot
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="p-3 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Clock className="h-3 w-3" />
                          <span title={file.commit?.date ? new Date(file.commit.date).toLocaleString() : 'No commit data available'}>
                            {formatRelativeTime(file.commit?.date)}
                          </span>
                        </div>
                      </td>
                      <td className="p-3 text-sm text-muted-foreground text-right">
                        {file.type === 'dir' ? '-' : formatFileSize(file.size)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          // Grid view implementation would go here
          <div className="p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {processedFiles.map((file) => {
              const fileInfo = file.type === 'dir' ? getFolderIcon() : getFileTypeInfo(file.name)

              return (
                <Card
                  key={file.sha || file.name}
                  className="p-4 cursor-pointer hover:shadow-md transition-all border-border/40"
                  onClick={() => onFileClick(file)}
                >
                  <div className="flex flex-col items-center text-center space-y-2">
                    <span className={cn(fileInfo.color, "text-2xl")}>
                      {fileInfo.icon}
                    </span>
                    <span className="text-sm font-medium truncate w-full" title={file.name}>
                      {file.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {file.type === 'dir' ? 'Folder' : formatFileSize(file.size)}
                    </span>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

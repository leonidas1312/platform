"use client"

import { useState, useMemo, useCallback, useEffect } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Search,
  ChevronRight,
  ChevronDown,
  Plus,
  ArrowUp,
  Clock,
  Loader2,
  Eye,
  EyeOff,
  Grid,
  List,
  SortAsc,
  SortDesc
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
import { 
  FileItem, 
  TreeNode, 
  buildFileTree, 
  flattenTree, 
  toggleNodeExpansion, 
  expandToPath,
  filterTree,
  getTreeStats,
  formatFileSize,
  formatRelativeTime
} from "./FileTreeUtils"
import { cn } from "@/lib/utils"
import { FileErrorHandler, FileError, createEmptyDirectoryError } from "./FileErrorHandler"

interface EnhancedFileTreeProps {
  files: FileItem[]
  onFileClick: (file: FileItem) => void
  onDirectoryClick?: (path: string) => void
  onAddFile?: () => void
  onNavigateToParent?: () => void
  path?: string
  isLoading?: boolean
  className?: string
  showHidden?: boolean
  defaultExpanded?: string[]
  error?: FileError
  onRetry?: () => void
}

type ViewMode = 'tree' | 'list'
type SortField = 'name' | 'type' | 'size' | 'modified'
type SortOrder = 'asc' | 'desc'

export default function EnhancedFileTree({
  files,
  onFileClick,
  onDirectoryClick,
  onAddFile,
  onNavigateToParent,
  path = "",
  isLoading = false,
  className,
  showHidden = false,
  defaultExpanded = [],
  error,
  onRetry
}: EnhancedFileTreeProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [viewMode, setViewMode] = useState<ViewMode>('tree')
  const [sortField, setSortField] = useState<SortField>('type')
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc')
  const [showHiddenFiles, setShowHiddenFiles] = useState(showHidden)
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set(defaultExpanded))

  // Build tree structure from files
  const fileTree = useMemo(() => {
    const tree = buildFileTree(files, path)
    
    // Restore expansion state
    function restoreExpansion(nodes: TreeNode[]): TreeNode[] {
      return nodes.map(node => ({
        ...node,
        isExpanded: expandedPaths.has(node.path),
        children: node.children ? restoreExpansion(node.children) : undefined
      }))
    }
    
    return restoreExpansion(tree)
  }, [files, path, expandedPaths])

  // Apply search filter
  const filteredTree = useMemo(() => {
    if (!searchTerm.trim()) return fileTree
    return filterTree(fileTree, searchTerm)
  }, [fileTree, searchTerm])

  // Flatten tree for display
  const displayNodes = useMemo(() => {
    const flattened = flattenTree(filteredTree, showHiddenFiles)
    
    // Apply sorting
    return flattened.sort((a, b) => {
      let comparison = 0
      
      switch (sortField) {
        case 'name':
          comparison = a.name.localeCompare(b.name)
          break
        case 'type':
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
          const aDate = a.commit?.date ? new Date(a.commit.date).getTime() : 0
          const bDate = b.commit?.date ? new Date(b.commit.date).getTime() : 0
          comparison = bDate - aDate // Most recent first
          break
      }
      
      return sortOrder === 'asc' ? comparison : -comparison
    })
  }, [filteredTree, showHiddenFiles, sortField, sortOrder])

  // Get tree statistics
  const treeStats = useMemo(() => getTreeStats(fileTree), [fileTree])

  // Handle node expansion
  const handleToggleExpansion = useCallback((nodePath: string) => {
    setExpandedPaths(prev => {
      const newSet = new Set(prev)
      if (newSet.has(nodePath)) {
        newSet.delete(nodePath)
      } else {
        newSet.add(nodePath)
      }
      return newSet
    })
  }, [])

  // Handle file/directory click
  const handleNodeClick = useCallback((node: TreeNode) => {
    if (node.type === 'dir') {
      handleToggleExpansion(node.path)
      onDirectoryClick?.(node.path)
    } else {
      // Convert TreeNode back to FileItem for compatibility
      const fileItem: FileItem = {
        name: node.name,
        type: node.type,
        size: node.size,
        path: node.path,
        sha: node.sha,
        commit: node.commit
      }
      onFileClick(fileItem)
    }
  }, [handleToggleExpansion, onDirectoryClick, onFileClick])

  // Handle sorting
  const handleSort = useCallback((field: SortField) => {
    if (sortField === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('asc')
    }
  }, [sortField])

  // Get sort icon
  const getSortIcon = useCallback((field: SortField) => {
    if (sortField !== field) return null
    return sortOrder === 'asc' ? 
      <SortAsc className="h-3 w-3 ml-1" /> : 
      <SortDesc className="h-3 w-3 ml-1" />
  }, [sortField, sortOrder])

  // Render tree node
  const renderTreeNode = useCallback((node: TreeNode) => {
    const fileInfo = node.type === 'dir' ? getFolderIcon() : getFileTypeInfo(node.name)
    const indentLevel = viewMode === 'tree' ? node.depth : 0
    const hasChildren = node.type === 'dir' && node.children && node.children.length > 0
    const isExpanded = expandedPaths.has(node.path)

    return (
      <div
        key={node.path}
        className="flex items-center gap-2 p-2 hover:bg-muted/50 cursor-pointer transition-colors group"
        style={{ paddingLeft: `${indentLevel * 20 + 8}px` }}
        onClick={() => handleNodeClick(node)}
      >
        {/* Expansion toggle for directories */}
        {node.type === 'dir' && (
          <Button
            variant="ghost"
            size="sm"
            className="h-4 w-4 p-0 hover:bg-transparent"
            onClick={(e) => {
              e.stopPropagation()
              handleToggleExpansion(node.path)
            }}
          >
            {hasChildren ? (
              isExpanded ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )
            ) : (
              <div className="h-3 w-3" />
            )}
          </Button>
        )}

        {/* File/folder icon */}
        <span className={cn("flex-shrink-0", fileInfo.color)}>
          {fileInfo.icon}
        </span>

        {/* File/folder name */}
        <span className="font-medium text-sm truncate flex-1">
          {node.name}
        </span>

        {/* Badges */}
        <div className="flex items-center gap-1">
          {isNotebook(node.name) && (
            <Badge variant="outline" className="text-xs bg-orange-500/10 text-orange-600 border-orange-200">
              Notebook
            </Badge>
          )}
          {isQubotConfig(node.name) && (
            <Badge variant="outline" className="text-xs bg-purple-500/10 text-purple-600 border-purple-200">
              Qubot
            </Badge>
          )}
        </div>

        {/* File metadata */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
          {node.commit?.date && (
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{formatRelativeTime(node.commit.date)}</span>
            </div>
          )}
          <span className="min-w-[60px] text-right">
            {node.type === 'dir' ? '-' : formatFileSize(node.size)}
          </span>
        </div>
      </div>
    )
  }, [viewMode, expandedPaths, handleNodeClick, handleToggleExpansion])

  // Handle error state
  if (error) {
    return (
      <FileErrorHandler
        error={error}
        onRetry={onRetry}
        onGoBack={onNavigateToParent}
        className={cn("w-full", className)}
      />
    )
  }

  // Handle loading state
  if (isLoading) {
    return (
      <Card className={cn("w-full", className)}>
        <CardContent className="p-8 text-center">
          <Loader2 className="animate-spin w-8 h-8 mx-auto text-muted-foreground" />
          <p className="mt-4 text-muted-foreground">Loading files...</p>
        </CardContent>
      </Card>
    )
  }

  // Handle empty directory
  if (files.length === 0 && !searchTerm) {
    return (
      <FileErrorHandler
        error={createEmptyDirectoryError()}
        onGoBack={onNavigateToParent}
        className={cn("w-full", className)}
      />
    )
  }

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Navigation */}
            {onNavigateToParent && path && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onNavigateToParent}
                className="h-8"
              >
                <ArrowUp className="h-4 w-4 mr-2" />
                Back
              </Button>
            )}

            {/* Stats */}
            <div className="text-sm text-muted-foreground">
              {treeStats.totalDirectories} folders, {treeStats.totalFiles} files
              {treeStats.totalSize > 0 && ` • ${formatFileSize(treeStats.totalSize)}`}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search files..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 h-8 w-48"
              />
            </div>

            {/* View mode toggle */}
            <div className="flex border rounded-md">
              <Button
                variant={viewMode === 'tree' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('tree')}
                className="h-8 px-3"
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="h-8 px-3"
              >
                <Grid className="h-4 w-4" />
              </Button>
            </div>

            {/* Options menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8">
                  <span className="sr-only">Options</span>
                  ⋮
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>View Options</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => setShowHiddenFiles(!showHiddenFiles)}>
                  {showHiddenFiles ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                  {showHiddenFiles ? 'Hide' : 'Show'} hidden files
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Sort by</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => handleSort('name')}>
                  Name {getSortIcon('name')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleSort('type')}>
                  Type {getSortIcon('type')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleSort('size')}>
                  Size {getSortIcon('size')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleSort('modified')}>
                  Modified {getSortIcon('modified')}
                </DropdownMenuItem>
                {onAddFile && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={onAddFile}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add file
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {displayNodes.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-muted-foreground">
              {searchTerm ? `No files found matching "${searchTerm}"` : "This directory is empty"}
            </div>
          </div>
        ) : (
          <div className="max-h-[600px] overflow-y-auto">
            {displayNodes.map(renderTreeNode)}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

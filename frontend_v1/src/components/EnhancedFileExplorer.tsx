import React, { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Folder, 
  FolderOpen, 
  File, 
  Search, 
  X, 
  ChevronRight, 
  Home,
  ArrowLeft,
  Eye,
  Plus,
  Grid3X3,
  List,
  SortAsc,
  SortDesc
} from 'lucide-react'
import { getFileTypeInfo, getFolderIcon } from './repo/FileTypeIcons'
import { cn } from '@/lib/utils'

interface FileItem {
  name: string
  type: 'file' | 'dir'
  size?: number
  path?: string
  sha?: string
  commit?: {
    message: string
    date: string | null
    author: string
    sha: string | null
  }
}

interface EnhancedFileExplorerProps {
  files: FileItem[]
  onFileClick: (file: FileItem) => void
  onAddFile?: () => void
  onNavigateToParent?: () => void
  path?: string
  isLoading?: boolean
  className?: string
  showBreadcrumbs?: boolean
  allowUpload?: boolean
}

// Helper function to format file size
const formatFileSize = (bytes?: number): string => {
  if (!bytes) return '-'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// Helper function to format relative time
const formatRelativeTime = (dateString?: string | null): string => {
  if (!dateString) return 'Unknown'
  
  const date = new Date(dateString)
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  
  if (diffInSeconds < 60) return 'just now'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`
  if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)}mo ago`
  return `${Math.floor(diffInSeconds / 31536000)}y ago`
}

export default function EnhancedFileExplorer({
  files,
  onFileClick,
  onAddFile,
  onNavigateToParent,
  path = '',
  isLoading = false,
  className = '',
  showBreadcrumbs = true,
  allowUpload = true
}: EnhancedFileExplorerProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')
  const [sortBy, setSortBy] = useState<'name' | 'size' | 'modified'>('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  // Filter and sort files
  const processedFiles = useMemo(() => {
    let filtered = files.filter(file => 
      file.name.toLowerCase().includes(searchTerm.toLowerCase())
    )

    // Sort files
    filtered.sort((a, b) => {
      // Always put directories first
      if (a.type === 'dir' && b.type === 'file') return -1
      if (a.type === 'file' && b.type === 'dir') return 1

      let comparison = 0
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name)
          break
        case 'size':
          comparison = (a.size || 0) - (b.size || 0)
          break
        case 'modified':
          const aDate = a.commit?.date ? new Date(a.commit.date).getTime() : 0
          const bDate = b.commit?.date ? new Date(b.commit.date).getTime() : 0
          comparison = aDate - bDate
          break
      }

      return sortOrder === 'asc' ? comparison : -comparison
    })

    return filtered
  }, [files, searchTerm, sortBy, sortOrder])

  // Generate breadcrumb items
  const breadcrumbItems = useMemo(() => {
    if (!path) return []
    return path.split('/').filter(Boolean).map((segment, index, array) => ({
      name: segment,
      path: array.slice(0, index + 1).join('/')
    }))
  }, [path])

  const toggleSort = (newSortBy: typeof sortBy) => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(newSortBy)
      setSortOrder('asc')
    }
  }

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Folder className="h-5 w-5" />
            {path ? path.split('/').pop() : 'Repository'}
            <Badge variant="secondary" className="ml-2">
              {processedFiles.length} items
            </Badge>
          </CardTitle>
          
          <div className="flex items-center gap-2">
            {/* View mode toggle */}
            <div className="flex border rounded-md">
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="rounded-r-none"
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="rounded-l-none"
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
            </div>

            {/* Add file button */}
            {allowUpload && onAddFile && (
              <Button onClick={onAddFile} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add File
              </Button>
            )}
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search files and folders..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
          {searchTerm && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
              onClick={() => setSearchTerm('')}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>

        {/* Breadcrumb Navigation */}
        {showBreadcrumbs && (
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2"
              onClick={() => onNavigateToParent?.()}
            >
              <Home className="h-3 w-3" />
            </Button>
            
            {breadcrumbItems.map((item, index) => (
              <React.Fragment key={index}>
                <ChevronRight className="h-3 w-3" />
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2"
                  onClick={() => {
                    // Navigate to this breadcrumb level
                    // This would need to be implemented based on your navigation logic
                  }}
                >
                  {item.name}
                </Button>
              </React.Fragment>
            ))}
          </div>
        )}

        {/* Back button */}
        {path && onNavigateToParent && (
          <Button
            variant="outline"
            size="sm"
            onClick={onNavigateToParent}
            className="w-fit"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        )}

        {/* Sort controls */}
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Sort by:</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleSort('name')}
            className="h-7 px-2"
          >
            Name
            {sortBy === 'name' && (
              sortOrder === 'asc' ? <SortAsc className="h-3 w-3 ml-1" /> : <SortDesc className="h-3 w-3 ml-1" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleSort('size')}
            className="h-7 px-2"
          >
            Size
            {sortBy === 'size' && (
              sortOrder === 'asc' ? <SortAsc className="h-3 w-3 ml-1" /> : <SortDesc className="h-3 w-3 ml-1" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleSort('modified')}
            className="h-7 px-2"
          >
            Modified
            {sortBy === 'modified' && (
              sortOrder === 'asc' ? <SortAsc className="h-3 w-3 ml-1" /> : <SortDesc className="h-3 w-3 ml-1" />
            )}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {isLoading ? (
          <div className="py-8 text-center">
            <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
            <p className="mt-2 text-sm text-muted-foreground">Loading directory contents...</p>
          </div>
        ) : viewMode === 'list' ? (
          <div className="overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr className="text-left text-xs text-muted-foreground">
                  <th className="py-2 px-4 font-medium">Name</th>
                  <th className="py-2 px-4 font-medium hidden md:table-cell">Last commit</th>
                  <th className="py-2 px-4 font-medium text-right">Size</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {processedFiles.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-muted-foreground">
                      {searchTerm ? 'No files found matching your search.' : 'This directory is empty.'}
                    </td>
                  </tr>
                ) : (
                  processedFiles.map((file, index) => {
                    const fileInfo = file.type === 'dir' ? getFolderIcon() : getFileTypeInfo(file.name)
                    
                    return (
                      <tr
                        key={`${file.sha || file.name}-${index}`}
                        onClick={() => onFileClick(file)}
                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                      >
                        <td className="py-2 px-4">
                          <div className="flex items-center gap-2">
                            <div className={cn("flex-shrink-0", fileInfo.color)}>
                              {fileInfo.icon}
                            </div>
                            <span className={file.type === 'dir' ? "font-medium" : ""}>{file.name}</span>
                          </div>
                        </td>
                        <td className="py-2 px-4 hidden md:table-cell text-sm text-muted-foreground">
                          {file.commit?.message || "No commit data"}
                        </td>
                        <td className="py-2 px-4 text-right text-sm text-muted-foreground">
                          {file.type === 'dir' ? '-' : formatFileSize(file.size)}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        ) : (
          // Grid view implementation
          <div className="p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {processedFiles.map((file, index) => {
              const fileInfo = file.type === 'dir' ? getFolderIcon() : getFileTypeInfo(file.name)
              
              return (
                <div
                  key={`${file.sha || file.name}-${index}`}
                  onClick={() => onFileClick(file)}
                  className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                >
                  <div className="flex flex-col items-center text-center space-y-2">
                    <div className={cn("text-2xl", fileInfo.color)}>
                      {fileInfo.icon}
                    </div>
                    <div className="w-full">
                      <div className="font-medium text-sm truncate" title={file.name}>
                        {file.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {file.type === 'dir' ? 'Folder' : formatFileSize(file.size)}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

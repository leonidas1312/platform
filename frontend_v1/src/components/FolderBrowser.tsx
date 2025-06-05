import React, { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
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
  Download
} from 'lucide-react'
import { getFileTypeInfo } from './repo/FileTypeIcons'
import { cn } from '@/lib/utils'

interface FileItem {
  name: string
  path: string
  type: 'file' | 'directory'
  size?: number
  children?: FileItem[]
  content?: string
}

interface FolderBrowserProps {
  files: FileList
  onFileSelect?: (file: FileItem) => void
  onClose?: () => void
  className?: string
}

// Helper function to build file tree from FileList
const buildFileTree = (files: FileList): FileItem[] => {
  const tree: { [key: string]: FileItem } = {}
  const root: FileItem[] = []

  Array.from(files).forEach((file) => {
    const pathParts = file.webkitRelativePath.split('/')
    let currentLevel = root
    let currentPath = ''

    pathParts.forEach((part, index) => {
      currentPath = currentPath ? `${currentPath}/${part}` : part
      const isFile = index === pathParts.length - 1

      // Find existing item at current level
      let existingItem = currentLevel.find(item => item.name === part)

      if (!existingItem) {
        const newItem: FileItem = {
          name: part,
          path: currentPath,
          type: isFile ? 'file' : 'directory',
          size: isFile ? file.size : undefined,
          children: isFile ? undefined : []
        }

        if (isFile) {
          // Store file reference for potential content reading
          newItem.content = file.name // We'll read content when needed
        }

        currentLevel.push(newItem)
        existingItem = newItem
      }

      if (!isFile && existingItem.children) {
        currentLevel = existingItem.children
      }
    })
  })

  return root
}

// Helper function to flatten tree for search
const flattenTree = (items: FileItem[]): FileItem[] => {
  const result: FileItem[] = []
  
  const traverse = (items: FileItem[]) => {
    items.forEach(item => {
      result.push(item)
      if (item.children) {
        traverse(item.children)
      }
    })
  }
  
  traverse(items)
  return result
}

// Helper function to format file size
const formatFileSize = (bytes?: number): string => {
  if (!bytes) return '-'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function FolderBrowser({ 
  files, 
  onFileSelect, 
  onClose, 
  className 
}: FolderBrowserProps) {
  const [currentPath, setCurrentPath] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())

  // Build file tree from FileList
  const fileTree = useMemo(() => buildFileTree(files), [files])
  
  // Get current directory items
  const currentItems = useMemo(() => {
    let items = fileTree
    for (const pathPart of currentPath) {
      const folder = items.find(item => item.name === pathPart && item.type === 'directory')
      if (folder && folder.children) {
        items = folder.children
      } else {
        items = []
        break
      }
    }
    return items
  }, [fileTree, currentPath])

  // Filter items based on search
  const filteredItems = useMemo(() => {
    if (!searchTerm) return currentItems
    
    const allItems = flattenTree(fileTree)
    return allItems.filter(item => 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.path.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [currentItems, fileTree, searchTerm])

  const handleFolderClick = (folderName: string) => {
    if (searchTerm) {
      // If searching, navigate to the folder's location
      const item = filteredItems.find(item => item.name === folderName)
      if (item) {
        const pathParts = item.path.split('/').slice(0, -1)
        setCurrentPath(pathParts)
        setSearchTerm('')
      }
    } else {
      // Normal navigation
      setCurrentPath([...currentPath, folderName])
    }
  }

  const handleFileClick = (file: FileItem) => {
    onFileSelect?.(file)
  }

  const navigateToParent = () => {
    if (currentPath.length > 0) {
      setCurrentPath(currentPath.slice(0, -1))
    }
  }

  const navigateToRoot = () => {
    setCurrentPath([])
    setSearchTerm('')
  }

  const breadcrumbItems = currentPath.map((part, index) => ({
    name: part,
    path: currentPath.slice(0, index + 1)
  }))

  const totalFiles = Array.from(files).length
  const rootFolderName = Array.from(files)[0]?.webkitRelativePath.split('/')[0] || 'Folder'

  return (
    <Card className={cn("w-full h-full flex flex-col", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Folder className="h-5 w-5" />
            {rootFolderName}
            <Badge variant="secondary" className="ml-2">
              {totalFiles} files
            </Badge>
          </CardTitle>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
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
        {!searchTerm && (
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2"
              onClick={navigateToRoot}
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
                  onClick={() => setCurrentPath(item.path)}
                >
                  {item.name}
                </Button>
              </React.Fragment>
            ))}
          </div>
        )}

        {/* Back button */}
        {!searchTerm && currentPath.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={navigateToParent}
            className="w-fit"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        )}
      </CardHeader>

      <CardContent className="flex-1 p-0">
        <ScrollArea className="h-full">
          <div className="p-4 space-y-1">
            {filteredItems.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchTerm ? 'No files found matching your search.' : 'This folder is empty.'}
              </div>
            ) : (
              filteredItems.map((item, index) => {
                const fileInfo = item.type === 'directory' 
                  ? { icon: <Folder className="h-4 w-4" />, color: 'text-blue-500' }
                  : getFileTypeInfo(item.name)

                return (
                  <div
                    key={`${item.path}-${index}`}
                    className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => {
                      if (item.type === 'directory') {
                        handleFolderClick(item.name)
                      } else {
                        handleFileClick(item)
                      }
                    }}
                  >
                    <div className={cn("flex-shrink-0", fileInfo.color)}>
                      {fileInfo.icon}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">
                        {item.name}
                      </div>
                      {searchTerm && (
                        <div className="text-xs text-muted-foreground truncate">
                          {item.path}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-shrink-0 text-xs text-muted-foreground">
                      {item.type === 'file' ? formatFileSize(item.size) : '-'}
                    </div>
                    
                    {item.type === 'file' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleFileClick(item)
                        }}
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

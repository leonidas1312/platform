import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  X, 
  Download,
  Upload,
  Folder,
  Eye
} from 'lucide-react'
import FolderBrowser from './FolderBrowser'

interface FileItem {
  name: string
  path: string
  type: 'file' | 'directory'
  size?: number
  children?: FileItem[]
  content?: string
}

interface FolderBrowserDialogProps {
  isOpen: boolean
  onClose: () => void
  files: FileList | null
  onFileSelect?: (file: FileItem) => void
  onUploadConfirm?: () => void
  title?: string
  showUploadButton?: boolean
}

export default function FolderBrowserDialog({
  isOpen,
  onClose,
  files,
  onFileSelect,
  onUploadConfirm,
  title = "Browse Folder Contents",
  showUploadButton = false
}: FolderBrowserDialogProps) {
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null)

  if (!files || files.length === 0) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[600px] sm:max-h-[700px]">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
          <div className="py-8 text-center text-muted-foreground">
            <Folder className="h-16 w-16 mx-auto mb-4 opacity-30" />
            <p>No folder selected</p>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  const handleFileSelect = (file: FileItem) => {
    setSelectedFile(file)
    onFileSelect?.(file)
  }

  const handleDownloadFolder = () => {
    // Create a zip file with all the folder contents
    // This is a simplified implementation - in a real app you might want to use a library like JSZip
    const folderName = Array.from(files)[0]?.webkitRelativePath.split('/')[0] || 'folder'
    
    // For now, just download the first file as an example
    if (files.length > 0) {
      const file = files[0]
      const url = URL.createObjectURL(file)
      const a = document.createElement('a')
      a.href = url
      a.download = file.name
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }
  }

  const totalFiles = files.length
  const folderName = Array.from(files)[0]?.webkitRelativePath.split('/')[0] || 'Unknown Folder'
  const totalSize = Array.from(files).reduce((sum, file) => sum + file.size, 0)

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[900px] sm:max-h-[700px] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <DialogTitle className="flex items-center gap-2">
                <Folder className="h-5 w-5" />
                {title}
              </DialogTitle>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">
                  {totalFiles} files
                </Badge>
                <Badge variant="outline">
                  {formatFileSize(totalSize)}
                </Badge>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {showUploadButton && onUploadConfirm && (
                <Button onClick={onUploadConfirm} size="sm">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Folder
                </Button>
              )}
              
              <Button variant="outline" size="sm" onClick={handleDownloadFolder}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* File Browser */}
          <div className="lg:col-span-2 min-h-0">
            <FolderBrowser
              files={files}
              onFileSelect={handleFileSelect}
              className="h-full"
            />
          </div>

          {/* File Preview */}
          <div className="lg:col-span-1 min-h-0">
            {selectedFile ? (
              <div className="h-full border rounded-lg p-4 bg-muted/20">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium text-sm">File Preview</h3>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedFile(null)}>
                    <X className="h-3 w-3" />
                  </Button>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <div className="text-sm font-medium">{selectedFile.name}</div>
                    <div className="text-xs text-muted-foreground">{selectedFile.path}</div>
                  </div>
                  
                  {selectedFile.size && (
                    <div>
                      <div className="text-xs text-muted-foreground">Size</div>
                      <div className="text-sm">{formatFileSize(selectedFile.size)}</div>
                    </div>
                  )}
                  
                  <div>
                    <div className="text-xs text-muted-foreground">Type</div>
                    <div className="text-sm capitalize">{selectedFile.type}</div>
                  </div>

                  {selectedFile.type === 'file' && (
                    <div className="pt-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full"
                        onClick={() => {
                          // Find the actual file from FileList and read its content
                          const actualFile = Array.from(files).find(f => 
                            f.webkitRelativePath === selectedFile.path
                          )
                          if (actualFile) {
                            const reader = new FileReader()
                            reader.onload = (e) => {
                              const content = e.target?.result as string
                              // You could show content in a modal or preview area
                              console.log('File content:', content.substring(0, 200) + '...')
                            }
                            reader.readAsText(actualFile)
                          }
                        }}
                      >
                        <Eye className="h-3 w-3 mr-2" />
                        Preview Content
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="h-full border rounded-lg p-4 bg-muted/20 flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <Eye className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Select a file to preview</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Folder Summary */}
        <div className="flex-shrink-0 pt-4 border-t">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div>
              <strong>{folderName}</strong> - {totalFiles} files, {formatFileSize(totalSize)}
            </div>
            <div className="flex items-center gap-4">
              {selectedFile && (
                <span>Selected: {selectedFile.name}</span>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

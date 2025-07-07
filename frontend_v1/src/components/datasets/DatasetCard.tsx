import React, { useState } from 'react'
import { Download, Copy, Trash2, Eye, Users, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { useToast } from '@/hooks/use-toast'
import { cn, formatFileSize, formatDate } from '@/lib/utils'

interface Dataset {
  id: string
  name: string
  description: string
  format_type: string
  metadata?: {
    [key: string]: any
  }
  file_size: number
  original_filename: string
  is_public: boolean
  user_id: string
  created_at: string
  user?: {
    username: string
    avatar_url: string | null
    full_name: string | null
  }
}

interface DatasetCardProps {
  dataset: Dataset
  compact?: boolean
  listView?: boolean
  onDelete?: (datasetId: string) => void
  currentUser?: { login: string } | null
}

const DatasetCard: React.FC<DatasetCardProps> = ({ 
  dataset, 
  compact = false, 
  listView = false,
  onDelete,
  currentUser 
}) => {
  const { toast } = useToast()
  const [showDetails, setShowDetails] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const isOwner = currentUser?.login === dataset.user_id
  
  const getFileIcon = (formatType: string) => {
    const icons = {
      json: '📄',
      csv: '📊',
      txt: '📝',
      tsplib: '🗺️',
      vrp: '🚛',
      xml: '📋',
      xlsx: '📈'
    }
    return icons[formatType as keyof typeof icons] || '📁'
  }

  const handleDownload = async () => {
    try {
      const response = await fetch(`/api/datasets/${dataset.id}/download`, {
        credentials: 'include'
      })

      if (!response.ok) {
        // Try to get error message from response
        let errorMessage = 'Download failed'
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage
        } catch {
          // If response is not JSON, use status text
          errorMessage = response.statusText || errorMessage
        }

        // Handle specific error cases
        if (response.status === 401) {
          errorMessage = 'Authentication required. Please log in again.'
        } else if (response.status === 403) {
          errorMessage = 'Access denied. You do not have permission to download this dataset.'
        } else if (response.status === 404) {
          errorMessage = 'Dataset not found or file has been removed from the server.'
        }

        throw new Error(errorMessage)
      }

      const blob = await response.blob()

      // Check if the response is actually a file (not an error JSON)
      if (blob.type === 'application/json') {
        const text = await blob.text()
        try {
          const errorData = JSON.parse(text)
          throw new Error(errorData.error || 'Download failed')
        } catch {
          // If it's not valid JSON, continue with download
        }
      }

      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = dataset.original_filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast({
        title: "Success",
        description: "Dataset downloaded successfully!"
      })
    } catch (error) {
      console.error('Download error:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to download dataset. Please try again.",
        variant: "destructive"
      })
    }
  }



  const handleDelete = async () => {
    if (!isOwner) return
    
    try {
      setDeleting(true)
      const response = await fetch(`/api/datasets/${dataset.id}`, {
        method: 'DELETE',
        credentials: 'include'
      })
      
      if (!response.ok) {
        throw new Error('Delete failed')
      }
      
      onDelete?.(dataset.id)
    } catch (error) {
      console.error('Delete error:', error)
      toast({
        title: "Error",
        description: "Failed to delete dataset. Please try again.",
        variant: "destructive"
      })
    } finally {
      setDeleting(false)
    }
  }

  const copyDatasetIdToClipboard = () => {
    navigator.clipboard.writeText(dataset.id)
    toast({
      title: "Copied!",
      description: "Dataset ID copied to clipboard"
    })
  }

  if (listView) {
    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 flex-1">
              <div className="text-2xl">{getFileIcon(dataset.format_type)}</div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold">{dataset.name}</h3>
                  {!dataset.is_public && <Lock className="h-3 w-3 text-gray-400" />}
                  <Badge variant="outline" className="text-xs">
                    {dataset.format_type.toUpperCase()}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-2">
                  <span>{formatFileSize(dataset.file_size)}</span>
                  {dataset.user && (
                    <div className="flex items-center gap-2">
                      <span>•</span>
                      {dataset.user.avatar_url && (
                        <img
                          src={dataset.user.avatar_url}
                          alt={dataset.user.username}
                          className="w-4 h-4 rounded-full"
                        />
                      )}
                      <span className="text-xs">
                        @{dataset.user.username}
                      </span>
                    </div>
                  )}
                </div>
                <p className="text-sm text-gray-500 line-clamp-1">{dataset.description}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={handleDownload}>
                <Download className="h-3 w-3 mr-1" />
                Download
              </Button>
              <Button size="sm" variant="outline" onClick={copyDatasetIdToClipboard}>
                <Copy className="h-3 w-3 mr-1" />
                Copy ID
              </Button>
              {isOwner && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950">
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Dataset</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete "{dataset.name}"? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDelete} disabled={deleting}>
                        {deleting ? 'Deleting...' : 'Delete'}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{getFileIcon(dataset.format_type)}</span>
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  {dataset.name}
                  {!dataset.is_public && <Lock className="h-3 w-3 text-gray-400" />}
                </CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-xs">
                    {dataset.format_type.toUpperCase()}
                  </Badge>
                  {dataset.is_public && <Users className="h-3 w-3 text-gray-400" />}
                </div>
              </div>
            </div>
            {isOwner && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Dataset</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete "{dataset.name}"? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} disabled={deleting}>
                      {deleting ? 'Deleting...' : 'Delete'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          <CardDescription className="mb-3 line-clamp-2">
            {dataset.description || 'No description provided'}
          </CardDescription>
          
          <div className="space-y-2 mb-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Format:</span>
              <Badge variant="secondary">{dataset.format_type}</Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">File Size:</span>
              <span>{formatFileSize(dataset.file_size)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Uploaded:</span>
              <span>{formatDate(dataset.created_at)}</span>
            </div>
            {dataset.user && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">By:</span>
                <div className="flex items-center gap-2">
                  {dataset.user.avatar_url && (
                    <img
                      src={dataset.user.avatar_url}
                      alt={dataset.user.username}
                      className="w-4 h-4 rounded-full"
                    />
                  )}
                  <span>@{dataset.user.username}</span>
                </div>
              </div>
            )}
          </div>
          
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleDownload} className="flex-1">
                <Download className="h-4 w-4 mr-1" />
                Download
              </Button>
              <Button variant="outline" onClick={copyDatasetIdToClipboard} className="flex-1">
                <Copy className="h-4 w-4 mr-1" />
                Copy ID
              </Button>
              <Dialog open={showDetails} onOpenChange={setShowDetails}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{dataset.name}</DialogTitle>
                    <DialogDescription>Dataset Details</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Description</h4>
                      <p className="text-sm text-gray-600">{dataset.description || 'No description provided'}</p>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">File Information</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>Format: {dataset.format_type}</div>
                        <div>File Size: {formatFileSize(dataset.file_size)}</div>
                        <div>Original Name: {dataset.original_filename}</div>
                        <div>Uploaded: {formatDate(dataset.created_at)}</div>
                        <div>Dataset ID: {dataset.id}</div>
                        <div>Public: {dataset.is_public ? 'Yes' : 'No'}</div>
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              {isOwner && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Dataset</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete "{dataset.name}"? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDelete} disabled={deleting}>
                        {deleting ? 'Deleting...' : 'Delete'}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </div>
        </CardContent>
      </Card>


    </>
  )
}

export default DatasetCard

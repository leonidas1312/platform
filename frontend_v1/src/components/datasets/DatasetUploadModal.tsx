import React, { useState, useCallback } from 'react'
import { Upload, X, FileText, AlertCircle, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

interface DatasetUploadModalProps {
  open: boolean
  onClose: () => void
  onDatasetUploaded: (dataset: any) => void
}

interface UploadState {
  file: File | null
  name: string
  description: string
  problemType: string
  format: string
  isPublic: boolean
  uploading: boolean
  progress: number
  error: string | null
  validation: {
    valid: boolean
    errors: string[]
    warnings: string[]
  } | null
}

const DatasetUploadModal: React.FC<DatasetUploadModalProps> = ({
  open,
  onClose,
  onDatasetUploaded
}) => {
  const { toast } = useToast()
  const [dragActive, setDragActive] = useState(false)
  const [state, setState] = useState<UploadState>({
    file: null,
    name: '',
    description: '',
    problemType: 'auto',
    format: 'auto',
    isPublic: false,
    uploading: false,
    progress: 0,
    error: null,
    validation: null
  })

  const supportedFormats = [
    { value: 'tsplib', label: 'TSPLIB (.tsp)', extensions: ['.tsp'] },
    { value: 'vrp', label: 'VRP (.vrp)', extensions: ['.vrp'] },
    { value: 'json', label: 'JSON (.json)', extensions: ['.json'] },
    { value: 'csv', label: 'CSV (.csv)', extensions: ['.csv'] },
    { value: 'txt', label: 'Text (.txt, .dat)', extensions: ['.txt', '.dat'] }
  ]

  const problemTypes = [
    { value: 'tsp', label: 'Traveling Salesman Problem (TSP)' },
    { value: 'vrp', label: 'Vehicle Routing Problem (VRP)' },
    { value: 'graph', label: 'Graph Optimization' },
    { value: 'scheduling', label: 'Scheduling Problems' },
    { value: 'other', label: 'Other' }
  ]

  const resetState = () => {
    setState({
      file: null,
      name: '',
      description: '',
      problemType: 'auto',
      format: 'auto',
      isPublic: false,
      uploading: false,
      progress: 0,
      error: null,
      validation: null
    })
  }

  const handleClose = () => {
    if (!state.uploading) {
      resetState()
      onClose()
    }
  }

  const validateFile = (file: File): { valid: boolean; error?: string } => {
    // Size check (100MB limit)
    if (file.size > 100 * 1024 * 1024) {
      return { valid: false, error: 'File size must be less than 100MB' }
    }

    // Extension check
    const extension = '.' + file.name.split('.').pop()?.toLowerCase()
    const allowedExtensions = ['.tsp', '.vrp', '.json', '.csv', '.txt', '.dat', '.in', '.fjs', '.rcp']
    
    if (!allowedExtensions.includes(extension)) {
      return { 
        valid: false, 
        error: `Unsupported file type. Supported: ${allowedExtensions.join(', ')}` 
      }
    }

    return { valid: true }
  }

  const detectFormat = (filename: string): string => {
    const extension = filename.split('.').pop()?.toLowerCase()
    const formatMap: { [key: string]: string } = {
      'tsp': 'tsplib',
      'vrp': 'vrp',
      'json': 'json',
      'csv': 'csv',
      'txt': 'txt',
      'dat': 'txt'
    }
    return formatMap[extension || ''] || 'txt'
  }

  const handleFileSelect = useCallback(async (file: File) => {
    const validation = validateFile(file)
    
    if (!validation.valid) {
      setState(prev => ({ ...prev, error: validation.error || 'Invalid file' }))
      return
    }

    const detectedFormat = detectFormat(file.name)
    const baseName = file.name.replace(/\.[^/.]+$/, '')

    setState(prev => ({
      ...prev,
      file,
      name: prev.name || baseName,
      format: detectedFormat,
      error: null
    }))

    // Quick validation
    try {
      const formData = new FormData()
      formData.append('file', file)
      
      // This would be a quick validation endpoint
      // For now, we'll skip this step
    } catch (error) {
      console.error('Validation error:', error)
    }
  }, [])

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0])
    }
  }, [handleFileSelect])

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0])
    }
  }

  const handleUpload = async () => {
    if (!state.file || !state.name.trim()) {
      setState(prev => ({ ...prev, error: 'Please select a file and provide a name' }))
      return
    }

    setState(prev => ({ ...prev, uploading: true, progress: 0, error: null }))

    try {
      const formData = new FormData()
      formData.append('dataset', state.file)
      formData.append('name', state.name.trim())
      formData.append('description', state.description.trim())
      formData.append('format_type', state.format === 'auto' ? detectFormat(state.file.name) : state.format)
      formData.append('problem_type', state.problemType)
      formData.append('is_public', state.isPublic.toString())

      const response = await fetch('/api/datasets/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Upload failed')
      }

      const result = await response.json()
      
      setState(prev => ({ ...prev, progress: 100 }))
      
      setTimeout(() => {
        onDatasetUploaded(result.dataset)
        handleClose()
        toast({
          title: "Success",
          description: "Dataset uploaded successfully!"
        })
      }, 500)

    } catch (error) {
      console.error('Upload error:', error)
      setState(prev => ({ 
        ...prev, 
        uploading: false, 
        error: error instanceof Error ? error.message : 'Upload failed' 
      }))
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Upload Dataset</DialogTitle>
          <DialogDescription>
            Upload an optimization dataset to use in the platform or share with the community
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* File Upload Area */}
          <div className="space-y-2">
            <Label>Dataset File</Label>
            <div
              className={cn(
                "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
                dragActive 
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-950" 
                  : "border-gray-300 dark:border-gray-600",
                state.file && "border-green-500 bg-green-50 dark:bg-green-950"
              )}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              {state.file ? (
                <div className="space-y-2">
                  <CheckCircle className="h-8 w-8 text-green-600 mx-auto" />
                  <div>
                    <p className="font-medium">{state.file.name}</p>
                    <p className="text-sm text-gray-500">
                      {(state.file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setState(prev => ({ ...prev, file: null, name: '', error: null }))}
                  >
                    Remove
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <Upload className="h-12 w-12 text-gray-400 mx-auto" />
                  <div>
                    <p className="text-lg font-medium">
                      Drag & drop files here or{' '}
                      <label className="text-blue-600 hover:text-blue-700 cursor-pointer underline">
                        click to browse
                        <input
                          type="file"
                          className="hidden"
                          accept=".tsp,.vrp,.json,.csv,.txt,.dat,.in,.fjs,.rcp"
                          onChange={handleFileInput}
                        />
                      </label>
                    </p>
                    <p className="text-sm text-gray-500 mt-2">
                      Supported: .tsp, .vrp, .json, .csv, .txt, .dat (max 100MB)
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Dataset Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={state.name}
                onChange={(e) => setState(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter dataset name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="format">Format</Label>
              <Select value={state.format} onValueChange={(value) => setState(prev => ({ ...prev, format: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Auto-detect" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Auto-detect</SelectItem>
                  {supportedFormats.map(format => (
                    <SelectItem key={format.value} value={format.value}>
                      {format.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={state.description}
              onChange={(e) => setState(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe your dataset (optional)"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="problemType">Problem Type</Label>
            <Select value={state.problemType} onValueChange={(value) => setState(prev => ({ ...prev, problemType: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Auto-detect" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Auto-detect</SelectItem>
                {problemTypes.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="isPublic"
              checked={state.isPublic}
              onCheckedChange={(checked) => setState(prev => ({ ...prev, isPublic: !!checked }))}
            />
            <Label htmlFor="isPublic" className="text-sm">
              Make public (visible to all users)
            </Label>
          </div>

          {/* Error Display */}
          {state.error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          )}

          {/* Upload Progress */}
          {state.uploading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Uploading...</span>
                <span>{state.progress}%</span>
              </div>
              <Progress value={state.progress} />
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={handleClose} disabled={state.uploading}>
              Cancel
            </Button>
            <Button 
              onClick={handleUpload} 
              disabled={!state.file || !state.name.trim() || state.uploading}
            >
              {state.uploading ? 'Uploading...' : 'Upload Dataset'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default DatasetUploadModal

import { useState, useRef, ChangeEvent } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Upload, File, X } from 'lucide-react'

interface FileUploadDialogProps {
  isOpen: boolean
  onClose: () => void
  onUpload: (file: File, commitMessage: string, branch?: string) => Promise<void>
  currentPath: string
  defaultBranch: string
  branches?: string[]
}

export default function FileUploadDialog({
  isOpen,
  onClose,
  onUpload,
  currentPath,
  defaultBranch,
  branches = [],
}: FileUploadDialogProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [commitMessage, setCommitMessage] = useState("")
  const [branch, setBranch] = useState(defaultBranch)
  const [isUploading, setIsUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0])
      // Set a default commit message based on the file name
      setCommitMessage(`Add ${e.target.files[0].name}`)
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0])
      setCommitMessage(`Add ${e.dataTransfer.files[0].name}`)
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) return
    
    setIsUploading(true)
    try {
      await onUpload(selectedFile, commitMessage, branch)
      resetForm()
      onClose()
    } catch (error) {
      console.error("Upload failed:", error)
    } finally {
      setIsUploading(false)
    }
  }

  const resetForm = () => {
    setSelectedFile(null)
    setCommitMessage("")
    setBranch(defaultBranch)
  }

  const handleCancel = () => {
    resetForm()
    onClose()
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  const removeSelectedFile = () => {
    setSelectedFile(null)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Upload File</DialogTitle>
          <DialogDescription>
            Upload a file to {currentPath ? `${currentPath}/` : "the repository root"}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          {!selectedFile ? (
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center ${
                dragActive ? "border-primary bg-primary/10" : "border-muted-foreground/25"
              }`}
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={triggerFileInput}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
              />
              <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
              <p className="text-sm text-muted-foreground mb-1">
                Drag and drop a file here, or click to select a file
              </p>
              <p className="text-xs text-muted-foreground">
                Max file size: 25MB
              </p>
            </div>
          ) : (
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <File className="h-8 w-8 text-primary" />
                  <div>
                    <p className="font-medium">{selectedFile.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(selectedFile.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation()
                    removeSelectedFile()
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="branch" className="text-right">
              Branch
            </Label>
            <Select value={branch} onValueChange={setBranch}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder={defaultBranch} />
              </SelectTrigger>
              <SelectContent>
                {branches.length > 0 ? (
                  branches.map((branchName) => (
                    <SelectItem key={branchName} value={branchName}>
                      {branchName}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value={defaultBranch}>{defaultBranch}</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="commitMessage" className="text-right">
              Commit Message
            </Label>
            <Textarea
              id="commitMessage"
              value={commitMessage}
              onChange={(e) => setCommitMessage(e.target.value)}
              placeholder="Add a commit message"
              className="col-span-3 resize-none"
              rows={2}
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} disabled={isUploading}>
            Cancel
          </Button>
          <Button 
            onClick={handleUpload} 
            disabled={!selectedFile || !commitMessage || isUploading}
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              "Upload File"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

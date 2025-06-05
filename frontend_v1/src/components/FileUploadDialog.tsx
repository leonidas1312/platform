import { useState, useRef, ChangeEvent } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, Upload, File, X, Folder, FolderOpen } from 'lucide-react'

interface FileUploadDialogProps {
  isOpen: boolean
  onClose: () => void
  onUpload: (file: File, commitMessage: string, branch?: string) => Promise<void>
  onFolderUpload?: (files: FileList, commitMessage: string, branch?: string) => Promise<void>
  currentPath: string
  defaultBranch: string
  branches?: string[]
}

export default function FileUploadDialog({
  isOpen,
  onClose,
  onUpload,
  onFolderUpload,
  currentPath,
  defaultBranch,
  branches = [],
}: FileUploadDialogProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null)
  const [uploadMode, setUploadMode] = useState<"file" | "folder">("file")
  const [commitMessage, setCommitMessage] = useState("")
  const [branch, setBranch] = useState(defaultBranch)
  const [isUploading, setIsUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const folderInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0])
      setSelectedFiles(null)
      // Set a default commit message based on the file name
      setCommitMessage(`Add ${e.target.files[0].name}`)
    }
  }

  const handleFolderChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFiles(e.target.files)
      setSelectedFile(null)
      // Set a default commit message based on the folder structure
      const firstFile = e.target.files[0]
      const folderName = firstFile.webkitRelativePath.split('/')[0]
      setCommitMessage(`Add folder: ${folderName} (${e.target.files.length} files)`)
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

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      // Check if it's a folder drop (multiple files with webkitRelativePath)
      const files = Array.from(e.dataTransfer.files)
      const hasRelativePaths = files.some(file => file.webkitRelativePath)

      if (hasRelativePaths && uploadMode === "folder") {
        setSelectedFiles(e.dataTransfer.files)
        setSelectedFile(null)
        const folderName = files[0].webkitRelativePath.split('/')[0]
        setCommitMessage(`Add folder: ${folderName} (${files.length} files)`)
      } else if (!hasRelativePaths && uploadMode === "file") {
        setSelectedFile(e.dataTransfer.files[0])
        setSelectedFiles(null)
        setCommitMessage(`Add ${e.dataTransfer.files[0].name}`)
      }
    }
  }

  const handleUpload = async () => {
    if (uploadMode === "file" && !selectedFile) return
    if (uploadMode === "folder" && !selectedFiles) return

    setIsUploading(true)
    try {
      if (uploadMode === "file" && selectedFile) {
        await onUpload(selectedFile, commitMessage, branch)
      } else if (uploadMode === "folder" && selectedFiles && onFolderUpload) {
        await onFolderUpload(selectedFiles, commitMessage, branch)
      }
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
    setSelectedFiles(null)
    setCommitMessage("")
    setBranch(defaultBranch)
    setUploadMode("file")
  }

  const handleCancel = () => {
    resetForm()
    onClose()
  }

  const triggerFileInput = () => {
    if (uploadMode === "file") {
      fileInputRef.current?.click()
    } else {
      folderInputRef.current?.click()
    }
  }

  const removeSelectedFile = () => {
    setSelectedFile(null)
    setSelectedFiles(null)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Upload {uploadMode === "file" ? "File" : "Folder"}</DialogTitle>
          <DialogDescription>
            Upload {uploadMode === "file" ? "a file" : "a folder"} to {currentPath ? `${currentPath}/` : "the repository root"}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={uploadMode} onValueChange={(value) => setUploadMode(value as "file" | "folder")} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="file" className="flex items-center gap-2">
              <File className="h-4 w-4" />
              Single File
            </TabsTrigger>
            <TabsTrigger value="folder" className="flex items-center gap-2">
              <Folder className="h-4 w-4" />
              Folder
            </TabsTrigger>
          </TabsList>

          <TabsContent value="file" className="space-y-4">
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
            </div>
          </TabsContent>

          <TabsContent value="folder" className="space-y-4">
            <div className="grid gap-4 py-4">
              {!selectedFiles ? (
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
                    ref={folderInputRef}
                    onChange={handleFolderChange}
                    {...({ webkitdirectory: "" } as any)}
                    multiple
                    className="hidden"
                  />
                  <FolderOpen className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
                  <p className="text-sm text-muted-foreground mb-1">
                    Drag and drop a folder here, or click to select a folder
                  </p>
                  <p className="text-xs text-muted-foreground">
                    All files in the folder will be uploaded
                  </p>
                </div>
              ) : (
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Folder className="h-8 w-8 text-primary" />
                      <div>
                        <p className="font-medium">
                          {Array.from(selectedFiles)[0].webkitRelativePath.split('/')[0]}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {selectedFiles.length} files
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
                  <div className="max-h-32 overflow-y-auto text-xs text-muted-foreground">
                    {Array.from(selectedFiles).slice(0, 10).map((file, index) => (
                      <div key={index} className="py-1">
                        {file.webkitRelativePath}
                      </div>
                    ))}
                    {selectedFiles.length > 10 && (
                      <div className="py-1 font-medium">
                        ... and {selectedFiles.length - 10} more files
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <div className="grid grid-cols-4 items-center gap-4 mt-4">
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
        </Tabs>
        
        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} disabled={isUploading}>
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            disabled={
              (uploadMode === "file" && (!selectedFile || !commitMessage)) ||
              (uploadMode === "folder" && (!selectedFiles || !commitMessage || !onFolderUpload)) ||
              isUploading
            }
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {uploadMode === "file" ? "Uploading File..." : "Uploading Folder..."}
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                {uploadMode === "file" ? "Upload File" : "Upload Folder"}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

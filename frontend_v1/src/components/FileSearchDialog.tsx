"use client"

import { useState, useEffect, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { FileCode, FileJson, FileText, Folder, Package, Search } from "lucide-react"

interface FileSearchDialogProps {
  isOpen: boolean
  onClose: () => void
  files: any[]
  currentPath: string
  onFileSelect: (filePath: string) => void
}

// Function to determine the appropriate icon for a file based on its name/extension
const getFileIcon = (fileName: string) => {
  if (fileName.endsWith(".md")) return <FileText className="h-4 w-4 text-blue-500" />
  if (fileName.endsWith(".json")) return <FileJson className="h-4 w-4 text-yellow-500" />
  if (fileName.endsWith(".py")) return <FileCode className="h-4 w-4 text-green-500" />
  if (fileName.endsWith(".js") || fileName.endsWith(".ts") || fileName.endsWith(".tsx"))
    return <FileCode className="h-4 w-4 text-yellow-400" />
  if (fileName === "package.json" || fileName === "requirements.txt")
    return <Package className="h-4 w-4 text-red-500" />
  return <FileCode className="h-4 w-4 text-muted-foreground" />
}

// Flatten the file structure for searching
const flattenFiles = (files: any[], currentPath = "", result: any[] = []) => {
  files.forEach((file) => {
    const filePath = currentPath ? `${currentPath}/${file.name}` : file.name

    if (file.type === "dir" && file.children) {
      // If it's a directory with children, recursively flatten
      flattenFiles(file.children, filePath, result)
    } else {
      // Add the file to the result with its full path
      result.push({
        ...file,
        path: filePath,
      })
    }
  })

  return result
}

export default function FileSearchDialog({ isOpen, onClose, files, currentPath, onFileSelect }: FileSearchDialogProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [flattenedFiles, setFlattenedFiles] = useState<any[]>([])
  const [filteredFiles, setFilteredFiles] = useState<any[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  // Flatten the file structure when files change
  useEffect(() => {
    const flattened = flattenFiles(files, currentPath)
    setFlattenedFiles(flattened)
    setFilteredFiles(flattened)
  }, [files, currentPath])

  // Focus the input when the dialog opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
    }
  }, [isOpen])

  // Filter files based on search term
  const handleSearch = (term: string) => {
    setSearchTerm(term)

    if (!term.trim()) {
      setFilteredFiles(flattenedFiles)
      return
    }

    const lowerTerm = term.toLowerCase()
    const filtered = flattenedFiles.filter(
      (file) =>
        file.name.toLowerCase().includes(lowerTerm) || (file.path && file.path.toLowerCase().includes(lowerTerm)),
    )

    setFilteredFiles(filtered)
  }

  // Handle file selection
  const handleFileSelect = (file: any) => {
    if (file.type !== "dir") {
      onFileSelect(file.path)
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            Go to file
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              ref={inputRef}
              placeholder="Search for files..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && filteredFiles.length > 0) {
                  handleFileSelect(filteredFiles[0])
                }
              }}
            />
          </div>

          <ScrollArea className="h-72">
            {filteredFiles.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                {searchTerm ? "No files found" : "Type to search for files"}
              </div>
            ) : (
              <div className="space-y-1">
                {filteredFiles.map((file, index) => (
                  <Button
                    key={`${file.path}-${index}`}
                    variant="ghost"
                    className="w-full justify-start text-sm font-normal"
                    onClick={() => handleFileSelect(file)}
                  >
                    <div className="flex items-center gap-2 truncate">
                      {file.type === "dir" ? (
                        <Folder className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        getFileIcon(file.name)
                      )}
                      <span className="truncate">{file.path}</span>
                    </div>
                  </Button>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  )
}


"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Loader2, Copy, Download, FileCode, FileText, Check, Eye, ArrowLeft, Trash2 } from "lucide-react"
import ReactMarkdown from "react-markdown"
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { useTheme } from "@/components/ThemeContext"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"



interface CodeViewerProps {
  fileName: string
  content: string
  isLoading: boolean
  isEditing: boolean
  onEdit: () => void
  onSave: () => void
  onCancel: () => void
  onChange: (content: string) => void
  onBack: () => void
  onDelete?: () => void
  className?: string
}

// Function to determine language for syntax highlighting based on file extension
const getLanguage = (fileName: string) => {
  const extension = fileName.split(".").pop()?.toLowerCase()

  switch (extension) {
    case "js":
      return "javascript"
    case "ts":
      return "typescript"
    case "jsx":
      return "jsx"
    case "tsx":
      return "tsx"
    case "py":
      return "python"
    case "json":
      return "json"
    case "md":
    case "markdown":
      return "markdown"
    case "html":
    case "htm":
      return "html"
    case "css":
      return "css"
    case "scss":
    case "sass":
      return "scss"
    case "yml":
    case "yaml":
      return "yaml"
    case "sh":
    case "bash":
      return "bash"
    case "sql":
      return "sql"
    case "xml":
      return "xml"
    case "java":
      return "java"
    case "c":
      return "c"
    case "cpp":
    case "cc":
    case "cxx":
      return "cpp"
    case "cs":
      return "csharp"
    case "php":
      return "php"
    case "rb":
      return "ruby"
    case "go":
      return "go"
    case "rs":
      return "rust"
    case "swift":
      return "swift"
    case "kt":
      return "kotlin"
    case "r":
      return "r"
    case "dockerfile":
      return "dockerfile"
    case "toml":
      return "toml"
    case "ini":
    case "cfg":
    case "conf":
      return "ini"
    case "log":
      return "log"
    case "txt":
      return "text"
    default:
      return "text"
  }
}

// Function to check if file should be treated as binary/non-text
const isBinaryFile = (fileName: string) => {
  const binaryExtensions = [
    'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
    'zip', 'rar', '7z', 'tar', 'gz', 'bz2',
    'jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'ico',
    'mp3', 'mp4', 'avi', 'mov', 'wmv', 'flv',
    'exe', 'dll', 'so', 'dylib'
  ]
  const extension = fileName.split('.').pop()?.toLowerCase()
  return extension ? binaryExtensions.includes(extension) : false
}

// Get file type for styling
const getFileTypeColor = (fileName: string) => {
  const extension = fileName.split(".").pop()?.toLowerCase()

  switch (extension) {
    case "js":
    case "jsx":
      return "text-yellow-500"
    case "ts":
    case "tsx":
      return "text-blue-500"
    case "py":
      return "text-green-500"
    case "json":
      return "text-orange-500"
    case "md":
    case "markdown":
      return "text-blue-400"
    case "html":
    case "htm":
      return "text-red-500"
    case "css":
    case "scss":
    case "sass":
      return "text-purple-500"
    case "yml":
    case "yaml":
      return "text-pink-500"
    case "xml":
      return "text-orange-400"
    case "java":
      return "text-red-600"
    case "c":
    case "cpp":
    case "cc":
    case "cxx":
      return "text-blue-600"
    case "cs":
      return "text-purple-600"
    case "php":
      return "text-indigo-500"
    case "rb":
      return "text-red-400"
    case "go":
      return "text-cyan-500"
    case "rs":
      return "text-orange-600"
    case "swift":
      return "text-orange-500"
    case "kt":
      return "text-purple-400"
    case "r":
      return "text-blue-400"
    case "sql":
      return "text-blue-500"
    case "sh":
    case "bash":
      return "text-green-400"
    case "dockerfile":
      return "text-blue-600"
    case "toml":
    case "ini":
    case "cfg":
    case "conf":
      return "text-gray-500"
    case "log":
      return "text-gray-400"
    case "txt":
      return "text-gray-600"
    case "pdf":
      return "text-red-500"
    default:
      return "text-gray-500"
  }
}

export default function CodeViewer({
  fileName,
  content,
  isLoading,
  isEditing,
  onEdit: _onEdit,
  onSave: _onSave,
  onCancel: _onCancel,
  onChange,
  onBack,
  onDelete,
  className = "",
}: CodeViewerProps) {
  const [copied, setCopied] = useState(false)
  const [viewMode, setViewMode] = useState<"rendered" | "source">("source")
  const { actualTheme } = useTheme()
  const isMarkdown = fileName.endsWith(".md")
  const language = getLanguage(fileName)
  const isBinary = isBinaryFile(fileName)

  // Ensure content is a string and handle null/undefined
  const safeContent = content || ''

  const handleCopy = () => {
    navigator.clipboard.writeText(safeContent)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    const blob = new Blob([safeContent], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = fileName.split("/").pop() || "file"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Reset view mode when file changes
  useEffect(() => {
    setViewMode("source")
  }, [fileName])

  return (
    <Card className={`h-full flex flex-col overflow-hidden ${className}`}>
      <CardHeader className="py-3 px-4 border-b flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onBack} className="mr-2">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Close file
            </Button>
            <Separator orientation="vertical" className="h-6" />
            {fileName.endsWith(".md") ? (
              <FileText className={`h-4 w-4 ${getFileTypeColor(fileName)}`} />
            ) : (
              <FileCode className={`h-4 w-4 ${getFileTypeColor(fileName)}`} />
            )}
            <CardTitle className="text-base font-medium">{fileName.split("/").pop()}</CardTitle>
            <Badge variant="outline" className="ml-2 text-xs">
              {language}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            {isMarkdown && !isEditing && (
              <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "rendered" | "source")} className="mr-2">
                <TabsList className="h-7">
                  <TabsTrigger value="source" className="text-xs px-2 py-1 h-6">
                    <FileCode className="h-3 w-3 mr-1" />
                    Source
                  </TabsTrigger>
                  <TabsTrigger value="rendered" className="text-xs px-2 py-1 h-6">
                    <Eye className="h-3 w-3 mr-1" />
                    Preview
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            )}
            {!isEditing && (
              <>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={handleCopy}>
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={handleDownload}>
                  <Download className="h-4 w-4" />
                </Button>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="gap-1">
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">Delete File</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Delete File</DialogTitle>
                      <DialogDescription>
                        Are you sure you want to delete this file? This action cannot be undone.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="flex justify-end gap-2 mt-4">
                      <Button variant="outline" onClick={() => {}}>
                        Cancel
                      </Button>
                      <Button variant="destructive" onClick={onDelete}>
                        Delete
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0 overflow-auto flex-grow">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="animate-spin w-6 h-6 text-muted-foreground" />
          </div>
        ) : isEditing ? (
          <textarea
            className="w-full h-full border-0 p-4 font-mono text-sm resize-none focus:outline-none"
            value={safeContent}
            onChange={(e) => onChange(e.target.value)}
            spellCheck={false}
          />
        ) : isMarkdown && viewMode === "rendered" ? (
          <div className="p-4 prose max-w-none dark:prose-invert overflow-hidden">
            <ReactMarkdown
              components={{
                pre: ({ children, ...props }) => (
                  <pre {...props} className="overflow-x-auto whitespace-pre-wrap break-words">
                    {children}
                  </pre>
                ),
                code: ({ children, ...props }) => (
                  <code {...props} className="break-words">
                    {children}
                  </code>
                ),
                p: ({ children, ...props }) => (
                  <p {...props} className="break-words">
                    {children}
                  </p>
                )
              }}
            >
              {safeContent}
            </ReactMarkdown>
          </div>
        ) : isBinary ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <FileCode className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Binary File</h3>
            <p className="text-muted-foreground mb-4">
              This file cannot be displayed in the browser. You can download it to view its contents.
            </p>
            <Button onClick={handleDownload} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Download File
            </Button>
          </div>
        ) : (
          <div className="overflow-auto">
            {/* Fallback to simple code display if SyntaxHighlighter fails */}
            {(() => {
              try {
                return (
                  <SyntaxHighlighter
                    language={language === 'text' ? 'plaintext' : language}
                    showLineNumbers={true}
                    lineNumberStyle={{
                      minWidth: '3em',
                      paddingRight: '1em',
                      textAlign: 'right',
                      userSelect: 'none',
                      fontSize: '0.75rem',
                      color: actualTheme === 'dark' ? '#6b7280' : '#9ca3af'
                    }}
                    customStyle={{
                      margin: 0,
                      padding: '1rem',
                      background: actualTheme === 'dark' ? '#1e1e1e' : '#ffffff',
                      color: actualTheme === 'dark' ? '#d4d4d4' : '#24292e',
                      fontSize: '0.875rem',
                      lineHeight: '1.5',
                      border: 'none'
                    }}
                    codeTagProps={{
                      style: {
                        fontFamily: 'JetBrains Mono, Fira Code, Monaco, Consolas, monospace',
                        background: 'transparent'
                      }
                    }}
                  >
                    {safeContent}
                  </SyntaxHighlighter>
                )
              } catch (error) {
                console.error('SyntaxHighlighter error:', error)
                // Fallback to simple pre/code display
                const lines = safeContent.split('\n')
                return (
                  <div className="font-mono text-sm">
                    {lines.map((line, index) => (
                      <div key={index} className="flex hover:bg-muted/30 group">
                        <div className="flex-shrink-0 w-12 text-right pr-3 py-0.5 text-muted-foreground select-none text-xs border-r border-border group-hover:bg-muted/20">
                          {index + 1}
                        </div>
                        <div className="flex-1 pl-3 py-0.5 whitespace-pre-wrap break-all overflow-hidden">
                          {line || " "}
                        </div>
                      </div>
                    ))}
                  </div>
                )
              }
            })()}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

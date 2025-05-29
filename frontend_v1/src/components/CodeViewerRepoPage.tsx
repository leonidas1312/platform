"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Loader2, Copy, Download, FileCode, FileText, Check, Eye, ArrowLeft, Trash2 } from "lucide-react"
import ReactMarkdown from "react-markdown"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { PrismLight as SyntaxHighlighter } from "react-syntax-highlighter"
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism"

// Import language support
import javascript from "react-syntax-highlighter/dist/esm/languages/prism/javascript"
import typescript from "react-syntax-highlighter/dist/esm/languages/prism/typescript"
import python from "react-syntax-highlighter/dist/esm/languages/prism/python"
import json from "react-syntax-highlighter/dist/esm/languages/prism/json"
import markdown from "react-syntax-highlighter/dist/esm/languages/prism/markdown"
import css from "react-syntax-highlighter/dist/esm/languages/prism/css"
import yaml from "react-syntax-highlighter/dist/esm/languages/prism/yaml"
import jsx from "react-syntax-highlighter/dist/esm/languages/prism/jsx"
import tsx from "react-syntax-highlighter/dist/esm/languages/prism/tsx"
import bash from "react-syntax-highlighter/dist/esm/languages/prism/bash"
import sql from "react-syntax-highlighter/dist/esm/languages/prism/sql"
import markup from "react-syntax-highlighter/dist/esm/languages/prism/markup"

// Register languages
SyntaxHighlighter.registerLanguage("javascript", javascript)
SyntaxHighlighter.registerLanguage("typescript", typescript)
SyntaxHighlighter.registerLanguage("python", python)
SyntaxHighlighter.registerLanguage("json", json)
SyntaxHighlighter.registerLanguage("markdown", markdown)
SyntaxHighlighter.registerLanguage("css", css)
SyntaxHighlighter.registerLanguage("yaml", yaml)
SyntaxHighlighter.registerLanguage("jsx", jsx)
SyntaxHighlighter.registerLanguage("tsx", tsx)
SyntaxHighlighter.registerLanguage("bash", bash)
SyntaxHighlighter.registerLanguage("sql", sql)
SyntaxHighlighter.registerLanguage("html", markup)
SyntaxHighlighter.registerLanguage("xml", markup)

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
      return "markdown"
    case "html":
      return "html"
    case "css":
      return "css"
    case "yml":
    case "yaml":
      return "yaml"
    case "sh":
    case "bash":
      return "bash"
    case "sql":
      return "sql"
    default:
      return "plaintext"
  }
}

// Function to add line numbers to code (for plaintext files)
const addLineNumbers = (code: string) => {
  const lines = code.split("\n")
  return lines.map((line, index) => (
    <div key={index} className="table-row group hover:bg-muted/30">
      <div className="table-cell text-right pr-4 text-muted-foreground select-none w-12 text-xs py-0.5 group-hover:bg-muted/20">
        {index + 1}
      </div>
      <div className="table-cell pl-4 border-l border-muted whitespace-pre-wrap break-all font-mono py-0.5">{line || " "}</div>
    </div>
  ))
}

// Customize the theme for better visibility
const customizedTheme = {
  ...oneDark,
  'pre[class*="language-"]': {
    ...oneDark['pre[class*="language-"]'],
    background: "transparent",
  },
  'code[class*="language-"]': {
    ...oneDark['code[class*="language-"]'],
    background: "transparent",
  },
}

export default function CodeViewer({
  fileName,
  content,
  isLoading,
  isEditing,
  onEdit,
  onSave,
  onCancel,
  onChange,
  onBack,
  onDelete,
  className = "",
}: CodeViewerProps) {
  const [copied, setCopied] = useState(false)
  const [viewMode, setViewMode] = useState<"rendered" | "source">("source")
  const isMarkdown = fileName.endsWith(".md")
  const language = getLanguage(fileName)

  const handleCopy = () => {
    navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    const blob = new Blob([content], { type: "text/plain" })
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
              <FileText className="h-4 w-4 text-blue-500" />
            ) : (
              <FileCode className="h-4 w-4 text-yellow-500" />
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
            value={content}
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
              {content}
            </ReactMarkdown>
          </div>
        ) : (
          <div className="p-0 overflow-auto bg-muted/30">
            {language !== "plaintext" ? (
              <div className="bg-[#282c34] rounded-b-lg">
                <SyntaxHighlighter
                  language={language}
                  style={customizedTheme}
                  showLineNumbers={true}
                  customStyle={{
                    margin: 0,
                    padding: "1rem",
                    fontSize: "0.875rem",
                    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                    borderRadius: 0,
                  }}
                  lineNumberStyle={{
                    minWidth: "2.5rem",
                    paddingRight: "1rem",
                    textAlign: "right",
                    color: "#636e7b",
                    userSelect: "none",
                  }}
                  wrapLines={true}
                  wrapLongLines={true}
                >
                  {content}
                </SyntaxHighlighter>
              </div>
            ) : (
              <div className="table w-full text-sm overflow-hidden">{addLineNumbers(content)}</div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

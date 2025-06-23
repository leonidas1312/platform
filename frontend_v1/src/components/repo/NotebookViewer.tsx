"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  BookOpen,
  Download,
  ExternalLink,
  Code,
  FileText,
  Play,
  Loader2,
  AlertCircle
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"
import { handleColabOpen } from "@/utils/colabUtils"
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { useTheme } from "@/components/ThemeContext"
import ReactMarkdown from "react-markdown"

interface NotebookCell {
  cell_type: 'code' | 'markdown' | 'raw'
  source: string[]
  outputs?: any[]
  execution_count?: number | null
}

interface NotebookData {
  cells: NotebookCell[]
  metadata: any
  nbformat: number
  nbformat_minor: number
}

interface NotebookViewerProps {
  content: string
  fileName: string
  onDownload?: () => void
  className?: string
}

export default function NotebookViewer({
  content,
  fileName,
  onDownload,
  className
}: NotebookViewerProps) {
  const { toast } = useToast()
  const { actualTheme } = useTheme()
  const [notebook, setNotebook] = useState<NotebookData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isColabLoading, setIsColabLoading] = useState(false)

  useEffect(() => {
    try {
      const parsed = JSON.parse(content) as NotebookData
      setNotebook(parsed)
      setError(null)
    } catch (err) {
      setError("Failed to parse notebook content")
      console.error("Notebook parsing error:", err)
    } finally {
      setLoading(false)
    }
  }, [content])

  const handleDownload = () => {
    if (onDownload) {
      onDownload()
    } else {
      // Fallback download
      const blob = new Blob([content], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }

    toast({
      title: "Download started",
      description: `${fileName} is being downloaded`,
    })
  }

  const handleOpenInColab = async () => {
    setIsColabLoading(true)
    try {
      const success = await handleColabOpen(content, fileName)
      if (success) {
        toast({
          title: "Opening in Google Colab",
          description: "The notebook has been downloaded. Upload it to Colab to continue.",
        })
      } else {
        throw new Error("Failed to prepare notebook for Colab")
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to open notebook in Google Colab",
        variant: "destructive"
      })
    } finally {
      setIsColabLoading(false)
    }
  }

  const renderCell = (cell: NotebookCell, index: number) => {
    const source = Array.isArray(cell.source) ? cell.source.join('') : cell.source

    if (cell.cell_type === 'markdown') {
      return (
        <div key={index} className="mb-4">
          <div className="bg-background border border-border/40 rounded-lg p-4">
            <div className="prose prose-sm max-w-none dark:prose-invert overflow-hidden">
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
                {source}
              </ReactMarkdown>
            </div>
          </div>
        </div>
      )
    }

    if (cell.cell_type === 'code') {
      return (
        <div key={index} className="mb-4">
          <div className="bg-muted/30 border border-border/40 rounded-lg overflow-hidden">
            {/* Code input */}
            <div className="bg-muted/50 px-3 py-2 border-b border-border/30 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  <Code className="h-3 w-3 mr-1" />
                  Code
                </Badge>
                {cell.execution_count && (
                  <Badge variant="secondary" className="text-xs">
                    [{cell.execution_count}]
                  </Badge>
                )}
              </div>
            </div>
            <div className="overflow-auto">
              {(() => {
                try {
                  return (
                    <SyntaxHighlighter
                      language="python"
                      showLineNumbers={false}
                      customStyle={{
                        margin: 0,
                        padding: '1rem',
                        background: actualTheme === 'dark' ? '#1e1e1e' : '#f8f8f8',
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
                      {source || ''}
                    </SyntaxHighlighter>
                  )
                } catch (error) {
                  console.error('SyntaxHighlighter error in notebook:', error)
                  // Fallback to simple pre/code display
                  return (
                    <pre className="text-sm font-mono overflow-x-auto whitespace-pre-wrap break-words p-4">
                      <code>{source || ''}</code>
                    </pre>
                  )
                }
              })()}
            </div>

            {/* Code outputs */}
            {cell.outputs && cell.outputs.length > 0 && (
              <div className="border-t border-border/30 bg-background/50">
                <div className="px-3 py-2 bg-muted/30 border-b border-border/30">
                  <Badge variant="outline" className="text-xs">
                    Output
                  </Badge>
                </div>
                <div className="p-4">
                  {cell.outputs.map((output, outputIndex) => (
                    <div key={outputIndex} className="mb-2 last:mb-0">
                      {output.text && (
                        <pre className="text-sm text-muted-foreground whitespace-pre-wrap break-words">
                          {Array.isArray(output.text) ? output.text.join('') : output.text}
                        </pre>
                      )}
                      {output.data && output.data['text/plain'] && (
                        <pre className="text-sm whitespace-pre-wrap break-words">
                          {Array.isArray(output.data['text/plain'])
                            ? output.data['text/plain'].join('')
                            : output.data['text/plain']}
                        </pre>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )
    }

    return null
  }

  if (loading) {
    return (
      <Card className={cn("border-border/60", className)}>
        <CardContent className="p-8 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
          <p className="mt-4 text-muted-foreground">Loading notebook...</p>
        </CardContent>
      </Card>
    )
  }

  if (error || !notebook) {
    return (
      <Card className={cn("border-border/60", className)}>
        <CardContent className="p-8 text-center">
          <AlertCircle className="h-8 w-8 mx-auto text-destructive mb-4" />
          <p className="text-destructive mb-4">{error || "Failed to load notebook"}</p>
          <Button variant="outline" onClick={handleDownload}>
            <Download className="h-4 w-4 mr-2" />
            Download Raw File
          </Button>
        </CardContent>
      </Card>
    )
  }

  const cellCount = notebook.cells.length
  const codeCount = notebook.cells.filter(cell => cell.cell_type === 'code').length
  const markdownCount = notebook.cells.filter(cell => cell.cell_type === 'markdown').length

  return (
    <Card className={cn("border-border/60 overflow-hidden shadow-sm", className)}>
      <CardHeader className="pb-4 bg-gradient-to-r from-background via-background/80 to-orange-500/5 border-b border-border/30">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-orange-500/10">
              <BookOpen className="h-5 w-5 text-orange-500" />
            </div>
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                Jupyter Notebook
                <Badge variant="outline" className="text-white border-none bg-gradient-to-r from-orange-500 to-red-500">
                  .ipynb
                </Badge>
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">{fileName}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              className="h-8"
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>

            <Button
              variant="default"
              size="sm"
              onClick={handleOpenInColab}
              disabled={isColabLoading}
              className="h-8 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
            >
              {isColabLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <ExternalLink className="h-4 w-4 mr-2" />
              )}
              Open in Colab
            </Button>
          </div>
        </div>

        {/* Notebook stats */}
        <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
          <span>{cellCount} cells</span>
          <span>{codeCount} code</span>
          <span>{markdownCount} markdown</span>
          {notebook.metadata?.kernelspec?.display_name && (
            <Badge variant="secondary" className="text-xs">
              {notebook.metadata.kernelspec.display_name}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-6 max-h-[600px] overflow-y-auto">
        <div className="space-y-4">
          {notebook.cells.slice(0, 10).map((cell, index) => renderCell(cell, index))}

          {notebook.cells.length > 10 && (
            <div className="text-center py-4 border-t border-border/30">
              <p className="text-sm text-muted-foreground mb-4">
                Showing first 10 cells. Download the notebook to view all {notebook.cells.length} cells.
              </p>
              <Button variant="outline" onClick={handleDownload}>
                <Download className="h-4 w-4 mr-2" />
                Download Full Notebook
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

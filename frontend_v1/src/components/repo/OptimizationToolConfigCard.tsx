"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Brain,
  ExternalLink,
  Copy,
  Check,
  Code,
  FileText,
  Download,
  Settings
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"

interface OptimizationToolConfigCardProps {
  config: any
  fileName: string
  onEdit?: () => void
  onDownload?: () => void
  onViewFile?: () => void
  className?: string
}

export default function OptimizationToolConfigCard({
  config,
  fileName,
  onEdit,
  onDownload,
  onViewFile,
  className
}: OptimizationToolConfigCardProps) {
  const { toast } = useToast()
  const [copied, setCopied] = useState(false)

  const handleCopyConfig = () => {
    navigator.clipboard.writeText(JSON.stringify(config, null, 2))
    setCopied(true)
    toast({
      title: "Configuration copied",
      description: "Optimization tool configuration has been copied to your clipboard",
    })
    setTimeout(() => setCopied(false), 2000)
  }

  const toolType = config?.type || 'unknown'
  const isOptimizer = toolType === 'optimizer'
  const isProblem = toolType === 'problem'

  return (
    <Card className={cn(
      "border-border/60 overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 bg-gradient-to-br from-background via-background to-primary/5",
      className
    )}>
      <CardHeader className="pb-4 bg-gradient-to-r from-background via-background/80 to-primary/10 border-b border-border/30">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-2 rounded-full",
              isOptimizer ? "bg-orange-500/10" : isProblem ? "bg-blue-500/10" : "bg-purple-500/10"
            )}>
              <Brain className={cn(
                "h-5 w-5",
                isOptimizer ? "text-orange-500" : isProblem ? "text-blue-500" : "text-purple-500"
              )} />
            </div>
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                Optimization Tool Configuration
                <Badge
                  variant="outline"
                  className={cn(
                    "px-3 py-1 text-sm font-small border-none text-white",
                    isOptimizer
                      ? "bg-gradient-to-r from-orange-500 to-red-500"
                      : isProblem
                        ? "bg-gradient-to-r from-blue-500 to-cyan-500"
                        : "bg-purple-500"
                  )}
                >
                  {isOptimizer ? "Optimizer" : isProblem ? "Problem" : "Unknown"}
                </Badge>
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {fileName}
              </p>
            </div>
          </div>

          {/* External link icon */}
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 opacity-60 hover:opacity-100"
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {config?.entry_point && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Code className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Entry Point</span>
              </div>
              <Badge variant="outline" className="font-mono text-xs">
                {config.entry_point}.py
              </Badge>
            </div>
          )}

          {config?.class_name && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Class Name</span>
              </div>
              <Badge variant="outline" className="font-mono text-xs">
                {config.class_name}
              </Badge>
            </div>
          )}
        </div>

        {/* Metadata Information */}
        {config?.metadata && (
          <div className="space-y-4">
            {config.metadata.name && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Name</span>
                </div>
                <Badge variant="outline" className="font-mono text-xs">
                  {config.metadata.name}
                </Badge>
              </div>
            )}

            {config.metadata.description && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Description</span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {config.metadata.description}
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {config.metadata.author && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Settings className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">Author</span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {config.metadata.author}
                  </Badge>
                </div>
              )}

              {config.metadata.version && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Code className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">Version</span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {config.metadata.version}
                  </Badge>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Default Parameters */}
        {config?.default_params && Object.keys(config.default_params).length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Code className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Default Parameters</span>
            </div>
            <div className="bg-muted/30 rounded-lg p-3 border border-border/30">
              <pre className="text-xs font-mono text-muted-foreground overflow-x-auto">
                {JSON.stringify(config.default_params, null, 2)}
              </pre>
            </div>
          </div>
        )}

        {/* ArXiv Links */}
        {config?.link_to_arxiv && config.link_to_arxiv.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <ExternalLink className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Research Papers</span>
            </div>
            <div className="space-y-2">
              {config.link_to_arxiv.map((link: string, index: number) => (
                <a
                  key={index}
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  <ExternalLink className="h-3 w-3" />
                  {link}
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 pt-4 border-t border-border/30">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyConfig}
            className="flex-1"
          >
            {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
            {copied ? "Copied" : "Copy Config"}
          </Button>

          {onDownload && (
            <Button
              variant="outline"
              size="sm"
              onClick={onDownload}
              className="flex-1"
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          )}

          {onViewFile && (
            <Button
              variant="outline"
              size="sm"
              onClick={onViewFile}
              className="flex-1"
            >
              <FileText className="h-4 w-4 mr-2" />
              View File
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

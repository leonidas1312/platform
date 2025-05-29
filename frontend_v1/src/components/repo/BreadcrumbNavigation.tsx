"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { ChevronRight, Home, Folder, GitBranch } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface BreadcrumbNavigationProps {
  path: string
  repoName: string
  branch?: string
  onNavigate: (path: string) => void
  className?: string
}

export default function BreadcrumbNavigation({ 
  path, 
  repoName, 
  branch = "main", 
  onNavigate,
  className 
}: BreadcrumbNavigationProps) {
  // Split the path into segments
  const segments = path ? path.split("/").filter(Boolean) : []

  // Build an array of paths for navigation
  const pathsForNavigation = segments.reduce<string[]>(
    (acc, segment, index) => {
      const previousPath = index === 0 ? "" : acc[index]
      const currentPath = previousPath ? 
        `${previousPath}/${encodeURIComponent(segment)}` : 
        encodeURIComponent(segment)
      return [...acc, currentPath]
    }, 
    [""]
  )

  return (
    <div className={cn(
      "flex items-center gap-1 text-sm overflow-x-auto whitespace-nowrap py-3 px-4 bg-muted/30 rounded-lg border border-border/40 mb-6",
      className
    )}>
      {/* Repository root */}
      <Button
        variant="ghost"
        size="sm"
        className="h-8 px-3 text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors"
        onClick={() => onNavigate("")}
      >
        <Home className="h-4 w-4 mr-2" />
        <span className="font-medium">{decodeURIComponent(repoName)}</span>
      </Button>

      {/* Branch indicator */}
      {branch && (
        <>
          <ChevronRight className="h-3 w-3 mx-1 text-muted-foreground/60" />
          <Badge 
            variant="outline" 
            className="h-6 px-2 text-xs bg-background/80 border-border/60 text-muted-foreground"
          >
            <GitBranch className="h-3 w-3 mr-1" />
            {branch}
          </Badge>
        </>
      )}

      {/* Path segments */}
      {segments.map((segment, index) => {
        const decodedSegment = decodeURIComponent(segment)
        const isLast = index === segments.length - 1
        
        return (
          <React.Fragment key={index}>
            <ChevronRight className="h-3 w-3 mx-1 text-muted-foreground/60" />
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-8 px-3 transition-colors",
                isLast 
                  ? "text-foreground font-medium bg-secondary/50 hover:bg-secondary/70" 
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/80"
              )}
              onClick={() => onNavigate(pathsForNavigation[index + 1])}
            >
              <Folder className="h-4 w-4 mr-2" />
              <span className="max-w-[120px] truncate" title={decodedSegment}>
                {decodedSegment}
              </span>
            </Button>
          </React.Fragment>
        )
      })}
    </div>
  )
}

/**
 * Compact breadcrumb for mobile/small screens
 */
export function CompactBreadcrumb({ 
  path, 
  repoName, 
  onNavigate,
  className 
}: Omit<BreadcrumbNavigationProps, 'branch'>) {
  const segments = path ? path.split("/").filter(Boolean) : []
  const currentFolder = segments.length > 0 ? segments[segments.length - 1] : repoName

  return (
    <div className={cn(
      "flex items-center gap-2 text-sm py-2 px-3 bg-muted/30 rounded-md border border-border/40",
      className
    )}>
      <Button
        variant="ghost"
        size="sm"
        className="h-7 px-2 text-muted-foreground hover:text-foreground"
        onClick={() => onNavigate("")}
      >
        <Home className="h-3.5 w-3.5" />
      </Button>
      
      {segments.length > 0 && (
        <>
          <ChevronRight className="h-3 w-3 text-muted-foreground/60" />
          <span className="text-foreground font-medium truncate">
            {decodeURIComponent(currentFolder)}
          </span>
        </>
      )}
    </div>
  )
}

/**
 * Breadcrumb with file count and size info
 */
export function EnhancedBreadcrumb({ 
  path, 
  repoName, 
  branch, 
  onNavigate,
  fileCount,
  totalSize,
  className 
}: BreadcrumbNavigationProps & {
  fileCount?: number
  totalSize?: string
}) {
  return (
    <div className={cn("space-y-3", className)}>
      <BreadcrumbNavigation
        path={path}
        repoName={repoName}
        branch={branch}
        onNavigate={onNavigate}
      />
      
      {(fileCount !== undefined || totalSize) && (
        <div className="flex items-center gap-4 text-xs text-muted-foreground px-4">
          {fileCount !== undefined && (
            <span>{fileCount} {fileCount === 1 ? 'item' : 'items'}</span>
          )}
          {totalSize && (
            <span>{totalSize}</span>
          )}
        </div>
      )}
    </div>
  )
}

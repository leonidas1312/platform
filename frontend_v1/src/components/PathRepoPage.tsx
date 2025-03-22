import React from "react"
import { Button } from "@/components/ui/button"
import { ChevronRight, Code, Folder, Home } from "lucide-react"

interface PathBreadcrumbProps {
  path: string
  repoName: string
  branch?: string
  onNavigate: (path: string) => void
}

export default function PathBreadcrumb({ path, repoName, branch = "main", onNavigate }: PathBreadcrumbProps) {
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
    <div className="flex items-center text-sm overflow-x-auto whitespace-nowrap py-2 px-1 bg-muted/30 rounded-md mb-4">
      <Button
        variant="ghost"
        size="sm"
        className="h-7 px-2 text-muted-foreground hover:text-foreground"
        onClick={() => onNavigate("")}
      >
        <Home className="h-3.5 w-3.5 mr-1" />
        {decodeURIComponent(repoName)}
      </Button>

      {segments.map((segment, index) => {
        const decodedSegment = decodeURIComponent(segment)
        return (
          <React.Fragment key={index}>
            <ChevronRight className="h-3 w-3 mx-1 text-muted-foreground" />
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-muted-foreground hover:text-foreground"
              onClick={() => onNavigate(pathsForNavigation[index + 1])}
            >
              {index === segments.length - 1 ? (
                <Code className="h-3.5 w-3.5 mr-1" />
              ) : (
                <Folder className="h-3.5 w-3.5 mr-1" />
              )}
              {decodedSegment}
            </Button>
          </React.Fragment>
        )
      })}
    </div>
  )
}


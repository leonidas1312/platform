"use client"

import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"
import { useState } from "react"

interface DocTocProps {
  headings: Array<{ id: string; text: string; level: number }>
  activeId?: string
  onHeadingClick: (id: string) => void
}

export function DocToc({ headings, activeId, onHeadingClick }: DocTocProps) {
  const [isExpanded, setIsExpanded] = useState(true)

  if (!headings.length) return null

  return (
    <div className="hidden xl:block w-64 relative">
      <div className="sticky top-24 overflow-hidden">
        <div className="border border-border/60 rounded-lg bg-gray-50/50 dark:bg-gray-900/30 p-4">
          <div
            className="flex items-center justify-between mb-3 cursor-pointer"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <h4 className="font-medium text-sm">On This Page</h4>
            <ChevronDown
              className={cn(
                "h-4 w-4 text-muted-foreground transition-transform",
                isExpanded ? "transform rotate-180" : "",
              )}
            />
          </div>

          <motion.div
            initial={false}
            animate={{ height: isExpanded ? "auto" : 0, opacity: isExpanded ? 1 : 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <nav className="space-y-1">
              {headings.map((heading) => (
                <a
                  key={heading.id}
                  href={`#${heading.id}`}
                  onClick={(e) => {
                    e.preventDefault()
                    onHeadingClick(heading.id)
                  }}
                  className={cn(
                    "block py-1 text-sm transition-colors hover:text-primary",
                    heading.level === 1 ? "font-medium" : "",
                    heading.level === 2 ? "pl-3 text-muted-foreground" : "",
                    heading.level === 3 ? "pl-6 text-muted-foreground text-xs" : "",
                    activeId === heading.id ? "text-primary font-medium" : "",
                  )}
                >
                  {heading.text}
                </a>
              ))}
            </nav>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

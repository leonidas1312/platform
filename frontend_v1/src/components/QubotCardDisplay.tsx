"use client"

import { useState, useEffect } from "react"
import ReactMarkdown from "react-markdown"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, FolderOpen, Copy, Check, Link, BookOpen, ArrowRight, ChevronRight } from "lucide-react"
import remarkGfm from "remark-gfm"
import rehypeRaw from "rehype-raw"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/components/ui/use-toast"

interface QubotCardDisplayProps {
  data?: any
  readme: string
  onGoToFile?: (filePath: string) => void
}

export default function QubotCardDisplay({ data, readme, onGoToFile }: QubotCardDisplayProps) {
  const { toast } = useToast()
  const [headings, setHeadings] = useState<Array<{ id: string; text: string; level: number }>>([])
  const [copied, setCopied] = useState(false)

  // Extract headings from readme for table of contents
  useEffect(() => {
    if (!readme) return

    const headingRegex = /^(#{1,3})\s+(.+)$/gm
    const matches = [...readme.matchAll(headingRegex)]

    const extractedHeadings = matches.map((match) => {
      const level = match[1].length
      const text = match[2]
      const id = text
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^\w-]/g, "")
      return { id, text, level }
    })

    setHeadings(extractedHeadings)
  }, [readme])

  const handleCopyReadme = () => {
    navigator.clipboard.writeText(readme)
    setCopied(true)
    toast({
      title: "Copied to clipboard",
      description: "README content copied to clipboard",
    })
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-6">
      {/* Beautiful README Card with enhanced styling */}
      <Card className="border-border/60 overflow-hidden shadow-sm hover:shadow-md transition-all duration-300">
        <CardHeader className="pb-3 bg-gradient-to-r from-background via-background/80 to-primary/5 border-b border-border/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="bg-primary/10 p-2 rounded-full mr-3">
                <BookOpen className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl">README</CardTitle>
                {data?.problem_name && <p className="text-sm text-muted-foreground mt-1">{data.problem_name}</p>}
              </div>
            </div>

            
          </div>
        </CardHeader>

        

        <CardContent className="p-6 pt-4">
          {readme ? (
            <div className="prose prose-sm md:prose lg:prose-lg max-w-none dark:prose-invert">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw]}
                components={{
                  code({ className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || "")
                    return match ? (
                      <div className="relative rounded-md overflow-hidden my-4 group">
                        <div className="bg-zinc-950 dark:bg-zinc-900 text-xs px-3 py-1.5 border-b border-zinc-800 flex justify-between items-center">
                          <span className="text-zinc-400">{match[1]}</span>
                          <button
                            onClick={() => {
                              const code = String(children).replace(/\n$/, "")
                              navigator.clipboard.writeText(code)
                              toast({
                                title: "Code copied",
                                description: "Code snippet copied to clipboard",
                              })
                            }}
                            className="text-zinc-500 hover:text-zinc-300 transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <pre className="p-4 overflow-x-auto bg-zinc-950 dark:bg-zinc-900 text-zinc-100 dark:text-zinc-200 text-sm">
                          <code className={className} {...props}>
                            {String(children).replace(/\n$/, "")}
                          </code>
                        </pre>
                      </div>
                    ) : (
                      <code className="bg-muted px-1.5 py-0.5 rounded-sm text-sm" {...props}>
                        {children}
                      </code>
                    )
                  },
                  a: ({ ...props }) => (
                    <a
                      {...props}
                      target={props.href?.startsWith("http") ? "_blank" : undefined}
                      rel={props.href?.startsWith("http") ? "noopener noreferrer" : undefined}
                      className="text-primary hover:underline inline-flex items-center"
                    >
                      {props.children}
                      {props.href?.startsWith("http") && <Link className="h-3 w-3 ml-1 inline-block" />}
                    </a>
                  ),
                  img: ({ ...props }) => (
                    <div className="my-6 rounded-lg overflow-hidden border border-border/40 shadow-sm">
                      <img {...props} className="max-w-full h-auto" alt={props.alt || "Image"} />
                    </div>
                  ),
                  h1: ({ ...props }) => {
                    // Create an ID from the heading text
                    const id =
                      props.children
                        ?.toString()
                        .toLowerCase()
                        .replace(/\s+/g, "-")
                        .replace(/[^\w-]/g, "") || ""
                    return (
                      <h1 id={id} {...props} className="text-2xl font-bold mt-8 mb-4 pb-2 border-b border-border/40">
                        {props.children}
                      </h1>
                    )
                  },
                  h2: ({ ...props }) => {
                    const id =
                      props.children
                        ?.toString()
                        .toLowerCase()
                        .replace(/\s+/g, "-")
                        .replace(/[^\w-]/g, "") || ""
                    return (
                      <h2 id={id} {...props} className="text-xl font-bold mt-6 mb-3 group flex items-center">
                        <a href={`#${id}`} className="opacity-0 group-hover:opacity-100 mr-2">
                          <Link className="h-4 w-4 text-primary/60" />
                        </a>
                        {props.children}
                      </h2>
                    )
                  },
                  h3: ({ ...props }) => {
                    const id =
                      props.children
                        ?.toString()
                        .toLowerCase()
                        .replace(/\s+/g, "-")
                        .replace(/[^\w-]/g, "") || ""
                    return (
                      <h3 id={id} {...props} className="text-lg font-bold mt-5 mb-2 group flex items-center">
                        <a href={`#${id}`} className="opacity-0 group-hover:opacity-100 mr-2">
                          <Link className="h-3.5 w-3.5 text-primary/60" />
                        </a>
                        {props.children}
                      </h3>
                    )
                  },
                  ul: ({ ...props }) => <ul {...props} className="list-disc pl-6 my-4 space-y-1" />,
                  ol: ({ ...props }) => <ol {...props} className="list-decimal pl-6 my-4 space-y-1" />,
                  li: ({ ...props }) => <li {...props} className="mb-1" />,
                  blockquote: ({ ...props }) => (
                    <blockquote
                      {...props}
                      className="border-l-4 border-primary/30 pl-4 italic my-4 text-muted-foreground bg-muted/30 py-2 pr-2 rounded-r-md"
                    />
                  ),
                  table: ({ ...props }) => (
                    <div className="overflow-x-auto my-6 rounded-md border border-border/40">
                      <table {...props} className="min-w-full divide-y divide-border" />
                    </div>
                  ),
                  tr: ({ ...props }) => <tr {...props} className="border-b border-border/30" />,
                  th: ({ ...props }) => <th {...props} className="px-4 py-2 text-left font-medium bg-muted/50" />,
                  td: ({ ...props }) => <td {...props} className="px-4 py-2" />,
                  hr: ({ ...props }) => <hr {...props} className="my-6 border-border/40" />,
                }}
              >
                {readme}
              </ReactMarkdown>
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="h-16 w-16 mx-auto text-muted-foreground opacity-30 mb-4" />
              <h3 className="text-lg font-medium mb-2">No README content available</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Add a README.md file to your repository to provide documentation and information about your project.
              </p>
              {onGoToFile && (
                <Button
                  onClick={() => onGoToFile("README.md")}
                  className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Create README.md
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      
          
      
    </div>
  )
}

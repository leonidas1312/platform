"use client"

import ReactMarkdown from "react-markdown"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText } from "lucide-react"
import remarkGfm from "remark-gfm"
import rehypeRaw from "rehype-raw"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { oneDark } from "react-syntax-highlighter/dist/cjs/styles/prism"
import { Button } from "@/components/ui/button"
import { FolderOpen } from "lucide-react"

interface QubotCardDisplayProps {
  readme: string
  onGoToFile?: (filePath: string) => void
}

export default function QubotCardDisplay({ readme, onGoToFile }: QubotCardDisplayProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <FileText className="h-5 w-5 mr-2 text-muted-foreground" />
              <CardTitle className="text-xl">README</CardTitle>
            </div>

            
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {readme ? (
            <div className="prose prose-sm md:prose max-w-none dark:prose-invert">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw]}
                components={{
                  code({ className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || "")
                    return match ? (
                      <SyntaxHighlighter style={oneDark} language={match[1]} PreTag="div" {...props}>
                        {String(children).replace(/\n$/, "")}
                      </SyntaxHighlighter>
                    ) : (
                      <code className={className} {...props}>
                        {children}
                      </code>
                    )
                  },
                  a: ({ ...props }) => (
                    <a
                      {...props}
                      target={props.href?.startsWith("http") ? "_blank" : undefined}
                      rel={props.href?.startsWith("http") ? "noopener noreferrer" : undefined}
                      className="text-primary hover:underline"
                    />
                  ),
                  img: ({ ...props }) => <img {...props} className="max-w-full h-auto" alt={props.alt || "Image"} />,
                  h1: ({ ...props }) => {
                    // Create an ID from the heading text
                    const id =
                      props.children
                        ?.toString()
                        .toLowerCase()
                        .replace(/\s+/g, "-")
                        .replace(/[^\w-]/g, "") || ""
                    return <h1 id={id} {...props} className="text-2xl font-bold mt-6 mb-4" />
                  },
                  h2: ({ ...props }) => {
                    const id =
                      props.children
                        ?.toString()
                        .toLowerCase()
                        .replace(/\s+/g, "-")
                        .replace(/[^\w-]/g, "") || ""
                    return <h2 id={id} {...props} className="text-xl font-bold mt-5 mb-3" />
                  },
                  h3: ({ ...props }) => {
                    const id =
                      props.children
                        ?.toString()
                        .toLowerCase()
                        .replace(/\s+/g, "-")
                        .replace(/[^\w-]/g, "") || ""
                    return <h3 id={id} {...props} className="text-lg font-bold mt-4 mb-2" />
                  },
                  ul: ({ ...props }) => <ul {...props} className="list-disc pl-6 my-4" />,
                  ol: ({ ...props }) => <ol {...props} className="list-decimal pl-6 my-4" />,
                  li: ({ ...props }) => <li {...props} className="mb-1" />,
                  table: ({ ...props }) => (
                    <div className="overflow-x-auto my-4">
                      <table {...props} className="min-w-full divide-y divide-border" />
                    </div>
                  ),
                  tr: ({ ...props }) => <tr {...props} className="border-b border-border" />,
                  th: ({ ...props }) => <th {...props} className="px-4 py-2 text-left font-medium" />,
                  td: ({ ...props }) => <td {...props} className="px-4 py-2" />,
                }}
              >
                {readme}
              </ReactMarkdown>
            </div>
          ) : (
            <p className="text-muted-foreground italic">No README content provided.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}


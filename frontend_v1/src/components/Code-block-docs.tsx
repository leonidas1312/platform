import type React from "react"
import SyntaxHighlighter from "react-syntax-highlighter"
import { docco } from "react-syntax-highlighter/dist/esm/styles/hljs"

interface CodeBlockProps {
  language: string
  code: string
}

export const CodeBlock: React.FC<CodeBlockProps> = ({ language, code }) => {
  return (
    <SyntaxHighlighter
      language={language}
      style={docco}
      customStyle={{ padding: "20px", borderRadius: "0.375rem", overflowX: "auto" }}
    >
      {code}
    </SyntaxHighlighter>
  )
}

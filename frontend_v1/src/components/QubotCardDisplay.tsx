"use client"

import { useState, useEffect } from "react"
import ReactMarkdown from "react-markdown"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Edit, FileText, Copy, Check, Link, BookOpen, Plus, Trash2, X } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import remarkGfm from "remark-gfm"
import rehypeRaw from "rehype-raw"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"

interface QubotCardDisplayProps {
  data?: any
  readme: string
  onGoToFile?: (filePath: string) => void
  onSaveQubotSetup?: (configData: any) => Promise<void>
  allRepoFiles?: any[]
}

export default function QubotCardDisplay({
  data,
  readme,
  onGoToFile,
  onSaveQubotSetup,
  allRepoFiles,
}: QubotCardDisplayProps) {
  const { toast } = useToast()
  const [headings, setHeadings] = useState<Array<{ id: string; text: string; level: number }>>([])
  const [copied, setCopied] = useState(false)
  const [showSetupDialog, setShowSetupDialog] = useState(false)
  const [setupComplete, setSetupComplete] = useState(false)
  const [currentSetupStep, setCurrentSetupStep] = useState(1)

  // Qubot setup state
  const [qubotType, setQubotType] = useState<"problem" | "optimizer">(data?.type || "problem")
  const [entrypointFile, setEntrypointFile] = useState<string | null>(
    data?.entry_point ? `${data.entry_point}.py` : null,
  )
  const [entrypointClass, setEntrypointClass] = useState<string>(data?.class_name || "")
  const [qubotParameters, setQubotParameters] = useState<Array<{ name: string; value: string }>>(
    data?.default_params
      ? Object.entries(data.default_params).map(([name, value]) => ({ name, value: String(value) }))
      : [],
  )
  const [newParameterName, setNewParameterName] = useState("")
  const [newParameterValue, setNewParameterValue] = useState("")
  const [arxivLinks, setArxivLinks] = useState<string[]>(
    data?.link_to_arxiv ? (Array.isArray(data.link_to_arxiv) ? data.link_to_arxiv : [data.link_to_arxiv]) : [],
  )
  const [newArxivLink, setNewArxivLink] = useState<string>("")
  const [qubotKeywords, setQubotKeywords] = useState<string[]>(data?.keywords || ["qubot"])
  const [newKeyword, setNewKeyword] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)

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

  const handleCompleteSetup = async () => {
    if (!entrypointFile || !onSaveQubotSetup) return

    try {
      setIsLoading(true)

      // Create a config object with the proper structure
      const configData = {
        type: qubotType,
        entry_point: entrypointFile.replace(/\.[^/.]+$/, ""), // Remove file extension
        class_name: entrypointClass,
        default_params: {},
        link_to_arxiv: arxivLinks.length > 0 ? arxivLinks : undefined,
        keywords: qubotKeywords.length > 0 ? qubotKeywords : ["qubot"],
      }

      // Add parameters to the config
      qubotParameters.forEach((param) => {
        configData.default_params[param.name] = param.value
      })

      // Save the config
      await onSaveQubotSetup(configData)

      // Mark setup as complete
      setSetupComplete(true)
      setShowSetupDialog(false)

      toast({
        title: "Success",
        description: "Qubot setup completed successfully!",
      })
    } catch (err) {
      console.error("Error completing qubot setup:", err)
      toast({
        title: "Error",
        description: "Failed to complete qubot setup",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
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
            <div className="flex items-center">
              
              <Button variant="outline" size="sm" onClick={handleCopyReadme} className="gap-1 h-8">
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "Copied" : "Copy"}
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 pt-4">
          {readme ? (
            <div
              className="prose max-w-none font-sans"
              style={{
                fontFamily:
                  '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji"',
                fontSize: "16px",
                lineHeight: "1.5",
                color: "var(--foreground)",
              }}
            >
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw]}
                components={{
                  code({ className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || "")
                    return match ? (
                      <div className="relative rounded-md overflow-hidden my-4 group border border-border/40">
                        <div className="bg-muted/50 text-xs px-3 py-2 border-b border-border/30 flex justify-between items-center">
                          <span className="text-muted-foreground font-mono">{match[1]}</span>
                          <button
                            onClick={() => {
                              const code = String(children).replace(/\n$/, "")
                              navigator.clipboard.writeText(code)
                              toast({
                                title: "Code copied",
                                description: "Code snippet copied to clipboard",
                              })
                            }}
                            className="text-muted-foreground hover:text-foreground transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 focus:outline-none"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <pre
                          className="p-4 overflow-x-auto bg-muted/20 text-foreground text-sm font-mono"
                          style={{ margin: 0 }}
                        >
                          <code className={className} {...props} style={{ background: "transparent", padding: 0 }}>
                            {String(children).replace(/\n$/, "")}
                          </code>
                        </pre>
                      </div>
                    ) : (
                      <code
                        className="bg-muted/30 px-1.5 py-0.5 rounded-sm text-sm font-mono"
                        style={{
                          fontFamily:
                            "ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, Liberation Mono, monospace",
                        }}
                        {...props}
                      >
                        {children}
                      </code>
                    )
                  },
                  a: ({ ...props }) => (
                    <a
                      {...props}
                      target={props.href?.startsWith("http") ? "_blank" : undefined}
                      rel={props.href?.startsWith("http") ? "noopener noreferrer" : undefined}
                      className="text-[#0969da] hover:underline inline-flex items-center"
                      style={{ textDecoration: "none" }}
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
                      <h1
                        id={id}
                        {...props}
                        className="text-2xl font-semibold mt-6 mb-4 pb-3 border-b border-border/30"
                        style={{ borderBottomWidth: "1px", paddingBottom: "0.3em" }}
                      >
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
                      <h2
                        id={id}
                        {...props}
                        className="text-xl font-semibold mt-6 mb-3 pb-2 border-b border-border/20 group flex items-center"
                        style={{ borderBottomWidth: "1px", paddingBottom: "0.3em" }}
                      >
                        <a href={`#${id}`} className="opacity-0 group-hover:opacity-100 mr-2 focus:opacity-100">
                          <Link className="h-4 w-4 text-[#0969da]" />
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
                        <a href={`#${id}`} className="opacity-0 group-hover:opacity-100 mr-2 focus:opacity-100">
                          <Link className="h-3.5 w-3.5 text-[#0969da]" />
                        </a>
                        {props.children}
                      </h3>
                    )
                  },
                  ul: ({ ...props }) => (
                    <ul
                      {...props}
                      className="list-disc pl-8 my-5"
                      style={{ paddingLeft: "2em", marginBottom: "16px" }}
                    />
                  ),
                  ol: ({ ...props }) => (
                    <ol
                      {...props}
                      className="list-decimal pl-8 my-5"
                      style={{ paddingLeft: "2em", marginBottom: "16px" }}
                    />
                  ),
                  li: ({ ...props }) => <li {...props} className="mb-1" style={{ marginTop: "0.25em" }} />,
                  blockquote: ({ ...props }) => (
                    <blockquote
                      {...props}
                      className="border-l-4 border-border pl-4 my-4 text-muted-foreground py-0 pr-0"
                      style={{
                        color: "var(--muted-foreground)",
                        borderLeftColor: "#d0d7de",
                        padding: "0 1em",
                        marginBottom: "16px",
                      }}
                    />
                  ),
                  table: ({ ...props }) => (
                    <div className="overflow-x-auto my-6 rounded-md border border-border/40">
                      <table
                        {...props}
                        className="min-w-full border-collapse"
                        style={{ borderSpacing: 0, borderCollapse: "collapse", marginTop: 0, marginBottom: "16px" }}
                      />
                    </div>
                  ),
                  tr: ({ ...props }) => (
                    <tr
                      {...props}
                      className="border-t border-border/30"
                      style={{ borderTop: "1px solid var(--border)" }}
                    />
                  ),
                  th: ({ ...props }) => (
                    <th
                      {...props}
                      className="px-4 py-3 text-left font-semibold bg-muted/30"
                      style={{ padding: "6px 13px", borderBottom: "1px solid var(--border)" }}
                    />
                  ),
                  td: ({ ...props }) => (
                    <td
                      {...props}
                      className="px-4 py-3 border-t border-border/20"
                      style={{ padding: "6px 13px", borderTop: "1px solid var(--border)" }}
                    />
                  ),
                  hr: ({ ...props }) => (
                    <hr
                      {...props}
                      className="my-6 border-t border-border/40"
                      style={{
                        height: "0.25em",
                        padding: 0,
                        margin: "24px 0",
                        backgroundColor: "var(--border)",
                        border: 0,
                      }}
                    />
                  ),
                  p: ({ ...props }) => (
                    <p {...props} className="my-4 leading-relaxed" style={{ marginTop: "0", marginBottom: "16px" }} />
                  ),
                  strong: ({ ...props }) => <strong {...props} className="font-semibold" />,
                  em: ({ ...props }) => <em {...props} className="italic" />,
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
      {/* Qubot Setup Dialog */}
      <Dialog open={showSetupDialog} onOpenChange={setShowSetupDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Qubot Setup</DialogTitle>
          </DialogHeader>

          <div className="space-y-8 py-4">
            {/* Step 1: Select Qubot Type */}
            <div
              className={`space-y-4 rounded-lg border p-5 ${currentSetupStep === 1 ? "border-primary bg-primary/5" : "border-muted bg-background"}`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full ${currentSetupStep >= 1 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
                >
                  1
                </div>
                <h3 className="text-lg font-medium">Select Qubot Type</h3>
              </div>

              <div className={currentSetupStep === 1 ? "block" : "hidden"}>
                <div className="space-y-2 mt-4">
                  <Label htmlFor="qubotType">Qubot Type</Label>
                  <Select value={qubotType} onValueChange={(value: "problem" | "optimizer") => setQubotType(value)}>
                    <SelectTrigger id="qubotType" className="w-full">
                      <SelectValue placeholder="Select qubot type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="problem">Problem</SelectItem>
                      <SelectItem value="optimizer">Optimizer</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    {qubotType === "problem"
                      ? "A qubot problem defines an optimization problem to be solved"
                      : "A qubot optimizer implements an optimization algorithm that solves a qubot problem"}
                  </p>
                </div>

                <div className="flex justify-end mt-4">
                  <Button
                    onClick={() => setCurrentSetupStep(2)}
                    className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary"
                  >
                    Next Step
                  </Button>
                </div>
              </div>

              {currentSetupStep !== 1 && (
                <div className="flex justify-between items-center">
                  <div className="text-sm">{qubotType === "problem" ? "Problem" : "Optimizer"}</div>
                  <Button variant="ghost" size="sm" onClick={() => setCurrentSetupStep(1)}>
                    Edit
                  </Button>
                </div>
              )}
            </div>

            {/* Step 2: Select Entrypoint */}
            <div
              className={`space-y-4 rounded-lg border p-5 ${currentSetupStep === 2 ? "border-primary bg-primary/5" : "border-muted bg-background"}`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full ${currentSetupStep >= 2 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
                >
                  2
                </div>
                <h3 className="text-lg font-medium">Select Entrypoint</h3>
              </div>

              <div className={currentSetupStep === 2 ? "block" : "hidden"}>
                <div className="space-y-2 mt-4">
                  <Label htmlFor="entrypointFile">Entrypoint File</Label>
                  <div className="relative">
                    <Select value={entrypointFile || ""} onValueChange={(value) => setEntrypointFile(value)}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a file..." />
                      </SelectTrigger>
                      <SelectContent>
                        {allRepoFiles && allRepoFiles.filter((file) => file.name?.endsWith(".py")).length === 0 && (
                          <div className="p-3 text-center">
                            <p className="text-sm text-amber-600 dark:text-amber-400">
                              No Python files found in this repository.
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Please add a Python file to your repository first.
                            </p>
                          </div>
                        )}
                        <SelectGroup>
                          {allRepoFiles &&
                            allRepoFiles
                              .filter((file) => file.name?.endsWith(".py"))
                              .map((file, index) => (
                                <SelectItem key={index} value={file.path}>
                                  <div className="flex items-center gap-2">
                                    <FileText className="h-4 w-4 text-primary" />
                                    <span className="font-mono text-sm">{file.path}</span>
                                  </div>
                                </SelectItem>
                              ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Select a Python file that contains your {qubotType === "problem" ? "BaseProblem" : "BaseOptimizer"}{" "}
                    class
                  </p>
                </div>

                <div className="space-y-2 mt-4">
                  <Label htmlFor="entrypointClass">Class Name</Label>
                  <Input
                    id="entrypointClass"
                    placeholder={qubotType === "problem" ? "MyProblem" : "MyOptimizer"}
                    value={entrypointClass}
                    onChange={(e) => setEntrypointClass(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    The name of the {qubotType === "problem" ? "BaseProblem" : "BaseOptimizer"} class in the selected
                    file
                  </p>
                </div>

                <div className="flex justify-between mt-4">
                  <Button onClick={() => setCurrentSetupStep(1)} variant="outline">
                    Previous Step
                  </Button>
                  <Button
                    onClick={() => setCurrentSetupStep(3)}
                    disabled={!entrypointFile || !entrypointClass}
                    className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary"
                  >
                    Next Step
                  </Button>
                </div>
              </div>

              {currentSetupStep !== 2 && currentSetupStep > 2 && (
                <div className="flex justify-between items-center">
                  <div className="text-sm">
                    {entrypointFile ? (
                      <div className="flex flex-col">
                        <span className="font-mono">{entrypointFile}</span>
                        <span className="text-xs text-muted-foreground">Class: {entrypointClass}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">Not selected</span>
                    )}
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setCurrentSetupStep(2)}>
                    Edit
                  </Button>
                </div>
              )}
            </div>

            {/* Step 3: Define Default Parameters */}
            <div
              className={`space-y-4 rounded-lg border p-5 ${currentSetupStep === 3 ? "border-primary bg-primary/5" : "border-muted bg-background"}`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full ${currentSetupStep >= 3 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
                >
                  3
                </div>
                <h3 className="text-lg font-medium">Define Default Parameters</h3>
              </div>

              <div className={currentSetupStep === 3 ? "block" : "hidden"}>
                <div className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="paramName">Parameter Name</Label>
                      <Input
                        id="paramName"
                        placeholder="e.g., data_file"
                        value={newParameterName}
                        onChange={(e) => setNewParameterName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="paramValue">Default Value</Label>
                      <Input
                        id="paramValue"
                        placeholder="e.g., data.csv"
                        value={newParameterValue}
                        onChange={(e) => setNewParameterValue(e.target.value)}
                      />
                    </div>
                  </div>

                  <Button
                    onClick={() => {
                      if (newParameterName.trim()) {
                        setQubotParameters([
                          ...qubotParameters,
                          { name: newParameterName.trim(), value: newParameterValue.trim() },
                        ])
                        setNewParameterName("")
                        setNewParameterValue("")
                      }
                    }}
                    disabled={!newParameterName.trim()}
                    variant="outline"
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Parameter
                  </Button>
                </div>

                {qubotParameters.length > 0 && (
                  <div className="border rounded-md mt-4">
                    <div className="p-3 border-b bg-muted/30">
                      <h4 className="font-medium">Added Parameters</h4>
                    </div>
                    <div className="divide-y">
                      {qubotParameters.map((param, index) => (
                        <div key={index} className="p-3 flex justify-between items-center">
                          <div>
                            <span className="font-mono text-sm text-primary">{param.name}</span>
                            <span className="text-sm text-muted-foreground mx-2">=</span>
                            <span className="font-mono text-sm">{param.value}</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const newParams = [...qubotParameters]
                              newParams.splice(index, 1)
                              setQubotParameters(newParams)
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-between mt-4">
                  <Button onClick={() => setCurrentSetupStep(2)} variant="outline">
                    Previous Step
                  </Button>
                  <Button
                    onClick={() => setCurrentSetupStep(4)}
                    className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary"
                  >
                    Next Step
                  </Button>
                </div>
              </div>

              {currentSetupStep !== 3 && currentSetupStep > 3 && (
                <div className="flex justify-between items-center">
                  <div className="text-sm">
                    {qubotParameters.length > 0 ? (
                      <span>
                        {qubotParameters.length} parameter{qubotParameters.length !== 1 ? "s" : ""} defined
                      </span>
                    ) : (
                      <span className="text-muted-foreground">No parameters defined</span>
                    )}
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setCurrentSetupStep(3)}>
                    Edit
                  </Button>
                </div>
              )}
            </div>

            {/* Step 4: Additional Information */}
            <div
              className={`space-y-4 rounded-lg border p-5 ${currentSetupStep === 4 ? "border-primary bg-primary/5" : "border-muted bg-background"}`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full ${currentSetupStep >= 4 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
                >
                  4
                </div>
                <h3 className="text-lg font-medium">Additional Information</h3>
              </div>

              <div className={currentSetupStep === 4 ? "block" : "hidden"}>
                <div className="space-y-4 mt-4">
                  {/* ArXiv Links */}
                  <div className="space-y-2">
                    <Label>arXiv Links</Label>
                    <div className="flex gap-2">
                      <Input
                        value={newArxivLink}
                        onChange={(e) => setNewArxivLink(e.target.value)}
                        placeholder="https://arxiv.org/abs/XXXX.XXXXX"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault()
                            if (newArxivLink.trim() && !arxivLinks.includes(newArxivLink.trim())) {
                              setArxivLinks([...arxivLinks, newArxivLink.trim()])
                              setNewArxivLink("")
                            }
                          }
                        }}
                      />
                      <Button
                        type="button"
                        onClick={() => {
                          if (newArxivLink.trim() && !arxivLinks.includes(newArxivLink.trim())) {
                            setArxivLinks([...arxivLinks, newArxivLink.trim()])
                            setNewArxivLink("")
                          }
                        }}
                        size="sm"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">Add links to relevant arXiv papers</p>

                    {arxivLinks.length > 0 && (
                      <div className="flex flex-col gap-2 mt-2 bg-muted/20 p-3 rounded-md border">
                        {arxivLinks.map((link, index) => (
                          <div key={index} className="flex items-center justify-between">
                            <a
                              href={link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-primary hover:underline truncate max-w-[90%]"
                            >
                              {link}
                            </a>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const newLinks = [...arxivLinks]
                                newLinks.splice(index, 1)
                                setArxivLinks(newLinks)
                              }}
                            >
                              <X className="h-3.5 w-3.5 text-destructive" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Keywords */}
                  <div className="space-y-2">
                    <Label>Keywords</Label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {qubotKeywords.map((keyword, index) => (
                        <Badge key={index} variant="secondary" className="flex items-center gap-1">
                          {keyword}
                          <X
                            className="h-3 w-3 cursor-pointer"
                            onClick={() => {
                              const newKeywords = [...qubotKeywords]
                              newKeywords.splice(index, 1)
                              setQubotKeywords(newKeywords)
                            }}
                          />
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        value={newKeyword}
                        onChange={(e) => setNewKeyword(e.target.value)}
                        placeholder="Add keyword"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault()
                            if (newKeyword.trim() && !qubotKeywords.includes(newKeyword.trim())) {
                              setQubotKeywords([...qubotKeywords, newKeyword.trim()])
                              setNewKeyword("")
                            }
                          }
                        }}
                      />
                      <Button
                        type="button"
                        onClick={() => {
                          if (newKeyword.trim() && !qubotKeywords.includes(newKeyword.trim())) {
                            setQubotKeywords([...qubotKeywords, newKeyword.trim()])
                            setNewKeyword("")
                          }
                        }}
                        size="sm"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Add keywords to help others find your qubot (e.g., optimization, quantum, scheduling)
                    </p>
                  </div>
                </div>
              </div>

              {currentSetupStep !== 4 && currentSetupStep > 4 && (
                <div className="flex justify-between items-center">
                  <div className="text-sm">
                    <div className="flex gap-2">
                      {arxivLinks.length > 0 && (
                        <span>
                          {arxivLinks.length} link{arxivLinks.length !== 1 ? "s" : ""}
                        </span>
                      )}
                      {qubotKeywords.length > 0 && (
                        <span>
                          {qubotKeywords.length} keyword{qubotKeywords.length !== 1 ? "s" : ""}
                        </span>
                      )}
                      {arxivLinks.length === 0 && qubotKeywords.length === 0 && (
                        <span className="text-muted-foreground">No additional information</span>
                      )}
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setCurrentSetupStep(4)}>
                    Edit
                  </Button>
                </div>
              )}
            </div>

            {/* Complete Setup Button at the bottom */}
            <div className="flex justify-end mt-6">
              <Button
                onClick={handleCompleteSetup}
                disabled={!entrypointFile || !entrypointClass || isLoading}
                className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
              >
                {isLoading ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Saving...
                  </>
                ) : (
                  "Complete Setup"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

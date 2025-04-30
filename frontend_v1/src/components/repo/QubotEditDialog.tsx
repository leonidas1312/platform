"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  ChevronRight,
  ChevronLeft,
  Check,
  X,
  Plus,
  Trash2,
  Upload,
  FileUp,
  Sparkles,
  FileCode,
  GitBranch,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"

interface QubotEditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  owner: string
  repoName: string
  config: any
  onSaveQubotCard: (formData: any) => Promise<void>
  allRepoFiles: any[]
}

export default function QubotEditDialog({
  open,
  onOpenChange,
  owner,
  repoName,
  config,
  onSaveQubotCard,
  allRepoFiles,
}: QubotEditDialogProps) {
  const { toast } = useToast()
  const [currentStep, setCurrentStep] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [fileContent, setFileContent] = useState<string>("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  // State for qubot configuration
  const [qubotType, setQubotType] = useState<"problem" | "optimizer">("problem")
  const [entrypointFile, setEntrypointFile] = useState<string | null>(null)
  const [entrypointClass, setEntrypointClass] = useState<string>("")
  const [qubotParameters, setQubotParameters] = useState<Array<{ name: string; value: string }>>([])
  const [arxivLinks, setArxivLinks] = useState<string[]>([])
  const [qubotKeywords, setQubotKeywords] = useState<string[]>(["qubot"])
  const [pythonFileToUpload, setPythonFileToUpload] = useState<File | null>(null)

  // State for form inputs
  const [newParamName, setNewParamName] = useState("")
  const [newParamValue, setNewParamValue] = useState("")
  const [newArxivLink, setNewArxivLink] = useState("")
  const [newKeyword, setNewKeyword] = useState("")

  // Initialize form with existing config data
  useEffect(() => {
    if (config && open) {
      // Reset step to beginning when dialog opens
      setCurrentStep(0)

      // Set qubot type
      if (config.type) {
        setQubotType(config.type as "problem" | "optimizer")
      }

      // Set entry point file and class
      if (config.entry_point) {
        setEntrypointFile(`${config.entry_point}.py`)
      }
      if (config.class_name) {
        setEntrypointClass(config.class_name)
      }

      // Set parameters
      if (config.default_params) {
        const params = Object.entries(config.default_params).map(([name, value]) => ({
          name,
          value: String(value),
        }))
        setQubotParameters(params)
      } else {
        setQubotParameters([])
      }

      // Set arxiv links
      if (config.link_to_arxiv) {
        setArxivLinks(Array.isArray(config.link_to_arxiv) ? config.link_to_arxiv : [config.link_to_arxiv])
      } else {
        setArxivLinks([])
      }

      // Set keywords
      if (config.keywords) {
        setQubotKeywords(config.keywords)
      } else {
        setQubotKeywords(["qubot"])
      }

      // Try to find and load the entry point file content
      if (config.entry_point) {
        const entryPointFileName = `${config.entry_point}.py`
        const entryPointFile = allRepoFiles.find(
          (file) => file.name === entryPointFileName || file.path.endsWith(entryPointFileName),
        )

        if (entryPointFile) {
          // In a real app, you would fetch the file content here
          // For now, we'll just set a placeholder
          setFileContent(
            `# ${entryPointFileName}\n\nclass ${config.class_name}:\n    def __init__(self):\n        pass\n\n    def solve(self):\n        # Implementation here\n        pass`,
          )
        }
      }
    }
  }, [config, open, allRepoFiles])

  // Handle file selection
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0]
      if (file.name.endsWith(".py")) {
        setPythonFileToUpload(file)
        setEntrypointFile(file.name)

        // Read and display the file content
        const reader = new FileReader()
        reader.onload = (event) => {
          if (event.target?.result) {
            setFileContent(event.target.result as string)
          }
        }
        reader.readAsText(file)
      } else {
        toast({
          title: "Invalid file type",
          description: "Please select a Python (.py) file",
          variant: "destructive",
        })
      }
    }
  }

  // Handle adding a new parameter
  const handleAddParameter = () => {
    if (newParamName.trim() && newParamValue.trim()) {
      setQubotParameters([...qubotParameters, { name: newParamName.trim(), value: newParamValue.trim() }])
      setNewParamName("")
      setNewParamValue("")
    }
  }

  // Handle removing a parameter
  const handleRemoveParameter = (index: number) => {
    const updatedParams = [...qubotParameters]
    updatedParams.splice(index, 1)
    setQubotParameters(updatedParams)
  }

  // Handle adding a new arxiv link
  const handleAddArxivLink = () => {
    if (newArxivLink.trim()) {
      setArxivLinks([...arxivLinks, newArxivLink.trim()])
      setNewArxivLink("")
    }
  }

  // Handle removing an arxiv link
  const handleRemoveArxivLink = (index: number) => {
    const updatedLinks = [...arxivLinks]
    updatedLinks.splice(index, 1)
    setArxivLinks(updatedLinks)
  }

  // Handle adding a new keyword
  const handleAddKeyword = () => {
    if (newKeyword.trim() && !qubotKeywords.includes(newKeyword.trim())) {
      setQubotKeywords([...qubotKeywords, newKeyword.trim()])
      setNewKeyword("")
    }
  }

  // Handle removing a keyword
  const handleRemoveKeyword = (keyword: string) => {
    setQubotKeywords(qubotKeywords.filter((k) => k !== keyword))
  }

  // Handle save
  const handleSave = async () => {
    setIsLoading(true)
    try {
      // Create a config object with the proper structure
      const configData = {
        type: qubotType,
        entry_point: entrypointFile ? entrypointFile.replace(/\.[^/.]+$/, "") : "", // Remove file extension
        class_name: entrypointClass,
        default_params: {},
        link_to_arxiv: arxivLinks.length > 0 ? arxivLinks : undefined,
        keywords: qubotKeywords.length > 0 ? qubotKeywords : ["qubot"],
      }

      // Add parameters to the config
      qubotParameters.forEach((param) => {
        configData.default_params[param.name] = param.value
      })

      await onSaveQubotCard(configData)

      toast({
        title: "Success",
        description: "Qubot card updated successfully",
      })

      onOpenChange(false)
    } catch (error) {
      console.error("Error saving qubot card:", error)
      toast({
        title: "Error",
        description: "Failed to update qubot card",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Check if current step is valid
  const isCurrentStepValid = () => {
    switch (currentStep) {
      case 0:
        return true // Type selection is always valid
      case 1:
        return !!entrypointFile && !!entrypointClass
      case 2:
        return true // Parameters are optional
      case 3:
        return true // Keywords and arxiv links are optional
      default:
        return false
    }
  }

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-medium">Step 1: Select Qubot Type</h3>
            <p className="text-sm text-muted-foreground">
              Choose the type of qubot you want to create. This will determine how your qubot is used.
            </p>

            <RadioGroup
              value={qubotType}
              onValueChange={(value) => setQubotType(value as "problem" | "optimizer")}
              className="mt-2 space-y-3"
            >
              <div
                className={`flex items-start space-x-3 rounded-lg border p-4 ${qubotType === "problem" ? "border-primary bg-primary/5" : "border-border"}`}
              >
                <RadioGroupItem value="problem" id="problem" className="mt-1" />
                <div className="space-y-1">
                  <Label htmlFor="problem" className="text-base font-medium">
                    Problem
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    A mathematical problem that can be solved using quantum computing techniques.
                  </p>
                </div>
              </div>
              <div
                className={`flex items-start space-x-3 rounded-lg border p-4 ${qubotType === "optimizer" ? "border-primary bg-primary/5" : "border-border"}`}
              >
                <RadioGroupItem value="optimizer" id="optimizer" className="mt-1" />
                <div className="space-y-1">
                  <Label htmlFor="optimizer" className="text-base font-medium">
                    Optimizer
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    An algorithm that optimizes parameters for quantum circuits or problems.
                  </p>
                </div>
              </div>
            </RadioGroup>
          </div>
        )
      case 1:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-medium">Step 2: Define Entry Point</h3>
            <p className="text-sm text-muted-foreground">
              Upload your main Python file and specify the class that implements your qubot.
            </p>

            {entrypointFile ? (
              <div className="flex items-center justify-between p-3 border rounded-md bg-muted/30">
                <div className="flex items-center gap-2">
                  <FileCode className="h-5 w-5 text-primary" />
                  <span>{entrypointFile}</span>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setEntrypointFile(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-6 bg-muted/10">
                <FileUp className="h-10 w-10 text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground mb-3">
                  Drag and drop your Python file here, or click to browse
                </p>
                <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                  <Upload className="h-4 w-4 mr-2" />
                  Browse Files
                </Button>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".py" className="hidden" />
              </div>
            )}

            <div className="space-y-2 mt-4">
              <Label htmlFor="class-name" className="text-base">
                Main Class Name
              </Label>
              <p className="text-sm text-muted-foreground mb-2">
                Specify the name of the main class in your Python file that implements your qubot.
              </p>
              <Input
                id="class-name"
                value={entrypointClass}
                onChange={(e) => setEntrypointClass(e.target.value)}
                placeholder="e.g., TSPSolver, QAOAOptimizer"
              />
            </div>

            {entrypointFile && fileContent && !fileContent.includes(entrypointClass) && entrypointClass && (
              <div className="text-sm text-amber-500 bg-amber-500/10 p-3 rounded-md border border-amber-200">
                Warning: The class name "{entrypointClass}" was not found in your Python file. Make sure you've entered
                the correct class name.
              </div>
            )}
          </div>
        )
      case 2:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-medium">Step 3: Define Parameters</h3>
            <p className="text-sm text-muted-foreground">
              Define the default parameters for your qubot. These will be used when someone runs your qubot without
              specifying custom parameters.
            </p>

            {qubotParameters.length > 0 && (
              <div className="space-y-2 mb-4">
                {qubotParameters.map((param, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-md bg-muted/30">
                    <div className="flex items-center gap-2">
                      <GitBranch className="h-4 w-4 text-primary" />
                      <span className="font-medium">{param.name}:</span>
                      <span className="text-muted-foreground">{param.value}</span>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => handleRemoveParameter(index)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <div className="grid grid-cols-5 gap-2">
              <div className="col-span-2">
                <Label htmlFor="param-name">Parameter Name</Label>
                <Input
                  id="param-name"
                  value={newParamName}
                  onChange={(e) => setNewParamName(e.target.value)}
                  placeholder="e.g., num_iterations"
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="param-value">Default Value</Label>
                <Input
                  id="param-value"
                  value={newParamValue}
                  onChange={(e) => setNewParamValue(e.target.value)}
                  placeholder="e.g., 100"
                />
              </div>
              <div className="flex items-end">
                <Button
                  onClick={handleAddParameter}
                  disabled={!newParamName.trim() || !newParamValue.trim()}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>
            </div>
          </div>
        )
      case 3:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-medium">Step 4: Add Metadata</h3>
            <p className="text-sm text-muted-foreground">
              Add keywords and references to make your qubot discoverable and provide context.
            </p>

            <div className="space-y-4">
              <div>
                <Label className="text-base">Keywords</Label>
                <p className="text-sm text-muted-foreground mb-2">Add keywords to help others discover your qubot.</p>

                <div className="flex flex-wrap gap-2 mb-3">
                  {qubotKeywords.map((keyword) => (
                    <Badge key={keyword} variant="secondary" className="flex items-center gap-1 py-1 px-3">
                      {keyword}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveKeyword(keyword)}
                        className="h-4 w-4 p-0 ml-1"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>

                <div className="flex gap-2">
                  <Input
                    value={newKeyword}
                    onChange={(e) => setNewKeyword(e.target.value)}
                    placeholder="e.g., optimization, tsp, qaoa"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && newKeyword.trim()) {
                        e.preventDefault()
                        handleAddKeyword()
                      }
                    }}
                  />
                  <Button
                    onClick={handleAddKeyword}
                    disabled={!newKeyword.trim() || qubotKeywords.includes(newKeyword.trim())}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                </div>
              </div>

              <div className="mt-6">
                <Label className="text-base">arXiv Links</Label>
                <p className="text-sm text-muted-foreground mb-2">
                  Add links to relevant arXiv papers that describe your algorithm or problem.
                </p>

                {arxivLinks.length > 0 && (
                  <div className="space-y-2 mb-4">
                    {arxivLinks.map((link, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-md bg-muted/30">
                        <div className="flex items-center gap-2 overflow-hidden">
                          <a
                            href={link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary truncate hover:underline"
                          >
                            {link}
                          </a>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => handleRemoveArxivLink(index)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-2">
                <Input
                    value={newArxivLink}
                    onChange={(e) => setNewArxivLink(e.target.value)}
                    placeholder="e.g., https://arxiv.org/abs/2106.12627"
                    onKeyDown={(e) => {
                    if (e.key === "Enter" && newArxivLink.trim()) {
                        e.preventDefault();
                        handleAddArxivLink();
                    }
                    }}
                />
                <Button onClick={handleAddArxivLink} disabled={!newArxivLink.trim()}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                </Button>
                </div>

              </div>
            </div>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <div className="p-1.5 rounded-full bg-primary/10">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            Edit Qubot Card
          </DialogTitle>
          <DialogDescription>
            Update your qubot configuration to customize how it works and appears to others.
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          {/* Progress bar */}
          <div className="mb-8">
            <div className="flex justify-between mb-2">
              {[0, 1, 2, 3].map((step) => (
                <div
                  key={step}
                  className={`flex flex-col items-center ${step <= currentStep ? "text-primary" : "text-muted-foreground"}`}
                  style={{ width: "25%" }}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 ${
                      step < currentStep
                        ? "bg-primary text-primary-foreground"
                        : step === currentStep
                          ? "border-2 border-primary text-primary"
                          : "border-2 border-muted-foreground text-muted-foreground"
                    }`}
                  >
                    {step < currentStep ? <Check className="h-4 w-4" /> : step + 1}
                  </div>
                  <span className="text-xs text-center">
                    {step === 0 && "Type"}
                    {step === 1 && "Entry Point"}
                    {step === 2 && "Parameters"}
                    {step === 3 && "Metadata"}
                  </span>
                </div>
              ))}
            </div>
            <div className="w-full bg-muted h-1 rounded-full overflow-hidden">
              <div
                className="bg-primary h-full transition-all duration-300 ease-in-out"
                style={{ width: `${currentStep * 33.33}%` }}
              ></div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Left side - Setup steps */}
            <div>
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                >
                  {renderStepContent()}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Right side - Code preview */}
            <div className="relative bg-gradient-to-br from-primary/20 to-primary/5 p-6 rounded-lg">
              <div className="absolute inset-0 overflow-hidden opacity-10 rounded-lg">
                <div className="absolute top-0 left-0 w-full h-full">
                  {Array.from({ length: 20 }).map((_, i) => (
                    <div
                      key={i}
                      className="absolute rounded-full bg-primary"
                      style={{
                        width: `${Math.random() * 10 + 5}px`,
                        height: `${Math.random() * 10 + 5}px`,
                        top: `${Math.random() * 100}%`,
                        left: `${Math.random() * 100}%`,
                        opacity: Math.random() * 0.5 + 0.2,
                        animation: `float ${Math.random() * 10 + 10}s linear infinite`,
                      }}
                    />
                  ))}
                </div>
              </div>
              <div className="relative z-10 h-full flex flex-col justify-center">
                {fileContent ? (
                  <div className="bg-background/80 backdrop-blur-sm rounded-lg border border-border/50 shadow-lg overflow-hidden">
                    <div className="flex items-center gap-2 bg-muted/50 px-4 py-2 border-b">
                      <FileCode className="h-4 w-4 text-primary" />
                      <span className="font-medium text-sm">{entrypointFile}</span>
                    </div>
                    <pre className="text-xs p-4 overflow-auto max-h-[400px]">
                      <code className="language-python">{fileContent}</code>
                    </pre>
                  </div>
                ) : (
                  <div className="bg-background/80 backdrop-blur-sm rounded-lg p-6 border border-border/50 shadow-lg">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="h-3 w-3 rounded-full bg-red-500"></div>
                      <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
                      <div className="h-3 w-3 rounded-full bg-green-500"></div>
                      <div className="ml-2 text-xs text-muted-foreground">config.json</div>
                    </div>
                    <pre className="text-xs text-left overflow-hidden">
                      <code className="language-json">
                        {`{
  "type": "${qubotType}",
  "entry_point": "${entrypointFile ? entrypointFile.replace(/\.[^/.]+$/, "") : "main"}",
  "class_name": "${entrypointClass || "QubotClass"}",
  "default_params": {
${qubotParameters.map((param) => `    "${param.name}": ${param.value}`).join(",\n")}
  },
  "keywords": [${qubotKeywords.map((k) => `"${k}"`).join(", ")}]
}`}
                      </code>
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex justify-between items-center mt-6">
          <div>
            {currentStep > 0 && (
              <Button variant="outline" onClick={() => setCurrentStep(currentStep - 1)} disabled={isLoading}>
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
            )}
          </div>
          <div>
            {currentStep < 3 ? (
              <Button onClick={() => setCurrentStep(currentStep + 1)} disabled={!isCurrentStepValid() || isLoading}>
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button onClick={handleSave} className="bg-primary" disabled={isLoading}>
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
                  <>
                    <Check className="h-4 w-4 mr-1" />
                    Save Changes
                  </>
                )}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

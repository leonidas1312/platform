"use client"

import type React from "react"

import { useState, useRef } from "react"
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
  FileCode,
  Settings,
  Check,
  X,
  Plus,
  Trash2,
  Upload,
  FileUp,
  Sparkles,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface SetupDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onComplete: () => void
  qubotType: "problem" | "optimizer"
  setQubotType: (type: "problem" | "optimizer") => void
  entrypointFile: string | null
  setEntrypointFile: (file: string | null) => void
  entrypointClass: string
  setEntrypointClass: (className: string) => void
  qubotParameters: Array<{ name: string; value: string }>
  setQubotParameters: (params: Array<{ name: string; value: string }>) => void
  arxivLinks: string[]
  setArxivLinks: (links: string[]) => void
  qubotKeywords: string[]
  setQubotKeywords: (keywords: string[]) => void
  currentSetupStep: number
  setCurrentSetupStep: (step: number) => void
  pythonFileToUpload: File | null
  setPythonFileToUpload: (file: File | null) => void
  handleUploadPythonFile: () => void
}

export default function SetupDialog({
  open,
  onOpenChange,
  onComplete,
  qubotType,
  setQubotType,
  entrypointFile,
  setEntrypointFile,
  entrypointClass,
  setEntrypointClass,
  qubotParameters,
  setQubotParameters,
  arxivLinks,
  setArxivLinks,
  qubotKeywords,
  setQubotKeywords,
  currentSetupStep,
  setCurrentSetupStep,
  pythonFileToUpload,
  setPythonFileToUpload,
  handleUploadPythonFile,
}: SetupDialogProps) {
  // State for new parameter
  const [newParamName, setNewParamName] = useState("")
  const [newParamValue, setNewParamValue] = useState("")

  // State for new arxiv link
  const [newArxivLink, setNewArxivLink] = useState("")

  // State for new keyword
  const [newKeyword, setNewKeyword] = useState("")

  // File input ref
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0]
      if (file.name.endsWith(".py")) {
        setPythonFileToUpload(file)
        setEntrypointFile(file.name)
      }
    }
  }

  // Handle next step
  const handleNextStep = () => {
    setCurrentSetupStep(currentSetupStep + 1)
  }

  // Handle previous step
  const handlePrevStep = () => {
    setCurrentSetupStep(currentSetupStep - 1)
  }

  // Check if current step is valid
  const isCurrentStepValid = () => {
    switch (currentSetupStep) {
      case 1:
        return true // Type selection is always valid
      case 2:
        return !!entrypointFile && !!entrypointClass
      case 3:
        return true // Parameters are optional
      case 4:
        return true // Keywords and arxiv links are optional
      default:
        return false
    }
  }

  // Render step content
  const renderStepContent = () => {
    switch (currentSetupStep) {
      case 1:
        return (
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label className="text-base">Select Qubot Type</Label>
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
          </div>
        )
      case 2:
        return (
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label className="text-base">Python Entry Point</Label>
              <p className="text-sm text-muted-foreground mb-4">
                Upload or select the main Python file that contains your qubot implementation.
              </p>

              {pythonFileToUpload ? (
                <div className="flex items-center justify-between p-3 border rounded-md bg-muted/30">
                  <div className="flex items-center gap-2">
                    <FileCode className="h-5 w-5 text-primary" />
                    <span>{pythonFileToUpload.name}</span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setPythonFileToUpload(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-8 bg-muted/10">
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
            </div>

            <div className="space-y-2 mt-6">
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
          </div>
        )
      case 3:
        return (
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label className="text-base">Default Parameters</Label>
              <p className="text-sm text-muted-foreground mb-4">
                Define the default parameters for your qubot. These will be used when someone runs your qubot without
                specifying custom parameters.
              </p>

              {qubotParameters.length > 0 && (
                <div className="space-y-2 mb-4">
                  {qubotParameters.map((param, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-md bg-muted/30">
                      <div className="flex items-center gap-2">
                        <Settings className="h-4 w-4 text-primary" />
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
          </div>
        )
      case 4:
        return (
          <div className="space-y-6 py-4">
            <div className="space-y-2">
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

            <div className="space-y-2 mt-6">
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
                      e.preventDefault()
                      handleAddArxivLink()
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
        )
      default:
        return null
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <div className="p-1.5 rounded-full bg-primary/10">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            Setup Your Qubot
          </DialogTitle>
          <DialogDescription>Configure your qubot to make it ready for quantum optimization.</DialogDescription>
        </DialogHeader>

        <div className="relative">
          {/* Progress bar */}
          <div className="mb-8">
            <div className="flex justify-between mb-2">
              {[1, 2, 3, 4].map((step) => (
                <div
                  key={step}
                  className={`flex flex-col items-center ${step <= currentSetupStep ? "text-primary" : "text-muted-foreground"}`}
                  style={{ width: "25%" }}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 ${
                      step < currentSetupStep
                        ? "bg-primary text-primary-foreground"
                        : step === currentSetupStep
                          ? "border-2 border-primary text-primary"
                          : "border-2 border-muted-foreground text-muted-foreground"
                    }`}
                  >
                    {step < currentSetupStep ? <Check className="h-4 w-4" /> : step}
                  </div>
                  <span className="text-xs text-center">
                    {step === 1 && "Type"}
                    {step === 2 && "Entry Point"}
                    {step === 3 && "Parameters"}
                    {step === 4 && "Metadata"}
                  </span>
                </div>
              ))}
            </div>
            <div className="w-full bg-muted h-1 rounded-full overflow-hidden">
              <div
                className="bg-primary h-full transition-all duration-300 ease-in-out"
                style={{ width: `${(currentSetupStep - 1) * 33.33}%` }}
              ></div>
            </div>
          </div>

          {/* Step content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSetupStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {renderStepContent()}
            </motion.div>
          </AnimatePresence>
        </div>

        <DialogFooter className="flex justify-between items-center">
          <div>
            {currentSetupStep > 1 && (
              <Button variant="outline" onClick={handlePrevStep}>
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
            )}
          </div>
          <div>
            {currentSetupStep < 4 ? (
              <Button
                onClick={currentSetupStep === 2 && pythonFileToUpload ? handleUploadPythonFile : handleNextStep}
                disabled={!isCurrentStepValid()}
              >
                {currentSetupStep === 2 && pythonFileToUpload ? (
                  <>Upload & Continue</>
                ) : (
                  <>
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </>
                )}
              </Button>
            ) : (
              <Button onClick={onComplete} className="bg-primary">
                <Check className="h-4 w-4 mr-1" />
                Complete Setup
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

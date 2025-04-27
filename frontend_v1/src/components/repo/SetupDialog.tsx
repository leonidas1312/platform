"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FileText, FileUp, Plus, Trash2, X } from "lucide-react"

interface SetupDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onComplete: () => Promise<void>
  // Setup state
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
  // Step state
  currentSetupStep: number
  setCurrentSetupStep: (step: number) => void
  // File upload
  pythonFileToUpload: File | null
  setPythonFileToUpload: (file: File | null) => void
  handleUploadPythonFile: () => Promise<void>
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
  const [newParameterName, setNewParameterName] = useState("")
  const [newParameterValue, setNewParameterValue] = useState("")
  const [newArxivLink, setNewArxivLink] = useState<string>("")
  const [newKeyword, setNewKeyword] = useState<string>("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handlePythonFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0]
      if (file.name.endsWith(".py")) {
        setPythonFileToUpload(file)
        // Set the entrypoint file name
        setEntrypointFile(file.name)
      } else {
        // Show error toast (would need to be passed in as a prop)
        console.error("Please select a Python (.py) file")
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Qubot Setup</DialogTitle>
          <DialogDescription>
            Configure your qubot to make it shareable and usable with the qubots library
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-8 py-4">
          {/* Step 1: Select Qubot Type */}
          <div
            className={`space-y-4 rounded-lg border p-5 ${
              currentSetupStep === 1 ? "border-primary bg-primary/5" : "border-muted bg-background"
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full ${
                  currentSetupStep >= 1 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}
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

          {/* Step 2: Upload Python File */}
          <div
            className={`space-y-4 rounded-lg border p-5 ${
              currentSetupStep === 2 ? "border-primary bg-primary/5" : "border-muted bg-background"
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full ${
                  currentSetupStep >= 2 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}
              >
                2
              </div>
              <h3 className="text-lg font-medium">Upload Python File</h3>
            </div>

            <div className={currentSetupStep === 2 ? "block" : "hidden"}>
              <div className="space-y-4 mt-4">
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
                  <input
                    type="file"
                    accept=".py"
                    onChange={handlePythonFileChange}
                    className="hidden"
                    ref={fileInputRef}
                  />
                  <div className="flex flex-col items-center justify-center space-y-4">
                    <FileUp className="h-10 w-10 text-muted-foreground/70" />
                    <div className="space-y-2">
                      <h3 className="font-medium text-lg">Upload your Python file</h3>
                      <p className="text-sm text-muted-foreground">
                        This file should contain your {qubotType === "problem" ? "BaseProblem" : "BaseOptimizer"} class
                      </p>
                    </div>
                    <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="mt-2">
                      Select File
                    </Button>
                  </div>
                </div>

                {pythonFileToUpload && (
                  <div className="bg-muted/20 p-4 rounded-md border flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary" />
                      <span className="font-medium">{pythonFileToUpload.name}</span>
                      <span className="text-xs text-muted-foreground">
                        ({Math.round(pythonFileToUpload.size / 1024)} KB)
                      </span>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setPythonFileToUpload(null)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}

                <div className="space-y-2 mt-4">
                  <Label htmlFor="entrypointClass">Class Name</Label>
                  <Input
                    id="entrypointClass"
                    placeholder={qubotType === "problem" ? "MyProblem" : "MyOptimizer"}
                    value={entrypointClass}
                    onChange={(e) => setEntrypointClass(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    The name of the {qubotType === "problem" ? "BaseProblem" : "BaseOptimizer"} class in your Python
                    file
                  </p>
                </div>

                <div className="flex justify-between mt-4">
                  <Button onClick={() => setCurrentSetupStep(1)} variant="outline">
                    Previous Step
                  </Button>
                  <Button
                    onClick={handleUploadPythonFile}
                    disabled={!pythonFileToUpload || !entrypointClass}
                    className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary"
                  >
                    Upload & Continue
                  </Button>
                </div>
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
                    <span className="text-muted-foreground">Not uploaded</span>
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
            className={`space-y-4 rounded-lg border p-5 ${
              currentSetupStep === 3 ? "border-primary bg-primary/5" : "border-muted bg-background"
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full ${
                  currentSetupStep >= 3 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}
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
            className={`space-y-4 rounded-lg border p-5 ${
              currentSetupStep === 4 ? "border-primary bg-primary/5" : "border-muted bg-background"
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full ${
                  currentSetupStep >= 4 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}
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

              <div className="flex justify-between mt-6">
                <Button onClick={() => setCurrentSetupStep(3)} variant="outline">
                  Previous Step
                </Button>
                <Button
                  onClick={onComplete}
                  className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                >
                  Complete Setup
                </Button>
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
        </div>
      </DialogContent>
    </Dialog>
  )
}

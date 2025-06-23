import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Upload, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  Search,
  Settings,
  Play,
  Trophy,
  AlertCircle,
  Info
} from "lucide-react"
import { toast } from "@/components/ui/use-toast"

const API = import.meta.env.VITE_API_BASE

interface StandardizedProblem {
  id: number
  name: string
  problem_type: string
  difficulty_level: string
  description: string
  time_limit_seconds: number
  memory_limit_mb: number
}

interface SolverConfig {
  type: string
  entry_point: string
  class_name: string
  metadata: {
    name: string
    description: string
    optimizer_type: string
    problem_types: string[]
  }
  parameters?: Record<string, any>
}

interface ValidationResult {
  valid: boolean
  config?: SolverConfig
  errors: string[]
  warnings: string[]
  compatibility_score?: number
}

interface SubmissionStep {
  id: string
  title: string
  description: string
  completed: boolean
  current: boolean
  error?: string
}

interface UserRepository {
  id: number
  name: string
  full_name: string
  description: string
  owner: {
    login: string
  }
  qubot_type?: string
}

interface SolverSubmissionWizardProps {
  open: boolean
  onClose: () => void
  problems: StandardizedProblem[]
  onSubmissionComplete: (submissionId: string) => void
}

export function SolverSubmissionWizard({
  open,
  onClose,
  problems,
  onSubmissionComplete
}: SolverSubmissionWizardProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [solverRepository, setSolverRepository] = useState("")
  const [selectedProblem, setSelectedProblem] = useState<StandardizedProblem | null>(null)
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null)
  const [isValidating, setIsValidating] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submissionProgress, setSubmissionProgress] = useState(0)
  const [submissionLogs, setSubmissionLogs] = useState<string[]>([])
  const [customParameters, setCustomParameters] = useState<Record<string, any>>({})
  const [userRepositories, setUserRepositories] = useState<UserRepository[]>([])
  const [loadingRepositories, setLoadingRepositories] = useState(false)

  const steps: SubmissionStep[] = [
    {
      id: "solver",
      title: "Select Solver",
      description: "Choose your qubots solver repository",
      completed: false,
      current: true
    },
    {
      id: "problem",
      title: "Select Problem",
      description: "Choose a standardized benchmark problem",
      completed: false,
      current: false
    },
    {
      id: "validate",
      title: "Validate Compatibility",
      description: "Verify solver compatibility with the problem",
      completed: false,
      current: false
    },
    {
      id: "configure",
      title: "Configure Parameters",
      description: "Set solver parameters for the benchmark",
      completed: false,
      current: false
    },
    {
      id: "submit",
      title: "Submit & Execute",
      description: "Run benchmark and submit to leaderboard",
      completed: false,
      current: false
    }
  ]

  const [stepStates, setStepStates] = useState(steps)

  useEffect(() => {
    if (open) {
      resetWizard()
      loadUserRepositories()
    }
  }, [open])

  const resetWizard = () => {
    setCurrentStep(0)
    setSolverRepository("")
    setSelectedProblem(null)
    setValidationResult(null)
    setIsValidating(false)
    setIsSubmitting(false)
    setSubmissionProgress(0)
    setSubmissionLogs([])
    setCustomParameters({})
    setUserRepositories([])
    setStepStates(steps.map((step, index) => ({
      ...step,
      completed: false,
      current: index === 0,
      error: undefined
    })))
  }

  const loadUserRepositories = async () => {
    setLoadingRepositories(true)
    try {
      // Get auth token from localStorage
      const token = localStorage.getItem('token')
      const headers: Record<string, string> = {}

      if (token) {
        headers["Authorization"] = `Bearer ${token}`
      }

      const response = await fetch(`${API}/api/user-repos`, {
        headers,
        credentials: 'include' // Also include session-based auth as fallback
      })

      if (response.ok) {
        const repositories = await response.json()
        // Filter for optimizer repositories
        const optimizerRepos = repositories.filter((repo: UserRepository) =>
          repo.qubot_type === 'optimizer'
        )
        setUserRepositories(optimizerRepos)
      } else {
        console.error("Failed to load user repositories")
        toast({
          title: "Warning",
          description: "Could not load your repositories. You can still enter the repository path manually.",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error loading repositories:", error)
      toast({
        title: "Warning",
        description: "Could not load your repositories. You can still enter the repository path manually.",
        variant: "destructive"
      })
    } finally {
      setLoadingRepositories(false)
    }
  }

  const updateStepState = (stepIndex: number, updates: Partial<SubmissionStep>) => {
    setStepStates(prev => prev.map((step, index) => 
      index === stepIndex ? { ...step, ...updates } : step
    ))
  }

  const validateSolver = async () => {
    if (!solverRepository.trim()) {
      toast({
        title: "Error",
        description: "Please enter a solver repository",
        variant: "destructive"
      })
      return
    }

    setIsValidating(true)
    updateStepState(2, { current: true })

    try {
      // Get auth token from localStorage
      const token = localStorage.getItem('token')
      const headers: Record<string, string> = {
        "Content-Type": "application/json"
      }

      if (token) {
        headers["Authorization"] = `Bearer ${token}`
      }

      const response = await fetch(`${API}/api/submissions/validate-solver`, {
        method: "POST",
        headers,
        credentials: 'include', // Also include session-based auth as fallback
        body: JSON.stringify({
          solver_repository: solverRepository
        })
      })

      const data = await response.json()

      if (data.success) {
        setValidationResult(data.validation)
        updateStepState(2, { completed: true, current: false })
        
        if (data.validation.valid) {
          toast({
            title: "Validation Successful",
            description: "Solver is compatible with the qubots framework"
          })
        } else {
          updateStepState(2, { error: "Validation failed" })
          toast({
            title: "Validation Failed",
            description: data.validation.errors[0] || "Solver validation failed",
            variant: "destructive"
          })
        }
      } else {
        throw new Error(data.message || "Validation failed")
      }
    } catch (error) {
      console.error("Validation error:", error)
      updateStepState(2, { error: "Validation failed" })
      toast({
        title: "Validation Error",
        description: "Failed to validate solver. Please check the repository path.",
        variant: "destructive"
      })
    } finally {
      setIsValidating(false)
    }
  }

  const nextStep = () => {
    if (currentStep < stepStates.length - 1) {
      updateStepState(currentStep, { completed: true, current: false })
      setCurrentStep(currentStep + 1)
      updateStepState(currentStep + 1, { current: true })
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      updateStepState(currentStep, { current: false })
      setCurrentStep(currentStep - 1)
      updateStepState(currentStep - 1, { current: true })
    }
  }

  const canProceedToNext = () => {
    switch (currentStep) {
      case 0: // Solver selection
        return solverRepository.trim() !== ""
      case 1: // Problem selection
        return selectedProblem !== null
      case 2: // Validation
        return validationResult?.valid === true
      case 3: // Configuration
        return true // Parameters are optional
      case 4: // Submission
        return selectedProblem !== null && validationResult?.valid === true && !isSubmitting
      default:
        return false
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return renderSolverSelection()
      case 1:
        return renderProblemSelection()
      case 2:
        return renderValidation()
      case 3:
        return renderConfiguration()
      case 4:
        return renderSubmission()
      default:
        return null
    }
  }

  const renderSolverSelection = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="solver-repo">Select Solver Repository</Label>

        {loadingRepositories ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>Loading your repositories...</span>
          </div>
        ) : userRepositories.length > 0 ? (
          <div className="space-y-3 mt-2">
            <Select
              value={solverRepository}
              onValueChange={setSolverRepository}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose from your optimizer repositories" />
              </SelectTrigger>
              <SelectContent>
                {userRepositories.map((repo) => (
                  <SelectItem key={repo.id} value={repo.full_name}>
                    <div className="flex items-start gap-2 py-1">
                      <Settings className="h-4 w-4 mt-0.5 text-blue-500" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{repo.name}</div>
                        <div className="text-xs text-muted-foreground line-clamp-2">
                          {repo.description || "No description available"}
                        </div>
                        <div className="flex items-center gap-1 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {repo.qubot_type || "optimizer"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : (
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No Optimizer Repositories Found</h3>
            <p className="text-sm text-muted-foreground mb-4">
              You don't have any optimizer repositories in your account yet.
            </p>
            <p className="text-xs text-muted-foreground">
              Create a repository with a config.json file containing "type": "optimizer" to get started.
            </p>
          </div>
        )}
      </div>

      {userRepositories.length > 0 && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Your solver must be a valid qubots optimizer with a config.json file and proper metadata.
            It will be automatically validated in the next step.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )

  const renderProblemSelection = () => (
    <div className="space-y-4">
      <div>
        <Label>Select Benchmark Problem</Label>
        <div className="grid grid-cols-1 gap-3 mt-2 max-h-96 overflow-y-auto">
          {problems.map((problem) => (
            <Card
              key={problem.id}
              className={`cursor-pointer transition-all ${
                selectedProblem?.id === problem.id
                  ? "ring-2 ring-primary bg-primary/5"
                  : "hover:bg-muted/50"
              }`}
              onClick={() => setSelectedProblem(problem)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium">{problem.name}</h4>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {problem.description}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline">{problem.problem_type.toUpperCase()}</Badge>
                      <Badge variant="secondary">{problem.difficulty_level}</Badge>
                    </div>
                  </div>
                  {selectedProblem?.id === problem.id && (
                    <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 ml-2" />
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )

  const renderValidation = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Solver Validation</h3>
        <Button
          onClick={validateSolver}
          disabled={isValidating || !solverRepository}
          size="sm"
        >
          {isValidating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Validating...
            </>
          ) : (
            <>
              <CheckCircle className="h-4 w-4 mr-2" />
              Validate Solver
            </>
          )}
        </Button>
      </div>

      {validationResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {validationResult.valid ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              Validation Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {validationResult.config && (
              <div>
                <h4 className="font-medium mb-2">Solver Information</h4>
                <div className="bg-muted/50 p-3 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Name:</span>
                    <span className="text-sm font-medium">{validationResult.config.metadata.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Type:</span>
                    <span className="text-sm font-medium">{validationResult.config.metadata.optimizer_type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Supported Problems:</span>
                    <div className="flex gap-1">
                      {validationResult.config.metadata.problem_types.map(type => (
                        <Badge key={type} variant="outline" className="text-xs">{type}</Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {validationResult.errors.length > 0 && (
              <div>
                <h4 className="font-medium mb-2 text-red-600">Errors</h4>
                <div className="space-y-1">
                  {validationResult.errors.map((error, index) => (
                    <Alert key={index} variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  ))}
                </div>
              </div>
            )}

            {validationResult.warnings.length > 0 && (
              <div>
                <h4 className="font-medium mb-2 text-yellow-600">Warnings</h4>
                <div className="space-y-1">
                  {validationResult.warnings.map((warning, index) => (
                    <Alert key={index}>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{warning}</AlertDescription>
                    </Alert>
                  ))}
                </div>
              </div>
            )}

            {selectedProblem && validationResult.config && (
              <div>
                <h4 className="font-medium mb-2">Compatibility Check</h4>
                <div className="bg-muted/50 p-3 rounded-lg">
                  {validationResult.config.metadata.problem_types.includes(selectedProblem.problem_type) ? (
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      <span className="text-sm">Compatible with {selectedProblem.problem_type.toUpperCase()} problems</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-yellow-600">
                      <AlertCircle className="h-4 w-4" />
                      <span className="text-sm">May not be optimized for {selectedProblem.problem_type.toUpperCase()} problems</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )

  const renderConfiguration = () => (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium mb-2">Solver Configuration</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Configure parameters for your solver. Default values from config.json will be used if not specified.
        </p>
      </div>

      {validationResult?.config?.parameters && (
        <Card>
          <CardHeader>
            <CardTitle>Available Parameters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(validationResult.config.parameters).map(([key, param]) => (
              <div key={key}>
                <Label htmlFor={`param-${key}`}>{key}</Label>
                <div className="mt-1">
                  {param.type === 'boolean' ? (
                    <Select
                      value={customParameters[key]?.toString() || param.default?.toString() || "false"}
                      onValueChange={(value) => setCustomParameters(prev => ({
                        ...prev,
                        [key]: value === "true"
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">True</SelectItem>
                        <SelectItem value="false">False</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : param.type === 'number' || param.type === 'integer' ? (
                    <Input
                      id={`param-${key}`}
                      type="number"
                      placeholder={param.default?.toString() || ""}
                      value={customParameters[key] || ""}
                      onChange={(e) => setCustomParameters(prev => ({
                        ...prev,
                        [key]: param.type === 'integer' ? parseInt(e.target.value) : parseFloat(e.target.value)
                      }))}
                      min={param.min || param.minimum}
                      max={param.max || param.maximum}
                      step={param.step || (param.type === 'integer' ? 1 : 0.01)}
                    />
                  ) : (
                    <Input
                      id={`param-${key}`}
                      placeholder={param.default?.toString() || ""}
                      value={customParameters[key] || ""}
                      onChange={(e) => setCustomParameters(prev => ({
                        ...prev,
                        [key]: e.target.value
                      }))}
                    />
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">{param.description}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Parameters will be merged with default values from your solver's config.json.
          Custom values will override defaults during benchmark execution.
        </AlertDescription>
      </Alert>
    </div>
  )

  const renderSubmission = () => (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium mb-2">Submit to Leaderboard</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Your solver will be executed on the selected benchmark problem and results submitted to the leaderboard.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Submission Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Solver:</span>
            <span className="text-sm font-medium">{solverRepository}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Problem:</span>
            <span className="text-sm font-medium">{selectedProblem?.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Time Limit:</span>
            <span className="text-sm font-medium">{selectedProblem?.time_limit_seconds}s</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Memory Limit:</span>
            <span className="text-sm font-medium">{selectedProblem?.memory_limit_mb}MB</span>
          </div>
          {Object.keys(customParameters).length > 0 && (
            <div>
              <span className="text-sm text-muted-foreground">Custom Parameters:</span>
              <div className="mt-1 bg-muted/50 p-2 rounded text-xs">
                {JSON.stringify(customParameters, null, 2)}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {isSubmitting && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              Executing Benchmark
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Progress value={submissionProgress} className="w-full" />
            <div className="bg-black text-green-400 p-3 rounded font-mono text-xs max-h-48 overflow-y-auto">
              {submissionLogs.map((log, index) => (
                <div key={index}>{log}</div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          The benchmark will run your solver multiple times to ensure fair comparison.
          This process may take several minutes depending on the problem complexity.
        </AlertDescription>
      </Alert>
    </div>
  )

  const submitToLeaderboard = async () => {
    if (!selectedProblem || !validationResult?.valid) return

    setIsSubmitting(true)
    setSubmissionProgress(0)
    setSubmissionLogs(["Starting benchmark execution..."])

    try {
      // Get auth token from localStorage
      const token = localStorage.getItem('token')
      const headers: Record<string, string> = {
        "Content-Type": "application/json"
      }

      if (token) {
        headers["Authorization"] = `Bearer ${token}`
      }

      const response = await fetch(`${API}/api/submissions/submit-to-leaderboard`, {
        method: "POST",
        headers,
        credentials: 'include', // Also include session-based auth as fallback
        body: JSON.stringify({
          solver_repository: solverRepository,
          problem_id: selectedProblem.id,
          custom_parameters: customParameters
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Submission failed")
      }

      const data = await response.json()

      if (data.success) {
        setSubmissionProgress(100)
        setSubmissionLogs(prev => [...prev, "Submission started successfully!"])
        updateStepState(4, { completed: true })

        toast({
          title: "Submission Started",
          description: "Your solver submission has been queued for processing. Check your notifications for progress updates.",
          duration: 5000,
          action: (
            <button
              onClick={() => window.location.href = '/settings?tab=submissions'}
              className="text-sm underline"
            >
              Track Progress
            </button>
          )
        })

        // Call the completion callback with the submission ID
        onSubmissionComplete(data.submission_id)

        // Close the wizard after a short delay and redirect to track progress
        setTimeout(() => {
          onClose()
          // Redirect to My Submissions page to track progress
          window.location.href = `/settings?tab=submissions&submission=${data.submission_id}`
        }, 3000)
      } else {
        throw new Error(data.message || "Submission failed")
      }
    } catch (error) {
      console.error("Submission error:", error)
      updateStepState(4, { error: "Submission failed" })
      setSubmissionLogs(prev => [...prev, `Error: ${error.message}`])

      toast({
        title: "Submission Failed",
        description: error.message || "Failed to submit solver to leaderboard",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Submit Solver to Leaderboard
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress Steps */}
          <div className="flex items-center justify-between">
            {stepStates.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                  step.completed
                    ? "bg-green-500 border-green-500 text-white"
                    : step.current
                      ? "border-primary bg-primary text-white"
                      : step.error
                        ? "border-red-500 bg-red-500 text-white"
                        : "border-muted-foreground text-muted-foreground"
                }`}>
                  {step.completed ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : step.error ? (
                    <XCircle className="h-4 w-4" />
                  ) : (
                    <span className="text-xs font-medium">{index + 1}</span>
                  )}
                </div>
                {index < stepStates.length - 1 && (
                  <div className={`w-16 h-0.5 mx-2 ${
                    step.completed ? "bg-green-500" : "bg-muted"
                  }`} />
                )}
              </div>
            ))}
          </div>

          {/* Step Labels */}
          <div className="flex justify-between text-sm">
            {stepStates.map((step) => (
              <div key={step.id} className="text-center max-w-24">
                <p className={`font-medium ${step.current ? "text-primary" : step.completed ? "text-green-600" : "text-muted-foreground"}`}>
                  {step.title}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {step.description}
                </p>
              </div>
            ))}
          </div>

          {/* Step Content */}
          <div className="min-h-[400px]">
            {renderStepContent()}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between pt-4 border-t">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 0 || isSubmitting}
            >
              Previous
            </Button>

            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </Button>

              {currentStep === stepStates.length - 1 ? (
                <Button
                  onClick={submitToLeaderboard}
                  disabled={!canProceedToNext() || isSubmitting}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Trophy className="h-4 w-4 mr-2" />
                      Submit to Leaderboard
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  onClick={nextStep}
                  disabled={!canProceedToNext()}
                >
                  Next
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

import { useState, useRef, useCallback } from "react"
import { motion } from "framer-motion"
import Layout from "@/components/Layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Upload,
  FileText,
  Sparkles,
  Brain,
  Zap,
  CheckCircle,
  AlertCircle,
  Loader2,
  Play,
  Download,
  Star,
  TrendingUp,
  Clock,
  Target,
  Package,
  Beaker,
  User,
  Calendar,
  Eye,
  Heart
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { autosolveApi, FileAnalysis, Recommendation } from "@/services/autosolveApi"

// Add experiment interface
interface ExperimentRecommendation {
  id: string
  type: 'experiment'
  experimentId: number
  title: string
  description: string
  creator: string
  problemName: string
  problemUsername: string
  optimizerName: string
  optimizerUsername: string
  problemParams: any
  optimizerParams: any
  tags: string[]
  confidence: number
  compatibility: number
  matchFactors: string[]
  performance: {
    avgRuntime: number | null
    successRate: number
    bestValue: number | null
  }
  createdAt: string
  viewsCount: number
  likesCount: number
}

export default function AutoSolvePage() {
  const [dragActive, setDragActive] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisProgress, setAnalysisProgress] = useState(0)
  const [fileAnalysis, setFileAnalysis] = useState<FileAnalysis | null>(null)
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [experiments, setExperiments] = useState<ExperimentRecommendation[]>([])
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false)
  const [isLoadingExperiments, setIsLoadingExperiments] = useState(false)
  const [recommendationMode, setRecommendationMode] = useState<'repositories' | 'experiments'>('repositories')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0])
    }
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0])
    }
  }

  const handleFileUpload = async (file: File) => {
    setUploadedFile(file)
    setIsAnalyzing(true)
    setAnalysisProgress(0)
    setFileAnalysis(null)
    setRecommendations([])

    try {
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setAnalysisProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 200)

      // Call actual API
      const analysis = await autosolveApi.analyzeFile(file)

      clearInterval(progressInterval)
      setAnalysisProgress(100)

      setFileAnalysis(analysis)

      // Load recommendations for both modes
      await loadRecommendations(analysis)
      await loadExperiments(analysis)

      toast({
        title: "File analyzed successfully!",
        description: `Detected ${analysis.problemType} with ${(analysis.confidence * 100).toFixed(0)}% confidence.`,
      })

    } catch (error) {
      console.error('Analysis failed:', error)
      toast({
        title: "Analysis failed",
        description: error instanceof Error ? error.message : "There was an error analyzing your file. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsAnalyzing(false)
    }
  }

  const loadRecommendations = async (analysis: FileAnalysis) => {
    setIsLoadingRecommendations(true)

    try {
      const recommendations = await autosolveApi.getRecommendations(analysis)
      setRecommendations(recommendations)
    } catch (error) {
      console.error('Failed to load recommendations:', error)
      toast({
        title: "Failed to load recommendations",
        description: error instanceof Error ? error.message : "There was an error loading recommendations. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoadingRecommendations(false)
    }
  }

  const loadExperiments = async (analysis: FileAnalysis) => {
    setIsLoadingExperiments(true)

    try {
      const experiments = await autosolveApi.getExperimentRecommendations(analysis)
      setExperiments(experiments)
    } catch (error) {
      console.error('Failed to load experiments:', error)
      toast({
        title: "Failed to load experiments",
        description: error instanceof Error ? error.message : "There was an error loading experiment recommendations. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoadingExperiments(false)
    }
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  const resetUpload = () => {
    setUploadedFile(null)
    setFileAnalysis(null)
    setRecommendations([])
    setExperiments([])
    setIsAnalyzing(false)
    setAnalysisProgress(0)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20"
      >
        <div className="w-full max-w-7xl mx-auto px-6 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500/10 to-purple-600/10 border border-purple-200/20">
                <Sparkles className="h-6 w-6 text-purple-600" />
              </div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
                AutoSolve
                <Badge variant="secondary" className="ml-3 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300">
                  Beta
                </Badge>
              </h1>
            </div>
            <p className="text-lg text-muted-foreground max-w-3xl">
              Upload your optimization data files and get AI-powered recommendations for the best qubots problems and optimizers. 
              Let AutoSolve analyze your data and suggest the perfect optimization approach.
            </p>
          </div>

          {/* Main Content */}
          <div className="grid gap-8">
            {/* File Upload Section */}
            <Card className="border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Upload Your Data File
                </CardTitle>
                <CardDescription>
                  Supported formats: .tsp, .csv, .json, .txt, .dat and more
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!uploadedFile ? (
                  <div
                    className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                      dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25"
                    }`}
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                    onClick={triggerFileInput}
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      className="hidden"
                      accept=".tsp,.csv,.json,.txt,.dat,.xml,.yaml,.yml"
                    />
                    <div className="flex flex-col items-center gap-4">
                      <div className="p-4 rounded-full bg-muted">
                        <Upload className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-lg font-medium mb-2">
                          Drag and drop your file here, or click to browse
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Maximum file size: 50MB
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-primary" />
                        <div>
                          <p className="font-medium">{uploadedFile.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {(uploadedFile.size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" onClick={resetUpload}>
                        Remove
                      </Button>
                    </div>

                    {isAnalyzing && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Brain className="h-4 w-4 text-primary animate-pulse" />
                          <span className="text-sm font-medium">Analyzing file...</span>
                        </div>
                        <Progress value={analysisProgress} className="h-2" />
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Analysis Results */}
            {fileAnalysis && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      Analysis Complete
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Problem Type</label>
                          <p className="text-lg font-semibold">{fileAnalysis.problemType}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Confidence</label>
                          <div className="flex items-center gap-2">
                            <Progress value={fileAnalysis.confidence * 100} className="h-2 flex-1" />
                            <span className="text-sm font-medium">{(fileAnalysis.confidence * 100).toFixed(0)}%</span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Characteristics</label>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {fileAnalysis.characteristics.map((char, index) => (
                            <Badge key={index} variant="secondary">{char}</Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Recommendations */}
            {(recommendations.length > 0 || experiments.length > 0 || isLoadingRecommendations || isLoadingExperiments) && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="h-5 w-5 text-yellow-600" />
                      AI Recommendations
                    </CardTitle>
                    <CardDescription>
                      Based on your file analysis, here are the best matching solutions
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Tabs value={recommendationMode} onValueChange={(value) => setRecommendationMode(value as 'repositories' | 'experiments')}>
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="repositories" className="flex items-center gap-2">
                          <Package className="h-4 w-4" />
                          Repositories
                        </TabsTrigger>
                        <TabsTrigger value="experiments" className="flex items-center gap-2">
                          <Beaker className="h-4 w-4" />
                          Experiments
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value="repositories" className="mt-6">
                        {isLoadingRecommendations ? (
                          <div className="flex items-center justify-center py-12">
                            <div className="flex items-center gap-3">
                              <Loader2 className="h-6 w-6 animate-spin text-primary" />
                              <span className="text-lg">Finding repository recommendations...</span>
                            </div>
                          </div>
                        ) : recommendations.length > 0 ? (
                          <div className="space-y-4">
                            {recommendations.map((rec, index) => (
                              <motion.div
                                key={rec.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.3, delay: index * 0.1 }}
                              >
                                <RecommendationCard recommendation={rec} />
                              </motion.div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8 text-muted-foreground">
                            No repository recommendations found for this file type.
                          </div>
                        )}
                      </TabsContent>

                      <TabsContent value="experiments" className="mt-6">
                        {isLoadingExperiments ? (
                          <div className="flex items-center justify-center py-12">
                            <div className="flex items-center gap-3">
                              <Loader2 className="h-6 w-6 animate-spin text-primary" />
                              <span className="text-lg">Finding experiment recommendations...</span>
                            </div>
                          </div>
                        ) : experiments.length > 0 ? (
                          <div className="space-y-4">
                            {experiments.map((exp, index) => (
                              <motion.div
                                key={exp.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.3, delay: index * 0.1 }}
                              >
                                <ExperimentCard experiment={exp} uploadedFile={uploadedFile} />
                              </motion.div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8 text-muted-foreground">
                            No experiment recommendations found for this file type.
                          </div>
                        )}
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>
    </Layout>
  )
}

// Recommendation Card Component
function RecommendationCard({ recommendation }: { recommendation: Recommendation }) {
  const getTypeIcon = (type: string) => {
    return type === 'problem' ? <Target className="h-4 w-4" /> : <Zap className="h-4 w-4" />
  }

  const getTypeColor = (type: string) => {
    return type === 'problem' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' : 
           'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
  }

  return (
    <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <Badge className={getTypeColor(recommendation.type)}>
            {getTypeIcon(recommendation.type)}
            <span className="ml-1 capitalize">{recommendation.type}</span>
          </Badge>
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 text-yellow-500 fill-current" />
            <span className="text-sm font-medium">{(recommendation.confidence * 100).toFixed(0)}%</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => window.open(`/${recommendation.username}/${recommendation.repository}`, '_blank')}
          >
            View Repository
          </Button>
          <Button size="sm">
            <Play className="h-4 w-4 mr-1" />
            Run in Playground
          </Button>
        </div>
      </div>
      
      <div className="space-y-2">
        <h3 className="font-semibold text-lg">{recommendation.name}</h3>
        <p className="text-sm text-muted-foreground">{recommendation.description}</p>
        <p className="text-sm text-muted-foreground">
          <span className="font-medium">Repository:</span> {recommendation.username}/{recommendation.repository}
        </p>
        
        <div className="flex flex-wrap gap-1 mt-2">
          {recommendation.tags.map((tag, index) => (
            <Badge key={index} variant="outline" className="text-xs">{tag}</Badge>
          ))}
        </div>

        {recommendation.matchFactors && recommendation.matchFactors.length > 0 && (
          <div className="mt-2">
            <p className="text-xs text-muted-foreground mb-1">Why this matches:</p>
            <div className="flex flex-wrap gap-1">
              {recommendation.matchFactors.map((factor, index) => (
                <Badge key={index} variant="secondary" className="text-xs bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                  {factor}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {recommendation.performance && (
          <div className="flex items-center gap-4 mt-3 pt-3 border-t">
            <div className="flex items-center gap-1 text-sm">
              <Clock className="h-3 w-3" />
              <span>{recommendation.performance.avgRuntime}s avg</span>
            </div>
            <div className="flex items-center gap-1 text-sm">
              <TrendingUp className="h-3 w-3" />
              <span>{recommendation.performance.successRate}% success</span>
            </div>
            {recommendation.performance.bestValue && (
              <div className="flex items-center gap-1 text-sm">
                <Target className="h-3 w-3" />
                <span>Best: {recommendation.performance.bestValue}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// Experiment Card Component
function ExperimentCard({ experiment, uploadedFile }: { experiment: ExperimentRecommendation, uploadedFile: File | null }) {
  const { toast } = useToast()

  const handleRunExperiment = async () => {
    try {
      const result = await autosolveApi.executeExperiment(experiment.experimentId, uploadedFile || undefined)
      toast({
        title: "Experiment started!",
        description: `${experiment.title} is now running in the playground.`,
      })
    } catch (error) {
      toast({
        title: "Failed to start experiment",
        description: error instanceof Error ? error.message : "There was an error starting the experiment.",
        variant: "destructive",
      })
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300">
            <Beaker className="h-4 w-4" />
            <span className="ml-1">Experiment</span>
          </Badge>
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 text-yellow-500 fill-current" />
            <span className="text-sm font-medium">{(experiment.confidence * 100).toFixed(0)}%</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => window.open(`/optimization-workflows/${experiment.experimentId}`, '_blank')}
          >
            View Details
          </Button>
          <Button size="sm" onClick={handleRunExperiment}>
            <Play className="h-4 w-4 mr-1" />
            Run Experiment
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="font-semibold text-lg">{experiment.title}</h3>
        <p className="text-sm text-muted-foreground">{experiment.description}</p>

        <div className="grid md:grid-cols-2 gap-4 mt-3">
          <div>
            <p className="text-sm text-muted-foreground">
              <span className="font-medium">Problem:</span> {experiment.problemUsername}/{experiment.problemName}
            </p>
            <p className="text-sm text-muted-foreground">
              <span className="font-medium">Optimizer:</span> {experiment.optimizerUsername}/{experiment.optimizerName}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">
              <span className="font-medium">Creator:</span> {experiment.creator}
            </p>
            <p className="text-sm text-muted-foreground">
              <span className="font-medium">Created:</span> {formatDate(experiment.createdAt)}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-1 mt-2">
          {experiment.tags.map((tag, index) => (
            <Badge key={index} variant="outline" className="text-xs">{tag}</Badge>
          ))}
        </div>

        {experiment.matchFactors && experiment.matchFactors.length > 0 && (
          <div className="mt-2">
            <p className="text-xs text-muted-foreground mb-1">Why this matches:</p>
            <div className="flex flex-wrap gap-1">
              {experiment.matchFactors.map((factor, index) => (
                <Badge key={index} variant="secondary" className="text-xs bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                  {factor}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center gap-4 mt-3 pt-3 border-t">
          {experiment.performance.avgRuntime && (
            <div className="flex items-center gap-1 text-sm">
              <Clock className="h-3 w-3" />
              <span>{experiment.performance.avgRuntime.toFixed(1)}s avg</span>
            </div>
          )}
          <div className="flex items-center gap-1 text-sm">
            <TrendingUp className="h-3 w-3" />
            <span>{experiment.performance.successRate}% success</span>
          </div>
          <div className="flex items-center gap-1 text-sm">
            <Eye className="h-3 w-3" />
            <span>{experiment.viewsCount} views</span>
          </div>
          <div className="flex items-center gap-1 text-sm">
            <Heart className="h-3 w-3" />
            <span>{experiment.likesCount} likes</span>
          </div>
        </div>
      </div>
    </div>
  )
}

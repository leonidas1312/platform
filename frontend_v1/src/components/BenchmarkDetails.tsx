"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import Layout from "../components/Layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"
import { ArrowLeft, BarChart, Code, GitCompare, LinkIcon, Loader2, Upload, Users, Download, ExternalLink } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { handleColabOpen } from "@/utils/colabUtils"

const API = import.meta.env.VITE_API_BASE

interface Benchmark {
  id: number
  title: string
  description: string
  created_by: string
  created_at: string
  updated_at: string
  connections: BenchmarkConnection[]
  results_count: number
  has_notebook?: boolean
  notebook_filename?: string
}

interface BenchmarkConnection {
  id: number
  benchmark_id: number
  repo_owner: string
  repo_name: string
  connected_repo_path: string
  description?: string
  code_snippet?: string
}

interface BenchmarkResult {
  id: number
  benchmark_id: number
  user_id: string
  repo_path: string
  metrics: Record<string, any>
  created_at: string
  code_snippet?: string
  has_notebook?: boolean
  notebook_filename?: string
}

interface Repository {
  id: number
  name: string
  full_name: string
  owner?: { login: string; avatar_url?: string }
  stars_count: number
  updated_at: string
  description?: string
  private: boolean
  language?: string
  qubot_type?: "problem" | "optimizer"
}

export default function BenchmarkDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()

  const [benchmark, setBenchmark] = useState<Benchmark | null>(null)
  const [results, setResults] = useState<BenchmarkResult[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [activeTab, setActiveTab] = useState("results")
  const [showParticipateDialog, setShowParticipateDialog] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userRepos, setUserRepos] = useState<Repository[]>([])
  const [participateNotebookFile, setParticipateNotebookFile] = useState<File | null>(null)
  const [selectedRepoPath, setSelectedRepoPath] = useState("")

  // Check authentication status
  useEffect(() => {
    const token = localStorage.getItem("gitea_token")
    setIsAuthenticated(!!token)

    if (token) {
      fetchUserRepos(token)
    }
  }, [])

  // Fetch user repositories
  const fetchUserRepos = async (token: string) => {
    try {
      const response = await fetch(`${API}/user-repos`, {
        headers: {
          Authorization: `token ${token}`,
        },
      })

      if (response.ok) {
        const repos = await response.json()
        setUserRepos(repos)
      } else {
        console.error("Failed to fetch user repositories:", response.status, response.statusText)
      }
    } catch (error) {
      console.error("Error fetching user repositories:", error)
    }
  }

  // Fetch benchmark details
  useEffect(() => {
    const fetchBenchmarkDetails = async () => {
      setLoading(true)
      setError("")

      try {
        const token = localStorage.getItem("gitea_token")
        const headers: HeadersInit = {}

        if (token) {
          headers.Authorization = `token ${token}`
        }

        const response = await fetch(`${API}/benchmarks/${id}`, { headers })

        if (!response.ok) {
          throw new Error("Failed to fetch benchmark details")
        }

        const data = await response.json()
        setBenchmark(data)

        // Fetch results
        const resultsResponse = await fetch(`${API}/benchmarks/${id}/results`, { headers })

        if (!resultsResponse.ok) {
          throw new Error("Failed to fetch benchmark results")
        }

        const resultsData = await resultsResponse.json()
        setResults(resultsData)
      } catch (err: any) {
        console.error("Error fetching benchmark details:", err)
        setError(err.message || "Failed to load benchmark details")
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchBenchmarkDetails()
    }
  }, [id])

  // Handle file selection for participating in a benchmark
  const handleParticipateNotebookFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setParticipateNotebookFile(e.target.files[0])
    }
  }

  // Handle downloading a benchmark notebook
  const handleDownloadBenchmarkNotebook = async () => {
    if (!benchmark) return

    try {
      const token = localStorage.getItem("gitea_token")
      const headers: HeadersInit = {}

      if (token) {
        headers.Authorization = `token ${token}`
      }

      const response = await fetch(`${API}/benchmarks/${benchmark.id}/notebook`, {
        headers,
      })

      if (!response.ok) {
        throw new Error("Failed to download notebook")
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = benchmark.notebook_filename || `benchmark-${benchmark.id}.ipynb`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error("Error downloading benchmark notebook:", error)
      toast({
        title: "Error",
        description: "Failed to download notebook",
        variant: "destructive",
      })
    }
  }

  // Handle downloading a result notebook
  const handleDownloadResultNotebook = async (resultId: number) => {
    try {
      const token = localStorage.getItem("gitea_token")
      const headers: HeadersInit = {}

      if (token) {
        headers.Authorization = `token ${token}`
      }

      const response = await fetch(`${API}/benchmark-results/${resultId}/notebook`, {
        headers,
      })

      if (!response.ok) {
        throw new Error("Failed to download notebook")
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `result-${resultId}.ipynb`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error("Error downloading result notebook:", error)
      toast({
        title: "Error",
        description: "Failed to download notebook",
        variant: "destructive",
      })
    }
  }

  // Handle opening a benchmark notebook in Google Colab
  const handleOpenBenchmarkInColab = async () => {
    if (!benchmark) return

    try {
      const token = localStorage.getItem("gitea_token")
      const headers: HeadersInit = {}

      if (token) {
        headers.Authorization = `token ${token}`
      }

      const response = await fetch(`${API}/benchmarks/${benchmark.id}/notebook/colab`, {
        headers,
      })

      if (!response.ok) {
        throw new Error("Failed to get notebook for Colab")
      }

      const data = await response.json()
      const success = await handleColabOpen(data.notebookContent, data.filename)

      if (success) {
        toast({
          title: "Opening in Google Colab",
          description: "Notebook downloaded. Google Colab will open in a new tab.",
        })
      } else {
        throw new Error("Failed to open notebook in Colab")
      }
    } catch (error) {
      console.error("Error opening benchmark notebook in Colab:", error)
      toast({
        title: "Error",
        description: "Failed to open notebook in Google Colab",
        variant: "destructive",
      })
    }
  }

  // Handle opening a result notebook in Google Colab
  const handleOpenResultInColab = async (resultId: number) => {
    try {
      const token = localStorage.getItem("gitea_token")
      const headers: HeadersInit = {}

      if (token) {
        headers.Authorization = `token ${token}`
      }

      const response = await fetch(`${API}/benchmark-results/${resultId}/notebook/colab`, {
        headers,
      })

      if (!response.ok) {
        throw new Error("Failed to get notebook for Colab")
      }

      const data = await response.json()
      const success = await handleColabOpen(data.notebookContent, data.filename)

      if (success) {
        toast({
          title: "Opening in Google Colab",
          description: "Notebook downloaded. Google Colab will open in a new tab.",
        })
      } else {
        throw new Error("Failed to open notebook in Colab")
      }
    } catch (error) {
      console.error("Error opening result notebook in Colab:", error)
      toast({
        title: "Error",
        description: "Failed to open notebook in Google Colab",
        variant: "destructive",
      })
    }
  }

  // Handle participating in a benchmark
  const handleParticipateBenchmark = async () => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication required",
        description: "Please sign in to participate in a benchmark",
        variant: "destructive",
      })
      return
    }

    if (!selectedRepoPath) {
      toast({
        title: "Missing information",
        description: "Please select a repository",
        variant: "destructive",
      })
      return
    }

    if (!participateNotebookFile) {
      toast({
        title: "Missing notebook",
        description: "Please upload a Jupyter notebook (.ipynb) file",
        variant: "destructive",
      })
      return
    }

    try {
      const token = localStorage.getItem("gitea_token")

      // Create FormData for file upload
      const formData = new FormData()
      formData.append("repoPath", selectedRepoPath)

      // Only append notebook file if one is selected
      if (participateNotebookFile) {
        formData.append("notebook", participateNotebookFile)
      }

      // Submit the participation
      const response = await fetch(`${API}/benchmarks/${id}/results`, {
        method: "POST",
        headers: {
          Authorization: `token ${token}`,
        },
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to submit benchmark participation")
      }

      const result = await response.json()
      console.log("Participation submitted successfully:", result)

      // Reset form
      setSelectedRepoPath("")
      setParticipateNotebookFile(null)
      setShowParticipateDialog(false)

      // Refresh results
      const resultsResponse = await fetch(`${API}/benchmarks/${id}/results`, {
        headers: { Authorization: `token ${token}` },
      })

      if (resultsResponse.ok) {
        const resultsData = await resultsResponse.json()
        setResults(resultsData)
      }

      toast({
        title: "Participation submitted",
        description: "Your benchmark participation has been submitted successfully",
      })
    } catch (error) {
      console.error("Error participating in benchmark:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit benchmark participation",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-background py-8">
          <div className="max-w-[1200px] mx-auto">
            <div className="flex items-center justify-center py-32">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">Loading benchmark details...</span>
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  if (error || !benchmark) {
    return (
      <Layout>
        <div className="min-h-screen bg-background py-8">
          <div className="max-w-[1200px] mx-auto">
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <GitCompare className="h-16 w-16 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium">Error loading benchmark</h3>
              <p className="text-muted-foreground mt-1 mb-4 max-w-md">{error || "Benchmark not found"}</p>
              <Button onClick={() => navigate("/benchmark")}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Benchmarks
              </Button>
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="min-h-screen bg-background py-8">
        <div className="max-w-[1200px] mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Button variant="outline" size="sm" onClick={() => navigate("/benchmark")}>
                <ArrowLeft className="mr-1 h-4 w-4" />
                Back
              </Button>
              <Badge variant="outline" className="bg-primary/10 border-primary/20">
                <GitCompare className="h-3.5 w-3.5 mr-1.5" />
                Benchmark
              </Badge>
            </div>

            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold tracking-tight mb-2">{benchmark.title}</h1>
                <p className="text-muted-foreground max-w-3xl">{benchmark.description}</p>

                <div className="flex items-center gap-3 mt-4 text-sm">
                  <div className="flex items-center gap-1.5">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>Created by {benchmark.created_by}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <BarChart className="h-4 w-4 text-muted-foreground" />
                    <span>{results.length} results</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {benchmark.has_notebook && (
                  <>
                    <Button variant="outline" onClick={handleDownloadBenchmarkNotebook}>
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </Button>
                    <Button variant="outline" onClick={handleOpenBenchmarkInColab}>
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Open in Colab
                    </Button>
                  </>
                )}
                <Button onClick={() => setShowParticipateDialog(true)}>
                  <Upload className="mr-2 h-4 w-4" />
                  Participate
                </Button>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="results">Results</TabsTrigger>
              <TabsTrigger value="connections">Connections</TabsTrigger>
              <TabsTrigger value="code">Code Snippets</TabsTrigger>
            </TabsList>

            {/* Results Tab */}
            <TabsContent value="results" className="space-y-6">
              {results.length === 0 ? (
                <div className="text-center py-12 border rounded-lg bg-muted/20">
                  <BarChart className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-medium mb-2">No results yet</h3>
                  <p className="text-muted-foreground mb-4">Be the first to upload results for this benchmark!</p>
                  <Button onClick={() => setShowParticipateDialog(true)}>
                    <Upload className="mr-2 h-4 w-4" />
                    Participate
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {results.map((result) => (
                    <Card key={result.id}>
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg">{result.repo_path.split("/")[1]}</CardTitle>
                            <CardDescription>
                              Submitted by {result.user_id} on {new Date(result.created_at).toLocaleDateString()}
                            </CardDescription>
                          </div>
                          <div className="flex items-center gap-2">
                            {result.has_notebook && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDownloadResultNotebook(result.id)}
                                  className="h-8 px-2 flex items-center gap-1"
                                >
                                  <Download className="h-3.5 w-3.5 mr-1" />
                                  Download
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleOpenResultInColab(result.id)}
                                  className="h-8 px-2 flex items-center gap-1"
                                >
                                  <ExternalLink className="h-3.5 w-3.5 mr-1" />
                                  Colab
                                </Button>
                              </>
                            )}
                            <Badge variant="outline">{result.repo_path.split("/")[0]}</Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-3">
                          {Object.entries(result.metrics).map(([key, value]) => (
                            <div key={key} className="bg-muted/50 p-3 rounded-md">
                              <div className="text-xs text-muted-foreground mb-1">{key}</div>
                              <div className="font-medium">{value}</div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                      <CardFooter>
                        <Button variant="outline" size="sm" className="w-full" onClick={() => setActiveTab("code")}>
                          <Code className="mr-2 h-4 w-4" />
                          View Code
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Connections Tab */}
            <TabsContent value="connections" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {benchmark.connections.map((connection) => (
                  <Card key={connection.id}>
                    <CardHeader>
                      <CardTitle className="text-lg">
                        <a
                          href={`/${connection.connected_repo_path}`}
                          className="hover:text-primary hover:underline"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {connection.connected_repo_path}
                        </a>
                      </CardTitle>
                      <CardDescription>
                        {connection.repo_owner}/{connection.repo_name}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {connection.description && <p className="text-muted-foreground">{connection.description}</p>}
                    </CardContent>
                    <CardFooter>
                      <Button variant="outline" size="sm" className="w-full" onClick={() => setActiveTab("code")}>
                        <Code className="mr-2 h-4 w-4" />
                        View Code
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Code Snippets Tab */}
            <TabsContent value="code" className="space-y-6">
              <div className="grid grid-cols-1 gap-6">
                {benchmark.connections.map((connection) => (
                  <Card key={connection.id} className="overflow-hidden">
                    <CardHeader className="bg-muted/50">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <LinkIcon className="h-4 w-4" />
                        {connection.connected_repo_path}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      {connection.code_snippet ? (
                        <pre className="p-4 overflow-x-auto text-sm">
                          <code>{connection.code_snippet}</code>
                        </pre>
                      ) : (
                        <div className="p-4 text-muted-foreground">No code snippet available for this connection.</div>
                      )}
                    </CardContent>
                  </Card>
                ))}

                {results.map((result) => (
                  <Card key={result.id} className="overflow-hidden">
                    <CardHeader className="bg-muted/50">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Code className="h-4 w-4" />
                        {result.repo_path} (Result by {result.user_id})
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      {result.code_snippet ? (
                        <pre className="p-4 overflow-x-auto text-sm">
                          <code>{result.code_snippet}</code>
                        </pre>
                      ) : (
                        <div className="p-4 text-muted-foreground">No code snippet available for this result.</div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Participate Dialog */}
      <Dialog open={showParticipateDialog} onOpenChange={setShowParticipateDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Participate in Benchmark</DialogTitle>
            <DialogDescription>Submit your results for this benchmark.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="repository" className="text-sm font-medium">
                Your Repository
              </label>
              <Select value={selectedRepoPath} onValueChange={setSelectedRepoPath}>
                <SelectTrigger>
                  <SelectValue placeholder="Select your repository" />
                </SelectTrigger>
                <SelectContent>
                  {userRepos.map((repo) => (
                    <SelectItem key={repo.id} value={repo.full_name}>
                      {repo.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <label htmlFor="participateNotebookFile" className="text-sm font-medium">
                Jupyter Notebook (.ipynb)
              </label>
              <div className="flex items-center gap-2">
                <Input
                  id="participateNotebookFile"
                  type="file"
                  accept=".ipynb"
                  onChange={handleParticipateNotebookFileChange}
                  className="flex-1"
                />
              </div>
              {!participateNotebookFile && (
                <p className="text-sm text-muted-foreground">
                  Upload your completed Jupyter notebook with benchmark results.
                </p>
              )}
              {participateNotebookFile && (
                <p className="text-sm text-green-600">
                  Selected: {participateNotebookFile.name} ({Math.round(participateNotebookFile.size / 1024)} KB)
                </p>
              )}
            </div>

            {benchmark.has_notebook && (
              <div className="flex justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadBenchmarkNotebook}
                  className="flex items-center gap-1"
                >
                  <Download className="h-4 w-4 mr-1" />
                  Download notebook
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleOpenBenchmarkInColab}
                  className="flex items-center gap-1"
                >
                  <ExternalLink className="h-4 w-4 mr-1" />
                  Open in Colab
                </Button>
              </div>
            )}

            <Alert className="bg-blue-50 border-blue-200">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertTitle className="text-blue-800">Submission Guidelines</AlertTitle>
              <AlertDescription className="text-blue-700">
                Download the benchmark notebook first, complete it with your implementation, and then upload your
                completed notebook. Make sure all cells are executed and results are visible.
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowParticipateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleParticipateBenchmark}>Submit Participation</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  )
}

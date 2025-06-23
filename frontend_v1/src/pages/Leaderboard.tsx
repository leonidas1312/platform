import { useState, useEffect } from "react"
import { useSearchParams } from "react-router-dom"
import Layout from "@/components/Layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Trophy,
  Target,
  RefreshCw,
  BarChart3,
  Eye,
  ArrowLeft,
  TrendingUp,
  Plus,
  Code,
  Copy,
  ExternalLink,
  Play,
  Award,
  Trash2
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "@/components/ui/use-toast"
import { useAdmin } from "@/hooks/use-admin"
import { RankingTable } from "@/components/leaderboard/RankingTable"
import { SubmissionProgress } from "@/components/leaderboard/SubmissionProgress"
import { AdminProblemCreationDialog } from "@/components/leaderboard/AdminProblemCreationDialog"

const API = import.meta.env.VITE_API_BASE

interface StandardizedProblem {
  id: number
  name: string
  problem_type: string
  difficulty_level: string
  description: string
  submission_count?: number
  best_value?: number
  problem_config?: {
    repository_path?: string
    owner?: string
    repo_name?: string
  }
}

interface LeaderboardStats {
  total_problems: number
  total_submissions: number
  total_solvers: number
  problem_types: Array<{ problem_type: string; count: string }>
}

export default function Leaderboard() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [problems, setProblems] = useState<StandardizedProblem[]>([])
  const [selectedProblem, setSelectedProblem] = useState<StandardizedProblem | null>(null)
  const [stats, setStats] = useState<LeaderboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAdminDialog, setShowAdminDialog] = useState(false)
  const [showUseLocallyDialog, setShowUseLocallyDialog] = useState(false)
  const [selectedProblemForCode, setSelectedProblemForCode] = useState<StandardizedProblem | null>(null)
  const { isAdmin } = useAdmin()

  // Get initial problem from URL params
  useEffect(() => {
    const problemId = searchParams.get("problem")

    if (problemId && problems.length > 0) {
      const problem = problems.find(p => p.id.toString() === problemId)
      if (problem) {
        setSelectedProblem(problem)
      }
    }
  }, [searchParams, problems])

  // Load initial data
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    setError(null)

    try {
      const [problemsResponse, statsResponse, overviewResponse] = await Promise.all([
        fetch(`${API}/api/leaderboard/problems`),
        fetch(`${API}/api/leaderboard/stats`),
        fetch(`${API}/api/leaderboard/overview`)
      ])

      if (!problemsResponse.ok || !statsResponse.ok || !overviewResponse.ok) {
        throw new Error("Failed to load leaderboard data")
      }

      const [problemsData, statsData, overviewData] = await Promise.all([
        problemsResponse.json(),
        statsResponse.json(),
        overviewResponse.json()
      ])

      // Merge problems with overview data
      const problemsWithStats = problemsData.problems.map((problem: StandardizedProblem) => {
        const overview = overviewData.overview.find((o: any) => o.id === problem.id)
        return {
          ...problem,
          submission_count: overview?.submission_count || 0,
          best_value: overview?.best_value || null
        }
      })

      setProblems(problemsWithStats)
      setStats(statsData.stats)
    } catch (err) {
      console.error("Error loading leaderboard data:", err)
      setError("Failed to load leaderboard data")
      toast({
        title: "Error",
        description: "Failed to load leaderboard data",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleProblemSelect = (problem: StandardizedProblem) => {
    setSelectedProblem(problem)
    setSearchParams({ problem: problem.id.toString() })
  }

  const handleBackToProblems = () => {
    setSelectedProblem(null)
    setSearchParams({})
  }

  const handleViewRepository = (problem: StandardizedProblem) => {
    if (problem.problem_config?.repository_path) {
      const [owner, repoName] = problem.problem_config.repository_path.split('/')
      const repoUrl = `https://rastion.com/${owner}/${repoName}`
      window.open(repoUrl, '_blank')
    } else {
      toast({
        title: "Repository Not Available",
        description: "This problem doesn't have a repository path configured.",
        variant: "destructive"
      })
    }
  }

  const handleOpenInPlayground = (problem: StandardizedProblem) => {
    if (problem.problem_config?.repository_path) {
      const [owner, repoName] = problem.problem_config.repository_path.split('/')

      // Extract problem parameters from problem_config (excluding repository metadata)
      const problemParams = { ...problem.problem_config }
      delete problemParams.repository_path
      delete problemParams.owner
      delete problemParams.repo_name
      if ('optimization_type' in problemParams) {
        delete problemParams.optimization_type
      }

      // Build URL with parameters
      const params = new URLSearchParams({
        problem_name: repoName,
        problem_username: owner,
        leaderboard_problem_id: problem.id.toString(),
        locked: 'true'
      })

      // Add problem parameters if any exist
      if (Object.keys(problemParams).length > 0) {
        params.append('problem_params', JSON.stringify(problemParams))
      }

      const playgroundUrl = `/qubots-playground?${params.toString()}`
      // Use window.location.href instead of window.open to navigate in the same tab
      window.location.href = playgroundUrl
    } else {
      toast({
        title: "Cannot Open in Playground",
        description: "This problem doesn't have a repository path configured.",
        variant: "destructive"
      })
    }
  }

  const handleDeleteProblem = async (problem: StandardizedProblem) => {
    if (!isAdmin) {
      toast({
        title: "Access Denied",
        description: "Only administrators can delete problems.",
        variant: "destructive"
      })
      return
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete "${problem.name}"? This will permanently remove the problem and all associated submissions and rankings. This action cannot be undone.`
    )

    if (!confirmed) return

    try {
      const response = await fetch(`${API}/api/leaderboard/problems/${problem.id}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to delete problem')
      }

      toast({
        title: "Problem Deleted",
        description: `"${problem.name}" has been permanently deleted.`
      })

      // Refresh the problems list
      loadData()
    } catch (error: any) {
      console.error('Error deleting problem:', error)
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete problem",
        variant: "destructive"
      })
    }
  }

  const handleUseLocally = (problem: StandardizedProblem) => {
    setSelectedProblemForCode(problem)
    setShowUseLocallyDialog(true)
  }

  const copyCodeToClipboard = () => {
    if (selectedProblemForCode?.problem_config?.repository_path) {
      const code = `from qubots.auto_problem import AutoProblem\nproblem = AutoProblem.from_repo("${selectedProblemForCode.problem_config.repository_path}")`
      navigator.clipboard.writeText(code)
      toast({
        title: "Code Copied",
        description: "The code snippet has been copied to your clipboard."
      })
    }
  }

  // Generate artistic colors for cards that work in both light and dark themes
  const getCardColors = (problemId: number) => {
    const colors = [
      {
        light: 'from-blue-100 via-blue-50 to-indigo-100 border-blue-300 dark:from-blue-900/40 dark:via-blue-800/30 dark:to-indigo-900/40 dark:border-blue-600/50',
        accent: 'text-blue-700 dark:text-blue-300'
      },
      {
        light: 'from-purple-100 via-purple-50 to-pink-100 border-purple-300 dark:from-purple-900/40 dark:via-purple-800/30 dark:to-pink-900/40 dark:border-purple-600/50',
        accent: 'text-purple-700 dark:text-purple-300'
      },
      {
        light: 'from-emerald-100 via-emerald-50 to-green-100 border-emerald-300 dark:from-emerald-900/40 dark:via-emerald-800/30 dark:to-green-900/40 dark:border-emerald-600/50',
        accent: 'text-emerald-700 dark:text-emerald-300'
      },
      {
        light: 'from-orange-100 via-orange-50 to-red-100 border-orange-300 dark:from-orange-900/40 dark:via-orange-800/30 dark:to-red-900/40 dark:border-orange-600/50',
        accent: 'text-orange-700 dark:text-orange-300'
      },
      {
        light: 'from-teal-100 via-teal-50 to-cyan-100 border-teal-300 dark:from-teal-900/40 dark:via-teal-800/30 dark:to-cyan-900/40 dark:border-teal-600/50',
        accent: 'text-teal-700 dark:text-teal-300'
      },
      {
        light: 'from-amber-100 via-yellow-50 to-yellow-100 border-amber-300 dark:from-amber-900/40 dark:via-yellow-800/30 dark:to-yellow-900/40 dark:border-amber-600/50',
        accent: 'text-amber-700 dark:text-amber-300'
      },
      {
        light: 'from-rose-100 via-rose-50 to-pink-100 border-rose-300 dark:from-rose-900/40 dark:via-rose-800/30 dark:to-pink-900/40 dark:border-rose-600/50',
        accent: 'text-rose-700 dark:text-rose-300'
      },
      {
        light: 'from-violet-100 via-violet-50 to-purple-100 border-violet-300 dark:from-violet-900/40 dark:via-violet-800/30 dark:to-purple-900/40 dark:border-violet-600/50',
        accent: 'text-violet-700 dark:text-violet-300'
      },
      {
        light: 'from-sky-100 via-sky-50 to-blue-100 border-sky-300 dark:from-sky-900/40 dark:via-sky-800/30 dark:to-blue-900/40 dark:border-sky-600/50',
        accent: 'text-sky-700 dark:text-sky-300'
      },
      {
        light: 'from-lime-100 via-lime-50 to-green-100 border-lime-300 dark:from-lime-900/40 dark:via-lime-800/30 dark:to-green-900/40 dark:border-lime-600/50',
        accent: 'text-lime-700 dark:text-lime-300'
      }
    ]

    // Use problem ID to deterministically select a color, but make it appear random
    const colorIndex = (problemId * 7 + problemId * 13) % colors.length
    return colors[colorIndex]
  }



  const filteredProblems = problems

  const getDifficultyColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'easy': return 'bg-green-100 text-green-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'hard': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getProblemTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'tsp': return <Target className="h-4 w-4" />
      case 'maxcut': return <BarChart3 className="h-4 w-4" />
      case 'vrp': return <TrendingUp className="h-4 w-4" />
      default: return <Award className="h-4 w-4" />
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="h-8 w-8 animate-spin" />
            <span className="ml-2">Loading leaderboard...</span>
          </div>
        </div>
      </Layout>
    )
  }

  if (error) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">Leaderboard</h1>
            </div>
            <div className="flex items-center gap-2">
              {isAdmin && (
                <Button
                  onClick={() => setShowAdminDialog(true)}
                  variant="outline"
                  className="border-blue-500 text-blue-600 hover:bg-blue-50"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Problem
                </Button>
              )}
            </div>
          </div>
          

          {/* Steps for Joining Leaderboard */}
          <div className="mt-6 p-4 bg-muted/30 rounded-lg border">
            <h3 className="text-lg font-semibold mb-3 text-primary">How to Join a Leaderboard</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                  1
                </div>
                <div>
                  <p className="font-medium">Open leaderboard problem in playground</p>
                  <p className="text-sm text-muted-foreground">Click "Open in playground" on any problem card to load it with fixed parameters</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                  2
                </div>
                <div>
                  <p className="font-medium">Solve using your qubot optimizer</p>
                  <p className="text-sm text-muted-foreground">Select your optimizer and run the optimization with your custom parameters</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                  3
                </div>
                <div>
                  <p className="font-medium">Ensure your optimizer returns the required metrics</p>
                  <p className="text-sm text-muted-foreground">Your optimizer must return best_value and runtime_seconds for leaderboard submission</p>
                </div>
              </div>
            </div>
          </div>
        </div>





        {/* Main Content */}
        {selectedProblem ? (
          <div>
            <div className="mb-6">
              <Button
                variant="outline"
                onClick={handleBackToProblems}
                className="mb-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Problems
              </Button>
            </div>
            <RankingTable
              problem={selectedProblem}
              onBack={handleBackToProblems}
            />
          </div>
        ) : (
          <div>


            {/* Problems Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProblems.map((problem) => {
                const cardColors = getCardColors(problem.id)
                return (
                <Card
                  key={problem.id}
                  className={`hover:shadow-lg transition-all duration-300 group bg-gradient-to-br ${cardColors.light} backdrop-blur-sm`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <div className={cardColors.accent}>
                        {getProblemTypeIcon(problem.problem_type)}
                      </div>
                      <CardTitle className={`text-lg ${cardColors.accent}`}>{problem.name}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Action Buttons */}
                    <div className="space-y-2">
                      <Button
                        onClick={() => handleProblemSelect(problem)}
                        className="w-full"
                        variant="outline"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Rankings
                      </Button>

                      <div className="grid grid-cols-3 gap-2">
                        {problem.problem_config?.repository_path && (
                          <Button
                            onClick={() => handleViewRepository(problem)}
                            variant="outline"
                            size="sm"
                            className="text-xs"
                          >
                            <ExternalLink className="h-3 w-3 mr-1" />
                            View Repo
                          </Button>
                        )}

                        {problem.problem_config?.repository_path && (
                          <Button
                            onClick={() => handleUseLocally(problem)}
                            variant="outline"
                            size="sm"
                            className="text-xs"
                          >
                            Use locally
                          </Button>
                        )}

                        {problem.problem_config?.repository_path && (
                          <Button
                            onClick={() => handleOpenInPlayground(problem)}
                            variant="outline"
                            size="sm"
                            className="text-xs"
                          >
                            Open in playground
                          </Button>
                        )}
                      </div>

                      {/* Admin Delete Button */}
                      {isAdmin && (
                        <Button
                          onClick={() => handleDeleteProblem(problem)}
                          variant="destructive"
                          size="sm"
                          className="w-full text-xs"
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Delete Problem
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
                )
              })}
            </div>

            {filteredProblems.length === 0 && (
              <div className="text-center py-12">
                <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No problems found</h3>
                <p className="text-muted-foreground">
                  No optimization problems are available yet.
                </p>
              </div>
            )}
          </div>
        )}



        {/* Admin Problem Creation Dialog */}
        {isAdmin && (
          <AdminProblemCreationDialog
            open={showAdminDialog}
            onOpenChange={setShowAdminDialog}
            onProblemCreated={() => {
              loadData() // Refresh the problems list
            }}
          />
        )}

        {/* Use Locally Dialog */}
        <Dialog open={showUseLocallyDialog} onOpenChange={setShowUseLocallyDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Use Problem Locally</DialogTitle>
              <DialogDescription>
                Copy this code snippet to load the problem in your local environment.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-lg">
                <code className="text-sm font-mono">
                  from qubots.auto_problem import AutoProblem<br />
                  problem = AutoProblem.from_repo("{selectedProblemForCode?.problem_config?.repository_path}")
                </code>
              </div>
              <Button
                onClick={copyCodeToClipboard}
                className="w-full"
                variant="outline"
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy to Clipboard
              </Button>
            </div>
          </DialogContent>
        </Dialog>

      </div>
    </Layout>
  )
}

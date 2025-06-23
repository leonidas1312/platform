import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  ArrowLeft,
  Trophy,
  Medal,
  Award,
  RefreshCw,
  ExternalLink,
  ArrowUp,
  ArrowDown,
  Play,
  Eye,
  Trash2
} from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useAuth } from "@/hooks/use-auth"

const API = import.meta.env.VITE_API_BASE

interface StandardizedProblem {
  id: number
  name: string
  problem_type: string
  difficulty_level: string
  description: string
}

interface LeaderboardEntry {
  id: number
  rank_overall: number
  rank_by_value: number
  rank_by_time: number
  rank_by_efficiency: number
  percentile_score: number
  relative_performance: number
  solver_name: string
  solver_username: string
  solver_repository: string
  solver_config?: string | object
  best_value: number
  runtime_seconds: number
  normalized_score: number
  submitted_at: string
  is_validated: boolean
  algorithm_family: string
  tags: string[]
}

interface RankingTableProps {
  problem: StandardizedProblem
  onBack: () => void
}

export function RankingTable({ problem, onBack }: RankingTableProps) {
  const [rankings, setRankings] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState("best_value")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")
  const [selectedEntry, setSelectedEntry] = useState<LeaderboardEntry | null>(null)
  const [showParametersDialog, setShowParametersDialog] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    loadRankings()
  }, [problem.id, sortBy, sortOrder])

  const loadRankings = async () => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        sort_by: sortBy,
        sort_order: sortOrder,
        limit: "100"
      })

      const response = await fetch(`${API}/api/leaderboard/problems/${problem.id}/leaderboard?${params}`)

      if (!response.ok) {
        throw new Error("Failed to load rankings")
      }

      const data = await response.json()
      setRankings(data.leaderboard)
    } catch (err) {
      console.error("Error loading rankings:", err)
      setError("Failed to load rankings")
      toast({
        title: "Error",
        description: "Failed to load rankings",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }



  const getRankIcon = (rank: number) => {
    return <span className="text-sm font-bold">{rank}</span>
  }



  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const formatRuntime = (seconds: number) => {
    if (seconds < 1) return `${(seconds * 1000).toFixed(0)}ms`
    if (seconds < 60) return `${seconds.toFixed(2)}s`
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}m ${remainingSeconds.toFixed(0)}s`
  }

  const handleOpenInPlayground = (entry: LeaderboardEntry) => {
    // Extract problem config from the problem
    const problemConfig = problem.problem_config || {}

    // Parse solver config from the entry
    let solverConfig = {}
    try {
      solverConfig = typeof entry.solver_config === 'string'
        ? JSON.parse(entry.solver_config)
        : entry.solver_config || {}
    } catch (e) {
      console.error('Error parsing solver config:', e)
    }

    // Extract problem and optimizer names from repository paths
    const problemPath = problemConfig.repository_path || `${problemConfig.owner}/${problemConfig.repo_name}`
    const [problemUsername, problemName] = problemPath.split('/')
    const [optimizerUsername, optimizerName] = entry.solver_repository.split('/')

    // Build playground URL with correct parameter names
    const params = new URLSearchParams({
      problem_name: problemName,
      problem_username: problemUsername,
      optimizer_name: optimizerName,
      optimizer_username: optimizerUsername,
      problem_params: JSON.stringify(problemConfig.parameters || {}),
      optimizer_params: JSON.stringify(solverConfig),
      locked: 'true', // This will make parameters non-editable
      leaderboard_problem_id: problem.id.toString() // Required for locked mode
    })

    const playgroundUrl = `/qubots-playground?${params.toString()}`
    window.open(playgroundUrl, '_blank')
  }

  const handleViewParameters = (entry: LeaderboardEntry) => {
    setSelectedEntry(entry)
    setShowParametersDialog(true)
  }

  const handleRemoveSubmission = async (entry: LeaderboardEntry) => {
    if (!confirm('Are you sure you want to remove your submission? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`${API}/api/leaderboard/submissions/${entry.id}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('Failed to remove submission')
      }

      toast({
        title: "Success",
        description: "Your submission has been removed from the leaderboard"
      })

      // Reload rankings
      loadRankings()
    } catch (error) {
      console.error('Error removing submission:', error)
      toast({
        title: "Error",
        description: "Failed to remove submission",
        variant: "destructive"
      })
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Overview
          </Button>
        </div>
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading rankings...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{problem.name}</h2>
          <p className="text-muted-foreground">{problem.description}</p>
        </div>

      </div>

      {/* Controls */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Sort by</label>
                <Select value={sortBy} onValueChange={setSortBy} disabled={loading}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="best_value">Best Value</SelectItem>
                    <SelectItem value="runtime_seconds">Runtime</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Order</label>
                <Select value={sortOrder} onValueChange={(value: "asc" | "desc") => setSortOrder(value)} disabled={loading}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asc">
                      <div className="flex items-center gap-2">
                        <ArrowUp className="h-3 w-3" />
                        Ascending
                      </div>
                    </SelectItem>
                    <SelectItem value="desc">
                      <div className="flex items-center gap-2">
                        <ArrowDown className="h-3 w-3" />
                        Descending
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={loadRankings} disabled={loading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <div className="text-sm text-muted-foreground">
                {rankings.length} submissions
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rankings Table */}
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Rankings</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">
                    Rank
                  </TableHead>
                  <TableHead>
                    Optimizer
                  </TableHead>
                  <TableHead className="text-right">
                    Best Value
                  </TableHead>
                  <TableHead className="text-right">
                    Runtime in Playground
                  </TableHead>
                  <TableHead className="text-right">
                    Submitted
                  </TableHead>
                  <TableHead className="text-center">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  // Loading skeleton rows
                  Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={`loading-${index}`}>
                      <TableCell>
                        <div className="h-4 bg-muted animate-pulse rounded"></div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="h-4 bg-muted animate-pulse rounded w-32"></div>
                          <div className="h-3 bg-muted animate-pulse rounded w-24"></div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="h-4 bg-muted animate-pulse rounded w-20 ml-auto"></div>
                      </TableCell>
                      <TableCell>
                        <div className="h-4 bg-muted animate-pulse rounded w-16 ml-auto"></div>
                      </TableCell>
                      <TableCell>
                        <div className="h-4 bg-muted animate-pulse rounded w-20 ml-auto"></div>
                      </TableCell>
                      <TableCell>
                        <div className="h-8 bg-muted animate-pulse rounded w-24 mx-auto"></div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  rankings.map((entry, index) => (
                    <TableRow key={entry.id} className="hover:bg-muted/50">
                      <TableCell>
                        <div className="flex items-center justify-center">
                          {getRankIcon(index + 1)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <a
                            href={`https://hub.rastion.com/${entry.solver_repository}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-blue-600 hover:underline flex items-center gap-1"
                          >
                            {entry.solver_repository}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                          <p className="text-sm text-muted-foreground mt-1">
                            by {entry.solver_username}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {typeof entry.best_value === 'number'
                          ? entry.best_value.toFixed(4)
                          : entry.best_value || 'N/A'}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatRuntime(entry.runtime_seconds)}
                      </TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">
                        {formatDate(entry.submitted_at)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenInPlayground(entry)}
                            className="h-8 px-2"
                          >
                            <Play className="h-3 w-3 mr-1" />
                            Open
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewParameters(entry)}
                            className="h-8 px-2"
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </Button>
                          {user && entry.solver_username === user.login && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRemoveSubmission(entry)}
                              className="h-8 px-2 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

            {!loading && rankings.length === 0 && (
              <div className="text-center py-12">
                <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">No submissions yet</h3>
                <p className="text-muted-foreground">
                  Be the first to submit a solution to this problem!
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Parameters Dialog */}
      <Dialog open={showParametersDialog} onOpenChange={setShowParametersDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Optimizer Parameters</DialogTitle>
          </DialogHeader>
          {selectedEntry && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Optimizer:</span>
                  <p className="font-medium">{selectedEntry.solver_repository}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Submitted by:</span>
                  <p className="font-medium">{selectedEntry.solver_username}</p>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Configuration Parameters</h4>
                <div className="bg-muted/30 rounded-md p-4">
                  <pre className="text-sm overflow-auto">
                    {(() => {
                      try {
                        const config = typeof selectedEntry.solver_config === 'string'
                          ? JSON.parse(selectedEntry.solver_config)
                          : selectedEntry.solver_config || {}
                        return JSON.stringify(config, null, 2)
                      } catch (e) {
                        return 'No parameters available'
                      }
                    })()}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

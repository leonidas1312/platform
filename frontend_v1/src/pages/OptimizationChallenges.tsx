import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import Layout from "@/components/Layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Target,
  RefreshCw,
  Plus,
  Code,
  Copy,
  ExternalLink,
  Database,
  TrendingUp,
  Zap,
  Trophy,
  AlertCircle
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "@/components/ui/use-toast"
import { CreateChallengeDialog } from "@/components/challenges/CreateChallengeDialog"
import { UseLocallyDialog } from  "@/components/challenges/UseLocallyDialog"

const API = import.meta.env.VITE_API_BASE

interface Challenge {
  id: number
  name: string
  problem_type: string
  difficulty_level: string
  description: string
  submission_count?: number
  best_value?: number
  dataset_info?: {
    name: string
    description: string
    size?: string
  }
  problem_config?: {
    repository?: string
    owner?: string
    repo_name?: string
  }
  tags?: string[]
  created_at?: string
  created_by?: string
}

export default function OptimizationChallenges() {
  const navigate = useNavigate()
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showUseLocallyDialog, setShowUseLocallyDialog] = useState(false)
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null)

  useEffect(() => {
    fetchChallenges()
  }, [])

  const fetchChallenges = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`${API}/challenges?include_stats=true`, {
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('Failed to fetch challenges')
      }

      const data = await response.json()
      setChallenges(data.problems || [])
    } catch (err) {
      console.error('Error fetching challenges:', err)
      setError('Failed to load optimization challenges. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const getProblemTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'tsp': return <Target className="h-4 w-4" />
      case 'vrp': return <Zap className="h-4 w-4" />
      case 'maxcut': return <TrendingUp className="h-4 w-4" />
      case 'knapsack': return <Database className="h-4 w-4" />
      default: return <Trophy className="h-4 w-4" />
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy': return 'bg-green-100 text-green-800 border-green-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'hard': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const handleUseLocally = (challenge: Challenge) => {
    setSelectedChallenge(challenge)
    setShowUseLocallyDialog(true)
  }

  const handleCreateChallenge = async (challengeData: any) => {
    try {
      const response = await fetch(`${API}/challenges`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(challengeData)
      })

      if (!response.ok) {
        throw new Error('Failed to create challenge')
      }

      toast({
        title: "Challenge created!",
        description: "Your optimization challenge has been created successfully."
      })

      // Refresh challenges list
      fetchChallenges()
      setShowCreateDialog(false)
    } catch (error) {
      console.error('Error creating challenge:', error)
      toast({
        title: "Error",
        description: "Failed to create challenge. Please try again.",
        variant: "destructive"
      })
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 animate-spin" />
              <span>Loading optimization challenges...</span>
            </div>
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
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <div className="mt-4">
            <Button onClick={fetchChallenges} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Optimization Challenges</h1>
            <p className="text-muted-foreground mt-2">
              Discover and create optimization challenges for the community
            </p>
          </div>
          <Button onClick={() => setShowCreateDialog(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Create Challenge
          </Button>
        </div>

        {/* Challenges Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {challenges.map((challenge) => (
            <Card key={challenge.id} className="hover:shadow-lg transition-all duration-300">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 rounded-lg bg-primary/10">
                    {getProblemTypeIcon(challenge.problem_type)}
                  </div>
                  <CardTitle className="text-lg">{challenge.name}</CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={getDifficultyColor(challenge.difficulty_level)}>
                    {challenge.difficulty_level}
                  </Badge>
                  <Badge variant="secondary">{challenge.problem_type}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {challenge.description}
                </p>
                
                {/* Challenge Details */}
                <div className="space-y-2 text-sm">
                  {challenge.problem_config?.repository && (
                    <div className="flex items-center gap-2">
                      <Code className="h-3 w-3" />
                      <span className="text-muted-foreground">Problem:</span>
                      <span className="font-mono text-xs">{challenge.problem_config.repository}</span>
                    </div>
                  )}
                  {challenge.dataset_info?.name && (
                    <div className="flex items-center gap-2">
                      <Database className="h-3 w-3" />
                      <span className="text-muted-foreground">Dataset:</span>
                      <span className="text-xs">{challenge.dataset_info.name}</span>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => handleUseLocally(challenge)}
                  >
                    <Code className="h-3 w-3 mr-1" />
                    Use Locally
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => navigate(`/leaderboard?problem=${challenge.id}`)}
                  >
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {challenges.length === 0 && (
          <div className="text-center py-12">
            <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No challenges yet</h3>
            <p className="text-muted-foreground mb-4">
              Be the first to create an optimization challenge for the community!
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create First Challenge
            </Button>
          </div>
        )}

        {/* Dialogs */}
        <CreateChallengeDialog
          isOpen={showCreateDialog}
          onClose={() => setShowCreateDialog(false)}
          onSubmit={handleCreateChallenge}
        />

        <UseLocallyDialog
          isOpen={showUseLocallyDialog}
          onClose={() => setShowUseLocallyDialog(false)}
          challenge={selectedChallenge}
        />
      </div>
    </Layout>
  )
}

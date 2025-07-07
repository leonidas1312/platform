import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import Layout from '@/components/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { toast } from '@/components/ui/use-toast'
import {
  Search,
  Globe,
  Trash2,
  Loader2,
  Brain,
  Zap,
  Database,
  Calendar,
  User,
  ArrowRight
} from 'lucide-react'

interface PublicExperiment {
  id: number
  name: string
  description: string
  problem_name: string
  problem_username: string
  optimizer_name: string
  optimizer_username: string
  problem_params: Record<string, any>
  optimizer_params: Record<string, any>
  dataset_id: string | null
  dataset_parameter: string | null // Which parameter should receive the dataset content
  dataset_info?: {
    name: string
    filename: string
    format_type: string
  }
  tags: string[]
  user_id: string
  username: string
  full_name: string | null
  avatar_url: string | null
  created_at: string
}

const PublicExperimentsPage: React.FC = () => {
  const [experiments, setExperiments] = useState<PublicExperiment[]>([])
  const [filteredExperiments, setFilteredExperiments] = useState<PublicExperiment[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<string | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    fetchExperiments()
    fetchCurrentUser()
  }, [])

  useEffect(() => {
    // Filter experiments based on search term
    const filtered = experiments.filter(exp =>
      exp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exp.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exp.problem_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exp.optimizer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exp.username.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredExperiments(filtered)
  }, [experiments, searchTerm])

  const fetchCurrentUser = async () => {
    try {
      const response = await fetch('/api/user/profile', {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        setCurrentUser(data.username)
      }
    } catch (error) {
      console.error('Error fetching current user:', error)
    }
  }

  const fetchExperiments = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/public-experiments', {
        credentials: 'include'
      })
      const data = await response.json()

      if (data.success) {
        // Ensure tags are always arrays
        const processedExperiments = data.experiments.map(exp => ({
          ...exp,
          tags: Array.isArray(exp.tags) ? exp.tags :
                typeof exp.tags === 'string' ? JSON.parse(exp.tags || '[]') : []
        }))
        setExperiments(processedExperiments)
      } else {
        throw new Error(data.message || 'Failed to fetch experiments')
      }
    } catch (error) {
      console.error('Error fetching experiments:', error)
      toast({
        title: "Error",
        description: "Failed to load public decision models.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteExperiment = async (experimentId: number) => {
    if (!confirm('Are you sure you want to delete this experiment?')) {
      return
    }

    try {
      const response = await fetch(`/api/public-experiments/${experimentId}`, {
        method: 'DELETE',
        credentials: 'include'
      })
      const data = await response.json()

      if (data.success) {
        setExperiments(prev => prev.filter(exp => exp.id !== experimentId))
        toast({
          title: "Success",
          description: "Experiment deleted successfully."
        })
      } else {
        throw new Error(data.message || 'Failed to delete experiment')
      }
    } catch (error) {
      console.error('Error deleting experiment:', error)
      toast({
        title: "Error",
        description: "Failed to delete experiment.",
        variant: "destructive"
      })
    }
  }

  const handleOpenAsWorkflow = (experiment: PublicExperiment) => {
    // Navigate to workflow automation page with experiment parameters
    const params = new URLSearchParams({
      workflow_id: `experiment-${experiment.id}`,
      problem_name: experiment.problem_name,
      problem_username: experiment.problem_username,
      optimizer_name: experiment.optimizer_name,
      optimizer_username: experiment.optimizer_username,
      problem_params: JSON.stringify(experiment.problem_params),
      optimizer_params: JSON.stringify(experiment.optimizer_params)
    })

    // Add dataset ID if present
    if (experiment.dataset_id) {
      params.set('dataset_id', experiment.dataset_id)
    }

    // Add dataset parameter if present
    if (experiment.dataset_parameter) {
      params.set('dataset_parameter', experiment.dataset_parameter)
    }

    navigate(`/workflow-automation?${params.toString()}`)
  }

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="flex items-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="text-lg">Loading public decision models...</span>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto px-4 sm:px-6 py-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                  Public Decision Models
                </h1>
                <p className="text-muted-foreground mt-1">
                  Discover and explore decision models shared by the community
                </p>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search decision models..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 w-64"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="container mx-auto px-4 sm:px-6 py-8">
          {filteredExperiments.length === 0 ? (
            <div className="text-center py-12">
              <Globe className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No decision models found</h3>
              <p className="text-muted-foreground">
                {searchTerm ? 'Try adjusting your search terms.' : 'No public decision models have been shared yet.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredExperiments.map((experiment, index) => (
                <motion.div
                  key={experiment.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <ExperimentCard
                    experiment={experiment}
                    currentUser={currentUser}
                    onDelete={handleDeleteExperiment}
                    onOpenAsWorkflow={handleOpenAsWorkflow}
                  />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}

interface ExperimentCardProps {
  experiment: PublicExperiment
  currentUser: string | null
  onDelete: (id: number) => void
  onOpenAsWorkflow: (experiment: PublicExperiment) => void
}

const ExperimentCard: React.FC<ExperimentCardProps> = ({
  experiment,
  currentUser,
  onDelete,
  onOpenAsWorkflow
}) => {
  const isOwner = currentUser === experiment.user_id

  return (
    <Card className="h-full hover:shadow-lg transition-all duration-300 border-border/60">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg line-clamp-2 mb-2">
              {experiment.name}
            </CardTitle>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {experiment.description}
            </p>
          </div>
          {isOwner && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(experiment.id)}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Problem and Optimizer */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Brain className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium">
              <span
                className="text-blue-600 hover:text-blue-800 cursor-pointer hover:underline"
                onClick={(e) => {
                  e.stopPropagation()
                  window.open(`https://rastion.com/u/${experiment.problem_username}`, '_blank')
                }}
              >
                {experiment.problem_username}
              </span>
              /
              <span
                className="text-blue-600 hover:text-blue-800 cursor-pointer hover:underline"
                onClick={(e) => {
                  e.stopPropagation()
                  window.open(`https://rastion.com/${experiment.problem_username}/${experiment.problem_name}`, '_blank')
                }}
              >
                {experiment.problem_name}
              </span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-orange-600" />
            <span className="text-sm font-medium">
              <span
                className="text-blue-600 hover:text-blue-800 cursor-pointer hover:underline"
                onClick={(e) => {
                  e.stopPropagation()
                  window.open(`https://rastion.com/u/${experiment.optimizer_username}`, '_blank')
                }}
              >
                {experiment.optimizer_username}
              </span>
              /
              <span
                className="text-blue-600 hover:text-blue-800 cursor-pointer hover:underline"
                onClick={(e) => {
                  e.stopPropagation()
                  window.open(`https://rastion.com/${experiment.optimizer_username}/${experiment.optimizer_name}`, '_blank')
                }}
              >
                {experiment.optimizer_name}
              </span>
            </span>
          </div>
          {experiment.dataset_id && (
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-blue-600" />
              <span className="text-sm text-muted-foreground">
                Dataset: {experiment.dataset_info ? (
                  <>
                    {experiment.dataset_info.name}
                    <span className="ml-1 px-1.5 py-0.5 text-xs bg-muted rounded">
                      {experiment.dataset_info.format_type.toUpperCase()}
                    </span>
                  </>
                ) : (
                  experiment.dataset_id
                )}
              </span>
            </div>
          )}
        </div>

        {/* Tags */}
        {Array.isArray(experiment.tags) && experiment.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {experiment.tags.slice(0, 3).map((tag, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
            {experiment.tags.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{experiment.tags.length - 3}
              </Badge>
            )}
          </div>
        )}

        {/* Author and Date */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div
            className="flex items-center gap-2 cursor-pointer hover:text-foreground transition-colors"
            onClick={(e) => {
              e.stopPropagation()
              window.open(`https://rastion.com/u/${experiment.username}`, '_blank')
            }}
          >
            <Avatar className="h-5 w-5">
              <AvatarImage src={experiment.avatar_url || undefined} />
              <AvatarFallback>
                {experiment.full_name?.charAt(0) || experiment.username.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <span>{experiment.username}</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>{new Date(experiment.created_at).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Action Button */}
        <Button
          onClick={() => onOpenAsWorkflow(experiment)}
          className="w-full"
          size="sm"
        >
          Open as Workflow
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </CardContent>
    </Card>
  )
}

export default PublicExperimentsPage

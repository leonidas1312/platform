import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2, Target, Database, Code, RefreshCw } from 'lucide-react'
import { toast } from '@/components/ui/use-toast'

const API = import.meta.env.VITE_API_BASE

interface CreateChallengeDialogProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: any) => Promise<void>
}

interface Dataset {
  id: string
  name: string
  filename: string
  description?: string
  size?: string
  file_size?: string
}

interface Problem {
  id: string
  name: string
  owner: string
  repository: string
  problem_type?: string
  description?: string
}

export const CreateChallengeDialog: React.FC<CreateChallengeDialogProps> = ({
  isOpen,
  onClose,
  onSubmit
}) => {
  const [challengeName, setChallengeName] = useState('')
  const [description, setDescription] = useState('')
  const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null)
  const [selectedProblem, setSelectedProblem] = useState<Problem | null>(null)
  const [datasets, setDatasets] = useState<Dataset[]>([])
  const [problems, setProblems] = useState<Problem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingData, setIsLoadingData] = useState(false)

  useEffect(() => {
    if (isOpen) {
      fetchUserData()
    }
  }, [isOpen])

  const fetchUserData = async () => {
    setIsLoadingData(true)
    try {
      // Fetch user's datasets and problems in parallel
      const [datasetsResponse, problemsResponse] = await Promise.all([
        fetch(`${API}/datasets`, { credentials: 'include' }),
        fetch(`${API}/repos?type=problem`, { credentials: 'include' })
      ])

      if (datasetsResponse.ok) {
        const datasetsData = await datasetsResponse.json()
        setDatasets(datasetsData)
      }

      if (problemsResponse.ok) {
        const problemsData = await problemsResponse.json()
        setProblems(problemsData)
      }
    } catch (error) {
      console.error('Error fetching user data:', error)
      toast({
        title: "Error",
        description: "Failed to load your datasets and problems.",
        variant: "destructive"
      })
    } finally {
      setIsLoadingData(false)
    }
  }

  const handleSubmit = async () => {
    if (!challengeName.trim() || !selectedDataset || !selectedProblem) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      })
      return
    }

    setIsLoading(true)
    try {
      const challengeData = {
        challengeName: challengeName.trim(),
        description: description.trim(),
        problemType: selectedProblem.problem_type || 'optimization',
        difficultyLevel: 'medium',
        tags: ['optimization-challenge'],
        datasetInfo: {
          name: selectedDataset.name || selectedDataset.filename,
          description: selectedDataset.description || '',
          size: selectedDataset.size || selectedDataset.file_size
        },
        problemConfig: {
          repository: selectedProblem.repository || `${selectedProblem.owner}/${selectedProblem.name}`,
          parameters: {}
        }
      }

      await onSubmit(challengeData)
      
      // Reset form
      setChallengeName('')
      setDescription('')
      setSelectedDataset(null)
      setSelectedProblem(null)
    } catch (error) {
      console.error('Error creating challenge:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    if (!isLoading) {
      setChallengeName('')
      setDescription('')
      setSelectedDataset(null)
      setSelectedProblem(null)
      onClose()
    }
  }

  const isFormValid = challengeName.trim() && selectedDataset && selectedProblem

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Create Optimization Challenge
          </DialogTitle>
          <DialogDescription>
            Create a new optimization challenge by combining one of your datasets with one of your problem repositories.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Challenge Name */}
          <div>
            <Label htmlFor="challengeName">Challenge Name *</Label>
            <Input
              id="challengeName"
              value={challengeName}
              onChange={(e) => setChallengeName(e.target.value)}
              placeholder="Enter a descriptive name for your challenge"
              className="mt-1"
            />
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the optimization challenge and what participants should achieve"
              className="mt-1"
              rows={3}
            />
          </div>

          {isLoadingData ? (
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Loading your datasets and problems...</span>
              </div>
            </div>
          ) : (
            <>
              {/* Dataset Selection */}
              <div>
                <Label className="flex items-center gap-2 mb-3">
                  <Database className="h-4 w-4" />
                  Select Dataset *
                </Label>
                <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto">
                  {datasets.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">
                      No datasets found. Upload a dataset first.
                    </p>
                  ) : (
                    datasets.map((dataset, index) => (
                      <Card 
                        key={index}
                        className={`cursor-pointer transition-all ${
                          selectedDataset === dataset 
                            ? 'ring-2 ring-primary bg-primary/5' 
                            : 'hover:bg-muted/50'
                        }`}
                        onClick={() => setSelectedDataset(dataset)}
                      >
                        <CardContent className="p-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium text-sm">{dataset.name || dataset.filename}</p>
                              <p className="text-xs text-muted-foreground">{dataset.description || 'No description'}</p>
                            </div>
                            {(dataset.size || dataset.file_size) && (
                              <span className="text-xs text-muted-foreground">
                                {dataset.size || dataset.file_size}
                              </span>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </div>

              {/* Problem Selection */}
              <div>
                <Label className="flex items-center gap-2 mb-3">
                  <Code className="h-4 w-4" />
                  Select Problem Repository *
                </Label>
                <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto">
                  {problems.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">
                      No problem repositories found. Create a problem repository first.
                    </p>
                  ) : (
                    problems.map((problem, index) => (
                      <Card 
                        key={index}
                        className={`cursor-pointer transition-all ${
                          selectedProblem === problem 
                            ? 'ring-2 ring-primary bg-primary/5' 
                            : 'hover:bg-muted/50'
                        }`}
                        onClick={() => setSelectedProblem(problem)}
                      >
                        <CardContent className="p-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium text-sm">{problem.name}</p>
                              <p className="text-xs text-muted-foreground font-mono">
                                {problem.owner}/{problem.name}
                              </p>
                              {problem.description && (
                                <p className="text-xs text-muted-foreground mt-1">{problem.description}</p>
                              )}
                            </div>
                            {problem.problem_type && (
                              <span className="text-xs bg-secondary px-2 py-1 rounded">
                                {problem.problem_type}
                              </span>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!isFormValid || isLoading || isLoadingData}
          >
            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Create Challenge
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

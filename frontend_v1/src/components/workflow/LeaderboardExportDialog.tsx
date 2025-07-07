import React, { useState } from 'react'
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
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { X, Plus, Trophy, Loader2, Target, Database } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface LeaderboardExportDialogProps {
  isOpen: boolean
  onClose: () => void
  onExport: (data: LeaderboardExportData) => Promise<void>
  isLoading?: boolean
  datasets?: any[]
  problems?: any[]
}

export interface LeaderboardExportData {
  challengeName: string
  description: string
  problemType: string
  difficultyLevel: string
  tags: string[]
  datasetInfo: {
    name: string
    description: string
    size?: string
  }
  problemConfig: {
    repository?: string
    parameters?: Record<string, any>
  }
}

const LeaderboardExportDialog: React.FC<LeaderboardExportDialogProps> = ({
  isOpen,
  onClose,
  onExport,
  isLoading = false,
  datasets = [],
  problems = []
}) => {
  const [challengeName, setChallengeName] = useState('')
  const [description, setDescription] = useState('')
  const [problemType, setProblemType] = useState('')
  const [difficultyLevel, setDifficultyLevel] = useState('')
  const [tags, setTags] = useState<string[]>(['optimization-challenge'])
  const [newTag, setNewTag] = useState('')
  const [selectedDataset, setSelectedDataset] = useState<any>(null)
  const [selectedProblem, setSelectedProblem] = useState<any>(null)

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()])
      setNewTag('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove))
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addTag()
    }
  }

  const handleSubmit = async () => {
    if (!challengeName.trim() || !selectedDataset || !selectedProblem) {
      return
    }

    try {
      await onExport({
        challengeName: challengeName.trim(),
        description: description.trim(),
        problemType: problemType || selectedProblem.problem_type || 'optimization',
        difficultyLevel: difficultyLevel || 'medium',
        tags,
        datasetInfo: {
          name: selectedDataset.name || selectedDataset.filename,
          description: selectedDataset.description || '',
          size: selectedDataset.size || selectedDataset.file_size
        },
        problemConfig: {
          repository: selectedProblem.repository || `${selectedProblem.owner}/${selectedProblem.name}`,
          parameters: selectedProblem.parameters || {}
        }
      })
      
      // Reset form
      setChallengeName('')
      setDescription('')
      setProblemType('')
      setDifficultyLevel('')
      setTags(['optimization-challenge'])
      setNewTag('')
      setSelectedDataset(null)
      setSelectedProblem(null)
      onClose()
    } catch (error) {
      console.error('Leaderboard export failed:', error)
    }
  }

  const handleClose = () => {
    if (!isLoading) {
      setChallengeName('')
      setDescription('')
      setProblemType('')
      setDifficultyLevel('')
      setTags(['optimization-challenge'])
      setNewTag('')
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
            <Trophy className="h-5 w-5 text-primary" />
            Export to Leaderboard
          </DialogTitle>
          <DialogDescription>
            Create a public optimization challenge from your dataset and problem. Other users will be able to submit their optimizers to compete on your challenge.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Challenge Details */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="challengeName">Challenge Name *</Label>
              <Input
                id="challengeName"
                value={challengeName}
                onChange={(e) => setChallengeName(e.target.value)}
                placeholder="e.g., Vehicle Routing Challenge 2024"
                disabled={isLoading}
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your optimization challenge, objectives, and any special constraints..."
                rows={3}
                disabled={isLoading}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="problemType">Problem Type</Label>
                <Select value={problemType} onValueChange={setProblemType} disabled={isLoading}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tsp">Traveling Salesman</SelectItem>
                    <SelectItem value="vrp">Vehicle Routing</SelectItem>
                    <SelectItem value="maxcut">Max Cut</SelectItem>
                    <SelectItem value="knapsack">Knapsack</SelectItem>
                    <SelectItem value="scheduling">Scheduling</SelectItem>
                    <SelectItem value="portfolio">Portfolio Optimization</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="difficulty">Difficulty Level</Label>
                <Select value={difficultyLevel} onValueChange={setDifficultyLevel} disabled={isLoading}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="hard">Hard</SelectItem>
                    <SelectItem value="expert">Expert</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Dataset Selection */}
          <div>
            <Label className="flex items-center gap-2 mb-3">
              <Database className="h-4 w-4" />
              Select Dataset *
            </Label>
            <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto">
              {datasets.map((dataset, index) => (
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
                      <Badge variant="outline" className="text-xs">
                        {dataset.size || dataset.file_size || 'Unknown size'}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Problem Selection */}
          <div>
            <Label className="flex items-center gap-2 mb-3">
              <Target className="h-4 w-4" />
              Select Problem *
            </Label>
            <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto">
              {problems.map((problem, index) => (
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
                        <p className="text-xs text-muted-foreground">{problem.description}</p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {problem.problem_type || 'optimization'}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div>
            <Label htmlFor="tags">Tags</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                  {tag}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => removeTag(tag)}
                  />
                </Badge>
              ))}
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                id="tags"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Add a tag..."
                disabled={isLoading}
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addTag}
                disabled={!newTag.trim() || isLoading}
                className="sm:w-auto w-full"
              >
                <Plus className="h-4 w-4 sm:mr-0 mr-2" />
                <span className="sm:hidden">Add Tag</span>
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!isFormValid || isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Publishing Challenge...
              </>
            ) : (
              <>
                <Trophy className="h-4 w-4 mr-2" />
                Publish Challenge
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default LeaderboardExportDialog

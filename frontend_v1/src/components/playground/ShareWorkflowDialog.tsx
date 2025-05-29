import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Share2,
  Globe,
  Lock,
  Loader2,
  Package,
  Settings,
  Tag,
  FileText,
  BarChart3
} from "lucide-react"
import { ModelInfo } from "@/types/playground"

interface ShareWorkflowDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onShare: (workflowData: {
    title: string
    description: string
    tags: string[]
    isPublic: boolean
  }) => Promise<void>
  isLoading: boolean
  selectedProblem: ModelInfo | null
  selectedOptimizer: ModelInfo | null
  problemParams?: Record<string, any>
  optimizerParams?: Record<string, any>
  executionResults?: any
}

export function ShareWorkflowDialog({
  open,
  onOpenChange,
  onShare,
  isLoading,
  selectedProblem,
  selectedOptimizer,
  problemParams = {},
  optimizerParams = {},
  executionResults
}: ShareWorkflowDialogProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [tagsInput, setTagsInput] = useState('')
  const [isPublic, setIsPublic] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim()) {
      return
    }

    const tags = tagsInput
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0)

    await onShare({
      title: title.trim(),
      description: description.trim(),
      tags,
      isPublic
    })
  }

  const handleClose = () => {
    if (!isLoading) {
      setTitle('')
      setDescription('')
      setTagsInput('')
      setIsPublic(false)
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Share Optimization Workflow
          </DialogTitle>
          <DialogDescription>
            Share your current optimization setup with the community or keep it private for your own use.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Workflow Title Section */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Share2 className="h-4 w-4" />
                Workflow Title
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., VRP Optimization with Genetic Algorithm"
                  required
                  disabled={isLoading}
                  className="text-base"
                />
                <p className="text-xs text-muted-foreground">
                  Give your workflow a descriptive and memorable title
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Repositories Used Section */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Package className="h-4 w-4" />
                Repositories Used
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-blue-600">Problem Repository</Label>
                  <div className="p-3 border rounded-lg bg-blue-50 dark:bg-blue-950/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Package className="h-4 w-4 text-blue-500" />
                      <span className="text-sm font-medium">
                        {selectedProblem ? `${selectedProblem.username}/${selectedProblem.name}` : 'None selected'}
                      </span>
                    </div>
                    {selectedProblem?.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {selectedProblem.description}
                      </p>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-green-600">Optimizer Repository</Label>
                  <div className="p-3 border rounded-lg bg-green-50 dark:bg-green-950/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Settings className="h-4 w-4 text-green-500" />
                      <span className="text-sm font-medium">
                        {selectedOptimizer ? `${selectedOptimizer.username}/${selectedOptimizer.name}` : 'None selected'}
                      </span>
                    </div>
                    {selectedOptimizer?.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {selectedOptimizer.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Visibility Settings */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="flex items-center gap-2">
                  {isPublic ? (
                    <Globe className="h-4 w-4 text-green-500" />
                  ) : (
                    <Lock className="h-4 w-4 text-gray-500" />
                  )}
                  {isPublic ? 'Public Workflow' : 'Private Workflow'}
                </Label>
                <p className="text-xs text-muted-foreground">
                  {isPublic
                    ? 'Anyone can discover and use this workflow'
                    : 'Only you can access this workflow'
                  }
                </p>
              </div>
              <Switch
                checked={isPublic}
                onCheckedChange={setIsPublic}
                disabled={isLoading}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !title.trim() || !selectedProblem || !selectedOptimizer}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sharing...
                </>
              ) : (
                <>
                  <Share2 className="h-4 w-4 mr-2" />
                  Share Workflow
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

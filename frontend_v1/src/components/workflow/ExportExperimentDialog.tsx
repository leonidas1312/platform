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
import { X, Plus, Globe, Loader2 } from 'lucide-react'

interface ExportExperimentDialogProps {
  isOpen: boolean
  onClose: () => void
  onExport: (data: ExportExperimentData) => Promise<void>
  isLoading?: boolean
}

export interface ExportExperimentData {
  name: string
  description: string
  tags: string[]
}

const ExportExperimentDialog: React.FC<ExportExperimentDialogProps> = ({
  isOpen,
  onClose,
  onExport,
  isLoading = false
}) => {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [newTag, setNewTag] = useState('')

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()])
      setNewTag('')
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove))
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddTag()
    }
  }

  const handleSubmit = async () => {
    if (!name.trim()) {
      return
    }

    try {
      await onExport({
        name: name.trim(),
        description: description.trim(),
        tags
      })
      
      // Reset form
      setName('')
      setDescription('')
      setTags([])
      setNewTag('')
      onClose()
    } catch (error) {
      // Error handling is done in the parent component
      console.error('Export failed:', error)
    }
  }

  const handleClose = () => {
    if (!isLoading) {
      setName('')
      setDescription('')
      setTags([])
      setNewTag('')
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            Export as Public Decision Model
          </DialogTitle>
          <DialogDescription>
            Share your decision model with the community. Your decision model will be visible to all users and they can open it as a workflow.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Decision Model Name */}
          <div className="space-y-2">
            <Label htmlFor="decision-model-name">
              Decision Model Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="decision-model-name"
              placeholder="Enter a descriptive name for your decision model"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isLoading}
              maxLength={100}
            />
            <p className="text-xs text-muted-foreground">
              {name.length}/100 characters
            </p>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="experiment-description">Description</Label>
            <Textarea
              id="experiment-description"
              placeholder="Describe what this decision model is for, what problem it solves, or any special configuration..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isLoading}
              rows={3}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground">
              {description.length}/500 characters
            </p>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label htmlFor="experiment-tags">Tags</Label>
            <div className="space-y-2">
              {/* Existing Tags */}
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
                      {tag}
                      {tag !== 'workflow-automation' && (
                        <button
                          onClick={() => handleRemoveTag(tag)}
                          disabled={isLoading}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Add New Tag */}
              <div className="flex gap-2">
                <Input
                  id="experiment-tags"
                  placeholder="Add a tag (e.g., optimization, tsp, genetic-algorithm)"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={isLoading}
                  maxLength={30}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddTag}
                  disabled={!newTag.trim() || tags.includes(newTag.trim()) || isLoading}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Tags help others discover your decision model.
              </p>
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
            disabled={!name.trim() || isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Publishing...
              </>
            ) : (
              <>
                <Globe className="h-4 w-4 mr-2" />
                Publish Decision Model
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default ExportExperimentDialog

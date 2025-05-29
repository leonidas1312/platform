import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
// import { Input } from '@/components/ui/input' // Removed - no longer needed
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  ChevronDown,
  ChevronUp,
  Package,
  Settings,
  // Search, // Removed - no longer needed
  RefreshCw,
  Loader2,
  User
} from 'lucide-react'
import { toast } from '@/components/ui/use-toast'

const API = import.meta.env.VITE_API_BASE

interface ModelInfo {
  name: string
  username: string
  description: string
  model_type: string
  repository_url: string
  last_updated: string
  tags: string[]
  metadata: {
    stars: number
    forks: number
    size: number
  }
}

interface CompactModelSelectorProps {
  modelType: "problem" | "optimizer"
  selectedModel: ModelInfo | null
  onModelSelect: (model: ModelInfo) => void
  onModelClear: () => void
  className?: string
  initiallyExpanded?: boolean
}

export const CompactModelSelector: React.FC<CompactModelSelectorProps> = ({
  modelType,
  selectedModel,
  onModelSelect,
  onModelClear,
  className = "",
  initiallyExpanded = false
}) => {
  const [isExpanded, setIsExpanded] = useState(initiallyExpanded)
  const [models, setModels] = useState<ModelInfo[]>([])
  const [loading, setLoading] = useState(false)
  // Removed searchQuery and activeTab since we only show user's models now

  useEffect(() => {
    if (isExpanded) {
      loadModels()
    }
  }, [modelType, isExpanded])

  const loadModels = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem("gitea_token")

      if (!token) {
        toast({
          title: "Authentication Required",
          description: `Please log in to view your ${modelType}s.`,
          variant: "destructive"
        })
        setLoading(false)
        return
      }

      const url = `${API}/playground/qubots/models`
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "Authorization": `token ${token}`
      }

      const response = await fetch(url, { headers })

      if (!response.ok) {
        throw new Error("Failed to fetch models")
      }

      const data = await response.json()
      setModels(data[`${modelType}s`] || [])

    } catch (error) {
      console.error("Error loading models:", error)
      toast({
        title: "Error",
        description: `Failed to load ${modelType}s. Please try again.`,
        variant: "destructive"
      })
      setModels([])
    } finally {
      setLoading(false)
    }
  }

  const handleModelClick = (model: ModelInfo) => {
    onModelSelect(model)
    setIsExpanded(false)
    toast({
      title: "Model Selected",
      description: `Selected ${model.name} by ${model.username}`
    })
  }

  // Removed handleSearch since we no longer have community search

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString()
    } catch {
      return "Unknown"
    }
  }

  const ModelCard: React.FC<{ model: ModelInfo }> = ({ model }) => (
    <div
      className={`p-2 border rounded cursor-pointer transition-all hover:bg-muted/50 ${
        selectedModel?.name === model.name && selectedModel?.username === model.username
          ? "ring-1 ring-primary bg-primary/5"
          : ""
      }`}
      onClick={() => handleModelClick(model)}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <h4
            className="font-medium text-sm truncate cursor-pointer hover:text-primary hover:underline transition-colors"
            onClick={(e) => {
              e.stopPropagation()
              window.open(`https://rastion.com/${model.username}/${model.name}`, "_blank")
            }}
          >
            {model.name}
          </h4>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <User className="h-3 w-3" />
            <span
              className="cursor-pointer hover:text-primary hover:underline transition-colors"
              onClick={(e) => {
                e.stopPropagation()
                window.open(`https://rastion.com/${model.username}/${model.name}`, "_blank")
              }}
            >
              {model.username}
            </span>
          </p>
        </div>
      </div>
      {model.description && (
        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
          {model.description}
        </p>
      )}
      <div className="flex items-center justify-between mt-2">
        <div className="flex gap-1">
          {model.tags.slice(0, 2).map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs px-1 py-0">
              {tag}
            </Badge>
          ))}
        </div>
        <span className="text-xs text-muted-foreground">
          {formatDate(model.last_updated)}
        </span>
      </div>
    </div>
  )

  return (
    <Card className={`${className}`}>
      <CardHeader className="pb-2">
        <div
          className="flex items-center justify-between cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <CardTitle className="flex items-center gap-2 text-sm">
            {modelType === "problem" ? <Package className="h-4 w-4" /> : <Settings className="h-4 w-4" />}
            {modelType === "problem" ? "Problem" : "Optimizer"}
          </CardTitle>
          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Selected Model Display */}
        {selectedModel && (
          <div className="p-2 bg-muted/50 rounded border">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p
                  className="font-medium text-sm truncate cursor-pointer hover:text-primary hover:underline transition-colors"
                  onClick={(e) => {
                    e.stopPropagation()
                    window.open(`https://rastion.com/${selectedModel.username}/${selectedModel.name}`, "_blank")
                  }}
                >
                  {selectedModel.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  by{" "}
                  <span
                    className="cursor-pointer hover:text-primary hover:underline transition-colors"
                    onClick={(e) => {
                      e.stopPropagation()
                      window.open(`https://rastion.com/${selectedModel.username}/${selectedModel.name}`, "_blank")
                    }}
                  >
                    {selectedModel.username}
                  </span>
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={onModelClear} className="h-6 text-xs">
                Clear
              </Button>
            </div>
          </div>
        )}

        {/* Expanded Model Selection */}
        {isExpanded && (
          <div className="space-y-3">
            {/* Header with Refresh */}
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">
                My {modelType === "problem" ? "Problems" : "Optimizers"}
              </h4>
              <Button
                variant="outline"
                size="sm"
                onClick={loadModels}
                disabled={loading}
                className="h-7 w-7 p-0"
              >
                {loading ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <RefreshCw className="h-3 w-3" />
                )}
              </Button>
            </div>

            {/* Models List */}
            <ScrollArea className="h-[200px]">
              <div className="space-y-2">
                {loading ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                ) : models.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground">
                    <Package className="h-6 w-6 mx-auto mb-2" />
                    <p className="text-xs">No {modelType}s found</p>
                    <p className="text-xs mt-1">Upload some {modelType}s to get started</p>
                  </div>
                ) : (
                  models.map((model) => (
                    <ModelCard key={`${model.username}/${model.name}`} model={model} />
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default CompactModelSelector

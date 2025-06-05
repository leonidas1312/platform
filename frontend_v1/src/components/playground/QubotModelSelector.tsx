import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Search,
  Package,
  User,
  Star,
  GitFork,
  Clock,
  Loader2,
  RefreshCw,
  ExternalLink
} from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { UserAvatar } from "@/components/ui/user-avatar"

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

interface QubotModelSelectorProps {
  modelType: "problem" | "optimizer"
  selectedModel: ModelInfo | null
  onModelSelect: (model: ModelInfo) => void
  onModelClear: () => void
  isWorkflowRestoration?: boolean // Add flag to indicate workflow restoration
}

const QubotModelSelector: React.FC<QubotModelSelectorProps> = ({
  modelType,
  selectedModel,
  onModelSelect,
  onModelClear,
  isWorkflowRestoration = false
}) => {
  const [models, setModels] = useState<ModelInfo[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("my-models")
  const [hasLoadedInitially, setHasLoadedInitially] = useState(false)

  useEffect(() => {
    // Only auto-load models if not in workflow restoration mode or if user explicitly changes tabs
    if (!isWorkflowRestoration || hasLoadedInitially) {
      loadModels()
    }
  }, [modelType, activeTab, isWorkflowRestoration, hasLoadedInitially])

  const loadModels = async () => {
    setLoading(true)
    try {
      let url = ""

      if (activeTab === "my-models") {
        url = `${API}/api/playground/qubots/models`
      } else {
        url = `${API}/api/playground/qubots/search?query=${encodeURIComponent(searchQuery || modelType)}&type=${modelType}`
      }

      const headers: Record<string, string> = {
        "Content-Type": "application/json"
      }

      const fetchOptions: RequestInit = {
        headers,
        credentials: 'include' // Include cookies for authentication
      }

      const response = await fetch(url, fetchOptions)

      if (!response.ok) {
        throw new Error("Failed to fetch models")
      }

      const data = await response.json()

      if (activeTab === "my-models") {
        setModels(data[`${modelType}s`] || [])
      } else {
        setModels(data || [])
      }
    } catch (error) {
      console.error("Error loading models:", error)
      toast({
        title: "Error",
        description: "Failed to load models. Please try again.",
        variant: "destructive"
      })
      setModels([])
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    if (activeTab === "community") {
      setHasLoadedInitially(true) // Mark user interaction
      loadModels()
    }
  }

  const handleModelClick = (model: ModelInfo) => {
    onModelSelect(model)
    toast({
      title: "Model Selected",
      description: `Selected ${model.name} by ${model.username}`
    })
  }

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString()
    } catch {
      return "Unknown"
    }
  }

  const ModelCard: React.FC<{ model: ModelInfo }> = ({ model }) => (
    <Card
      className={`cursor-pointer transition-all hover:shadow-md ${
        selectedModel?.name === model.name && selectedModel?.username === model.username
          ? "ring-2 ring-primary"
          : ""
      }`}
      onClick={() => handleModelClick(model)}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <h4
              className="font-semibold text-sm cursor-pointer hover:text-primary transition-colors"
              onClick={(e) => {
                e.stopPropagation()
                window.open(`https://rastion.com/${model.username}/${model.name}`, "_blank")
              }}
            >
              {model.name}
            </h4>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <UserAvatar username={model.username} size="sm" showTooltip />
              <span
                className="cursor-pointer hover:text-primary transition-colors"
                onClick={(e) => {
                  e.stopPropagation()
                  window.open(`https://rastion.com/${model.username}/${model.name}`, "_blank")
                }}
              >
                {model.username}
              </span>
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              window.open(model.repository_url, "_blank")
            }}
          >
            <ExternalLink className="h-3 w-3" />
          </Button>
        </div>

        {model.description && (
          <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
            {model.description}
          </p>
        )}

        <div className="flex items-center gap-2 mb-2">
          {model.tags.slice(0, 2).map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
          {model.tags.length > 2 && (
            <Badge variant="outline" className="text-xs">
              +{model.tags.length - 2}
            </Badge>
          )}
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Star className="h-3 w-3" />
              {model.metadata.stars}
            </span>
            <span className="flex items-center gap-1">
              <GitFork className="h-3 w-3" />
              {model.metadata.forks}
            </span>
          </div>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatDate(model.last_updated)}
          </span>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Select {modelType === "problem" ? "Problem" : "Optimizer"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {selectedModel && (
          <div className="p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">{selectedModel.name}</p>
                <p className="text-xs text-muted-foreground">by {selectedModel.username}</p>
              </div>
              <Button variant="outline" size="sm" onClick={onModelClear}>
                Clear
              </Button>
            </div>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={(value) => {
          setActiveTab(value)
          setHasLoadedInitially(true) // Mark that user has interacted with the component
        }}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="my-models">My Models</TabsTrigger>
            <TabsTrigger value="community">Community</TabsTrigger>
          </TabsList>

          <TabsContent value="my-models" className="space-y-4">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setHasLoadedInitially(true) // Mark user interaction
                  loadModels()
                }}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                Refresh
              </Button>
            </div>

            <ScrollArea className="h-[300px]">
              <div className="space-y-2">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : models.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Package className="h-8 w-8 mx-auto mb-2" />
                    <p>No {modelType}s found in your repositories</p>
                    <p className="text-xs">Upload some models to get started</p>
                  </div>
                ) : (
                  models.map((model) => (
                    <ModelCard key={`${model.username}/${model.name}`} model={model} />
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="community" className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <Input
                  placeholder={`Search ${modelType}s...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                />
              </div>
              <Button onClick={handleSearch} disabled={loading}>
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
            </div>

            <ScrollArea className="h-[300px]">
              <div className="space-y-2">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : models.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Search className="h-8 w-8 mx-auto mb-2" />
                    <p>No {modelType}s found</p>
                    <p className="text-xs">Try a different search term</p>
                  </div>
                ) : (
                  models.map((model) => (
                    <ModelCard key={`${model.username}/${model.name}`} model={model} />
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

export default QubotModelSelector

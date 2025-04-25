"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import Layout from "@/components/Layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Plus,
  ArrowRight,
  Clock,
  CheckCircle2,
  ListTodo,
  MoreHorizontal,
  Edit,
  Trash2,
  MessageSquare,
  ThumbsUp,
  Loader2,
  AlertCircle,
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Alert, AlertDescription } from "@/components/ui/alert"

// Feature type definition
interface Feature {
  id: string
  title: string
  description: string
  status: "backlog" | "in-progress" | "completed"
  votes: number
  comments: number
  createdAt: string
  createdBy: {
    name: string
    avatar?: string
  }
  priority: "low" | "medium" | "high"
  tags: string[]
  hasVoted?: boolean
}

export default function FeatureBacklogPage() {
  const { toast } = useToast()
  const [features, setFeatures] = useState<Feature[]>([])
  const [filteredFeatures, setFilteredFeatures] = useState<Feature[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [selectedPriority, setSelectedPriority] = useState<string>("all")
  const [showAddFeatureDialog, setShowAddFeatureDialog] = useState(false)
  const [showFeatureDetailsDialog, setShowFeatureDetailsDialog] = useState(false)
  const [selectedFeature, setSelectedFeature] = useState<Feature | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)

  // State for pagination
  const [backlogLimit, setBacklogLimit] = useState(10)
  const [inProgressLimit, setInProgressLimit] = useState(10)
  const [completedLimit, setCompletedLimit] = useState(10)

  // New feature form state
  const [newFeature, setNewFeature] = useState({
    title: "",
    description: "",
    priority: "medium",
    tags: [] as string[],
    status: "backlog",
  })

  // Comment form state
  const [commentText, setCommentText] = useState("")
  const [tagInput, setTagInput] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isAddingComment, setIsAddingComment] = useState(false)
  const [comments, setComments] = useState<any[]>([])
  const [isLoadingComments, setIsLoadingComments] = useState(false)

  // Check authentication status
  useEffect(() => {
    const token = localStorage.getItem("gitea_token")
    setIsAuthenticated(!!token)

    if (token) {
      fetchCurrentUser(token)
    }
  }, [])

  // Fetch current user data
  const fetchCurrentUser = async (token: string) => {
    try {
      const response = await fetch("http://localhost:4000/api/profile", {
        headers: {
          Authorization: `token ${token}`,
        },
      })

      if (response.ok) {
        const userData = await response.json()
        setCurrentUser(userData)
      }
    } catch (error) {
      console.error("Error fetching user profile:", error)
    }
  }

  // Fetch features from API
  useEffect(() => {
    fetchFeatures()
  }, [])

  const fetchFeatures = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const token = localStorage.getItem("gitea_token")
      const headers: HeadersInit = {}

      if (token) {
        headers["Authorization"] = `token ${token}`
      }

      const response = await fetch("http://localhost:4000/api/features", { headers })

      if (!response.ok) {
        throw new Error("Failed to fetch features")
      }

      const data = await response.json()
      setFeatures(data)
      setFilteredFeatures(data)
    } catch (err: any) {
      console.error("Error fetching features:", err)
      setError(err.message || "Failed to load features. Please try again later.")
    } finally {
      setIsLoading(false)
    }
  }

  // Filter features based on search, tags, and priority
  useEffect(() => {
    let result = [...features]

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (feature) =>
          feature.title.toLowerCase().includes(query) ||
          feature.description.toLowerCase().includes(query) ||
          feature.tags.some((tag) => tag.toLowerCase().includes(query)),
      )
    }

    // Filter by tags
    if (selectedTags.length > 0) {
      result = result.filter((feature) => selectedTags.every((tag) => feature.tags.includes(tag)))
    }

    // Filter by priority
    if (selectedPriority !== "all") {
      result = result.filter((feature) => feature.priority === selectedPriority)
    }

    setFilteredFeatures(result)
  }, [features, searchQuery, selectedTags, selectedPriority])

  // Get all unique tags from features
  const getAllTags = () => {
    const tags = new Set<string>()
    features.forEach((feature) => {
      feature.tags.forEach((tag) => tags.add(tag))
    })
    return Array.from(tags)
  }

  // Handle tag selection
  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]))
  }

  // Handle adding a new tag to a feature
  const handleAddTag = () => {
    if (tagInput.trim() && !newFeature.tags.includes(tagInput.trim())) {
      setNewFeature((prev) => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()],
      }))
      setTagInput("")
    }
  }

  // Handle removing a tag from a feature
  const handleRemoveTag = (tagToRemove: string) => {
    setNewFeature((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }))
  }

  // Handle feature form input changes
  const handleFeatureInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target
    setNewFeature((prev) => ({ ...prev, [name]: value }))
  }

  // Handle creating a new feature
  const handleCreateFeature = async () => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication required",
        description: "Please sign in to suggest a feature",
        variant: "destructive",
      })
      return
    }

    if (!newFeature.title || !newFeature.description) {
      toast({
        title: "Missing information",
        description: "Please provide both title and description",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const token = localStorage.getItem("gitea_token")
      const response = await fetch("http://localhost:4000/api/features", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `token ${token}`,
        },
        body: JSON.stringify({
          title: newFeature.title,
          description: newFeature.description,
          priority: newFeature.priority,
          status: newFeature.status,
          tags: newFeature.tags,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to create feature")
      }

      const createdFeature = await response.json()

      // Add the new feature to the list
      setFeatures((prev) => [createdFeature, ...prev])

      // Reset form
      setNewFeature({
        title: "",
        description: "",
        priority: "medium",
        tags: [],
        status: "backlog",
      })

      setShowAddFeatureDialog(false)

      toast({
        title: "Feature created",
        description: "Your feature has been added to the backlog",
      })
    } catch (err: any) {
      console.error("Error creating feature:", err)
      toast({
        title: "Error",
        description: err.message || "Failed to create feature. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle updating a feature
  const handleUpdateFeature = async () => {
    if (!selectedFeature) return

    setIsSubmitting(true)

    try {
      const token = localStorage.getItem("gitea_token")
      const response = await fetch(`http://localhost:4000/api/features/${selectedFeature.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `token ${token}`,
        },
        body: JSON.stringify({
          title: newFeature.title,
          description: newFeature.description,
          priority: newFeature.priority,
          status: newFeature.status,
          tags: newFeature.tags,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update feature")
      }

      const updatedFeature = await response.json()

      // Update the feature in the list
      setFeatures((prev) => prev.map((feature) => (feature.id === selectedFeature.id ? updatedFeature : feature)))

      setIsEditing(false)

      toast({
        title: "Feature updated",
        description: "The feature has been updated successfully",
      })
    } catch (err: any) {
      console.error("Error updating feature:", err)
      toast({
        title: "Error",
        description: err.message || "Failed to update feature. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle deleting a feature
  const handleDeleteFeature = async (featureId: string) => {
    try {
      const token = localStorage.getItem("gitea_token")
      const response = await fetch(`http://localhost:4000/api/features/${featureId}`, {
        method: "DELETE",
        headers: {
          Authorization: `token ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to delete feature")
      }

      setFeatures((prev) => prev.filter((feature) => feature.id !== featureId))
      setShowFeatureDetailsDialog(false)

      toast({
        title: "Feature deleted",
        description: "The feature has been removed from the backlog",
      })
    } catch (err: any) {
      console.error("Error deleting feature:", err)
      toast({
        title: "Error",
        description: err.message || "Failed to delete feature. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Handle voting for a feature
  const handleVoteFeature = async (featureId: string) => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication required",
        description: "Please sign in to vote for features",
        variant: "destructive",
      })
      return
    }

    try {
      const token = localStorage.getItem("gitea_token")
      const response = await fetch(`http://localhost:4000/api/features/${featureId}/vote`, {
        method: "POST",
        headers: {
          Authorization: `token ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to vote for feature")
      }

      const data = await response.json()

      // Update the feature in the list
      setFeatures((prev) =>
        prev.map((feature) => {
          if (feature.id === featureId) {
            return {
              ...feature,
              votes: data.votes,
              hasVoted: data.hasVoted,
            }
          }
          return feature
        }),
      )
    } catch (err: any) {
      console.error("Error voting for feature:", err)
      toast({
        title: "Error",
        description: err.message || "Failed to vote for feature. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Fetch comments for a feature
  const fetchComments = async (featureId: string) => {
    setIsLoadingComments(true)

    try {
      const response = await fetch(`http://localhost:4000/api/features/${featureId}/comments`)

      if (!response.ok) {
        throw new Error("Failed to fetch comments")
      }

      const data = await response.json()
      setComments(data)
    } catch (err: any) {
      console.error("Error fetching comments:", err)
      toast({
        title: "Error",
        description: err.message || "Failed to load comments. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoadingComments(false)
    }
  }

  // Handle adding a comment to a feature
  const handleAddComment = async () => {
    if (!commentText.trim() || !selectedFeature) return
    if (!isAuthenticated) {
      toast({
        title: "Authentication required",
        description: "Please sign in to comment on features",
        variant: "destructive",
      })
      return
    }

    setIsAddingComment(true)

    try {
      const token = localStorage.getItem("gitea_token")
      const response = await fetch(`http://localhost:4000/api/features/${selectedFeature.id}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `token ${token}`,
        },
        body: JSON.stringify({
          content: commentText,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to add comment")
      }

      const newComment = await response.json()

      // Add the new comment to the list
      setComments((prev) => [...prev, newComment])

      // Update the comment count in the feature
      setFeatures((prev) =>
        prev.map((feature) =>
          feature.id === selectedFeature.id ? { ...feature, comments: feature.comments + 1 } : feature,
        ),
      )

      setCommentText("")

      toast({
        title: "Comment added",
        description: "Your comment has been added to the feature",
      })
    } catch (err: any) {
      console.error("Error adding comment:", err)
      toast({
        title: "Error",
        description: err.message || "Failed to add comment. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsAddingComment(false)
    }
  }

  // Handle moving a feature to a different status
  const handleMoveFeature = async (featureId: string, newStatus: "backlog" | "in-progress" | "completed") => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication required",
        description: "Please sign in to update feature status",
        variant: "destructive",
      })
      return
    }

    try {
      const token = localStorage.getItem("gitea_token")
      const response = await fetch(`http://localhost:4000/api/features/${featureId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `token ${token}`,
        },
        body: JSON.stringify({
          status: newStatus,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update feature status")
      }

      // Update the feature in the list
      setFeatures((prev) =>
        prev.map((feature) => (feature.id === featureId ? { ...feature, status: newStatus } : feature)),
      )

      toast({
        title: "Feature moved",
        description: `Feature moved to ${newStatus.replace("-", " ")}`,
      })
    } catch (err: any) {
      console.error("Error updating feature status:", err)
      toast({
        title: "Error",
        description: err.message || "Failed to update feature status. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Open feature details dialog
  const openFeatureDetails = (feature: Feature) => {
    setSelectedFeature(feature)
    setShowFeatureDetailsDialog(true)
    setIsEditing(false)

    // Reset the new feature form with the selected feature's data
    setNewFeature({
      title: feature.title,
      description: feature.description,
      priority: feature.priority,
      tags: [...feature.tags],
      status: feature.status,
    })

    // Fetch comments for the feature
    fetchComments(feature.id)
  }

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  // Get features by status, sorted by votes (most liked first)
  const getFeaturesByStatus = (status: "backlog" | "in-progress" | "completed") => {
    return filteredFeatures.filter((feature) => feature.status === status).sort((a, b) => b.votes - a.votes)
  }

  // Get priority badge variant
  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
      case "medium":
        return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
      case "low":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
      default:
        return ""
    }
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-24 md:py-32">
        <div className="max-w-7xl mx-auto">
          {/* Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <Badge variant="outline" className="mb-4 px-3 py-1 text-sm bg-primary/10 border-primary/20">
              Help us make Rastion the best product for you
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Rastion roadmap</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Upvote features you think we should implement in Rastion.
            </p>
          </motion.div>

          {/* Filters and Search */}
          <div className="flex flex-col md:flex-row gap-4 mb-8 items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
              <div className="relative w-full sm:w-64">
                <Select value={selectedPriority} onValueChange={setSelectedPriority}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priorities</SelectItem>
                    <SelectItem value="high">High Priority</SelectItem>
                    <SelectItem value="medium">Medium Priority</SelectItem>
                    <SelectItem value="low">Low Priority</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Input
                type="search"
                placeholder="Search features..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-64"
              />
            </div>

            <Button onClick={() => setShowAddFeatureDialog(true)} className="w-full md:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Suggest Feature
            </Button>
          </div>

          {/* Tags filter */}
          {getAllTags().length > 0 && (
            <div className="mb-6">
              <div className="flex flex-wrap gap-2">
                {getAllTags().map((tag) => (
                  <Badge
                    key={tag}
                    variant={selectedTags.includes(tag) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleTag(tag)}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Error message */}
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Loading state */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">Loading features...</span>
            </div>
          ) : (
            /* Feature Board */
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Backlog Column */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold flex items-center">
                    <ListTodo className="mr-2 h-5 w-5 text-muted-foreground" />
                    Backlog
                    <Badge variant="outline" className="ml-2">
                      {getFeaturesByStatus("backlog").length}
                    </Badge>
                  </h2>
                </div>

                <div className="h-[600px] overflow-y-auto pr-2 space-y-4">
                  {getFeaturesByStatus("backlog").length === 0 ? (
                    <Card className="border-dashed border-2 bg-muted/50">
                      <CardContent className="flex flex-col items-center justify-center p-6">
                        <ListTodo className="h-8 w-8 text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground text-center">No features in backlog</p>
                      </CardContent>
                    </Card>
                  ) : (
                    <>
                      {getFeaturesByStatus("backlog")
                        .slice(0, backlogLimit)
                        .map((feature) => (
                          <FeatureCard
                            key={feature.id}
                            feature={feature}
                            onVote={() => handleVoteFeature(feature.id)}
                            onViewDetails={() => openFeatureDetails(feature)}
                            onMoveFeature={(status) => handleMoveFeature(feature.id, status)}
                            getPriorityBadge={getPriorityBadge}
                            formatDate={formatDate}
                          />
                        ))}

                      {getFeaturesByStatus("backlog").length > backlogLimit && (
                        <Button
                          variant="ghost"
                          className="w-full mt-2"
                          onClick={() => setBacklogLimit((prev) => prev + 10)}
                        >
                          Load more
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* In Progress Column */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold flex items-center">
                    <Clock className="mr-2 h-5 w-5 text-muted-foreground" />
                    In Progress
                    <Badge variant="outline" className="ml-2">
                      {getFeaturesByStatus("in-progress").length}
                    </Badge>
                  </h2>
                </div>

                <div className="h-[600px] overflow-y-auto pr-2 space-y-4">
                  {getFeaturesByStatus("in-progress").length === 0 ? (
                    <Card className="border-dashed border-2 bg-muted/50">
                      <CardContent className="flex flex-col items-center justify-center p-6">
                        <Clock className="h-8 w-8 text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground text-center">No features in progress</p>
                      </CardContent>
                    </Card>
                  ) : (
                    <>
                      {getFeaturesByStatus("in-progress")
                        .slice(0, inProgressLimit)
                        .map((feature) => (
                          <FeatureCard
                            key={feature.id}
                            feature={feature}
                            onVote={() => handleVoteFeature(feature.id)}
                            onViewDetails={() => openFeatureDetails(feature)}
                            onMoveFeature={(status) => handleMoveFeature(feature.id, status)}
                            getPriorityBadge={getPriorityBadge}
                            formatDate={formatDate}
                          />
                        ))}

                      {getFeaturesByStatus("in-progress").length > inProgressLimit && (
                        <Button
                          variant="ghost"
                          className="w-full mt-2"
                          onClick={() => setInProgressLimit((prev) => prev + 10)}
                        >
                          Load more
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Completed Column */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold flex items-center">
                    <CheckCircle2 className="mr-2 h-5 w-5 text-muted-foreground" />
                    Completed
                    <Badge variant="outline" className="ml-2">
                      {getFeaturesByStatus("completed").length}
                    </Badge>
                  </h2>
                </div>

                <div className="h-[600px] overflow-y-auto pr-2 space-y-4">
                  {getFeaturesByStatus("completed").length === 0 ? (
                    <Card className="border-dashed border-2 bg-muted/50">
                      <CardContent className="flex flex-col items-center justify-center p-6">
                        <CheckCircle2 className="h-8 w-8 text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground text-center">No completed features</p>
                      </CardContent>
                    </Card>
                  ) : (
                    <>
                      {getFeaturesByStatus("completed")
                        .slice(0, completedLimit)
                        .map((feature) => (
                          <FeatureCard
                            key={feature.id}
                            feature={feature}
                            onVote={() => handleVoteFeature(feature.id)}
                            onViewDetails={() => openFeatureDetails(feature)}
                            onMoveFeature={(status) => handleMoveFeature(feature.id, status)}
                            getPriorityBadge={getPriorityBadge}
                            formatDate={formatDate}
                          />
                        ))}

                      {getFeaturesByStatus("completed").length > completedLimit && (
                        <Button
                          variant="ghost"
                          className="w-full mt-2"
                          onClick={() => setCompletedLimit((prev) => prev + 10)}
                        >
                          Load more
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Feature Dialog */}
      <Dialog open={showAddFeatureDialog} onOpenChange={setShowAddFeatureDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Suggest a new feature</DialogTitle>
            <DialogDescription>Describe the feature you'd like to see added to the platform.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="title" className="text-sm font-medium">
                Feature title
              </label>
              <Input
                id="title"
                name="title"
                value={newFeature.title}
                onChange={handleFeatureInputChange}
                placeholder="Enter a concise title for the feature"
              />
            </div>

            <div className="grid gap-2">
              <label htmlFor="description" className="text-sm font-medium">
                Description
              </label>
              <Textarea
                id="description"
                name="description"
                value={newFeature.description}
                onChange={handleFeatureInputChange}
                placeholder="Describe the feature in detail, including why it would be valuable"
                rows={5}
              />
            </div>

            <div className="grid gap-2">
              <label htmlFor="priority" className="text-sm font-medium">
                Priority
              </label>
              <Select
                name="priority"
                value={newFeature.priority}
                onValueChange={(value) => setNewFeature((prev) => ({ ...prev, priority: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">Tags</label>
              <div className="flex gap-2">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  placeholder="Add a tag"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      handleAddTag()
                    }
                  }}
                />
                <Button type="button" variant="outline" onClick={handleAddTag}>
                  Add
                </Button>
              </div>

              {newFeature.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {newFeature.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-1 rounded-full hover:bg-muted w-4 h-4 inline-flex items-center justify-center"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddFeatureDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateFeature} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Feature"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Feature Details Dialog */}
      {selectedFeature && (
        <Dialog open={showFeatureDetailsDialog} onOpenChange={setShowFeatureDetailsDialog}>
          <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  {isEditing ? (
                    <Input
                      value={newFeature.title}
                      onChange={handleFeatureInputChange}
                      name="title"
                      className="text-xl font-bold"
                    />
                  ) : (
                    <DialogTitle className="text-xl">{selectedFeature.title}</DialogTitle>
                  )}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>Created by {selectedFeature.createdBy.name}</span>
                    <span>•</span>
                    <span>{formatDate(selectedFeature.createdAt)}</span>
                  </div>
                </div>

                {!isEditing && isAuthenticated && (
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDeleteFeature(selectedFeature.id)}>
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                )}
              </div>
            </DialogHeader>

            <div className="py-4 space-y-6">
              {/* Status and Priority */}
              <div className="flex flex-wrap gap-3">
                {isEditing ? (
                  <>
                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground">Status</label>
                      <Select
                        name="status"
                        value={newFeature.status}
                        onValueChange={(value) => setNewFeature((prev) => ({ ...prev, status: value }))}
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="backlog">Backlog</SelectItem>
                          <SelectItem value="in-progress">In Progress</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground">Priority</label>
                      <Select
                        name="priority"
                        value={newFeature.priority}
                        onValueChange={(value) => setNewFeature((prev) => ({ ...prev, priority: value }))}
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue placeholder="Priority" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                ) : (
                  <>
                    <Badge variant="outline" className="bg-muted/50">
                      {selectedFeature.status === "backlog" ? (
                        <ListTodo className="h-3.5 w-3.5 mr-1" />
                      ) : selectedFeature.status === "in-progress" ? (
                        <Clock className="h-3.5 w-3.5 mr-1" />
                      ) : (
                        <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                      )}
                      {selectedFeature.status.replace("-", " ")}
                    </Badge>

                    <Badge variant="outline" className={`${getPriorityBadge(selectedFeature.priority)}`}>
                      {selectedFeature.priority} priority
                    </Badge>
                  </>
                )}
              </div>

              {/* Description */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Description</h3>
                {isEditing ? (
                  <Textarea
                    name="description"
                    value={newFeature.description}
                    onChange={handleFeatureInputChange}
                    rows={5}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground whitespace-pre-line">{selectedFeature.description}</p>
                )}
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Tags</h3>
                {isEditing ? (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Input
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        placeholder="Add a tag"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault()
                            handleAddTag()
                          }
                        }}
                      />
                      <Button type="button" variant="outline" onClick={handleAddTag}>
                        Add
                      </Button>
                    </div>

                    {newFeature.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {newFeature.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                            {tag}
                            <button
                              type="button"
                              onClick={() => handleRemoveTag(tag)}
                              className="ml-1 rounded-full hover:bg-muted w-4 h-4 inline-flex items-center justify-center"
                            >
                              ×
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {selectedFeature.tags.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {isEditing ? (
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleUpdateFeature} disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Changes"
                    )}
                  </Button>
                </div>
              ) : (
                <>
                  {/* Comments Section */}
                  <div className="space-y-4 pt-4 border-t">
                    <h3 className="text-sm font-medium flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      Comments ({selectedFeature.comments})
                    </h3>

                    {isAuthenticated && (
                      <div className="flex gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage
                            src={currentUser?.avatar_url || "/placeholder.svg?height=32&width=32"}
                            alt={currentUser?.username || "Current user"}
                          />
                          <AvatarFallback>
                            {currentUser?.username ? currentUser.username.charAt(0).toUpperCase() : "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <Textarea
                            placeholder="Add a comment..."
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            className="min-h-[80px]"
                          />
                          <Button
                            className="mt-2"
                            size="sm"
                            onClick={handleAddComment}
                            disabled={!commentText.trim() || isAddingComment}
                          >
                            {isAddingComment ? (
                              <>
                                <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                                Posting...
                              </>
                            ) : (
                              "Post Comment"
                            )}
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Comments list */}
                    {isLoadingComments ? (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                        <span className="ml-2 text-sm text-muted-foreground">Loading comments...</span>
                      </div>
                    ) : comments.length > 0 ? (
                      <div className="space-y-4">
                        {comments.map((comment) => (
                          <div key={comment.id} className="flex gap-3 pt-4">
                            <Avatar className="h-8 w-8">
                              <AvatarImage
                                src={
                                  comment.user.avatar_url ||
                                  `/placeholder.svg?height=32&width=32&query=${comment.user.username || "/placeholder.svg"}`
                                }
                                alt={comment.user.username}
                              />
                              <AvatarFallback>{comment.user.username.charAt(0).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-sm">{comment.user.username}</span>
                                <span className="text-xs text-muted-foreground">{formatDate(comment.created_at)}</span>
                              </div>
                              <p className="text-sm mt-1">{comment.content}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-sm text-muted-foreground">No comments yet. Be the first to comment!</p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </Layout>
  )
}

// Feature Card Component
function FeatureCard({
  feature,
  onVote,
  onViewDetails,
  onMoveFeature,
  getPriorityBadge,
  formatDate,
}: {
  feature: Feature
  onVote: () => void
  onViewDetails: () => void
  onMoveFeature: (status: "backlog" | "in-progress" | "completed") => void
  getPriorityBadge: (priority: string) => string
  formatDate: (date: string) => string
}) {
  return (
    <Card className="hover:shadow-md transition-all duration-200">
      <CardHeader className="p-4 pb-0 flex flex-row items-start justify-between space-y-0">
        <div className="space-y-1">
          <Badge variant="outline" className={`${getPriorityBadge(feature.priority)}`}>
            {feature.priority} priority
          </Badge>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onViewDetails}>View Details</DropdownMenuItem>
            {feature.status !== "backlog" && (
              <DropdownMenuItem onClick={() => onMoveFeature("backlog")}>Move to Backlog</DropdownMenuItem>
            )}
            {feature.status !== "in-progress" && (
              <DropdownMenuItem onClick={() => onMoveFeature("in-progress")}>Move to In Progress</DropdownMenuItem>
            )}
            {feature.status !== "completed" && (
              <DropdownMenuItem onClick={() => onMoveFeature("completed")}>Mark as Completed</DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent className="p-4">
        <h3 className="font-medium text-base mb-2 hover:text-primary cursor-pointer" onClick={onViewDetails}>
          {feature.title}
        </h3>
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{feature.description}</p>

        {feature.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {feature.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
            {feature.tags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{feature.tags.length - 3}
              </Badge>
            )}
          </div>
        )}

        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Avatar className="h-5 w-5">
              <AvatarImage src={feature.createdBy.avatar || "/placeholder.svg"} alt={feature.createdBy.name} />
              <AvatarFallback>{feature.createdBy.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <span>{formatDate(feature.createdAt)}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex justify-between">
        <Button
          variant="ghost"
          size="sm"
          className={`gap-1 ${feature.hasVoted ? "text-primary" : ""}`}
          onClick={onVote}
        >
          <ThumbsUp className={`h-4 w-4 ${feature.hasVoted ? "fill-current" : ""}`} />
          {feature.votes}
        </Button>

        <Button variant="ghost" size="sm" className="gap-1" onClick={onViewDetails}>
          <MessageSquare className="h-4 w-4" />
          {feature.comments}
        </Button>

        <Button variant="outline" size="sm" onClick={onViewDetails}>
          Details
          <ArrowRight className="ml-1 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  )
}

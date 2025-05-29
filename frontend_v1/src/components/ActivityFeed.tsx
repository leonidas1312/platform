"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import {
  Loader2,
  MessageSquare,
  FolderGit,
  ThumbsUp,
  Clock,
  Code,
  User,
  Star,
  Heart,
  GitBranch,
  BookOpen,
  Users,
  TrendingUp,
  RefreshCw,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  MessageCircle,
  FileText,
  Zap
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"

// Enhanced Activity Types
type ActivityType =
  | "qubot_created"
  | "qubot_updated"
  | "qubot_forked"
  | "feature_comment"
  | "feature_vote"
  | "feature_created"
  | "post_comment"
  | "post_like"
  | "post_created"
  | "user_followed"
  | "user_unfollowed"
  | "repo_starred"
  | "repo_unstarred"
  | "blog_published"
  | "blog_liked"
  | "benchmark_submitted"
  | "collaboration_started"

// Comprehensive Activity Data Structure
interface ActivityData {
  qubot?: {
    id: string
    name: string
    owner: string
    description?: string
    language?: string
    stars_count?: number
    forks_count?: number
  }
  feature?: {
    id: string
    title: string
    description?: string
    status?: string
    votes?: number
  }
  comment?: {
    id: string
    content: string
    parent_type?: "feature" | "post" | "blog"
    parent_id?: string
  }
  post?: {
    id: number
    title?: string
    content: string
    likes?: number
    comments_count?: number
  }
  user?: {
    login: string
    full_name?: string
    avatar_url?: string
    followers_count?: number
  }
  blog?: {
    id: string
    title: string
    excerpt?: string
    read_time?: number
  }
  benchmark?: {
    id: string
    name: string
    score?: number
    rank?: number
  }
}

// Enhanced Activity Item Interface
interface ActivityItem {
  id: string
  type: ActivityType
  timestamp: string
  user: {
    login: string
    full_name?: string
    avatar_url?: string
  }
  data: ActivityData
  grouped_count?: number // For activity grouping
  is_grouped?: boolean
  grouped_activities?: ActivityItem[] // Individual activities in the group
  metadata?: {
    platform_section?: string
    importance_score?: number
  }
}

// Activity Feed Props
interface ActivityFeedProps {
  username: string
  avatar_url?: string
  showNetworkActivity?: boolean
  maxItems?: number
  enableRealTime?: boolean
  enableGrouping?: boolean
  className?: string
}

// API Configuration
const API = import.meta.env.VITE_API_BASE

// Utility Functions
const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString)
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) {
    return diffInSeconds <= 1 ? "just now" : `${diffInSeconds}s ago`
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60)
  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`
  }

  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) {
    return `${diffInHours}h ago`
  }

  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 7) {
    return `${diffInDays}d ago`
  }

  if (diffInDays < 30) {
    const weeks = Math.floor(diffInDays / 7)
    return `${weeks}w ago`
  }

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
  })
}

const getActivityIcon = (type: ActivityType) => {
  const iconMap: Record<ActivityType, React.ComponentType<any>> = {
    qubot_created: FolderGit,
    qubot_updated: Code,
    qubot_forked: GitBranch,
    feature_comment: MessageSquare,
    feature_vote: ThumbsUp,
    feature_created: Zap,
    post_comment: MessageCircle,
    post_like: Heart,
    post_created: BookOpen,
    user_followed: User,
    user_unfollowed: User,
    repo_starred: Star,
    repo_unstarred: Star,
    blog_published: BookOpen,
    blog_liked: Heart,
    benchmark_submitted: TrendingUp,
    collaboration_started: Users,
  }
  return iconMap[type] || Clock
}

const getActivityColor = (type: ActivityType): string => {
  const colorMap: Record<ActivityType, string> = {
    qubot_created: "text-green-500",
    qubot_updated: "text-blue-500",
    qubot_forked: "text-purple-500",
    feature_comment: "text-primary",
    feature_vote: "text-orange-500",
    feature_created: "text-yellow-500",
    post_comment: "text-primary",
    post_like: "text-red-500",
    post_created: "text-indigo-500",
    user_followed: "text-indigo-500",
    user_unfollowed: "text-gray-500",
    repo_starred: "text-amber-500",
    repo_unstarred: "text-gray-500",
    blog_published: "text-emerald-500",
    blog_liked: "text-red-500",
    benchmark_submitted: "text-cyan-500",
    collaboration_started: "text-violet-500",
  }
  return colorMap[type] || "text-muted-foreground"
}

// Activity Grouping Logic
const groupActivities = (activities: ActivityItem[]): ActivityItem[] => {
  const grouped: ActivityItem[] = []
  const groupMap = new Map<string, ActivityItem[]>()

  // Group similar activities by user and type within a time window (1 hour)
  activities.forEach(activity => {
    const timeWindow = Math.floor(new Date(activity.timestamp).getTime() / (1000 * 60 * 60))
    const groupKey = `${activity.user.login}-${activity.type}-${timeWindow}`

    if (!groupMap.has(groupKey)) {
      groupMap.set(groupKey, [])
    }
    groupMap.get(groupKey)!.push(activity)
  })

  // Process groups
  groupMap.forEach(group => {
    if (group.length === 1) {
      grouped.push(group[0])
    } else {
      // Create a grouped activity with all individual activities preserved
      const firstActivity = group[0]
      const sortedGroup = group.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      const groupedActivity: ActivityItem = {
        ...firstActivity,
        id: `grouped-${firstActivity.id}`,
        grouped_count: group.length,
        is_grouped: true,
        grouped_activities: sortedGroup, // Preserve all individual activities
        timestamp: sortedGroup[0].timestamp // Use latest timestamp
      }
      grouped.push(groupedActivity)
    }
  })

  return grouped.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
}

// Custom Hook for Activity Feed
const useActivityFeed = (username: string, options: {
  maxItems?: number
  enableGrouping?: boolean
  enableRealTime?: boolean
  avatar_url?: string
}) => {
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(1)
  const { toast } = useToast()

  const fetchActivities = useCallback(async (pageNum: number = 1, append: boolean = false) => {
    if (!append) setLoading(true)
    setError(null)

    try {
      const token = localStorage.getItem("gitea_token")
      if (!token) {
        setLoading(false)
        return
      }

      // Fetch activities from multiple sources
      const [reposResponse, featuresResponse, postsResponse, userActivitiesResponse] = await Promise.allSettled([
        fetch(`${API}/users/${username}/repos?page=${pageNum}&limit=20`, {
          headers: { Authorization: `token ${token}` },
        }),
        fetch(`${API}/features?page=${pageNum}&limit=10`, {
          headers: { Authorization: `token ${token}` },
        }),
        fetch(`${API}/community/posts?page=${pageNum}&limit=10`, {
          headers: { Authorization: `token ${token}` },
        }),
        fetch(`${API}/users/${username}/activities?page=${pageNum}&limit=20`, {
          headers: { Authorization: `token ${token}` },
        })
      ])

      const newActivities: ActivityItem[] = []

      // Process repositories (Qubots)
      if (reposResponse.status === 'fulfilled' && reposResponse.value.ok) {
        const repos = await reposResponse.value.json()
        const repoActivities = repos
          .filter((repo: any) => repo.owner?.login === username)
          .slice(0, 5)
          .map((repo: any) => ({
            id: `qubot-${repo.id}`,
            type: "qubot_updated" as ActivityType,
            timestamp: repo.updated_at,
            user: {
              login: username,
              avatar_url: options.avatar_url,
            },
            data: {
              qubot: {
                id: repo.id.toString(),
                name: repo.name,
                owner: repo.owner?.login || username,
                description: repo.description,
                language: repo.language,
                stars_count: repo.stars_count || 0,
                forks_count: repo.forks_count || 0,
              }
            }
          }))
        newActivities.push(...repoActivities)
      }

      // Process user activities (follows, stars, etc.)
      if (userActivitiesResponse.status === 'fulfilled' && userActivitiesResponse.value.ok) {
        const userActivities = await userActivitiesResponse.value.json()
        const processedActivities = userActivities.map((activity: any) => ({
          id: `activity-${activity.id}`,
          type: activity.activity_type as ActivityType,
          timestamp: activity.created_at,
          user: {
            login: username,
            avatar_url: options.avatar_url,
          },
          data: {
            user: activity.target_user ? {
              login: activity.target_user,
            } : undefined,
            qubot: activity.target_repo ? {
              id: activity.target_repo,
              name: activity.target_repo,
              owner: activity.target_repo.split('/')[0] || '',
            } : undefined,
          }
        }))
        newActivities.push(...processedActivities)
      }

      // Apply grouping if enabled
      const finalActivities = options.enableGrouping
        ? groupActivities(newActivities)
        : newActivities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

      if (append) {
        setActivities(prev => [...prev, ...finalActivities])
      } else {
        setActivities(finalActivities)
      }

      setHasMore(finalActivities.length === (options.maxItems || 20))

    } catch (err: any) {
      console.error("Error fetching activities:", err)
      setError(err.message || "Failed to load activities")
      toast({
        title: "Error",
        description: "Failed to load activity feed. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [username, options.enableGrouping, options.maxItems, toast])

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      const nextPage = page + 1
      setPage(nextPage)
      fetchActivities(nextPage, true)
    }
  }, [loading, hasMore, page, fetchActivities])

  const refresh = useCallback(() => {
    setPage(1)
    fetchActivities(1, false)
  }, [fetchActivities])

  useEffect(() => {
    fetchActivities()
  }, [fetchActivities])

  // Real-time updates (polling every 30 seconds)
  useEffect(() => {
    if (!options.enableRealTime) return

    const interval = setInterval(() => {
      fetchActivities(1, false)
    }, 30000)

    return () => clearInterval(interval)
  }, [options.enableRealTime, fetchActivities])

  return {
    activities,
    loading,
    error,
    hasMore,
    loadMore,
    refresh
  }
}

// Activity Item Component
const ActivityItemComponent = ({ activity, onNavigate }: {
  activity: ActivityItem
  onNavigate: (path: string) => void
}) => {
  const [expanded, setExpanded] = useState(false)
  const IconComponent = getActivityIcon(activity.type)
  const iconColor = getActivityColor(activity.type)

  const getActivityText = () => {
    const { type, data, grouped_count, is_grouped } = activity
    const count = grouped_count || 1
    const plural = count > 1

    switch (type) {
      case "qubot_created":
        return (
          <>
            created {plural ? `${count} new Qubots` : "a new Qubot"}{" "}
            {!is_grouped && data.qubot && (
              <Button
                variant="link"
                className="p-0 h-auto text-primary font-medium hover:underline"
                onClick={() => onNavigate(`/${data.qubot!.owner}/${data.qubot!.name}`)}
              >
                {data.qubot.name}
              </Button>
            )}
          </>
        )
      case "qubot_updated":
        return (
          <>
            updated {plural ? `${count} Qubots` : "a Qubot"}{" "}
            {!is_grouped && data.qubot && (
              <Button
                variant="link"
                className="p-0 h-auto text-primary font-medium hover:underline"
                onClick={() => onNavigate(`/${data.qubot!.owner}/${data.qubot!.name}`)}
              >
                {data.qubot.name}
              </Button>
            )}
          </>
        )
      case "qubot_forked":
        return (
          <>
            forked {plural ? `${count} repositories` : "a repository"}{" "}
            {!is_grouped && data.qubot && (
              <Button
                variant="link"
                className="p-0 h-auto text-primary font-medium hover:underline"
                onClick={() => onNavigate(`/${data.qubot!.owner}/${data.qubot!.name}`)}
              >
                {data.qubot.name}
              </Button>
            )}
          </>
        )
      case "feature_comment":
        return (
          <>
            commented on {plural ? `${count} features` : "a feature"}{" "}
            {!is_grouped && data.feature && (
              <Button
                variant="link"
                className="p-0 h-auto text-primary font-medium hover:underline"
                onClick={() => onNavigate(`/roadmap#feature-${data.feature!.id}`)}
              >
                {data.feature.title}
              </Button>
            )}
          </>
        )
      case "feature_vote":
        return (
          <>
            voted on {plural ? `${count} features` : "a feature"}{" "}
            {!is_grouped && data.feature && (
              <Button
                variant="link"
                className="p-0 h-auto text-primary font-medium hover:underline"
                onClick={() => onNavigate(`/roadmap#feature-${data.feature!.id}`)}
              >
                {data.feature.title}
              </Button>
            )}
          </>
        )
      case "feature_created":
        return (
          <>
            created {plural ? `${count} feature requests` : "a feature request"}{" "}
            {!is_grouped && data.feature && (
              <Button
                variant="link"
                className="p-0 h-auto text-primary font-medium hover:underline"
                onClick={() => onNavigate(`/roadmap#feature-${data.feature!.id}`)}
              >
                {data.feature.title}
              </Button>
            )}
          </>
        )
      case "post_comment":
        return (
          <>
            commented on {plural ? `${count} posts` : "a post"}{" "}
            {!is_grouped && data.post && (
              <Button
                variant="link"
                className="p-0 h-auto text-primary font-medium hover:underline"
                onClick={() => onNavigate(`/feedback#post-${data.post!.id}`)}
              >
                community post
              </Button>
            )}
          </>
        )
      case "post_like":
        return (
          <>
            liked {plural ? `${count} posts` : "a post"}{" "}
            {!is_grouped && data.post && (
              <Button
                variant="link"
                className="p-0 h-auto text-primary font-medium hover:underline"
                onClick={() => onNavigate(`/feedback#post-${data.post!.id}`)}
              >
                community post
              </Button>
            )}
          </>
        )
      case "post_created":
        return (
          <>
            created {plural ? `${count} posts` : "a post"} in the community
          </>
        )
      case "user_followed":
        return (
          <>
            followed {plural ? `${count} users` : ""}{" "}
            {!is_grouped && data.user && (
              <Button
                variant="link"
                className="p-0 h-auto text-primary font-medium hover:underline"
                onClick={() => onNavigate(`/profile/${data.user!.login}`)}
              >
                @{data.user.login}
              </Button>
            )}
          </>
        )
      case "user_unfollowed":
        return (
          <>
            unfollowed {plural ? `${count} users` : ""}{" "}
            {!is_grouped && data.user && (
              <Button
                variant="link"
                className="p-0 h-auto text-primary font-medium hover:underline"
                onClick={() => onNavigate(`/profile/${data.user!.login}`)}
              >
                @{data.user.login}
              </Button>
            )}
          </>
        )
      case "repo_starred":
        return (
          <>
            starred {plural ? `${count} repositories` : "a repository"}{" "}
            {!is_grouped && data.qubot && (
              <Button
                variant="link"
                className="p-0 h-auto text-primary font-medium hover:underline"
                onClick={() => onNavigate(`/${data.qubot!.owner}/${data.qubot!.name}`)}
              >
                {data.qubot.name}
              </Button>
            )}
          </>
        )
      case "repo_unstarred":
        return (
          <>
            unstarred {plural ? `${count} repositories` : "a repository"}{" "}
            {!is_grouped && data.qubot && (
              <Button
                variant="link"
                className="p-0 h-auto text-primary font-medium hover:underline"
                onClick={() => onNavigate(`/${data.qubot!.owner}/${data.qubot!.name}`)}
              >
                {data.qubot.name}
              </Button>
            )}
          </>
        )
      case "blog_published":
        return (
          <>
            published {plural ? `${count} blog posts` : "a blog post"}{" "}
            {!is_grouped && data.blog && (
              <Button
                variant="link"
                className="p-0 h-auto text-primary font-medium hover:underline"
                onClick={() => onNavigate(`/blogs/${data.blog!.id}`)}
              >
                {data.blog.title}
              </Button>
            )}
          </>
        )
      case "blog_liked":
        return (
          <>
            liked {plural ? `${count} blog posts` : "a blog post"}{" "}
            {!is_grouped && data.blog && (
              <Button
                variant="link"
                className="p-0 h-auto text-primary font-medium hover:underline"
                onClick={() => onNavigate(`/blogs/${data.blog!.id}`)}
              >
                {data.blog.title}
              </Button>
            )}
          </>
        )
      case "benchmark_submitted":
        return (
          <>
            submitted {plural ? `${count} benchmarks` : "a benchmark"}{" "}
            {!is_grouped && data.benchmark && (
              <Button
                variant="link"
                className="p-0 h-auto text-primary font-medium hover:underline"
                onClick={() => onNavigate(`/benchmarks/${data.benchmark!.id}`)}
              >
                {data.benchmark.name}
              </Button>
            )}
          </>
        )
      case "collaboration_started":
        return (
          <>
            started {plural ? `${count} collaborations` : "a collaboration"}
          </>
        )
      default:
        return "performed an action"
    }
  }

  const getContentPreview = () => {
    const { type, data } = activity

    if (type === "qubot_created" && data.qubot?.description) {
      return (
        <Card className="mt-3 bg-muted/30 border-muted">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <FolderGit className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {data.qubot.description}
                </p>
                {data.qubot.language && (
                  <Badge variant="secondary" className="mt-2 text-xs">
                    {data.qubot.language}
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )
    }

    if ((type === "feature_comment" || type === "post_comment") && data.comment?.content) {
      const content = data.comment.content
      const shouldTruncate = content.length > 150
      const displayContent = expanded || !shouldTruncate
        ? content
        : `${content.substring(0, 150)}...`

      return (
        <Card className="mt-3 bg-muted/30 border-muted">
          <CardContent className="p-4">
            <p className="text-sm text-foreground whitespace-pre-wrap">
              {displayContent}
            </p>
            {shouldTruncate && (
              <Button
                variant="link"
                size="sm"
                className="p-0 h-auto text-xs text-primary mt-2"
                onClick={() => setExpanded(!expanded)}
              >
                {expanded ? "Show less" : "Show more"}
              </Button>
            )}
          </CardContent>
        </Card>
      )
    }

    if (type === "post_created" && data.post?.content) {
      return (
        <Card className="mt-3 bg-muted/30 border-muted">
          <CardContent className="p-4">
            <p className="text-sm text-foreground line-clamp-3">
              {data.post.content}
            </p>
            {data.post.likes && data.post.likes > 0 && (
              <div className="flex items-center gap-2 mt-2">
                <Heart className="h-3 w-3 text-red-500" />
                <span className="text-xs text-muted-foreground">
                  {data.post.likes} likes
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      )
    }

    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="group"
    >
      <div className="flex gap-4 p-4 rounded-lg hover:bg-muted/30 transition-colors">
        {/* Avatar */}
        <div className="flex-shrink-0">
          <Avatar className="h-10 w-10 border border-border/40 ring-2 ring-transparent group-hover:ring-primary/20 transition-all">
            <AvatarImage
              src={activity.user.avatar_url || `/placeholder.svg?height=40&width=40&query=${activity.user.login}`}
              alt={activity.user.login}
            />
            <AvatarFallback className="bg-primary/10 text-primary font-medium">
              {activity.user.login.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground hover:text-primary transition-colors cursor-pointer">
                  {activity.user.full_name || activity.user.login}
                </span>{" "}
                {getActivityText()}
              </p>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatRelativeTime(activity.timestamp)}
              </p>
            </div>

            {/* Activity Icon */}
            <div className="flex-shrink-0 ml-3">
              <div className={`p-2 rounded-full bg-background border ${iconColor.replace('text-', 'border-')} transition-all group-hover:scale-110`}>
                <IconComponent className={`h-4 w-4 ${iconColor}`} />
              </div>
            </div>
          </div>

          {/* Content Preview */}
          {getContentPreview()}

          {/* Grouped Activity Indicator */}
          {activity.is_grouped && activity.grouped_count && activity.grouped_count > 1 && (
            <div className="mt-3">
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
                onClick={(e) => {
                  e.stopPropagation()
                  setExpanded(!expanded)
                }}
              >
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    +{activity.grouped_count - 1} more
                  </Badge>
                  <span>similar activities</span>
                  {expanded ? (
                    <ChevronUp className="h-3 w-3" />
                  ) : (
                    <ChevronDown className="h-3 w-3" />
                  )}
                </div>
              </Button>

              {/* Expanded Individual Activities */}
              <AnimatePresence>
                {expanded && activity.grouped_activities && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="mt-3 space-y-2 pl-4 border-l-2 border-muted"
                  >
                    {activity.grouped_activities.map((individualActivity, index) => (
                      <motion.div
                        key={individualActivity.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex-shrink-0">
                          <div className={`p-1.5 rounded-full bg-background border ${getActivityColor(individualActivity.type).replace('text-', 'border-')}`}>
                            {(() => {
                              const IconComponent = getActivityIcon(individualActivity.type)
                              return <IconComponent className={`h-3 w-3 ${getActivityColor(individualActivity.type)}`} />
                            })()}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm">
                            <span className="text-muted-foreground">
                              {new Date(individualActivity.timestamp).toLocaleDateString()} at{" "}
                              {new Date(individualActivity.timestamp).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                          <div className="text-sm mt-1">
                            {individualActivity.data.qubot && (
                              <Button
                                variant="link"
                                className="p-0 h-auto text-primary font-medium hover:underline text-sm"
                                onClick={() => onNavigate(`/${individualActivity.data.qubot!.owner}/${individualActivity.data.qubot!.name}`)}
                              >
                                {individualActivity.data.qubot.name}
                              </Button>
                            )}
                            {individualActivity.data.feature && (
                              <Button
                                variant="link"
                                className="p-0 h-auto text-primary font-medium hover:underline text-sm"
                                onClick={() => onNavigate(`/roadmap#feature-${individualActivity.data.feature!.id}`)}
                              >
                                {individualActivity.data.feature.title}
                              </Button>
                            )}
                            {individualActivity.data.user && (
                              <Button
                                variant="link"
                                className="p-0 h-auto text-primary font-medium hover:underline text-sm"
                                onClick={() => onNavigate(`/profile/${individualActivity.data.user!.login}`)}
                              >
                                @{individualActivity.data.user.login}
                              </Button>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

// Loading Skeleton Component
const ActivitySkeleton = () => (
  <div className="space-y-4">
    {Array.from({ length: 5 }).map((_, i) => (
      <div key={i} className="flex gap-4 p-4">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
          <Skeleton className="h-20 w-full rounded-lg" />
        </div>
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
    ))}
  </div>
)

// Empty State Component
const EmptyActivityState = () => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex flex-col items-center justify-center py-16 text-center"
  >
    <div className="p-6 rounded-full bg-muted/30 mb-6">
      <Clock className="h-16 w-16 text-muted-foreground/60" />
    </div>
    <h3 className="text-xl font-semibold mb-3 text-foreground">
      No activity yet
    </h3>
    <p className="text-muted-foreground max-w-md">
      Start creating Qubots, commenting on features, or engaging with the community to see your activity here.
    </p>
  </motion.div>
)

// Main ActivityFeed Component
export default function ActivityFeed({
  username,
  avatar_url,
  showNetworkActivity = false,
  maxItems = 20,
  enableRealTime = false,
  enableGrouping = true,
  className = ""
}: ActivityFeedProps) {
  const navigate = useNavigate()
  const { activities, loading, error, hasMore, loadMore, refresh } = useActivityFeed(username, {
    maxItems,
    enableGrouping,
    enableRealTime,
    avatar_url,
  })

  const [refreshing, setRefreshing] = useState(false)
  const observerRef = useRef<HTMLDivElement>(null)

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          loadMore()
        }
      },
      { threshold: 0.1 }
    )

    if (observerRef.current) {
      observer.observe(observerRef.current)
    }

    return () => observer.disconnect()
  }, [hasMore, loading, loadMore])

  const handleRefresh = async () => {
    setRefreshing(true)
    await refresh()
    setRefreshing(false)
  }

  const handleNavigate = useCallback((path: string) => {
    navigate(path)
  }, [navigate])

  if (error) {
    return (
      <Alert variant="destructive" className={className}>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error loading activity feed</AlertTitle>
        <AlertDescription className="mt-2">
          {error}
          <Button
            variant="outline"
            size="sm"
            className="mt-2 ml-2"
            onClick={handleRefresh}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Try again
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Activity Feed</h2>
          <p className="text-muted-foreground">
            Recent activities and updates from {username}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Real-time indicator */}
      {enableRealTime && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          Live updates enabled
        </div>
      )}

      {/* Activity List */}
      <div className="space-y-1">
        {loading && activities.length === 0 ? (
          <ActivitySkeleton />
        ) : activities.length === 0 ? (
          <EmptyActivityState />
        ) : (
          <AnimatePresence mode="popLayout">
            {activities.map((activity, index) => (
              <motion.div
                key={activity.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{
                  duration: 0.3,
                  delay: index * 0.05,
                  layout: { duration: 0.3 }
                }}
              >
                <ActivityItemComponent
                  activity={activity}
                  onNavigate={handleNavigate}
                />
                {index < activities.length - 1 && (
                  <Separator className="my-1 opacity-50" />
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        )}

        {/* Load More Trigger */}
        {hasMore && (
          <div ref={observerRef} className="py-4">
            {loading && activities.length > 0 && (
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-muted-foreground">
                  Loading more activities...
                </span>
              </div>
            )}
          </div>
        )}

        {/* End of feed indicator */}
        {!hasMore && activities.length > 0 && (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">
              You've reached the end of the activity feed
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

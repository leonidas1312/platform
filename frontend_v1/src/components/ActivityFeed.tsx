"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Loader2, MessageSquare, FolderGit, ThumbsUp, Clock, Code, User, Star } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

type ActivityItem = {
  id: string
  type:
    | "qubot_created"
    | "qubot_updated"
    | "feature_comment"
    | "feature_vote"
    | "post_comment"
    | "post_like"
    | "user_followed"
    | "repo_starred"
  timestamp: string
  data: {
    qubot?: {
      name: string
      owner: string
      description?: string
    }
    feature?: {
      id: string
      title: string
    }
    comment?: {
      content: string
    }
    post?: {
      id: number
      content: string
    }
    followed_user?: {
      login: string
      full_name?: string
    }
    starred_repo?: {
      name: string
      owner: string
      description?: string
    }
  }
}

interface ActivityFeedProps {
  username: string
  avatar_url?: string
}

const API = import.meta.env.VITE_API_BASE;


export default function ActivityFeed({ username, avatar_url }: ActivityFeedProps) {
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  

  // Update the fetchActivity function to include real follow and star activities
  const fetchActivity = async () => {
    setLoading(true)
    try {
      // In a real implementation, you would fetch from an API endpoint
      // For now, we'll simulate activity data

      // Fetch user's repositories to get recent Qubots
      const token = localStorage.getItem("gitea_token")
      if (!token) {
        setLoading(false)
        return
      }

      const reposResponse = await fetch(`${API}/users/${username}/repos`, {
        headers: { Authorization: `token ${token}` },
      })

      if (!reposResponse.ok) {
        throw new Error("Failed to fetch repositories")
      }

      const repos = (await reposResponse.ok) ? await reposResponse.json() : []

      // Fetch user's comments from feature backlog
      const commentsResponse = await fetch(`${API}/features`, {
        headers: { Authorization: `token ${token}` },
      })

      const features = commentsResponse.ok ? await commentsResponse.json() : []

      // Simulate fetching comments for each feature
      let featureComments: any[] = []
      for (const feature of features.slice(0, 3)) {
        const featureCommentsResponse = await fetch(`${API}/features/${feature.id}/comments`, {
          headers: { Authorization: `token ${token}` },
        })

        if (featureCommentsResponse.ok) {
          const comments = await featureCommentsResponse.json()
          const userComments = comments.filter((comment: any) => comment.user.username === username)

          featureComments = [
            ...featureComments,
            ...userComments.map((comment: any) => ({
              id: `feature-comment-${comment.id}`,
              type: "feature_comment" as const,
              timestamp: comment.created_at,
              data: {
                feature: {
                  id: feature.id,
                  title: feature.title,
                },
                comment: {
                  content: comment.content,
                },
              },
            })),
          ]
        }
      }

      // Simulate fetching community posts and comments
      const postsResponse = await fetch(`${API}/community/posts`, {
        headers: { Authorization: `token ${token}` },
      })

      const posts = postsResponse.ok ? await postsResponse.json() : []
      const userPosts = posts.filter((post: any) => post.author.login === username)

      // Create activity items from repos (newest first)
      const repoActivities = repos
        .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5)
        .map((repo: any) => ({
          id: `qubot-${repo.id}`,
          type: "qubot_created" as const,
          timestamp: repo.created_at,
          data: {
            qubot: {
              name: repo.name,
              owner: repo.owner.login,
              description: repo.description,
            },
          },
        }))

      // Create activity items for updated repositories with more accurate detection
      const updatedRepoActivities = repos
        .filter((repo) => {
          // Consider a repo as updated if:
          // 1. It was updated more recently than it was created
          // 2. The update was within the last 30 days
          // 3. The update was at least 1 day after creation (to avoid showing both created and updated for new repos)
          const createdDate = new Date(repo.created_at)
          const updatedDate = new Date(repo.updated_at)
          const thirtyDaysAgo = new Date()
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

          // Calculate days between creation and update
          const daysSinceCreation = (updatedDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24)

          return daysSinceCreation > 1 && updatedDate > thirtyDaysAgo
        })
        .sort((a: any, b: any) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
        .slice(0, 3) // Limit to 3 most recently updated repos
        .map((repo) => ({
          id: `qubot-updated-${repo.id}`,
          type: "qubot_updated" as const,
          timestamp: repo.updated_at,
          data: {
            qubot: {
              name: repo.name,
              owner: repo.owner.login,
              description: repo.description,
            },
          },
        }))

      // Create activity items from posts
      const postActivities = userPosts.map((post: any) => ({
        id: `post-${post.id}`,
        type: "post_comment" as const,
        timestamp: post.created_at,
        data: {
          post: {
            id: post.id,
            content: post.content,
          },
        },
      }))

      // Fetch user activities (follows and stars) from our new API endpoint
      let followActivities: any[] = []
      let starredActivities: any[] = []

      try {
        const activitiesResponse = await fetch(`${API}/users/${username}/activities`, {
          headers: { Authorization: `token ${token}` },
        })

        if (activitiesResponse.ok) {
          const userActivities = await activitiesResponse.json()

          // Process follow activities
          followActivities = userActivities
            .filter((activity: any) => activity.activity_type === "user_followed")
            .map((activity: any) => ({
              id: `follow-${activity.id}`,
              type: "user_followed" as const,
              timestamp: activity.created_at,
              data: {
                followed_user: {
                  login: activity.target_user,
                  full_name: activity.target_user, // We'll use login as fallback
                },
              },
            }))

          // Process star activities
          starredActivities = userActivities
            .filter((activity: any) => activity.activity_type === "repo_starred")
            .map((activity: any) => {
              const [owner, name] = activity.target_repo.split("/")
              return {
                id: `star-${activity.id}`,
                type: "repo_starred" as const,
                timestamp: activity.created_at,
                data: {
                  starred_repo: {
                    name: name,
                    owner: owner,
                    description: "", // We don't have this in the activity record
                  },
                },
              }
            })
        }
      } catch (error) {
        console.error(`Error fetching activities for user ${username}:`, error)
      }

      // Combine all activities and sort by timestamp (newest first)
      const allActivities = [
        ...repoActivities,
        ...updatedRepoActivities,
        ...featureComments,
        ...postActivities,
        ...followActivities,
        ...starredActivities,
      ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

      setActivities(allActivities)
    } catch (error) {
      console.error("Failed to fetch activity:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchActivity()
  }, [username])

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) {
      return `${diffInSeconds} seconds ago`
    }

    const diffInMinutes = Math.floor(diffInSeconds / 60)
    if (diffInMinutes < 60) {
      return `${diffInMinutes} ${diffInMinutes === 1 ? "minute" : "minutes"} ago`
    }

    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) {
      return `${diffInHours} ${diffInHours === 1 ? "hour" : "hours"} ago`
    }

    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) {
      return `${diffInDays} ${diffInDays === 1 ? "day" : "days"} ago`
    }

    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin w-6 h-6 text-primary" />
        <span className="ml-2 text-muted-foreground">Loading activity...</span>
      </div>
    )
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-12 bg-gradient-to-br from-muted/30 to-muted/50 rounded-xl border border-border/30">
        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-muted/50 flex items-center justify-center">
          <Clock className="w-10 h-10 text-muted-foreground opacity-50" />
        </div>
        <h3 className="text-lg font-medium">No recent activity</h3>
        <p className="text-muted-foreground mt-1 mb-6 max-w-md mx-auto">
          Activity will appear here when you create Qubots, comment on features, or interact with the community.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {activities.map((activity, index) => (
        <div key={activity.id}>
          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <Avatar className="h-10 w-10 border border-border/40">
                <AvatarImage
                  src={avatar_url || `/placeholder.svg?height=40&width=40&query=${username}`}
                  alt={username}
                />
                <AvatarFallback>{username.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">{"You"}</span>{" "}
                    {activity.type === "qubot_created" && (
                      <>
                        created a new Qubot repository{" "}
                        <Button
                          variant="link"
                          className="p-0 h-auto text-primary font-medium"
                          onClick={() => navigate(`/${activity.data.qubot?.owner}/${activity.data.qubot?.name}`)}
                        >
                          {activity.data.qubot?.name}
                        </Button>
                      </>
                    )}
                    {activity.type === "qubot_updated" && (
                      <>
                        updated their Qubot repository{" "}
                        <Button
                          variant="link"
                          className="p-0 h-auto text-primary font-medium"
                          onClick={() => navigate(`/${activity.data.qubot?.owner}/${activity.data.qubot?.name}`)}
                        >
                          {activity.data.qubot?.name}
                        </Button>
                      </>
                    )}
                    {activity.type === "feature_comment" && (
                      <>
                        commented on feature{" "}
                        <Button
                          variant="link"
                          className="p-0 h-auto text-primary font-medium"
                          onClick={() => navigate(`/feature-backlog`)}
                        >
                          {activity.data.feature?.title}
                        </Button>
                      </>
                    )}
                    {activity.type === "post_comment" && (
                      <>
                        posted in the{" "}
                        <Button
                          variant="link"
                          className="p-0 h-auto text-primary font-medium"
                          onClick={() => navigate(`/community`)}
                        >
                          community
                        </Button>
                      </>
                    )}
                    {activity.type === "user_followed" && (
                      <>
                        followed{" "}
                        <span className="font-medium text-foreground">{activity.data.followed_user?.login}</span>
                      </>
                    )}
                    {activity.type === "repo_starred" && (
                      <>
                        starred repository{" "}
                        <Button
                          variant="link"
                          className="p-0 h-auto text-primary font-medium"
                          onClick={() =>
                            navigate(`/${activity.data.starred_repo?.owner}/${activity.data.starred_repo?.name}`)
                          }
                        >
                          {activity.data.starred_repo?.name}
                        </Button>
                      </>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{formatDate(activity.timestamp)}</p>
                </div>
                <div className="flex-shrink-0">
                  {activity.type === "qubot_created" && <FolderGit className="h-5 w-5 text-green-500" />}
                  {activity.type === "qubot_updated" && <Code className="h-5 w-5 text-blue-500" />}
                  {activity.type === "feature_comment" && <MessageSquare className="h-5 w-5 text-primary/70" />}
                  {activity.type === "feature_vote" && <ThumbsUp className="h-5 w-5 text-primary/70" />}
                  {activity.type === "post_comment" && <MessageSquare className="h-5 w-5 text-primary/70" />}
                  {activity.type === "post_like" && <ThumbsUp className="h-5 w-5 text-primary/70" />}
                  {activity.type === "user_followed" && <User className="h-5 w-5 text-indigo-500" />}
                  {activity.type === "repo_starred" && <Star className="h-5 w-5 text-amber-500" />}
                </div>
              </div>

              {/* Content preview */}
              {activity.type === "qubot_created" && activity.data.qubot?.description && (
                <div className="bg-muted/30 rounded-md p-3 text-sm">{activity.data.qubot.description}</div>
              )}
              {activity.type === "feature_comment" && activity.data.comment?.content && (
                <div className="bg-muted/30 rounded-md p-3 text-sm">
                  {activity.data.comment.content.length > 150
                    ? `${activity.data.comment.content.substring(0, 150)}...`
                    : activity.data.comment.content}
                </div>
              )}
              {activity.type === "post_comment" && activity.data.post?.content && (
                <div className="bg-muted/30 rounded-md p-3 text-sm">
                  {activity.data.post.content.length > 150
                    ? `${activity.data.post.content.substring(0, 150)}...`
                    : activity.data.post.content}
                </div>
              )}
            </div>
          </div>
          {index < activities.length - 1 && <Separator className="my-4" />}
        </div>
      ))}
    </div>
  )
}

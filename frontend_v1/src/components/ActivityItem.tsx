"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { MessageSquare, FolderGit, ThumbsUp } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"

interface ActivityItemProps {
  username: string
  avatar_url?: string
  type: "qubot_created" | "feature_comment" | "feature_vote" | "post_comment" | "post_like"
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
  }
}

export default function ActivityItem({ username, avatar_url, type, timestamp, data }: ActivityItemProps) {
  const navigate = useNavigate()
  const [expanded, setExpanded] = useState(false)

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

  return (
    <div className="flex gap-4">
      <div className="flex-shrink-0">
        <Avatar className="h-10 w-10 border border-border/40">
          <AvatarImage src={avatar_url || `/placeholder.svg?height=40&width=40&query=${username}`} alt={username} />
          <AvatarFallback>{username.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
      </div>
      <div className="flex-1 space-y-2">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{username}</span>{" "}
              {type === "qubot_created" && (
                <>
                  created a new Qubot repository{" "}
                  <Button
                    variant="link"
                    className="p-0 h-auto text-primary font-medium"
                    onClick={() => navigate(`/${data.qubot?.owner}/${data.qubot?.name}`)}
                  >
                    {data.qubot?.name}
                  </Button>
                </>
              )}
              {type === "feature_comment" && (
                <>
                  commented on feature{" "}
                  <Button
                    variant="link"
                    className="p-0 h-auto text-primary font-medium"
                    onClick={() => navigate(`/feature-backlog`)}
                  >
                    {data.feature?.title}
                  </Button>
                </>
              )}
              {type === "post_comment" && (
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
            </p>
            <p className="text-xs text-muted-foreground mt-1">{formatDate(timestamp)}</p>
          </div>
          <div className="flex-shrink-0">
            {type === "qubot_created" && <FolderGit className="h-5 w-5 text-primary/70" />}
            {type === "feature_comment" && <MessageSquare className="h-5 w-5 text-primary/70" />}
            {type === "feature_vote" && <ThumbsUp className="h-5 w-5 text-primary/70" />}
            {type === "post_comment" && <MessageSquare className="h-5 w-5 text-primary/70" />}
            {type === "post_like" && <ThumbsUp className="h-5 w-5 text-primary/70" />}
          </div>
        </div>

        {/* Content preview */}
        {type === "qubot_created" && data.qubot?.description && (
          <div className="bg-muted/30 rounded-md p-3 text-sm">{data.qubot.description}</div>
        )}
        {type === "feature_comment" && data.comment?.content && (
          <div className="bg-muted/30 rounded-md p-3 text-sm">
            {expanded || data.comment.content.length <= 150
              ? data.comment.content
              : `${data.comment.content.substring(0, 150)}...`}
            {data.comment.content.length > 150 && (
              <Button variant="link" className="p-0 h-auto text-xs text-primary" onClick={() => setExpanded(!expanded)}>
                {expanded ? "Show less" : "Show more"}
              </Button>
            )}
          </div>
        )}
        {type === "post_comment" && data.post?.content && (
          <div className="bg-muted/30 rounded-md p-3 text-sm">
            {expanded || data.post.content.length <= 150
              ? data.post.content
              : `${data.post.content.substring(0, 150)}...`}
            {data.post.content.length > 150 && (
              <Button variant="link" className="p-0 h-auto text-xs text-primary" onClick={() => setExpanded(!expanded)}>
                {expanded ? "Show less" : "Show more"}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

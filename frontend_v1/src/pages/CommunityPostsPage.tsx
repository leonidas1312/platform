/**
 * Community Posts Page
 * 
 * Main page for displaying and creating community posts
 */

import { useState } from "react"
import { MessageSquare, Plus, Heart, MessageCircle, Edit, Trash2, Send } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Layout from "@/components/Layout"
import { formatDistanceToNow } from "date-fns"
import {
  useCommunityPosts,
  useCreatePost,
  useDeletePost,
  usePostComments,
  useCreateComment,
  useToggleLike,
  useLikeCount,
  useLikeStatus,
  type CommunityPost,
  type CreatePostData
} from "@/hooks/use-community"

export default function CommunityPostsPage() {
  const [newPostContent, setNewPostContent] = useState("")
  const [newPostCategory, setNewPostCategory] = useState("general")
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set())
  const [newComments, setNewComments] = useState<Record<string, string>>({})

  const { data: posts, isLoading, error } = useCommunityPosts()
  const createPost = useCreatePost()
  const deletePost = useDeletePost()
  const createComment = useCreateComment()

  const handleCreatePost = async () => {
    if (!newPostContent.trim()) return

    const postData: CreatePostData = {
      content: newPostContent.trim(),
      category: newPostCategory
    }

    createPost.mutate(postData, {
      onSuccess: () => {
        setNewPostContent("")
        setNewPostCategory("general")
        setShowCreateDialog(false)
      }
    })
  }

  const handleDeletePost = (postId: string) => {
    if (confirm("Are you sure you want to delete this post?")) {
      deletePost.mutate(postId)
    }
  }

  const toggleComments = (postId: string) => {
    const newExpanded = new Set(expandedComments)
    if (newExpanded.has(postId)) {
      newExpanded.delete(postId)
    } else {
      newExpanded.add(postId)
    }
    setExpandedComments(newExpanded)
  }

  const handleCreateComment = (postId: string) => {
    const content = newComments[postId]?.trim()
    if (!content) return

    createComment.mutate(
      { postId, data: { content } },
      {
        onSuccess: () => {
          setNewComments(prev => ({ ...prev, [postId]: "" }))
        }
      }
    )
  }

  const PostCard = ({ post }: { post: CommunityPost }) => {
    const { data: comments } = usePostComments(expandedComments.has(post.id) ? post.id : "")
    const { data: likeCount } = useLikeCount(post.id)
    const { data: likeStatus } = useLikeStatus(post.id)
    const toggleLike = useToggleLike()

    const handleLike = () => {
      toggleLike.mutate(post.id)
    }

    return (
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={`/api/avatar/${post.author_username}`} />
                <AvatarFallback>
                  {post.author_username.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{post.author_username}</span>
                  <Badge variant="secondary" className="text-xs">
                    {post.type}
                  </Badge>
                </div>
                <span className="text-sm text-muted-foreground">
                  {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                </span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDeletePost(post.id)}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-sm leading-relaxed whitespace-pre-wrap mb-4">
            {post.content}
          </p>
          
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLike}
              className={`flex items-center gap-2 ${
                likeStatus?.liked ? "text-red-500 hover:text-red-600" : "text-muted-foreground"
              }`}
            >
              <Heart className={`h-4 w-4 ${likeStatus?.liked ? "fill-current" : ""}`} />
              <span>{likeCount?.count || 0}</span>
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleComments(post.id)}
              className="flex items-center gap-2 text-muted-foreground"
            >
              <MessageCircle className="h-4 w-4" />
              <span>{comments?.length || 0}</span>
            </Button>
          </div>

          {expandedComments.has(post.id) && (
            <>
              <Separator className="my-4" />
              
              {/* Add Comment */}
              <div className="flex gap-3 mb-4">
                <Textarea
                  placeholder="Write a comment..."
                  value={newComments[post.id] || ""}
                  onChange={(e) => setNewComments(prev => ({ ...prev, [post.id]: e.target.value }))}
                  className="min-h-[80px]"
                />
                <Button
                  onClick={() => handleCreateComment(post.id)}
                  disabled={!newComments[post.id]?.trim() || createComment.isPending}
                  size="sm"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>

              {/* Comments List */}
              <div className="space-y-3">
                {comments?.map((comment) => (
                  <div key={comment.id} className="flex gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={`/api/avatar/${comment.username}`} />
                      <AvatarFallback>
                        {comment.username.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">{comment.username}</span>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {comment.content}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <MessageSquare className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Community Posts</h1>
                <p className="text-muted-foreground">
                  Share updates and discuss with the community
                </p>
              </div>
            </div>

            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  New Post
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[525px]">
                <DialogHeader>
                  <DialogTitle>Create New Post</DialogTitle>
                  <DialogDescription>
                    Share something with the community. What's on your mind?
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="category">Category</Label>
                    <Select value={newPostCategory} onValueChange={setNewPostCategory}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">General</SelectItem>
                        <SelectItem value="optimization">Optimization</SelectItem>
                        <SelectItem value="research">Research</SelectItem>
                        <SelectItem value="announcement">Announcement</SelectItem>
                        <SelectItem value="question">Question</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="content">Content</Label>
                    <Textarea
                      id="content"
                      placeholder="What would you like to share?"
                      value={newPostContent}
                      onChange={(e) => setNewPostContent(e.target.value)}
                      className="min-h-[120px]"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="submit"
                    onClick={handleCreatePost}
                    disabled={!newPostContent.trim() || createPost.isPending}
                  >
                    {createPost.isPending ? "Creating..." : "Create Post"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>
              Failed to load community posts: {error.message}
            </AlertDescription>
          </Alert>
        )}

        {/* Posts List */}
        <div>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-muted rounded-full" />
                      <div className="space-y-2">
                        <div className="h-4 w-24 bg-muted rounded" />
                        <div className="h-3 w-16 bg-muted rounded" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="h-4 w-full bg-muted rounded" />
                      <div className="h-4 w-3/4 bg-muted rounded" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : posts && posts.length > 0 ? (
            <div>
              {posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          ) : (
            <Card className="text-center py-12">
              <CardContent>
                <MessageSquare className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No posts yet</h3>
                <p className="text-muted-foreground mb-6">
                  Be the first to share something with the community!
                </p>
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Post
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  )
}

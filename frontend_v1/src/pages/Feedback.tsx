"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Layout from "@/components/Layout"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  BookOpen,
  MessageCircle,
  Heart,
  Send,
  Clock,
  TrendingUp,
  Search,
  MoreHorizontal,
  Loader2,
  Trash2,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"

const API = import.meta.env.VITE_API_BASE

// Types
interface User {
  id: number
  login: string
  full_name: string
  avatar_url: string
  email: string
}

// Update the Post interface to include the type field
interface Post {
  id: number
  content: string
  type: "general" | "feature_request" | "question" | "new_qubot"
  author: User
  created_at: string
  likes: number
  comments: number
  isLiked: boolean
}

interface ApiError {
  message: string
}

const Community = () => {
  const { toast } = useToast()
  // Change the initial activeTab state from "feed" to "latest"
  const [activeTab, setActiveTab] = useState("latest")
  // Add a new state variable for the post type after the postText state
  const [postText, setPostText] = useState("")
  const [postType, setPostType] = useState<"general" | "feature_request" | "question" | "new_qubot">("general")
  const [isExpanded, setIsExpanded] = useState(false)
  const [posts, setPosts] = useState<Post[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isPosting, setIsPosting] = useState(false)
  const [activeUsers, setActiveUsers] = useState<User[]>([])
  const [isLoadingUsers, setIsLoadingUsers] = useState(true)
  // Add state for pagination after the other state variables
  const [postsLimit, setPostsLimit] = useState(10)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Fetch current user and authentication status
  useEffect(() => {
    const token = localStorage.getItem("gitea_token")
    if (!token) {
      setIsAuthenticated(false)
      setIsLoading(false)
      return
    }

    const fetchCurrentUser = async () => {
      try {
        const response = await fetch(`${API}/profile`, {
          headers: {
            Authorization: `token ${token}`,
          },
        })

        if (response.ok) {
          const userData = await response.json()
          setCurrentUser(userData)
          setIsAuthenticated(true)
        } else {
          // Token might be invalid
          localStorage.removeItem("token")
          setIsAuthenticated(false)
        }
      } catch (error) {
        console.error("Error fetching user profile:", error)
        toast({
          title: "Error",
          description: "Failed to fetch your profile. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchCurrentUser()
  }, [toast])

  // Fetch posts
  useEffect(() => {
    const fetchPosts = async () => {
      setIsLoading(true)
      try {
        const token = localStorage.getItem("gitea_token")
        const headers: HeadersInit = {}

        if (token) {
          headers["Authorization"] = `token ${token}`
        }

        // CHANGED: Actually fetch from our new backend route
        const response = await fetch(`${API}/community/posts`, { headers })

        if (!response.ok) {
          throw new Error(`Failed to fetch posts: ${response.statusText}`)
        }

        const data = await response.json() // This should be an array of posts
        
        // Add this console log to see what we're receiving
        console.log("Received posts from server:", data)
        
        setPosts(data)
      } catch (error) {
        console.error("Error fetching posts:", error)
        toast({
          title: "Error",
          description: "Failed to load community posts. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchPosts()
  }, [toast])

  // Fetch active users
  useEffect(() => {
    const fetchActiveUsers = async () => {
      setIsLoadingUsers(true)
      try {
        const token = localStorage.getItem("gitea_token")
        const headers: HeadersInit = {
          "Content-Type": "application/json",
        }

        if (token) {
          headers["Authorization"] = `token ${token}`
        }

        // Fetch users from Gitea
        const response = await fetch(`${API}/public-repos`, {
          headers,
        })

        if (!response.ok) {
          throw new Error("Failed to fetch repositories")
        }

        const data = await response.json()

        // Extract unique users from repositories
        const uniqueUsers = new Map()
        if (data.data && Array.isArray(data.data)) {
          data.data.forEach((repo: any) => {
            if (repo.owner && !uniqueUsers.has(repo.owner.id)) {
              uniqueUsers.set(repo.owner.id, {
                id: repo.owner.id,
                login: repo.owner.login,
                full_name: repo.owner.full_name || repo.owner.login,
                avatar_url: repo.owner.avatar_url,
                email: repo.owner.email || "",
              })
            }
          })
        }

        setActiveUsers(Array.from(uniqueUsers.values()))
      } catch (error) {
        console.error("Error fetching active users:", error)
      } finally {
        setIsLoadingUsers(false)
      }
    }

    fetchActiveUsers()
  }, [toast])

  // Update the handlePostSubmit function to include the post type
  const handlePostSubmit = async () => {
    if (!postText.trim()) return

    if (!isAuthenticated) {
      toast({
        title: "Authentication required",
        description: "Please sign in to post in the community",
        variant: "destructive",
      })
      return
    }

    setIsPosting(true)
    try {
      const token = localStorage.getItem("gitea_token")
      if (!token) throw new Error("Missing token")

      // Add this console log to see what we're sending
      console.log("Sending post with type:", postType)

      // CHANGED: Actually POST to our new endpoint:
      const response = await fetch(`${API}/community/posts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `token ${token}`,
        },
        body: JSON.stringify({
          content: postText,
          type: postType,
        }),
      })

      // After receiving the response, add this console log:
      if (response.ok) {
        const createdPost = await response.json()
        console.log("Received post from server:", createdPost)
        
        // Ensure we're explicitly using the type from the response
        setPosts((prevPosts) => [
          {
            id: createdPost.id,
            content: createdPost.content,
            type: createdPost.type || "general", // Make sure we're using the type from the response
            author: {
              id: currentUser?.id ?? 0,
              login: currentUser?.login ?? "",
              full_name: currentUser?.full_name ?? "",
              avatar_url: currentUser?.avatar_url ?? "",
              email: currentUser?.email ?? "",
            },
            created_at: createdPost.created_at,
            likes: createdPost.likes_count || 0,
            comments: createdPost.comments_count || 0,
            isLiked: false,
          },
          ...prevPosts,
        ])

      setPostText("")
      setPostType("general")
      setIsExpanded(false)

      toast({
        title: "Post shared!",
        description: "Your post has been shared with the community",
      })
    }
    } catch (error) {
      console.error("Error creating post:", error)
      toast({
        title: "Error",
        description: String(error),
        variant: "destructive",
      })
    } finally {
      setIsPosting(false)
    }
  }

  // Handle textarea focus
  const handleTextareaFocus = () => {
    if (isAuthenticated) {
      setIsExpanded(true)
    } else {
      toast({
        title: "Authentication required",
        description: "Please sign in to post in the community",
        variant: "destructive",
      })
    }
  }

  // Add the handleCancelPost function to reset the post type as well
  const handleCancelPost = () => {
    setPostText("")
    setPostType("general")
    setIsExpanded(false)
  }

  // Handle like post
  const handleLikePost = async (postId: number) => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication required",
        description: "Please sign in to like posts",
        variant: "destructive",
      })
      return
    }

    try {
      const token = localStorage.getItem("gitea_token")
      if (!token) throw new Error("Authentication token missing")

      // Call the API endpoint to toggle like (similar to feature vote)
      const response = await fetch(`${API}/community/posts/${postId}/like`, {
        method: "POST",
        headers: {
          Authorization: `token ${token}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to like post")
      }

      const data = await response.json()

      // Update the post in the list with the new like count and status
      setPosts(
        posts.map((post) => {
          if (post.id === postId) {
            return {
              ...post,
              likes: data.likes,
              isLiked: data.isLiked,
            }
          }
          return post
        }),
      )
    } catch (error) {
      console.error("Error liking post:", error)
      toast({
        title: "Error",
        description: "Failed to like the post. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Handle deleting a post
  const handleDeletePost = (postId) => {
    setPosts((prevPosts) => prevPosts.filter((post) => post.id !== postId))
  }

  // Handle adding a comment to a post
  const handleAddComment = async (postId: number, commentText: string) => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication required",
        description: "Please sign in to comment on posts",
        variant: "destructive",
      })
      return
    }

    if (!commentText.trim()) return

    try {
      const token = localStorage.getItem("gitea_token")
      if (!token) throw new Error("Authentication token missing")

      const response = await fetch(`${API}/community/posts/${postId}/comments`, {
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
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to add comment")
      }

      const newComment = await response.json()

      // Update the comment count in the post
      setPosts((prev) => prev.map((post) => (post.id === postId ? { ...post, comments: post.comments + 1 } : post)))

      toast({
        title: "Comment added",
        description: "Your comment has been added to the post",
      })

      return newComment
    } catch (error) {
      console.error("Error adding comment:", error)
      toast({
        title: "Error",
        description: "Failed to add comment. Please try again.",
        variant: "destructive",
      })
      return null
    }
  }

  // Filter posts based on search query
  const filteredPosts = posts.filter(
    (post) =>
      post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.author.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.author.login.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  // Format date for display
  const formatDate = (dateString: string): string => {
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

    return date.toLocaleDateString()
  }

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px"
    }
  }, [postText])

  return (
    <Layout>
      <div className="container mx-auto px-4 py-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <Badge variant="outline" className="mb-4 px-3 py-1 text-sm bg-primary/10 border-primary/20">
            Join the Rastion community
          </Badge>

          <h1 className="text-4xl md:text-5xl font-bold mb-4">Feedback</h1>
          <p className="text-xl text-foreground/70 max-w-3xl mx-auto">
            Connect with optimization enthusiasts, share ideas, and post features you would like to see at Rastion.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-12"
        >
          <div className="flex flex-col md:flex-row gap-8 items-start">
            <div className="w-full md:w-3/4">
              {/* Post creation card */}
              <Card className="mb-6 overflow-hidden">
                <CardContent className="pt-6">
                  <div className="flex gap-3">
                    <Avatar className="w-10 h-10">
                      {currentUser && currentUser.avatar_url ? (
                        <AvatarImage src={currentUser.avatar_url || "/placeholder.svg"} alt={currentUser.full_name} />
                      ) : (
                        <AvatarFallback>{currentUser ? currentUser.full_name.charAt(0) : "G"}</AvatarFallback>
                      )}
                    </Avatar>
                    {/* Update the textarea section in the render function to include post type selection */}
                    <div className="flex-1">
                      <Textarea
                        ref={textareaRef}
                        placeholder={
                          isAuthenticated ? "Share a quick thought or update..." : "Sign in to post in the community..."
                        }
                        value={postText}
                        onChange={(e) => setPostText(e.target.value)}
                        onFocus={handleTextareaFocus}
                        className="min-h-[40px] resize-none border-none shadow-none focus-visible:ring-0 p-0 text-base"
                        maxLength={5000}
                        disabled={!isAuthenticated || isPosting}
                      />

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-3"
                          >
                            <div className="flex flex-col space-y-3">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">Post type:</span>
                                <div className="flex flex-wrap gap-2">
                                  <Badge
                                    variant={postType === "general" ? "default" : "outline"}
                                    className="cursor-pointer"
                                    onClick={() => setPostType("general")}
                                  >
                                    General
                                  </Badge>
                                  <Badge
                                    variant={postType === "feature_request" ? "default" : "outline"}
                                    className="cursor-pointer"
                                    onClick={() => setPostType("feature_request")}
                                  >
                                    Feature Request
                                  </Badge>
                                  <Badge
                                    variant={postType === "question" ? "default" : "outline"}
                                    className="cursor-pointer"
                                    onClick={() => setPostType("question")}
                                  >
                                    Question
                                  </Badge>
                                  <Badge
                                    variant={postType === "new_qubot" ? "default" : "outline"}
                                    className="cursor-pointer"
                                    onClick={() => setPostType("new_qubot")}
                                  >
                                    New Qubot
                                  </Badge>
                                </div>
                              </div>
                              <div className="flex items-center justify-end">
                                <span className="text-xs text-muted-foreground mr-2">{postText.length}/5000</span>
                                <Button variant="ghost" size="sm" onClick={handleCancelPost} disabled={isPosting}>
                                  Cancel
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={handlePostSubmit}
                                  disabled={!postText.trim() || isPosting}
                                  className="gap-1 ml-2"
                                >
                                  {isPosting ? (
                                    <>
                                      <Loader2 size={14} className="animate-spin" />
                                      Posting...
                                    </>
                                  ) : (
                                    <>
                                      <Send size={14} />
                                      Post
                                    </>
                                  )}
                                </Button>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Feed tabs */}
              <Tabs defaultValue="latest" value={activeTab} onValueChange={setActiveTab} className="w-full">
                <div className="flex justify-between items-center mb-4">
                  <TabsList className="grid grid-cols-2">
                    <TabsTrigger value="latest" className="flex items-center gap-1.5">
                      <Clock size={16} />
                      <span>Latest</span>
                    </TabsTrigger>
                    <TabsTrigger value="trending" className="flex items-center gap-1.5">
                      <TrendingUp size={16} />
                      <span>Trending</span>
                    </TabsTrigger>
                  </TabsList>

                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search posts..."
                      className="w-[200px] pl-8 h-9"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>

                {/* Latest tab - sorted by creation date */}
                <TabsContent value="latest" className="space-y-4 mt-2">
                  {isLoading ? (
                    // Loading skeletons
                    Array(3)
                      .fill(0)
                      .map((_, index) => (
                        <Card key={index} className="overflow-hidden">
                          <CardHeader className="pb-3 pt-4">
                            <div className="flex justify-between items-start">
                              <div className="flex items-center gap-3">
                                <Skeleton className="h-10 w-10 rounded-full" />
                                <div>
                                  <Skeleton className="h-4 w-32 mb-2" />
                                  <Skeleton className="h-3 w-24" />
                                </div>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="pb-3">
                            <Skeleton className="h-4 w-full mb-2" />
                            <Skeleton className="h-4 w-3/4" />
                          </CardContent>
                          <CardFooter className="flex justify-between py-3 border-t">
                            <div className="flex items-center gap-6">
                              <Skeleton className="h-8 w-16" />
                              <Skeleton className="h-8 w-16" />
                              <Skeleton className="h-8 w-16" />
                            </div>
                            <Skeleton className="h-8 w-8" />
                          </CardFooter>
                        </Card>
                      ))
                  ) : filteredPosts.length > 0 ? (
                    <>
                      {[...filteredPosts]
                        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                        .slice(0, postsLimit)
                        .map((post) => (
                          <PostCard
                            key={post.id}
                            post={post}
                            currentUser={currentUser}
                            onLike={handleLikePost}
                            formatDate={formatDate}
                            onDelete={handleDeletePost}
                          />
                        ))}

                      {filteredPosts.length > postsLimit && (
                        <Button
                          variant="outline"
                          className="w-full mt-4"
                          onClick={() => setPostsLimit((prev) => prev + 10)}
                        >
                          Load more
                        </Button>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-muted-foreground">No posts yet. Be the first to post!</p>
                    </div>
                  )}
                </TabsContent>

                {/* Trending tab - sorted by likes */}
                <TabsContent value="trending" className="space-y-4 mt-2">
                  {isLoading ? (
                    // Loading skeletons
                    Array(3)
                      .fill(0)
                      .map((_, index) => (
                        <Card key={index} className="overflow-hidden">
                          <CardHeader className="pb-3 pt-4">
                            <div className="flex justify-between items-start">
                              <div className="flex items-center gap-3">
                                <Skeleton className="h-10 w-10 rounded-full" />
                                <div>
                                  <Skeleton className="h-4 w-32 mb-2" />
                                  <Skeleton className="h-3 w-24" />
                                </div>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="pb-3">
                            <Skeleton className="h-4 w-full mb-2" />
                            <Skeleton className="h-4 w-3/4" />
                          </CardContent>
                          <CardFooter className="flex justify-between py-3 border-t">
                            <div className="flex items-center gap-6">
                              <Skeleton className="h-8 w-16" />
                              <Skeleton className="h-8 w-16" />
                              <Skeleton className="h-8 w-16" />
                            </div>
                            <Skeleton className="h-8 w-8" />
                          </CardFooter>
                        </Card>
                      ))
                  ) : filteredPosts.length > 0 ? (
                    <>
                      {[...filteredPosts]
                        .sort((a, b) => b.likes - a.likes)
                        .slice(0, postsLimit)
                        .map((post) => (
                          <PostCard
                            key={post.id}
                            post={post}
                            currentUser={currentUser}
                            onLike={handleLikePost}
                            formatDate={formatDate}
                            onDelete={handleDeletePost}
                          />
                        ))}

                      {filteredPosts.length > postsLimit && (
                        <Button
                          variant="outline"
                          className="w-full mt-4"
                          onClick={() => setPostsLimit((prev) => prev + 10)}
                        >
                          Load more
                        </Button>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-muted-foreground">No trending posts yet. Be the first to post!</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>

            <div className="w-full md:w-1/4 space-y-6">
              {/* Community guidelines card */}
              <Card>
                <CardHeader className="pb-3">
                  <h3 className="font-medium flex items-center gap-2">
                    <BookOpen size={16} />
                    Community Guidelines
                  </h3>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-sm">• Be respectful and constructive</p>
                  <p className="text-sm">• Share knowledge and insights</p>
                  <p className="text-sm">• Keep discussions on topic</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </motion.div>
      </div>
    </Layout>
  )

  async function handleDeletePostFromParent(postId: number) {
    try {
      const token = localStorage.getItem("gitea_token")
      if (!token) {
        toast({
          title: "Authentication required",
          description: "Please sign in to delete posts",
          variant: "destructive",
        })
        return
      }

      const response = await fetch(`${API}/community/posts/${postId}`, {
        method: "DELETE",
        headers: {
          Authorization: `token ${token}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to delete post")
      }

      // Remove the post from the list
      setPosts((prevPosts) => prevPosts.filter((post) => post.id !== postId))

      toast({
        title: "Post deleted",
        description: "Your post has been deleted successfully",
      })
    } catch (error) {
      console.error("Error deleting post:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to delete post. Please try again.",
        variant: "destructive",
      })
    }
  }
}

// Update the PostCard component to include a comment form
const PostCard = ({ post, currentUser, onLike, formatDate, onDelete }) => {
  const [showComments, setShowComments] = useState(false)
  const [comments, setComments] = useState([])
  const [isLoadingComments, setIsLoadingComments] = useState(false)
  const [commentText, setCommentText] = useState("")
  const [isAddingComment, setIsAddingComment] = useState(false)
  const { toast } = useToast()

  // Fetch comments when the comments section is opened
  const fetchComments = async () => {
    setIsLoadingComments(true)
    try {
      const response = await fetch(`${API}/community/posts/${post.id}/comments`)

      if (!response.ok) {
        throw new Error("Failed to fetch comments")
      }

      const data = await response.json()
      setComments(data)
    } catch (error) {
      console.error("Error fetching comments:", error)
      toast({
        title: "Error",
        description: "Failed to load comments. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoadingComments(false)
    }
  }

  // Fetch comments when the comments section is opened
  useEffect(() => {
    let isMounted = true;

    const fetchCommentsWrapper = async () => {
      if (showComments) {
        try {
          await fetchComments();
        } catch (error) {
          console.error("Error in fetchCommentsWrapper:", error);
        }
      }
    };

    fetchCommentsWrapper();

    return () => {
      isMounted = false;
    };
  }, [showComments]);

  // Handle adding a comment
  const handleAddComment = async () => {
    if (!commentText.trim()) return

    setIsAddingComment(true)
    try {
      const token = localStorage.getItem("gitea_token")
      if (!token) {
        toast({
          title: "Authentication required",
          description: "Please sign in to comment on posts",
          variant: "destructive",
        })
        return
      }

      const response = await fetch(`${API}/community/posts/${post.id}/comments`, {
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
      setComments((prev) => [newComment, ...prev])

      // Clear the comment text
      setCommentText("")

      // Update the comment count in the post
      post.comments += 1

      toast({
        title: "Comment added",
        description: "Your comment has been added to the post",
      })
    } catch (error) {
      console.error("Error adding comment:", error)
      toast({
        title: "Error",
        description: "Failed to add comment. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsAddingComment(false)
    }
  }

  // Handle deleting a post
  const handleDeletePost = async (postId) => {
    try {
      const token = localStorage.getItem("gitea_token")
      if (!token) {
        toast({
          title: "Authentication required",
          description: "Please sign in to delete posts",
          variant: "destructive",
        })
        return
      }

      const response = await fetch(`${API}/community/posts/${postId}`, {
        method: "DELETE",
        headers: {
          Authorization: `token ${token}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to delete post")
      }

      // Notify parent component to remove the post from the list
      onDelete && onDelete(postId)

      toast({
        title: "Post deleted",
        description: "Your post has been deleted successfully",
      })
    } catch (error) {
      console.error("Error deleting post:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to delete post. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <Card className="overflow-hidden hover:border-primary/30 transition-all">
        <CardHeader className="pb-3 pt-4">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarImage src={post.author.avatar_url || "/placeholder.svg"} alt={post.author.full_name} />
                <AvatarFallback>{post.author.full_name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-1">
                  <h3 className="font-medium text-base">{post.author.full_name}</h3>
                  <span className="text-xs text-muted-foreground">@{post.author.login}</span>
                </div>
                <div className="text-xs text-foreground/60">{formatDate(post.created_at)}</div>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                  <MoreHorizontal size={16} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {currentUser && currentUser.login === post.author.login && (
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => {
                      if (window.confirm("Are you sure you want to delete this post? This action cannot be undone.")) {
                        handleDeletePost(post.id)
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete post
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent className="pb-3">
          <Badge
            variant="outline"
            className={`mb-2 ${
              post.type === "feature_request"
                ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                : post.type === "question"
                  ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                  : post.type === "new_qubot"
                    ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                    : ""
            }`}
          >
            {post.type === "feature_request"
              ? "Feature Request"
              : post.type === "question"
                ? "Question"
                : post.type === "new_qubot"
                  ? "New Qubot"
                  : "General"}
          </Badge>
          <p className="text-base whitespace-pre-wrap">{post.content}</p>
        </CardContent>
        <CardFooter className="flex justify-between py-3 border-t">
          <div className="flex items-center gap-6">
            <Button
              variant="ghost"
              size="sm"
              className={`flex items-center gap-1.5 h-8 ${post.isLiked ? "text-red-500" : ""}`}
              onClick={() => onLike(post.id)}
            >
              <Heart size={16} className={post.isLiked ? "fill-current" : ""} />
              <span>{post.likes}</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="flex items-center gap-1.5 h-8"
              onClick={() => setShowComments(!showComments)}
            >
              <MessageCircle size={16} />
              <span>{post.comments}</span>
            </Button>
          </div>
        </CardFooter>

        {/* Comments section */}
        {showComments && (
          <div className="px-4 pb-4 border-t pt-4">
            <div className="flex gap-3 mb-4">
              <Avatar className="h-8 w-8">
                {currentUser && currentUser.avatar_url ? (
                  <AvatarImage
                    src={currentUser.avatar_url || "/placeholder.svg"}
                    alt={currentUser.full_name || currentUser.login}
                  />
                ) : (
                  <AvatarFallback>
                    {currentUser ? (currentUser.full_name || currentUser.login).charAt(0).toUpperCase() : "U"}
                  </AvatarFallback>
                )}
              </Avatar>
              <div className="flex-1">
                <Textarea
                  placeholder="Add a comment..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="min-h-[80px] resize-none"
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

            {/* Comments list */}
            {isLoadingComments ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <span className="ml-2 text-sm text-muted-foreground">Loading comments...</span>
              </div>
            ) : comments.length > 0 ? (
              <div className="space-y-4">
                {comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={comment.user.avatar_url || "/placeholder.svg"}
                        alt={comment.user.full_name || comment.user.username}
                      />
                      <AvatarFallback>
                        {(comment.user.full_name || comment.user.username).charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{comment.user.full_name || comment.user.username}</span>
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
        )}
      </Card>
    </motion.div>
  )
}

export default Community

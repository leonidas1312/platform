"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Layout from "../components/Layout"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Users,
  BookOpen,
  MessageCircle,
  Heart,
  Send,
  Sparkles,
  Repeat2,
  Clock,
  TrendingUp,
  Search,
  Bell,
  Bookmark,
  MoreHorizontal,
  ImageIcon,
  LinkIcon,
  Smile,
  Loader2,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Skeleton } from "@/components/ui/skeleton"

// Types
interface User {
  id: number
  login: string
  full_name: string
  avatar_url: string
  email: string
}

interface Post {
  id: number
  content: string
  author: User
  created_at: string
  likes: number
  comments: number
  reposts: number
  isLiked: boolean
  isReposted: boolean
  isBookmarked: boolean
}

interface ApiError {
  message: string
}

const Community = () => {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("feed")
  const [postText, setPostText] = useState("")
  const [isExpanded, setIsExpanded] = useState(false)
  const [posts, setPosts] = useState<Post[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isPosting, setIsPosting] = useState(false)
  const [activeUsers, setActiveUsers] = useState<User[]>([])
  const [isLoadingUsers, setIsLoadingUsers] = useState(true)
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
        const response = await fetch("http://localhost:4000/api/profile", {
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
        const response = await fetch("http://localhost:4000/api/community/posts", { headers })

        if (!response.ok) {
          throw new Error(`Failed to fetch posts: ${response.statusText}`)
        }
  
        const data = await response.json() // This should be an array of posts
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
        const response = await fetch("http://localhost:4000/api/public-repos", {
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

  // Handle post submission
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
  
      // CHANGED: Actually POST to our new endpoint:
      const response = await fetch("http://localhost:4000/api/community/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `token ${token}`,
        },
        body: JSON.stringify({ content: postText }),
      })
  
      if (!response.ok) {
        const errData = await response.json()
        throw new Error(errData.message || "Failed to create post.")
      }
  
      // The server returns the newly created post (DB row).
      const createdPost = await response.json()
  
      // We still need to shape it for the front-end
      // Typically we'd re-fetch osts, or we can patch it in manually:all p
      setPosts((prevPosts) => [
        {
          id: createdPost.id,
          content: createdPost.content,
          // For now, set the user info from the already known user
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
          reposts: createdPost.reposts_count || 0,
          isLiked: false,
          isReposted: false,
          isBookmarked: false,
        },
        ...prevPosts,
      ])
  
      setPostText("")
      setIsExpanded(false)
  
      toast({
        title: "Post shared!",
        description: "Your post has been shared with the community",
      })
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

  // Handle cancel post
  const handleCancelPost = () => {
    setPostText("")
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

    // Optimistic update
    setPosts(
      posts.map((post) => {
        if (post.id === postId) {
          const isLiked = !post.isLiked
          return {
            ...post,
            likes: isLiked ? post.likes + 1 : post.likes - 1,
            isLiked,
          }
        }
        return post
      }),
    )

    // In a real implementation, you would send this to your backend
    // try {
    //   const token = localStorage.getItem('token');
    //   await fetch(`/api/community/posts/${postId}/like`, {
    //     method: 'POST',
    //     headers: {
    //       'Authorization': `token ${token}`
    //     }
    //   });
    // } catch (error) {
    //   console.error('Error liking post:', error);
    //   toast({
    //     title: "Error",
    //     description: "Failed to like the post. Please try again.",
    //     variant: "destructive"
    //   });
    //   // Revert the optimistic update on error
    //   setPosts(prevPosts => prevPosts.map(post => {
    //     if (post.id === postId) {
    //       const isLiked = !post.isLiked;
    //       return {
    //         ...post,
    //         likes: isLiked ? post.likes + 1 : post.likes - 1,
    //         isLiked
    //       };
    //     }
    //     return post;
    //   }));
    // }
  }

  // Handle repost
  const handleRepost = async (postId: number) => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication required",
        description: "Please sign in to repost",
        variant: "destructive",
      })
      return
    }

    // Optimistic update
    setPosts(
      posts.map((post) => {
        if (post.id === postId) {
          const isReposted = !post.isReposted
          return {
            ...post,
            reposts: isReposted ? post.reposts + 1 : post.reposts - 1,
            isReposted,
          }
        }
        return post
      }),
    )

    // In a real implementation, you would send this to your backend
  }

  // Handle bookmark
  const handleBookmark = async (postId: number) => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication required",
        description: "Please sign in to bookmark posts",
        variant: "destructive",
      })
      return
    }

    // Optimistic update
    setPosts(
      posts.map((post) => {
        if (post.id === postId) {
          return {
            ...post,
            isBookmarked: !post.isBookmarked,
          }
        }
        return post
      }),
    )

    toast({
      title: "Post bookmarked",
      description: "You can find this post in your bookmarks",
    })

    // In a real implementation, you would send this to your backend
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
          className="mb-8 text-center"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Community</h1>
          <p className="text-xl text-foreground/70 max-w-3xl mx-auto">
            Connect with optimization enthusiasts, share ideas, and discover collaborative opportunities.
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
                        <AvatarImage src={currentUser.avatar_url} alt={currentUser.full_name} />
                      ) : (
                        <AvatarFallback>{currentUser ? currentUser.full_name.charAt(0) : "G"}</AvatarFallback>
                      )}
                    </Avatar>
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
                        maxLength={280}
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
                            <div className="flex items-center justify-between">
                              <div className="flex gap-2">
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 rounded-full"
                                        disabled={isPosting}
                                      >
                                        <ImageIcon size={18} className="text-primary" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Add image</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>

                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 rounded-full"
                                        disabled={isPosting}
                                      >
                                        <LinkIcon size={18} className="text-primary" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Add link</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>

                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 rounded-full"
                                        disabled={isPosting}
                                      >
                                        <Smile size={18} className="text-primary" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Add emoji</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </div>

                              <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">{postText.length}/280</span>
                                <Button variant="ghost" size="sm" onClick={handleCancelPost} disabled={isPosting}>
                                  Cancel
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={handlePostSubmit}
                                  disabled={!postText.trim() || isPosting}
                                  className="gap-1"
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
              <Tabs defaultValue="feed" value={activeTab} onValueChange={setActiveTab} className="w-full">
                <div className="flex justify-between items-center mb-4">
                  <TabsList className="grid grid-cols-3">
                    <TabsTrigger value="feed" className="flex items-center gap-1.5">
                      <Sparkles size={16} />
                      <span>For You</span>
                    </TabsTrigger>
                    <TabsTrigger value="trending" className="flex items-center gap-1.5">
                      <TrendingUp size={16} />
                      <span>Trending</span>
                    </TabsTrigger>
                    <TabsTrigger value="latest" className="flex items-center gap-1.5">
                      <Clock size={16} />
                      <span>Latest</span>
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

                {/* Feed content */}
                <TabsContent value="feed" className="space-y-4 mt-2">
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
                    filteredPosts.map((post) => (
                      <PostCard
                        key={post.id}
                        post={post}
                        onLike={handleLikePost}
                        onRepost={handleRepost}
                        onBookmark={handleBookmark}
                        formatDate={formatDate}
                      />
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-muted-foreground">No posts found. Be the first to post!</p>
                      {!isAuthenticated && (
                        <Button variant="outline" className="mt-4" onClick={() => (window.location.href = "/login")}>
                          Sign in to post
                        </Button>
                      )}
                    </div>
                  )}
                </TabsContent>

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
                    [...filteredPosts]
                      .sort((a, b) => b.likes - a.likes)
                      .map((post) => (
                        <PostCard
                          key={post.id}
                          post={post}
                          onLike={handleLikePost}
                          onRepost={handleRepost}
                          onBookmark={handleBookmark}
                          formatDate={formatDate}
                        />
                      ))
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-muted-foreground">No trending posts yet. Be the first to post!</p>
                    </div>
                  )}
                </TabsContent>

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
                    [...filteredPosts]
                      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                      .map((post) => (
                        <PostCard
                          key={post.id}
                          post={post}
                          onLike={handleLikePost}
                          onRepost={handleRepost}
                          onBookmark={handleBookmark}
                          formatDate={formatDate}
                        />
                      ))
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-muted-foreground">No posts yet. Be the first to post!</p>
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
                  <p className="text-sm">• Cite sources when applicable</p>
                  <p className="text-sm">• Keep discussions on topic</p>
                </CardContent>
                <CardFooter>
                  <Button variant="ghost" size="sm" className="w-full">
                    Read Full Guidelines
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        </motion.div>
      </div>
    </Layout>
  )
}

// Post Card Component
const PostCard = ({ post, onLike, onRepost, onBookmark, formatDate }) => {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <Card className="overflow-hidden hover:border-primary/30 transition-all">
        <CardHeader className="pb-3 pt-4">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarImage src={post.author.avatar_url} alt={post.author.full_name} />
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
                <DropdownMenuItem>Copy link</DropdownMenuItem>
                <DropdownMenuItem>Report post</DropdownMenuItem>
                <DropdownMenuItem>Mute user</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent className="pb-3">
          <p className="text-base">{post.content}</p>
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
              className={`flex items-center gap-1.5 h-8 ${post.isReposted ? "text-green-500" : ""}`}
              onClick={() => onRepost(post.id)}
            >
              <Repeat2 size={16} />
              <span>{post.reposts}</span>
            </Button>
            <Button variant="ghost" size="sm" className="flex items-center gap-1.5 h-8">
              <MessageCircle size={16} />
              <span>{post.comments}</span>
            </Button>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className={`h-8 ${post.isBookmarked ? "text-blue-500" : ""}`}
            onClick={() => onBookmark(post.id)}
          >
            <Bookmark size={16} className={post.isBookmarked ? "fill-current" : ""} />
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  )
}

export default Community


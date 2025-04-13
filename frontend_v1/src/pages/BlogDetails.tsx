import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import {
  ArrowLeft,
  Calendar,
  Clock,
  Heart,
  MessageSquare,
  Share2,
  Loader2,
  AlertCircle,
  User,
  LinkIcon,
  Github,
  Send,
} from "lucide-react"
import Layout from "@/components/Layout"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { toast } from "@/components/ui/use-toast"

interface BlogAuthor {
  name: string
  avatar?: string
  username: string
  full_name?: string
}

interface BlogOptimizer {
  name: string
  repoUrl: string
}

interface BlogProblem {
  name: string
  description: string
}

interface BlogComment {
  id: string
  content: string
  author: BlogAuthor
  date: string
  likes: number
}

interface BlogPost {
  id: string
  title: string
  content: string
  summary: string
  author: BlogAuthor
  date: string
  tags: string[]
  imageUrl?: string
  category: string
  readTime: number
  likes: number
  comments: number
  optimizer?: BlogOptimizer
  problem?: BlogProblem
}

const BlogDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [blog, setBlog] = useState<BlogPost | null>(null)
  const [comments, setComments] = useState<BlogComment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [newComment, setNewComment] = useState("")
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [hasLiked, setHasLiked] = useState(false)
  const [relatedBlogs, setRelatedBlogs] = useState<BlogPost[]>([])

  // Check if user is authenticated
  useEffect(() => {
    const token = localStorage.getItem("gitea_token")
    setIsAuthenticated(!!token)
  }, [])

  // Fetch blog post data
  useEffect(() => {
    const fetchBlogPost = async () => {
      if (!id) return

      setIsLoading(true)
      setError(null)

      try {
        const token = localStorage.getItem("gitea_token")
        const headers: HeadersInit = {}

        if (token) {
          headers["Authorization"] = `token ${token}`
        }

        // Fetch blog post from the API
        const response = await fetch(`http://localhost:4000/api/blogs/${id}`, { headers })

        if (!response.ok) {
          throw new Error("Failed to fetch blog post")
        }

        const data = await response.json()

        // Transform the data to match our BlogPost interface
        const formattedBlog: BlogPost = {
          id: data.id,
          title: data.title,
          content: data.content,
          summary: data.summary || data.content.substring(0, 150) + "...",
          author: {
            name: data.author.full_name || data.author.username,
            username: data.author.username,
            avatar: data.author.avatar_url,
            full_name: data.author.full_name,
          },
          date: new Date(data.created_at).toISOString().split("T")[0],
          tags: data.tags || [],
          imageUrl: data.image_url,
          category: data.category,
          readTime: data.read_time || Math.ceil(data.content.length / 1000),
          likes: data.likes || 0,
          comments: data.comments_count || 0,
          optimizer: data.optimizer
            ? {
                name: data.optimizer.name,
                repoUrl: data.optimizer.repo_url,
              }
            : undefined,
          problem: data.problem
            ? {
                name: data.problem.name,
                description: data.problem.description,
              }
            : undefined,
        }

        setBlog(formattedBlog)
        setHasLiked(data.has_liked || false)

        // Fetch comments
        fetchComments(id)

        // Fetch related blogs
        fetchRelatedBlogs(data.category, data.tags, id)
      } catch (err) {
        console.error("Error fetching blog post:", err)
        setError("Failed to load blog post. Please try again later.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchBlogPost()
  }, [id])

  // Fetch comments for the blog post
  const fetchComments = async (blogId: string) => {
    return
    try {
      const token = localStorage.getItem("gitea_token")
      const headers: HeadersInit = {}

      if (token) {
        headers["Authorization"] = `token ${token}`
      }

      const response = await fetch(`http://localhost:4000/api/blogs/${blogId}/comments`, { headers })

      if (!response.ok) {
        throw new Error("Failed to fetch comments")
      }

      const data = await response.json()

      // Transform the data to match our BlogComment interface
      const formattedComments: BlogComment[] = data.map((comment: any) => ({
        id: comment.id,
        content: comment.content,
        author: {
          name: comment.author.full_name || comment.author.username,
          username: comment.author.username,
          avatar: comment.author.avatar_url,
        },
        date: new Date(comment.created_at).toISOString().split("T")[0],
        likes: comment.likes || 0,
      }))

      setComments(formattedComments)
    } catch (err) {
      console.error("Error fetching comments:", err)
      // We don't set the main error state here to still show the blog post
      toast({
        title: "Error",
        description: "Failed to load comments. Please try again later.",
        variant: "destructive",
      })
    }
  }

  // Fetch related blogs based on category and tags
  const fetchRelatedBlogs = async (category: string, tags: string[], currentBlogId: string) => {
    try {
      const token = localStorage.getItem("gitea_token")
      const headers: HeadersInit = {}

      if (token) {
        headers["Authorization"] = `token ${token}`
      }

      // In a real app, you would have an endpoint that returns related blogs
      // For now, we'll just fetch all blogs and filter them client-side
      const response = await fetch("http://localhost:4000/api/blogs", { headers })

      if (!response.ok) {
        throw new Error("Failed to fetch related blogs")
      }

      const data = await response.json()

      // Filter and transform the data
      const formattedBlogs: BlogPost[] = data
        .filter((blog: any) => blog.id !== currentBlogId) // Exclude current blog
        .filter((blog: any) => {
          // Include if same category or has at least one matching tag
          return blog.category === category || (blog.tags && tags.some((tag: string) => blog.tags.includes(tag)))
        })
        .map((blog: any) => ({
          id: blog.id,
          title: blog.title,
          content: blog.content,
          summary: blog.summary || blog.content.substring(0, 150) + "...",
          author: {
            name: blog.author.full_name || blog.author.username,
            username: blog.author.username,
            avatar: blog.author.avatar_url,
          },
          date: new Date(blog.created_at).toISOString().split("T")[0],
          tags: blog.tags || [],
          imageUrl: blog.image_url,
          category: blog.category,
          readTime: blog.read_time || Math.ceil(blog.content.length / 1000),
          likes: blog.likes || 0,
          comments: blog.comments_count || 0,
        }))

      // Limit to 3 related blogs
      setRelatedBlogs(formattedBlogs.slice(0, 3))
    } catch (err) {
      console.error("Error fetching related blogs:", err)
      // We don't set the main error state here
    }
  }

  // Handle liking a blog post
  const handleLikeBlog = async () => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication required",
        description: "Please log in to like blog posts.",
        variant: "destructive",
      })
      return
    }

    try {
      const token = localStorage.getItem("gitea_token")

      // Call API to like/unlike the blog
      const method = hasLiked ? "DELETE" : "POST"
      const response = await fetch(`http://localhost:4000/api/blogs/${id}/like`, {
        method,
        headers: {
          Authorization: `token ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to ${hasLiked ? "unlike" : "like"} blog post`)
      }

      // Update the blog state with the updated like count
      setBlog((prevBlog) => {
        if (!prevBlog) return null
        return {
          ...prevBlog,
          likes: hasLiked ? prevBlog.likes - 1 : prevBlog.likes + 1,
        }
      })

      // Toggle the hasLiked state
      setHasLiked(!hasLiked)

      toast({
        title: "Success",
        description: `You ${hasLiked ? "unliked" : "liked"} this blog post.`,
      })
    } catch (error) {
      console.error("Error liking blog:", error)
      toast({
        title: "Error",
        description: `Failed to ${hasLiked ? "unlike" : "like"} blog post. Please try again.`,
        variant: "destructive",
      })
    }
  }

  // Handle submitting a new comment
  const handleSubmitComment = async () => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication required",
        description: "Please log in to comment on blog posts.",
        variant: "destructive",
      })
      return
    }

    if (!newComment.trim()) {
      toast({
        title: "Empty comment",
        description: "Please enter a comment before submitting.",
        variant: "destructive",
      })
      return
    }

    setIsSubmittingComment(true)

    try {
      const token = localStorage.getItem("gitea_token")

      // Call API to submit comment
      const response = await fetch(`http://localhost:4000/api/blogs/${id}/comments`, {
        method: "POST",
        headers: {
          Authorization: `token ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: newComment }),
      })

      if (!response.ok) {
        throw new Error("Failed to submit comment")
      }

      const commentData = await response.json()

      // Clear the comment input
      setNewComment("")

      // Refresh comments to include the new one
      fetchComments(id as string)

      // Update the blog's comment count
      setBlog((prevBlog) => {
        if (!prevBlog) return null
        return {
          ...prevBlog,
          comments: prevBlog.comments + 1,
        }
      })

      toast({
        title: "Comment submitted",
        description: "Your comment has been posted successfully.",
      })
    } catch (error) {
      console.error("Error submitting comment:", error)
      toast({
        title: "Error",
        description: "Failed to submit comment. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmittingComment(false)
    }
  }

  // Handle sharing the blog post
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: blog?.title,
          text: blog?.summary,
          url: window.location.href,
        })
      } catch (error) {
        console.error("Error sharing:", error)
      }
    } else {
      // Fallback for browsers that don't support the Web Share API
      navigator.clipboard.writeText(window.location.href)
      toast({
        title: "Link copied",
        description: "Blog post link copied to clipboard.",
      })
    }
  }

  // Format the blog content with proper paragraphs
  const formatContent = (content: string) => {
    return content.split("\n\n").map((paragraph, index) => (
      <p key={index} className="mb-4">
        {paragraph}
      </p>
    ))
  }

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto py-24 px-4 md:px-6">
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Loading blog post...</p>
          </div>
        </div>
      </Layout>
    )
  }

  if (error || !blog) {
    return (
      <Layout>
        <div className="container mx-auto py-24 px-4 md:px-6">
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error || "Blog post not found"}</AlertDescription>
          </Alert>
          <Button onClick={() => navigate("/blogs")} variant="outline" className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Blogs
          </Button>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <main className="min-h-screen bg-background">
        <div className="container mx-auto py-24 px-4 md:px-6">
          {/* Back button */}
          <Button
            onClick={() => navigate("/blogs")}
            variant="ghost"
            className="mb-6 hover:bg-transparent hover:text-primary"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Blogs
          </Button>

          <article className="max-w-4xl mx-auto">
            {/* Blog header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-8"
            >
              <div className="flex items-center gap-2 mb-4">
                <Badge variant="outline">{blog.category}</Badge>
                <div className="flex items-center text-muted-foreground text-sm">
                  <Calendar className="h-3 w-3 mr-1" />
                  <span>{new Date(blog.date).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center text-muted-foreground text-sm">
                  <Clock className="h-3 w-3 mr-1" />
                  <span>{blog.readTime} min read</span>
                </div>
              </div>

              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-4">{blog.title}</h1>

              <div className="flex items-center gap-3 mb-6">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={blog.author.avatar || "/placeholder.svg"} alt={blog.author.name} />
                  <AvatarFallback>{blog.author.name.substring(0, 2)}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">{blog.author.name}</div>
                  <div className="text-sm text-muted-foreground">@{blog.author.username}</div>
                </div>
              </div>

              {blog.imageUrl && (
                <div className="aspect-video w-full overflow-hidden rounded-lg mb-8">
                  <img
                    src={blog.imageUrl || "/placeholder.svg"}
                    alt={blog.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </motion.div>

            {/* Blog content */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="prose prose-lg max-w-none mb-8"
            >
              {formatContent(blog.content)}
            </motion.div>

            {/* Tags */}
            {blog.tags.length > 0 && (
              <div className="mb-8">
                <h3 className="text-lg font-medium mb-2">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {blog.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="cursor-pointer hover:bg-secondary/80">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Optimizer and Problem details */}
            {(blog.optimizer || blog.problem) && (
              <div className="bg-muted/30 rounded-lg p-6 mb-8">
                <h3 className="text-lg font-medium mb-4">Technical Details</h3>

                {blog.optimizer && (
                  <div className="mb-4">
                    <h4 className="font-medium flex items-center gap-2 mb-2">
                      <Github className="h-4 w-4" /> Optimizer
                    </h4>
                    <div className="flex items-center gap-2 ml-6">
                      <span className="font-medium">{blog.optimizer.name}</span>
                      {blog.optimizer.repoUrl && (
                        <Button variant="ghost" size="sm" className="h-6 px-2" asChild>
                          <a href={blog.optimizer.repoUrl} target="_blank" rel="noopener noreferrer">
                            <LinkIcon className="h-3 w-3 mr-1" />
                            Repository
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                )}

                {blog.problem && (
                  <div>
                    <h4 className="font-medium flex items-center gap-2 mb-2">
                      <AlertCircle className="h-4 w-4" /> Problem Description
                    </h4>
                    <div className="ml-6">
                      <div className="font-medium">{blog.problem.name}</div>
                      <p className="text-muted-foreground mt-1">{blog.problem.description}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Action buttons */}
            <div className="flex items-center justify-between py-4 border-t border-b mb-8">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" className="flex items-center gap-2" onClick={handleLikeBlog}>
                  <Heart className={`h-5 w-5 ${hasLiked ? "fill-primary text-primary" : ""}`} />
                  <span>{blog.likes}</span>
                </Button>
                
              </div>
              
            </div>

            {/* Author info */}
            <div className="bg-muted/30 rounded-lg p-6 mb-8">
              <div className="flex items-start gap-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={blog.author.avatar || "/placeholder.svg"} alt={blog.author.name} />
                  <AvatarFallback>{blog.author.name.substring(0, 2)}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-medium text-lg">About the Author</h3>
                  <p className="text-muted-foreground mb-2">{blog.author.name}</p>
                  <Button variant="outline" size="sm" asChild>
                    <a href={`/profile/${blog.author.username}`}>
                      <User className="h-4 w-4 mr-2" />
                      View Profile
                    </a>
                  </Button>
                </div>
              </div>
            </div>

            
          </article>
        </div>
      </main>
    </Layout>
  )
}

export default BlogDetailPage

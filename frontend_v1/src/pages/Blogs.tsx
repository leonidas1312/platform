"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { Search, Filter, Clock, ArrowRight, Loader2, Lock, X, Heart, MessageSquare, Share2 } from "lucide-react"
import Layout from "@/components/Layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { toast } from "@/components/ui/use-toast"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

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

// Available categories for blog posts
const categories = [
  "All Categories",
  "Quantum Optimization",
  "Financial Optimization",
  "Energy Optimization",
  "Supply Chain Optimization",
  "Machine Learning Optimization",
  "Scheduling Optimization",
]

const BlogsPage = () => {
  const navigate = useNavigate()
  const [blogs, setBlogs] = useState<BlogPost[]>([])
  const [filteredBlogs, setFilteredBlogs] = useState<BlogPost[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All Categories")
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [activeTab, setActiveTab] = useState("all")
  const [currentUser, setCurrentUser] = useState<any>(null)

  // Form state for new blog
  const [newBlog, setNewBlog] = useState({
    title: "",
    summary: "",
    content: "",
    category: "",
    imageUrl: "",
    tags: [] as string[],
    optimizerName: "",
    optimizerRepo: "",
    problemName: "",
    problemDescription: "",
  })
  const [tagInput, setTagInput] = useState("")

  // Check if user is authenticated and get user data
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

  // Fetch blogs from API
  useEffect(() => {
    fetchBlogs()
  }, [])

  const fetchBlogs = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const token = localStorage.getItem("gitea_token")
      const headers: HeadersInit = {}

      if (token) {
        headers["Authorization"] = `token ${token}`
      }

      // Fetch blogs from the API
      // This endpoint would need to be implemented on the server
      const response = await fetch("http://localhost:4000/api/blogs", { headers })

      if (!response.ok) {
        throw new Error("Failed to fetch blogs")
      }

      const data = await response.json()

      // Transform the data if needed to match our BlogPost interface
      const formattedBlogs: BlogPost[] = data.map((blog: any) => ({
        id: blog.id,
        title: blog.title,
        content: blog.content,
        summary: blog.summary || blog.content.substring(0, 150) + "...",
        author: {
          name: blog.author.full_name || blog.author.username,
          username: blog.author.username,
          avatar: blog.author.avatar_url,
          full_name: blog.author.full_name,
        },
        date: new Date(blog.created_at).toISOString().split("T")[0],
        tags: blog.tags || [],
        imageUrl: blog.image_url,
        category: blog.category,
        readTime: blog.read_time || Math.ceil(blog.content.length / 1000),
        likes: blog.likes || 0,
        comments: blog.comments || 0,
        optimizer: blog.optimizer
          ? {
              name: blog.optimizer.name,
              repoUrl: blog.optimizer.repo_url,
            }
          : undefined,
        problem: blog.problem
          ? {
              name: blog.problem.name,
              description: blog.problem.description,
            }
          : undefined,
      }))

      setBlogs(formattedBlogs)
      setFilteredBlogs(formattedBlogs)
    } catch (err) {
      console.error("Error fetching blogs:", err)
      setError("Failed to load blog posts. Please try again later.")
    } finally {
      setIsLoading(false)
    }
  }

  // Filter blogs based on search, category, and tag
  useEffect(() => {
    let result = [...blogs]

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (blog) =>
          blog.title.toLowerCase().includes(query) ||
          blog.content.toLowerCase().includes(query) ||
          blog.tags.some((tag) => tag.toLowerCase().includes(query)) ||
          blog.author.name.toLowerCase().includes(query),
      )
    }

    // Filter by category
    if (selectedCategory !== "All Categories") {
      result = result.filter((blog) => blog.category === selectedCategory)
    }

    // Filter by tag
    if (selectedTag) {
      result = result.filter((blog) => blog.tags.includes(selectedTag))
    }

    // Sort based on active tab
    if (activeTab === "popular") {
      result = [...result].sort((a, b) => b.likes - a.likes)
    } else if (activeTab === "recent") {
      result = [...result].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    }

    setFilteredBlogs(result)
  }, [blogs, searchQuery, selectedCategory, selectedTag, activeTab])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    // Search is already handled by the useEffect
  }

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value)
  }

  const handleTagClick = (tag: string) => {
    setSelectedTag(tag === selectedTag ? null : tag)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setNewBlog((prev) => ({ ...prev, [name]: value }))
  }

  const handleTagInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTagInput(e.target.value)
  }

  const addTag = () => {
    if (tagInput.trim() && !newBlog.tags.includes(tagInput.trim())) {
      setNewBlog((prev) => ({ ...prev, tags: [...prev.tags, tagInput.trim()] }))
      setTagInput("")
    }
  }

  const removeTag = (tagToRemove: string) => {
    setNewBlog((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }))
  }

  const handleLikeBlog = async (blogId: string) => {
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

      // Call API to like the blog
      const response = await fetch(`http://localhost:4000/api/blogs/${blogId}/like`, {
        method: "POST",
        headers: {
          Authorization: `token ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error("Failed to like blog post")
      }

      // Update the blogs state with the updated like count
      setBlogs((prevBlogs) => prevBlogs.map((blog) => (blog.id === blogId ? { ...blog, likes: blog.likes + 1 } : blog)))

      toast({
        title: "Success",
        description: "You liked this blog post.",
      })
    } catch (error) {
      console.error("Error liking blog:", error)
      toast({
        title: "Error",
        description: "Failed to like blog post. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleCreateBlog = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isAuthenticated) {
      toast({
        title: "Authentication required",
        description: "Please log in to create a blog post.",
        variant: "destructive",
      })
      navigate("/auth")
      return
    }

    // Validate required fields
    if (!newBlog.title || !newBlog.content || !newBlog.summary || !newBlog.category) {
      toast({
        title: "Required fields missing",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const token = localStorage.getItem("gitea_token")

      // Prepare blog data for API
      const blogData = {
        title: newBlog.title,
        content: newBlog.content,
        summary: newBlog.summary,
        category: newBlog.category,
        image_url: newBlog.imageUrl,
        tags: JSON.stringify(newBlog.tags),
        optimizer_name: newBlog.optimizerName,
        optimizer_url: newBlog.optimizerRepo,
        problem_name: newBlog.problemName,
        problem_description: newBlog.problemDescription,
      }

      // Call API to create blog
      const response = await fetch("http://localhost:4000/api/blogs", {
        method: "POST",
        headers: {
          Authorization: `token ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(blogData),
      })

      if (!response.ok) {
        throw new Error("Failed to create blog post")
      }

      const createdBlog = await response.json()

      // Reset form
      setNewBlog({
        title: "",
        summary: "",
        content: "",
        category: "",
        imageUrl: "",
        tags: [],
        optimizerName: "",
        optimizerRepo: "",
        problemName: "",
        problemDescription: "",
      })

      setShowCreateDialog(false)

      // Refresh blogs to include the new one
      fetchBlogs()

      toast({
        title: "Blog post created!",
        description: "Your blog post has been published successfully.",
      })
    } catch (error) {
      console.error("Error creating blog:", error)
      toast({
        title: "Error",
        description: "Failed to create blog post. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
    },
  }

  return (
    <Layout>
      <main className="min-h-screen bg-background">
        <div className="container mx-auto py-24 px-4 md:px-6">
          {/* Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-12 text-center"
          >
            <h1 className="text-4xl font-bold tracking-tight mb-3">Optimization Use Cases</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Explore real-world applications of optimization algorithms solving complex problems. Learn from the
              community and share your own optimization success stories.
            </p>
          </motion.div>

          {/* Filters and Search */}
          <div className="mb-8 flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
              <div className="relative w-full sm:w-64">
                <Select value={selectedCategory} onValueChange={handleCategoryChange}>
                  <SelectTrigger className="w-full">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filter by category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <form onSubmit={handleSearch} className="relative w-full sm:w-64">
                <Input
                  type="search"
                  placeholder="Search blogs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pr-10"
                />
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </form>
            </div>

            <div className="w-full md:w-auto">
              {isAuthenticated ? (
                <Button onClick={() => setShowCreateDialog(true)} className="w-full md:w-auto">
                  Share Your Use Case
                </Button>
              ) : (
                <Button onClick={() => navigate("/auth")} variant="outline" className="w-full md:w-auto">
                  <Lock className="h-4 w-4 mr-2" />
                  Log in to Share
                </Button>
              )}
            </div>
          </div>

          {/* Selected tag indicator */}
          {selectedTag && (
            <div className="mb-6 flex items-center">
              <span className="text-sm text-muted-foreground mr-2">Filtered by tag:</span>
              <Badge
                variant="secondary"
                className="flex items-center gap-1 cursor-pointer"
                onClick={() => setSelectedTag(null)}
              >
                {selectedTag}
                <X className="h-3 w-3" />
              </Badge>
            </div>
          )}

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-3">
              <TabsTrigger value="all">All Posts</TabsTrigger>
              <TabsTrigger value="popular">Most Popular</TabsTrigger>
              <TabsTrigger value="recent">Recent</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Blog Posts */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">Loading blog posts...</p>
            </div>
          ) : filteredBlogs.length > 0 ? (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {filteredBlogs.map((blog) => (
                <motion.div key={blog.id} variants={itemVariants}>
                  <Card className="h-full flex flex-col overflow-hidden hover:shadow-lg transition-shadow">
                    {blog.imageUrl && (
                      <div className="aspect-video w-full overflow-hidden">
                        <img
                          src={blog.imageUrl || "/placeholder.svg?height=400&width=600"}
                          alt={blog.title}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}
                    <CardHeader>
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline">{blog.category}</Badge>
                        <div className="flex items-center text-muted-foreground text-sm">
                          <Clock className="h-3 w-3 mr-1" />
                          <span>{blog.readTime} min read</span>
                        </div>
                      </div>
                      <CardTitle className="line-clamp-2">{blog.title}</CardTitle>
                      <CardDescription className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={blog.author.avatar} alt={blog.author.name} />
                          <AvatarFallback>{blog.author.name.substring(0, 2)}</AvatarFallback>
                        </Avatar>
                        <span>{blog.author.name}</span>
                        <span>•</span>
                        <span>{new Date(blog.date).toLocaleDateString()}</span>
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow">
                      <p className="text-sm text-muted-foreground line-clamp-3 mb-4">{blog.summary}</p>

                      {(blog.optimizer || blog.problem) && (
                        <div className="mt-2 space-y-2 text-sm">
                          {blog.optimizer && (
                            <div className="flex items-start gap-2">
                              <span className="font-medium min-w-[80px]">Optimizer:</span>
                              <span className="text-primary">{blog.optimizer.name}</span>
                            </div>
                          )}
                          {blog.problem && (
                            <div className="flex items-start gap-2">
                              <span className="font-medium min-w-[80px]">Problem:</span>
                              <span>{blog.problem.name}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                    <CardFooter className="flex flex-col items-start gap-3 pt-2 border-t">
                      <div className="flex flex-wrap gap-2">
                        {blog.tags.slice(0, 4).map((tag) => (
                          <Badge
                            key={tag}
                            variant="secondary"
                            className="cursor-pointer hover:bg-secondary/80"
                            onClick={() => handleTagClick(tag)}
                          >
                            {tag}
                          </Badge>
                        ))}
                        {blog.tags.length > 4 && <Badge variant="outline">+{blog.tags.length - 4}</Badge>}
                      </div>

                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2"
                            onClick={() => handleLikeBlog(blog.id)}
                          >
                            <Heart className={`h-4 w-4 mr-1 ${blog.likes > 0 ? "fill-primary text-primary" : ""}`} />
                            <span>{blog.likes}</span>
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 px-2">
                            <MessageSquare className="h-4 w-4 mr-1" />
                            <span>{blog.comments}</span>
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 px-2">
                            <Share2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-3"
                          onClick={() => navigate(`/blogs/${blog.id}`)}
                        >
                          Read more
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    </CardFooter>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <div className="text-center py-12 bg-muted/30 rounded-lg">
              <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-medium">No blog posts found</h3>
              <p className="text-muted-foreground mt-1 mb-4">
                {searchQuery || selectedCategory !== "All Categories" || selectedTag
                  ? "Try adjusting your search or filters to find what you're looking for."
                  : "Be the first to share your optimization use case with the community!"}
              </p>
              {(searchQuery || selectedCategory !== "All Categories" || selectedTag) && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchQuery("")
                    setSelectedCategory("All Categories")
                    setSelectedTag(null)
                  }}
                >
                  Clear all filters
                </Button>
              )}
              {!searchQuery && selectedCategory === "All Categories" && !selectedTag && isAuthenticated && (
                <Button onClick={() => setShowCreateDialog(true)}>Create First Blog Post</Button>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Create Blog Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Share Your Optimization Use Case</DialogTitle>
            <DialogDescription>
              Share your experience solving optimization problems with the community. Describe your approach, the
              optimizer you used, and the results you achieved.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateBlog} className="space-y-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <label htmlFor="title" className="block text-sm font-medium">
                  Title <span className="text-destructive">*</span>
                </label>
                <Input
                  id="title"
                  name="title"
                  value={newBlog.title}
                  onChange={handleInputChange}
                  placeholder="E.g., Solving the Traveling Salesman Problem with Quantum Annealing"
                  required
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label htmlFor="summary" className="block text-sm font-medium">
                  Summary <span className="text-destructive">*</span>
                </label>
                <Textarea
                  id="summary"
                  name="summary"
                  value={newBlog.summary}
                  onChange={handleInputChange}
                  placeholder="A brief summary of your use case (1-2 sentences)"
                  required
                  className="resize-none h-20"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label htmlFor="content" className="block text-sm font-medium">
                  Content <span className="text-destructive">*</span>
                </label>
                <Textarea
                  id="content"
                  name="content"
                  value={newBlog.content}
                  onChange={handleInputChange}
                  placeholder="Describe your optimization approach, challenges, and results in detail..."
                  required
                  className="min-h-[200px]"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="category" className="block text-sm font-medium">
                  Category <span className="text-destructive">*</span>
                </label>
                <Select
                  name="category"
                  value={newBlog.category}
                  onValueChange={(value) => setNewBlog((prev) => ({ ...prev, category: value }))}
                >
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.slice(1).map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label htmlFor="imageUrl" className="block text-sm font-medium">
                  Image URL
                </label>
                <Input
                  id="imageUrl"
                  name="imageUrl"
                  value={newBlog.imageUrl}
                  onChange={handleInputChange}
                  placeholder="https://example.com/image.jpg"
                />
              </div>
            </div>

            <Separator className="my-4" />

            <div className="space-y-4">
              <h4 className="font-medium">Optimizer Details</h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="optimizerName" className="block text-sm font-medium">
                    Optimizer Name
                  </label>
                  <Input
                    id="optimizerName"
                    name="optimizerName"
                    value={newBlog.optimizerName}
                    onChange={handleInputChange}
                    placeholder="E.g., QuAnneal v2.1"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="optimizerRepo" className="block text-sm font-medium">
                    Repository URL
                  </label>
                  <Input
                    id="optimizerRepo"
                    name="optimizerRepo"
                    value={newBlog.optimizerRepo}
                    onChange={handleInputChange}
                    placeholder="E.g., /username/repo-name"
                  />
                </div>
              </div>
            </div>

            <Separator className="my-4" />

            <div className="space-y-4">
              <h4 className="font-medium">Problem Details</h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="problemName" className="block text-sm font-medium">
                    Problem Name
                  </label>
                  <Input
                    id="problemName"
                    name="problemName"
                    value={newBlog.problemName}
                    onChange={handleInputChange}
                    placeholder="E.g., TSP-50"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label htmlFor="problemDescription" className="block text-sm font-medium">
                    Problem Description
                  </label>
                  <Textarea
                    id="problemDescription"
                    name="problemDescription"
                    value={newBlog.problemDescription}
                    onChange={handleInputChange}
                    placeholder="Brief description of the optimization problem"
                    className="resize-none h-20"
                  />
                </div>
              </div>
            </div>

            <Separator className="my-4" />

            <div className="space-y-2">
              <label className="block text-sm font-medium">Tags</label>
              <div className="flex items-center">
                <Input
                  type="text"
                  value={tagInput}
                  onChange={handleTagInputChange}
                  className="flex-grow rounded-r-none"
                  placeholder="Add a tag and press Enter"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      addTag()
                    }
                  }}
                />
                <Button type="button" variant="secondary" onClick={addTag} className="rounded-l-none">
                  Add
                </Button>
              </div>

              {newBlog.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {newBlog.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="flex items-center gap-1 cursor-pointer">
                      <span className="text-xs">{tag}</span>
                      <button type="button" onClick={() => removeTag(tag)} className="text-xs hover:text-destructive">
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCreateDialog(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Publishing...
                  </>
                ) : (
                  "Publish Blog Post"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Layout>
  )
}

export default BlogsPage


"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { Search, Filter, Clock, ArrowRight, Loader2, Lock, X, Heart } from "lucide-react"
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

interface BlogPost {
  id: string
  title: string
  content: string
  summary: string
  author: {
    name: string
    avatar?: string
    username: string
  }
  date: string
  tags: string[]
  imageUrl?: string
  category: string
  readTime: number
  likes: number
  optimizer?: {
    name: string
    repoUrl: string
  }
  problem?: {
    name: string
    description: string
  }
}

// Sample blog posts focused on optimization problems and solutions
const sampleBlogs: BlogPost[] = [
  {
    id: "1",
    title: "Solving the Traveling Salesman Problem with Quantum Annealing",
    summary: "How we used quantum annealing to find near-optimal solutions for complex routing problems.",
    content:
      "The Traveling Salesman Problem (TSP) is a classic optimization challenge that involves finding the shortest possible route that visits a set of cities exactly once and returns to the origin city. Traditional algorithms struggle with large instances of this NP-hard problem.\n\nIn our experiment, we implemented a quantum annealing approach using our QuAnneal optimizer on a dataset of 50 cities. The results showed a 30% improvement in solution quality compared to classical simulated annealing, with computation time reduced by 45%.\n\nThe key innovation was in our problem encoding, which mapped city distances to qubit couplings in a way that minimized the energy function when the optimal path was found. This approach can be extended to other routing and scheduling problems with similar constraints.",
    author: {
      name: "Dr. Sarah Chen",
      avatar: "/placeholder.svg?height=40&width=40",
      username: "quantum_sarah",
    },
    date: "2023-11-15",
    tags: ["Quantum Computing", "Annealing", "TSP", "Routing", "NP-Hard"],
    imageUrl: "/placeholder.svg?height=400&width=600",
    category: "Quantum Optimization",
    readTime: 8,
    likes: 42,
    optimizer: {
      name: "QuAnneal v2.1",
      repoUrl: "/quantum_sarah/quanneal",
    },
    problem: {
      name: "TSP-50",
      description: "50-city traveling salesman problem with asymmetric distances",
    },
  },
  {
    id: "2",
    title: "Portfolio Optimization Using Genetic Algorithms",
    summary:
      "A case study on using evolutionary algorithms to maximize returns while minimizing risk in financial portfolios.",
    content:
      "Modern portfolio theory seeks to optimize the allocation of assets to maximize returns for a given level of risk. This multi-objective optimization problem is well-suited for genetic algorithms due to its complex search space and multiple constraints.\n\nWe developed a genetic algorithm-based optimizer called GeneticFolio that evolves portfolio allocations across different asset classes. Using historical market data from 2010-2022, our algorithm consistently outperformed traditional mean-variance optimization by 2.3% annually while maintaining similar risk profiles.\n\nThe key to our approach was a custom fitness function that balanced expected returns, volatility, and correlation metrics, along with specialized crossover operators that preserved allocation constraints. We also implemented adaptive mutation rates that responded to market volatility signals.",
    author: {
      name: "Marcus Wong",
      avatar: "/placeholder.svg?height=40&width=40",
      username: "fintech_marcus",
    },
    date: "2023-09-22",
    tags: ["Finance", "Genetic Algorithms", "Portfolio Theory", "Risk Management"],
    imageUrl: "/placeholder.svg?height=400&width=600",
    category: "Financial Optimization",
    readTime: 12,
    likes: 78,
    optimizer: {
      name: "GeneticFolio",
      repoUrl: "/fintech_marcus/geneticfolio",
    },
    problem: {
      name: "Multi-Asset Portfolio",
      description: "Allocation optimization across 20 asset classes with risk constraints",
    },
  },
  {
    id: "3",
    title: "Optimizing Wind Farm Layouts with Particle Swarm Optimization",
    summary: "How we increased energy output by 18% by optimizing turbine placement using PSO algorithms.",
    content:
      "Wind farm layout optimization is a critical factor in maximizing energy production while minimizing costs. The wake effect, where upstream turbines reduce the wind speed for downstream turbines, creates a complex optimization challenge.\n\nOur team applied a modified Particle Swarm Optimization (PSO) algorithm to determine optimal turbine placements for a 50-turbine offshore wind farm. The algorithm considered wake effects, wind direction probabilities, turbine specifications, and geographical constraints.\n\nBy implementing our WindSwarm optimizer, we achieved an 18% increase in annual energy production compared to grid-based layouts, with only a 5% increase in infrastructure costs. The optimization process also reduced maintenance costs by improving accessibility patterns.\n\nThe solution has been deployed in three commercial wind farms, with consistent performance improvements observed across different geographical and wind profile conditions.",
    author: {
      name: "Elena Rodriguez",
      avatar: "/placeholder.svg?height=40&width=40",
      username: "renewable_elena",
    },
    date: "2023-10-05",
    tags: ["Renewable Energy", "PSO", "Wind Power", "Layout Optimization"],
    imageUrl: "/placeholder.svg?height=400&width=600",
    category: "Energy Optimization",
    readTime: 10,
    likes: 56,
    optimizer: {
      name: "WindSwarm",
      repoUrl: "/renewable_elena/windswarm",
    },
    problem: {
      name: "Offshore Wind Layout",
      description: "50-turbine layout optimization with wake effect modeling",
    },
  },
]

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
  const [blogs, setBlogs] = useState<BlogPost[]>(sampleBlogs)
  const [filteredBlogs, setFilteredBlogs] = useState<BlogPost[]>(sampleBlogs)
  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All Categories")
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [activeTab, setActiveTab] = useState("all")

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

  // Check if user is authenticated
  useEffect(() => {
    const token = localStorage.getItem("gitea_token")
    setIsAuthenticated(!!token)
  }, [])

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

    setFilteredBlogs(result)
  }, [blogs, searchQuery, selectedCategory, selectedTag])

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
    if (!newBlog.title || !newBlog.content || !newBlog.category) {
      toast({
        title: "Required fields missing",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      // In a real app, this would be an API call
      // Simulate API call with timeout
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const now = new Date()
      const newBlogPost: BlogPost = {
        id: Date.now().toString(),
        title: newBlog.title,
        summary: newBlog.summary,
        content: newBlog.content,
        author: {
          name: "Current User", // In a real app, get from user profile
          username: "current_user",
          avatar: "/placeholder.svg?height=40&width=40",
        },
        date: now.toISOString().split("T")[0],
        tags: newBlog.tags,
        imageUrl: newBlog.imageUrl || undefined,
        category: newBlog.category,
        readTime: Math.ceil(newBlog.content.length / 1000), // Rough estimate
        likes: 0,
        optimizer: newBlog.optimizerName
          ? {
              name: newBlog.optimizerName,
              repoUrl: newBlog.optimizerRepo,
            }
          : undefined,
        problem: newBlog.problemName
          ? {
              name: newBlog.problemName,
              description: newBlog.problemDescription,
            }
          : undefined,
      }

      setBlogs((prev) => [newBlogPost, ...prev])

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

      toast({
        title: "Blog post created!",
        description: "Your blog post has been published successfully.",
      })
    } catch (error) {
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
                          src={blog.imageUrl || "/placeholder.svg"}
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
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Button variant="ghost" size="sm" className="h-8 px-2">
                            <Heart className={`h-4 w-4 mr-1 ${blog.likes > 0 ? "fill-primary text-primary" : ""}`} />
                            <span>{blog.likes}</span>
                          </Button>
                        </div>
                        <Button variant="ghost" size="sm" className="h-8 px-3">
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
                Try adjusting your search or filters to find what you're looking for.
              </p>
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


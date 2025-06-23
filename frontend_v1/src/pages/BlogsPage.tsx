/**
 * Blogs Page
 *
 * Main page for displaying longer-form community content and articles
 */

import { useState, useEffect } from "react"
import { BookOpen, Plus, Calendar, User, Clock, Search, Filter, Heart, Eye, Trash2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
import { Textarea } from "@/components/ui/textarea"
import Layout from "@/components/Layout"
import { formatDistanceToNow } from "date-fns"
import {
  useBlogs,
  useBlogStats,
  useCreateBlog,
  useDeleteBlog,
  useToggleBlogLike,
  useBlogLikeCount,
  useBlogLikeStatus,
  useIncrementBlogView,
  type Blog,
  type CreateBlogData
} from "@/hooks/use-community"

const categories = [
  { value: "all", label: "All Categories" },
  { value: "research", label: "Research" },
  { value: "tutorial", label: "Tutorial" },
  { value: "opinion", label: "Opinion" },
  { value: "news", label: "News" },
  { value: "case-study", label: "Case Study" }
]

export default function BlogsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [sortBy, setSortBy] = useState("newest")
  const [page, setPage] = useState(1)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [newBlog, setNewBlog] = useState<Partial<CreateBlogData>>({
    title: "",
    summary: "",
    content: "",
    category: "research",
    tags: []
  })

  // API hooks
  const { data: blogsResponse, isLoading, error } = useBlogs(
    page,
    10,
    selectedCategory,
    searchQuery,
    sortBy
  )
  const { data: stats } = useBlogStats()
  const createBlog = useCreateBlog()
  const deleteBlog = useDeleteBlog()
  const incrementView = useIncrementBlogView()

  // Reset page when filters change
  useEffect(() => {
    setPage(1)
  }, [searchQuery, selectedCategory, sortBy])

  const handleCreateBlog = async () => {
    if (!newBlog.title?.trim() || !newBlog.summary?.trim() || !newBlog.content?.trim()) {
      return
    }

    const blogData: CreateBlogData = {
      title: newBlog.title.trim(),
      summary: newBlog.summary.trim(),
      content: newBlog.content.trim(),
      category: newBlog.category || "research",
      tags: Array.isArray(newBlog.tags) ? newBlog.tags : [],
    }

    createBlog.mutate(blogData, {
      onSuccess: () => {
        setNewBlog({
          title: "",
          summary: "",
          content: "",
          category: "research",
          tags: []
        })
        setShowCreateDialog(false)
      }
    })
  }

  const handleDeleteBlog = (blogId: string) => {
    if (confirm("Are you sure you want to delete this blog?")) {
      deleteBlog.mutate(blogId)
    }
  }

  const handleBlogClick = (blogId: string) => {
    incrementView.mutate(blogId)
    // Navigate to blog detail page (implement later)
    console.log("Navigate to blog:", blogId)
  }

  const BlogCard = ({ blog }: { blog: Blog }) => {
    const { data: likeCount } = useBlogLikeCount(blog.id)
    const { data: likeStatus } = useBlogLikeStatus(blog.id)
    const toggleLike = useToggleBlogLike()

    const handleLike = (e: React.MouseEvent) => {
      e.stopPropagation()
      toggleLike.mutate(blog.id)
    }

    const tags = blog.tags ? blog.tags.split(',').filter(tag => tag.trim()) : []

    return (
      <Card
        className="mb-6 hover:shadow-lg transition-shadow cursor-pointer"
        onClick={() => handleBlogClick(blog.id)}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={`/api/avatar/${blog.author_username}`} />
                <AvatarFallback>
                  {blog.author_username.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{blog.author_username}</span>
                  <Badge variant="secondary" className="text-xs">
                    {blog.category}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  <span>{formatDistanceToNow(new Date(blog.created_at), { addSuffix: true })}</span>
                  <Separator orientation="vertical" className="h-3" />
                  <Clock className="h-3 w-3" />
                  <span>{blog.read_time} min read</span>
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                handleDeleteBlog(blog.id)
              }}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          <CardTitle className="text-xl leading-tight mb-2 hover:text-primary transition-colors">
            {blog.title}
          </CardTitle>

          <CardDescription className="text-base leading-relaxed">
            {blog.summary}
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-0">
          <div className="flex items-center justify-between">
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  #{tag.trim()}
                </Badge>
              ))}
            </div>

            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                <span>{blog.views_count || 0}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLike}
                className={`flex items-center gap-1 p-1 h-auto ${
                  likeStatus?.liked ? "text-red-500 hover:text-red-600" : "text-muted-foreground"
                }`}
              >
                <Heart className={`h-3 w-3 ${likeStatus?.liked ? "fill-current" : ""}`} />
                <span>{likeCount?.count || 0}</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <BookOpen className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Community Blogs</h1>
                <p className="text-muted-foreground">
                  Longer-form articles and insights from the community
                </p>
              </div>
            </div>

            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Write Article
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Blog Article</DialogTitle>
                  <DialogDescription>
                    Share your knowledge and insights with the community
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      placeholder="Enter article title..."
                      value={newBlog.title || ""}
                      onChange={(e) => setNewBlog(prev => ({ ...prev, title: e.target.value }))}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="category">Category</Label>
                    <Select
                      value={newBlog.category || "research"}
                      onValueChange={(value) => setNewBlog(prev => ({ ...prev, category: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.filter(cat => cat.value !== 'all').map((category) => (
                          <SelectItem key={category.value} value={category.value}>
                            {category.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="summary">Summary</Label>
                    <Textarea
                      id="summary"
                      placeholder="Brief summary of your article..."
                      value={newBlog.summary || ""}
                      onChange={(e) => setNewBlog(prev => ({ ...prev, summary: e.target.value }))}
                      className="min-h-[80px]"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="content">Content</Label>
                    <Textarea
                      id="content"
                      placeholder="Write your article content here..."
                      value={newBlog.content || ""}
                      onChange={(e) => setNewBlog(prev => ({ ...prev, content: e.target.value }))}
                      className="min-h-[200px]"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="tags">Tags (comma-separated)</Label>
                    <Input
                      id="tags"
                      placeholder="optimization, quantum, tutorial..."
                      value={Array.isArray(newBlog.tags) ? newBlog.tags.join(', ') : ""}
                      onChange={(e) => setNewBlog(prev => ({
                        ...prev,
                        tags: e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag)
                      }))}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="submit"
                    onClick={handleCreateBlog}
                    disabled={!newBlog.title?.trim() || !newBlog.summary?.trim() || !newBlog.content?.trim() || createBlog.isPending}
                  >
                    {createBlog.isPending ? "Creating..." : "Create Article"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Filters and Search */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search articles, tags, or authors..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="oldest">Oldest</SelectItem>
                  <SelectItem value="popular">Most Views</SelectItem>
                  <SelectItem value="liked">Most Liked</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-2xl font-bold">{stats?.totalBlogs || 0}</p>
                    <p className="text-sm text-muted-foreground">Total Articles</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-2xl font-bold">{stats?.totalAuthors || 0}</p>
                    <p className="text-sm text-muted-foreground">Contributors</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-2xl font-bold">{stats?.avgReadTime || 0}</p>
                    <p className="text-sm text-muted-foreground">Avg. Read Time</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>
              Failed to load blogs: {error.message}
            </AlertDescription>
          </Alert>
        )}

        {/* Articles List */}
        <div>
          {isLoading ? (
            <div className="space-y-6">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="h-10 w-10 bg-muted rounded-full" />
                      <div className="space-y-2">
                        <div className="h-4 w-24 bg-muted rounded" />
                        <div className="h-3 w-32 bg-muted rounded" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-6 w-3/4 bg-muted rounded" />
                      <div className="h-4 w-full bg-muted rounded" />
                      <div className="h-4 w-2/3 bg-muted rounded" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between">
                      <div className="flex gap-2">
                        <div className="h-5 w-16 bg-muted rounded" />
                        <div className="h-5 w-20 bg-muted rounded" />
                      </div>
                      <div className="flex gap-4">
                        <div className="h-4 w-12 bg-muted rounded" />
                        <div className="h-4 w-12 bg-muted rounded" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : blogsResponse && blogsResponse.blogs.length > 0 ? (
            <div>
              {blogsResponse.blogs.map((blog) => (
                <BlogCard key={blog.id} blog={blog} />
              ))}

              {/* Pagination */}
              {blogsResponse.pagination.pages > 1 && (
                <div className="flex justify-center gap-2 mt-8">
                  <Button
                    variant="outline"
                    onClick={() => setPage(page - 1)}
                    disabled={page <= 1}
                  >
                    Previous
                  </Button>
                  <span className="flex items-center px-4 text-sm text-muted-foreground">
                    Page {page} of {blogsResponse.pagination.pages}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => setPage(page + 1)}
                    disabled={page >= blogsResponse.pagination.pages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <Card className="text-center py-12">
              <CardContent>
                <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No articles found</h3>
                <p className="text-muted-foreground mb-6">
                  {searchQuery || selectedCategory !== "all"
                    ? "Try adjusting your search or filters"
                    : "Be the first to write an article for the community!"
                  }
                </p>
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Write First Article
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  )
}

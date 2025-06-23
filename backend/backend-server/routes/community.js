const express = require("express")
const { knex } = require("../config/database")
const { auth } = require("../middleware/auth")

const router = express.Router()

// Get all community posts
router.get("/posts", async (req, res) => {
  try {
    const posts = await knex("posts")
      .select("*")
      .orderBy("created_at", "desc")

    res.json(posts)
  } catch (error) {
    console.error("Error fetching community posts:", error)
    res.status(500).json({ message: "Internal server error" })
  }
})

// Get a specific community post
router.get("/posts/:id", async (req, res) => {
  const { id } = req.params

  try {
    const post = await knex("posts")
      .where({ id })
      .first()

    if (!post) {
      return res.status(404).json({ message: "Post not found" })
    }

    res.json(post)
  } catch (error) {
    console.error("Error fetching community post:", error)
    res.status(500).json({ message: "Internal server error" })
  }
})

// Create a new community post
router.post("/posts", auth, async (req, res) => {
  const { title, content, category } = req.body

  if (!content) {
    return res.status(400).json({ message: "Content is required" })
  }

  try {
    const [newPost] = await knex("posts")
      .insert({
        content,
        author_username: req.user.login,
        type: category || "general",
        created_at: knex.fn.now(),
        updated_at: knex.fn.now(),
      })
      .returning("*")

    res.status(201).json(newPost)
  } catch (error) {
    console.error("Error creating community post:", error)
    res.status(500).json({ message: "Internal server error" })
  }
})

// Update a community post
router.put("/posts/:id", auth, async (req, res) => {
  const { id } = req.params
  const { content, category } = req.body

  try {
    const post = await knex("posts")
      .where({ id })
      .first()

    if (!post) {
      return res.status(404).json({ message: "Post not found" })
    }

    if (post.author_username !== req.user.login) {
      return res.status(403).json({ message: "You can only edit your own posts" })
    }

    const [updatedPost] = await knex("posts")
      .where({ id })
      .update({
        content: content || post.content,
        type: category || post.type,
        updated_at: knex.fn.now(),
      })
      .returning("*")

    res.json(updatedPost)
  } catch (error) {
    console.error("Error updating community post:", error)
    res.status(500).json({ message: "Internal server error" })
  }
})

// Delete a community post
router.delete("/posts/:id", auth, async (req, res) => {
  const { id } = req.params

  try {
    const post = await knex("posts")
      .where({ id })
      .first()

    if (!post) {
      return res.status(404).json({ message: "Post not found" })
    }

    if (post.author_username !== req.user.login) {
      return res.status(403).json({ message: "You can only delete your own posts" })
    }

    await knex("posts")
      .where({ id })
      .del()

    res.json({ message: "Post deleted successfully" })
  } catch (error) {
    console.error("Error deleting community post:", error)
    res.status(500).json({ message: "Internal server error" })
  }
})

// Get comments for a post
router.get("/posts/:postId/comments", async (req, res) => {
  const { postId } = req.params

  try {
    const comments = await knex("post_comments")
      .where({ post_id: postId })
      .orderBy("created_at", "asc")

    res.json(comments)
  } catch (error) {
    console.error("Error fetching comments:", error)
    res.status(500).json({ message: "Internal server error" })
  }
})

// Add a comment to a post
router.post("/posts/:postId/comments", auth, async (req, res) => {
  const { postId } = req.params
  const { content } = req.body

  if (!content) {
    return res.status(400).json({ message: "Content is required" })
  }

  try {
    // Check if post exists
    const post = await knex("posts")
      .where({ id: postId })
      .first()

    if (!post) {
      return res.status(404).json({ message: "Post not found" })
    }

    const [newComment] = await knex("post_comments")
      .insert({
        post_id: postId,
        content,
        username: req.user.login,
        created_at: knex.fn.now(),
      })
      .returning("*")

    res.status(201).json(newComment)
  } catch (error) {
    console.error("Error creating comment:", error)
    res.status(500).json({ message: "Internal server error" })
  }
})

// Update a comment
router.put("/comments/:id", auth, async (req, res) => {
  const { id } = req.params
  const { content } = req.body

  try {
    const comment = await knex("post_comments")
      .where({ id })
      .first()

    if (!comment) {
      return res.status(404).json({ message: "Comment not found" })
    }

    if (comment.username !== req.user.login) {
      return res.status(403).json({ message: "You can only edit your own comments" })
    }

    const [updatedComment] = await knex("post_comments")
      .where({ id })
      .update({
        content: content || comment.content,
        updated_at: knex.fn.now(),
      })
      .returning("*")

    res.json(updatedComment)
  } catch (error) {
    console.error("Error updating comment:", error)
    res.status(500).json({ message: "Internal server error" })
  }
})

// Delete a comment
router.delete("/comments/:id", auth, async (req, res) => {
  const { id } = req.params

  try {
    const comment = await knex("post_comments")
      .where({ id })
      .first()

    if (!comment) {
      return res.status(404).json({ message: "Comment not found" })
    }

    if (comment.username !== req.user.login) {
      return res.status(403).json({ message: "You can only delete your own comments" })
    }

    await knex("post_comments")
      .where({ id })
      .del()

    res.json({ message: "Comment deleted successfully" })
  } catch (error) {
    console.error("Error deleting comment:", error)
    res.status(500).json({ message: "Internal server error" })
  }
})

// Like/unlike a post
router.post("/posts/:id/like", auth, async (req, res) => {
  const { id } = req.params
  const username = req.user.login

  try {
    // Check if post exists
    const post = await knex("posts")
      .where({ id })
      .first()

    if (!post) {
      return res.status(404).json({ message: "Post not found" })
    }

    // Check if user already liked this post
    const existingLike = await knex("post_likes")
      .where({ post_id: id, username })
      .first()

    if (existingLike) {
      // Unlike the post
      await knex("post_likes")
        .where({ post_id: id, username })
        .del()

      res.json({ message: "Post unliked", liked: false })
    } else {
      // Like the post
      await knex("post_likes")
        .insert({
          post_id: id,
          username,
          created_at: knex.fn.now(),
        })

      res.json({ message: "Post liked", liked: true })
    }
  } catch (error) {
    console.error("Error toggling like:", error)
    res.status(500).json({ message: "Internal server error" })
  }
})

// Get like count for a post
router.get("/posts/:id/likes", async (req, res) => {
  const { id } = req.params

  try {
    const likeCount = await knex("post_likes")
      .where({ post_id: id })
      .count("* as count")
      .first()

    res.json({ count: parseInt(likeCount.count) })
  } catch (error) {
    console.error("Error fetching like count:", error)
    res.status(500).json({ message: "Internal server error" })
  }
})

// Check if user liked a post
router.get("/posts/:id/liked", auth, async (req, res) => {
  const { id } = req.params
  const username = req.user.login

  try {
    const like = await knex("post_likes")
      .where({ post_id: id, username })
      .first()

    res.json({ liked: !!like })
  } catch (error) {
    console.error("Error checking like status:", error)
    res.status(500).json({ message: "Internal server error" })
  }
})

// ===== BLOG ENDPOINTS =====

// Get all blogs with optional filtering and pagination
router.get("/blogs", async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      category,
      search,
      sort = 'newest'
    } = req.query

    let query = knex("blogs").select("*")

    // Apply category filter
    if (category && category !== 'all') {
      query = query.where('category', category)
    }

    // Apply search filter
    if (search) {
      query = query.where(function() {
        this.where('title', 'ilike', `%${search}%`)
          .orWhere('summary', 'ilike', `%${search}%`)
          .orWhere('tags', 'ilike', `%${search}%`)
      })
    }

    // Apply sorting
    switch (sort) {
      case 'oldest':
        query = query.orderBy('created_at', 'asc')
        break
      case 'popular':
        query = query.orderBy('likes_count', 'desc')
        break
      case 'liked':
        query = query.orderBy('likes_count', 'desc')
        break
      case 'newest':
      default:
        query = query.orderBy('created_at', 'desc')
        break
    }

    // Apply pagination
    const offset = (page - 1) * limit
    const blogs = await query.limit(limit).offset(offset)

    // Get total count for pagination
    let countQuery = knex("blogs").count('* as total')
    if (category && category !== 'all') {
      countQuery = countQuery.where('category', category)
    }
    if (search) {
      countQuery = countQuery.where(function() {
        this.where('title', 'ilike', `%${search}%`)
          .orWhere('summary', 'ilike', `%${search}%`)
          .orWhere('tags', 'ilike', `%${search}%`)
      })
    }

    const totalResult = await countQuery.first()
    const total = parseInt(totalResult.total)

    res.json({
      blogs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error("Error fetching blogs:", error)
    res.status(500).json({ message: "Internal server error" })
  }
})

// Get blog statistics
router.get("/blogs/stats", async (req, res) => {
  try {
    const totalBlogs = await knex("blogs").count('* as count').first()
    const totalAuthors = await knex("blogs").countDistinct('author_username as count').first()
    const avgReadTime = await knex("blogs").avg('read_time as avg').first()

    res.json({
      totalBlogs: parseInt(totalBlogs.count),
      totalAuthors: parseInt(totalAuthors.count),
      avgReadTime: Math.round(parseFloat(avgReadTime.avg) || 0)
    })
  } catch (error) {
    console.error("Error fetching blog stats:", error)
    res.status(500).json({ message: "Internal server error" })
  }
})

// Get a specific blog
router.get("/blogs/:id", async (req, res) => {
  const { id } = req.params

  try {
    const blog = await knex("blogs")
      .where({ id })
      .first()

    if (!blog) {
      return res.status(404).json({ message: "Blog not found" })
    }

    res.json(blog)
  } catch (error) {
    console.error("Error fetching blog:", error)
    res.status(500).json({ message: "Internal server error" })
  }
})

// Create a new blog
router.post("/blogs", auth, async (req, res) => {
  const {
    title,
    summary,
    content,
    category,
    tags,
    image_url,
    optimizer_name,
    optimizer_url,
    problem_name,
    problem_description,
    read_time
  } = req.body

  if (!title || !summary || !content || !category) {
    return res.status(400).json({
      message: "Title, summary, content, and category are required"
    })
  }

  try {
    const [newBlog] = await knex("blogs")
      .insert({
        title,
        summary,
        content,
        category,
        tags: Array.isArray(tags) ? tags.join(',') : tags,
        image_url,
        optimizer_name,
        optimizer_url,
        problem_name,
        problem_description,
        read_time: read_time || Math.ceil(content.length / 1000), // Estimate read time
        author_username: req.user.login,
        created_at: knex.fn.now(),
      })
      .returning("*")

    res.status(201).json(newBlog)
  } catch (error) {
    console.error("Error creating blog:", error)
    res.status(500).json({ message: "Internal server error" })
  }
})

// Update a blog
router.put("/blogs/:id", auth, async (req, res) => {
  const { id } = req.params
  const {
    title,
    summary,
    content,
    category,
    tags,
    image_url,
    optimizer_name,
    optimizer_url,
    problem_name,
    problem_description,
    read_time
  } = req.body

  try {
    const blog = await knex("blogs")
      .where({ id })
      .first()

    if (!blog) {
      return res.status(404).json({ message: "Blog not found" })
    }

    if (blog.author_username !== req.user.login) {
      return res.status(403).json({ message: "You can only edit your own blogs" })
    }

    const [updatedBlog] = await knex("blogs")
      .where({ id })
      .update({
        title: title || blog.title,
        summary: summary || blog.summary,
        content: content || blog.content,
        category: category || blog.category,
        tags: tags ? (Array.isArray(tags) ? tags.join(',') : tags) : blog.tags,
        image_url: image_url !== undefined ? image_url : blog.image_url,
        optimizer_name: optimizer_name !== undefined ? optimizer_name : blog.optimizer_name,
        optimizer_url: optimizer_url !== undefined ? optimizer_url : blog.optimizer_url,
        problem_name: problem_name !== undefined ? problem_name : blog.problem_name,
        problem_description: problem_description !== undefined ? problem_description : blog.problem_description,
        read_time: read_time || blog.read_time,
        updated_at: knex.fn.now(),
      })
      .returning("*")

    res.json(updatedBlog)
  } catch (error) {
    console.error("Error updating blog:", error)
    res.status(500).json({ message: "Internal server error" })
  }
})

// Delete a blog
router.delete("/blogs/:id", auth, async (req, res) => {
  const { id } = req.params

  try {
    const blog = await knex("blogs")
      .where({ id })
      .first()

    if (!blog) {
      return res.status(404).json({ message: "Blog not found" })
    }

    if (blog.author_username !== req.user.login) {
      return res.status(403).json({ message: "You can only delete your own blogs" })
    }

    await knex("blogs")
      .where({ id })
      .del()

    res.json({ message: "Blog deleted successfully" })
  } catch (error) {
    console.error("Error deleting blog:", error)
    res.status(500).json({ message: "Internal server error" })
  }
})

// Like/unlike a blog
router.post("/blogs/:id/like", auth, async (req, res) => {
  const { id } = req.params
  const username = req.user.login

  try {
    // Check if blog exists
    const blog = await knex("blogs")
      .where({ id })
      .first()

    if (!blog) {
      return res.status(404).json({ message: "Blog not found" })
    }

    // Check if user already liked this blog
    const existingLike = await knex("blog_likes")
      .where({ blog_id: id, username })
      .first()

    if (existingLike) {
      // Unlike the blog
      await knex("blog_likes")
        .where({ blog_id: id, username })
        .del()

      res.json({ message: "Blog unliked", liked: false })
    } else {
      // Like the blog
      await knex("blog_likes")
        .insert({
          blog_id: id,
          username,
          created_at: knex.fn.now(),
        })

      res.json({ message: "Blog liked", liked: true })
    }
  } catch (error) {
    console.error("Error toggling blog like:", error)
    res.status(500).json({ message: "Internal server error" })
  }
})

// Get like count for a blog
router.get("/blogs/:id/likes", async (req, res) => {
  const { id } = req.params

  try {
    const likeCount = await knex("blog_likes")
      .where({ blog_id: id })
      .count("* as count")
      .first()

    res.json({ count: parseInt(likeCount.count) })
  } catch (error) {
    console.error("Error fetching blog like count:", error)
    res.status(500).json({ message: "Internal server error" })
  }
})

// Check if user liked a blog
router.get("/blogs/:id/liked", auth, async (req, res) => {
  const { id } = req.params
  const username = req.user.login

  try {
    const like = await knex("blog_likes")
      .where({ blog_id: id, username })
      .first()

    res.json({ liked: !!like })
  } catch (error) {
    console.error("Error checking blog like status:", error)
    res.status(500).json({ message: "Internal server error" })
  }
})

// Increment blog view count
router.post("/blogs/:id/view", async (req, res) => {
  const { id } = req.params

  try {
    await knex("blogs")
      .where({ id })
      .increment('views_count', 1)

    res.json({ message: "View count incremented" })
  } catch (error) {
    console.error("Error incrementing blog view count:", error)
    res.status(500).json({ message: "Internal server error" })
  }
})

module.exports = router

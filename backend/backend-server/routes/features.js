const express = require("express")
const { knex } = require("../config/database")
const upload = require("../middleware/upload")
const fs = require("fs")

const router = express.Router()
const { auth } = require("../middleware/auth")

// Get all features (redirect to requests for backward compatibility)
router.get("/", async (req, res) => {
  try {
    const features = await knex("features")
      .select("*")
      .orderBy("created_at", "desc")

    res.json(features)
  } catch (error) {
    console.error("Error fetching features:", error)
    res.status(500).json({ message: "Internal server error" })
  }
})

// Upload Jupyter notebook
router.post("/upload-notebook", upload.single("notebook"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" })
    }

    const filePath = req.file.path
    const originalName = req.file.originalname

    // Read and parse the notebook
    const notebookContent = fs.readFileSync(filePath, "utf8")
    let notebookData

    try {
      notebookData = JSON.parse(notebookContent)
    } catch (parseError) {
      // Clean up the uploaded file
      fs.unlinkSync(filePath)
      return res.status(400).json({ message: "Invalid Jupyter notebook format" })
    }

    // Extract metadata
    const metadata = {
      filename: originalName,
      kernelspec: notebookData.metadata?.kernelspec || null,
      language_info: notebookData.metadata?.language_info || null,
      cell_count: notebookData.cells?.length || 0,
      upload_time: new Date().toISOString(),
    }

    // Clean up the uploaded file
    fs.unlinkSync(filePath)

    res.json({
      message: "Notebook uploaded and processed successfully",
      metadata,
      content: notebookData,
    })
  } catch (error) {
    console.error("Error processing notebook:", error)

    // Clean up file if it exists
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path)
      } catch (cleanupError) {
        console.error("Error cleaning up file:", cleanupError)
      }
    }

    res.status(500).json({ message: "Internal server error" })
  }
})

// Get feature requests
router.get("/requests", async (req, res) => {
  try {
    const requests = await knex("features")
      .select("*")
      .orderBy("created_at", "desc")

    res.json(requests)
  } catch (error) {
    console.error("Error fetching feature requests:", error)
    res.status(500).json({ message: "Internal server error" })
  }
})

// Create a new feature request
router.post("/requests", auth, async (req, res) => {
  const { title, description, priority } = req.body

  if (!title || !description) {
    return res.status(400).json({ message: "Title and description are required" })
  }

  try {
    const [newRequest] = await knex("features")
      .insert({
        title,
        description,
        priority: priority || "medium",
        created_by_username: req.user.login,
        status: "backlog",
        created_at: knex.fn.now(),
        updated_at: knex.fn.now(),
      })
      .returning("*")

    res.status(201).json(newRequest)
  } catch (error) {
    console.error("Error creating feature request:", error)
    res.status(500).json({ message: "Internal server error" })
  }
})

// Get a specific feature request
router.get("/requests/:id", async (req, res) => {
  const { id } = req.params

  try {
    const request = await knex("features")
      .where({ id })
      .first()

    if (!request) {
      return res.status(404).json({ message: "Feature request not found" })
    }

    res.json(request)
  } catch (error) {
    console.error("Error fetching feature request:", error)
    res.status(500).json({ message: "Internal server error" })
  }
})

// Update a feature request
router.put("/requests/:id", auth, async (req, res) => {
  const { id } = req.params
  const { title, description, priority, status } = req.body

  try {
    const request = await knex("features")
      .where({ id })
      .first()

    if (!request) {
      return res.status(404).json({ message: "Feature request not found" })
    }

    if (request.created_by_username !== req.user.login) {
      return res.status(403).json({ message: "You can only edit your own feature requests" })
    }

    const [updatedRequest] = await knex("features")
      .where({ id })
      .update({
        title: title || request.title,
        description: description || request.description,
        priority: priority || request.priority,
        status: status || request.status,
        updated_at: knex.fn.now(),
      })
      .returning("*")

    res.json(updatedRequest)
  } catch (error) {
    console.error("Error updating feature request:", error)
    res.status(500).json({ message: "Internal server error" })
  }
})

// Delete a feature request
router.delete("/requests/:id", auth, async (req, res) => {
  const { id } = req.params

  try {
    const request = await knex("features")
      .where({ id })
      .first()

    if (!request) {
      return res.status(404).json({ message: "Feature request not found" })
    }

    if (request.created_by_username !== req.user.login) {
      return res.status(403).json({ message: "You can only delete your own feature requests" })
    }

    await knex("features")
      .where({ id })
      .del()

    res.json({ message: "Feature request deleted successfully" })
  } catch (error) {
    console.error("Error deleting feature request:", error)
    res.status(500).json({ message: "Internal server error" })
  }
})

// Vote on a feature request
router.post("/requests/:id/vote", auth, async (req, res) => {
  const { id } = req.params
  const { vote_type } = req.body // 'up' or 'down'
  const username = req.user.login

  if (!vote_type || !["up", "down"].includes(vote_type)) {
    return res.status(400).json({ message: "Vote type must be 'up' or 'down'" })
  }

  try {
    // Check if feature request exists
    const request = await knex("features")
      .where({ id })
      .first()

    if (!request) {
      return res.status(404).json({ message: "Feature request not found" })
    }

    // Check if user already voted
    const existingVote = await knex("feature_votes")
      .where({ request_id: id, username })
      .first()

    if (existingVote) {
      if (existingVote.vote_type === vote_type) {
        // Remove vote if same type
        await knex("feature_votes")
          .where({ request_id: id, username })
          .del()

        res.json({ message: "Vote removed" })
      } else {
        // Update vote if different type
        await knex("feature_votes")
          .where({ request_id: id, username })
          .update({
            vote_type,
            updated_at: knex.fn.now(),
          })

        res.json({ message: "Vote updated" })
      }
    } else {
      // Create new vote
      await knex("feature_votes")
        .insert({
          request_id: id,
          username,
          vote_type,
          created_at: knex.fn.now(),
        })

      res.json({ message: "Vote recorded" })
    }
  } catch (error) {
    console.error("Error voting on feature request:", error)
    res.status(500).json({ message: "Internal server error" })
  }
})

// Get vote counts for a feature request
router.get("/requests/:id/votes", async (req, res) => {
  const { id } = req.params

  try {
    const votes = await knex("feature_votes")
      .where({ request_id: id })
      .select("vote_type")
      .count("* as count")
      .groupBy("vote_type")

    const voteCounts = {
      up: 0,
      down: 0,
    }

    votes.forEach((vote) => {
      voteCounts[vote.vote_type] = parseInt(vote.count)
    })

    res.json(voteCounts)
  } catch (error) {
    console.error("Error fetching vote counts:", error)
    res.status(500).json({ message: "Internal server error" })
  }
})

// Get user's vote for a feature request
router.get("/requests/:id/my-vote", auth, async (req, res) => {
  const { id } = req.params
  const username = req.user.login

  try {
    const vote = await knex("feature_votes")
      .where({ request_id: id, username })
      .first()

    res.json({ vote_type: vote ? vote.vote_type : null })
  } catch (error) {
    console.error("Error fetching user vote:", error)
    res.status(500).json({ message: "Internal server error" })
  }
})

// Get feature request comments
router.get("/requests/:id/comments", async (req, res) => {
  const { id } = req.params

  try {
    const comments = await knex("feature_comments")
      .where({ request_id: id })
      .orderBy("created_at", "asc")

    res.json(comments)
  } catch (error) {
    console.error("Error fetching feature request comments:", error)
    res.status(500).json({ message: "Internal server error" })
  }
})

// Add comment to feature request
router.post("/requests/:id/comments", auth, async (req, res) => {
  const { id } = req.params
  const { content } = req.body

  if (!content) {
    return res.status(400).json({ message: "Content is required" })
  }

  try {
    // Check if feature request exists
    const request = await knex("features")
      .where({ id })
      .first()

    if (!request) {
      return res.status(404).json({ message: "Feature request not found" })
    }

    const [newComment] = await knex("feature_comments")
      .insert({
        request_id: id,
        content,
        created_by_username: req.user.login,
        created_at: knex.fn.now(),
      })
      .returning("*")

    res.status(201).json(newComment)
  } catch (error) {
    console.error("Error creating feature request comment:", error)
    res.status(500).json({ message: "Internal server error" })
  }
})

module.exports = router

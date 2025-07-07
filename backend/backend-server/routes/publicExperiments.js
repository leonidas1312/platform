const express = require("express")
const router = express.Router()
const { auth } = require("../middleware/auth")
const { knex } = require("../config/database")

// Get all public experiments
router.get("/", async (req, res) => {
  try {
    const experiments = await knex("public_experiments")
      .select(
        "public_experiments.*",
        "users.username",
        "users.full_name",
        "users.avatar_url"
      )
      .leftJoin("users", "public_experiments.user_id", "users.username")
      .where("public_experiments.is_public", true)
      .orderBy("public_experiments.created_at", "desc")

    // Parse JSON fields and enrich with dataset information
    const parsedExperiments = await Promise.all(experiments.map(async exp => {
      const baseExp = {
        ...exp,
        problem_params: JSON.parse(exp.problem_params || "{}"),
        optimizer_params: JSON.parse(exp.optimizer_params || "{}"),
        tags: JSON.parse(exp.tags || "[]")
      }

      // If experiment has a dataset_id, fetch dataset information
      if (exp.dataset_id) {
        try {
          const dataset = await knex("datasets")
            .select("name", "original_filename", "format_type")
            .where("id", exp.dataset_id)
            .first()

          if (dataset) {
            baseExp.dataset_info = {
              name: dataset.name,
              filename: dataset.original_filename,
              format_type: dataset.format_type
            }
          }
        } catch (datasetError) {
          console.warn(`Failed to fetch dataset info for experiment ${exp.id}:`, datasetError)
          // Continue without dataset info
        }
      }

      return baseExp
    }))

    res.json({
      success: true,
      experiments: parsedExperiments
    })
  } catch (error) {
    console.error("Error fetching public experiments:", error)
    res.status(500).json({
      success: false,
      message: "Failed to fetch public experiments",
      error: error.message
    })
  }
})

// Create a new public experiment
router.post("/", auth, async (req, res) => {
  try {
    const {
      name,
      description,
      problem_name,
      problem_username,
      optimizer_name,
      optimizer_username,
      problem_params,
      optimizer_params,
      dataset_id,
      dataset_parameter,
      tags
    } = req.body

    // Validate required fields
    if (!name || !problem_name || !problem_username || !optimizer_name || !optimizer_username) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: name, problem_name, problem_username, optimizer_name, optimizer_username"
      })
    }

    // Create the experiment
    const [experiment] = await knex("public_experiments")
      .insert({
        user_id: req.user.username,
        name: name.trim(),
        description: description?.trim() || "",
        problem_name,
        problem_username,
        optimizer_name,
        optimizer_username,
        problem_params: JSON.stringify(problem_params || {}),
        optimizer_params: JSON.stringify(optimizer_params || {}),
        dataset_id,
        dataset_parameter: dataset_parameter || null, // Save the dataset parameter mapping
        tags: JSON.stringify(tags || []),
        is_public: true,
        created_at: new Date(),
        updated_at: new Date()
      })
      .returning("*")

    res.json({
      success: true,
      message: "Public experiment created successfully",
      experiment
    })
  } catch (error) {
    console.error("Error creating public experiment:", error)
    res.status(500).json({
      success: false,
      message: "Failed to create public experiment",
      error: error.message
    })
  }
})

// Delete a public experiment (only by owner)
router.delete("/:id", auth, async (req, res) => {
  try {
    const { id } = req.params

    // Check if experiment exists and belongs to user
    const experiment = await knex("public_experiments")
      .where({ id, user_id: req.user.username })
      .first()

    if (!experiment) {
      return res.status(404).json({
        success: false,
        message: "Experiment not found or you don't have permission to delete it"
      })
    }

    // Delete the experiment
    await knex("public_experiments")
      .where({ id })
      .del()

    res.json({
      success: true,
      message: "Public experiment deleted successfully"
    })
  } catch (error) {
    console.error("Error deleting public experiment:", error)
    res.status(500).json({
      success: false,
      message: "Failed to delete public experiment",
      error: error.message
    })
  }
})

// Get a specific public experiment
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params

    const experiment = await knex("public_experiments")
      .select(
        "public_experiments.*",
        "users.username",
        "users.full_name",
        "users.avatar_url"
      )
      .leftJoin("users", "public_experiments.user_id", "users.username")
      .where("public_experiments.id", id)
      .where("public_experiments.is_public", true)
      .first()

    if (!experiment) {
      return res.status(404).json({
        success: false,
        message: "Public experiment not found"
      })
    }

    // Parse JSON fields
    experiment.problem_params = JSON.parse(experiment.problem_params || "{}")
    experiment.optimizer_params = JSON.parse(experiment.optimizer_params || "{}")
    experiment.tags = JSON.parse(experiment.tags || "[]")

    res.json({
      success: true,
      experiment
    })
  } catch (error) {
    console.error("Error fetching public experiment:", error)
    res.status(500).json({
      success: false,
      message: "Failed to fetch public experiment",
      error: error.message
    })
  }
})

module.exports = router

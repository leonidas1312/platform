/**
 * Playground Environment Routes
 *
 * API endpoints for managing interactive optimization playground environments.
 * Handles environment creation, management, and real-time communication.
 */

const express = require('express')
const WebSocket = require('ws')
const { auth } = require('../middleware/auth')
const PlaygroundEnvironmentService = require('../services/playgroundEnvironmentService')

const router = express.Router()
const playgroundService = new PlaygroundEnvironmentService()

// Create a new playground environment
router.post('/environments', auth, async (req, res) => {
  try {
    const {
      problemRepo,
      optimizerRepo,
      problemUsername,
      optimizerUsername
    } = req.body

    if (!problemRepo || !optimizerRepo) {
      return res.status(400).json({
        message: "problemRepo and optimizerRepo are required"
      })
    }

    const userId = req.user.id || req.user.username

    const environment = await playgroundService.createEnvironment(
      userId,
      problemRepo,
      optimizerRepo,
      problemUsername,
      optimizerUsername
    )

    res.json({
      success: true,
      environment: {
        id: environment.id,
        status: environment.status,
        url: environment.url,
        createdAt: environment.createdAt,
        problemRepo: environment.problemRepo,
        optimizerRepo: environment.optimizerRepo
      }
    })
  } catch (error) {
    console.error("Error creating playground environment:", error)
    res.status(500).json({
      success: false,
      message: "Failed to create environment",
      error: error.message
    })
  }
})

// Get user's active environment
router.get('/environments/me', auth, async (req, res) => {
  try {
    const userId = req.user.id || req.user.username
    const environment = playgroundService.getUserEnvironment(userId)

    if (!environment) {
      return res.json({
        success: true,
        environment: null
      })
    }

    res.json({
      success: true,
      environment: {
        id: environment.id,
        status: environment.status,
        url: environment.url,
        createdAt: environment.createdAt,
        lastActivity: environment.lastActivity,
        problemRepo: environment.problemRepo,
        optimizerRepo: environment.optimizerRepo
      }
    })
  } catch (error) {
    console.error("Error getting user environment:", error)
    res.status(500).json({
      success: false,
      message: "Failed to get environment",
      error: error.message
    })
  }
})

// Get specific environment details
router.get('/environments/:envId', auth, async (req, res) => {
  try {
    const { envId } = req.params
    const environment = playgroundService.getEnvironment(envId)

    if (!environment) {
      return res.status(404).json({
        success: false,
        message: "Environment not found"
      })
    }

    // Check if user owns this environment or is admin
    const userId = req.user.id || req.user.username
    if (environment.userId !== userId && !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Access denied"
      })
    }

    res.json({
      success: true,
      environment: {
        id: environment.id,
        status: environment.status,
        url: environment.url,
        createdAt: environment.createdAt,
        lastActivity: environment.lastActivity,
        problemRepo: environment.problemRepo,
        optimizerRepo: environment.optimizerRepo
      }
    })
  } catch (error) {
    console.error("Error getting environment:", error)
    res.status(500).json({
      success: false,
      message: "Failed to get environment",
      error: error.message
    })
  }
})

// Delete an environment
router.delete('/environments/:envId', auth, async (req, res) => {
  try {
    const { envId } = req.params
    const environment = playgroundService.getEnvironment(envId)

    if (!environment) {
      return res.status(404).json({
        success: false,
        message: "Environment not found"
      })
    }

    // Check if user owns this environment or is admin
    const userId = req.user.id || req.user.username
    if (environment.userId !== userId && !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Access denied"
      })
    }

    const deleted = await playgroundService.deleteEnvironment(envId)

    if (deleted) {
      res.json({
        success: true,
        message: "Environment deleted successfully"
      })
    } else {
      res.status(500).json({
        success: false,
        message: "Failed to delete environment"
      })
    }
  } catch (error) {
    console.error("Error deleting environment:", error)
    res.status(500).json({
      success: false,
      message: "Failed to delete environment",
      error: error.message
    })
  }
})

// Execute optimization in environment
router.post('/environments/:envId/execute', auth, async (req, res) => {
  try {
    const { envId } = req.params
    const {
      problemName,
      optimizerName,
      problemParams = {},
      optimizerParams = {}
    } = req.body

    const environment = playgroundService.getEnvironment(envId)

    if (!environment) {
      return res.status(404).json({
        success: false,
        message: "Environment not found"
      })
    }

    // Check if user owns this environment
    const userId = req.user.id || req.user.username
    if (environment.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: "Access denied"
      })
    }

    const result = await playgroundService.executeOptimization(envId, {
      problemName,
      optimizerName,
      problemParams,
      optimizerParams
    })

    // Broadcast result to connected WebSockets
    playgroundService.broadcastToEnvironment(envId, {
      type: 'execution_result',
      data: result
    })

    res.json({
      success: true,
      result
    })
  } catch (error) {
    console.error("Error executing optimization:", error)
    res.status(500).json({
      success: false,
      message: "Execution failed",
      error: error.message
    })
  }
})

// List all environments (admin only)
router.get('/environments', auth, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Admin access required"
      })
    }

    const environments = playgroundService.listEnvironments()

    res.json({
      success: true,
      environments: environments.map(env => ({
        id: env.id,
        userId: env.userId,
        status: env.status,
        createdAt: env.createdAt,
        lastActivity: env.lastActivity,
        problemRepo: env.problemRepo,
        optimizerRepo: env.optimizerRepo
      }))
    })
  } catch (error) {
    console.error("Error listing environments:", error)
    res.status(500).json({
      success: false,
      message: "Failed to list environments",
      error: error.message
    })
  }
})

module.exports = router

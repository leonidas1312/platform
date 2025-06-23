/**
 * Notification Routes
 * 
 * API endpoints for managing user notifications and inbox functionality.
 */

const express = require("express")
const { auth } = require("../middleware/auth")
const NotificationService = require("../services/notificationService")

const router = express.Router()

/**
 * Get user notifications
 * GET /api/notifications
 */
router.get("/", auth, async (req, res) => {
  try {
    const {
      limit = 50,
      offset = 0,
      unread_only = false,
      include_expired = false
    } = req.query

    const notifications = await NotificationService.getUserNotifications(
      req.user.id,
      {
        limit: parseInt(limit),
        offset: parseInt(offset),
        unreadOnly: unread_only === 'true',
        includeExpired: include_expired === 'true'
      }
    )

    res.json({
      success: true,
      notifications,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: notifications.length
      }
    })
  } catch (error) {
    console.error("Error fetching notifications:", error)
    res.status(500).json({
      success: false,
      message: "Failed to fetch notifications",
      error: error.message
    })
  }
})

/**
 * Get unread notification count
 * GET /api/notifications/unread-count
 */
router.get("/unread-count", auth, async (req, res) => {
  try {
    const count = await NotificationService.getUnreadCount(req.user.id)

    res.json({
      success: true,
      unread_count: count
    })
  } catch (error) {
    console.error("Error fetching unread count:", error)
    res.status(500).json({
      success: false,
      message: "Failed to fetch unread count",
      error: error.message
    })
  }
})

/**
 * Mark notifications as read
 * POST /api/notifications/mark-read
 */
router.post("/mark-read", auth, async (req, res) => {
  try {
    const { notification_ids } = req.body

    // If no specific IDs provided, mark all as read
    const updatedCount = await NotificationService.markAsRead(
      req.user.id,
      notification_ids
    )

    res.json({
      success: true,
      message: `Marked ${updatedCount} notifications as read`,
      updated_count: updatedCount
    })
  } catch (error) {
    console.error("Error marking notifications as read:", error)
    res.status(500).json({
      success: false,
      message: "Failed to mark notifications as read",
      error: error.message
    })
  }
})

/**
 * Mark single notification as read
 * POST /api/notifications/:id/read
 */
router.post("/:id/read", auth, async (req, res) => {
  try {
    const notificationId = req.params.id

    const updatedCount = await NotificationService.markAsRead(
      req.user.id,
      notificationId
    )

    if (updatedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Notification not found or already read"
      })
    }

    res.json({
      success: true,
      message: "Notification marked as read"
    })
  } catch (error) {
    console.error("Error marking notification as read:", error)
    res.status(500).json({
      success: false,
      message: "Failed to mark notification as read",
      error: error.message
    })
  }
})

/**
 * Get notification types and user preferences
 * GET /api/notifications/preferences
 */
router.get("/preferences", auth, async (req, res) => {
  try {
    const { knex } = require("../config/database")

    // Get all notification types
    const types = await knex('notification_types')
      .where('is_active', true)
      .orderBy('display_name')

    // Get user preferences
    const preferences = await knex('user_notification_preferences')
      .where('user_id', req.user.id)

    // Create preferences map
    const preferencesMap = {}
    preferences.forEach(pref => {
      preferencesMap[pref.notification_type_id] = pref
    })

    // Combine types with user preferences
    const typesWithPreferences = types.map(type => ({
      ...type,
      preferences: preferencesMap[type.id] || {
        email_enabled: false,
        web_enabled: true,
        push_enabled: false
      }
    }))

    res.json({
      success: true,
      notification_types: typesWithPreferences
    })
  } catch (error) {
    console.error("Error fetching notification preferences:", error)
    res.status(500).json({
      success: false,
      message: "Failed to fetch notification preferences",
      error: error.message
    })
  }
})

/**
 * Update notification preferences
 * POST /api/notifications/preferences
 */
router.post("/preferences", auth, async (req, res) => {
  try {
    const { preferences } = req.body
    const { knex } = require("../config/database")

    if (!Array.isArray(preferences)) {
      return res.status(400).json({
        success: false,
        message: "Preferences must be an array"
      })
    }

    // Update preferences in transaction
    await knex.transaction(async (trx) => {
      for (const pref of preferences) {
        const {
          notification_type_id,
          email_enabled = false,
          web_enabled = true,
          push_enabled = false
        } = pref

        await trx('user_notification_preferences')
          .insert({
            user_id: req.user.id,
            notification_type_id,
            email_enabled,
            web_enabled,
            push_enabled,
            created_at: new Date(),
            updated_at: new Date()
          })
          .onConflict(['user_id', 'notification_type_id'])
          .merge({
            email_enabled,
            web_enabled,
            push_enabled,
            updated_at: new Date()
          })
      }
    })

    res.json({
      success: true,
      message: "Notification preferences updated successfully"
    })
  } catch (error) {
    console.error("Error updating notification preferences:", error)
    res.status(500).json({
      success: false,
      message: "Failed to update notification preferences",
      error: error.message
    })
  }
})

/**
 * Test notification creation (development only)
 */
if (process.env.NODE_ENV === 'development') {
  router.post("/test", auth, async (req, res) => {
    try {
      const {
        type = 'submission_completed',
        title = 'Test Notification',
        message = 'This is a test notification',
        priority = 'normal'
      } = req.body

      const notification = await NotificationService.createNotification({
        userId: req.user.id,
        type,
        title,
        message,
        priority,
        metadata: {
          test: true,
          timestamp: new Date().toISOString()
        }
      })

      res.json({
        success: true,
        message: "Test notification created",
        notification
      })
    } catch (error) {
      console.error("Error creating test notification:", error)
      res.status(500).json({
        success: false,
        message: "Failed to create test notification",
        error: error.message
      })
    }
  })
}

module.exports = router

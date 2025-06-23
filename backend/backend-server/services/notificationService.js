/**
 * Notification Service
 * 
 * Manages user notifications for the Rastion platform, including submission status updates,
 * leaderboard rankings, and system notifications.
 */

const { knex } = require("../config/database")
const crypto = require("crypto")

class NotificationService {
  /**
   * Create a new notification for a user
   */
  static async createNotification({
    userId,
    type,
    title,
    message,
    metadata = {},
    priority = 'normal',
    actionUrl = null,
    actionText = 'View Details',
    expiresAt = null
  }) {
    try {
      // Get notification type
      const notificationType = await knex('notification_types')
        .where('name', type)
        .first()

      if (!notificationType) {
        throw new Error(`Unknown notification type: ${type}`)
      }

      // Check user preferences
      const preferences = await knex('user_notification_preferences')
        .where({
          user_id: userId,
          notification_type_id: notificationType.id
        })
        .first()

      // If user has disabled web notifications for this type, skip
      if (preferences && !preferences.web_enabled) {
        console.log(`User ${userId} has disabled notifications for type: ${type}`)
        return null
      }

      // Create notification
      const notificationId = crypto.randomUUID()
      
      const notification = await knex('user_notifications').insert({
        id: notificationId,
        user_id: userId,
        notification_type_id: notificationType.id,
        title,
        message,
        metadata: JSON.stringify(metadata),
        priority,
        action_url: actionUrl,
        action_text: actionText,
        expires_at: expiresAt,
        created_at: new Date(),
        updated_at: new Date()
      }).returning('*')

      console.log(`✅ Created notification for user ${userId}: ${title}`)

      // Broadcast real-time notification if WebSocket is available
      this.broadcastNotification(userId, {
        id: notificationId,
        type: notificationType.name,
        title,
        message,
        metadata,
        priority,
        action_url: actionUrl,
        action_text: actionText,
        created_at: new Date().toISOString(),
        icon: notificationType.icon,
        color: notificationType.color
      })

      return notification[0]
    } catch (error) {
      console.error('Error creating notification:', error)
      throw error
    }
  }

  /**
   * Get notifications for a user
   */
  static async getUserNotifications(userId, { 
    limit = 50, 
    offset = 0, 
    unreadOnly = false,
    includeExpired = false 
  } = {}) {
    try {
      let query = knex('user_notifications as un')
        .join('notification_types as nt', 'un.notification_type_id', 'nt.id')
        .select(
          'un.id',
          'un.title',
          'un.message',
          'un.metadata',
          'un.is_read',
          'un.priority',
          'un.action_url',
          'un.action_text',
          'un.created_at',
          'un.updated_at',
          'nt.name as type',
          'nt.display_name as type_display',
          'nt.icon',
          'nt.color'
        )
        .where('un.user_id', userId)
        .orderBy('un.created_at', 'desc')

      if (unreadOnly) {
        query = query.where('un.is_read', false)
      }

      if (!includeExpired) {
        query = query.where(function() {
          this.whereNull('un.expires_at')
            .orWhere('un.expires_at', '>', new Date())
        })
      }

      const notifications = await query
        .limit(limit)
        .offset(offset)

      // Parse metadata JSON
      return notifications.map(notification => ({
        ...notification,
        metadata: notification.metadata ? JSON.parse(notification.metadata) : {}
      }))
    } catch (error) {
      console.error('Error getting user notifications:', error)
      throw error
    }
  }

  /**
   * Get unread notification count for a user
   */
  static async getUnreadCount(userId) {
    try {
      const result = await knex('user_notifications')
        .where({
          user_id: userId,
          is_read: false
        })
        .where(function() {
          this.whereNull('expires_at')
            .orWhere('expires_at', '>', new Date())
        })
        .count('id as count')
        .first()

      return parseInt(result.count) || 0
    } catch (error) {
      console.error('Error getting unread count:', error)
      throw error
    }
  }

  /**
   * Mark notifications as read
   */
  static async markAsRead(userId, notificationIds = null) {
    try {
      let query = knex('user_notifications')
        .where('user_id', userId)
        .update({
          is_read: true,
          updated_at: new Date()
        })

      if (notificationIds) {
        if (Array.isArray(notificationIds)) {
          query = query.whereIn('id', notificationIds)
        } else {
          query = query.where('id', notificationIds)
        }
      }

      const updatedCount = await query

      console.log(`✅ Marked ${updatedCount} notifications as read for user ${userId}`)

      // Broadcast updated unread count
      const newUnreadCount = await this.getUnreadCount(userId)
      this.broadcastUnreadCount(userId, newUnreadCount)

      return updatedCount
    } catch (error) {
      console.error('Error marking notifications as read:', error)
      throw error
    }
  }

  /**
   * Delete old notifications (cleanup job)
   */
  static async cleanupExpiredNotifications() {
    try {
      const deletedCount = await knex('user_notifications')
        .where('expires_at', '<', new Date())
        .del()

      console.log(`🧹 Cleaned up ${deletedCount} expired notifications`)
      return deletedCount
    } catch (error) {
      console.error('Error cleaning up notifications:', error)
      throw error
    }
  }

  /**
   * Broadcast real-time notification via WebSocket
   */
  static broadcastNotification(userId, notification) {
    try {
      // Get WebSocket handler from global scope if available
      if (global.wsHandler && global.wsHandler.broadcastToUser) {
        global.wsHandler.broadcastToUser(userId, {
          type: 'new_notification',
          data: notification
        })
      }
    } catch (error) {
      console.error('Error broadcasting notification:', error)
    }
  }

  /**
   * Broadcast unread count update via WebSocket
   */
  static broadcastUnreadCount(userId, count) {
    try {
      if (global.wsHandler && global.wsHandler.broadcastToUser) {
        global.wsHandler.broadcastToUser(userId, {
          type: 'unread_count_update',
          data: { unread_count: count }
        })
      }
    } catch (error) {
      console.error('Error broadcasting unread count:', error)
    }
  }

  /**
   * Create submission-related notifications
   */
  static async createSubmissionNotification(userId, submissionId, status, details = {}) {
    const submissionUrl = `/submissions/${submissionId}`
    
    const notifications = {
      pending: {
        type: 'submission_started',
        title: 'Submission Started',
        message: `Your solver submission has been queued for processing.`,
        priority: 'normal'
      },
      validating: {
        type: 'submission_validating',
        title: 'Validating Solver',
        message: `Your solver is being validated for compatibility.`,
        priority: 'normal'
      },
      executing: {
        type: 'submission_executing',
        title: 'Executing Optimization',
        message: `Your solver is running optimization benchmarks.`,
        priority: 'normal'
      },
      completed: {
        type: 'submission_completed',
        title: 'Submission Completed',
        message: `Your solver submission completed successfully! Check the leaderboard for results.`,
        priority: 'high'
      },
      failed: {
        type: 'submission_failed',
        title: 'Submission Failed',
        message: `Your solver submission failed. ${details.error_message || 'Please check the logs for details.'}`,
        priority: 'high'
      }
    }

    const config = notifications[status]
    if (!config) {
      console.warn(`Unknown submission status for notification: ${status}`)
      return null
    }

    const notification = await this.createNotification({
      userId,
      type: config.type,
      title: config.title,
      message: config.message,
      metadata: {
        submission_id: submissionId,
        status,
        ...details
      },
      priority: config.priority,
      actionUrl: submissionUrl,
      actionText: 'View Submission'
    })

    // For immediate feedback, also create an inbox notification for pending submissions
    if (status === 'pending') {
      await this.createNotification({
        userId,
        type: 'submission_inbox_notification',
        title: 'Track Your Submission',
        message: 'View your submission status and progress in My Submissions',
        metadata: {
          submission_id: submissionId,
          redirect_to: 'settings',
          tab: 'submissions'
        },
        priority: 'normal',
        actionUrl: `/settings?tab=submissions&submission=${submissionId}`,
        actionText: 'View My Submissions'
      })
    }

    return notification
  }

  /**
   * Create immediate feedback notification for submission
   */
  static async createImmediateFeedbackNotification(userId, submissionId, details = {}) {
    return await this.createNotification({
      userId,
      type: 'submission_immediate_feedback',
      title: 'Submission Started Successfully',
      message: 'Your algorithm submission is now being processed. Track progress in My Submissions.',
      metadata: {
        submission_id: submissionId,
        ...details
      },
      priority: 'high',
      actionUrl: `/settings?tab=submissions&submission=${submissionId}`,
      actionText: 'Track Progress'
    })
  }
}

module.exports = NotificationService

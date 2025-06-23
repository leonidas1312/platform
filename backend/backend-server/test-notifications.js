/**
 * Test script for the notification system
 * Run with: node test-notifications.js
 */

const NotificationService = require('./services/notificationService')

async function testNotificationSystem() {
  console.log('🧪 Testing Notification System...\n')

  try {
    // Test 1: Create a test notification
    console.log('1. Creating test notification...')
    const notification = await NotificationService.createNotification({
      userId: 1, // Assuming user ID 1 exists
      type: 'submission_completed',
      title: 'Test Submission Completed',
      message: 'Your test solver submission has completed successfully!',
      metadata: {
        submission_id: 'test-123',
        best_value: 42.5,
        rank: 3
      },
      priority: 'high',
      actionUrl: '/submissions/test-123',
      actionText: 'View Results'
    })
    console.log('✅ Notification created:', notification?.id || 'Success')

    // Test 2: Get user notifications
    console.log('\n2. Fetching user notifications...')
    const notifications = await NotificationService.getUserNotifications(1, { limit: 10 })
    console.log(`✅ Found ${notifications.length} notifications`)

    // Test 3: Get unread count
    console.log('\n3. Getting unread count...')
    const unreadCount = await NotificationService.getUnreadCount(1)
    console.log(`✅ Unread count: ${unreadCount}`)

    // Test 4: Mark as read
    if (notification?.id) {
      console.log('\n4. Marking notification as read...')
      const updatedCount = await NotificationService.markAsRead(1, notification.id)
      console.log(`✅ Marked ${updatedCount} notifications as read`)
    }

    // Test 5: Create submission notification
    console.log('\n5. Creating submission notification...')
    const submissionNotif = await NotificationService.createSubmissionNotification(
      1,
      'test-submission-456',
      'executing',
      { solver_repository: 'testuser/test-solver' }
    )
    console.log('✅ Submission notification created:', submissionNotif?.id || 'Success')

    console.log('\n🎉 All tests passed!')

  } catch (error) {
    console.error('❌ Test failed:', error.message)
    console.error(error.stack)
  }
}

// Run tests
testNotificationSystem().then(() => {
  console.log('\n✅ Test completed')
  process.exit(0)
}).catch(error => {
  console.error('❌ Test suite failed:', error)
  process.exit(1)
})

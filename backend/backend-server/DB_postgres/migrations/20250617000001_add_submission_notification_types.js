/**
 * @param { import('knex').Knex } knex
 * @returns { Promise<void> }
 */

exports.up = function(knex) {
  // Insert new notification types for enhanced submission feedback
  return knex('notification_types').insert([
    {
      name: 'submission_immediate_feedback',
      display_name: 'Submission Started Successfully',
      description: 'Immediate feedback notification when submission starts',
      icon: 'check-circle',
      color: 'green'
    },
    {
      name: 'submission_inbox_notification',
      display_name: 'Track Your Submission',
      description: 'Notification directing users to My Submissions page',
      icon: 'bell',
      color: 'blue'
    }
  ])
}

exports.down = function(knex) {
  // Remove the notification types we added
  return knex('notification_types')
    .whereIn('name', [
      'submission_immediate_feedback',
      'submission_inbox_notification'
    ])
    .del()
}

/**
 * @param { import('knex').Knex } knex
 * @returns { Promise<void> }
 */

exports.up = function(knex) {
  return Promise.all([
    // Create notification types table
    knex.schema.createTable('notification_types', function(table) {
      table.increments('id').primary()
      table.string('name').notNullable().unique()
      table.string('display_name').notNullable()
      table.string('description')
      table.string('icon').defaultTo('bell')
      table.string('color').defaultTo('blue')
      table.boolean('is_active').defaultTo(true)
      table.timestamps(true, true)
    }),

    // Create user notifications table
    knex.schema.createTable('user_notifications', function(table) {
      table.string('id', 36).primary() // UUID
      table.integer('user_id').notNullable()
      table.integer('notification_type_id').notNullable()
      table.string('title').notNullable()
      table.text('message').notNullable()
      table.json('metadata') // Additional data like submission_id, links, etc.
      table.boolean('is_read').defaultTo(false)
      table.enum('priority', ['low', 'normal', 'high', 'urgent']).defaultTo('normal')
      table.string('action_url') // Optional URL for "View Details" action
      table.string('action_text').defaultTo('View Details') // Text for action button
      table.timestamp('expires_at') // Optional expiration date
      table.timestamps(true, true)
      
      // Indexes
      table.index(['user_id', 'is_read', 'created_at'])
      table.index(['user_id', 'notification_type_id'])
      table.index(['is_read'])
      table.index(['expires_at'])
      
      // Foreign key constraints
      table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE')
      table.foreign('notification_type_id').references('id').inTable('notification_types')
    }),

    // Create notification preferences table
    knex.schema.createTable('user_notification_preferences', function(table) {
      table.increments('id').primary()
      table.integer('user_id').notNullable()
      table.integer('notification_type_id').notNullable()
      table.boolean('email_enabled').defaultTo(false)
      table.boolean('web_enabled').defaultTo(true)
      table.boolean('push_enabled').defaultTo(false)
      table.timestamps(true, true)
      
      // Unique constraint
      table.unique(['user_id', 'notification_type_id'])
      
      // Foreign key constraints
      table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE')
      table.foreign('notification_type_id').references('id').inTable('notification_types')
    })
  ]).then(() => {
    // Insert default notification types
    return knex('notification_types').insert([
      {
        name: 'submission_started',
        display_name: 'Submission Started',
        description: 'Leaderboard submission has been initiated',
        icon: 'play-circle',
        color: 'blue'
      },
      {
        name: 'submission_validating',
        display_name: 'Submission Validating',
        description: 'Solver validation in progress',
        icon: 'shield-check',
        color: 'yellow'
      },
      {
        name: 'submission_executing',
        display_name: 'Submission Executing',
        description: 'Optimization execution in progress',
        icon: 'cpu',
        color: 'blue'
      },
      {
        name: 'submission_completed',
        display_name: 'Submission Completed',
        description: 'Leaderboard submission completed successfully',
        icon: 'check-circle',
        color: 'green'
      },
      {
        name: 'submission_failed',
        display_name: 'Submission Failed',
        description: 'Leaderboard submission failed',
        icon: 'x-circle',
        color: 'red'
      },
      {
        name: 'validation_error',
        display_name: 'Validation Error',
        description: 'Solver validation failed',
        icon: 'alert-triangle',
        color: 'red'
      },
      {
        name: 'execution_timeout',
        display_name: 'Execution Timeout',
        description: 'Optimization execution timed out',
        icon: 'clock',
        color: 'orange'
      },
      {
        name: 'leaderboard_ranking',
        display_name: 'Leaderboard Ranking',
        description: 'New leaderboard ranking achieved',
        icon: 'trophy',
        color: 'gold'
      }
    ])
  })
}

exports.down = function(knex) {
  return Promise.all([
    knex.schema.dropTableIfExists('user_notification_preferences'),
    knex.schema.dropTableIfExists('user_notifications'),
    knex.schema.dropTableIfExists('notification_types')
  ])
}

/**
 * Migration: Create submission tables for automated leaderboard submissions
 */

exports.up = function(knex) {
  return Promise.all([
    // Create leaderboard submissions queue table
    knex.schema.createTable('leaderboard_submissions_queue', function(table) {
      table.string('id', 36).primary() // UUID
      table.integer('user_id').notNullable()
      table.string('solver_repository').notNullable()
      table.integer('problem_id').notNullable()
      table.text('custom_parameters') // JSON string
      table.integer('num_runs').defaultTo(5)
      table.enum('status', [
        'pending', 
        'validating', 
        'executing', 
        'completed', 
        'failed', 
        'cancelled'
      ]).defaultTo('pending')
      table.integer('progress').defaultTo(0)
      table.string('current_step')
      table.text('error_message')
      table.text('results') // JSON string for final results
      table.timestamps(true, true)
      
      // Indexes
      table.index(['user_id', 'created_at'])
      table.index(['status'])
      table.index(['problem_id'])
      
      // Foreign key constraints
      table.foreign('problem_id').references('id').inTable('standardized_problems')
    }),

    // Create submission logs table
    knex.schema.createTable('submission_logs', function(table) {
      table.increments('id').primary()
      table.string('submission_id', 36).notNullable()
      table.enum('log_level', ['debug', 'info', 'warning', 'error']).defaultTo('info')
      table.text('message').notNullable()
      table.timestamp('timestamp').defaultTo(knex.fn.now())
      
      // Indexes
      table.index(['submission_id', 'timestamp'])
      
      // Foreign key constraints
      table.foreign('submission_id').references('id').inTable('leaderboard_submissions_queue').onDelete('CASCADE')
    }),

    // Create solver validation cache table
    knex.schema.createTable('solver_validation_cache', function(table) {
      table.increments('id').primary()
      table.string('solver_repository').notNullable().unique()
      table.boolean('is_valid').notNullable()
      table.text('validation_result') // JSON string
      table.integer('compatibility_score').defaultTo(0)
      table.timestamp('validated_at').defaultTo(knex.fn.now())
      table.timestamp('expires_at').notNullable()
      
      // Indexes
      table.index(['solver_repository'])
      table.index(['expires_at'])
    })
  ])
}

exports.down = function(knex) {
  return Promise.all([
    knex.schema.dropTableIfExists('submission_logs'),
    knex.schema.dropTableIfExists('solver_validation_cache'),
    knex.schema.dropTableIfExists('leaderboard_submissions_queue')
  ])
}

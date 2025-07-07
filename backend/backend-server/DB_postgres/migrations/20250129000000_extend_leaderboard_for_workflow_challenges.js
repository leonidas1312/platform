/**
 * Migration: Extend Leaderboard for Workflow Challenges
 *
 * Adds additional fields to support challenges created from workflow automation
 * and improves the leaderboard system for dataset+problem submissions.
 *
 * @param { import('knex').Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async (knex) => {
  // Add columns to standardized_problems for workflow-exported challenges
  await knex.schema.alterTable("standardized_problems", (table) => {
    table.jsonb("dataset_info").nullable() // Dataset metadata for workflow challenges
    table.boolean("created_from_workflow").defaultTo(false) // Flag for workflow-exported challenges
    table.jsonb("workflow_metadata").nullable() // Additional workflow export metadata
    table.string("challenge_type").defaultTo('benchmark') // 'benchmark' or 'community_challenge'
    table.integer("view_count").defaultTo(0) // Track challenge popularity
    table.timestamp("last_submission").nullable() // Track activity
  })

  // Create challenge_tags table for better tag management
  await knex.schema.createTable("challenge_tags", (table) => {
    table.increments("id").primary()
    table.integer("problem_id").notNullable()
    table.string("tag").notNullable()
    table.timestamp("created_at").defaultTo(knex.fn.now())

    // Foreign key constraint
    table.foreign("problem_id").references("id").inTable("standardized_problems").onDelete("CASCADE")
    
    // Indexes
    table.index("problem_id")
    table.index("tag")
    table.unique(["problem_id", "tag"]) // Prevent duplicate tags per problem
  })

  // Create challenge_favorites table for user favorites
  await knex.schema.createTable("challenge_favorites", (table) => {
    table.increments("id").primary()
    table.integer("problem_id").notNullable()
    table.string("user_id").notNullable() // Gitea username
    table.timestamp("created_at").defaultTo(knex.fn.now())

    // Foreign key constraint
    table.foreign("problem_id").references("id").inTable("standardized_problems").onDelete("CASCADE")
    
    // Indexes
    table.index("problem_id")
    table.index("user_id")
    table.unique(["problem_id", "user_id"]) // Prevent duplicate favorites
  })

  // Add indexes to existing tables for better performance
  await knex.schema.alterTable("standardized_problems", (table) => {
    table.index("created_from_workflow")
    table.index("challenge_type")
    table.index("view_count")
    table.index("last_submission")
  })

  // Add submission tracking to leaderboard_submissions
  await knex.schema.alterTable("leaderboard_submissions", (table) => {
    table.jsonb("submission_metadata").nullable() // Additional submission metadata
    table.string("submission_source").defaultTo('manual') // 'manual', 'workflow', 'api'
    table.boolean("is_featured").defaultTo(false) // Flag for featured submissions
  })

  // Add indexes for new submission fields
  await knex.schema.alterTable("leaderboard_submissions", (table) => {
    table.index("submission_source")
    table.index("is_featured")
  })
}

/**
 * @param { import('knex').Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async (knex) => {
  // Remove indexes first
  await knex.schema.alterTable("leaderboard_submissions", (table) => {
    table.dropIndex("submission_source")
    table.dropIndex("is_featured")
  })

  await knex.schema.alterTable("standardized_problems", (table) => {
    table.dropIndex("created_from_workflow")
    table.dropIndex("challenge_type")
    table.dropIndex("view_count")
    table.dropIndex("last_submission")
  })

  // Drop new tables
  await knex.schema.dropTableIfExists("challenge_favorites")
  await knex.schema.dropTableIfExists("challenge_tags")

  // Remove new columns from leaderboard_submissions
  await knex.schema.alterTable("leaderboard_submissions", (table) => {
    table.dropColumn("submission_metadata")
    table.dropColumn("submission_source")
    table.dropColumn("is_featured")
  })

  // Remove new columns from standardized_problems
  await knex.schema.alterTable("standardized_problems", (table) => {
    table.dropColumn("dataset_info")
    table.dropColumn("created_from_workflow")
    table.dropColumn("workflow_metadata")
    table.dropColumn("challenge_type")
    table.dropColumn("view_count")
    table.dropColumn("last_submission")
  })
}

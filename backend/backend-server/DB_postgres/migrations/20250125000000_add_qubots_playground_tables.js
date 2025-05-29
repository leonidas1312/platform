/**
 * Migration: Add Qubots Playground Integration Tables
 *
 * Creates tables for managing qubots model combinations, shared experiments,
 * and enhanced playground functionality.
 *
 * @param { import('knex').Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async (knex) => {
  // Create qubots_combinations table for storing problem-optimizer combinations
  await knex.schema.createTable("qubots_combinations", (table) => {
    table.increments("id").primary()
    table.string("name").notNullable()
    table.text("description").nullable()
    table.string("problem_name").notNullable()
    table.string("problem_username").notNullable()
    table.string("optimizer_name").notNullable()
    table.string("optimizer_username").notNullable()
    table.jsonb("problem_params").defaultTo('{}')
    table.jsonb("optimizer_params").defaultTo('{}')
    table.string("created_by").notNullable()
    table.boolean("is_public").defaultTo(false)
    table.boolean("is_featured").defaultTo(false)
    table.integer("usage_count").defaultTo(0)
    table.decimal("average_rating", 3, 2).nullable()
    table.integer("rating_count").defaultTo(0)
    table.jsonb("tags").defaultTo('[]')
    table.jsonb("metadata").defaultTo('{}')
    table.timestamp("created_at").defaultTo(knex.fn.now())
    table.timestamp("updated_at").defaultTo(knex.fn.now())

    // Add foreign key to users table
    table.foreign("created_by").references("username").inTable("users").onDelete("CASCADE")

    // Add indexes for performance
    table.index("problem_name")
    table.index("optimizer_name")
    table.index("created_by")
    table.index("is_public")
    table.index("is_featured")
    table.index(["problem_name", "optimizer_name"])
    table.index("usage_count")
    table.index("average_rating")
  })

  // Create qubots_combination_ratings table for user ratings
  await knex.schema.createTable("qubots_combination_ratings", (table) => {
    table.increments("id").primary()
    table.integer("combination_id").notNullable()
    table.string("user_id").notNullable()
    table.integer("rating").notNullable() // 1-5 stars
    table.text("comment").nullable()
    table.timestamp("created_at").defaultTo(knex.fn.now())
    table.timestamp("updated_at").defaultTo(knex.fn.now())

    // Add foreign keys
    table.foreign("combination_id").references("id").inTable("qubots_combinations").onDelete("CASCADE")
    table.foreign("user_id").references("username").inTable("users").onDelete("CASCADE")

    // Ensure one rating per user per combination
    table.unique(["combination_id", "user_id"])

    // Add indexes
    table.index("combination_id")
    table.index("user_id")
    table.index("rating")
  })

  // Create qubots_execution_history table for tracking optimization runs
  await knex.schema.createTable("qubots_execution_history", (table) => {
    table.increments("id").primary()
    table.integer("combination_id").nullable() // null if not from a saved combination
    table.string("user_id").notNullable()
    table.string("problem_name").notNullable()
    table.string("problem_username").notNullable()
    table.string("optimizer_name").notNullable()
    table.string("optimizer_username").notNullable()
    table.jsonb("problem_params").defaultTo('{}')
    table.jsonb("optimizer_params").defaultTo('{}')
    table.boolean("success").notNullable()
    table.decimal("execution_time", 10, 3).nullable() // seconds
    table.decimal("best_value", 15, 6).nullable()
    table.integer("iterations").nullable()
    table.jsonb("result_metadata").defaultTo('{}')
    table.text("error_message").nullable()
    table.string("error_type").nullable()
    table.timestamp("executed_at").defaultTo(knex.fn.now())

    // Add foreign keys
    table.foreign("combination_id").references("id").inTable("qubots_combinations").onDelete("SET NULL")
    table.foreign("user_id").references("username").inTable("users").onDelete("CASCADE")

    // Add indexes
    table.index("user_id")
    table.index("combination_id")
    table.index("success")
    table.index("executed_at")
    table.index(["problem_name", "optimizer_name"])
  })

  // Create qubots_model_cache table for caching model metadata
  await knex.schema.createTable("qubots_model_cache", (table) => {
    table.increments("id").primary()
    table.string("model_name").notNullable()
    table.string("username").notNullable()
    table.string("model_type").notNullable() // 'problem' or 'optimizer'
    table.text("description").nullable()
    table.string("repository_url").nullable()
    table.jsonb("tags").defaultTo('[]')
    table.jsonb("metadata").defaultTo('{}')
    table.boolean("is_accessible").defaultTo(true)
    table.timestamp("last_validated").defaultTo(knex.fn.now())
    table.timestamp("created_at").defaultTo(knex.fn.now())
    table.timestamp("updated_at").defaultTo(knex.fn.now())

    // Unique constraint on model identification
    table.unique(["model_name", "username", "model_type"])

    // Add indexes
    table.index("model_type")
    table.index("username")
    table.index("is_accessible")
    table.index("last_validated")
  })

  // Update existing playground_experiments table to support qubots (if it exists)
  const hasPlaygroundTable = await knex.schema.hasTable("playground_experiments")
  if (hasPlaygroundTable) {
    await knex.schema.alterTable("playground_experiments", (table) => {
      table.string("experiment_type").defaultTo("classic") // 'classic' or 'qubots'
      table.string("problem_name").nullable() // for qubots experiments
      table.string("problem_username").nullable()
      table.string("optimizer_name").nullable()
      table.string("optimizer_username").nullable()
      table.jsonb("qubots_result").nullable() // full qubots result object
      table.integer("combination_id").nullable() // reference to saved combination

      // Add foreign key to combinations
      table.foreign("combination_id").references("id").inTable("qubots_combinations").onDelete("SET NULL")

      // Add indexes
      table.index("experiment_type")
      table.index("problem_name")
      table.index("optimizer_name")
      table.index("combination_id")
    })
  } else {
    console.log("playground_experiments table does not exist yet, skipping alterations")
  }

  // Insert some sample featured combinations (if any exist)
  // This would be populated later with actual working combinations
  console.log("Qubots playground tables created successfully")
}

/**
 * @param { import('knex').Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async (knex) => {
  // Remove foreign key constraints first (if table exists)
  const hasPlaygroundTable = await knex.schema.hasTable("playground_experiments")
  if (hasPlaygroundTable) {
    await knex.schema.alterTable("playground_experiments", (table) => {
      table.dropForeign("combination_id")
      table.dropColumn("experiment_type")
      table.dropColumn("problem_name")
      table.dropColumn("problem_username")
      table.dropColumn("optimizer_name")
      table.dropColumn("optimizer_username")
      table.dropColumn("qubots_result")
      table.dropColumn("combination_id")
    })
  }

  // Drop tables in reverse order due to foreign key constraints
  await knex.schema.dropTableIfExists("qubots_model_cache")
  await knex.schema.dropTableIfExists("qubots_execution_history")
  await knex.schema.dropTableIfExists("qubots_combination_ratings")
  await knex.schema.dropTableIfExists("qubots_combinations")
}

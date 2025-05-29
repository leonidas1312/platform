/**
 * Migration: Create Optimization Workflows Table
 *
 * Creates table for storing shared optimization workflows from the qubots playground.
 * Allows users to save and share complete workflow configurations including
 * problem/optimizer selections and parameter configurations.
 *
 * @param { import('knex').Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async (knex) => {
  // Create optimization_workflows table for storing shared workflows
  await knex.schema.createTable("optimization_workflows", (table) => {
    table.increments("id").primary()
    table.string("title").notNullable()
    table.text("description").nullable()
    table.string("created_by").notNullable()
    
    // Problem configuration
    table.string("problem_name").notNullable()
    table.string("problem_username").notNullable()
    table.jsonb("problem_params").defaultTo('{}')
    
    // Optimizer configuration
    table.string("optimizer_name").notNullable()
    table.string("optimizer_username").notNullable()
    table.jsonb("optimizer_params").defaultTo('{}')
    
    // Workflow metadata
    table.jsonb("tags").defaultTo('[]')
    table.boolean("is_public").defaultTo(false)
    table.integer("views_count").defaultTo(0)
    table.integer("forks_count").defaultTo(0)
    table.integer("likes_count").defaultTo(0)
    
    // File uploads and additional data
    table.jsonb("uploaded_files").defaultTo('{}') // Store file metadata/paths
    table.jsonb("execution_results").nullable() // Store last execution results if available
    
    // Timestamps
    table.timestamp("created_at").defaultTo(knex.fn.now())
    table.timestamp("updated_at").defaultTo(knex.fn.now())
    table.timestamp("last_executed").nullable()

    // Add foreign key to users table
    table.foreign("created_by").references("username").inTable("users").onDelete("CASCADE")

    // Add indexes for faster lookups
    table.index("created_by")
    table.index("is_public")
    table.index("created_at")
    table.index(["problem_name", "optimizer_name"])
    table.index("views_count")
    table.index("likes_count")
  })

  // Create workflow_likes table for tracking user likes
  await knex.schema.createTable("workflow_likes", (table) => {
    table.increments("id").primary()
    table.integer("workflow_id").notNullable()
    table.string("username").notNullable()
    table.timestamp("created_at").defaultTo(knex.fn.now())

    // Add foreign keys
    table.foreign("workflow_id").references("id").inTable("optimization_workflows").onDelete("CASCADE")
    table.foreign("username").references("username").inTable("users").onDelete("CASCADE")

    // Ensure unique likes per user per workflow
    table.unique(["workflow_id", "username"])

    // Add indexes
    table.index("workflow_id")
    table.index("username")
  })

  // Create workflow_forks table for tracking workflow forks
  await knex.schema.createTable("workflow_forks", (table) => {
    table.increments("id").primary()
    table.integer("original_workflow_id").notNullable()
    table.integer("forked_workflow_id").notNullable()
    table.string("forked_by").notNullable()
    table.timestamp("created_at").defaultTo(knex.fn.now())

    // Add foreign keys
    table.foreign("original_workflow_id").references("id").inTable("optimization_workflows").onDelete("CASCADE")
    table.foreign("forked_workflow_id").references("id").inTable("optimization_workflows").onDelete("CASCADE")
    table.foreign("forked_by").references("username").inTable("users").onDelete("CASCADE")

    // Add indexes
    table.index("original_workflow_id")
    table.index("forked_workflow_id")
    table.index("forked_by")
  })
}

/**
 * @param { import('knex').Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async (knex) => {
  // Drop tables in reverse order due to foreign key constraints
  await knex.schema.dropTableIfExists("workflow_forks")
  await knex.schema.dropTableIfExists("workflow_likes")
  await knex.schema.dropTableIfExists("optimization_workflows")
}

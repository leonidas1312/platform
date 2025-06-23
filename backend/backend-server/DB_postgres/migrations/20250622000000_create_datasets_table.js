/**
 * Migration: Create Datasets Table
 *
 * Creates the datasets table for storing user-uploaded datasets that can be used
 * by qubots problems for the recommendation engine and dynamic dataset access.
 *
 * @param { import('knex').Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async (knex) => {
  // Create datasets table
  await knex.schema.createTable("datasets", (table) => {
    table.string("id", 36).primary() // UUID
    table.string("user_id").notNullable() // References Gitea user
    table.string("name").notNullable()
    table.text("description").nullable()
    table.string("file_path", 500).notNullable() // Path to stored file
    table.bigInteger("file_size").notNullable() // File size in bytes
    table.string("mime_type", 100).nullable()
    table.string("format_type", 50).notNullable() // 'tsplib', 'vrp', 'json', etc.
    table.json("metadata").nullable() // Extracted characteristics
    table.boolean("is_public").defaultTo(false) // Whether dataset is publicly accessible
    table.string("original_filename").notNullable() // Original uploaded filename
    table.timestamp("created_at").defaultTo(knex.fn.now())
    table.timestamp("updated_at").defaultTo(knex.fn.now())

    // Indexes for efficient querying
    table.index("user_id")
    table.index("format_type")
    table.index("is_public")
    table.index("created_at")
    table.index(["user_id", "name"]) // Composite index for user's datasets
  })

  console.log("✅ Created datasets table")

  // Create dataset_access_logs table for tracking usage
  await knex.schema.createTable("dataset_access_logs", (table) => {
    table.increments("id").primary()
    table.string("dataset_id", 36).notNullable()
    table.string("accessed_by_user_id").nullable() // User who accessed the dataset
    table.string("access_type").notNullable() // 'download', 'view', 'metadata'
    table.string("user_agent").nullable()
    table.string("ip_address").nullable()
    table.timestamp("accessed_at").defaultTo(knex.fn.now())

    // Foreign key constraint
    table.foreign("dataset_id").references("id").inTable("datasets").onDelete("CASCADE")

    // Indexes
    table.index("dataset_id")
    table.index("accessed_by_user_id")
    table.index("accessed_at")
  })

  console.log("✅ Created dataset_access_logs table")

  // Create dataset_compatibility table for recommendation engine
  await knex.schema.createTable("dataset_compatibility", (table) => {
    table.increments("id").primary()
    table.string("dataset_id", 36).notNullable()
    table.string("problem_type").notNullable() // 'tsp', 'vrp', 'maxcut', etc.
    table.string("repository_name").notNullable() // Compatible qubot repository
    table.string("repository_owner").notNullable()
    table.decimal("compatibility_score", 3, 2).notNullable() // 0.00 to 1.00
    table.json("compatibility_details").nullable() // Detailed compatibility info
    table.timestamp("computed_at").defaultTo(knex.fn.now())

    // Foreign key constraint
    table.foreign("dataset_id").references("id").inTable("datasets").onDelete("CASCADE")

    // Indexes
    table.index("dataset_id")
    table.index("problem_type")
    table.index(["repository_owner", "repository_name"])
    table.index("compatibility_score")
    table.unique(["dataset_id", "repository_owner", "repository_name"]) // Prevent duplicates
  })

  console.log("✅ Created dataset_compatibility table")
}

/**
 * Rollback migration - drop the datasets tables
 */
exports.down = async (knex) => {
  await knex.schema.dropTableIfExists("dataset_compatibility")
  console.log("✅ Dropped dataset_compatibility table")

  await knex.schema.dropTableIfExists("dataset_access_logs")
  console.log("✅ Dropped dataset_access_logs table")

  await knex.schema.dropTableIfExists("datasets")
  console.log("✅ Dropped datasets table")
}

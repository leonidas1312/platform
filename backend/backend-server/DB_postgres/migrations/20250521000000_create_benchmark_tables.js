/**
 * @param { import('knex').Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async (knex) => {
  // Create benchmarks table
  await knex.schema.createTable("benchmarks", (table) => {
    table.increments("id").primary()
    table.string("title").notNullable()
    table.text("description").notNullable()
    table.string("created_by").notNullable()
    table.timestamp("created_at").defaultTo(knex.fn.now())
    table.timestamp("updated_at").defaultTo(knex.fn.now())

    // Add foreign key to users table
    table.foreign("created_by").references("username").inTable("users").onDelete("CASCADE")

    // Add indexes for faster lookups
    table.index("created_by")
    table.index("created_at")
  })

  // Create benchmark_connections table
  await knex.schema.createTable("benchmark_connections", (table) => {
    table.increments("id").primary()
    table.integer("benchmark_id").notNullable()
    table.string("repo_owner").notNullable()
    table.string("repo_name").notNullable()
    table.string("connected_repo_path").notNullable()
    table.text("description")
    table.text("code_snippet")
    table.timestamp("created_at").defaultTo(knex.fn.now())

    // Add foreign key to benchmarks table
    table.foreign("benchmark_id").references("id").inTable("benchmarks").onDelete("CASCADE")

    // Add indexes for faster lookups
    table.index(["benchmark_id"])
    table.index(["repo_owner", "repo_name"])
  })

  // Create benchmark_results table
  await knex.schema.createTable("benchmark_results", (table) => {
    table.increments("id").primary()
    table.integer("benchmark_id").notNullable()
    table.string("user_id").notNullable()
    table.string("repo_path").notNullable()
    table.jsonb("metrics").notNullable()
    table.text("code_snippet")
    table.timestamp("created_at").defaultTo(knex.fn.now())

    // Add foreign keys
    table.foreign("benchmark_id").references("id").inTable("benchmarks").onDelete("CASCADE")
    table.foreign("user_id").references("username").inTable("users").onDelete("CASCADE")

    // Add indexes for faster lookups
    table.index("benchmark_id")
    table.index("user_id")
    table.index("created_at")
  })
}

/**
 * @param { import('knex').Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async (knex) => {
  await knex.schema.dropTable("benchmark_results")
  await knex.schema.dropTable("benchmark_connections")
  await knex.schema.dropTable("benchmarks")
}

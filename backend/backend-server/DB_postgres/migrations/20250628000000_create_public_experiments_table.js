/**
 * @param { import('knex').Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async (knex) => {
  // Create public_experiments table
  await knex.schema.createTable("public_experiments", (table) => {
    table.increments("id").primary()
    table.string("user_id").notNullable()
    table.string("name").notNullable()
    table.text("description").nullable()
    table.string("problem_name").notNullable()
    table.string("problem_username").notNullable()
    table.string("optimizer_name").notNullable()
    table.string("optimizer_username").notNullable()
    table.text("problem_params").defaultTo("{}")
    table.text("optimizer_params").defaultTo("{}")
    table.string("dataset_id").nullable()
    table.text("tags").defaultTo("[]")
    table.boolean("is_public").defaultTo(true)
    table.timestamp("created_at").defaultTo(knex.fn.now())
    table.timestamp("updated_at").defaultTo(knex.fn.now())

    // Add foreign key to users table
    table.foreign("user_id").references("username").inTable("users").onDelete("CASCADE")

    // Add indexes for better performance
    table.index("user_id")
    table.index("is_public")
    table.index("created_at")
    table.index(["problem_name", "problem_username"])
    table.index(["optimizer_name", "optimizer_username"])
  })
}

/**
 * @param { import('knex').Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async (knex) => {
  await knex.schema.dropTableIfExists("public_experiments")
}

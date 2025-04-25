/**
 * @param { import('knex').Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async (knex) => {
    // Create repo_connections table
    await knex.schema.createTable("repo_connections", (table) => {
      table.increments("id").primary()
      table.string("repo_owner").notNullable()
      table.string("repo_name").notNullable()
      table.string("connected_repo_path").notNullable()
      table.text("description")
      table.text("code_snippet").notNullable()
      table.timestamp("created_at").defaultTo(knex.fn.now())
      table.timestamp("updated_at").defaultTo(knex.fn.now())
  
      // Add an index for faster lookups by repository
      table.index(["repo_owner", "repo_name"])
    })
  }
  
  /**
   * @param { import('knex').Knex } knex
   * @returns { Promise<void> }
   */
  exports.down = async (knex) => {
    await knex.schema.dropTable("repo_connections")
  }
  
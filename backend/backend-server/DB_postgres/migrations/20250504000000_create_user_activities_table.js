/**
 * @param { import('knex').Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async (knex) => {
    // Create user_activities table
    await knex.schema.createTable("user_activities", (table) => {
      table.increments("id").primary()
      table.string("username").notNullable()
      table.enum("activity_type", ["user_followed", "repo_starred"]).notNullable()
      table.string("target_user").nullable()
      table.string("target_repo").nullable()
      table.timestamp("created_at").defaultTo(knex.fn.now())
  
      // Add foreign key to users table
      table.foreign("username").references("username").inTable("users").onDelete("CASCADE")
  
      // Add indexes for faster lookups
      table.index("username")
      table.index("activity_type")
      table.index("created_at")
    })
  }
  
  /**
   * @param { import('knex').Knex } knex
   * @returns { Promise<void> }
   */
  exports.down = async (knex) => {
    await knex.schema.dropTable("user_activities")
  }
  
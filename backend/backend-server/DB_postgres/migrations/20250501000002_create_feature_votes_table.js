/**
 * @param { import('knex').Knex } knex
 * @returns { Promise<void> }
 */
exports.up = (knex) =>
    knex.schema.createTable("feature_votes", (table) => {
      table.increments("id").primary()
      table.integer("feature_id").notNullable()
      table.string("username").notNullable()
      table.foreign("feature_id").references("id").inTable("features").onDelete("CASCADE")
      table.foreign("username").references("username").inTable("users").onDelete("CASCADE")
      table.timestamp("created_at").defaultTo(knex.fn.now())
      table.unique(["feature_id", "username"]) // Prevent duplicate votes from the same user
    })
  
  /**
   * @param { import('knex').Knex } knex
   * @returns { Promise<void> }
   */
  exports.down = (knex) => knex.schema.dropTable("feature_votes")
  
/**
 * @param { import('knex').Knex } knex
 * @returns { Promise<void> }
 */
exports.up = (knex) =>
    knex.schema.createTable("features", (table) => {
      table.increments("id").primary()
      table.string("title").notNullable()
      table.text("description").notNullable()
      table.enum("status", ["backlog", "in-progress", "completed"]).defaultTo("backlog").notNullable()
      table.enum("priority", ["low", "medium", "high"]).defaultTo("medium").notNullable()
      table.integer("votes_count").defaultTo(0).notNullable()
      table.integer("comments_count").defaultTo(0).notNullable()
      table.string("created_by_username").notNullable()
      table.foreign("created_by_username").references("username").inTable("users").onDelete("CASCADE")
      table.timestamp("created_at").defaultTo(knex.fn.now())
      table.timestamp("updated_at").defaultTo(knex.fn.now())
    })
  
  /**
   * @param { import('knex').Knex } knex
   * @returns { Promise<void> }
   */
  exports.down = (knex) => knex.schema.dropTable("features")
  
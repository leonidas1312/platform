
/**
   * @param { import('knex').Knex } knex
   * @returns { Promise<void> }
*/
exports.up = function (knex) {
    return knex.schema.createTable("posts", (table) => {
      table.increments("id").primary()
      table.string("author_username").notNullable()
      table.text("content").notNullable()
      table.integer("likes_count").notNullable().defaultTo(0)
      table.integer("comments_count").notNullable().defaultTo(0)
      table.integer("reposts_count").notNullable().defaultTo(0)
      table.timestamp("created_at").defaultTo(knex.fn.now())
    })
  }
  
/**
   * @param { import('knex').Knex } knex
   * @returns { Promise<void> }
*/
  exports.down = function (knex) {
    return knex.schema.dropTableIfExists("posts")
  }
  
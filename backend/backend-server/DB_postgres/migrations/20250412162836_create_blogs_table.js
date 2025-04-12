
/**
   * @param { import('knex').Knex } knex
   * @returns { Promise<void> }
*/
exports.up = function (knex) {
    return knex.schema.createTable("blogs", (table) => {
      table.increments("id").primary()
      table.string("author_username").notNullable()
      table.string("title").notNullable()
      table.text("summary").notNullable()
      table.text("content").notNullable()
      table.string("category").notNullable()
      table.text("image_url")
      table.text("optimizer_name")
      table.text("optimizer_url")
      table.text("problem_name")
      table.text("problem_description")
      table.text("tags")
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
  
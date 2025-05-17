/**
 * @param { import('knex').Knex } knex
 * @returns { Promise<void> }
 */
exports.up = (knex) =>
    knex.schema.alterTable("posts", (table) => {
      // Add a type column with default value 'general'
      table
        .enum("type", ["general", "feature_request", "question", "new_qubot"])
        .notNullable()
        .defaultTo("general")
        .after("content")
    })
  
  /**
   * @param { import('knex').Knex } knex
   * @returns { Promise<void> }
   */
  exports.down = (knex) =>
    knex.schema.alterTable("posts", (table) => {
      table.dropColumn("type")
    })
  
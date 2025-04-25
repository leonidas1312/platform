/**
 * @param { import('knex').Knex } knex
 * @returns { Promise<void> }
 */
exports.up = (knex) =>
    knex.schema.createTable("feature_tags", (table) => {
      table.increments("id").primary()
      table.integer("feature_id").notNullable()
      table.string("tag_name").notNullable()
      table.foreign("feature_id").references("id").inTable("features").onDelete("CASCADE")
      table.unique(["feature_id", "tag_name"]) // Prevent duplicate tags for the same feature
    })
  
  /**
   * @param { import('knex').Knex } knex
   * @returns { Promise<void> }
   */
  exports.down = (knex) => knex.schema.dropTable("feature_tags")
  
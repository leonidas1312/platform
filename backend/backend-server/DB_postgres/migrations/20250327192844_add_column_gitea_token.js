// migrations/202303281000_add_gitea_token_to_users.js

/**
   * @param { import('knex').Knex } knex
   * @returns { Promise<void> }
*/
exports.up = function (knex) {
    return knex.schema.alterTable("users", (table) => {
      table.string("gitea_token").nullable()
    })
  }
  
/**
   * @param { import('knex').Knex } knex
   * @returns { Promise<void> }
*/
exports.down = function (knex) {
return knex.schema.alterTable("users", (table) => {
    table.dropColumn("gitea_token")
})
}

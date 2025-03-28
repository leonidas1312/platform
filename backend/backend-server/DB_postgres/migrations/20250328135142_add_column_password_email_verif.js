// migrations/202303281000_add_gitea_token_to_users.js

/**
   * @param { import('knex').Knex } knex
   * @returns { Promise<void> }
*/
exports.up = function (knex) {
    return knex.schema.alterTable("email_verifications", (table) => {
      table.string("passowrd").nullable()
    })
  }
  
/**
   * @param { import('knex').Knex } knex
   * @returns { Promise<void> }
*/
exports.down = function (knex) {
return knex.schema.alterTable("email_verifications", (table) => {
    table.dropColumn("password")
})
}

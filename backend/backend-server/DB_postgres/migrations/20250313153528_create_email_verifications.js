/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
    return knex.schema.createTable('email_verifications', table => {
      table.string('username').primary();
      table.string('email').notNullable();
      table.string('token').notNullable().unique();
      table.timestamp('created_at').defaultTo(knex.fn.now());
    });
  };

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
    return knex.schema.dropTable('email_verifications');
  };

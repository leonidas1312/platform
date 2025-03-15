/**
 * @param { import('knex').Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
    return knex.schema.createTable('users', (table) => {
      table.increments('id').primary(); // auto-increment ID
      table.string('username').notNullable().unique();
      table.string('login_name').notNullable().unique();
      table.string('email').notNullable().unique();
      table.string('password').notNullable(); // store hash, not plain text
      table.string('description').notNullable();
      table.string('full_name').notNullable();
      table.string('location').notNullable();
      table.string('visibility').notNullable();
      table.string('website').notNullable();
      table.boolean('active').notNullable().defaultTo(false);
      table.boolean('restricted').defaultTo(true);
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
    });
  };
  
  /**
   * @param { import('knex').Knex } knex
   * @returns { Promise<void> }
   */
  exports.down = async function(knex) {
    return knex.schema.dropTableIfExists('users');
  };
  
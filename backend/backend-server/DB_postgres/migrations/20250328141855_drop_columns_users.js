// For example: 20230401_drop_unused_columns_from_users.js
/**
 * @param { import('knex').Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
    return knex.schema.alterTable("users", (table) => {
      table.dropColumn("login_name");
      table.dropColumn("description");
      table.dropColumn("full_name");
      table.dropColumn("location");
      table.dropColumn("visibility");
      table.dropColumn("website");
      table.dropColumn("active");
      table.dropColumn("restricted");
      table.dropColumn("created_at");
      table.dropColumn("updated_at");
    });
  };
  
  /**
   * @param { import('knex').Knex } knex
   * @returns { Promise<void> }
   */
  exports.down = async function (knex) {
    return knex.schema.alterTable("users", (table) => {
      // Re-create columns if you roll back the migration:
      table.string("login_name").notNullable().unique();
      table.string("description").notNullable();
      table.string("full_name").notNullable();
      table.string("location").notNullable();
      table.string("visibility").notNullable();
      table.string("website").notNullable();
      table.boolean("active").notNullable().defaultTo(false);
      table.boolean("restricted").defaultTo(true);
      table.timestamp("created_at").defaultTo(knex.fn.now());
      table.timestamp("updated_at").defaultTo(knex.fn.now());
    });
  };
  
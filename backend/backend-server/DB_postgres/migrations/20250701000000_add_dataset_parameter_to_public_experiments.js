/**
 * Migration: Add dataset_parameter field to public_experiments table
 * 
 * This migration adds a field to store which parameter should receive
 * the dataset content when a dataset is connected to a problem in
 * public decision models.
 * 
 * @param { import('knex').Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async (knex) => {
  // Add dataset_parameter field to public_experiments table
  await knex.schema.alterTable("public_experiments", (table) => {
    table.string("dataset_parameter").nullable() // e.g., 'csv_data', 'dataset_content', etc.
  })

  console.log("✅ Added dataset_parameter field to public_experiments table")
}

/**
 * @param { import('knex').Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async (knex) => {
  // Remove dataset_parameter field from public_experiments table
  await knex.schema.alterTable("public_experiments", (table) => {
    table.dropColumn("dataset_parameter")
  })

  console.log("✅ Removed dataset_parameter field from public_experiments table")
}

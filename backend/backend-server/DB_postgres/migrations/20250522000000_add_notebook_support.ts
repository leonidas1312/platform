/**
 * @param { import('knex').Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async (knex) => {
    // Add notebook_file column to benchmarks table
    await knex.schema.alterTable("benchmarks", (table) => {
      table.text("notebook_file").nullable()
      table.string("notebook_filename").nullable()
    })
  
    // Add notebook_file column to benchmark_results table
    await knex.schema.alterTable("benchmark_results", (table) => {
      table.text("notebook_file").nullable()
      table.string("notebook_filename").nullable()
    })
  }
  
  /**
   * @param { import('knex').Knex } knex
   * @returns { Promise<void> }
   */
  exports.down = async (knex) => {
    // Remove notebook_file column from benchmarks table
    await knex.schema.alterTable("benchmarks", (table) => {
      table.dropColumn("notebook_file")
      table.dropColumn("notebook_filename")
    })
  
    // Remove notebook_file column from benchmark_results table
    await knex.schema.alterTable("benchmark_results", (table) => {
      table.dropColumn("notebook_file")
      table.dropColumn("notebook_filename")
    })
  }
  
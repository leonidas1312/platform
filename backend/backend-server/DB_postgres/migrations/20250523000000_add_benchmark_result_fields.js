/**
 * @param { import('knex').Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async (knex) => {
  // Add missing columns to benchmark_results table
  await knex.schema.alterTable("benchmark_results", (table) => {
    // Add score field
    table.decimal("score", 10, 4).nullable()
    
    // Add algorithm_name field
    table.string("algorithm_name").nullable()
    
    // Add repository_url field
    table.string("repository_url").nullable()
    
    // Add notes field
    table.text("notes").nullable()
    
    // Add author field
    table.string("author").nullable()
    
    // Add updated_at field
    table.timestamp("updated_at").defaultTo(knex.fn.now())
    
    // Add indexes for better performance
    table.index("score")
    table.index("author")
  })

  // Also make metrics nullable if it isn't already
  const hasMetricsColumn = await knex.schema.hasColumn("benchmark_results", "metrics")
  if (hasMetricsColumn) {
    // Check if metrics is currently NOT NULL and change it to nullable
    await knex.raw(`
      ALTER TABLE benchmark_results 
      ALTER COLUMN metrics DROP NOT NULL
    `)
  }
}

/**
 * @param { import('knex').Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async (knex) => {
  // Remove the added columns
  await knex.schema.alterTable("benchmark_results", (table) => {
    table.dropColumn("score")
    table.dropColumn("algorithm_name")
    table.dropColumn("repository_url")
    table.dropColumn("notes")
    table.dropColumn("author")
    table.dropColumn("updated_at")
  })

  // Restore metrics to NOT NULL if needed
  await knex.raw(`
    ALTER TABLE benchmark_results 
    ALTER COLUMN metrics SET NOT NULL
  `)
}

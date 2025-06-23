/**
 * Migration: Create ArXiv Papers Tables (Placeholder)
 *
 * This is a placeholder migration file that was referenced in the database
 * but the original file was missing. This migration creates the tables
 * that will be immediately dropped by the next migration.
 *
 * @param { import('knex').Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async (knex) => {
  // Create arxiv_papers table (will be dropped by next migration)
  await knex.schema.createTable("arxiv_papers", (table) => {
    table.increments("id").primary()
    table.string("arxiv_id").notNullable().unique() // e.g., "2401.12345"
    table.string("title").notNullable()
    table.text("authors").notNullable() // JSON array of author names
    table.text("abstract").notNullable()
    table.date("published_date").notNullable()
    table.text("categories").notNullable() // JSON array of arXiv categories
    table.string("arxiv_url").notNullable()
    table.string("pdf_url").notNullable()
    table.boolean("is_featured").defaultTo(false) // For highlighting important papers
    table.timestamp("created_at").defaultTo(knex.fn.now())
    table.timestamp("updated_at").defaultTo(knex.fn.now())

    // Add indexes for efficient querying
    table.index("arxiv_id")
    table.index("published_date")
    table.index("is_featured")
    table.index("created_at")
  })

  // Create arxiv_fetch_logs table (will be dropped by next migration)
  await knex.schema.createTable("arxiv_fetch_logs", (table) => {
    table.increments("id").primary()
    table.timestamp("fetch_date").defaultTo(knex.fn.now())
    table.integer("papers_fetched").defaultTo(0)
    table.integer("new_papers").defaultTo(0)
    table.text("categories_searched").notNullable() // JSON array of searched categories
    table.boolean("success").defaultTo(true)
    table.text("error_message").nullable()
    table.timestamp("created_at").defaultTo(knex.fn.now())

    // Add index for tracking fetch history
    table.index("fetch_date")
    table.index("success")
  })

  console.log("✅ Created arxiv_papers and arxiv_fetch_logs tables (placeholder)")
}

/**
 * Rollback migration - drop the tables
 */
exports.down = async (knex) => {
  await knex.schema.dropTableIfExists("arxiv_fetch_logs")
  await knex.schema.dropTableIfExists("arxiv_papers")
  console.log("✅ Dropped arxiv_papers and arxiv_fetch_logs tables")
}

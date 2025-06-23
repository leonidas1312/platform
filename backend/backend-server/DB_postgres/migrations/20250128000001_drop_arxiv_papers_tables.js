/**
 * Migration: Drop ArXiv Papers Tables
 *
 * Removes the daily papers functionality by dropping the arxiv_papers and arxiv_fetch_logs tables.
 *
 * @param { import('knex').Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async (knex) => {
  // Drop arxiv_fetch_logs table first (no foreign key dependencies)
  await knex.schema.dropTableIfExists("arxiv_fetch_logs")
  console.log("✅ Dropped arxiv_fetch_logs table")

  // Drop arxiv_papers table
  await knex.schema.dropTableIfExists("arxiv_papers")
  console.log("✅ Dropped arxiv_papers table")
}

/**
 * Rollback migration - recreate the tables if needed
 * Note: This will recreate empty tables without data
 */
exports.down = async (knex) => {
  // Recreate arxiv_papers table
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
    table.integer("view_count").defaultTo(0) // Track paper views
    table.timestamp("created_at").defaultTo(knex.fn.now())
    table.timestamp("updated_at").defaultTo(knex.fn.now())

    // Add indexes for efficient querying
    table.index("published_date")
    table.index("categories")
    table.index("is_featured")
    table.index("created_at")
  })

  // Recreate arxiv_fetch_logs table
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

  console.log("✅ Recreated arxiv_papers and arxiv_fetch_logs tables")
}

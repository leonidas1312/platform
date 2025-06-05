/**
 * @param { import('knex').Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async (knex) => {
  // Check if columns already exist before adding them
  const hasIsPublic = await knex.schema.hasColumn("benchmarks", "is_public")
  const hasTags = await knex.schema.hasColumn("benchmarks", "tags")

  if (!hasIsPublic || !hasTags) {
    await knex.schema.alterTable("benchmarks", (table) => {
      // Add is_public field if it doesn't exist
      if (!hasIsPublic) {
        table.boolean("is_public").defaultTo(false)
        table.index("is_public")
      }
      
      // Add tags field if it doesn't exist
      if (!hasTags) {
        table.text("tags").nullable()
      }
    })
    
    console.log("Added missing fields to benchmarks table:")
    if (!hasIsPublic) console.log("- is_public (boolean, default false)")
    if (!hasTags) console.log("- tags (text, nullable)")
  } else {
    console.log("Fields is_public and tags already exist in benchmarks table")
  }
}

/**
 * @param { import('knex').Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async (knex) => {
  // Remove the added columns
  await knex.schema.alterTable("benchmarks", (table) => {
    table.dropColumn("is_public")
    table.dropColumn("tags")
  })
}

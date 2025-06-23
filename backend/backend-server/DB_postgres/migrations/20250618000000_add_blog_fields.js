/**
 * @param { import('knex').Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async (knex) => {
  // Check if blogs table exists
  const blogsTableExists = await knex.schema.hasTable("blogs")
  
  if (blogsTableExists) {
    // Add missing columns to blogs table
    const hasReadTime = await knex.schema.hasColumn("blogs", "read_time")
    const hasUpdatedAt = await knex.schema.hasColumn("blogs", "updated_at")
    const hasViews = await knex.schema.hasColumn("blogs", "views_count")

    await knex.schema.table("blogs", (table) => {
      if (!hasReadTime) {
        table.integer("read_time").defaultTo(5) // Default 5 minute read time
      }
      if (!hasUpdatedAt) {
        table.timestamp("updated_at").defaultTo(knex.fn.now())
      }
      if (!hasViews) {
        table.integer("views_count").defaultTo(0)
      }
    })
  }

  // Create blog_likes table if it doesn't exist
  const blogLikesExists = await knex.schema.hasTable("blog_likes")
  if (!blogLikesExists) {
    await knex.schema.createTable("blog_likes", (table) => {
      table.increments("id").primary()
      table.integer("blog_id").notNullable()
      table.string("username").notNullable()
      table.foreign("blog_id").references("id").inTable("blogs").onDelete("CASCADE")
      table.foreign("username").references("username").inTable("users").onDelete("CASCADE")
      table.timestamp("created_at").defaultTo(knex.fn.now())
      table.unique(["blog_id", "username"]) // Prevent duplicate likes from the same user
    })
  }

  // Create blog_comments table if it doesn't exist
  const blogCommentsExists = await knex.schema.hasTable("blog_comments")
  if (!blogCommentsExists) {
    await knex.schema.createTable("blog_comments", (table) => {
      table.increments("id").primary()
      table.integer("blog_id").notNullable()
      table.string("username").notNullable()
      table.text("content").notNullable()
      table.foreign("blog_id").references("id").inTable("blogs").onDelete("CASCADE")
      table.foreign("username").references("username").inTable("users").onDelete("CASCADE")
      table.timestamp("created_at").defaultTo(knex.fn.now())
      table.timestamp("updated_at").defaultTo(knex.fn.now())
    })
  }
}

/**
 * @param { import('knex').Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async (knex) => {
  // Drop the new tables
  await knex.schema.dropTableIfExists("blog_comments")
  await knex.schema.dropTableIfExists("blog_likes")

  // Remove the added columns from blogs table
  const blogsTableExists = await knex.schema.hasTable("blogs")
  if (blogsTableExists) {
    const hasReadTime = await knex.schema.hasColumn("blogs", "read_time")
    const hasUpdatedAt = await knex.schema.hasColumn("blogs", "updated_at")
    const hasViews = await knex.schema.hasColumn("blogs", "views_count")

    if (hasReadTime || hasUpdatedAt || hasViews) {
      await knex.schema.table("blogs", (table) => {
        if (hasReadTime) table.dropColumn("read_time")
        if (hasUpdatedAt) table.dropColumn("updated_at")
        if (hasViews) table.dropColumn("views_count")
      })
    }
  }
}

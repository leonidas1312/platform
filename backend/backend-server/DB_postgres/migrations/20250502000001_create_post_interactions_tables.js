/**
 * @param { import('knex').Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async (knex) => {
    // First check if posts table exists, if not, create it
    const postsTableExists = await knex.schema.hasTable("posts")
    if (!postsTableExists) {
      await knex.schema.createTable("posts", (table) => {
        table.increments("id").primary()
        table.string("author_username").notNullable()
        table.text("content").notNullable()
        table.integer("likes_count").defaultTo(0).notNullable()
        table.integer("comments_count").defaultTo(0).notNullable()
        table.integer("reposts_count").defaultTo(0).notNullable()
        table.timestamp("created_at").defaultTo(knex.fn.now())
        table.timestamp("updated_at").defaultTo(knex.fn.now())
        table.foreign("author_username").references("username").inTable("users").onDelete("CASCADE")
      })
    } else {
      // Check if likes_count column exists, if not add it
      const hasLikesCount = await knex.schema.hasColumn("posts", "likes_count")
      if (!hasLikesCount) {
        await knex.schema.table("posts", (table) => {
          table.integer("likes_count").defaultTo(0).notNullable()
        })
      }
  
      // Check if comments_count column exists, if not add it
      const hasCommentsCount = await knex.schema.hasColumn("posts", "comments_count")
      if (!hasCommentsCount) {
        await knex.schema.table("posts", (table) => {
          table.integer("comments_count").defaultTo(0).notNullable()
        })
      }
    }
  
    // Create post_likes table
    const postLikesExists = await knex.schema.hasTable("post_likes")
    if (!postLikesExists) {
      await knex.schema.createTable("post_likes", (table) => {
        table.increments("id").primary()
        table.integer("post_id").notNullable()
        table.string("username").notNullable()
        table.foreign("post_id").references("id").inTable("posts").onDelete("CASCADE")
        table.foreign("username").references("username").inTable("users").onDelete("CASCADE")
        table.timestamp("created_at").defaultTo(knex.fn.now())
        table.unique(["post_id", "username"]) // Prevent duplicate likes from the same user
      })
    }
  
    // Create post_comments table
    const postCommentsExists = await knex.schema.hasTable("post_comments")
    if (!postCommentsExists) {
      await knex.schema.createTable("post_comments", (table) => {
        table.increments("id").primary()
        table.integer("post_id").notNullable()
        table.string("username").notNullable()
        table.text("content").notNullable()
        table.foreign("post_id").references("id").inTable("posts").onDelete("CASCADE")
        table.foreign("username").references("username").inTable("users").onDelete("CASCADE")
        table.timestamp("created_at").defaultTo(knex.fn.now())
      })
    }
  
    
  }
  
  /**
   * @param { import('knex').Knex } knex
   * @returns { Promise<void> }
   */
  exports.down = async (knex) => {
    await knex.schema.dropTableIfExists("post_comments")
    await knex.schema.dropTableIfExists("post_likes")
  
    // Remove the added columns from posts table
    const postsTableExists = await knex.schema.hasTable("posts")
    if (postsTableExists) {
      const hasLikesCount = await knex.schema.hasColumn("posts", "likes_count")
      const hasCommentsCount = await knex.schema.hasColumn("posts", "comments_count")
  
      if (hasLikesCount || hasCommentsCount) {
        await knex.schema.table("posts", (table) => {
          if (hasLikesCount) table.dropColumn("likes_count")
          if (hasCommentsCount) table.dropColumn("comments_count")
        })
      }
    }
  }
  
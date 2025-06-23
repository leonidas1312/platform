/**
 * @param { import('knex').Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
    // Check if columns exist before adding them to avoid conflicts
    const hasGithubId = await knex.schema.hasColumn('users', 'github_id')
    const hasGithubUsername = await knex.schema.hasColumn('users', 'github_username')
    const hasGithubAccessToken = await knex.schema.hasColumn('users', 'github_access_token')
    const hasFullName = await knex.schema.hasColumn('users', 'full_name')
    const hasAvatarUrl = await knex.schema.hasColumn('users', 'avatar_url')
    const hasCreatedAt = await knex.schema.hasColumn('users', 'created_at')
    const hasUpdatedAt = await knex.schema.hasColumn('users', 'updated_at')

    return knex.schema.alterTable('users', (table) => {
      // GitHub OAuth fields
      if (!hasGithubId) table.string('github_id').nullable().unique()
      if (!hasGithubUsername) table.string('github_username').nullable()
      if (!hasGithubAccessToken) table.text('github_access_token').nullable()

      // User profile fields from GitHub
      if (!hasFullName) table.string('full_name').nullable()
      if (!hasAvatarUrl) table.text('avatar_url').nullable()

      // Make password nullable for GitHub OAuth users
      table.string('password').nullable().alter()

      // Add timestamps back if they don't exist
      if (!hasCreatedAt) table.timestamp('created_at').defaultTo(knex.fn.now())
      if (!hasUpdatedAt) table.timestamp('updated_at').defaultTo(knex.fn.now())
    })
    .then(async () => {
      // Add indexes separately to avoid conflicts
      try {
        const hasGithubIdIndex = await knex.schema.raw("SELECT indexname FROM pg_indexes WHERE tablename = 'users' AND indexname LIKE '%github_id%'")
        const hasGithubUsernameIndex = await knex.schema.raw("SELECT indexname FROM pg_indexes WHERE tablename = 'users' AND indexname LIKE '%github_username%'")

        if (hasGithubIdIndex.rows.length === 0) {
          await knex.schema.raw('CREATE INDEX CONCURRENTLY IF NOT EXISTS users_github_id_index ON users (github_id)')
        }
        if (hasGithubUsernameIndex.rows.length === 0) {
          await knex.schema.raw('CREATE INDEX CONCURRENTLY IF NOT EXISTS users_github_username_index ON users (github_username)')
        }
      } catch (error) {
        console.log('Index creation failed, but continuing:', error.message)
      }
    })
  }
  
  /**
   * @param { import('knex').Knex } knex
   * @returns { Promise<void> }
   */
  exports.down = async function(knex) {
    return knex.schema.alterTable('users', (table) => {
      // Remove GitHub OAuth fields
      table.dropColumn('github_id')
      table.dropColumn('github_username')
      table.dropColumn('github_access_token')
  
      // Remove user profile fields
      table.dropColumn('full_name')
      table.dropColumn('avatar_url')
  
      // Make password required again
      table.string('password').notNullable().alter()
  
      // Remove timestamps if they were added
      table.dropColumn('created_at')
      table.dropColumn('updated_at')
    })
  }
  
/**
 * @param { import('knex').Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  return knex.schema.alterTable('users', (table) => {
    // GitHub OAuth fields
    table.string('github_id').nullable().unique()
    table.string('github_username').nullable()
    table.text('github_access_token').nullable()

    // User profile fields from GitHub
    table.string('full_name').nullable()
    table.text('avatar_url').nullable()

    // Make password nullable for GitHub OAuth users
    table.string('password').nullable().alter()

    // Add timestamps back if they don't exist
    table.timestamp('created_at').defaultTo(knex.fn.now())
    table.timestamp('updated_at').defaultTo(knex.fn.now())

    // Add indexes for better performance
    table.index('github_id')
    table.index('github_username')
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

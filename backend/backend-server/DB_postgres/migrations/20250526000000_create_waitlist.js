/**
 * @param { import('knex').Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async (knex) => {
  // Check if table already exists
  const exists = await knex.schema.hasTable('waitlist')
  if (exists) {
    console.log('Waitlist table already exists, skipping creation')
    return
  }

  await knex.schema.createTable('waitlist', (table) => {
    table.increments('id').primary()
    table.string('email').notNullable()
    table.string('username').notNullable()
    table.text('description').nullable()
    table.string('ip_address').nullable()
    table.string('user_agent').nullable()
    table.string('referrer').nullable()
    table.enum('status', ['pending', 'approved', 'rejected']).defaultTo('pending')
    table.text('admin_notes').nullable()
    table.timestamp('created_at').defaultTo(knex.fn.now())
    table.timestamp('updated_at').defaultTo(knex.fn.now())

    // Indexes for better performance
    table.index('email')
    table.index('username')
    table.index('status')
    table.index('created_at')

    // Unique constraints
    table.unique('email')
    table.unique('username')
  })

  console.log('Created waitlist table with indexes and constraints')
}

/**
 * @param { import('knex').Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async (knex) => {
  await knex.schema.dropTable('waitlist')
  console.log('Dropped waitlist table')
}

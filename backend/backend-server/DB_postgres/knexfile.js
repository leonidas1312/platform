require('dotenv').config();

/**
 * @type { Object.<string, import("knex").Knex.Config> }
 */
module.exports = {

  development: {
    client: 'pg',
    connection: {
      database: 'rastion',
      user:     process.env.KNEX_USER,
      password: process.env.KNEX_PW
    },
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      tableName: 'knex_migrations',
      directory: './migrations'
    }
  },

  staging: {
    client: 'pg',
    connection: {
      database: 'rastion',
      user:     process.env.KNEX_USER,
      password: process.env.KNEX_PW
    },
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      tableName: 'knex_migrations',
      directory: './migrations'
    }
  },

  production: {
    client: 'pg',
    connection: {
      database: 'rastion',
      user:     process.env.KNEX_USER,
      password: process.env.KNEX_PW
    },
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      tableName: 'knex_migrations',
      directory: './migrations'
    }
  }

};

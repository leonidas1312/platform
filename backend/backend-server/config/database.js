const knex = require("knex")(require("../DB_postgres/knexfile").production)

module.exports = {
  knex
}

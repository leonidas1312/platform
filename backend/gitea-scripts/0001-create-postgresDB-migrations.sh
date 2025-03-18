#!/bin/sh

# Run migrations before starting the server using the specified knexfile
docker-compose exec backend sh -c "npx knex migrate:latest --env production --knexfile ./DB_postgres/knexfile.js"

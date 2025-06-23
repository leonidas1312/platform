const session = require("express-session")

// Configure session store based on environment
let sessionStore
if (process.env.NODE_ENV === 'production') {
  // Use PostgreSQL session store for production
  const pgSession = require('connect-pg-simple')(session)
  const { Pool } = require('pg')

  // Create a raw pg pool for connect-pg-simple
  const pgPool = new Pool({
    host: process.env.POSTGRES_HOST,
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: 'rastion',
    port: 5432,
    max: 10,
    min: 2,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  })

  sessionStore = new pgSession({
    pool: pgPool,
    tableName: 'session', // Will be created automatically
    createTableIfMissing: true
  })

  console.log("📦 Using PostgreSQL session store for production")
} else {
  // Use memory store for development (with warning suppression)
  console.log("⚠️  Using MemoryStore for development - not suitable for production")
}

const sessionConfig = session({
  store: sessionStore,
  secret: process.env.SESSION_SECRET || "RwsikosPromaxxwnas",
  resave: false,
  saveUninitialized: false,
  cookie: {
    domain: process.env.NODE_ENV === 'production' ? "rastion.com" : undefined,
    secure: process.env.NODE_ENV === 'production', // HTTPS in production
    httpOnly: true,
    sameSite: process.env.NODE_ENV === 'production' ? "lax" : "lax",
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  },
})

module.exports = sessionConfig

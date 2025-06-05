const session = require("express-session")

const sessionConfig = session({
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

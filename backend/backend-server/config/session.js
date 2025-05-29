const session = require("express-session")

const sessionConfig = session({
  secret: "RwsikosPromaxxwnas",
  resave: false,
  saveUninitialized: false,
  cookie: {
    domain: "rastion.com",
    secure: true, // keep false locally (no HTTPS yet)
    httpOnly: true,
    sameSite: "lax", // or "none" + secure:false if you prefer
    maxAge: 6_000_000,
  },
})

module.exports = sessionConfig

const cors = require("cors")

const corsConfig = cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true)
    if (
      origin.startsWith("https://rastion.com") ||
      origin.startsWith("http://localhost") ||
      origin.startsWith("http://127.0.0.1")
    ) {
      return callback(null, true)
    }
    return callback(new Error("Not allowed by CORS"))
  },
  credentials: true,
})

module.exports = corsConfig

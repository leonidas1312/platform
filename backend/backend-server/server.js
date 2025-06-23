const express = require("express")
const http = require("http")
const WebSocket = require("ws")
const cookieParser = require("cookie-parser")
require("dotenv").config()

// Import configuration
const corsConfig = require("./config/cors")
const sessionConfig = require("./config/session")

// Import middleware
const errorHandler = require("./middleware/errorHandler")
const { restoreSessionFromCookie } = require("./middleware/auth")

// Import routes
const apiRoutes = require("./routes")

// Import WebSocket handler
const PlaygroundWebSocketHandler = require("./routes/playgroundWebSocket")

// ArXiv service removed - functionality deprecated

const app = express()
const server = http.createServer(app)

// Create WebSocket server - accept all connections and filter in handler
const wss = new WebSocket.Server({
  server,
  verifyClient: (info) => {
    // Accept connections to playground, notifications, submissions, and workflow automation
    return info.req.url.startsWith('/api/playground') ||
           info.req.url.startsWith('/api/notifications') ||
           info.req.url.startsWith('/api/submissions') ||
           info.req.url.startsWith('/api/workflow-automation')
  }
})

// Initialize WebSocket handler
const wsHandler = new PlaygroundWebSocketHandler()

// Make WebSocket handler globally available for notifications
global.wsHandler = wsHandler

// Handle WebSocket connections
wss.on('connection', (ws, request) => {
  wsHandler.handleConnection(ws, request)
})

// Basic middleware
app.use(express.json({ limit: "50mb" }))
app.use(express.urlencoded({ limit: "50mb", extended: true }))
app.use(cookieParser())
app.set("trust proxy", 1)

// Configuration middleware
app.use(corsConfig)
app.use(sessionConfig)

// Session restoration middleware (must be after session config)
app.use(restoreSessionFromCookie)

// API routes
app.use("/api", apiRoutes)

// WebSocket status endpoint
app.get("/api/playground/ws/status", (req, res) => {
  res.json({
    success: true,
    websocket_status: "active",
    ...wsHandler.getConnectionStatus()
  })
})

// Error handling middleware (must be last)
app.use(errorHandler)

// Start server
const PORT = process.env.PORT || 4000
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`)
  console.log(`📡 API available at http://localhost:${PORT}/api`)
  console.log(`🏥 Health check at http://localhost:${PORT}/api/health`)
  console.log(`🔌 WebSocket server available at ws://localhost:${PORT}/api/playground`)
})

// ArXiv functionality removed - tables dropped in migration 20250128000001_drop_arxiv_papers_tables.js

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully')
  wsHandler.closeAllConnections()
  server.close(() => {
    console.log('Server closed')
    process.exit(0)
  })
})

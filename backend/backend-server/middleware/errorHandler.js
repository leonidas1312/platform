// Global error handler middleware
const errorHandler = (err, req, res, next) => {
  console.error("Error:", err)

  // Handle specific error types
  if (err.message === "Not allowed by CORS") {
    return res.status(403).json({ message: "CORS policy violation" })
  }

  if (err.message === "Only Jupyter notebook (.ipynb) files are allowed") {
    return res.status(400).json({ message: err.message })
  }

  // Default error response
  res.status(500).json({ 
    message: "Internal server error",
    ...(process.env.NODE_ENV === "development" && { error: err.message })
  })
}

module.exports = errorHandler

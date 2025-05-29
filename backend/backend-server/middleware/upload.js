const multer = require("multer")
const fs = require("fs")
const path = require("path")

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "../uploads")
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }
    cb(null, uploadDir)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9)
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname))
  },
})

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    // Accept only .ipynb files
    if (path.extname(file.originalname) !== ".ipynb") {
      return cb(new Error("Only Jupyter notebook (.ipynb) files are allowed"))
    }
    cb(null, true)
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  },
})

module.exports = upload

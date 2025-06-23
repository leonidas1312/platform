const express = require('express')
const multer = require('multer')
const path = require('path')
const fs = require('fs').promises
const crypto = require('crypto')
const { knex } = require('../config/database')
const DatasetService = require('../services/datasetService')
const DatasetValidator = require('../services/datasetValidator')

// UUID generation function
const uuidv4 = () => crypto.randomUUID()

const router = express.Router()

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/datasets')
    try {
      await fs.mkdir(uploadDir, { recursive: true })
      cb(null, uploadDir)
    } catch (error) {
      cb(error)
    }
  },
  filename: (req, file, cb) => {
    // Generate unique filename with original extension
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`
    cb(null, uniqueName)
  }
})

const upload = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow common dataset file types
    const allowedTypes = [
      '.tsp', '.vrp', '.json', '.txt', '.dat', '.csv',
      '.fjs', '.rcp', '.in', '.sd', '.vrpb'
    ]
    const ext = path.extname(file.originalname).toLowerCase()
    
    if (allowedTypes.includes(ext)) {
      cb(null, true)
    } else {
      cb(new Error(`File type ${ext} not allowed. Supported types: ${allowedTypes.join(', ')}`))
    }
  }
})

/**
 * POST /api/datasets/upload
 * Upload a new dataset file
 */
router.post('/upload', upload.single('dataset'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' })
    }

    const { name, description, format_type, problem_type = 'auto', is_public = false } = req.body
    const user_id = req.session?.user_data?.user?.login || req.headers['x-user-id']

    if (!user_id) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    if (!name || !format_type) {
      return res.status(400).json({ error: 'Name and format_type are required' })
    }

    // Generate dataset ID
    const dataset_id = uuidv4()

    // Quick validation before processing
    const fileContent = await fs.readFile(req.file.path, 'utf8')
    const quickValidation = DatasetValidator.quickValidate(fileContent, format_type)

    if (!quickValidation.valid) {
      // Delete uploaded file if validation fails
      try {
        await fs.unlink(req.file.path)
      } catch (unlinkError) {
        console.warn('Failed to delete invalid file:', unlinkError)
      }

      return res.status(400).json({
        error: 'Dataset validation failed',
        details: quickValidation.basic_checks
      })
    }

    // Extract metadata from the uploaded file
    const metadata = await DatasetService.extractMetadata(req.file.path, format_type, problem_type)

    // Create dataset record
    const dataset = {
      id: dataset_id,
      user_id,
      name,
      description,
      file_path: req.file.path,
      file_size: req.file.size,
      mime_type: req.file.mimetype,
      format_type,
      metadata: JSON.stringify(metadata),
      is_public: Boolean(is_public),
      original_filename: req.file.originalname
    }

    await knex('datasets').insert(dataset)

    // Compute compatibility with existing problems (async)
    DatasetService.computeCompatibility(dataset_id).catch(console.error)

    res.status(201).json({
      success: true,
      dataset: {
        id: dataset_id,
        name,
        description,
        format_type,
        metadata,
        file_size: req.file.size,
        original_filename: req.file.originalname,
        created_at: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Dataset upload error:', error)
    res.status(500).json({ error: 'Failed to upload dataset' })
  }
})

/**
 * GET /api/datasets
 * List user's datasets or public datasets
 */
router.get('/', async (req, res) => {
  try {
    const user_id = req.session?.user_data?.user?.login || req.headers['x-user-id']
    const { format_type, public_only } = req.query

    let query = knex('datasets').select([
      'id', 'name', 'description', 'format_type', 'metadata',
      'file_size', 'original_filename', 'is_public', 'user_id', 'created_at'
    ])

    if (public_only === 'true') {
      query = query.where('is_public', true)
    } else if (user_id) {
      query = query.where(function() {
        this.where('user_id', user_id).orWhere('is_public', true)
      })
    } else {
      query = query.where('is_public', true)
    }

    if (format_type) {
      query = query.where('format_type', format_type)
    }

    const datasets = await query.orderBy('created_at', 'desc')

    // Parse metadata JSON
    const datasetsWithMetadata = datasets.map(dataset => ({
      ...dataset,
      metadata: typeof dataset.metadata === 'string' 
        ? JSON.parse(dataset.metadata) 
        : dataset.metadata
    }))

    res.json({ datasets: datasetsWithMetadata })

  } catch (error) {
    console.error('Error fetching datasets:', error)
    res.status(500).json({ error: 'Failed to fetch datasets' })
  }
})

/**
 * GET /api/datasets/:id
 * Get dataset details
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const user_id = req.session?.user_data?.user?.login || req.headers['x-user-id']

    const dataset = await knex('datasets')
      .select([
        'id', 'name', 'description', 'format_type', 'metadata',
        'file_size', 'original_filename', 'is_public', 'user_id', 'created_at'
      ])
      .where('id', id)
      .first()

    if (!dataset) {
      return res.status(404).json({ error: 'Dataset not found' })
    }

    // Check access permissions
    if (!dataset.is_public && dataset.user_id !== user_id) {
      return res.status(403).json({ error: 'Access denied' })
    }

    // Log access
    if (user_id) {
      await knex('dataset_access_logs').insert({
        dataset_id: id,
        accessed_by_user_id: user_id,
        access_type: 'view',
        user_agent: req.headers['user-agent'],
        ip_address: req.ip
      })
    }

    // Parse metadata
    dataset.metadata = typeof dataset.metadata === 'string' 
      ? JSON.parse(dataset.metadata) 
      : dataset.metadata

    res.json({ dataset })

  } catch (error) {
    console.error('Error fetching dataset:', error)
    res.status(500).json({ error: 'Failed to fetch dataset' })
  }
})

/**
 * GET /api/datasets/:id/download
 * Download dataset file
 */
router.get('/:id/download', async (req, res) => {
  try {
    const { id } = req.params
    const user_id = req.session?.user_data?.user?.login || req.headers['x-user-id']

    const dataset = await knex('datasets')
      .select(['file_path', 'original_filename', 'is_public', 'user_id'])
      .where('id', id)
      .first()

    if (!dataset) {
      return res.status(404).json({ error: 'Dataset not found' })
    }

    // Check access permissions
    if (!dataset.is_public && dataset.user_id !== user_id) {
      return res.status(403).json({ error: 'Access denied' })
    }

    // Log download
    if (user_id) {
      await knex('dataset_access_logs').insert({
        dataset_id: id,
        accessed_by_user_id: user_id,
        access_type: 'download',
        user_agent: req.headers['user-agent'],
        ip_address: req.ip
      })
    }

    // Send file
    res.download(dataset.file_path, dataset.original_filename)

  } catch (error) {
    console.error('Error downloading dataset:', error)
    res.status(500).json({ error: 'Failed to download dataset' })
  }
})

/**
 * DELETE /api/datasets/:id
 * Delete a dataset (owner only)
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const user_id = req.session?.user_data?.user?.login || req.headers['x-user-id']

    if (!user_id) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    const dataset = await knex('datasets')
      .select(['file_path', 'user_id'])
      .where('id', id)
      .first()

    if (!dataset) {
      return res.status(404).json({ error: 'Dataset not found' })
    }

    if (dataset.user_id !== user_id) {
      return res.status(403).json({ error: 'Access denied' })
    }

    // Delete file from filesystem
    try {
      await fs.unlink(dataset.file_path)
    } catch (fileError) {
      console.warn('Failed to delete file:', fileError)
    }

    // Delete from database (cascades to related tables)
    await knex('datasets').where('id', id).del()

    res.json({ success: true, message: 'Dataset deleted successfully' })

  } catch (error) {
    console.error('Error deleting dataset:', error)
    res.status(500).json({ error: 'Failed to delete dataset' })
  }
})

module.exports = router

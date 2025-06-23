const fs = require('fs').promises
const path = require('path')
const { knex } = require('../config/database')
const DatasetMetadataExtractor = require('./datasetMetadataExtractor')

class DatasetService {
  /**
   * Extract metadata from uploaded dataset file
   * @param {string} filePath - Path to the uploaded file
   * @param {string} formatType - Type of dataset format
   * @param {string} problemType - Problem type hint ('auto' for auto-detection)
   * @returns {Promise<Object>} Extracted metadata
   */
  static async extractMetadata(filePath, formatType, problemType = 'auto') {
    try {
      // Use enhanced metadata extractor for comprehensive analysis
      const comprehensiveMetadata = await DatasetMetadataExtractor.extractComprehensiveMetadata(filePath, formatType, problemType)

      // Fallback to basic extraction if enhanced fails
      if (comprehensiveMetadata.error) {
        console.warn('Enhanced metadata extraction failed, falling back to basic extraction')
        const content = await fs.readFile(filePath, 'utf8')
        return this._extractBasicMetadata(content, formatType, problemType)
      }

      return comprehensiveMetadata
    } catch (error) {
      console.error('Error extracting metadata:', error)
      return { error: 'Failed to extract metadata', format_type: formatType }
    }
  }

  /**
   * Basic metadata extraction (fallback method)
   */
  static async _extractBasicMetadata(content, formatType, problemType = 'auto') {
    switch (formatType.toLowerCase()) {
      case 'tsplib':
        return this._analyzeTSPLib(content, problemType)
      case 'vrp':
        return this._analyzeVRP(content, problemType)
      case 'json':
        return this._analyzeJSON(content, problemType)
      case 'csv':
        return this._analyzeCSV(content, problemType)
      default:
        return this._analyzeGeneric(content, formatType, problemType)
    }
  }

  /**
   * Analyze TSPLIB format files
   */
  static _analyzeTSPLib(content, problemType = 'auto') {
    const lines = content.split('\n').map(line => line.trim())
    const metadata = {
      problem_type: problemType !== 'auto' ? problemType : 'tsp',
      format: 'tsplib'
    }

    for (const line of lines) {
      if (line.startsWith('NAME:')) {
        metadata.name = line.split(':')[1].trim()
      } else if (line.startsWith('TYPE:')) {
        metadata.type = line.split(':')[1].trim()
      } else if (line.startsWith('DIMENSION:')) {
        metadata.dimension = parseInt(line.split(':')[1].trim())
        metadata.num_cities = metadata.dimension
      } else if (line.startsWith('EDGE_WEIGHT_TYPE:')) {
        metadata.distance_type = line.split(':')[1].trim()
      } else if (line.startsWith('NODE_COORD_SECTION')) {
        metadata.has_coordinates = true
      } else if (line.startsWith('EDGE_WEIGHT_SECTION')) {
        metadata.has_distance_matrix = true
      }
    }

    // Estimate difficulty based on problem size
    if (metadata.dimension) {
      if (metadata.dimension <= 20) {
        metadata.estimated_difficulty = 'easy'
      } else if (metadata.dimension <= 100) {
        metadata.estimated_difficulty = 'medium'
      } else {
        metadata.estimated_difficulty = 'hard'
      }
    }

    return metadata
  }

  /**
   * Analyze VRP format files
   */
  static _analyzeVRP(content, problemType = 'auto') {
    const lines = content.split('\n').map(line => line.trim()).filter(line => line)
    const metadata = {
      problem_type: problemType !== 'auto' ? problemType : 'vrp',
      format: 'vrp'
    }

    // Try to extract basic VRP information
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      
      if (line.includes('DIMENSION') || line.includes('dimension')) {
        const match = line.match(/(\d+)/)
        if (match) {
          metadata.num_customers = parseInt(match[1])
        }
      } else if (line.includes('VEHICLES') || line.includes('vehicles')) {
        const match = line.match(/(\d+)/)
        if (match) {
          metadata.num_vehicles = parseInt(match[1])
        }
      } else if (line.includes('CAPACITY') || line.includes('capacity')) {
        const match = line.match(/(\d+)/)
        if (match) {
          metadata.vehicle_capacity = parseInt(match[1])
        }
      }
    }

    // Estimate difficulty
    if (metadata.num_customers) {
      if (metadata.num_customers <= 25) {
        metadata.estimated_difficulty = 'easy'
      } else if (metadata.num_customers <= 100) {
        metadata.estimated_difficulty = 'medium'
      } else {
        metadata.estimated_difficulty = 'hard'
      }
    }

    return metadata
  }

  /**
   * Analyze JSON format files
   */
  static _analyzeJSON(content, problemType = 'auto') {
    try {
      const data = JSON.parse(content)
      const metadata = {
        problem_type: problemType !== 'auto' ? problemType : 'unknown',
        format: 'json'
      }

      // Try to infer problem type from JSON structure (only if auto-detection)
      if (problemType === 'auto') {
        if (data.cities || data.nodes || data.coordinates) {
          metadata.problem_type = 'tsp'
          metadata.num_cities = (data.cities || data.nodes || data.coordinates).length
        } else if (data.customers || data.demands) {
          metadata.problem_type = 'vrp'
          metadata.num_customers = (data.customers || data.demands).length
        } else if (data.graph || data.edges || data.adjacency_matrix) {
          metadata.problem_type = 'graph'
          if (data.adjacency_matrix) {
            metadata.num_vertices = data.adjacency_matrix.length
          }
        }
      } else {
        // Use provided problem type and extract relevant data
        if (data.cities || data.nodes || data.coordinates) {
          metadata.num_cities = (data.cities || data.nodes || data.coordinates).length
        }
        if (data.customers || data.demands) {
          metadata.num_customers = (data.customers || data.demands).length
        }
        if (data.adjacency_matrix) {
          metadata.num_vertices = data.adjacency_matrix.length
        }
      }

      metadata.keys = Object.keys(data)
      return metadata
    } catch (error) {
      return {
        problem_type: 'unknown',
        format: 'json',
        error: 'Invalid JSON format'
      }
    }
  }

  /**
   * Analyze CSV format files
   */
  static _analyzeCSV(content, problemType = 'auto') {
    const lines = content.split('\n').filter(line => line.trim())
    const metadata = {
      problem_type: problemType !== 'auto' ? problemType : 'unknown',
      format: 'csv',
      num_rows: lines.length - 1, // Assuming header row
      num_columns: 0
    }

    if (lines.length > 0) {
      const header = lines[0].split(',').map(col => col.trim())
      metadata.num_columns = header.length
      metadata.columns = header

      // Try to infer problem type from column names (only if auto-detection)
      if (problemType === 'auto') {
        const headerLower = header.map(col => col.toLowerCase())
        if (headerLower.includes('x') && headerLower.includes('y')) {
          metadata.problem_type = 'coordinates'
        } else if (headerLower.includes('demand') || headerLower.includes('capacity')) {
          metadata.problem_type = 'vrp'
        }
      }
    }

    return metadata
  }

  /**
   * Generic analysis for unknown formats
   */
  static _analyzeGeneric(content, formatType, problemType = 'auto') {
    const lines = content.split('\n')
    return {
      problem_type: problemType !== 'auto' ? problemType : 'unknown',
      format: formatType,
      num_lines: lines.length,
      file_size_chars: content.length,
      has_numbers: /\d/.test(content),
      has_coordinates: /\d+\.\d+\s+\d+\.\d+/.test(content)
    }
  }

  /**
   * Compute compatibility between dataset and existing problems
   * @param {string} datasetId - ID of the dataset
   */
  static async computeCompatibility(datasetId) {
    try {
      const dataset = await knex('datasets')
        .select(['metadata', 'format_type'])
        .where('id', datasetId)
        .first()

      if (!dataset) {
        console.error('Dataset not found for compatibility computation:', datasetId)
        return
      }

      const metadata = typeof dataset.metadata === 'string' 
        ? JSON.parse(dataset.metadata) 
        : dataset.metadata

      // Get list of known problem repositories (this would be expanded with actual repo discovery)
      const knownProblems = this._getKnownProblemRepositories()

      const compatibilities = []

      for (const problem of knownProblems) {
        const score = this._calculateCompatibilityScore(metadata, problem)
        
        if (score > 0.1) { // Only store meaningful compatibility scores
          compatibilities.push({
            dataset_id: datasetId,
            problem_type: problem.type,
            repository_name: problem.name,
            repository_owner: problem.owner,
            compatibility_score: score,
            compatibility_details: JSON.stringify({
              format_match: this._checkFormatMatch(dataset.format_type, problem.supported_formats),
              size_match: this._checkSizeMatch(metadata, problem.size_constraints),
              feature_match: this._checkFeatureMatch(metadata, problem.required_features)
            })
          })
        }
      }

      // Insert compatibility records
      if (compatibilities.length > 0) {
        await knex('dataset_compatibility').insert(compatibilities)
        console.log(`Computed ${compatibilities.length} compatibility records for dataset ${datasetId}`)
      }

    } catch (error) {
      console.error('Error computing compatibility:', error)
    }
  }

  /**
   * Get list of known problem repositories
   * TODO: This should be dynamically discovered from the platform
   */
  static _getKnownProblemRepositories() {
    return [
      {
        name: 'modernized_tsp_problem',
        owner: 'examples',
        type: 'tsp',
        supported_formats: ['tsplib', 'json', 'csv'],
        size_constraints: { min: 3, max: 1000 },
        required_features: ['coordinates', 'dimension']
      },
      {
        name: 'modernized_vrp_problem',
        owner: 'examples',
        type: 'vrp',
        supported_formats: ['vrp', 'json', 'csv'],
        size_constraints: { min: 5, max: 500 },
        required_features: ['customers', 'demands', 'capacity']
      },
      {
        name: 'tsp-problem',
        owner: 'examples',
        type: 'tsp',
        supported_formats: ['tsplib', 'json', 'csv'],
        size_constraints: { min: 3, max: 1000 },
        required_features: ['coordinates', 'distance_matrix']
      },
      {
        name: 'vrp-problem',
        owner: 'examples',
        type: 'vrp',
        supported_formats: ['vrp', 'json', 'csv'],
        size_constraints: { min: 5, max: 500 },
        required_features: ['customers', 'demands']
      },
      {
        name: 'maxcut-problem',
        owner: 'examples',
        type: 'maxcut',
        supported_formats: ['json', 'csv'],
        size_constraints: { min: 3, max: 200 },
        required_features: ['graph', 'adjacency_matrix']
      }
    ]
  }

  /**
   * Calculate compatibility score between dataset and problem
   */
  static _calculateCompatibilityScore(metadata, problem) {
    let score = 0

    // Format compatibility (40% weight)
    if (this._checkFormatMatch(metadata.format, problem.supported_formats)) {
      score += 0.4
    }

    // Problem type match (30% weight)
    if (metadata.problem_type === problem.type) {
      score += 0.3
    }

    // Size constraints (20% weight)
    if (this._checkSizeMatch(metadata, problem.size_constraints)) {
      score += 0.2
    }

    // Feature requirements (10% weight)
    if (this._checkFeatureMatch(metadata, problem.required_features)) {
      score += 0.1
    }

    return Math.min(score, 1.0) // Cap at 1.0
  }

  static _checkFormatMatch(datasetFormat, supportedFormats) {
    return supportedFormats.includes(datasetFormat)
  }

  static _checkSizeMatch(metadata, sizeConstraints) {
    const size = metadata.dimension || metadata.num_cities || metadata.num_customers || metadata.num_vertices
    if (!size || !sizeConstraints) return true
    
    return size >= sizeConstraints.min && size <= sizeConstraints.max
  }

  static _checkFeatureMatch(metadata, requiredFeatures) {
    if (!requiredFeatures || requiredFeatures.length === 0) return true
    
    // Check if dataset has required features
    for (const feature of requiredFeatures) {
      if (feature === 'coordinates' && !metadata.has_coordinates) return false
      if (feature === 'distance_matrix' && !metadata.has_distance_matrix) return false
      if (feature === 'customers' && !metadata.num_customers) return false
      if (feature === 'demands' && !metadata.demands) return false
      if (feature === 'graph' && metadata.problem_type !== 'graph') return false
    }
    
    return true
  }
}

module.exports = DatasetService

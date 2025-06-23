const fs = require('fs').promises

/**
 * Enhanced Dataset Metadata Extractor
 * 
 * Provides comprehensive metadata extraction for various optimization problem formats
 * to support the recommendation engine and AutoSolve functionality.
 */
class DatasetMetadataExtractor {
  
  /**
   * Extract comprehensive metadata from dataset file
   * @param {string} filePath - Path to the dataset file
   * @param {string} formatType - Expected format type
   * @param {string} problemType - Problem type hint ('auto' for auto-detection)
   * @returns {Promise<Object>} Comprehensive metadata object
   */
  static async extractComprehensiveMetadata(filePath, formatType, problemType = 'auto') {
    try {
      const content = await fs.readFile(filePath, 'utf8')
      const basicMetadata = await this.extractBasicMetadata(content, formatType, problemType)
      const advancedMetadata = await this.extractAdvancedMetadata(content, formatType, basicMetadata)
      
      return {
        ...basicMetadata,
        ...advancedMetadata,
        extraction_timestamp: new Date().toISOString(),
        file_size_bytes: (await fs.stat(filePath)).size
      }
    } catch (error) {
      console.error('Error extracting comprehensive metadata:', error)
      return {
        error: 'Failed to extract metadata',
        format_type: formatType,
        extraction_timestamp: new Date().toISOString()
      }
    }
  }

  /**
   * Extract basic metadata (format detection, size, etc.)
   */
  static async extractBasicMetadata(content, formatType, problemType = 'auto') {
    const detectedFormat = this.detectFormat(content)
    const actualFormat = detectedFormat || formatType

    switch (actualFormat.toLowerCase()) {
      case 'tsplib':
        return this._analyzeTSPLibBasic(content, problemType)
      case 'vrp':
        return this._analyzeVRPBasic(content, problemType)
      case 'json':
        return this._analyzeJSONBasic(content, problemType)
      case 'csv':
        return this._analyzeCSVBasic(content, problemType)
      default:
        return this._analyzeGenericBasic(content, actualFormat, problemType)
    }
  }

  /**
   * Extract advanced metadata (complexity, characteristics, recommendations)
   */
  static async extractAdvancedMetadata(content, formatType, basicMetadata) {
    const advanced = {
      complexity_analysis: this.analyzeComplexity(basicMetadata),
      problem_characteristics: this.extractProblemCharacteristics(content, basicMetadata),
      optimization_hints: this.generateOptimizationHints(basicMetadata),
      compatibility_tags: this.generateCompatibilityTags(basicMetadata),
      quality_score: this.calculateQualityScore(content, basicMetadata)
    }

    // Add format-specific advanced analysis
    if (basicMetadata.problem_type === 'tsp') {
      advanced.tsp_specific = this.analyzeTSPAdvanced(content, basicMetadata)
    } else if (basicMetadata.problem_type === 'vrp') {
      advanced.vrp_specific = this.analyzeVRPAdvanced(content, basicMetadata)
    }

    return advanced
  }

  /**
   * Detect format from content analysis
   */
  static detectFormat(content) {
    // TSPLIB format detection
    if (content.includes('DIMENSION:') && (content.includes('NODE_COORD_SECTION') || content.includes('EDGE_WEIGHT_SECTION'))) {
      return 'tsplib'
    }
    
    // VRP format detection
    if (content.includes('DIMENSION') && (content.includes('CAPACITY') || content.includes('VEHICLES'))) {
      return 'vrp'
    }
    
    // JSON format detection
    try {
      JSON.parse(content)
      return 'json'
    } catch {}
    
    // CSV format detection
    const lines = content.trim().split('\n')
    if (lines.length > 1 && lines[0].includes(',')) {
      return 'csv'
    }
    
    return null
  }

  /**
   * Analyze TSP format with enhanced metadata
   */
  static _analyzeTSPLibBasic(content, problemType = 'auto') {
    const lines = content.split('\n').map(line => line.trim())
    const metadata = {
      problem_type: problemType !== 'auto' ? problemType : 'tsp',
      format: 'tsplib',
      sections: []
    }

    for (const line of lines) {
      if (line.startsWith('NAME:')) {
        metadata.name = line.split(':')[1].trim()
      } else if (line.startsWith('TYPE:')) {
        metadata.type = line.split(':')[1].trim()
      } else if (line.startsWith('COMMENT:')) {
        metadata.comment = line.split(':')[1].trim()
      } else if (line.startsWith('DIMENSION:')) {
        metadata.dimension = parseInt(line.split(':')[1].trim())
        metadata.num_cities = metadata.dimension
      } else if (line.startsWith('EDGE_WEIGHT_TYPE:')) {
        metadata.distance_type = line.split(':')[1].trim()
      } else if (line === 'NODE_COORD_SECTION') {
        metadata.has_coordinates = true
        metadata.sections.push('NODE_COORD_SECTION')
      } else if (line === 'EDGE_WEIGHT_SECTION') {
        metadata.has_distance_matrix = true
        metadata.sections.push('EDGE_WEIGHT_SECTION')
      } else if (line === 'DISPLAY_DATA_SECTION') {
        metadata.has_display_data = true
        metadata.sections.push('DISPLAY_DATA_SECTION')
      }
    }

    // Estimate difficulty and characteristics
    if (metadata.dimension) {
      metadata.size_category = this.categorizeProblemSize(metadata.dimension, 'tsp')
      metadata.estimated_difficulty = this.estimateDifficulty(metadata.dimension, 'tsp')
    }

    return metadata
  }

  /**
   * Analyze VRP format with enhanced metadata
   */
  static _analyzeVRPBasic(content, problemType = 'auto') {
    const lines = content.split('\n').map(line => line.trim()).filter(line => line)
    const metadata = {
      problem_type: problemType !== 'auto' ? problemType : 'vrp',
      format: 'vrp',
      sections: []
    }

    for (const line of lines) {
      if (line.startsWith('NAME')) {
        metadata.name = line.includes(':') ? line.split(':')[1].trim() : line.split(/\s+/).slice(1).join(' ')
      } else if (line.startsWith('TYPE')) {
        metadata.type = line.includes(':') ? line.split(':')[1].trim() : line.split(/\s+/)[1]
      } else if (line.startsWith('DIMENSION')) {
        const value = line.includes(':') ? line.split(':')[1].trim() : line.split(/\s+/)[1]
        metadata.dimension = parseInt(value)
        metadata.num_customers = metadata.dimension - 1 // Exclude depot
      } else if (line.startsWith('CAPACITY')) {
        const value = line.includes(':') ? line.split(':')[1].trim() : line.split(/\s+/)[1]
        metadata.vehicle_capacity = parseInt(value)
      } else if (line.startsWith('VEHICLES')) {
        const value = line.includes(':') ? line.split(':')[1].trim() : line.split(/\s+/)[1]
        metadata.num_vehicles = parseInt(value)
      } else if (line === 'NODE_COORD_SECTION') {
        metadata.has_coordinates = true
        metadata.sections.push('NODE_COORD_SECTION')
      } else if (line === 'DEMAND_SECTION') {
        metadata.has_demands = true
        metadata.sections.push('DEMAND_SECTION')
      } else if (line === 'DEPOT_SECTION') {
        metadata.has_depot = true
        metadata.sections.push('DEPOT_SECTION')
      }
    }

    if (metadata.num_customers) {
      metadata.size_category = this.categorizeProblemSize(metadata.num_customers, 'vrp')
      metadata.estimated_difficulty = this.estimateDifficulty(metadata.num_customers, 'vrp')
    }

    return metadata
  }

  /**
   * Analyze JSON format with enhanced metadata
   */
  static _analyzeJSONBasic(content, problemType = 'auto') {
    try {
      const data = JSON.parse(content)
      const metadata = {
        problem_type: problemType !== 'auto' ? problemType : 'unknown',
        format: 'json',
        json_structure: Object.keys(data)
      }

      // Infer problem type from structure (only if auto-detection)
      if (problemType === 'auto') {
        if (data.cities || data.nodes || data.coordinates) {
          metadata.problem_type = 'tsp'
          const locations = data.cities || data.nodes || data.coordinates
          metadata.num_cities = locations.length
          metadata.dimension = metadata.num_cities
        } else if (data.customers || data.demands || data.depot) {
          metadata.problem_type = 'vrp'
          if (data.customers) {
            metadata.num_customers = data.customers.length
          }
          if (data.capacity) {
            metadata.vehicle_capacity = data.capacity
          }
          if (data.vehicles) {
            metadata.num_vehicles = data.vehicles
          }
        } else if (data.graph || data.edges || data.adjacency_matrix) {
          metadata.problem_type = 'graph'
          if (data.adjacency_matrix) {
            metadata.num_vertices = data.adjacency_matrix.length
          }
        }
      } else {
        // Use provided problem type and extract relevant data
        if (data.cities || data.nodes || data.coordinates) {
          const locations = data.cities || data.nodes || data.coordinates
          metadata.num_cities = locations.length
          metadata.dimension = metadata.num_cities
        }
        if (data.customers) {
          metadata.num_customers = data.customers.length
        }
        if (data.capacity) {
          metadata.vehicle_capacity = data.capacity
        }
        if (data.vehicles) {
          metadata.num_vehicles = data.vehicles
        }
        if (data.adjacency_matrix) {
          metadata.num_vertices = data.adjacency_matrix.length
        }
      }

      // Extract additional metadata
      if (data.name) metadata.name = data.name
      if (data.description) metadata.description = data.description
      if (data.type) metadata.type = data.type

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
   * Analyze CSV format with enhanced metadata
   */
  static _analyzeCSVBasic(content, problemType = 'auto') {
    const lines = content.split('\n').filter(line => line.trim())
    const metadata = {
      problem_type: problemType !== 'auto' ? problemType : 'unknown',
      format: 'csv',
      num_rows: lines.length - 1,
      num_columns: 0
    }

    if (lines.length > 0) {
      const header = lines[0].split(',').map(col => col.trim().toLowerCase())
      metadata.num_columns = header.length
      metadata.columns = header

      // Infer problem type from columns (only if auto-detection)
      if (problemType === 'auto') {
        if (header.includes('x') && header.includes('y')) {
          if (header.includes('demand') || header.includes('capacity')) {
            metadata.problem_type = 'vrp'
            metadata.num_customers = metadata.num_rows
          } else {
            metadata.problem_type = 'tsp'
            metadata.num_cities = metadata.num_rows
            metadata.dimension = metadata.num_cities
          }
        }
      } else {
        // Extract relevant data based on provided problem type
        if (header.includes('x') && header.includes('y')) {
          if (problemType === 'tsp') {
            metadata.num_cities = metadata.num_rows
            metadata.dimension = metadata.num_cities
          } else if (problemType === 'vrp') {
            metadata.num_customers = metadata.num_rows
          }
        }
      }
    }

    return metadata
  }

  /**
   * Generic analysis for unknown formats
   */
  static _analyzeGenericBasic(content, formatType, problemType = 'auto') {
    const lines = content.split('\n')
    return {
      problem_type: problemType !== 'auto' ? problemType : 'unknown',
      format: formatType,
      num_lines: lines.length,
      file_size_chars: content.length,
      has_numbers: /\d/.test(content),
      has_coordinates: /\d+\.\d+\s+\d+\.\d+/.test(content),
      line_sample: lines.slice(0, 5)
    }
  }

  /**
   * Categorize problem size
   */
  static categorizeProblemSize(size, problemType) {
    const thresholds = {
      tsp: { small: 50, medium: 200, large: 1000 },
      vrp: { small: 30, medium: 100, large: 500 },
      default: { small: 50, medium: 200, large: 1000 }
    }

    const limits = thresholds[problemType] || thresholds.default

    if (size <= limits.small) return 'small'
    if (size <= limits.medium) return 'medium'
    if (size <= limits.large) return 'large'
    return 'extra_large'
  }

  /**
   * Estimate problem difficulty
   */
  static estimateDifficulty(size, problemType) {
    const category = this.categorizeProblemSize(size, problemType)
    
    const difficultyMap = {
      small: 'easy',
      medium: 'intermediate',
      large: 'hard',
      extra_large: 'very_hard'
    }

    return difficultyMap[category] || 'unknown'
  }

  /**
   * Analyze computational complexity
   */
  static analyzeComplexity(metadata) {
    const size = metadata.dimension || metadata.num_customers || metadata.num_cities || 0
    
    let timeComplexity = 'O(n)'
    let spaceComplexity = 'O(n)'
    let scalability = 'good'

    if (metadata.problem_type === 'tsp') {
      timeComplexity = 'O(n!)'  // Exact solution
      spaceComplexity = 'O(n²)' // Distance matrix
      scalability = size > 100 ? 'poor' : size > 50 ? 'moderate' : 'good'
    } else if (metadata.problem_type === 'vrp') {
      timeComplexity = 'O(n^k)'  // Where k is number of vehicles
      spaceComplexity = 'O(n²)'
      scalability = size > 200 ? 'poor' : size > 100 ? 'moderate' : 'good'
    }

    return {
      time_complexity: timeComplexity,
      space_complexity: spaceComplexity,
      scalability,
      problem_size: size,
      size_category: metadata.size_category
    }
  }

  /**
   * Extract problem characteristics for recommendation matching
   */
  static extractProblemCharacteristics(content, metadata) {
    const characteristics = {
      is_symmetric: true,  // Default assumption
      has_constraints: false,
      constraint_types: [],
      optimization_type: 'minimization'
    }

    // TSP-specific characteristics
    if (metadata.problem_type === 'tsp') {
      characteristics.has_coordinates = metadata.has_coordinates || false
      characteristics.distance_type = metadata.distance_type || 'EUC_2D'
      characteristics.is_symmetric = !metadata.type || metadata.type !== 'ATSP'
    }

    // VRP-specific characteristics
    if (metadata.problem_type === 'vrp') {
      characteristics.has_constraints = true
      characteristics.constraint_types.push('capacity')
      
      if (metadata.vehicle_capacity) {
        characteristics.capacity_constraint = metadata.vehicle_capacity
      }
      
      if (content.includes('TIME_WINDOW') || content.includes('time_window')) {
        characteristics.constraint_types.push('time_windows')
      }
    }

    return characteristics
  }

  /**
   * Generate optimization hints for algorithm selection
   */
  static generateOptimizationHints(metadata) {
    const hints = {
      recommended_algorithms: [],
      algorithm_categories: [],
      computational_notes: []
    }

    const size = metadata.dimension || metadata.num_customers || 0

    if (metadata.problem_type === 'tsp') {
      if (size <= 20) {
        hints.recommended_algorithms.push('exact_solver', 'branch_and_bound')
        hints.algorithm_categories.push('exact')
      } else if (size <= 100) {
        hints.recommended_algorithms.push('genetic_algorithm', 'simulated_annealing', 'local_search')
        hints.algorithm_categories.push('metaheuristic')
      } else {
        hints.recommended_algorithms.push('large_neighborhood_search', 'ant_colony', 'tabu_search')
        hints.algorithm_categories.push('metaheuristic', 'construction_heuristic')
      }
    } else if (metadata.problem_type === 'vrp') {
      if (size <= 50) {
        hints.recommended_algorithms.push('clarke_wright', 'genetic_algorithm')
        hints.algorithm_categories.push('construction_heuristic', 'metaheuristic')
      } else {
        hints.recommended_algorithms.push('large_neighborhood_search', 'adaptive_large_neighborhood')
        hints.algorithm_categories.push('metaheuristic')
      }
    }

    return hints
  }

  /**
   * Generate compatibility tags for matching
   */
  static generateCompatibilityTags(metadata) {
    const tags = []

    // Problem type tags
    tags.push(metadata.problem_type)
    
    // Size tags
    tags.push(`size_${metadata.size_category}`)
    
    // Format tags
    tags.push(`format_${metadata.format}`)
    
    // Difficulty tags
    tags.push(`difficulty_${metadata.estimated_difficulty}`)

    // Feature tags
    if (metadata.has_coordinates) tags.push('coordinates')
    if (metadata.has_distance_matrix) tags.push('distance_matrix')
    if (metadata.has_demands) tags.push('demands')
    if (metadata.vehicle_capacity) tags.push('capacity_constraints')

    return tags
  }

  /**
   * Calculate dataset quality score
   */
  static calculateQualityScore(content, metadata) {
    let score = 0.5 // Base score

    // Format completeness
    if (metadata.format && metadata.format !== 'unknown') score += 0.1
    if (metadata.name) score += 0.05
    if (metadata.dimension || metadata.num_customers) score += 0.1

    // Data completeness
    if (metadata.has_coordinates) score += 0.1
    if (metadata.has_demands) score += 0.1
    if (metadata.sections && metadata.sections.length > 1) score += 0.1

    // Size appropriateness
    const size = metadata.dimension || metadata.num_customers || 0
    if (size >= 5 && size <= 1000) score += 0.1

    // Content quality
    const lines = content.split('\n').filter(line => line.trim())
    const dataLines = lines.filter(line => /^\d+/.test(line.trim()))
    if (dataLines.length > 0) score += 0.1

    return Math.min(score, 1.0)
  }

  /**
   * Advanced TSP analysis
   */
  static analyzeTSPAdvanced(content, basicMetadata) {
    return {
      tour_estimation: this.estimateOptimalTourLength(basicMetadata),
      geometric_properties: this.analyzeGeometricProperties(content),
      instance_difficulty: this.assessInstanceDifficulty(basicMetadata)
    }
  }

  /**
   * Advanced VRP analysis
   */
  static analyzeVRPAdvanced(content, basicMetadata) {
    return {
      route_estimation: this.estimateOptimalRoutes(basicMetadata),
      capacity_utilization: this.analyzeCapacityRequirements(basicMetadata),
      fleet_requirements: this.estimateFleetSize(basicMetadata)
    }
  }

  // Helper methods for advanced analysis
  static estimateOptimalTourLength(metadata) {
    // Simplified estimation based on problem size
    const n = metadata.dimension || 0
    return n > 0 ? Math.sqrt(n) * 100 : null
  }

  static analyzeGeometricProperties(content) {
    // Analyze coordinate distribution, clustering, etc.
    return { analysis: 'geometric_analysis_placeholder' }
  }

  static assessInstanceDifficulty(metadata) {
    // Assess based on size, structure, constraints
    return { difficulty_factors: ['size', 'structure'] }
  }

  static estimateOptimalRoutes(metadata) {
    const customers = metadata.num_customers || 0
    const vehicles = metadata.num_vehicles || 1
    return customers > 0 ? Math.ceil(customers / vehicles) : null
  }

  static analyzeCapacityRequirements(metadata) {
    return { capacity_analysis: 'capacity_analysis_placeholder' }
  }

  static estimateFleetSize(metadata) {
    return { fleet_estimation: 'fleet_estimation_placeholder' }
  }
}

module.exports = DatasetMetadataExtractor

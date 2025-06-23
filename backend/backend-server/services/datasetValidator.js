/**
 * Dataset Validation Service
 * 
 * Validates uploaded datasets to ensure they match expected formats
 * and can be used by qubots problems for optimization.
 */
class DatasetValidator {

  /**
   * Validate dataset against problem requirements
   * @param {string} content - Dataset content
   * @param {Object} requirements - Problem requirements from config.json
   * @param {Object} metadata - Extracted metadata
   * @returns {Object} Validation result
   */
  static validateDataset(content, requirements, metadata) {
    const result = {
      valid: true,
      errors: [],
      warnings: [],
      compatibility_score: 1.0
    }

    try {
      // Format validation
      this._validateFormat(content, requirements, metadata, result)
      
      // Size validation
      this._validateSize(metadata, requirements, result)
      
      // Required fields validation
      this._validateRequiredFields(content, metadata, requirements, result)
      
      // Constraints validation
      this._validateConstraints(metadata, requirements, result)
      
      // Calculate final compatibility score
      result.compatibility_score = this._calculateCompatibilityScore(result, metadata, requirements)
      
      // Determine overall validity
      result.valid = result.errors.length === 0

    } catch (error) {
      result.valid = false
      result.errors.push(`Validation error: ${error.message}`)
      result.compatibility_score = 0.0
    }

    return result
  }

  /**
   * Validate format compatibility
   */
  static _validateFormat(content, requirements, metadata, result) {
    const supportedFormats = requirements.supported_formats || [requirements.format]
    const detectedFormat = metadata.format

    if (!supportedFormats.includes(detectedFormat)) {
      result.errors.push(`Format '${detectedFormat}' not supported. Supported formats: ${supportedFormats.join(', ')}`)
      result.compatibility_score -= 0.4
    }

    // Format-specific validation
    if (detectedFormat === 'tsplib') {
      this._validateTSPLibFormat(content, result)
    } else if (detectedFormat === 'vrp') {
      this._validateVRPFormat(content, result)
    } else if (detectedFormat === 'json') {
      this._validateJSONFormat(content, result)
    } else if (detectedFormat === 'csv') {
      this._validateCSVFormat(content, result)
    }
  }

  /**
   * Validate problem size constraints
   */
  static _validateSize(metadata, requirements, result) {
    const size = metadata.dimension || metadata.num_customers || metadata.num_cities || 0
    const minSize = requirements.min_size || 1
    const maxSize = requirements.max_size || Infinity

    if (size < minSize) {
      result.errors.push(`Problem size ${size} is below minimum required size ${minSize}`)
      result.compatibility_score -= 0.3
    }

    if (size > maxSize) {
      result.errors.push(`Problem size ${size} exceeds maximum allowed size ${maxSize}`)
      result.compatibility_score -= 0.3
    }

    // Size warnings
    if (size > maxSize * 0.8) {
      result.warnings.push(`Problem size ${size} is close to maximum limit ${maxSize}`)
    }
  }

  /**
   * Validate required fields
   */
  static _validateRequiredFields(content, metadata, requirements, result) {
    const requiredFields = requirements.required_fields || []

    for (const field of requiredFields) {
      if (!this._hasRequiredField(content, metadata, field)) {
        result.errors.push(`Required field '${field}' not found in dataset`)
        result.compatibility_score -= 0.2
      }
    }

    // Check optional fields for bonus points
    const optionalFields = requirements.optional_fields || []
    let optionalFieldsFound = 0

    for (const field of optionalFields) {
      if (this._hasRequiredField(content, metadata, field)) {
        optionalFieldsFound++
      }
    }

    if (optionalFields.length > 0) {
      const optionalBonus = (optionalFieldsFound / optionalFields.length) * 0.1
      result.compatibility_score += optionalBonus
    }
  }

  /**
   * Validate problem-specific constraints
   */
  static _validateConstraints(metadata, requirements, result) {
    const constraints = requirements.constraints || {}

    // TSP constraints
    if (metadata.problem_type === 'tsp') {
      if (constraints.edge_weight_type && metadata.distance_type) {
        if (!constraints.edge_weight_type.includes(metadata.distance_type)) {
          result.warnings.push(`Edge weight type '${metadata.distance_type}' may not be optimal`)
          result.compatibility_score -= 0.1
        }
      }

      if (constraints.problem_type && metadata.type) {
        if (!constraints.problem_type.includes(metadata.type)) {
          result.warnings.push(`Problem type '${metadata.type}' may not be supported`)
          result.compatibility_score -= 0.1
        }
      }
    }

    // VRP constraints
    if (metadata.problem_type === 'vrp') {
      if (constraints.vehicle_capacity && metadata.vehicle_capacity) {
        const capacity = metadata.vehicle_capacity
        const minCap = constraints.vehicle_capacity.min || 0
        const maxCap = constraints.vehicle_capacity.max || Infinity

        if (capacity < minCap || capacity > maxCap) {
          result.warnings.push(`Vehicle capacity ${capacity} outside recommended range [${minCap}, ${maxCap}]`)
          result.compatibility_score -= 0.1
        }
      }

      if (constraints.num_vehicles && metadata.num_vehicles) {
        const vehicles = metadata.num_vehicles
        const minVeh = constraints.num_vehicles.min || 1
        const maxVeh = constraints.num_vehicles.max || Infinity

        if (vehicles < minVeh || vehicles > maxVeh) {
          result.warnings.push(`Number of vehicles ${vehicles} outside recommended range [${minVeh}, ${maxVeh}]`)
          result.compatibility_score -= 0.1
        }
      }
    }
  }

  /**
   * Check if dataset has required field
   */
  static _hasRequiredField(content, metadata, field) {
    // Check in metadata first
    if (metadata[field] !== undefined) return true

    // Check in content for specific patterns
    switch (field.toLowerCase()) {
      case 'dimension':
        return content.includes('DIMENSION') || metadata.dimension !== undefined
      case 'node_coord_section':
        return content.includes('NODE_COORD_SECTION') || metadata.has_coordinates
      case 'edge_weight_section':
        return content.includes('EDGE_WEIGHT_SECTION') || metadata.has_distance_matrix
      case 'demand_section':
        return content.includes('DEMAND_SECTION') || metadata.has_demands
      case 'capacity':
        return content.includes('CAPACITY') || metadata.vehicle_capacity !== undefined
      case 'coordinates':
        return metadata.has_coordinates || /\d+\.\d+\s+\d+\.\d+/.test(content)
      case 'distance_matrix':
        return metadata.has_distance_matrix || content.includes('EDGE_WEIGHT_SECTION')
      case 'customers':
        return metadata.num_customers !== undefined || metadata.customers !== undefined
      case 'demands':
        return metadata.has_demands || content.includes('demand')
      case 'graph':
        return metadata.problem_type === 'graph' || content.includes('adjacency_matrix')
      case 'adjacency_matrix':
        return content.includes('adjacency_matrix') || content.includes('EDGE_WEIGHT_SECTION')
      default:
        return false
    }
  }

  /**
   * Validate TSPLIB format
   */
  static _validateTSPLibFormat(content, result) {
    if (!content.includes('DIMENSION:')) {
      result.errors.push('TSPLIB format must include DIMENSION field')
    }

    if (!content.includes('NODE_COORD_SECTION') && !content.includes('EDGE_WEIGHT_SECTION')) {
      result.errors.push('TSPLIB format must include either NODE_COORD_SECTION or EDGE_WEIGHT_SECTION')
    }

    if (!content.includes('EOF')) {
      result.warnings.push('TSPLIB format should end with EOF marker')
    }
  }

  /**
   * Validate VRP format
   */
  static _validateVRPFormat(content, result) {
    if (!content.includes('DIMENSION')) {
      result.errors.push('VRP format must include DIMENSION field')
    }

    if (!content.includes('CAPACITY')) {
      result.warnings.push('VRP format should include CAPACITY field')
    }

    if (!content.includes('NODE_COORD_SECTION') && !content.includes('EDGE_WEIGHT_SECTION')) {
      result.warnings.push('VRP format should include coordinate or distance information')
    }
  }

  /**
   * Validate JSON format
   */
  static _validateJSONFormat(content, result) {
    try {
      const data = JSON.parse(content)
      
      if (typeof data !== 'object') {
        result.errors.push('JSON must contain an object')
        return
      }

      // Check for common required structures
      const hasLocations = data.cities || data.nodes || data.coordinates || data.customers || data.locations
      if (!hasLocations) {
        result.warnings.push('JSON should contain location data (cities, nodes, coordinates, customers, or locations)')
      }

    } catch (error) {
      result.errors.push('Invalid JSON format')
    }
  }

  /**
   * Validate CSV format
   */
  static _validateCSVFormat(content, result) {
    const lines = content.trim().split('\n')
    
    if (lines.length < 2) {
      result.errors.push('CSV must have at least a header row and one data row')
      return
    }

    const header = lines[0].toLowerCase()
    if (!header.includes('x') || !header.includes('y')) {
      result.warnings.push('CSV should include x and y coordinate columns')
    }

    // Check data consistency
    const headerCols = lines[0].split(',').length
    for (let i = 1; i < Math.min(lines.length, 10); i++) {
      const dataCols = lines[i].split(',').length
      if (dataCols !== headerCols) {
        result.warnings.push('CSV has inconsistent number of columns')
        break
      }
    }
  }

  /**
   * Calculate overall compatibility score
   */
  static _calculateCompatibilityScore(result, metadata, requirements) {
    let score = result.compatibility_score

    // Ensure score is within bounds
    score = Math.max(0.0, Math.min(1.0, score))

    // Penalty for errors
    score -= result.errors.length * 0.2

    // Minor penalty for warnings
    score -= result.warnings.length * 0.05

    // Bonus for high-quality metadata
    if (metadata.quality_score) {
      score += metadata.quality_score * 0.1
    }

    return Math.max(0.0, Math.min(1.0, score))
  }

  /**
   * Quick validation for file upload
   */
  static quickValidate(content, formatType) {
    const result = {
      valid: true,
      format_detected: formatType,
      basic_checks: []
    }

    try {
      // Basic format detection
      if (formatType === 'tsplib') {
        result.valid = content.includes('DIMENSION')
        result.basic_checks.push('DIMENSION field check')
      } else if (formatType === 'vrp') {
        result.valid = content.includes('DIMENSION') || content.includes('CAPACITY')
        result.basic_checks.push('VRP format check')
      } else if (formatType === 'json') {
        JSON.parse(content)
        result.basic_checks.push('JSON syntax check')
      } else if (formatType === 'csv') {
        const lines = content.split('\n')
        result.valid = lines.length > 1 && lines[0].includes(',')
        result.basic_checks.push('CSV structure check')
      }

      // Size check
      const lines = content.split('\n').length
      if (lines > 10000) {
        result.valid = false
        result.basic_checks.push('File too large')
      }

    } catch (error) {
      result.valid = false
      result.basic_checks.push(`Validation error: ${error.message}`)
    }

    return result
  }
}

module.exports = DatasetValidator

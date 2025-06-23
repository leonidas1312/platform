/**
 * Solver Validation Service
 * 
 * Validates qubots solver repositories for compatibility with the framework
 * and leaderboard submission requirements.
 */

const GiteaService = require("./giteaService")

class SolverValidationService {
  /**
   * Validate a solver repository for leaderboard submission
   */
  static async validateSolver(solverRepository, token = null) {
    const validation = {
      valid: false,
      config: null,
      errors: [],
      warnings: [],
      compatibility_score: 0
    }

    try {
      // Parse repository path
      const [username, repoName] = solverRepository.split('/')
      
      if (!username || !repoName) {
        validation.errors.push('Invalid repository format. Expected: username/repository-name')
        return validation
      }

      // Check repository accessibility
      console.log(`Validating repository: ${username}/${repoName}`)
      const repoResponse = await GiteaService.getRepository(username, repoName, token)

      if (!repoResponse.ok) {
        console.error(`Repository access failed: ${repoResponse.status} ${repoResponse.statusText}`)
        validation.errors.push(`Repository not found or not accessible (${repoResponse.status})`)
        return validation
      }

      console.log(`Repository ${username}/${repoName} is accessible`)

      // Validate config.json
      const configValidation = await this.validateConfig(username, repoName, token)
      if (!configValidation.valid) {
        validation.errors.push(...configValidation.errors)
        validation.warnings.push(...configValidation.warnings)
        return validation
      }

      validation.config = configValidation.config

      // Validate entry point file
      const entryPointValidation = await this.validateEntryPoint(
        username,
        repoName,
        configValidation.config,
        token
      )
      
      if (!entryPointValidation.valid) {
        validation.errors.push(...entryPointValidation.errors)
        validation.warnings.push(...entryPointValidation.warnings)
      }

      // Validate qubots framework compatibility
      const frameworkValidation = this.validateFrameworkCompatibility(configValidation.config)
      validation.warnings.push(...frameworkValidation.warnings)

      // Calculate compatibility score
      validation.compatibility_score = this.calculateCompatibilityScore(
        configValidation,
        entryPointValidation,
        frameworkValidation
      )

      // Determine overall validity
      validation.valid = validation.errors.length === 0

      return validation

    } catch (error) {
      console.error('Solver validation error:', error)
      validation.errors.push(`Validation failed: ${error.message}`)
      return validation
    }
  }

  /**
   * Validate config.json file
   */
  static async validateConfig(username, repoName, token = null) {
    const validation = {
      valid: false,
      config: null,
      errors: [],
      warnings: []
    }

    try {
      // Get config.json content
      console.log(`Fetching config.json for ${username}/${repoName}`)
      const configResponse = await GiteaService.getFileContent(
        token,
        username,
        repoName,
        'config.json'
      )

      if (!configResponse.ok) {
        console.error(`Config.json fetch failed: ${configResponse.status} ${configResponse.statusText}`)
        validation.errors.push(`config.json file not found (${configResponse.status})`)
        return validation
      }

      console.log(`Config.json found for ${username}/${repoName}`)

      const configData = await configResponse.json()
      const configContent = Buffer.from(configData.content, 'base64').toString()
      
      let config
      try {
        config = JSON.parse(configContent)
      } catch (parseError) {
        validation.errors.push('config.json contains invalid JSON')
        return validation
      }

      validation.config = config

      // Validate required fields
      const requiredFields = ['type', 'entry_point', 'class_name']
      for (const field of requiredFields) {
        if (!config[field]) {
          validation.errors.push(`Missing required field: ${field}`)
        }
      }

      // Validate type
      if (config.type !== 'optimizer') {
        validation.errors.push('Repository type must be "optimizer" for leaderboard submission')
      }

      // Validate metadata
      if (!config.metadata) {
        validation.warnings.push('Missing metadata section')
      } else {
        const requiredMetadata = ['name', 'description']
        for (const field of requiredMetadata) {
          if (!config.metadata[field]) {
            validation.warnings.push(`Missing metadata field: ${field}`)
          }
        }

        // Check for optimizer-specific metadata
        if (!config.metadata.optimizer_type) {
          validation.warnings.push('Missing optimizer_type in metadata')
        }

        if (!config.metadata.problem_types || !Array.isArray(config.metadata.problem_types)) {
          validation.warnings.push('Missing or invalid problem_types array in metadata')
        }
      }

      // Validate parameters section
      if (config.parameters) {
        this.validateParametersSection(config.parameters, validation)
      }

      validation.valid = validation.errors.length === 0

      return validation

    } catch (error) {
      validation.errors.push(`Config validation failed: ${error.message}`)
      return validation
    }
  }

  /**
   * Validate parameters section in config
   */
  static validateParametersSection(parameters, validation) {
    if (typeof parameters !== 'object') {
      validation.warnings.push('Parameters section should be an object')
      return
    }

    for (const [paramName, paramConfig] of Object.entries(parameters)) {
      if (!paramConfig.type) {
        validation.warnings.push(`Parameter ${paramName} missing type specification`)
      }

      if (!paramConfig.description) {
        validation.warnings.push(`Parameter ${paramName} missing description`)
      }

      // Validate type-specific constraints
      if (paramConfig.type === 'number' || paramConfig.type === 'integer') {
        if (paramConfig.min !== undefined && paramConfig.max !== undefined) {
          if (paramConfig.min >= paramConfig.max) {
            validation.warnings.push(`Parameter ${paramName} has invalid min/max range`)
          }
        }
      }
    }
  }

  /**
   * Validate entry point file
   */
  static async validateEntryPoint(username, repoName, config, token = null) {
    const validation = {
      valid: false,
      errors: [],
      warnings: []
    }

    try {
      let entryPoint = config.entry_point || 'qubot.py'

      // If entry point doesn't have .py extension, try adding it
      if (!entryPoint.endsWith('.py')) {
        entryPoint = entryPoint + '.py'
      }

      // Check if entry point file exists
      let fileResponse = await GiteaService.getFileContent(
        token,
        username,
        repoName,
        entryPoint
      )

      // If .py file not found and original entry point didn't have .py, try without extension
      if (!fileResponse.ok && config.entry_point && !config.entry_point.endsWith('.py')) {
        console.log(`Trying original entry point: ${config.entry_point}`)
        fileResponse = await GiteaService.getFileContent(
          token,
          username,
          repoName,
          config.entry_point
        )
        if (fileResponse.ok) {
          entryPoint = config.entry_point
        }
      }

      if (!fileResponse.ok) {
        validation.errors.push(`Entry point file ${config.entry_point} not found (tried ${entryPoint})`)
        return validation
      }

      console.log(`Entry point file found: ${entryPoint}`)

      const fileData = await fileResponse.json()
      const fileContent = Buffer.from(fileData.content, 'base64').toString()

      // Basic Python syntax validation
      if (!entryPoint.endsWith('.py') && !entryPoint.includes('.')) {
        validation.warnings.push('Entry point should typically be a Python file (.py), but will proceed with validation')
      }

      // Check for class definition
      const className = config.class_name
      const classRegex = new RegExp(`class\\s+${className}\\s*\\(`, 'm')
      
      if (!classRegex.test(fileContent)) {
        validation.errors.push(`Class ${className} not found in ${entryPoint}`)
      }

      // Check for qubots imports
      if (!fileContent.includes('qubots') && !fileContent.includes('BaseOptimizer')) {
        validation.warnings.push('No qubots framework imports detected')
      }

      // Check for required methods (basic heuristic)
      if (!fileContent.includes('optimize') && !fileContent.includes('_optimize_implementation')) {
        validation.warnings.push('No optimization method detected')
      }

      validation.valid = validation.errors.length === 0

      return validation

    } catch (error) {
      validation.errors.push(`Entry point validation failed: ${error.message}`)
      return validation
    }
  }

  /**
   * Validate qubots framework compatibility
   */
  static validateFrameworkCompatibility(config) {
    const validation = {
      warnings: []
    }

    // Check for requirements.txt or dependencies
    if (!config.requirements && !config.dependencies) {
      validation.warnings.push('No dependencies specified - ensure qubots framework is available')
    }

    // Check metadata completeness for leaderboard
    if (config.metadata) {
      const recommendedFields = [
        'author',
        'version',
        'license',
        'optimizer_family',
        'deterministic',
        'parallel_capable'
      ]

      for (const field of recommendedFields) {
        if (!config.metadata[field]) {
          validation.warnings.push(`Recommended metadata field missing: ${field}`)
        }
      }
    }

    return validation
  }

  /**
   * Calculate compatibility score (0-100)
   */
  static calculateCompatibilityScore(configValidation, entryPointValidation, frameworkValidation) {
    let score = 0

    // Base score for valid config
    if (configValidation.valid) {
      score += 40
    }

    // Score for valid entry point
    if (entryPointValidation.valid) {
      score += 30
    }

    // Score for complete metadata
    if (configValidation.config?.metadata) {
      const metadata = configValidation.config.metadata
      const metadataFields = ['name', 'description', 'author', 'version', 'optimizer_type', 'problem_types']
      const completedFields = metadataFields.filter(field => metadata[field])
      score += (completedFields.length / metadataFields.length) * 20
    }

    // Score for parameters documentation
    if (configValidation.config?.parameters) {
      score += 10
    }

    // Deduct for warnings
    const totalWarnings = configValidation.warnings.length + 
                         entryPointValidation.warnings.length + 
                         frameworkValidation.warnings.length
    
    score = Math.max(0, score - (totalWarnings * 2))

    return Math.round(score)
  }

  /**
   * Get solver metadata for display
   */
  static async getSolverMetadata(solverRepository, token = null) {
    try {
      const [username, repoName] = solverRepository.split('/')
      
      const configResponse = await GiteaService.getFileContent(
        token,
        username,
        repoName,
        'config.json'
      )

      if (!configResponse.ok) {
        return null
      }

      const configData = await configResponse.json()
      const config = JSON.parse(Buffer.from(configData.content, 'base64').toString())

      return {
        name: config.metadata?.name || repoName,
        description: config.metadata?.description || 'No description available',
        author: config.metadata?.author || username,
        version: config.metadata?.version || '1.0.0',
        optimizer_type: config.metadata?.optimizer_type || 'unknown',
        problem_types: config.metadata?.problem_types || [],
        parameters: config.parameters || {}
      }

    } catch (error) {
      console.error('Error getting solver metadata:', error)
      return null
    }
  }
}

module.exports = SolverValidationService

/**
 * Benchmark Validation Service
 * 
 * Provides validation and fairness mechanisms for benchmark-to-leaderboard conversion.
 * Ensures consistent evaluation criteria and reliable benchmark reproduction.
 */

const { knex } = require("../config/database")

class BenchmarkValidationService {
  
  /**
   * Validate benchmark for leaderboard export
   */
  static async validateBenchmarkForExport(benchmarkId) {
    const validation = {
      isValid: true,
      errors: [],
      warnings: [],
      fairnessScore: 0,
      recommendations: []
    }

    try {
      // Get benchmark details
      const benchmark = await knex("benchmarks")
        .where({ id: benchmarkId })
        .first()

      if (!benchmark) {
        validation.isValid = false
        validation.errors.push("Benchmark not found")
        return validation
      }

      // Get connections and results
      const connections = await knex("benchmark_connections")
        .where({ benchmark_id: benchmarkId })

      const results = await knex("benchmark_results")
        .where({ benchmark_id: benchmarkId })

      // Validation checks
      await this.validateProblemRepositories(connections, validation)
      await this.validateResultConsistency(results, validation)
      await this.validateFairnessMetrics(results, validation)
      await this.validateReproducibility(benchmark, connections, validation)

      // Calculate overall fairness score
      validation.fairnessScore = this.calculateFairnessScore(validation)

      // Generate recommendations
      this.generateRecommendations(validation)

    } catch (error) {
      console.error("Error validating benchmark:", error)
      validation.isValid = false
      validation.errors.push("Validation service error")
    }

    return validation
  }

  /**
   * Validate problem repositories for consistency
   */
  static async validateProblemRepositories(connections, validation) {
    if (connections.length === 0) {
      validation.errors.push("No problem repositories connected")
      return
    }

    if (connections.length < 2) {
      validation.warnings.push("Single problem repository - consider adding more for comprehensive benchmarking")
    }

    // Check for repository accessibility and metadata
    for (const connection of connections) {
      const repoPath = connection.connected_repo_path
      
      // Basic repository path validation
      if (!repoPath || !repoPath.includes('/')) {
        validation.errors.push(`Invalid repository path: ${repoPath}`)
        continue
      }

      // Check for problem type consistency
      const inferredType = this.inferProblemType(repoPath)
      if (!inferredType) {
        validation.warnings.push(`Could not infer problem type for ${repoPath}`)
      }
    }

    // Check for problem type diversity
    const problemTypes = connections.map(conn => 
      this.inferProblemType(conn.connected_repo_path)
    ).filter(Boolean)

    const uniqueTypes = new Set(problemTypes)
    if (uniqueTypes.size > 1) {
      validation.warnings.push("Mixed problem types detected - ensure fair comparison is possible")
    }
  }

  /**
   * Validate result consistency across submissions
   */
  static async validateResultConsistency(results, validation) {
    if (results.length === 0) {
      validation.warnings.push("No results available for validation")
      return
    }

    // Check for minimum number of submissions
    if (results.length < 3) {
      validation.warnings.push("Few submissions available - leaderboard may lack statistical significance")
    }

    // Validate metric consistency
    const metricKeys = new Set()
    results.forEach(result => {
      if (result.metrics && typeof result.metrics === 'object') {
        Object.keys(result.metrics).forEach(key => metricKeys.add(key))
      }
    })

    if (metricKeys.size === 0) {
      validation.errors.push("No consistent metrics found across results")
      return
    }

    // Check for outliers and suspicious results
    const scores = results
      .map(r => r.score)
      .filter(s => s !== null && s !== undefined && !isNaN(s))

    if (scores.length > 0) {
      const { mean, std, outliers } = this.calculateStatistics(scores)
      
      if (outliers.length > 0) {
        validation.warnings.push(`${outliers.length} potential outlier(s) detected in results`)
      }

      if (std / mean > 0.5) {
        validation.warnings.push("High variance in results - may indicate inconsistent evaluation")
      }
    }
  }

  /**
   * Validate fairness metrics and evaluation criteria
   */
  static async validateFairnessMetrics(results, validation) {
    // Check for timing consistency
    const runtimes = results
      .map(r => r.metrics?.runtime_seconds || r.metrics?.execution_time)
      .filter(t => t !== null && t !== undefined && !isNaN(t))

    if (runtimes.length > 0) {
      const { mean, std } = this.calculateStatistics(runtimes)
      
      // Check for suspiciously fast or slow results
      const fastResults = runtimes.filter(t => t < mean - 2 * std).length
      const slowResults = runtimes.filter(t => t > mean + 2 * std).length

      if (fastResults > 0) {
        validation.warnings.push(`${fastResults} suspiciously fast result(s) detected`)
      }
      
      if (slowResults > 0) {
        validation.warnings.push(`${slowResults} suspiciously slow result(s) detected`)
      }
    }

    // Validate hardware normalization needs
    const uniqueAuthors = new Set(results.map(r => r.author || r.user_id))
    if (uniqueAuthors.size > 1) {
      validation.recommendations.push("Consider hardware normalization for fair comparison across different systems")
    }

    // Check for evaluation run consistency
    const evaluationCounts = results
      .map(r => r.metrics?.evaluation_count || r.metrics?.num_runs)
      .filter(c => c !== null && c !== undefined)

    if (evaluationCounts.length > 0) {
      const uniqueCounts = new Set(evaluationCounts)
      if (uniqueCounts.size > 1) {
        validation.warnings.push("Inconsistent number of evaluation runs across submissions")
      }
    }
  }

  /**
   * Validate reproducibility requirements
   */
  static async validateReproducibility(benchmark, connections, validation) {
    // Check for deterministic configuration
    if (!benchmark.description.includes("seed") && !benchmark.description.includes("random")) {
      validation.recommendations.push("Consider specifying random seed for reproducible results")
    }

    // Validate repository stability
    for (const connection of connections) {
      // This would ideally check repository commit hashes, tags, or versions
      // For now, we'll add basic recommendations
      validation.recommendations.push(`Pin specific version/commit for ${connection.connected_repo_path}`)
    }

    // Check for comprehensive documentation
    if (!benchmark.description || benchmark.description.length < 50) {
      validation.warnings.push("Benchmark description is too brief - add more details for reproducibility")
    }
  }

  /**
   * Calculate overall fairness score (0-100)
   */
  static calculateFairnessScore(validation) {
    let score = 100

    // Deduct points for errors and warnings
    score -= validation.errors.length * 20
    score -= validation.warnings.length * 5

    // Bonus points for good practices
    if (validation.recommendations.length === 0) {
      score += 10
    }

    return Math.max(0, Math.min(100, score))
  }

  /**
   * Generate actionable recommendations
   */
  static generateRecommendations(validation) {
    if (validation.errors.length > 0) {
      validation.recommendations.unshift("Fix all errors before exporting to leaderboard")
    }

    if (validation.warnings.length > 3) {
      validation.recommendations.push("Address warnings to improve benchmark quality")
    }

    if (validation.fairnessScore < 70) {
      validation.recommendations.push("Consider improving benchmark design for better fairness")
    }

    // Add standard fairness recommendations
    validation.recommendations.push(
      "Ensure all submissions use the same evaluation criteria",
      "Document hardware requirements and normalization procedures",
      "Specify time limits and resource constraints clearly",
      "Use consistent random seeds for reproducible results"
    )
  }

  /**
   * Helper method to infer problem type from repository path
   */
  static inferProblemType(repoPath) {
    const repoName = repoPath.split('/').pop().toLowerCase()
    
    const typeMapping = {
      'maxcut': 'maxcut',
      'tsp': 'tsp',
      'vrp': 'vrp',
      'knapsack': 'knapsack',
      'scheduling': 'scheduling',
      'assignment': 'assignment',
      'routing': 'routing',
      'optimization': 'general'
    }

    for (const [keyword, type] of Object.entries(typeMapping)) {
      if (repoName.includes(keyword)) {
        return type
      }
    }

    return null
  }

  /**
   * Calculate basic statistics for numerical arrays
   */
  static calculateStatistics(values) {
    if (values.length === 0) {
      return { mean: 0, std: 0, outliers: [] }
    }

    const mean = values.reduce((sum, val) => sum + val, 0) / values.length
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length
    const std = Math.sqrt(variance)

    // Identify outliers (values beyond 2 standard deviations)
    const outliers = values.filter(val => Math.abs(val - mean) > 2 * std)

    return { mean, std, outliers }
  }

  /**
   * Generate standardized evaluation criteria for leaderboard
   */
  static generateEvaluationCriteria(benchmark, connections) {
    return {
      time_limit_seconds: 300,
      memory_limit_mb: 1024,
      evaluation_runs: 5,
      random_seed: Math.floor(Math.random() * 10000),
      hardware_normalization: true,
      statistical_validation: true,
      reproducibility_requirements: {
        qubots_version: ">=1.0.0",
        python_version: ">=3.8",
        required_packages: ["qubots", "numpy", "scipy"]
      },
      fairness_checks: {
        outlier_detection: true,
        consistency_validation: true,
        timing_normalization: true
      }
    }
  }
}

module.exports = BenchmarkValidationService

class OptimizationService {
  static async executeOptimization(algorithmId, parameters, problemConfig, realTime = false) {
    try {
      // Initialize problem function
      const objectiveFunction = this.createObjectiveFunction(problemConfig)

      // Execute the specified algorithm
      let result
      switch (algorithmId) {
        case "gradient_descent":
          result = await this.gradientDescent(objectiveFunction, parameters, problemConfig, realTime)
          break
        case "genetic_algorithm":
          result = await this.geneticAlgorithm(objectiveFunction, parameters, problemConfig, realTime)
          break
        case "simulated_annealing":
          result = await this.simulatedAnnealing(objectiveFunction, parameters, problemConfig, realTime)
          break
        case "particle_swarm":
          result = await this.particleSwarmOptimization(objectiveFunction, parameters, problemConfig, realTime)
          break
        default:
          throw new Error(`Unknown algorithm: ${algorithmId}`)
      }

      return {
        success: true,
        algorithm: algorithmId,
        parameters,
        problem_config: problemConfig,
        result,
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }
    }
  }

  static createObjectiveFunction(problemConfig) {
    const { function_type, dimensions = 2, bounds = { min: -5, max: 5 } } = problemConfig

    switch (function_type) {
      case "sphere":
        return (x) => x.reduce((sum, xi) => sum + xi * xi, 0)

      case "rastrigin":
        return (x) => {
          const A = 10
          const n = x.length
          return A * n + x.reduce((sum, xi) => sum + (xi * xi - A * Math.cos(2 * Math.PI * xi)), 0)
        }

      case "rosenbrock":
        return (x) => {
          let sum = 0
          for (let i = 0; i < x.length - 1; i++) {
            sum += 100 * Math.pow(x[i + 1] - x[i] * x[i], 2) + Math.pow(1 - x[i], 2)
          }
          return sum
        }

      case "ackley":
        return (x) => {
          const a = 20, b = 0.2, c = 2 * Math.PI
          const n = x.length
          const sum1 = x.reduce((sum, xi) => sum + xi * xi, 0)
          const sum2 = x.reduce((sum, xi) => sum + Math.cos(c * xi), 0)
          return -a * Math.exp(-b * Math.sqrt(sum1 / n)) - Math.exp(sum2 / n) + a + Math.E
        }

      default:
        throw new Error(`Unknown function type: ${function_type}`)
    }
  }

  static async gradientDescent(objectiveFunction, params, problemConfig, realTime) {
    const { learning_rate = 0.1, max_iterations = 100, tolerance = 1e-6 } = params
    const { dimensions = 2, bounds = { min: -5, max: 5 } } = problemConfig

    // Initialize random starting point
    let x = Array(dimensions).fill(0).map(() =>
      Math.random() * (bounds.max - bounds.min) + bounds.min
    )

    const history = []
    let bestX = [...x]
    let bestValue = objectiveFunction(x)

    for (let iteration = 0; iteration < max_iterations; iteration++) {
      // Numerical gradient calculation
      const gradient = this.numericalGradient(objectiveFunction, x)

      // Update position
      const newX = x.map((xi, i) => {
        const newVal = xi - learning_rate * gradient[i]
        // Apply bounds
        return Math.max(bounds.min, Math.min(bounds.max, newVal))
      })

      const value = objectiveFunction(newX)

      // Track best solution
      if (value < bestValue) {
        bestValue = value
        bestX = [...newX]
      }

      // Store iteration data
      history.push({
        iteration,
        position: [...newX],
        value,
        gradient: [...gradient],
        best_value: bestValue
      })

      // Check convergence
      const gradientMagnitude = Math.sqrt(gradient.reduce((sum, g) => sum + g * g, 0))
      if (gradientMagnitude < tolerance) {
        break
      }

      x = newX

      // Add small delay for real-time visualization
      if (realTime && iteration % 5 === 0) {
        await new Promise(resolve => setTimeout(resolve, 10))
      }
    }

    return {
      best_solution: bestX,
      best_value: bestValue,
      iterations: history.length,
      history,
      convergence_achieved: history.length < max_iterations
    }
  }

  static async geneticAlgorithm(objectiveFunction, params, problemConfig, realTime) {
    const {
      population_size = 50,
      generations = 100,
      mutation_rate = 0.1,
      crossover_rate = 0.8
    } = params
    const { dimensions = 2, bounds = { min: -5, max: 5 } } = problemConfig

    // Initialize population
    let population = Array(population_size).fill(0).map(() =>
      Array(dimensions).fill(0).map(() =>
        Math.random() * (bounds.max - bounds.min) + bounds.min
      )
    )

    const history = []
    let bestSolution = null
    let bestValue = Infinity

    for (let generation = 0; generation < generations; generation++) {
      // Evaluate fitness
      const fitness = population.map(individual => ({
        individual,
        value: objectiveFunction(individual)
      }))

      // Sort by fitness (minimization)
      fitness.sort((a, b) => a.value - b.value)

      // Update best solution
      if (fitness[0].value < bestValue) {
        bestValue = fitness[0].value
        bestSolution = [...fitness[0].individual]
      }

      // Store generation data
      const avgFitness = fitness.reduce((sum, f) => sum + f.value, 0) / population_size
      history.push({
        generation,
        best_value: bestValue,
        average_value: avgFitness,
        worst_value: fitness[fitness.length - 1].value,
        best_individual: [...bestSolution]
      })

      // Selection, crossover, and mutation
      const newPopulation = []

      // Keep best individuals (elitism)
      const eliteCount = Math.floor(population_size * 0.1)
      for (let i = 0; i < eliteCount; i++) {
        newPopulation.push([...fitness[i].individual])
      }

      // Generate rest of population
      while (newPopulation.length < population_size) {
        // Tournament selection
        const parent1 = this.tournamentSelection(fitness, 3)
        const parent2 = this.tournamentSelection(fitness, 3)

        let offspring1 = [...parent1]
        let offspring2 = [...parent2]

        // Crossover
        if (Math.random() < crossover_rate) {
          [offspring1, offspring2] = this.crossover(parent1, parent2)
        }

        // Mutation
        offspring1 = this.mutate(offspring1, mutation_rate, bounds)
        offspring2 = this.mutate(offspring2, mutation_rate, bounds)

        newPopulation.push(offspring1)
        if (newPopulation.length < population_size) {
          newPopulation.push(offspring2)
        }
      }

      population = newPopulation

      // Add delay for real-time visualization
      if (realTime && generation % 5 === 0) {
        await new Promise(resolve => setTimeout(resolve, 20))
      }
    }

    return {
      best_solution: bestSolution,
      best_value: bestValue,
      generations: history.length,
      history,
      final_population: population
    }
  }

  static async simulatedAnnealing(objectiveFunction, params, problemConfig, realTime) {
    const {
      initial_temperature = 100,
      cooling_rate = 0.95,
      min_temperature = 1,
      max_iterations = 1000
    } = params
    const { dimensions = 2, bounds = { min: -5, max: 5 } } = problemConfig

    // Initialize random starting point
    let currentSolution = Array(dimensions).fill(0).map(() =>
      Math.random() * (bounds.max - bounds.min) + bounds.min
    )
    let currentValue = objectiveFunction(currentSolution)

    let bestSolution = [...currentSolution]
    let bestValue = currentValue
    let temperature = initial_temperature

    const history = []
    let totalIterations = 0

    while (temperature > min_temperature) {
      for (let iteration = 0; iteration < max_iterations; iteration++) {
        // Generate neighbor solution
        const neighbor = currentSolution.map(x => {
          const perturbation = (Math.random() - 0.5) * temperature * 0.1
          return Math.max(bounds.min, Math.min(bounds.max, x + perturbation))
        })

        const neighborValue = objectiveFunction(neighbor)

        // Accept or reject neighbor
        const deltaE = neighborValue - currentValue
        const acceptanceProbability = deltaE < 0 ? 1 : Math.exp(-deltaE / temperature)

        if (Math.random() < acceptanceProbability) {
          currentSolution = neighbor
          currentValue = neighborValue

          // Update best solution
          if (neighborValue < bestValue) {
            bestValue = neighborValue
            bestSolution = [...neighbor]
          }
        }

        // Store iteration data
        history.push({
          iteration: totalIterations,
          temperature,
          current_value: currentValue,
          best_value: bestValue,
          current_solution: [...currentSolution],
          accepted: Math.random() < acceptanceProbability
        })

        totalIterations++

        // Add delay for real-time visualization
        if (realTime && totalIterations % 10 === 0) {
          await new Promise(resolve => setTimeout(resolve, 15))
        }
      }

      // Cool down
      temperature *= cooling_rate
    }

    return {
      best_solution: bestSolution,
      best_value: bestValue,
      iterations: totalIterations,
      history,
      final_temperature: temperature
    }
  }

  // Helper methods
  static numericalGradient(func, x, h = 1e-8) {
    const gradient = []
    for (let i = 0; i < x.length; i++) {
      const xPlus = [...x]
      const xMinus = [...x]
      xPlus[i] += h
      xMinus[i] -= h
      gradient[i] = (func(xPlus) - func(xMinus)) / (2 * h)
    }
    return gradient
  }

  static tournamentSelection(fitness, tournamentSize) {
    const tournament = []
    for (let i = 0; i < tournamentSize; i++) {
      const randomIndex = Math.floor(Math.random() * fitness.length)
      tournament.push(fitness[randomIndex])
    }
    tournament.sort((a, b) => a.value - b.value)
    return tournament[0].individual
  }

  static crossover(parent1, parent2) {
    const crossoverPoint = Math.floor(Math.random() * parent1.length)
    const offspring1 = [...parent1.slice(0, crossoverPoint), ...parent2.slice(crossoverPoint)]
    const offspring2 = [...parent2.slice(0, crossoverPoint), ...parent1.slice(crossoverPoint)]
    return [offspring1, offspring2]
  }

  static mutate(individual, mutationRate, bounds) {
    return individual.map(gene => {
      if (Math.random() < mutationRate) {
        const mutation = (Math.random() - 0.5) * (bounds.max - bounds.min) * 0.1
        return Math.max(bounds.min, Math.min(bounds.max, gene + mutation))
      }
      return gene
    })
  }

  static async particleSwarmOptimization(objectiveFunction, params, problemConfig, realTime) {
    const {
      swarm_size = 30,
      iterations = 200,
      inertia_weight = 0.7,
      cognitive_weight = 1.5,
      social_weight = 1.5
    } = params
    const { dimensions = 2, bounds = { min: -5, max: 5 } } = problemConfig

    // Initialize swarm
    const particles = Array(swarm_size).fill(0).map(() => ({
      position: Array(dimensions).fill(0).map(() =>
        Math.random() * (bounds.max - bounds.min) + bounds.min
      ),
      velocity: Array(dimensions).fill(0).map(() =>
        (Math.random() - 0.5) * (bounds.max - bounds.min) * 0.1
      ),
      bestPosition: null,
      bestValue: Infinity
    }))

    // Initialize particle best positions
    particles.forEach(particle => {
      particle.bestPosition = [...particle.position]
      particle.bestValue = objectiveFunction(particle.position)
    })

    // Find global best
    let globalBestPosition = [...particles[0].bestPosition]
    let globalBestValue = particles[0].bestValue

    particles.forEach(particle => {
      if (particle.bestValue < globalBestValue) {
        globalBestValue = particle.bestValue
        globalBestPosition = [...particle.bestPosition]
      }
    })

    const history = []

    for (let iteration = 0; iteration < iterations; iteration++) {
      particles.forEach(particle => {
        // Update velocity
        for (let d = 0; d < dimensions; d++) {
          const r1 = Math.random()
          const r2 = Math.random()

          particle.velocity[d] = inertia_weight * particle.velocity[d] +
            cognitive_weight * r1 * (particle.bestPosition[d] - particle.position[d]) +
            social_weight * r2 * (globalBestPosition[d] - particle.position[d])

          // Limit velocity
          const maxVelocity = (bounds.max - bounds.min) * 0.2
          particle.velocity[d] = Math.max(-maxVelocity, Math.min(maxVelocity, particle.velocity[d]))
        }

        // Update position
        for (let d = 0; d < dimensions; d++) {
          particle.position[d] += particle.velocity[d]
          // Apply bounds
          particle.position[d] = Math.max(bounds.min, Math.min(bounds.max, particle.position[d]))
        }

        // Evaluate new position
        const value = objectiveFunction(particle.position)

        // Update particle best
        if (value < particle.bestValue) {
          particle.bestValue = value
          particle.bestPosition = [...particle.position]

          // Update global best
          if (value < globalBestValue) {
            globalBestValue = value
            globalBestPosition = [...particle.position]
          }
        }
      })

      // Calculate swarm statistics
      const currentValues = particles.map(p => objectiveFunction(p.position))
      const avgValue = currentValues.reduce((sum, v) => sum + v, 0) / swarm_size

      // Store iteration data
      history.push({
        iteration,
        global_best_value: globalBestValue,
        average_value: avgValue,
        global_best_position: [...globalBestPosition],
        particles: particles.map(p => ({
          position: [...p.position],
          velocity: [...p.velocity],
          value: objectiveFunction(p.position)
        }))
      })

      // Add delay for real-time visualization
      if (realTime && iteration % 5 === 0) {
        await new Promise(resolve => setTimeout(resolve, 25))
      }
    }

    return {
      best_solution: globalBestPosition,
      best_value: globalBestValue,
      iterations: history.length,
      history,
      final_swarm: particles.map(p => ({
        position: p.position,
        velocity: p.velocity,
        best_position: p.bestPosition,
        best_value: p.bestValue
      }))
    }
  }
}

module.exports = OptimizationService

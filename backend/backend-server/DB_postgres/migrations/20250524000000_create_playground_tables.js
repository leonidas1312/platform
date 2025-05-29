/**
 * @param { import('knex').Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async (knex) => {
  // Create playground_experiments table
  await knex.schema.createTable("playground_experiments", (table) => {
    table.increments("id").primary()
    table.string("user_id").notNullable()
    table.string("name").notNullable()
    table.text("description").nullable()
    table.string("algorithm_id").notNullable()
    table.jsonb("parameters").notNullable()
    table.jsonb("problem_config").notNullable()
    table.jsonb("results").nullable()
    table.timestamp("created_at").defaultTo(knex.fn.now())
    table.timestamp("updated_at").defaultTo(knex.fn.now())

    // Add foreign key to users table
    table.foreign("user_id").references("username").inTable("users").onDelete("CASCADE")

    // Add indexes for faster lookups
    table.index("user_id")
    table.index("algorithm_id")
    table.index("created_at")
    table.index("updated_at")
  })

  // Create playground_presets table for predefined scenarios
  await knex.schema.createTable("playground_presets", (table) => {
    table.increments("id").primary()
    table.string("name").notNullable()
    table.text("description").notNullable()
    table.string("category").notNullable()
    table.string("algorithm_id").notNullable()
    table.jsonb("parameters").notNullable()
    table.jsonb("problem_config").notNullable()
    table.boolean("is_public").defaultTo(true)
    table.string("created_by").nullable()
    table.timestamp("created_at").defaultTo(knex.fn.now())

    // Add foreign key to users table (nullable for system presets)
    table.foreign("created_by").references("username").inTable("users").onDelete("SET NULL")

    // Add indexes
    table.index("category")
    table.index("algorithm_id")
    table.index("is_public")
    table.index("created_by")
  })

  // Insert default presets
  await knex("playground_presets").insert([
    {
      name: "Sphere Function - Gradient Descent",
      description: "Optimize the simple sphere function using gradient descent. Good for learning basic optimization concepts.",
      category: "Beginner",
      algorithm_id: "gradient_descent",
      parameters: JSON.stringify({
        learning_rate: 0.1,
        max_iterations: 100,
        tolerance: 1e-6
      }),
      problem_config: JSON.stringify({
        function_type: "sphere",
        dimensions: 2,
        bounds: { min: -5, max: 5 }
      }),
      is_public: true,
      created_by: null
    },
    {
      name: "Rastrigin Function - Genetic Algorithm",
      description: "Tackle the challenging Rastrigin function with many local minima using genetic algorithm.",
      category: "Intermediate",
      algorithm_id: "genetic_algorithm",
      parameters: JSON.stringify({
        population_size: 50,
        generations: 100,
        mutation_rate: 0.1,
        crossover_rate: 0.8
      }),
      problem_config: JSON.stringify({
        function_type: "rastrigin",
        dimensions: 2,
        bounds: { min: -5.12, max: 5.12 }
      }),
      is_public: true,
      created_by: null
    },
    {
      name: "Rosenbrock Function - Particle Swarm",
      description: "Optimize the banana-shaped Rosenbrock function using particle swarm optimization.",
      category: "Intermediate",
      algorithm_id: "particle_swarm",
      parameters: JSON.stringify({
        swarm_size: 30,
        iterations: 200,
        inertia_weight: 0.7,
        cognitive_weight: 1.5,
        social_weight: 1.5
      }),
      problem_config: JSON.stringify({
        function_type: "rosenbrock",
        dimensions: 2,
        bounds: { min: -2, max: 2 }
      }),
      is_public: true,
      created_by: null
    },
    {
      name: "Ackley Function - Simulated Annealing",
      description: "Explore the Ackley function's complex landscape using simulated annealing.",
      category: "Advanced",
      algorithm_id: "simulated_annealing",
      parameters: JSON.stringify({
        initial_temperature: 100,
        cooling_rate: 0.95,
        min_temperature: 1,
        max_iterations: 1000
      }),
      problem_config: JSON.stringify({
        function_type: "ackley",
        dimensions: 2,
        bounds: { min: -5, max: 5 }
      }),
      is_public: true,
      created_by: null
    }
  ])
}

/**
 * @param { import('knex').Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async (knex) => {
  // Drop tables in reverse order due to foreign key constraints
  await knex.schema.dropTableIfExists("playground_presets")
  await knex.schema.dropTableIfExists("playground_experiments")
}

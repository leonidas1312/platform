/**
 * Migration: Create Leaderboard Tables
 *
 * Creates comprehensive tables for the qubots leaderboard system including
 * standardized benchmark problems, solver submissions, rankings, and fairness metrics.
 *
 * @param { import('knex').Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async (knex) => {
  // Create standardized_problems table for benchmark problem sets
  await knex.schema.createTable("standardized_problems", (table) => {
    table.increments("id").primary()
    table.string("name").notNullable().unique()
    table.string("problem_type").notNullable() // 'tsp', 'maxcut', 'vrp', etc.
    table.text("description").notNullable()
    table.string("difficulty_level").notNullable() // 'easy', 'medium', 'hard'
    table.jsonb("problem_config").notNullable() // Problem parameters
    table.jsonb("evaluation_config").notNullable() // Evaluation settings
    table.string("reference_solution").nullable() // Known optimal/best solution
    table.decimal("reference_value", 15, 6).nullable() // Known optimal/best value
    table.integer("time_limit_seconds").defaultTo(300) // Standard time limit
    table.integer("memory_limit_mb").defaultTo(1024) // Standard memory limit
    table.boolean("is_active").defaultTo(true)
    table.string("created_by").notNullable()
    table.timestamp("created_at").defaultTo(knex.fn.now())
    table.timestamp("updated_at").defaultTo(knex.fn.now())

    // Add indexes (no foreign key since we use Gitea for user management)
    table.index("problem_type")
    table.index("difficulty_level")
    table.index("is_active")
    table.index("created_at")
  })

  // Create leaderboard_submissions table for solver results
  await knex.schema.createTable("leaderboard_submissions", (table) => {
    table.increments("id").primary()
    table.integer("problem_id").notNullable()
    table.string("solver_name").notNullable()
    table.string("solver_username").notNullable()
    table.string("solver_repository").notNullable() // Full repo path
    table.string("solver_version").nullable() // Git commit hash or tag
    table.jsonb("solver_config").notNullable() // Solver parameters used
    
    // Performance metrics
    table.decimal("best_value", 15, 6).notNullable()
    table.decimal("mean_value", 15, 6).nullable()
    table.decimal("std_value", 15, 6).nullable()
    table.decimal("runtime_seconds", 10, 3).notNullable()
    table.integer("iterations").nullable()
    table.integer("evaluations").nullable()
    table.decimal("success_rate", 5, 2).defaultTo(100.0) // Percentage
    
    // Fairness and validation
    table.decimal("normalized_score", 10, 6).nullable() // Hardware-normalized score
    table.string("hardware_profile").nullable() // Hardware specification hash
    table.boolean("is_validated").defaultTo(false)
    table.text("validation_notes").nullable()
    
    // Metadata
    table.string("submitted_by").notNullable()
    table.jsonb("execution_metadata").defaultTo('{}') // Additional execution info
    table.timestamp("submitted_at").defaultTo(knex.fn.now())
    table.timestamp("validated_at").nullable()

    // Add foreign keys and indexes
    table.foreign("problem_id").references("id").inTable("standardized_problems").onDelete("CASCADE")
    // Note: submitted_by references Gitea usernames, no foreign key constraint
    table.index("problem_id")
    table.index("solver_name")
    table.index("solver_username")
    table.index("best_value")
    table.index("normalized_score")
    table.index("is_validated")
    table.index("submitted_at")
    
    // Unique constraint to prevent duplicate submissions
    table.unique(["problem_id", "solver_repository", "solver_version", "submitted_by"])
  })

  // Create leaderboard_rankings table for computed rankings
  await knex.schema.createTable("leaderboard_rankings", (table) => {
    table.increments("id").primary()
    table.integer("problem_id").notNullable()
    table.integer("submission_id").notNullable()
    table.integer("rank_overall").notNullable()
    table.integer("rank_by_value").notNullable()
    table.integer("rank_by_time").notNullable()
    table.integer("rank_by_efficiency").notNullable() // Value/time ratio
    table.decimal("percentile_score", 5, 2).notNullable() // 0-100 percentile
    table.decimal("relative_performance", 8, 4).notNullable() // Relative to best
    table.timestamp("computed_at").defaultTo(knex.fn.now())

    // Add foreign keys and indexes
    table.foreign("problem_id").references("id").inTable("standardized_problems").onDelete("CASCADE")
    table.foreign("submission_id").references("id").inTable("leaderboard_submissions").onDelete("CASCADE")
    table.index("problem_id")
    table.index("rank_overall")
    table.index("rank_by_value")
    table.index("percentile_score")
    table.index("computed_at")
    
    // Unique constraint
    table.unique(["problem_id", "submission_id"])
  })

  // Create solver_profiles table for solver metadata and statistics
  await knex.schema.createTable("solver_profiles", (table) => {
    table.increments("id").primary()
    table.string("solver_name").notNullable()
    table.string("solver_username").notNullable()
    table.string("solver_repository").notNullable()
    table.text("description").nullable()
    table.jsonb("tags").defaultTo('[]') // Algorithm type, approach, etc.
    table.string("algorithm_family").nullable() // 'genetic', 'local_search', etc.
    table.string("optimization_type").nullable() // 'metaheuristic', 'exact', etc.
    
    // Aggregate statistics
    table.integer("total_submissions").defaultTo(0)
    table.integer("problems_solved").defaultTo(0)
    table.decimal("average_rank", 8, 2).nullable()
    table.decimal("best_rank", 8, 2).nullable()
    table.decimal("success_rate", 5, 2).nullable()
    table.timestamp("first_submission").nullable()
    table.timestamp("last_submission").nullable()
    
    table.string("created_by").notNullable()
    table.timestamp("created_at").defaultTo(knex.fn.now())
    table.timestamp("updated_at").defaultTo(knex.fn.now())

    // Add indexes (no foreign key since we use Gitea for user management)
    table.index("solver_name")
    table.index("solver_username")
    table.index("algorithm_family")
    table.index("average_rank")
    table.index("problems_solved")
    
    // Unique constraint
    table.unique(["solver_repository"])
  })

  // Create hardware_profiles table for normalization
  await knex.schema.createTable("hardware_profiles", (table) => {
    table.increments("id").primary()
    table.string("profile_hash").notNullable().unique()
    table.string("cpu_model").nullable()
    table.integer("cpu_cores").nullable()
    table.decimal("cpu_frequency_ghz", 4, 2).nullable()
    table.integer("memory_gb").nullable()
    table.string("os_type").nullable()
    table.string("python_version").nullable()
    table.decimal("benchmark_score", 10, 4).nullable() // Standardized benchmark score
    table.decimal("normalization_factor", 6, 4).defaultTo(1.0)
    table.integer("submission_count").defaultTo(0)
    table.timestamp("created_at").defaultTo(knex.fn.now())
    table.timestamp("updated_at").defaultTo(knex.fn.now())

    table.index("profile_hash")
    table.index("benchmark_score")
    table.index("normalization_factor")
  })
}

/**
 * @param { import('knex').Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async (knex) => {
  // Drop tables in reverse order due to foreign key constraints
  await knex.schema.dropTableIfExists("hardware_profiles")
  await knex.schema.dropTableIfExists("solver_profiles")
  await knex.schema.dropTableIfExists("leaderboard_rankings")
  await knex.schema.dropTableIfExists("leaderboard_submissions")
  await knex.schema.dropTableIfExists("standardized_problems")
}

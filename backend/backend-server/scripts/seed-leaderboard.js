/**
 * Seed script for leaderboard standardized problems
 * 
 * This script populates the database with initial standardized benchmark problems
 * for the qubots leaderboard system.
 */

const { knex } = require("../config/database")

async function seedStandardizedProblems() {
  console.log("🌱 Seeding standardized problems...")

  // Check if problems already exist
  const existingProblems = await knex("standardized_problems").count("* as count").first()
  if (parseInt(existingProblems.count) > 0) {
    console.log("✅ Standardized problems already exist, skipping seed")
    return
  }

  // Note: We use "system" as the created_by value since we use Gitea for user management
  // No need to create a local user record

  const standardizedProblems = [
    // TSP Problems
    {
      name: "TSP-Berlin52",
      problem_type: "tsp",
      description: "Berlin52 TSP instance with 52 cities - a classic benchmark from TSPLIB",
      difficulty_level: "medium",
      problem_config: JSON.stringify({
        instance_name: "berlin52",
        n_cities: 52,
        optimal_tour_length: 7542
      }),
      evaluation_config: JSON.stringify({
        metric: "tour_length",
        minimize: true,
        time_limit: 300,
        memory_limit: 1024
      }),
      reference_solution: "0,48,31,44,18,40,7,8,9,42,32,50,10,51,13,12,46,25,26,27,11,24,3,5,14,4,23,47,37,36,39,38,35,34,33,43,45,15,28,49,19,22,29,1,6,41,20,16,2,17,30,21,0",
      reference_value: 7542.0,
      time_limit_seconds: 300,
      memory_limit_mb: 1024,
      created_by: "system"
    },
    {
      name: "TSP-EIL76",
      problem_type: "tsp", 
      description: "EIL76 TSP instance with 76 cities - medium difficulty benchmark",
      difficulty_level: "hard",
      problem_config: JSON.stringify({
        instance_name: "eil76",
        n_cities: 76,
        optimal_tour_length: 538
      }),
      evaluation_config: JSON.stringify({
        metric: "tour_length",
        minimize: true,
        time_limit: 600,
        memory_limit: 1024
      }),
      reference_value: 538.0,
      time_limit_seconds: 600,
      memory_limit_mb: 1024,
      created_by: "system"
    },
    {
      name: "TSP-PR76",
      problem_type: "tsp",
      description: "PR76 TSP instance with 76 cities - challenging benchmark problem",
      difficulty_level: "hard",
      problem_config: JSON.stringify({
        instance_name: "pr76",
        n_cities: 76,
        optimal_tour_length: 108159
      }),
      evaluation_config: JSON.stringify({
        metric: "tour_length",
        minimize: true,
        time_limit: 600,
        memory_limit: 1024
      }),
      reference_value: 108159.0,
      time_limit_seconds: 600,
      memory_limit_mb: 1024,
      created_by: "system"
    },

    // MaxCut Problems
    {
      name: "MaxCut-Random-20",
      problem_type: "maxcut",
      description: "Random MaxCut problem with 20 vertices and density 0.5 - good for algorithm testing",
      difficulty_level: "easy",
      problem_config: JSON.stringify({
        graph_type: "random",
        n_vertices: 20,
        density: 0.5,
        seed: 42
      }),
      evaluation_config: JSON.stringify({
        metric: "cut_value",
        minimize: false,
        time_limit: 120,
        memory_limit: 512
      }),
      time_limit_seconds: 120,
      memory_limit_mb: 512,
      created_by: "system"
    },
    {
      name: "MaxCut-Complete-16",
      problem_type: "maxcut",
      description: "Complete graph MaxCut with 16 vertices - known optimal solution",
      difficulty_level: "medium",
      problem_config: JSON.stringify({
        graph_type: "complete",
        n_vertices: 16
      }),
      evaluation_config: JSON.stringify({
        metric: "cut_value",
        minimize: false,
        time_limit: 180,
        memory_limit: 512
      }),
      reference_value: 60.0, // n*(n-1)/4 for even n
      time_limit_seconds: 180,
      memory_limit_mb: 512,
      created_by: "system"
    },
    {
      name: "MaxCut-Random-50",
      problem_type: "maxcut",
      description: "Large random MaxCut problem with 50 vertices - challenging optimization",
      difficulty_level: "hard",
      problem_config: JSON.stringify({
        graph_type: "random",
        n_vertices: 50,
        density: 0.3,
        seed: 123
      }),
      evaluation_config: JSON.stringify({
        metric: "cut_value",
        minimize: false,
        time_limit: 600,
        memory_limit: 1024
      }),
      time_limit_seconds: 600,
      memory_limit_mb: 1024,
      created_by: "system"
    },
    {
      name: "MaxCut-Cycle-20",
      problem_type: "maxcut",
      description: "Cycle graph MaxCut with 20 vertices - simple structure with known optimal",
      difficulty_level: "easy",
      problem_config: JSON.stringify({
        graph_type: "cycle",
        n_vertices: 20
      }),
      evaluation_config: JSON.stringify({
        metric: "cut_value",
        minimize: false,
        time_limit: 60,
        memory_limit: 256
      }),
      reference_value: 2.0, // Cycle graphs have optimal cut of 2
      time_limit_seconds: 60,
      memory_limit_mb: 256,
      created_by: "system"
    },

    // Future problem types can be added here
    {
      name: "Knapsack-Standard-100",
      problem_type: "knapsack",
      description: "Standard 0-1 knapsack problem with 100 items - classic optimization benchmark",
      difficulty_level: "medium",
      problem_config: JSON.stringify({
        n_items: 100,
        capacity_ratio: 0.5,
        seed: 456
      }),
      evaluation_config: JSON.stringify({
        metric: "total_value",
        minimize: false,
        time_limit: 300,
        memory_limit: 512
      }),
      time_limit_seconds: 300,
      memory_limit_mb: 512,
      created_by: "system"
    },
    {
      name: "VRP-Small-25",
      problem_type: "vrp",
      description: "Vehicle Routing Problem with 25 customers and 3 vehicles",
      difficulty_level: "medium",
      problem_config: JSON.stringify({
        n_customers: 25,
        n_vehicles: 3,
        vehicle_capacity: 100,
        depot_location: [0, 0],
        seed: 789
      }),
      evaluation_config: JSON.stringify({
        metric: "total_distance",
        minimize: true,
        time_limit: 600,
        memory_limit: 1024
      }),
      time_limit_seconds: 600,
      memory_limit_mb: 1024,
      created_by: "system"
    }
  ]

  // Insert standardized problems
  await knex("standardized_problems").insert(standardizedProblems)
  
  console.log(`✅ Seeded ${standardizedProblems.length} standardized problems`)
}

async function seedHardwareProfiles() {
  console.log("🖥️  Seeding hardware profiles...")

  // Check if hardware profiles already exist
  const existingProfiles = await knex("hardware_profiles").count("* as count").first()
  if (parseInt(existingProfiles.count) > 0) {
    console.log("✅ Hardware profiles already exist, skipping seed")
    return
  }

  const hardwareProfiles = [
    {
      profile_hash: "baseline_cpu_4c8g",
      cpu_model: "Intel Core i5-8400",
      cpu_cores: 4,
      cpu_frequency_ghz: 2.8,
      memory_gb: 8,
      os_type: "Linux",
      python_version: "3.9.0",
      benchmark_score: 1000.0,
      normalization_factor: 1.0,
      submission_count: 0
    },
    {
      profile_hash: "high_perf_8c16g",
      cpu_model: "Intel Core i7-10700K",
      cpu_cores: 8,
      cpu_frequency_ghz: 3.8,
      memory_gb: 16,
      os_type: "Linux",
      python_version: "3.9.0",
      benchmark_score: 1800.0,
      normalization_factor: 0.56, // Faster hardware gets lower factor
      submission_count: 0
    },
    {
      profile_hash: "budget_cpu_2c4g",
      cpu_model: "Intel Core i3-8100",
      cpu_cores: 2,
      cpu_frequency_ghz: 3.6,
      memory_gb: 4,
      os_type: "Linux",
      python_version: "3.8.0",
      benchmark_score: 600.0,
      normalization_factor: 1.67, // Slower hardware gets higher factor
      submission_count: 0
    }
  ]

  await knex("hardware_profiles").insert(hardwareProfiles)
  
  console.log(`✅ Seeded ${hardwareProfiles.length} hardware profiles`)
}

async function main() {
  try {
    console.log("🚀 Starting leaderboard seed process...")
    
    await seedStandardizedProblems()
    await seedHardwareProfiles()
    
    console.log("🎉 Leaderboard seeding completed successfully!")
    process.exit(0)
  } catch (error) {
    console.error("❌ Error seeding leaderboard:", error)
    process.exit(1)
  }
}

// Run the seed script
if (require.main === module) {
  main()
}

module.exports = {
  seedStandardizedProblems,
  seedHardwareProfiles
}

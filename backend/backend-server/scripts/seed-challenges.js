/**
 * Seed script for optimization challenges
 * Creates sample challenges for the optimization challenges page
 */

const { knex } = require("../config/database")

async function seedChallenges() {
  try {
    console.log("🌱 Seeding optimization challenges...")

    // Check if challenges already exist
    const existingChallenges = await knex("standardized_problems")
      .where("challenge_type", "challenge")
      .count("* as count")
      .first()

    if (parseInt(existingChallenges.count) > 0) {
      console.log("✅ Challenges already exist, skipping seed")
      return
    }

    const sampleChallenges = [
      {
        name: "TSP Berlin52 Challenge",
        problem_type: "tsp",
        description: "Solve the classic Berlin52 Traveling Salesman Problem. Find the shortest route visiting all 52 cities in Berlin exactly once.",
        difficulty_level: "medium",
        problem_config: JSON.stringify({
          repository: "ileo/tsp-demo",
          parameters: {
            instance: "berlin52"
          }
        }),
        evaluation_config: JSON.stringify({
          metric: "tour_length",
          minimize: true,
          time_limit: 300
        }),
        dataset_info: JSON.stringify({
          name: "Berlin52 TSP Instance",
          description: "52 locations in Berlin, Germany",
          size: "52 cities",
          format: "TSPLIB"
        }),
        challenge_type: "challenge",
        created_by: "system",
        created_from_workflow: false,
        is_active: true,
        view_count: 0
      },
      {
        name: "Max-Cut Graph Challenge",
        problem_type: "maxcut",
        description: "Find the maximum cut in a weighted graph. Partition vertices to maximize the weight of edges between partitions.",
        difficulty_level: "hard",
        problem_config: JSON.stringify({
          repository: "ileo/demo-maxcut",
          parameters: {
            graph_size: 100,
            density: 0.3
          }
        }),
        evaluation_config: JSON.stringify({
          metric: "cut_value",
          minimize: false,
          time_limit: 600
        }),
        dataset_info: JSON.stringify({
          name: "Random Graph G(100,0.3)",
          description: "Random graph with 100 vertices and edge probability 0.3",
          size: "100 vertices",
          format: "adjacency_matrix"
        }),
        challenge_type: "challenge",
        created_by: "system",
        created_from_workflow: false,
        is_active: true,
        view_count: 0
      },
      {
        name: "Vehicle Routing Challenge",
        problem_type: "vrp",
        description: "Optimize delivery routes for a fleet of vehicles with capacity constraints. Minimize total distance while serving all customers.",
        difficulty_level: "hard",
        problem_config: JSON.stringify({
          repository: "ileo/demo-vrp-problem",
          parameters: {
            num_vehicles: 5,
            vehicle_capacity: 100,
            num_customers: 50
          }
        }),
        evaluation_config: JSON.stringify({
          metric: "total_distance",
          minimize: true,
          time_limit: 900
        }),
        dataset_info: JSON.stringify({
          name: "VRP Instance 50-5-100",
          description: "50 customers, 5 vehicles, capacity 100",
          size: "50 customers",
          format: "vrp_format"
        }),
        challenge_type: "challenge",
        created_by: "system",
        created_from_workflow: false,
        is_active: true,
        view_count: 0
      },
      {
        name: "Small TSP Challenge",
        problem_type: "tsp",
        description: "A beginner-friendly TSP instance with 30 cities. Perfect for testing new algorithms and learning optimization.",
        difficulty_level: "easy",
        problem_config: JSON.stringify({
          repository: "ileo/tsp-demo",
          parameters: {
            instance: "eil30"
          }
        }),
        evaluation_config: JSON.stringify({
          metric: "tour_length",
          minimize: true,
          time_limit: 120
        }),
        dataset_info: JSON.stringify({
          name: "EIL30 TSP Instance",
          description: "30-city TSP instance from TSPLIB",
          size: "30 cities",
          format: "TSPLIB"
        }),
        challenge_type: "challenge",
        created_by: "system",
        created_from_workflow: false,
        is_active: true,
        view_count: 0
      },
      {
        name: "Capacitated TSP Challenge",
        problem_type: "tsp",
        description: "TSP with capacity constraints - vehicles have limited capacity and must return to depot when full.",
        difficulty_level: "medium",
        problem_config: JSON.stringify({
          repository: "ileo/tsp-capacity-constraints-demo",
          parameters: {
            capacity: 50,
            demand_range: [1, 10]
          }
        }),
        evaluation_config: JSON.stringify({
          metric: "total_cost",
          minimize: true,
          time_limit: 400
        }),
        dataset_info: JSON.stringify({
          name: "Capacitated TSP Instance",
          description: "TSP with vehicle capacity constraints",
          size: "40 cities",
          format: "custom"
        }),
        challenge_type: "challenge",
        created_by: "system",
        created_from_workflow: false,
        is_active: true,
        view_count: 0
      }
    ]

    // Insert challenges
    const insertedChallenges = await knex("standardized_problems")
      .insert(sampleChallenges)
      .returning("*")

    console.log(`✅ Seeded ${insertedChallenges.length} optimization challenges`)

    // Add some tags for the challenges
    const challengeTags = [
      { problem_id: insertedChallenges[0].id, tag: "tsp" },
      { problem_id: insertedChallenges[0].id, tag: "classic" },
      { problem_id: insertedChallenges[0].id, tag: "berlin" },
      
      { problem_id: insertedChallenges[1].id, tag: "maxcut" },
      { problem_id: insertedChallenges[1].id, tag: "graph" },
      { problem_id: insertedChallenges[1].id, tag: "np-hard" },
      
      { problem_id: insertedChallenges[2].id, tag: "vrp" },
      { problem_id: insertedChallenges[2].id, tag: "logistics" },
      { problem_id: insertedChallenges[2].id, tag: "routing" },
      
      { problem_id: insertedChallenges[3].id, tag: "tsp" },
      { problem_id: insertedChallenges[3].id, tag: "beginner" },
      { problem_id: insertedChallenges[3].id, tag: "small" },
      
      { problem_id: insertedChallenges[4].id, tag: "tsp" },
      { problem_id: insertedChallenges[4].id, tag: "capacity" },
      { problem_id: insertedChallenges[4].id, tag: "constraints" }
    ]

    await knex("challenge_tags").insert(challengeTags)
    console.log(`✅ Added tags for challenges`)

  } catch (error) {
    console.error("❌ Error seeding challenges:", error)
    throw error
  }
}

// Run the seed function if this script is executed directly
if (require.main === module) {
  seedChallenges()
    .then(() => {
      console.log("🎉 Challenge seeding completed successfully")
      process.exit(0)
    })
    .catch((error) => {
      console.error("💥 Challenge seeding failed:", error)
      process.exit(1)
    })
}

module.exports = { seedChallenges }

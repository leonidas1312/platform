/**
 * @param { import('knex').Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async (knex) => {
  console.log("🔧 Fixing foreign key constraints for Gitea-managed users...")

  // Check if standardized_problems table exists and has the problematic foreign key
  const standardizedProblemsExists = await knex.schema.hasTable("standardized_problems")
  
  if (standardizedProblemsExists) {
    try {
      // Drop the foreign key constraint if it exists
      await knex.schema.alterTable("standardized_problems", (table) => {
        table.dropForeign("created_by", "standardized_problems_created_by_foreign")
      })
      console.log("✅ Dropped foreign key constraint from standardized_problems.created_by")
    } catch (error) {
      // If the constraint doesn't exist or has a different name, try alternative approaches
      console.log("⚠️ Could not drop foreign key constraint (may not exist):", error.message)
      
      try {
        // Try dropping by column name only
        await knex.schema.alterTable("standardized_problems", (table) => {
          table.dropForeign("created_by")
        })
        console.log("✅ Dropped foreign key constraint from standardized_problems.created_by (alternative method)")
      } catch (altError) {
        console.log("⚠️ Alternative method also failed:", altError.message)
      }
    }
  }

  // Check if benchmarks table exists and has the problematic foreign key
  const benchmarksExists = await knex.schema.hasTable("benchmarks")
  
  if (benchmarksExists) {
    try {
      // Drop the foreign key constraint if it exists
      await knex.schema.alterTable("benchmarks", (table) => {
        table.dropForeign("created_by", "benchmarks_created_by_foreign")
      })
      console.log("✅ Dropped foreign key constraint from benchmarks.created_by")
    } catch (error) {
      // If the constraint doesn't exist or has a different name, try alternative approaches
      console.log("⚠️ Could not drop foreign key constraint (may not exist):", error.message)
      
      try {
        // Try dropping by column name only
        await knex.schema.alterTable("benchmarks", (table) => {
          table.dropForeign("created_by")
        })
        console.log("✅ Dropped foreign key constraint from benchmarks.created_by (alternative method)")
      } catch (altError) {
        console.log("⚠️ Alternative method also failed:", altError.message)
      }
    }
  }

  // Create a system user if it doesn't exist to handle system-created records
  const systemUserExists = await knex("users").where({ username: "system" }).first()
  
  if (!systemUserExists) {
    try {
      await knex("users").insert({
        username: "system",
        email: "system@rastion.local",
        password: null,
        created_at: new Date(),
        updated_at: new Date()
      })
      console.log("✅ Created system user for system-generated records")
    } catch (error) {
      console.log("⚠️ Could not create system user:", error.message)
    }
  }

  console.log("🎉 Foreign key constraint fixes completed")
}

/**
 * @param { import('knex').Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async (knex) => {
  console.log("🔄 Reverting foreign key constraint fixes...")

  // Re-add foreign key constraints if needed
  const standardizedProblemsExists = await knex.schema.hasTable("standardized_problems")
  const benchmarksExists = await knex.schema.hasTable("benchmarks")
  const usersExists = await knex.schema.hasTable("users")

  if (standardizedProblemsExists && usersExists) {
    try {
      await knex.schema.alterTable("standardized_problems", (table) => {
        table.foreign("created_by").references("username").inTable("users").onDelete("CASCADE")
      })
      console.log("✅ Re-added foreign key constraint to standardized_problems.created_by")
    } catch (error) {
      console.log("⚠️ Could not re-add foreign key constraint:", error.message)
    }
  }

  if (benchmarksExists && usersExists) {
    try {
      await knex.schema.alterTable("benchmarks", (table) => {
        table.foreign("created_by").references("username").inTable("users").onDelete("CASCADE")
      })
      console.log("✅ Re-added foreign key constraint to benchmarks.created_by")
    } catch (error) {
      console.log("⚠️ Could not re-add foreign key constraint:", error.message)
    }
  }

  // Remove system user
  try {
    await knex("users").where({ username: "system" }).del()
    console.log("✅ Removed system user")
  } catch (error) {
    console.log("⚠️ Could not remove system user:", error.message)
  }

  console.log("🎉 Foreign key constraint rollback completed")
}

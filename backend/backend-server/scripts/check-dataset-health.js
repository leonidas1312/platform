#!/usr/bin/env node

/**
 * Dataset Health Check Utility
 * 
 * This script checks the health of all datasets in the database
 * and reports any issues with file accessibility.
 */

const fs = require('fs').promises
const path = require('path')
const { knex } = require('../config/database')

async function checkDatasetHealth() {
  console.log('🔍 Starting dataset health check...\n')
  
  try {
    // Get all datasets from database
    const datasets = await knex('datasets')
      .select(['id', 'name', 'file_path', 'file_size', 'user_id', 'original_filename'])
      .orderBy('created_at', 'desc')

    console.log(`Found ${datasets.length} datasets to check\n`)

    let healthyCount = 0
    let unhealthyCount = 0
    const issues = []

    for (const dataset of datasets) {
      const health = {
        id: dataset.id,
        name: dataset.name,
        user_id: dataset.user_id,
        file_path: dataset.file_path,
        original_filename: dataset.original_filename,
        expected_size: dataset.file_size,
        status: 'healthy',
        issues: []
      }

      // Check if file exists
      try {
        await fs.access(dataset.file_path, fs.constants.F_OK)
      } catch (error) {
        health.status = 'unhealthy'
        health.issues.push('File does not exist on disk')
        unhealthyCount++
        issues.push(health)
        continue
      }

      // Check if file is readable
      try {
        await fs.access(dataset.file_path, fs.constants.R_OK)
      } catch (error) {
        health.status = 'unhealthy'
        health.issues.push('File exists but is not readable')
        unhealthyCount++
        issues.push(health)
        continue
      }

      // Check file size
      try {
        const stats = await fs.stat(dataset.file_path)
        health.actual_size = stats.size
        
        if (stats.size !== dataset.file_size) {
          health.status = 'unhealthy'
          health.issues.push(`File size mismatch: expected ${dataset.file_size}, actual ${stats.size}`)
          unhealthyCount++
          issues.push(health)
          continue
        }
      } catch (error) {
        health.status = 'unhealthy'
        health.issues.push('Cannot read file statistics')
        unhealthyCount++
        issues.push(health)
        continue
      }

      healthyCount++
    }

    // Report results
    console.log('📊 Health Check Results:')
    console.log(`✅ Healthy datasets: ${healthyCount}`)
    console.log(`❌ Unhealthy datasets: ${unhealthyCount}`)
    
    if (issues.length > 0) {
      console.log('\n🚨 Issues found:')
      issues.forEach((issue, index) => {
        console.log(`\n${index + 1}. Dataset: ${issue.name} (${issue.id})`)
        console.log(`   User: ${issue.user_id}`)
        console.log(`   File: ${issue.original_filename}`)
        console.log(`   Path: ${issue.file_path}`)
        console.log(`   Issues: ${issue.issues.join(', ')}`)
      })
      
      console.log('\n💡 Recommendations:')
      console.log('- Check if the upload directory exists and has proper permissions')
      console.log('- Verify that files were not manually deleted or moved')
      console.log('- Consider implementing a cleanup job for orphaned database records')
    } else {
      console.log('\n🎉 All datasets are healthy!')
    }

  } catch (error) {
    console.error('❌ Error during health check:', error)
  } finally {
    await knex.destroy()
  }
}

// Run the health check
if (require.main === module) {
  checkDatasetHealth()
    .then(() => {
      console.log('\n✅ Health check completed')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Health check failed:', error)
      process.exit(1)
    })
}

module.exports = { checkDatasetHealth }

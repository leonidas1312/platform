const fs = require('fs').promises
const path = require('path')
const { knex } = require('../config/database')

class DatasetCleanupService {
  /**
   * Clean up orphaned dataset files and database records
   */
  static async performCleanup() {
    console.log('🧹 Starting dataset cleanup...')
    
    try {
      const results = {
        orphanedFiles: 0,
        orphanedRecords: 0,
        errors: []
      }

      // Clean up orphaned database records (files that don't exist)
      const orphanedRecords = await this.findOrphanedRecords()
      for (const record of orphanedRecords) {
        try {
          await this.removeOrphanedRecord(record.id)
          results.orphanedRecords++
          console.log(`Removed orphaned record: ${record.name} (${record.id})`)
        } catch (error) {
          results.errors.push(`Failed to remove record ${record.id}: ${error.message}`)
        }
      }

      // Clean up orphaned files (files without database records)
      const orphanedFiles = await this.findOrphanedFiles()
      for (const filePath of orphanedFiles) {
        try {
          await fs.unlink(filePath)
          results.orphanedFiles++
          console.log(`Removed orphaned file: ${filePath}`)
        } catch (error) {
          results.errors.push(`Failed to remove file ${filePath}: ${error.message}`)
        }
      }

      console.log(`✅ Cleanup completed: ${results.orphanedRecords} records, ${results.orphanedFiles} files removed`)
      
      if (results.errors.length > 0) {
        console.log('⚠️ Errors during cleanup:')
        results.errors.forEach(error => console.log(`  - ${error}`))
      }

      return results
    } catch (error) {
      console.error('❌ Cleanup failed:', error)
      throw error
    }
  }

  /**
   * Find database records for files that no longer exist
   */
  static async findOrphanedRecords() {
    const datasets = await knex('datasets')
      .select(['id', 'name', 'file_path'])

    const orphaned = []
    
    for (const dataset of datasets) {
      try {
        await fs.access(dataset.file_path, fs.constants.F_OK)
      } catch (error) {
        // File doesn't exist
        orphaned.push(dataset)
      }
    }

    return orphaned
  }

  /**
   * Find files in upload directory that don't have database records
   */
  static async findOrphanedFiles() {
    const uploadDir = path.join(__dirname, '../uploads/datasets')
    
    try {
      const files = await fs.readdir(uploadDir)
      const orphaned = []

      for (const file of files) {
        const filePath = path.join(uploadDir, file)
        
        // Skip directories
        const stats = await fs.stat(filePath)
        if (stats.isDirectory()) continue

        // Check if file has a corresponding database record
        const record = await knex('datasets')
          .where('file_path', filePath)
          .first()

        if (!record) {
          orphaned.push(filePath)
        }
      }

      return orphaned
    } catch (error) {
      if (error.code === 'ENOENT') {
        // Upload directory doesn't exist
        return []
      }
      throw error
    }
  }

  /**
   * Remove orphaned database record and related data
   */
  static async removeOrphanedRecord(datasetId) {
    await knex.transaction(async (trx) => {
      await trx('dataset_access_logs').where('dataset_id', datasetId).del()
      await trx('dataset_compatibility').where('dataset_id', datasetId).del()
      await trx('datasets').where('id', datasetId).del()
    })
  }

  /**
   * Schedule periodic cleanup
   */
  static startPeriodicCleanup(intervalHours = 24) {
    const intervalMs = intervalHours * 60 * 60 * 1000
    
    console.log(`📅 Scheduling dataset cleanup every ${intervalHours} hours`)
    
    setInterval(async () => {
      try {
        await this.performCleanup()
      } catch (error) {
        console.error('Scheduled cleanup failed:', error)
      }
    }, intervalMs)

    // Run initial cleanup after 5 minutes
    setTimeout(async () => {
      try {
        await this.performCleanup()
      } catch (error) {
        console.error('Initial cleanup failed:', error)
      }
    }, 5 * 60 * 1000)
  }

  /**
   * Validate dataset file integrity
   */
  static async validateDatasetIntegrity(datasetId) {
    const dataset = await knex('datasets')
      .select(['file_path', 'file_size', 'name'])
      .where('id', datasetId)
      .first()

    if (!dataset) {
      throw new Error('Dataset not found')
    }

    const issues = []

    // Check file existence
    try {
      await fs.access(dataset.file_path, fs.constants.F_OK)
    } catch (error) {
      issues.push('File does not exist')
      return { valid: false, issues }
    }

    // Check file readability
    try {
      await fs.access(dataset.file_path, fs.constants.R_OK)
    } catch (error) {
      issues.push('File is not readable')
    }

    // Check file size
    try {
      const stats = await fs.stat(dataset.file_path)
      if (stats.size !== dataset.file_size) {
        issues.push(`File size mismatch: expected ${dataset.file_size}, actual ${stats.size}`)
      }
    } catch (error) {
      issues.push('Cannot read file statistics')
    }

    return {
      valid: issues.length === 0,
      issues
    }
  }
}

module.exports = DatasetCleanupService

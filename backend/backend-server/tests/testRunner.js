/**
 * Test Runner for Workflow Execution System
 * 
 * Comprehensive test runner that executes all test suites and generates reports
 */

const Mocha = require('mocha')
const path = require('path')
const fs = require('fs')

class WorkflowTestRunner {
  constructor() {
    this.mocha = new Mocha({
      timeout: 30000, // 30 seconds default timeout
      reporter: 'spec',
      recursive: true
    })
    
    this.testResults = {
      total: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      duration: 0,
      suites: []
    }
  }

  /**
   * Add test files to the runner
   */
  addTestFiles() {
    const testDir = __dirname
    const testFiles = [
      'workflowExecutionTests.js',
      // Add more test files here as they are created
    ]

    for (const file of testFiles) {
      const filePath = path.join(testDir, file)
      if (fs.existsSync(filePath)) {
        this.mocha.addFile(filePath)
        console.log(`📋 Added test file: ${file}`)
      } else {
        console.warn(`⚠️ Test file not found: ${file}`)
      }
    }
  }

  /**
   * Run all tests
   */
  async runTests() {
    console.log('🚀 Starting Workflow Execution System Tests...')
    console.log('=' * 60)

    const startTime = Date.now()

    return new Promise((resolve, reject) => {
      this.mocha.run((failures) => {
        const endTime = Date.now()
        this.testResults.duration = endTime - startTime

        if (failures) {
          console.log(`❌ Tests completed with ${failures} failures`)
          reject(new Error(`${failures} test(s) failed`))
        } else {
          console.log('✅ All tests passed!')
          resolve(this.testResults)
        }

        this.generateTestReport()
      })
    })
  }

  /**
   * Generate test report
   */
  generateTestReport() {
    const report = {
      timestamp: new Date().toISOString(),
      duration: this.testResults.duration,
      summary: {
        total: this.testResults.total,
        passed: this.testResults.passed,
        failed: this.testResults.failed,
        skipped: this.testResults.skipped,
        successRate: this.testResults.total > 0 ? 
          (this.testResults.passed / this.testResults.total * 100).toFixed(2) + '%' : '0%'
      },
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        memory: process.memoryUsage()
      }
    }

    // Write report to file
    const reportPath = path.join(__dirname, 'test-report.json')
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))
    
    console.log('\n📊 Test Report Generated:')
    console.log(`   Total Tests: ${report.summary.total}`)
    console.log(`   Passed: ${report.summary.passed}`)
    console.log(`   Failed: ${report.summary.failed}`)
    console.log(`   Success Rate: ${report.summary.successRate}`)
    console.log(`   Duration: ${report.duration}ms`)
    console.log(`   Report saved to: ${reportPath}`)
  }

  /**
   * Run specific test suite
   */
  async runTestSuite(suiteName) {
    console.log(`🎯 Running specific test suite: ${suiteName}`)
    
    // Clear existing files
    this.mocha.files = []
    
    // Add specific test file
    const testFile = path.join(__dirname, `${suiteName}.js`)
    if (fs.existsSync(testFile)) {
      this.mocha.addFile(testFile)
      return this.runTests()
    } else {
      throw new Error(`Test suite not found: ${suiteName}`)
    }
  }

  /**
   * Run performance tests only
   */
  async runPerformanceTests() {
    console.log('⚡ Running Performance Tests...')
    
    this.mocha.grep('Performance Tests')
    return this.runTests()
  }

  /**
   * Run integration tests only
   */
  async runIntegrationTests() {
    console.log('🔗 Running Integration Tests...')
    
    this.mocha.grep('Integration Tests')
    return this.runTests()
  }

  /**
   * Run unit tests only
   */
  async runUnitTests() {
    console.log('🧪 Running Unit Tests...')
    
    this.mocha.grep('Integration Tests|Performance Tests', true) // Invert grep
    return this.runTests()
  }
}

/**
 * CLI interface for test runner
 */
async function main() {
  const args = process.argv.slice(2)
  const command = args[0] || 'all'
  
  const runner = new WorkflowTestRunner()
  
  try {
    switch (command) {
      case 'all':
        runner.addTestFiles()
        await runner.runTests()
        break
        
      case 'unit':
        runner.addTestFiles()
        await runner.runUnitTests()
        break
        
      case 'integration':
        runner.addTestFiles()
        await runner.runIntegrationTests()
        break
        
      case 'performance':
        runner.addTestFiles()
        await runner.runPerformanceTests()
        break
        
      case 'suite':
        const suiteName = args[1]
        if (!suiteName) {
          throw new Error('Suite name required. Usage: node testRunner.js suite <suiteName>')
        }
        await runner.runTestSuite(suiteName)
        break
        
      default:
        console.log('Usage: node testRunner.js [all|unit|integration|performance|suite <name>]')
        process.exit(1)
    }
    
    console.log('\n🎉 Test execution completed successfully!')
    process.exit(0)
    
  } catch (error) {
    console.error(`❌ Test execution failed: ${error.message}`)
    process.exit(1)
  }
}

// Export for programmatic use
module.exports = WorkflowTestRunner

// Run if called directly
if (require.main === module) {
  main()
}

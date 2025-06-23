#!/usr/bin/env node
/**
 * Test script for ArXiv service
 * 
 * This script tests the ArXiv service functionality including:
 * - Fetching papers from arXiv API
 * - Parsing XML responses
 * - Database operations
 * - Error handling
 */

require("dotenv").config()
const arxivService = require("../services/arxivService")

async function testArxivService() {
  console.log("🧪 Testing ArXiv Service...")
  console.log("=" .repeat(50))

  try {
    // Test 1: Fetch a small number of papers
    console.log("\n📚 Test 1: Fetching recent papers...")
    const result = await arxivService.fetchRecentPapers()
    console.log(`✅ Fetch completed:`)
    console.log(`   - Total fetched: ${result.totalFetched}`)
    console.log(`   - New papers: ${result.totalNew}`)
    console.log(`   - Categories searched: ${result.searchedCategories.join(", ")}`)

    // Test 2: Get recent papers from database
    console.log("\n📖 Test 2: Retrieving papers from database...")
    const papersResult = await arxivService.getRecentPapers(1, 5)
    console.log(`✅ Retrieved ${papersResult.papers.length} papers`)
    console.log(`   - Total in database: ${papersResult.pagination.total}`)
    
    if (papersResult.papers.length > 0) {
      const firstPaper = papersResult.papers[0]
      console.log(`   - Sample paper: "${firstPaper.title.substring(0, 60)}..."`)
      console.log(`   - Authors: ${firstPaper.authors.slice(0, 2).join(", ")}${firstPaper.authors.length > 2 ? " et al." : ""}`)
      console.log(`   - Categories: ${firstPaper.categories.join(", ")}`)
    }

    // Test 3: Get fetch statistics
    console.log("\n📊 Test 3: Getting fetch statistics...")
    const stats = await arxivService.getFetchStats()
    console.log(`✅ Statistics retrieved:`)
    console.log(`   - Total papers in database: ${stats.totalPapers}`)
    console.log(`   - Recent fetches: ${stats.recentFetches.length}`)
    
    if (stats.recentFetches.length > 0) {
      const lastFetch = stats.recentFetches[0]
      console.log(`   - Last fetch: ${new Date(lastFetch.fetch_date).toISOString()}`)
      console.log(`   - Last fetch success: ${lastFetch.success}`)
      console.log(`   - Papers in last fetch: ${lastFetch.papers_fetched}`)
    }

    // Test 4: Test category filtering
    console.log("\n🏷️  Test 4: Testing category filtering...")
    const mathOCPapers = await arxivService.getRecentPapers(1, 3, "math.OC")
    console.log(`✅ Found ${mathOCPapers.papers.length} math.OC papers`)
    
    const csAIPapers = await arxivService.getRecentPapers(1, 3, "cs.AI")
    console.log(`✅ Found ${csAIPapers.papers.length} cs.AI papers`)

    // Test 5: Test view count increment
    if (papersResult.papers.length > 0) {
      console.log("\n👁️  Test 5: Testing view count increment...")
      const testPaper = papersResult.papers[0]
      const originalViewCount = testPaper.view_count
      
      await arxivService.incrementViewCount(testPaper.arxiv_id)
      console.log(`✅ Incremented view count for paper: ${testPaper.arxiv_id}`)
      console.log(`   - Original count: ${originalViewCount}`)
      console.log(`   - Should now be: ${originalViewCount + 1}`)
    }

    console.log("\n🎉 All tests completed successfully!")
    console.log("=" .repeat(50))

  } catch (error) {
    console.error("\n❌ Test failed:", error.message)
    console.error("Stack trace:", error.stack)
    process.exit(1)
  }
}

// Helper function to test XML parsing
async function testXMLParsing() {
  console.log("\n🔍 Testing XML parsing with sample data...")
  
  const sampleXML = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <entry>
    <id>http://arxiv.org/abs/2401.12345v1</id>
    <title>Sample Optimization Paper</title>
    <summary>This is a sample abstract for testing purposes.</summary>
    <published>2024-01-28T00:00:00Z</published>
    <author>
      <name>John Doe</name>
    </author>
    <author>
      <name>Jane Smith</name>
    </author>
    <category term="math.OC" scheme="http://arxiv.org/schemas/atom"/>
    <category term="cs.DS" scheme="http://arxiv.org/schemas/atom"/>
  </entry>
</feed>`

  try {
    const papers = arxivService.parseArxivResponse(sampleXML)
    console.log(`✅ Parsed ${papers.length} papers from sample XML`)
    
    if (papers.length > 0) {
      const paper = papers[0]
      console.log(`   - Title: ${paper.title}`)
      console.log(`   - ArXiv ID: ${paper.arxivId}`)
      console.log(`   - Authors: ${JSON.parse(paper.authors).join(", ")}`)
      console.log(`   - Categories: ${JSON.parse(paper.categories).join(", ")}`)
    }
  } catch (error) {
    console.error("❌ XML parsing test failed:", error.message)
  }
}

// Run tests
async function main() {
  console.log("🚀 Starting ArXiv Service Tests")
  console.log(`📅 Test run: ${new Date().toISOString()}`)
  
  // Test XML parsing first (doesn't require database)
  await testXMLParsing()
  
  // Test full service functionality
  await testArxivService()
  
  console.log("\n✨ Test suite completed!")
  process.exit(0)
}

// Handle uncaught errors
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason)
  process.exit(1)
})

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error)
  process.exit(1)
})

// Run the tests
if (require.main === module) {
  main()
}

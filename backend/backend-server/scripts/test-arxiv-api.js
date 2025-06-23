#!/usr/bin/env node
/**
 * Test script to directly test arXiv API
 */

const fetch = (...args) => import("node-fetch").then(({ default: fetch }) => fetch(...args))

async function testArxivAPI() {
  console.log("🧪 Testing arXiv API directly...")
  console.log("=" .repeat(50))

  const baseUrl = "http://export.arxiv.org/api/query"
  const categories = ["math.OC", "cs.DS", "cs.AI", "cs.LG"]

  for (const category of categories) {
    console.log(`\n📚 Testing category: ${category}`)
    
    try {
      // Test 1: Simple query without date filter
      const simpleQuery = `cat:${category}`
      const simpleUrl = `${baseUrl}?search_query=${encodeURIComponent(simpleQuery)}&start=0&max_results=5&sortBy=submittedDate&sortOrder=descending`
      
      console.log(`🔗 Simple query URL: ${simpleUrl}`)
      
      const response = await fetch(simpleUrl)
      if (!response.ok) {
        console.error(`❌ API request failed: ${response.status} ${response.statusText}`)
        continue
      }
      
      const xmlData = await response.text()
      console.log(`📄 Response length: ${xmlData.length} characters`)
      
      // Count entries
      const entryMatches = xmlData.match(/<entry>/g)
      const entryCount = entryMatches ? entryMatches.length : 0
      console.log(`📋 Number of entries found: ${entryCount}`)
      
      if (entryCount > 0) {
        // Extract first paper title for verification
        const titleMatch = xmlData.match(/<title[^>]*>(.*?)<\/title>/s)
        if (titleMatch && titleMatch[1]) {
          const title = titleMatch[1].trim().replace(/\s+/g, ' ')
          console.log(`📖 First paper title: "${title.substring(0, 100)}${title.length > 100 ? '...' : ''}"`)
        }
        
        // Extract first paper date
        const publishedMatch = xmlData.match(/<published[^>]*>(.*?)<\/published>/s)
        if (publishedMatch && publishedMatch[1]) {
          const published = publishedMatch[1].trim()
          console.log(`📅 First paper date: ${published}`)
        }
      } else {
        console.log("⚠️  No papers found for this category")
        
        // Check if there's an error in the response
        if (xmlData.includes('<title>Error</title>')) {
          console.log("❌ ArXiv API returned an error")
          console.log("📋 Error response sample:", xmlData.substring(0, 500))
        }
      }
      
      // Add delay between requests
      await new Promise(resolve => setTimeout(resolve, 1000))
      
    } catch (error) {
      console.error(`❌ Error testing ${category}:`, error.message)
    }
  }

  // Test 2: Try with date filter
  console.log(`\n📅 Testing with date filter...`)
  
  try {
    const fromDate = new Date()
    fromDate.setDate(fromDate.getDate() - 7) // Last 7 days
    const fromDateStr = fromDate.toISOString().split('T')[0].replace(/-/g, '')
    
    const dateQuery = `cat:math.OC AND submittedDate:[${fromDateStr}0000 TO 20991231235959]`
    const dateUrl = `${baseUrl}?search_query=${encodeURIComponent(dateQuery)}&start=0&max_results=5&sortBy=submittedDate&sortOrder=descending`
    
    console.log(`🔗 Date query URL: ${dateUrl}`)
    console.log(`📅 Date range: from ${fromDateStr} (7 days ago)`)
    
    const response = await fetch(dateUrl)
    if (!response.ok) {
      console.error(`❌ Date query failed: ${response.status} ${response.statusText}`)
      return
    }
    
    const xmlData = await response.text()
    const entryMatches = xmlData.match(/<entry>/g)
    const entryCount = entryMatches ? entryMatches.length : 0
    console.log(`📋 Papers found with date filter: ${entryCount}`)
    
  } catch (error) {
    console.error(`❌ Error testing date filter:`, error.message)
  }

  // Test 3: Try alternative date format
  console.log(`\n📅 Testing alternative date format...`)
  
  try {
    const fromDate = new Date()
    fromDate.setDate(fromDate.getDate() - 7)
    const fromDateStr = fromDate.toISOString().split('T')[0] // Keep YYYY-MM-DD format
    
    const altDateQuery = `cat:math.OC AND submittedDate:[${fromDateStr} TO *]`
    const altDateUrl = `${baseUrl}?search_query=${encodeURIComponent(altDateQuery)}&start=0&max_results=5&sortBy=submittedDate&sortOrder=descending`
    
    console.log(`🔗 Alternative date query URL: ${altDateUrl}`)
    
    const response = await fetch(altDateUrl)
    if (!response.ok) {
      console.error(`❌ Alternative date query failed: ${response.status} ${response.statusText}`)
      return
    }
    
    const xmlData = await response.text()
    const entryMatches = xmlData.match(/<entry>/g)
    const entryCount = entryMatches ? entryMatches.length : 0
    console.log(`📋 Papers found with alternative date format: ${entryCount}`)
    
  } catch (error) {
    console.error(`❌ Error testing alternative date format:`, error.message)
  }

  console.log("\n✨ ArXiv API test completed!")
}

// Run the test
testArxivAPI().catch(console.error)

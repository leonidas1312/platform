#!/usr/bin/env node
/**
 * Email connection test script
 * Run with: node scripts/test-email.js
 */

const nodemailer = require("nodemailer")

async function testEmailConnection() {
  console.log('📧 Testing Gmail SMTP Connection...\n')
  
  const user = process.env.EMAIL_USER || "gleonidas303@gmail.com"
  const pass = process.env.EMAIL_PASS || "dmhe hdjj awlk tmim"
  
  console.log('📋 Configuration:')
  console.log(`   Email: ${user}`)
  console.log(`   Password: ${pass.substring(0, 4)}****`)
  console.log(`   Host: smtp.gmail.com`)
  console.log(`   Port: 587`)
  console.log('')
  
  // Test different configurations
  const configs = [
    {
      name: "Standard Gmail SMTP (TLS)",
      config: {
        host: "smtp.gmail.com",
        port: 587,
        secure: false,
        auth: { user, pass },
        connectionTimeout: 30000,
        greetingTimeout: 15000,
        socketTimeout: 30000,
        tls: { rejectUnauthorized: false }
      }
    },
    {
      name: "Gmail SMTP (SSL)",
      config: {
        host: "smtp.gmail.com", 
        port: 465,
        secure: true,
        auth: { user, pass },
        connectionTimeout: 30000,
        greetingTimeout: 15000,
        socketTimeout: 30000
      }
    },
    {
      name: "Gmail Service (nodemailer shortcut)",
      config: {
        service: "gmail",
        auth: { user, pass },
        connectionTimeout: 30000,
        greetingTimeout: 15000,
        socketTimeout: 30000
      }
    }
  ]
  
  for (const { name, config } of configs) {
    console.log(`🔍 Testing: ${name}`)
    console.log('─'.repeat(50))
    
    try {
      const transporter = nodemailer.createTransport(config)
      
      console.log('   ⏳ Verifying connection...')
      await transporter.verify()
      console.log('   ✅ Connection successful!')
      
      // Try sending a test email
      console.log('   ⏳ Sending test email...')
      await transporter.sendMail({
        from: `"Rastion Test" <${user}>`,
        to: user, // Send to self
        subject: "Email Test - " + new Date().toISOString(),
        text: "This is a test email from the Rastion backend.",
        html: "<p>This is a test email from the Rastion backend.</p>"
      })
      console.log('   ✅ Test email sent successfully!')
      console.log('   🎉 This configuration works!\n')
      break
      
    } catch (error) {
      console.log('   ❌ Failed:', error.message)
      if (error.code) {
        console.log('   📋 Error code:', error.code)
      }
      console.log('')
    }
  }
  
  console.log('💡 Troubleshooting tips:')
  console.log('   1. Make sure 2-Factor Authentication is enabled on your Gmail account')
  console.log('   2. Generate a new App Password: https://myaccount.google.com/apppasswords')
  console.log('   3. Use the 16-character app password (not your regular password)')
  console.log('   4. Check if "Less secure app access" is disabled (it should be)')
  console.log('   5. Try running: export EMAIL_PASS="your_new_app_password"')
}

// Run the test
testEmailConnection().catch(console.error)

const nodemailer = require("nodemailer")

class EmailService {
  constructor() {
    // Enhanced configuration for better reliability
    this.transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER || "gleonidas303@gmail.com",
        pass: process.env.EMAIL_PASS || "dmhe hdjj awlk tmim", // App password
      },
      // Increased timeout settings
      connectionTimeout: 30000, // 30 seconds
      greetingTimeout: 15000,   // 15 seconds
      socketTimeout: 30000,     // 30 seconds
      // Enhanced TLS settings
      tls: {
        rejectUnauthorized: false,
        ciphers: 'SSLv3'
      },
      // Enable debug logging in development
      debug: process.env.NODE_ENV !== 'production',
      logger: process.env.NODE_ENV !== 'production'
    })

    console.log("📧 Email service initialized for:", process.env.EMAIL_USER || "gleonidas303@gmail.com")
  }

  async sendVerificationEmail(email, verificationLink) {
    // Add timeout wrapper to prevent hanging
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Email sending timeout')), 15000)
    )

    const sendPromise = this.transporter.sendMail({
      from: "Rastion platform <gleonidas303@gmail.com>",
      to: email,
      subject: "Verify Your Email",
      html: `<p>Please verify your account by clicking this <a href="${verificationLink}">link</a>.</p>`,
    })

    await Promise.race([sendPromise, timeoutPromise])
  }

  async sendWaitlistNotification(waitlistData) {
    const { email, username, description, timestamp } = waitlistData

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">New Waitlist Application - Rastion Platform</h2>

        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #555;">Application Details</h3>

          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Preferred Username:</strong> ${username}</p>
          <p><strong>Submitted:</strong> ${new Date(timestamp).toLocaleString()}</p>

          ${description ? `
            <div style="margin-top: 20px;">
              <strong>Description:</strong>
              <div style="background-color: white; padding: 15px; border-radius: 4px; margin-top: 8px; border-left: 4px solid #007bff;">
                ${description.replace(/\n/g, '<br>')}
              </div>
            </div>
          ` : ''}
        </div>

        <div style="background-color: #e8f4fd; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; color: #0066cc;">
            <strong>Next Steps:</strong> Review the application and create a Gitea account for the user if approved.
          </p>
        </div>
      </div>
    `

    // Add timeout wrapper to prevent hanging
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Email sending timeout')), 15000)
    )

    const sendPromise = this.transporter.sendMail({
      from: "Rastion Waitlist <gleonidas303@gmail.com>",
      to: "gleonidas303@gmail.com",
      subject: `New Waitlist Application: ${username}`,
      html: htmlContent,
    })

    await Promise.race([sendPromise, timeoutPromise])
  }

  async testConnection() {
    try {
      console.log("🔍 Testing email connection...")
      console.log("📧 Email user:", process.env.EMAIL_USER || "gleonidas303@gmail.com")
      console.log("🔑 Using app password:", (process.env.EMAIL_PASS || "kukg nnvi plpp wtfx").substring(0, 4) + "****")

      // Test with timeout
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Connection test timeout')), 30000)
      )

      await Promise.race([this.transporter.verify(), timeoutPromise])
      console.log("✅ Email service connection verified successfully")
      return true
    } catch (error) {
      console.error("❌ Email service connection failed:", error.message)
      console.error("📋 Error code:", error.code)
      console.error("📋 Error response:", error.response)

      // Provide specific troubleshooting based on error
      if (error.message.includes('timeout')) {
        console.log("💡 Timeout error - check network connectivity and firewall settings")
      } else if (error.code === 'EAUTH') {
        console.log("💡 Authentication error - check your Gmail app password")
      } else if (error.code === 'ECONNECTION') {
        console.log("💡 Connection error - check if Gmail SMTP is accessible")
      }

      return false
    }
  }
}

module.exports = new EmailService()

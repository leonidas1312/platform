const nodemailer = require("nodemailer")

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: "gleonidas303@gmail.com",
        pass: "kukg nnvi plpp wtfx",
      },
    })
  }

  async sendVerificationEmail(email, verificationLink) {
    await this.transporter.sendMail({
      from: "Rastion platform <gleonidas303@gmail.com>",
      to: email,
      subject: "Verify Your Email",
      html: `<p>Please verify your account by clicking this <a href="${verificationLink}">link</a>.</p>`,
    })
  }
}

module.exports = new EmailService()

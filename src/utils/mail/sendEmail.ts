import type Mail from "nodemailer/lib/mailer/index.js"
import { transporter } from "../../services/smtp.js"
import type { EmailParams } from "../../types/email.js"
import umami from "../../umami.js"
import { parseEmail } from "./parseEmail.js"

const sendEmail = async ({
  email,
  subject,
  params,
  template,
}: {
  email: string
  subject: string
  params: EmailParams
  template: string
}): Promise<void> => {
  try {
    const parsedEmail = parseEmail(params, template)
    const mailOptions: Mail.Options = {
      from: process.env.SMTP_USER,
      to: email,
      subject,
      html: parsedEmail,
    }
    await transporter.sendMail(mailOptions)
    await umami.track("email_send_success")
  } catch (error) {
    await umami.track("email_send_failed")
    throw error
  }
}

export { sendEmail }

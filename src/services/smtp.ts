import nodemailer from "nodemailer"
import type SMTPTransport from "nodemailer/lib/smtp-transport/index.js"
import umami from "../umami.js"

const config: SMTPTransport.Options = {
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT ?? 587),
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  secure: process.env.SMTP_SSL === "true",
  tls: {
    servername: process.env.SMTP_HOST,
    rejectUnauthorized: process.env.NODE_ENV === "production",
  },
}
const transporter = nodemailer.createTransport(config)

export const testConnection = async (): Promise<boolean> => {
  try {
    await transporter.verify()

    return true
  } catch (error) {
    await umami.track("smtp_connection_error", {
      error: error instanceof Error ? error.message : "unknown",
    })

    return false
  }
}

if (process.env.NODE_ENV !== "production") {
  await testConnection()
}

export { transporter }

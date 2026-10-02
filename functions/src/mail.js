import { logger } from 'firebase-functions'
import { defineSecret } from 'firebase-functions/params'
import nodemailer from 'nodemailer'

// Where links in e-mails point (the web app); set APP_URL in functions/.env for production.
export const APP_URL = process.env.APP_URL ?? 'http://localhost:5173'

// The app password of the sending Google account (MAIL_FROM in functions/.env.<project>);
// `firebase functions:secrets:set SMTP_PASSWORD`. Functions that send e-mails bind it
// through MAIL_OPTIONS.
export const SMTP_PASSWORD = defineSecret('SMTP_PASSWORD')

const FROM_NAME = 'Skautský oddíl Záře'

// Sends e-mails [{ to, subject, text }] — SPEC §7 — over Gmail SMTP of the skaut.cz
// Google Workspace; replies go to MAIL_REPLY_TO. Never throws: failures are logged. The
// emulator only logs each e-mail (so links can be tried locally); production logs no content.
export async function sendEmails(kind, emails) {
  if (process.env.FUNCTIONS_EMULATOR === 'true') {
    for (const email of emails) {
      logger.info(`${kind} e-mail to ${email.to}: ${email.subject}`, { text: email.text })
    }
    logger.info(`${kind} e-mails`, { count: emails.length })
    return
  }
  if (!emails.length) return

  const from = process.env.MAIL_FROM
  const transport = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    pool: true,
    maxConnections: 3,
    auth: { user: from, pass: SMTP_PASSWORD.value() },
  })
  const results = await Promise.allSettled(
    emails.map((email) =>
      transport.sendMail({
        from: { name: FROM_NAME, address: from },
        replyTo: process.env.MAIL_REPLY_TO,
        to: email.to,
        subject: email.subject,
        text: email.text,
      }),
    ),
  )
  transport.close()

  const failed = results.filter((r) => r.status === 'rejected')
  for (const { reason } of failed) logger.error(`${kind} e-mail failed`, { error: reason?.message })
  logger.info(`${kind} e-mails`, { count: emails.length, failed: failed.length })
}

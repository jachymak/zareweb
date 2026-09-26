import { logger } from 'firebase-functions'

// Where links in e-mails point (the web app); set APP_URL in functions/.env for production.
export const APP_URL = process.env.APP_URL ?? 'http://localhost:5173'

// Sends e-mails [{ to, subject, text }] — SPEC §7.
// TODO: send over SMTP of the skaut.cz Google Workspace. Until then the emulator
// logs each e-mail (so links can be tried locally); production logs no content.
export async function sendEmails(kind, emails) {
  if (process.env.FUNCTIONS_EMULATOR === 'true') {
    for (const email of emails) {
      logger.info(`${kind} e-mail to ${email.to}: ${email.subject}`, { text: email.text })
    }
  }
  logger.info(`${kind} e-mails`, { count: emails.length })
}

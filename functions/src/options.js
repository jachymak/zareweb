import { SMTP_PASSWORD } from './mail.js'

// Options shared by all functions. Frankfurt, close to the users in Prague.
export const REGION = 'europe-west3'
export const BASE_OPTIONS = { region: REGION, maxInstances: 10 }

// Public functions accept requests only from the web (App Check, Fraud Defense) — SPEC §2.2.
// Not in the emulator: it can't verify App Check tokens of the demo project.
export const ENFORCE_APP_CHECK = process.env.FUNCTIONS_EMULATOR !== 'true'

// Functions that send e-mails need the SMTP password.
export const MAIL_OPTIONS = { ...BASE_OPTIONS, secrets: [SMTP_PASSWORD] }

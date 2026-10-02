import { SMTP_PASSWORD } from './mail.js'

// Options shared by all functions. Frankfurt, close to the users in Prague.
export const REGION = 'europe-west3'
export const BASE_OPTIONS = { region: REGION, maxInstances: 10 }

// Functions that send e-mails need the SMTP password.
export const MAIL_OPTIONS = { ...BASE_OPTIONS, secrets: [SMTP_PASSWORD] }

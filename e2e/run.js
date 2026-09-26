// End-to-end tests against the dev server and Firebase emulators.
// Usage: npm run test:e2e [-- public waitlist renewal login admin parent poster preview leader attendance events news clubhouse waitlistadmin]   (default: all)
// Needs `npm run emulators` and `npm run dev` running. Modifies emulator data:
// resets settings/*, clears the `waitlist` collection, and (login) replaces all
// accounts and `users` with the test accounts of `seed-users.js`, (admin, parent,
// poster, preview, leader, attendance, events, news) also `members` with the children of `seed-members.js`, and (parent, poster, preview, leader, attendance, events, news) leaders,
// contacts, events, news and meetings with `seed-activity.js`; clubhouse replaces the
// accounts too; waitlistadmin replaces the accounts and the whole `waitlist` with
// `seed-waitlist.js` and runs the annual reset.

import { assertRunning, createReport, launchBrowser, runScript, SCREENSHOTS } from './lib.js'

const SUITES = {
  public: () => import('./public.test.js'),
  waitlist: () => import('./waitlist.test.js'),
  renewal: () => import('./renewal.test.js'),
  login: () => import('./login.test.js'),
  admin: () => import('./admin.test.js'),
  parent: () => import('./parent.test.js'),
  poster: () => import('./poster.test.js'),
  preview: () => import('./preview.test.js'),
  leader: () => import('./leader.test.js'),
  attendance: () => import('./attendance.test.js'),
  events: () => import('./events.test.js'),
  news: () => import('./news.test.js'),
  clubhouse: () => import('./clubhouse.test.js'),
  waitlistadmin: () => import('./waitlistAdmin.test.js'),
}

const requested = process.argv.slice(2)
const unknown = requested.filter((name) => !SUITES[name])
if (unknown.length) {
  console.error(
    `Unknown suite(s): ${unknown.join(', ')}. Available: ${Object.keys(SUITES).join(', ')}`,
  )
  process.exit(2)
}

await assertRunning()
const report = createReport()
const browser = await launchBrowser()
try {
  for (const name of requested.length ? requested : Object.keys(SUITES)) {
    console.log(`\n=== ${name} ===`)
    runScript('seed-emulator.js') // known settings for every suite
    const { default: suite } = await SUITES[name]()
    await suite({ browser, check: report.check })
  }
} finally {
  await browser.close()
  runScript('seed-emulator.js')
}

const failed = report.finish()
console.log(`Screenshots: ${SCREENSHOTS}`)
process.exit(failed ? 1 : 0)

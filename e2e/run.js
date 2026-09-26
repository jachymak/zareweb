// End-to-end tests against the dev server and Firebase emulators.
// Usage: npm run test:e2e [-- public waitlist renewal]   (default: all)
// Needs `npm run emulators` and `npm run dev` running. Modifies emulator data:
// resets settings/* and clears the `waitlist` collection.

import { assertRunning, createReport, launchBrowser, runScript, SCREENSHOTS } from './lib.js'

const SUITES = {
  public: () => import('./public.test.js'),
  waitlist: () => import('./waitlist.test.js'),
  renewal: () => import('./renewal.test.js'),
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

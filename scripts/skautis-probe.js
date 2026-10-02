// Explores the skautIS web service with a login token, to learn the real
// data shapes (SPEC §4.8 skautIS). Talks to the production skautIS (the
// only app there is) — the output holds real personal data.
//
//   node --env-file-if-exists=.env scripts/skautis-probe.js
//     → prints the login URL; log in there, then copy the token from the URL
//       you come back to (…/vedouci/administrace#skautis=<token>)
//   node --env-file-if-exists=.env scripts/skautis-probe.js <token> [unitId]
//     → user, roles, units below the unit, members, functions, and parents +
//       contacts of the first few members; everything is also saved to
//       .skautis-probe.json

import { writeFile } from 'node:fs/promises'
import { SKAUTIS, skautisLoginUrl } from '../functions/src/shared/skautis.js'

const BASE = SKAUTIS.url
const APP_ID = SKAUTIS.appId
const [token, unitArg] = process.argv.slice(2)
const SAMPLE = 5

if (!token) {
  console.log(`Log in: ${skautisLoginUrl(BASE, APP_ID)}`)
  console.log('Then run again with the token from the URL you come back to (#skautis=…).')
  process.exit(0)
}

const xmlEscape = (v) =>
  String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

// Calls `service.asmx` → `method` with the `<method>Input` fields and returns
// the `<method>Output` records as plain objects (all values as strings).
async function call(service, method, input) {
  const fields = { ID_Login: token, ID_Application: APP_ID, ...input }
  const body = Object.entries(fields)
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => `<${k}>${xmlEscape(v)}</${k}>`)
    .join('')
  const param = method[0].toLowerCase() + method.slice(1) + 'Input'
  const envelope =
    '<?xml version="1.0" encoding="utf-8"?>' +
    '<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"><soap:Body>' +
    `<${method} xmlns="https://is.skaut.cz/"><${param}>${body}</${param}></${method}>` +
    '</soap:Body></soap:Envelope>'
  const res = await fetch(`${BASE}/JunakWebservice/${service}.asmx`, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/xml; charset=utf-8',
      SOAPAction: `"https://is.skaut.cz/${method}"`,
    },
    body: envelope,
  })
  const xml = await res.text()
  const fault = xml.match(/<faultstring>([\s\S]*?)<\/faultstring>/)
  if (fault) throw new Error(`${method}: ${fault[1]}`)
  if (!res.ok) throw new Error(`${method}: HTTP ${res.status}`)
  const records = [
    ...xml.matchAll(new RegExp(`<${method}Output>([\\s\\S]*?)</${method}Output>`, 'g')),
  ]
  // Lists come as `<method>Output` records, details as one `<method>Result`;
  // an empty list is an empty `<method>Result />`.
  const detail = xml.match(new RegExp(`<${method}Result>([\\s\\S]*?)</${method}Result>`))?.[1]
  const blocks = records.length ? records.map((m) => m[1]) : detail ? [detail] : []
  return blocks.map((block) =>
    Object.fromEntries([...block.matchAll(/<(\w+)>([^<]*)<\/\1>/g)].map(([, k, v]) => [k, v])),
  )
}

const out = {}
async function step(label, fn) {
  try {
    out[label] = await fn()
    console.log(`\n== ${label} (${out[label].length})`)
    console.table(out[label].slice(0, 15))
  } catch (e) {
    out[label] = { error: e.message }
    console.log(`\n== ${label}: ${e.message}`)
  }
  return Array.isArray(out[label]) ? out[label] : []
}

const [user] = await step('UserDetail', () => call('UserManagement', 'UserDetail', {}))
const roles = await step('UserRoleAll', () =>
  call('UserManagement', 'UserRoleAll', { ID_User: user?.ID, IsActive: true }),
)
const unitId = unitArg || roles.find((r) => r.ID_Unit)?.ID_Unit
console.log(`\nUnit: ${unitId}${unitArg ? '' : ' (from the first role; pass one as 2nd argument)'}`)

if (unitId) {
  await step('UnitDetail', () => call('OrganizationUnit', 'UnitDetail', { ID: unitId }))
  await step('UnitAll (children)', () =>
    call('OrganizationUnit', 'UnitAll', { ID_UnitParent: unitId }),
  )
  const members = await step('MembershipAll', () =>
    call('OrganizationUnit', 'MembershipAll', {
      ID_Unit: unitId,
      OnlyDirectMember: false,
      IsValid: true,
    }),
  )
  await step('FunctionAll', () =>
    call('OrganizationUnit', 'FunctionAll', { ID_Unit: unitId, IsValid: true }),
  )
  for (const m of members.slice(0, SAMPLE)) {
    await step(`PersonDetail ${m.ID_Person}`, () =>
      call('OrganizationUnit', 'PersonDetail', { ID: m.ID_Person }),
    )
    await step(`PersonParentAll ${m.ID_Person}`, () =>
      call('OrganizationUnit', 'PersonParentAll', { ID_Person: m.ID_Person }),
    )
    await step(`PersonContactAll ${m.ID_Person}`, () =>
      call('OrganizationUnit', 'PersonContactAll', { ID_Person: m.ID_Person }),
    )
  }
}

await writeFile('.skautis-probe.json', JSON.stringify(out, null, 2))
console.log('\nSaved to .skautis-probe.json')

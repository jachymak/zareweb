// Clubhouse devices — SPEC §4.5. First version: mock data kept in memory, no
// hardware. The page talks only to these functions, so the real devices can
// replace the mock without touching the components.
//
// State: { readings: { temperature, humidity }, mode: 'auto' | 'manual',
//   manualHours, manualUntil (Date | null), devices, schedule, log }
// devices: { climate: { on, target }, fans: { on }, dehumidifier: { on }, boiler: { on } }
// schedule / log items: { at: Date, until?: Date, text }, schedule soonest first,
// log newest first.

const MINUTE = 60 * 1000
const HOUR = 60 * MINUTE

// What the schedule sets right now (in the real system derived from meetings
// and the event calendar).
const AUTO_DEVICES = {
  climate: { on: true, target: 21 },
  fans: { on: false },
  dehumidifier: { on: false },
  boiler: { on: true },
}

function at(dayOffset, hours, minutes = 0) {
  const d = new Date()
  d.setDate(d.getDate() + dayOffset)
  d.setHours(hours, minutes, 0, 0)
  return d
}

function mockState() {
  const now = Date.now()
  // The coming Friday–Sunday (next week's on a Friday).
  const toFriday = (5 - new Date().getDay() + 7) % 7 || 7
  return {
    readings: { temperature: 20.4, humidity: 64 },
    mode: 'auto',
    manualHours: 4,
    manualUntil: null,
    devices: structuredClone(AUTO_DEVICES),
    schedule: [
      { at: at(1, 15), text: 'Klimatizace začne topit na 21 °C — schůzka je v 17:00.' },
      { at: at(1, 16, 30), text: 'Ventilátory a odvlhčovač vypnout, bojler nahřát na schůzku.' },
      { at: at(1, 20), text: 'Útlum 16 °C, ventilátory i odvlhčovač zapnout.' },
      {
        at: at(toFriday, 0),
        until: at(toFriday + 2, 0),
        text: 'Útlum 16 °C, sušíme a odvětráváme kvůli plísni.',
      },
    ],
    log: [
      {
        at: new Date(now - 40 * MINUTE),
        text: 'Automat vypnul ventilátory a odvlhčovač (schůzka).',
      },
      { at: new Date(now - 2 * HOUR), text: 'Automat zapnul klimatizaci na 21 °C.' },
      { at: new Date(now - 7 * HOUR), text: 'Bojler zapnut podle rozvrhu.' },
      { at: at(-5, 18, 20), text: 'Manuál vypršel, systém se vrátil na automat.' },
      { at: at(-5, 10, 5), text: 'Ručně: manuál na 8 h, klimatizace 18 °C (brigáda).' },
    ],
  }
}

let state = null
let expiryTimer = null
const listeners = new Set()

function emit() {
  listeners.forEach(({ callback, logLimit }) => {
    const copy = structuredClone(state)
    copy.log = copy.log.slice(0, logLimit)
    callback(copy)
  })
}

// Manual changes are logged in batches: whatever is changed within
// LOG_BATCH_GAP of the previous change joins one entry describing the
// difference against the state before the batch („Ručně: manuál na 4 h,
// klimatizace 23 °C, ventilátory zapnuté.“). A change undone within the batch
// drops out; a batch without any difference leaves no entry.
const LOG_BATCH_GAP = MINUTE
let batch = null // { entry, before, lastAt, manualHours }

const snapshot = () => structuredClone({ mode: state.mode, devices: state.devices })

function change(mutate, { manualHours } = {}) {
  const now = Date.now()
  if (!batch || now - batch.lastAt > LOG_BATCH_GAP) {
    batch = { entry: { at: new Date(now), text: '' }, before: snapshot() }
  }
  mutate()
  batch.lastAt = now
  if (manualHours) batch.manualHours = manualHours
  batch.entry.text = describe(batch)
  const i = state.log.indexOf(batch.entry)
  if (batch.entry.text && i < 0) state.log.unshift(batch.entry)
  if (!batch.entry.text && i >= 0) state.log.splice(i, 1)
  emit()
}

const DEVICE_LOG = {
  climate: (d) => `klimatizace ${d.on ? `${d.target} °C` : 'vypnutá'}`,
  fans: (d) => `ventilátory ${d.on ? 'zapnuté' : 'vypnuté'}`,
  dehumidifier: (d) => `odvlhčovač ${d.on ? 'zapnutý' : 'vypnutý'}`,
  boiler: (d) => `bojler ${d.on ? 'zapnutý' : 'vypnutý'}`,
}

function describe({ before, manualHours }) {
  const parts = []
  if (state.mode === 'auto') {
    if (before.mode === 'manual') parts.push('zpět na automat')
  } else {
    if (manualHours) {
      parts.push(`manuál ${before.mode === 'manual' ? 'prodloužen ' : ''}na ${manualHours} h`)
    }
    for (const [id, device] of Object.entries(state.devices)) {
      const was = before.devices[id]
      if (was.on !== device.on || (device.on && was.target !== device.target)) {
        parts.push(DEVICE_LOG[id](device))
      }
    }
  }
  return parts.length ? `Ručně: ${parts.join(', ')}.` : ''
}

function expire() {
  batch = null
  state.mode = 'auto'
  state.manualUntil = null
  state.devices = structuredClone(AUTO_DEVICES)
  state.log.unshift({ at: new Date(), text: 'Manuál vypršel, systém se vrátil na automat.' })
  emit()
}

// Calls `callback(state)` now and after every change; returns unsubscribe.
// The page shows only the newest `logLimit` log entries — the full log is
// for Administration.
export function subscribeClubhouse(callback, { logLimit = Infinity } = {}) {
  state ??= mockState()
  const listener = { callback, logLimit }
  listeners.add(listener)
  queueMicrotask(() => {
    if (!listeners.has(listener)) return
    const copy = structuredClone(state)
    copy.log = copy.log.slice(0, logLimit)
    callback(copy)
  })
  return () => listeners.delete(listener)
}

// Manual mode for `hours` from now. Entering it starts from what the schedule
// set; changing the length keeps the devices as they are.
export async function startManual(hours) {
  change(
    () => {
      clearTimeout(expiryTimer)
      state.mode = 'manual'
      state.manualHours = hours
      state.manualUntil = new Date(Date.now() + hours * HOUR)
      expiryTimer = setTimeout(expire, hours * HOUR)
    },
    { manualHours: hours },
  )
}

export async function stopManual() {
  change(() => {
    clearTimeout(expiryTimer)
    state.mode = 'auto'
    state.manualUntil = null
    state.devices = structuredClone(AUTO_DEVICES)
  })
}

// Changes a device in manual mode, e.g. setDevice('climate', { target: 22 }).
export async function setDevice(id, fields) {
  if (state.mode !== 'manual') throw new Error('Devices follow the schedule in automatic mode')
  change(() => Object.assign(state.devices[id], fields))
}

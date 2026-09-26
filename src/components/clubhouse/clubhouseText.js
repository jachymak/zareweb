// Czech texts and formatting of the clubhouse page (SPEC §4.5).

export const MANUAL_HOURS = [2, 4, 8, 12, 24]
export const TARGET_MIN = 8
export const TARGET_MAX = 26
export const HUMIDITY_LIMIT = 60 // % — higher is highlighted

export const DEVICES = [
  { id: 'fans', name: 'Ventilátory', detail: 'proti plísni, na schůzku se vypínají' },
  { id: 'dehumidifier', name: 'Odvlhčovač', detail: 'na schůzku se vypíná, jinak drží vlhkost' },
  { id: 'boiler', name: 'Bojler', detail: 'nahřívá tak, aby byla teplá voda na schůzku' },
]

// „topí“ while below the target (with a small tolerance).
export function climateState(climate, temperature) {
  if (!climate.on) return { text: 'vypnutá', active: false }
  if (temperature < climate.target - 0.3) return { text: 'topí', active: true }
  return { text: 'drží teplotu', active: false }
}

// „20,4 °C“
export const formatTemperature = (t) => `${String(t).replace('.', ',')} °C`

// „3 h 58 min“, „45 min“
export function formatRemaining(ms) {
  const minutes = Math.max(0, Math.ceil(ms / 60000))
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (!h) return `${m} min`
  return m ? `${h} h ${m} min` : `${h} h`
}

const WEEKDAYS = ['ne', 'po', 'út', 'st', 'čt', 'pá', 'so']

function dayLabel(date, now) {
  const day = new Date(date).setHours(0, 0, 0, 0)
  const today = new Date(now).setHours(0, 0, 0, 0)
  const diff = Math.round((day - today) / 86400000)
  if (diff === 0) return 'dnes'
  if (diff === 1) return 'zítra'
  if (diff === -1) return 'včera'
  return `${WEEKDAYS[date.getDay()]} ${date.getDate()}. ${date.getMonth() + 1}.`
}

// „dnes 16:32“, „so 14. 3. 10:05“; a range of days „pá–ne“.
export function formatWhen({ at, until }, now) {
  if (until) return `${WEEKDAYS[at.getDay()]}–${WEEKDAYS[until.getDay()]}`
  const time = `${at.getHours()}:${String(at.getMinutes()).padStart(2, '0')}`
  return `${dayLabel(at, now)} ${time}`
}

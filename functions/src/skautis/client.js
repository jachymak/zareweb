// A minimal client of the skautIS web service (SOAP; https://ws.skautis.cz).
// Every call runs with the rights of the login's active role.

export class SkautisError extends Error {
  constructor(method, message) {
    super(`${method}: ${message}`)
    this.method = method
    this.denied = /Nemáte oprávnění/i.test(message)
    this.loggedOut = /Neplatný login|Login.*(vypršel|neplatn)/i.test(message)
  }
}

const escapeXml = (v) =>
  String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const unescapeXml = (v) =>
  v
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&amp;/g, '&')

// Flat records: <Name>value</Name> children; empty / nil elements are left out.
const fieldsOf = (xml) =>
  Object.fromEntries(
    [...xml.matchAll(/<(\w+)>([^<]*)<\/\1>/g)].map(([, k, v]) => [k, unescapeXml(v)]),
  )

// Returns call(service, method, input) → records (list methods) or one record
// (detail methods), all values as strings. Throws SkautisError.
export function skautisClient({ url, appId, token }) {
  return async function call(service, method, input = {}) {
    const fields = { ID_Login: token, ID_Application: appId, ...input }
    const body = Object.entries(fields)
      .filter(([, v]) => v !== undefined && v !== null)
      .map(([k, v]) => `<${k}>${escapeXml(v)}</${k}>`)
      .join('')
    const param = method[0].toLowerCase() + method.slice(1) + 'Input'
    const res = await fetch(`${url}/JunakWebservice/${service}.asmx`, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        SOAPAction: `"https://is.skaut.cz/${method}"`,
      },
      body:
        '<?xml version="1.0" encoding="utf-8"?>' +
        '<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"><soap:Body>' +
        `<${method} xmlns="https://is.skaut.cz/"><${param}>${body}</${param}></${method}>` +
        '</soap:Body></soap:Envelope>',
    })
    const xml = await res.text()
    const fault = xml.match(/<faultstring>([\s\S]*?)<\/faultstring>/)?.[1]
    if (fault) {
      // "Server was unable to process request. ---> <the reason>\n<details>"
      const reason = unescapeXml(fault).split('--->').at(-1).trim().split('\n')[0]
      throw new SkautisError(method, reason)
    }
    if (!res.ok) throw new SkautisError(method, `HTTP ${res.status}`)

    const records = [
      ...xml.matchAll(new RegExp(`<${method}Output>([\\s\\S]*?)</${method}Output>`, 'g')),
    ]
    if (records.length) return records.map((m) => fieldsOf(m[1]))
    const result = xml.match(new RegExp(`<${method}Result>([\\s\\S]*?)</${method}Result>`))?.[1]
    // A detail method returns one record; an empty list is an empty result.
    return result && !result.includes(`<${method}Output`) ? fieldsOf(result) : []
  }
}

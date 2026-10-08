// Reads the first sheet of an XLSX file in the browser into rows of cell
// strings — for the skautIS export (SPEC §4.8 skautIS), without a library:
// an XLSX is a ZIP of XML files, unpacked with DecompressionStream.

const EOCD = 0x06054b50 // end of central directory
const CENTRAL = 0x02014b50
const LOCAL = 0x04034b50

// { name: () => Promise<string> } of the files in the ZIP.
function zipEntries(buffer) {
  const view = new DataView(buffer)
  let end = buffer.byteLength - 22
  while (end >= 0 && view.getUint32(end, true) !== EOCD) end--
  if (end < 0) throw new Error('not a zip')
  const count = view.getUint16(end + 10, true)
  let at = view.getUint32(end + 16, true)
  const decoder = new TextDecoder()
  const entries = {}
  for (let i = 0; i < count; i++) {
    if (view.getUint32(at, true) !== CENTRAL) throw new Error('broken zip')
    const method = view.getUint16(at + 10, true)
    const size = view.getUint32(at + 20, true)
    const nameLength = view.getUint16(at + 28, true)
    const extraLength = view.getUint16(at + 30, true)
    const commentLength = view.getUint16(at + 32, true)
    const offset = view.getUint32(at + 42, true)
    const name = decoder.decode(new Uint8Array(buffer, at + 46, nameLength))
    entries[name] = async () => {
      if (view.getUint32(offset, true) !== LOCAL) throw new Error('broken zip')
      const start =
        offset + 30 + view.getUint16(offset + 26, true) + view.getUint16(offset + 28, true)
      const data = new Uint8Array(buffer, start, size)
      if (method === 0) return decoder.decode(data)
      if (method !== 8) throw new Error('unsupported zip')
      const stream = new Blob([data]).stream().pipeThrough(new DecompressionStream('deflate-raw'))
      return new Response(stream).text()
    }
    at += 46 + nameLength + extraLength + commentLength
  }
  return entries
}

const parseXml = (text) => new DOMParser().parseFromString(text, 'application/xml')
const textOf = (el) => [...el.getElementsByTagName('t')].map((t) => t.textContent).join('')

// „AB12“ → 27
function columnIndex(ref) {
  let n = 0
  for (const ch of ref.replace(/\d+$/, '')) n = n * 26 + (ch.charCodeAt(0) - 64)
  return n - 1
}

// File → rows (arrays of strings) of the first sheet. Throws on a file that
// isn't an XLSX.
export async function readXlsx(file) {
  const entries = zipEntries(await file.arrayBuffer())
  const sheetName =
    'xl/worksheets/sheet1.xml' in entries
      ? 'xl/worksheets/sheet1.xml'
      : Object.keys(entries)
          .filter((n) => /^xl\/worksheets\/[^/]+\.xml$/.test(n))
          .sort()[0]
  if (!sheetName) throw new Error('no sheet')
  const shared = entries['xl/sharedStrings.xml']
    ? [...parseXml(await entries['xl/sharedStrings.xml']()).getElementsByTagName('si')].map(textOf)
    : []
  const sheet = parseXml(await entries[sheetName]())
  return [...sheet.getElementsByTagName('row')].map((row) => {
    const cells = []
    for (const c of row.getElementsByTagName('c')) {
      const type = c.getAttribute('t')
      const v = c.getElementsByTagName('v')[0]?.textContent ?? ''
      const text = type === 's' ? (shared[Number(v)] ?? '') : type === 'inlineStr' ? textOf(c) : v
      const ref = c.getAttribute('r')
      cells[ref ? columnIndex(ref) : cells.length] = text
    }
    return Array.from(cells, (x) => x ?? '')
  })
}

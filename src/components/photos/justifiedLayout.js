// Justified layout like Google Photos: rows filling the full width, photos
// keeping their aspect ratio, every row close to the target height. A row
// ends where its height gets closest to the target (with or without the last
// photo); the last row keeps the target height instead of being stretched.

// Aspect ratio, clamped so a panorama or a sliver can't break the layout.
export const aspect = (photo) => Math.min(Math.max(photo.width / photo.height || 1, 0.3), 4)

// Target row height for the container width (px).
export const targetRowHeight = (width) => (width < 600 ? 132 : width < 1000 ? 190 : 230)

// → [{ height, justified, items: [{ photo, width }] }]
export function justifiedRows(photos, containerWidth, targetHeight, gap) {
  const rows = []
  const heightOf = (list) =>
    (containerWidth - gap * (list.length - 1)) / list.reduce((sum, p) => sum + aspect(p), 0)
  const close = (list, height, justified = true) =>
    rows.push({
      height,
      justified,
      items: list.map((photo) => ({ photo, width: aspect(photo) * height })),
    })

  let row = []
  for (const photo of photos) {
    row.push(photo)
    const height = heightOf(row)
    if (height > targetHeight) continue
    if (row.length > 1) {
      // Without the last photo the row is taller; take whichever is closer.
      const shorter = row.slice(0, -1)
      const shorterHeight = heightOf(shorter)
      if (shorterHeight - targetHeight < targetHeight - height) {
        close(shorter, shorterHeight)
        row = [photo]
        if (heightOf(row) <= targetHeight) {
          close(row, heightOf(row))
          row = []
        }
        continue
      }
    }
    close(row, height)
    row = []
  }
  if (row.length) close(row, Math.min(targetHeight, heightOf(row)), false)
  return rows
}

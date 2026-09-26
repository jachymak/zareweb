// Converts Firestore snapshots to plain objects with their document id.

export function fromDoc(snap) {
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

export function fromQuery(snap) {
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

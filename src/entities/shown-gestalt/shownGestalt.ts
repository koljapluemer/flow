import { db, type ShownGestaltRow } from '../../db/db'

export async function getShownGestalts(): Promise<Map<string, ShownGestaltRow>> {
  const rows = await db.shownGestalts.toArray()
  return new Map(rows.map((row) => [row.id, row]))
}

// Records that the gestalts were shown without a grade; the first showing is kept.
export async function markShown(ids: string[], now = new Date()): Promise<void> {
  const existing = await db.shownGestalts.bulkGet(ids)
  const fresh = ids.filter((_, index) => !existing[index]).map((id) => ({ id, shownAt: now }))
  await db.shownGestalts.bulkPut(fresh)
}

import { createEmptyCard, fsrs, type Grade } from 'ts-fsrs'
import { db, type GestaltCardRow } from '../../db/db'

const scheduler = fsrs()

export async function getGestaltCards(): Promise<Map<string, GestaltCardRow>> {
  const rows = await db.gestaltCards.toArray()
  return new Map(rows.map((row) => [row.id, row]))
}

// Gestalts without a card are introduced by their first review.
export async function reviewGestaltCards(ids: string[], rating: Grade, now = new Date()): Promise<GestaltCardRow[]> {
  const existing = await db.gestaltCards.bulkGet(ids)
  const reviewed = ids.map((id, index) => ({
    ...scheduler.next(existing[index] ?? createEmptyCard(now), now, rating).card,
    id
  }))
  await db.gestaltCards.bulkPut(reviewed)
  return reviewed
}

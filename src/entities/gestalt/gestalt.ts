import { db, type GestaltKind, type GestaltRow } from '../../db/db'

export function gestaltId(kind: GestaltKind, contentId: string): string {
  return `${kind}:${contentId}`
}

export async function getGestaltsInTopics(topicIds: string[]): Promise<Map<string, GestaltRow>> {
  const rows = await db.gestalts.where('topicIds').anyOf(topicIds).distinct().toArray()
  return new Map(rows.map((row) => [row.id, row]))
}

function withoutTopics(row: GestaltRow, topicIds: string[]): string[] {
  return row.topicIds.filter((id) => !topicIds.includes(id))
}

// Stores the complete gestalts of the given topics: `rows` carry their
// membership among `topicIds`, memberships in other topics are kept, and
// gestalts no longer in a topic lose its id.
export async function putTopicGestalts(topicIds: string[], rows: GestaltRow[]): Promise<void> {
  await db.transaction('rw', db.gestalts, async () => {
    const incomingIds = new Set(rows.map((row) => row.id))
    const previous = await db.gestalts.where('topicIds').anyOf(topicIds).distinct().toArray()
    const dropped = previous
      .filter((row) => !incomingIds.has(row.id))
      .map((row) => ({ ...row, topicIds: withoutTopics(row, topicIds) }))
    const existing = await db.gestalts.bulkGet(rows.map((row) => row.id))
    const merged = rows.map((row, index) => {
      const kept = existing[index] ? withoutTopics(existing[index], topicIds) : []
      return { ...row, topicIds: [...new Set([...kept, ...row.topicIds])] }
    })
    await db.gestalts.bulkPut([...dropped, ...merged])
  })
}

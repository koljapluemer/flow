import { db, type SentenceRow } from '../../db/db'

export async function getSentencesInTopics(topicIds: string[]): Promise<Map<string, SentenceRow>> {
  const rows = await db.sentences.where('topicIds').anyOf(topicIds).distinct().toArray()
  return new Map(rows.map((row) => [row.id, row]))
}

function withoutTopics(row: SentenceRow, topicIds: string[]): string[] {
  return row.topicIds.filter((id) => !topicIds.includes(id))
}

// Stores the complete content of the given topics: `rows` carry their
// membership among `topicIds`, memberships in other topics are kept, and
// sentences no longer in a topic lose its id.
export async function putTopicSentences(topicIds: string[], rows: SentenceRow[]): Promise<void> {
  await db.transaction('rw', db.sentences, async () => {
    const incomingIds = new Set(rows.map((row) => row.id))
    const previous = await db.sentences.where('topicIds').anyOf(topicIds).distinct().toArray()
    const dropped = previous
      .filter((row) => !incomingIds.has(row.id))
      .map((row) => ({ ...row, topicIds: withoutTopics(row, topicIds) }))
    const existing = await db.sentences.bulkGet(rows.map((row) => row.id))
    const merged = rows.map((row, index) => {
      const kept = existing[index] ? withoutTopics(existing[index], topicIds) : []
      return { ...row, topicIds: [...new Set([...kept, ...row.topicIds])] }
    })
    await db.sentences.bulkPut([...dropped, ...merged])
  })
}

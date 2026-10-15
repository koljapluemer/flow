import { db, type VocabRow } from '../../db/db'

export async function getVocab(): Promise<Map<string, VocabRow>> {
  const rows = await db.vocab.toArray()
  return new Map(rows.map((row) => [row.id, row]))
}

export async function putVocab(rows: VocabRow[]): Promise<void> {
  await db.vocab.bulkPut(rows)
}

import { db, type VocabRow } from '../../db/db'

// Compact format rendered by cms/render.py.
export type VocabTuple = [id: string, word: string, translation: string]

export function decodeVocab(tuples: VocabTuple[]): VocabRow[] {
  return tuples.map(([id, word, translation]) => ({ id, word, translation }))
}

export async function getVocab(): Promise<Map<string, VocabRow>> {
  const rows = await db.vocab.toArray()
  return new Map(rows.map((row) => [row.id, row]))
}

export async function putVocab(rows: VocabRow[]): Promise<void> {
  await db.vocab.bulkPut(rows)
}

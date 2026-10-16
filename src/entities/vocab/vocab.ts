import { decodeCredits, type CreditTuple } from '../../dumb/credit'
import { db, type VocabRow } from '../../db/db'

// Compact format rendered by cms/render.py.
export type VocabTuple = [id: string, word: string, translation: string, credits: CreditTuple[]]

export function decodeVocab(tuples: VocabTuple[]): VocabRow[] {
  return tuples.map(([id, word, translation, credits]) => ({ id, word, translation, credits: decodeCredits(credits) }))
}

export async function getVocab(): Promise<Map<string, VocabRow>> {
  const rows = await db.vocab.toArray()
  return new Map(rows.map((row) => [row.id, row]))
}

export async function putVocab(rows: VocabRow[]): Promise<void> {
  await db.vocab.bulkPut(rows)
}

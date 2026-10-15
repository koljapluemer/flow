import { db, type SentenceRow } from '../../db/db'

// Compact format rendered by cms/render.py; vocab is referenced by index into the topic's vocab list.
export type SentenceTuple = [id: string, text: string, translation: string, vocabIndexes: number[]]

export function decodeSentences(tuples: SentenceTuple[], vocabIds: string[]): SentenceRow[] {
  return tuples.map(([id, text, translation, vocabIndexes]) => ({
    id,
    text,
    translation,
    vocabIds: vocabIndexes.map((index) => vocabIds[index])
  }))
}

export async function getSentences(): Promise<Map<string, SentenceRow>> {
  const rows = await db.sentences.toArray()
  return new Map(rows.map((row) => [row.id, row]))
}

export async function putSentences(rows: SentenceRow[]): Promise<void> {
  await db.sentences.bulkPut(rows)
}

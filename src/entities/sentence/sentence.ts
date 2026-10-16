import { decodeCredits, type CreditTuple } from '../../dumb/credit'
import { db, type SentenceMode, type SentenceRow } from '../../db/db'

// Compact format rendered by cms/render.py; vocab is referenced by index into the topic's vocab list.
// `modes` are all modes the topic's sets give the sentence.
export type SentenceTuple = [
  id: string,
  text: string,
  translation: string,
  vocabIndexes: number[],
  modes: SentenceMode[],
  credits: CreditTuple[]
]

export function decodeSentences(tuples: SentenceTuple[], vocabIds: string[]): SentenceRow[] {
  return tuples.map(([id, text, translation, vocabIndexes, , credits]) => ({
    id,
    text,
    translation,
    vocabIds: vocabIndexes.map((index) => vocabIds[index]),
    credits: decodeCredits(credits)
  }))
}

export function decodeSentenceModes(tuples: SentenceTuple[]): Map<string, SentenceMode[]> {
  return new Map(tuples.map(([id, , , , modes]) => [id, modes]))
}

// The sentences with the given ids that contain the vocab.
export function sentencesWithVocab(vocabId: string, sentences: Map<string, SentenceRow>, ids: Set<string>): SentenceRow[] {
  return [...ids]
    .map((id) => sentences.get(id))
    .filter((sentence): sentence is SentenceRow => sentence?.vocabIds.includes(vocabId) ?? false)
}

export async function getSentences(): Promise<Map<string, SentenceRow>> {
  const rows = await db.sentences.toArray()
  return new Map(rows.map((row) => [row.id, row]))
}

export async function putSentences(rows: SentenceRow[]): Promise<void> {
  await db.sentences.bulkPut(rows)
}

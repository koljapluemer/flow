import type { SentenceRow, VocabRow } from '@/db/db'
import { fetchJson } from '@/dumb/fetchJson'
import { putTopicSentences } from '@/entities/sentence/sentence'
import { putVocab } from '@/entities/vocab/vocab'

// Compact format rendered by cms/render.py; sentences reference vocab by index.
type TopicFile = {
  v: [id: string, word: string, translation: string][]
  s: [id: string, text: string, translation: string, vocabIndexes: number[]][]
}

function fetchTopic(topicId: string): Promise<TopicFile> {
  return fetchJson<TopicFile>(`/data/topics/${topicId}.json`)
}

function decodeVocab(file: TopicFile): VocabRow[] {
  return file.v.map(([id, word, translation]) => ({ id, word, translation }))
}

function decodeSentences(file: TopicFile, topicId: string): SentenceRow[] {
  return file.s.map(([id, text, translation, vocabIndexes]) => ({
    id,
    text,
    translation,
    vocabIds: vocabIndexes.map((index) => file.v[index][0]),
    topicIds: [topicId]
  }))
}

// A sentence shared by several topics is stored once, listing all of them.
function mergeSentences(rows: SentenceRow[]): SentenceRow[] {
  const merged = new Map<string, SentenceRow>()
  for (const row of rows) {
    const existing = merged.get(row.id)
    merged.set(row.id, { ...row, topicIds: [...(existing?.topicIds ?? []), ...row.topicIds] })
  }
  return [...merged.values()]
}

// Copies the current content of the given topics into Dexie.
export async function syncTopics(topicIds: string[]): Promise<void> {
  const files = await Promise.all(topicIds.map(fetchTopic))
  await putVocab(files.flatMap(decodeVocab))
  await putTopicSentences(topicIds, mergeSentences(files.flatMap((file, index) => decodeSentences(file, topicIds[index]))))
}

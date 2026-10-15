import { fetchJson } from '@/dumb/fetchJson'
import { logger } from '@/dumb/log'
import { putTopicGestalts } from '@/entities/gestalt/gestalt'
import { decodeSentences, putSentences, type SentenceTuple } from '@/entities/sentence/sentence'
import { decodeVideos, putSnippets, type VideoTuple } from '@/entities/snippet/snippet'
import { decodeVocab, putVocab, type VocabTuple } from '@/entities/vocab/vocab'
import { mergeGestalts, topicGestalts, type TopicContent } from './topicGestalts'

const log = logger('sync')

// Compact format rendered by cms/render.py.
type TopicFile = { v: VocabTuple[]; s: SentenceTuple[]; y: VideoTuple[] }

async function fetchTopic(topicId: string): Promise<TopicContent> {
  const file = await fetchJson<TopicFile>(`/data/topics/${topicId}.json`)
  const vocabIds = file.v.map(([id]) => id)
  const content = {
    vocab: decodeVocab(file.v),
    sentences: decodeSentences(file.s, vocabIds),
    snippets: decodeVideos(file.y, vocabIds)
  }
  log('%s: %d vocab, %d sentences, %d snippets', topicId, file.v.length, file.s.length, content.snippets.length)
  return content
}

// Copies the current content of the given topics into Dexie.
export async function syncTopics(topicIds: string[]): Promise<void> {
  const contents = await Promise.all(topicIds.map(fetchTopic))
  await putVocab(contents.flatMap((content) => content.vocab))
  await putSentences(contents.flatMap((content) => content.sentences))
  await putSnippets(contents.flatMap((content) => content.snippets))
  const gestalts = contents.flatMap((content, index) => topicGestalts(content, topicIds[index]))
  await putTopicGestalts(topicIds, mergeGestalts(gestalts))
}

import { fetchJson } from '@/dumb/fetchJson'
import { logger } from '@/dumb/log'
import { putTopicGestalts } from '@/entities/gestalt/gestalt'
import { decodeSentenceModes, decodeSentences, putSentences, type SentenceTuple } from '@/entities/sentence/sentence'
import { decodeSnippets, putSnippets, type VideoSnippetsTuple } from '@/entities/snippet/snippet'
import { getSelectedTopicIds, putTopicSentences } from '@/entities/topic/topic'
import { decodeVideos, putVideos, type VideoTuple } from '@/entities/video/video'
import { decodeVocab, putVocab, type VocabTuple } from '@/entities/vocab/vocab'
import { mergeGestalts, topicGestalts, type TopicContent } from './topicGestalts'

const log = logger('sync')

// Compact format rendered by cms/render.py.
type TopicFile = { v: VocabTuple[]; s: SentenceTuple[]; y: VideoTuple[]; n: VideoSnippetsTuple[] }

async function fetchTopic(topicId: string): Promise<TopicContent> {
  const file = await fetchJson<TopicFile>(`/data/topics/${topicId}.json`)
  const vocabIds = file.v.map(([id]) => id)
  const content = {
    vocab: decodeVocab(file.v),
    sentences: decodeSentences(file.s, vocabIds),
    sentenceModes: decodeSentenceModes(file.s),
    videos: decodeVideos(file.y),
    snippets: decodeSnippets(file.n, vocabIds)
  }
  log(
    '%s: %d vocab, %d sentences, %d videos, %d snippets',
    topicId,
    file.v.length,
    file.s.length,
    file.y.length,
    content.snippets.length
  )
  return content
}

// Copies the current content of the given topics into Dexie.
export async function syncTopics(topicIds: string[]): Promise<void> {
  const contents = await Promise.all(topicIds.map(fetchTopic))
  await putVocab(contents.flatMap((content) => content.vocab))
  await putSentences(contents.flatMap((content) => content.sentences))
  await putVideos(contents.flatMap((content) => content.videos))
  await putSnippets(contents.flatMap((content) => content.snippets))
  await putTopicSentences(
    contents.map((content, index) => ({ id: topicIds[index], sentenceIds: content.sentences.map((row) => row.id) }))
  )
  const gestalts = contents.flatMap((content, index) => topicGestalts(content, topicIds[index]))
  await putTopicGestalts(topicIds, mergeGestalts(gestalts))
}

// Syncs the selected topics and returns their ids. Keeps using stored content when offline.
export async function syncSelectedTopics(): Promise<string[]> {
  const topicIds = await getSelectedTopicIds()
  await syncTopics(topicIds).catch((error) => console.warn('Topic sync failed', error))
  return topicIds
}

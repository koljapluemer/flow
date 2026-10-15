import { onMounted, ref } from 'vue'
import { Rating, type Grade } from 'ts-fsrs'
import type { SentenceRow, VocabCardRow } from '@/db/db'
import { pickRandom } from '@/dumb/pickRandom'
import { getSentencesInTopics } from '@/entities/sentence/sentence'
import { getSelectedTopicIds } from '@/entities/topic/topic'
import { getVocab } from '@/entities/vocab/vocab'
import { createSentenceCard, getSentenceCards, rateSentenceCard } from '@/entities/sentence-card/sentenceCard'
import {
  createVocabCard,
  getVocabCards,
  rateVocabCard,
  setVocabCardsDueNow
} from '@/entities/vocab-card/vocabCard'
import { syncTopics } from '../content/syncTopics'
import { buildDuePool, type DueItem } from './duePool'
import { pickNewSentence } from './newSentencePicker'
import { resolveSentenceCandidate, resolveVocabCandidate, type Candidate } from './resolveCandidate'

export type EmptyReason = 'noTopics' | 'done'

// Never show the same item back-to-back, also across page visits.
let lastShownId: string | null = null

async function introduceSentence(sentence: SentenceRow, vocabCards: Map<string, VocabCardRow>, now: Date) {
  await createSentenceCard(sentence.id, now)
  const newVocabIds = sentence.vocabIds.filter((id) => !vocabCards.has(id))
  await Promise.all(newVocabIds.map((id) => createVocabCard(id, sentence.id, now)))
}

async function loadDuePool(topicIds: string[], now: Date): Promise<{ pool: DueItem[]; introduced: boolean }> {
  const [sentences, vocabCards, sentenceCards] = await Promise.all([
    getSentencesInTopics(topicIds),
    getVocabCards(),
    getSentenceCards()
  ])
  const pool = buildDuePool(sentences, vocabCards, sentenceCards, now).filter((item) => item.id !== lastShownId)
  if (pool.length > 0) return { pool, introduced: false }

  const sentence = pickNewSentence(sentences, sentenceCards, vocabCards)
  if (!sentence) return { pool, introduced: false }
  await introduceSentence(sentence, vocabCards, now)
  return { pool, introduced: true }
}

// Keeps practicing on stored content when offline.
async function syncSelectedTopics(): Promise<string[]> {
  const topicIds = await getSelectedTopicIds()
  await syncTopics(topicIds).catch((error) => console.warn('Topic sync failed', error))
  return topicIds
}

export function usePracticeQueue() {
  const loading = ref(true)
  const emptyReason = ref<EmptyReason | null>(null)
  const candidate = ref<Candidate | null>(null)
  let topicIds: string[] = []
  let current: DueItem | null = null
  let currentVocabIds: string[] = []

  async function pickNext(): Promise<DueItem | undefined> {
    const now = new Date()
    const first = await loadDuePool(topicIds, now)
    if (!first.introduced) return pickRandom(first.pool)
    return pickRandom((await loadDuePool(topicIds, now)).pool)
  }

  async function loadNext(): Promise<void> {
    loading.value = true
    const next = await pickNext()
    const [sentences, vocab] = await Promise.all([getSentencesInTopics(topicIds), getVocab()])

    current = next ?? null
    lastShownId = next?.id ?? null
    currentVocabIds = next?.kind === 'sentence' ? (sentences.get(next.id)?.vocabIds ?? []) : []
    emptyReason.value = next ? null : topicIds.length === 0 ? 'noTopics' : 'done'
    if (!next) candidate.value = null
    else if (next.kind === 'vocab') candidate.value = resolveVocabCandidate(next, sentences, vocab)
    else candidate.value = resolveSentenceCandidate(next, sentences, vocab)
    loading.value = false
  }

  async function rate(rating: Grade): Promise<void> {
    if (!current) return
    if (current.kind === 'vocab') {
      await rateVocabCard(current.card, rating)
    } else {
      await rateSentenceCard(current.card, rating)
      const failed = rating === Rating.Again || rating === Rating.Hard
      if (current.card.lastAnswerCorrect && failed) await setVocabCardsDueNow(currentVocabIds)
    }
    await loadNext()
  }

  onMounted(async () => {
    topicIds = await syncSelectedTopics()
    await loadNext()
  })

  return { loading, emptyReason, candidate, rate }
}

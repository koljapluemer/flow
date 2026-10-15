import type { SentenceRow, VocabRow } from '@/db/db'
import { pickRandomMany } from '@/dumb/pickRandom'
import type { SentenceDueItem, VocabDueItem } from './duePool'

export type Example = { text: string; translation: string }
export type VocabEntry = { word: string; translation: string }

export type VocabCandidate = {
  kind: 'vocab'
  word: string
  translation: string
  frontExamples: Example[]
  frontShowTranslations: boolean
  backExamples: Example[]
}

export type SentenceCandidate = {
  kind: 'sentence'
  text: string
  translation: string
  vocab: VocabEntry[]
  showVocabOnFront: boolean
}

export type Candidate = VocabCandidate | SentenceCandidate

const EXAMPLE_COUNT_LOW = 2
const EXAMPLE_COUNT_HIGH = 3

function toExample(sentence: SentenceRow): Example {
  return { text: sentence.text, translation: sentence.translation }
}

export function resolveVocabCandidate(
  item: VocabDueItem,
  sentences: Map<string, SentenceRow>,
  vocab: Map<string, VocabRow>
): VocabCandidate {
  const { level, initialSentence } = item.card
  const others = [...sentences.values()]
    .filter((sentence) => sentence.id !== initialSentence && sentence.vocabIds.includes(item.id))
    .map(toExample)
  const initial = sentences.get(initialSentence)
  const entry = vocab.get(item.id)

  const candidate: VocabCandidate = {
    kind: 'vocab',
    word: entry?.word ?? '',
    translation: entry?.translation ?? '',
    frontExamples: [],
    frontShowTranslations: level < 3,
    backExamples: []
  }

  if (level === 1) {
    const initialExamples = initial ? [toExample(initial)] : []
    candidate.frontExamples = [...initialExamples, ...pickRandomMany(others, EXAMPLE_COUNT_LOW)]
  } else if (level < 4) {
    candidate.frontExamples = pickRandomMany(others, EXAMPLE_COUNT_HIGH)
  } else {
    candidate.backExamples = pickRandomMany(others, EXAMPLE_COUNT_HIGH)
  }

  return candidate
}

export function resolveSentenceCandidate(
  item: SentenceDueItem,
  sentences: Map<string, SentenceRow>,
  vocab: Map<string, VocabRow>
): SentenceCandidate {
  const sentence = sentences.get(item.id)
  return {
    kind: 'sentence',
    text: sentence?.text ?? '',
    translation: sentence?.translation ?? '',
    vocab: (sentence?.vocabIds ?? []).map((id) => ({
      word: vocab.get(id)?.word ?? '',
      translation: vocab.get(id)?.translation ?? ''
    })),
    showVocabOnFront: !item.card.lastAnswerCorrect
  }
}

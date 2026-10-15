import { State } from 'ts-fsrs'
import type { GestaltCardRow, SentenceRow } from '@/db/db'
import { pickRandomMany } from '@/dumb/pickRandom'
import { makeExercise, type ExerciseContext, type ExerciseType } from '@/entities/exercise/exercise'
import { gestaltId } from '@/entities/gestalt/gestalt'
import VocabPractice from './VocabPractice.vue'

export type Example = { text: string; translation: string }

export type VocabView = {
  word: string
  translation: string
  frontExamples: Example[]
  frontShowTranslations: boolean
  backExamples: Example[]
}

type Variant = 'translated' | 'examples' | 'bare'

const TYPE = 'vocab-practice'
const EXAMPLE_COUNT = 3
const BARE_MIN_STABILITY_DAYS = 7

// Translations while new or (re)learning, then examples on the front, then on the back once stable.
function fitsVariant(variant: Variant, card: GestaltCardRow | undefined): boolean {
  if (!card || card.state !== State.Review) return variant === 'translated'
  if (variant === 'translated') return false
  return (card.stability >= BARE_MIN_STABILITY_DAYS) === (variant === 'bare')
}

function toExample(sentence: SentenceRow): Example {
  return { text: sentence.text, translation: sentence.translation }
}

// Examples are the selected sentences containing the vocab.
function examplesOf(vocabId: string, context: ExerciseContext): Example[] {
  const sentences = [...context.sentences.values()].filter(
    (sentence) => context.gestalts.has(gestaltId('sentence', sentence.id)) && sentence.vocabIds.includes(vocabId)
  )
  return pickRandomMany(sentences, EXAMPLE_COUNT).map(toExample)
}

export const vocabPractice: ExerciseType<VocabView> = {
  type: TYPE,
  gestaltKind: 'vocab',
  requiresOnline: false,
  variants: (gestalt) => (['translated', 'examples', 'bare'] as const).map((variant) => makeExercise(TYPE, variant, gestalt)),
  fit: (exercise, card) => (fitsVariant(exercise.variant as Variant, card) ? 1 : 0),
  resolve: (exercise, context) => {
    const entry = context.vocab.get(exercise.contentId)
    const examples = examplesOf(exercise.contentId, context)
    const bare = exercise.variant === 'bare'
    return {
      word: entry?.word ?? '',
      translation: entry?.translation ?? '',
      frontExamples: bare ? [] : examples,
      frontShowTranslations: exercise.variant === 'translated',
      backExamples: bare ? examples : []
    }
  },
  component: VocabPractice
}

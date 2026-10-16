import type { SentenceRow } from '@/db/db'
import type { Example } from '@/dumb/example'
import { pickRandomMany } from '@/dumb/pickRandom'
import {
  makeExercise,
  type ExerciseContext,
  type ExerciseType,
  type GestaltProgress
} from '@/entities/exercise/exercise'
import { sentencesWithVocab } from '@/entities/sentence/sentence'
import VocabPrepare from './VocabPrepare.vue'

// Prepares vocab of a guess-once sentence: memorize or understand it once, then recall it until remembered.
export type PrepareVariant = 'memorize' | 'understand' | 'recall'

export type PrepareView = { variant: PrepareVariant; word: string; translation: string; examples: Example[] }

const TYPE = 'vocab-prepare'
const EXAMPLE_COUNT = 3
const MIN_UNDERSTAND_EXAMPLES = 2

function isNew({ card, shown }: GestaltProgress): boolean {
  return !card && !shown
}

function selectedSentences(vocabId: string, context: ExerciseContext): SentenceRow[] {
  return sentencesWithVocab(vocabId, context.sentences, context.exampleSentenceIds)
}

function fitsVariant(variant: PrepareVariant, progress: GestaltProgress, vocabId: string, context: ExerciseContext) {
  if (variant === 'recall') return !isNew(progress)
  if (variant === 'memorize') return isNew(progress)
  return isNew(progress) && selectedSentences(vocabId, context).length >= MIN_UNDERSTAND_EXAMPLES
}

function toExample(sentence: SentenceRow): Example {
  return { text: sentence.text, translation: sentence.translation, credits: sentence.credits }
}

export const vocabPrepare: ExerciseType<PrepareView> = {
  type: TYPE,
  gestaltKind: 'vocab',
  style: 'guess-once',
  requiresOnline: false,
  variants: (gestalt) =>
    (['memorize', 'understand', 'recall'] as const).map((variant) => makeExercise(TYPE, variant, gestalt)),
  fit: (exercise, progress, context) =>
    fitsVariant(exercise.variant as PrepareVariant, progress, exercise.contentId, context) ? 1 : 0,
  resolve: (exercise, context) => {
    const entry = context.vocab.get(exercise.contentId)
    const examples = exercise.variant === 'understand' ? selectedSentences(exercise.contentId, context) : []
    return {
      variant: exercise.variant as PrepareVariant,
      word: entry?.word ?? '',
      translation: entry?.translation ?? '',
      examples: pickRandomMany(examples, EXAMPLE_COUNT).map(toExample)
    }
  },
  component: VocabPrepare
}

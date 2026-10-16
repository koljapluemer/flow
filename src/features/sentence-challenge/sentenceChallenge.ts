import type { Credit } from '@/dumb/credit'
import { makeExercise, type ExerciseType } from '@/entities/exercise/exercise'
import SentenceChallenge from './SentenceChallenge.vue'

export type ChallengeView = { text: string; translation: string; credits: Credit[] }

const TYPE = 'sentence-challenge'

// A guess-once sentence, shown a single time once its vocab is prepared.
export const sentenceChallenge: ExerciseType<ChallengeView> = {
  type: TYPE,
  gestaltKind: 'challenge',
  style: 'any',
  requiresOnline: false,
  variants: (gestalt) => [makeExercise(TYPE, 'once', gestalt)],
  fit: () => 1,
  resolve: (exercise, context) => {
    const sentence = context.sentences.get(exercise.contentId)
    return { text: sentence?.text ?? '', translation: sentence?.translation ?? '', credits: sentence?.credits ?? [] }
  },
  component: SentenceChallenge
}

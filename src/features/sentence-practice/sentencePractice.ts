import { State } from 'ts-fsrs'
import { makeExercise, type ExerciseType } from '@/entities/exercise/exercise'
import SentencePractice from './SentencePractice.vue'

export type VocabEntry = { word: string; translation: string }

export type SentenceView = {
  text: string
  translation: string
  vocab: VocabEntry[]
  showVocabOnFront: boolean
}

const TYPE = 'sentence-practice'

export const sentencePractice: ExerciseType<SentenceView> = {
  type: TYPE,
  gestaltKind: 'sentence',
  requiresOnline: false,
  variants: (gestalt) => (['with-vocab', 'plain'] as const).map((variant) => makeExercise(TYPE, variant, gestalt)),
  // Vocab is shown on the front while the sentence is new or being (re)learned.
  fit: (exercise, card) => {
    const learning = !card || card.state !== State.Review
    return learning === (exercise.variant === 'with-vocab') ? 1 : 0
  },
  resolve: (exercise, context) => {
    const sentence = context.sentences.get(exercise.contentId)
    return {
      text: sentence?.text ?? '',
      translation: sentence?.translation ?? '',
      vocab: (sentence?.vocabIds ?? []).map((id) => ({
        word: context.vocab.get(id)?.word ?? '',
        translation: context.vocab.get(id)?.translation ?? ''
      })),
      showVocabOnFront: exercise.variant === 'with-vocab'
    }
  },
  component: SentencePractice
}

import { makeExercise, type ExerciseType } from '@/entities/exercise/exercise'
import SnippetWatch from './SnippetWatch.vue'

export type SnippetView = { youtubeId: string; start: number; end: number }

const TYPE = 'snippet-watch'

export const snippetWatch: ExerciseType<SnippetView> = {
  type: TYPE,
  gestaltKind: 'snippet',
  requiresOnline: true,
  variants: (gestalt) => [makeExercise(TYPE, 'watch', gestalt)],
  fit: () => 1,
  resolve: (exercise, context) => {
    const snippet = context.snippets.get(exercise.contentId)
    return { youtubeId: snippet?.youtubeId ?? '', start: snippet?.start ?? 0, end: snippet?.end ?? 0 }
  },
  component: SnippetWatch
}

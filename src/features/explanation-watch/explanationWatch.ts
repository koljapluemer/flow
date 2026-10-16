import type { VideoPlatform } from '@/dumb/video/videoPlatforms'
import { makeExercise, type ExerciseType } from '@/entities/exercise/exercise'
import ExplanationWatch from './ExplanationWatch.vue'

export type ExplanationView = { platform: VideoPlatform; videoId: string }

const TYPE = 'explanation-watch'

export const explanationWatch: ExerciseType<ExplanationView> = {
  type: TYPE,
  gestaltKind: 'explanation',
  requiresOnline: true,
  variants: (gestalt) => [makeExercise(TYPE, 'watch', gestalt)],
  fit: () => 1,
  resolve: (exercise, context) => {
    const video = context.videos.get(exercise.contentId)
    return { platform: video?.platform ?? 'youtube', videoId: video?.platformId ?? '' }
  },
  component: ExplanationWatch
}

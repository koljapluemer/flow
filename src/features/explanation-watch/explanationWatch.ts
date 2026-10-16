import type { Credit } from '@/dumb/credit'
import type { VideoPlatform } from '@/dumb/video/videoPlatforms'
import { makeExercise, type ExerciseType } from '@/entities/exercise/exercise'
import ExplanationWatch from './ExplanationWatch.vue'

export type ExplanationView = { platform: VideoPlatform; videoId: string; credits: Credit[] }

const TYPE = 'explanation-watch'

export const explanationWatch: ExerciseType<ExplanationView> = {
  type: TYPE,
  gestaltKind: 'explanation',
  style: 'any',
  requiresOnline: true,
  variants: (gestalt) => [makeExercise(TYPE, 'watch', gestalt)],
  fit: () => 1,
  resolve: (exercise, context) => {
    const video = context.videos.get(exercise.contentId)
    return { platform: video?.platform ?? 'youtube', videoId: video?.platformId ?? '', credits: video?.credits ?? [] }
  },
  component: ExplanationWatch
}

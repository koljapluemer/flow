import type { Credit } from '@/dumb/credit'
import type { VideoPlatform } from '@/dumb/video/videoPlatforms'
import { makeExercise, type ExerciseType } from '@/entities/exercise/exercise'
import SnippetWatch from './SnippetWatch.vue'

export type SnippetView = { platform: VideoPlatform; videoId: string; start: number; end: number; credits: Credit[] }

const TYPE = 'snippet-watch'

export const snippetWatch: ExerciseType<SnippetView> = {
  type: TYPE,
  gestaltKind: 'snippet',
  style: 'any',
  requiresOnline: true,
  variants: (gestalt) => [makeExercise(TYPE, 'watch', gestalt)],
  fit: () => 1,
  resolve: (exercise, context) => {
    const snippet = context.snippets.get(exercise.contentId)
    const video = snippet && context.videos.get(snippet.videoId)
    return {
      platform: video?.platform ?? 'youtube',
      videoId: video?.platformId ?? '',
      start: snippet?.start ?? 0,
      end: snippet?.end ?? 0,
      credits: video?.credits ?? []
    }
  },
  component: SnippetWatch
}

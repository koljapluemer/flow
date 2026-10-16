import { createTiktokPlayer } from './tiktokPlayer'
import type { CreateVideoPlayer } from './videoPlayer'
import { createYoutubePlayer } from './youtubePlayer'

// Supported platforms. To add one, add its player here and to data/repo/schema/video.schema.json.
export const videoPlatforms = {
  youtube: { createPlayer: createYoutubePlayer, frameClass: 'aspect-video w-full' },
  tiktok: { createPlayer: createTiktokPlayer, frameClass: 'aspect-[9/16] h-[70vh] max-w-full' }
} satisfies Record<string, { createPlayer: CreateVideoPlayer; frameClass: string }>

export type VideoPlatform = keyof typeof videoPlatforms

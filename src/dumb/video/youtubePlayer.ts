import { loadYoutubeApi } from './youtubeApi'
import type { CreateVideoPlayer } from './videoPlayer'

export const createYoutubePlayer: CreateVideoPlayer = async (target, videoId, events) => {
  const api = await loadYoutubeApi()
  const player = new api.Player(target, {
    host: 'https://www.youtube-nocookie.com',
    videoId,
    width: '100%',
    height: '100%',
    playerVars: { playsinline: 1, rel: 0 },
    events: {
      onReady: events.onReady,
      onError: (event) => events.onError(`Video unavailable (${event.data}).`)
    }
  })
  return {
    play: () => player.playVideo(),
    pause: () => player.pauseVideo(),
    seekTo: (seconds) => player.seekTo(seconds, true),
    currentTime: () => player.getCurrentTime(),
    destroy: () => player.destroy()
  }
}

// What a clip needs from a platform's embedded player.
export type VideoPlayer = {
  play: () => void
  pause: () => void
  seekTo: (seconds: number) => void
  currentTime: () => number
  destroy: () => void
}

export type VideoPlayerEvents = { onReady: () => void; onError: (message: string) => void }

// Embeds the video into `target` (which it may replace).
export type CreateVideoPlayer = (target: HTMLElement, videoId: string, events: VideoPlayerEvents) => Promise<VideoPlayer>

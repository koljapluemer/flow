// Minimal typing of the YouTube IFrame Player API, loaded once on demand.
export type YoutubePlayer = {
  seekTo: (seconds: number, allowSeekAhead: boolean) => void
  playVideo: () => void
  pauseVideo: () => void
  getCurrentTime: () => number
  destroy: () => void
}

type PlayerOptions = {
  host: string
  videoId: string
  width: string
  height: string
  playerVars: Record<string, number>
  events: { onReady: () => void; onError: (event: { data: number }) => void }
}

type YoutubeApi = { Player: new (element: HTMLElement, options: PlayerOptions) => YoutubePlayer }

declare global {
  interface Window {
    YT?: YoutubeApi
    onYouTubeIframeAPIReady?: () => void
  }
}

let loading: Promise<YoutubeApi> | null = null

export function loadYoutubeApi(): Promise<YoutubeApi> {
  loading ??= new Promise((resolve, reject) => {
    window.onYouTubeIframeAPIReady = () => resolve(window.YT as YoutubeApi)
    const script = document.createElement('script')
    script.src = 'https://www.youtube.com/iframe_api'
    script.onerror = () => {
      loading = null
      script.remove()
      reject(new Error('Loading the YouTube player failed'))
    }
    document.head.append(script)
  })
  return loading
}

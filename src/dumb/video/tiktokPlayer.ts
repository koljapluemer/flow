import type { CreateVideoPlayer } from './videoPlayer'

// TikTok embed player, controlled via postMessage:
// https://developers.tiktok.com/doc/embed-player
const ORIGIN = 'https://www.tiktok.com'
const PARAMS = 'rel=0&music_info=0&description=0'
const AUTOPLAY_BLOCKED = 3002

type PlayerMessage =
  | { type: 'onPlayerReady' }
  | { type: 'onCurrentTime'; value: { currentTime: number } }
  | { type: 'onPlayerError'; value: { errorCode: number; errorType: string } }

function isPlayerMessage(data: unknown): data is PlayerMessage {
  return typeof data === 'object' && data !== null && 'x-tiktok-player' in data
}

export const createTiktokPlayer: CreateVideoPlayer = async (target, videoId, events) => {
  const iframe = document.createElement('iframe')
  iframe.src = `${ORIGIN}/player/v1/${videoId}?${PARAMS}`
  iframe.allow = 'autoplay; fullscreen'
  iframe.className = 'size-full'
  target.append(iframe)

  let time = 0
  function onMessage(event: MessageEvent): void {
    if (event.source !== iframe.contentWindow || !isPlayerMessage(event.data)) return
    const message = event.data
    if (message.type === 'onPlayerReady') events.onReady()
    if (message.type === 'onCurrentTime') time = message.value.currentTime
    if (message.type === 'onPlayerError' && message.value.errorCode !== AUTOPLAY_BLOCKED) {
      events.onError(`Video unavailable (${message.value.errorType}).`)
    }
  }
  window.addEventListener('message', onMessage)

  function send(type: string, value?: number): void {
    iframe.contentWindow?.postMessage({ type, value, 'x-tiktok-player': true }, ORIGIN)
  }
  return {
    play: () => send('play'),
    pause: () => send('pause'),
    seekTo: (seconds) => send('seekTo', seconds),
    currentTime: () => time,
    destroy: () => {
      window.removeEventListener('message', onMessage)
      iframe.remove()
    }
  }
}

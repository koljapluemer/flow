<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, useTemplateRef } from 'vue'
import { RotateCcw } from 'lucide-vue-next'
import { loadYoutubeApi, type YoutubePlayer } from './youtubeApi'

// Plays one clip of a YouTube video, from `start` to `end` (seconds).
const props = defineProps<{ videoId: string; start: number; end: number }>()

const POLL_MS = 100

const target = useTemplateRef<HTMLElement>('target')
const error = ref('')
let player: YoutubePlayer | null = null
let playing = false
let poll: ReturnType<typeof setInterval> | undefined

function play(): void {
  player?.seekTo(props.start, true)
  player?.playVideo()
  playing = true
}

// The API's own end time is imprecise, so the clip is paused here.
function pauseAtEnd(): void {
  if (!player || !playing || player.getCurrentTime() < props.end) return
  player.pauseVideo()
  playing = false
}

onMounted(async () => {
  try {
    const api = await loadYoutubeApi()
    if (!target.value) return
    player = new api.Player(target.value, {
      host: 'https://www.youtube-nocookie.com',
      videoId: props.videoId,
      width: '100%',
      height: '100%',
      playerVars: { start: Math.floor(props.start), playsinline: 1, rel: 0 },
      events: {
        onReady: play,
        onError: (event) => (error.value = `Video unavailable (${event.data}).`)
      }
    })
    poll = setInterval(pauseAtEnd, POLL_MS)
  } catch (caught) {
    error.value = caught instanceof Error ? caught.message : String(caught)
  }
})

onBeforeUnmount(() => {
  clearInterval(poll)
  player?.destroy()
})
</script>

<template>
  <div
    v-if="error"
    role="alert"
    class="alert alert-error w-full"
  >
    {{ error }}
  </div>
  <div class="aspect-video w-full">
    <div ref="target" />
  </div>
  <button
    type="button"
    class="btn btn-ghost"
    @click="play"
  >
    <RotateCcw class="size-4" />
    Replay
  </button>
</template>

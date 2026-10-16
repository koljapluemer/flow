<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, useTemplateRef } from 'vue'
import { RotateCcw } from 'lucide-vue-next'
import { videoPlatforms, type VideoPlatform } from './videoPlatforms'
import type { VideoPlayer } from './videoPlayer'

// Plays a video from `start` to `end` (seconds), by default the whole video.
const props = withDefaults(defineProps<{ platform: VideoPlatform; videoId: string; start?: number; end?: number }>(), {
  start: 0,
  end: Infinity
})

const POLL_MS = 100

const target = useTemplateRef<HTMLElement>('target')
const error = ref('')
let player: VideoPlayer | null = null
let playing = false
let poll: ReturnType<typeof setInterval> | undefined

function play(): void {
  player?.seekTo(props.start)
  player?.play()
  playing = true
}

// The players' own end times are imprecise, so the clip is paused here.
function pauseAtEnd(): void {
  if (!player || !playing || player.currentTime() < props.end) return
  player.pause()
  playing = false
}

onMounted(async () => {
  try {
    if (!target.value) return
    const events = { onReady: play, onError: (message: string) => (error.value = message) }
    player = await videoPlatforms[props.platform].createPlayer(target.value, props.videoId, events)
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
  <div :class="videoPlatforms[platform].frameClass">
    <div
      ref="target"
      class="size-full"
    />
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

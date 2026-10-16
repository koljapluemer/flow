<script setup lang="ts">
import { Rating, type Grade } from 'ts-fsrs'
import VideoClip from '@/dumb/video/VideoClip.vue'
import type { SnippetView } from './snippetWatch'

defineProps<{ view: SnippetView }>()
const emit = defineEmits<{ done: [rating: Grade] }>()
</script>

<template>
  <VideoClip
    :platform="view.platform"
    :video-id="view.videoId"
    :start="view.start"
    :end="view.end"
  />
  <button
    type="button"
    class="btn btn-primary"
    @click="emit('done', Rating.Good)"
  >
    Next
  </button>
</template>

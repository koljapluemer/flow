<script setup lang="ts">
import { Rating, type Grade } from 'ts-fsrs'
import YoutubeClip from '@/dumb/YoutubeClip.vue'
import type { SnippetView } from './snippetWatch'

defineProps<{ view: SnippetView }>()
const emit = defineEmits<{ done: [rating: Grade] }>()
</script>

<template>
  <YoutubeClip
    :video-id="view.youtubeId"
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

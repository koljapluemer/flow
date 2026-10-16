<script setup lang="ts">
import type { ExplanationAnswer } from '@/db/db'
import CreditList from '@/dumb/CreditList.vue'
import VideoClip from '@/dumb/video/VideoClip.vue'
import type { ExplanationView } from './explanationWatch'

defineProps<{ view: ExplanationView }>()
const emit = defineEmits<{ done: [answer: ExplanationAnswer] }>()

const answers: { label: string; value: ExplanationAnswer }[] = [
  { label: 'Not interested', value: 'notInterested' },
  { label: 'Already knew this', value: 'knewIt' },
  { label: 'Got it', value: 'gotIt' },
  { label: 'Show again later', value: 'later' }
]
</script>

<template>
  <VideoClip
    :platform="view.platform"
    :video-id="view.videoId"
  />
  <CreditList :credits="view.credits" />
  <div class="grid w-full grid-cols-2 gap-2 sm:grid-cols-4">
    <button
      v-for="answer in answers"
      :key="answer.value"
      type="button"
      class="btn"
      @click="emit('done', answer.value)"
    >
      {{ answer.label }}
    </button>
  </div>
</template>

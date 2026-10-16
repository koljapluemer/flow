<script setup lang="ts">
import { useCountdown } from '@/dumb/useCountdown'
import type { PrepareView } from './vocabPrepare'

const DURATION_MS = 5000

defineProps<{ view: PrepareView }>()
const emit = defineEmits<{ done: [] }>()

const { progress, stop } = useCountdown(DURATION_MS, () => emit('done'))

function next(): void {
  stop()
  emit('done')
}
</script>

<template>
  <span class="badge badge-primary badge-outline">Memorize this</span>
  <p
    class="text-3xl font-semibold"
    dir="auto"
  >
    {{ view.word }}
  </p>
  <div class="divider my-0" />
  <p class="text-xl opacity-70">
    {{ view.translation }}
  </p>
  <progress
    class="progress progress-primary w-full"
    :value="1 - progress"
    max="1"
  />
  <button
    type="button"
    class="btn btn-primary"
    @click="next"
  >
    Next
  </button>
</template>

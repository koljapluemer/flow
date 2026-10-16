<script setup lang="ts">
import type { Grade } from 'ts-fsrs'
import FlashcardShell from '@/dumb/FlashcardShell.vue'
import type { PrepareView } from './vocabPrepare'

defineProps<{ view: PrepareView }>()
const emit = defineEmits<{ done: [rating: Grade] }>()
</script>

<template>
  <FlashcardShell @rate="emit('done', $event)">
    <template #front>
      <p
        class="text-3xl font-semibold"
        dir="auto"
      >
        {{ view.word }}
      </p>
    </template>
    <template #back>
      <p class="text-xl opacity-70">
        {{ view.translation }}
      </p>
    </template>
  </FlashcardShell>
</template>

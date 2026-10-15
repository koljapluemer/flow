<script setup lang="ts">
import type { Grade } from 'ts-fsrs'
import FlashcardShell from '@/dumb/FlashcardShell.vue'
import type { SentenceView } from './sentencePractice'
import VocabList from './VocabList.vue'

defineProps<{ view: SentenceView }>()
const emit = defineEmits<{ done: [rating: Grade] }>()
</script>

<template>
  <FlashcardShell @rate="emit('done', $event)">
    <template #front>
      <p
        class="text-2xl font-semibold"
        dir="auto"
      >
        {{ view.text }}
      </p>
      <VocabList
        v-if="view.showVocabOnFront"
        :vocab="view.vocab"
      />
    </template>
    <template #back>
      <p class="text-xl opacity-70">
        {{ view.translation }}
      </p>
      <VocabList
        v-if="!view.showVocabOnFront"
        :vocab="view.vocab"
      />
    </template>
  </FlashcardShell>
</template>

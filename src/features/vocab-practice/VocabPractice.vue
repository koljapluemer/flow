<script setup lang="ts">
import type { Grade } from 'ts-fsrs'
import FlashcardShell from '@/dumb/FlashcardShell.vue'
import ExampleList from '@/dumb/ExampleList.vue'
import type { VocabView } from './vocabPractice'

defineProps<{ view: VocabView }>()
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
      <ExampleList
        :examples="view.frontExamples"
        :show-translations="view.frontShowTranslations"
      />
    </template>
    <template #back>
      <p class="text-xl opacity-70">
        {{ view.translation }}
      </p>
      <ExampleList
        :examples="view.backExamples"
        :show-translations="true"
      />
    </template>
  </FlashcardShell>
</template>

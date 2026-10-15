<script setup lang="ts">
import type { VocabEntry } from './sentencePractice'

defineProps<{ vocab: VocabEntry[] }>()
</script>

<template>
  <ul class="flex w-full flex-col gap-1 text-sm">
    <li
      v-for="entry in vocab"
      :key="entry.word"
      class="flex justify-between gap-2"
    >
      <span dir="auto">{{ entry.word }}</span>
      <span class="opacity-70">{{ entry.translation }}</span>
    </li>
  </ul>
</template>

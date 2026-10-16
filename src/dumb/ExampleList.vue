<script setup lang="ts">
import CreditList from './CreditList.vue'
import type { Example } from './example'

defineProps<{ examples: Example[]; showTranslations: boolean }>()
</script>

<template>
  <div
    v-for="example in examples"
    :key="example.text"
    class="flex flex-col gap-0.5"
  >
    <p dir="auto">
      {{ example.text }}
    </p>
    <p
      v-if="showTranslations"
      class="text-sm opacity-70"
    >
      {{ example.translation }}
    </p>
    <CreditList :credits="example.credits" />
  </div>
</template>

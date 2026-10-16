<script setup lang="ts">
import type { Credit } from './credit'

defineProps<{ credits: Credit[] }>()
</script>

<template>
  <ul
    v-if="credits.length"
    class="text-xs opacity-60"
  >
    <li
      v-for="credit in credits"
      :key="`${credit.source}:${credit.author}`"
    >
      <a
        v-if="credit.sourceUrl"
        :href="credit.sourceUrl"
        class="link"
        target="_blank"
        rel="noopener"
      >{{ credit.source }}</a>
      <span v-else>{{ credit.source }}</span>
      · {{ credit.author }} ·
      <a
        v-if="credit.licenseUrl"
        :href="credit.licenseUrl"
        class="link"
        target="_blank"
        rel="noopener"
      >{{ credit.license }}</a>
      <span v-else>{{ credit.license }}</span>
    </li>
  </ul>
</template>

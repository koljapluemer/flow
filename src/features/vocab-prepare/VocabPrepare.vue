<script setup lang="ts">
import type { Grade } from 'ts-fsrs'
import MemorizeVocab from './MemorizeVocab.vue'
import RecallVocab from './RecallVocab.vue'
import UnderstandVocab from './UnderstandVocab.vue'
import type { PrepareView } from './vocabPrepare'

defineProps<{ view: PrepareView }>()
const emit = defineEmits<{ done: [result: Grade | 'shown'] }>()
</script>

<template>
  <MemorizeVocab
    v-if="view.variant === 'memorize'"
    :view="view"
    @done="emit('done', 'shown')"
  />
  <UnderstandVocab
    v-else-if="view.variant === 'understand'"
    :view="view"
    @done="emit('done', 'shown')"
  />
  <RecallVocab
    v-else
    :view="view"
    @done="emit('done', $event)"
  />
</template>

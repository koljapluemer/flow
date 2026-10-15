<script setup lang="ts">
import { ref } from 'vue'
import type { Grade } from 'ts-fsrs'
import RatingButtons from './RatingButtons.vue'

const emit = defineEmits<{ rate: [rating: Grade] }>()

const revealed = ref(false)
</script>

<template>
  <span class="badge badge-primary badge-outline">What does this mean?</span>
  <slot name="front" />
  <template v-if="revealed">
    <div class="divider my-0" />
    <slot name="back" />
    <RatingButtons @rate="emit('rate', $event)" />
  </template>
  <button
    v-else
    type="button"
    class="btn"
    @click="revealed = true"
  >
    Show answer
  </button>
</template>

<script setup lang="ts">
import { Rating, type Grade } from 'ts-fsrs'

const emit = defineEmits<{ rate: [rating: Grade] }>()

const ratings: { label: string; value: Grade }[] = [
  { label: 'Again', value: Rating.Again },
  { label: 'Hard', value: Rating.Hard },
  { label: 'Good', value: Rating.Good },
  { label: 'Easy', value: Rating.Easy }
]
</script>

<template>
  <div class="grid w-full grid-cols-2 gap-2 sm:grid-cols-4">
    <button
      v-for="rating in ratings"
      :key="rating.value"
      type="button"
      class="btn"
      @click="emit('rate', rating.value)"
    >
      {{ rating.label }}
    </button>
  </div>
</template>

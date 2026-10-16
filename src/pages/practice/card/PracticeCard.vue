<script setup lang="ts">
import type { ExerciseResult } from '@/entities/exercise/exercise'
import type { CurrentExercise } from '../queue/usePracticeQueue'

defineProps<{ current: CurrentExercise }>()
const emit = defineEmits<{ done: [result: ExerciseResult] }>()
</script>

<template>
  <div class="card w-full shadow-xl">
    <div class="card-body items-center gap-4 text-center">
      <component
        :is="current.type.component"
        :key="current.key"
        :view="current.view"
        @done="emit('done', $event)"
      />
    </div>
  </div>
</template>

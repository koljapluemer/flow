<script setup lang="ts">
import { ref, shallowRef, watch } from 'vue'
import type { ExerciseResult } from '@/entities/exercise/exercise'
import { loadPreview, type Preview } from './loadPreview'

// Dev only: shows one exercise without the queue. Results are shown, not stored.
const props = defineProps<{ id: string }>()

const preview = shallowRef<Preview | string | null>(null)
const result = ref<ExerciseResult | null>(null)

watch(
  () => props.id,
  async (id) => {
    preview.value = null
    result.value = null
    preview.value = await loadPreview(id)
  },
  { immediate: true }
)
</script>

<template>
  <div class="mx-auto flex w-full max-w-xl flex-col items-center gap-4 px-4 py-8">
    <code class="text-sm break-all opacity-70">{{ id }}</code>
    <span
      v-if="!preview"
      class="loading loading-spinner loading-lg"
    />
    <div
      v-else-if="typeof preview === 'string'"
      role="alert"
      class="alert alert-error w-full"
    >
      {{ preview }}
    </div>
    <div
      v-else
      class="card w-full shadow-xl"
    >
      <div class="card-body items-center gap-4 text-center">
        <component
          :is="preview.type.component"
          :key="id"
          :view="preview.view"
          @done="result = $event"
        />
      </div>
    </div>
    <div
      v-if="result !== null"
      role="status"
      class="alert w-full"
    >
      Done: {{ result }}
    </div>
  </div>
</template>

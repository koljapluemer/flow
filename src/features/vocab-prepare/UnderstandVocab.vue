<script setup lang="ts">
import { ref } from 'vue'
import ExampleList from '@/dumb/ExampleList.vue'
import type { PrepareView } from './vocabPrepare'

defineProps<{ view: PrepareView }>()
const emit = defineEmits<{ done: [] }>()

const revealed = ref(false)
</script>

<template>
  <span class="badge badge-primary badge-outline">What do you think this means?</span>
  <p
    class="text-3xl font-semibold"
    dir="auto"
  >
    {{ view.word }}
  </p>
  <template v-if="revealed">
    <div class="divider my-0" />
    <p class="text-xl opacity-70">
      {{ view.translation }}
    </p>
    <button
      type="button"
      class="btn btn-primary"
      @click="emit('done')"
    >
      Next
    </button>
  </template>
  <template v-else>
    <ExampleList
      :examples="view.examples"
      :show-translations="true"
    />
    <button
      type="button"
      class="btn"
      @click="revealed = true"
    >
      Show answer
    </button>
  </template>
</template>

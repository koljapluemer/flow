<script setup lang="ts">
import { ref } from 'vue'
import CreditList from '@/dumb/CreditList.vue'
import { useCountdown } from '@/dumb/useCountdown'
import type { ChallengeView } from './sentenceChallenge'

// Revealing is possible only after a moment of trying to understand.
const REVEAL_DELAY_MS = 2000

defineProps<{ view: ChallengeView }>()
const emit = defineEmits<{ done: [result: 'shown'] }>()

const revealed = ref(false)
const { done: canReveal, progress } = useCountdown(REVEAL_DELAY_MS)
</script>

<template>
  <span class="badge badge-primary badge-outline">Can you understand this?</span>
  <p
    class="text-2xl font-semibold"
    dir="auto"
  >
    {{ view.text }}
  </p>
  <template v-if="revealed">
    <div class="divider my-0" />
    <p class="text-xl opacity-70">
      {{ view.translation }}
    </p>
    <CreditList :credits="view.credits" />
    <button
      type="button"
      class="btn btn-primary"
      @click="emit('done', 'shown')"
    >
      Next
    </button>
  </template>
  <button
    v-else
    type="button"
    class="btn"
    :disabled="!canReveal"
    @click="revealed = true"
  >
    <span
      v-if="!canReveal"
      class="radial-progress"
      role="progressbar"
      :aria-valuenow="Math.round(progress * 100)"
      :style="{ '--value': progress * 100, '--size': '1.25rem', '--thickness': '2px' }"
    />
    Show answer
  </button>
</template>

import { computed, onBeforeUnmount, ref } from 'vue'

const TICK_MS = 100

// Counts down from `durationMs` once mounted; `progress` goes from 0 to 1. Calls `onDone` at the end.
export function useCountdown(durationMs: number, onDone?: () => void) {
  const remainingMs = ref(durationMs)
  const timer = setInterval(() => {
    remainingMs.value = Math.max(0, remainingMs.value - TICK_MS)
    if (remainingMs.value > 0) return
    clearInterval(timer)
    onDone?.()
  }, TICK_MS)

  function stop(): void {
    clearInterval(timer)
  }

  onBeforeUnmount(stop)

  return {
    done: computed(() => remainingMs.value === 0),
    progress: computed(() => 1 - remainingMs.value / durationMs),
    stop
  }
}

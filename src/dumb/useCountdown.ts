import { computed, onBeforeUnmount, ref } from 'vue'

// Counts down from `durationMs` once mounted; `progress` goes from 0 to 1. Calls `onDone` at the end.
export function useCountdown(durationMs: number, onDone?: () => void) {
  const remainingMs = ref(durationMs)
  const startedAt = performance.now()
  let frame = requestAnimationFrame(update)

  function update(now: number): void {
    remainingMs.value = Math.max(0, durationMs - (now - startedAt))
    if (remainingMs.value === 0) {
      onDone?.()
      return
    }
    frame = requestAnimationFrame(update)
  }

  function stop(): void {
    cancelAnimationFrame(frame)
  }

  onBeforeUnmount(stop)

  return {
    done: computed(() => remainingMs.value === 0),
    progress: computed(() => 1 - remainingMs.value / durationMs),
    stop
  }
}

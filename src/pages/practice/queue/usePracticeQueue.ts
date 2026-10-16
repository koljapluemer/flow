import { onMounted, ref, shallowRef } from 'vue'
import { logger } from '@/dumb/log'
import { useOnline } from '@/dumb/useOnline'
import type { Exercise, ExerciseResult, ExerciseType } from '@/entities/exercise/exercise'
import { syncSelectedTopics } from '../content/syncTopics'
import { fillIntroduceGoals, settleGoals } from './goals/goalLifecycle'
import { pickExercise } from './pickExercise'
import { pickGestalt, type GestaltPick } from './pickGestalt'
import { loadQueueState, type QueueState } from './queueState'
import { recordResult } from './rate'

export type EmptyReason = 'noTopics' | 'done'
export type CurrentExercise = { key: number; type: ExerciseType; exercise: Exercise; view: unknown }

const log = logger('queue')

// Never show the same gestalt back-to-back, also across page visits.
let lastShownId: string | null = null

async function nextGestalt(state: QueueState): Promise<GestaltPick | null> {
  const [introduced] = await settleGoals(state)
  if (introduced) {
    log('→ %s (goal done)', introduced)
    return { id: introduced, branch: 'goal done' }
  }
  await fillIntroduceGoals(state)
  return pickGestalt(state, lastShownId)
}

export function usePracticeQueue() {
  const online = useOnline()
  const loading = ref(true)
  const emptyReason = ref<EmptyReason | null>(null)
  const current = shallowRef<CurrentExercise | null>(null)
  let topicIds: string[] = []
  let state: QueueState | null = null
  let step = 0

  async function loadNext(): Promise<void> {
    loading.value = true
    state = await loadQueueState(topicIds, online.value)
    const pick = await nextGestalt(state)
    const gestalt = pick ? state.context.gestalts.get(pick.id) : undefined
    const chosen = gestalt ? pickExercise(gestalt, state) : null

    lastShownId = pick?.id ?? null
    emptyReason.value = chosen ? null : topicIds.length === 0 ? 'noTopics' : 'done'
    current.value = chosen && { key: ++step, ...chosen, view: chosen.type.resolve(chosen.exercise, state.context) }
    loading.value = false
  }

  async function done(result: ExerciseResult): Promise<void> {
    if (!current.value || !state) return
    await recordResult(current.value.exercise, result, state)
    await loadNext()
  }

  onMounted(async () => {
    topicIds = await syncSelectedTopics()
    await loadNext()
  })

  return { loading, emptyReason, current, done }
}

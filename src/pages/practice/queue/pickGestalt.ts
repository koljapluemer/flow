import { pickRandom } from '@/dumb/pickRandom'
import { logger } from '@/dumb/log'
import { wantedGestalts } from './goals/goalLifecycle'
import { isDue, type QueueState } from './queueState'
import { P_CHASE } from './tuning'

const log = logger('queue')

export type GestaltPick = { id: string; branch: string }

function chase(state: QueueState, lastShownId: string | null): GestaltPick | null {
  const goals = [...state.goals].sort(() => Math.random() - 0.5)
  for (const goal of goals) {
    const id = pickRandom(wantedGestalts(goal, state).filter((wanted) => wanted !== lastShownId))
    if (id) return { id, branch: `chase ${goal.id}` }
  }
  return null
}

// Chases a goal by chance, otherwise picks a random due gestalt. Falls back
// to chasing when nothing is due. Never picks the gestalt shown last.
export function pickGestalt(state: QueueState, lastShownId: string | null): GestaltPick | null {
  const dueIds = [...state.context.gestalts.keys()].filter(
    (id) => id !== lastShownId && isDue(state, id)
  )
  const wantsChase = Math.random() < P_CHASE
  const due = pickRandom(dueIds)
  const pick =
    (wantsChase ? chase(state, lastShownId) : null) ?? (due ? { id: due, branch: 'due' } : chase(state, lastShownId))
  log('goals %o, %d due → %s (%s)', state.goals.map((goal) => goal.id), dueIds.length, pick?.id, pick?.branch ?? 'empty')
  return pick
}

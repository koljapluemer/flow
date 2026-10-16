import type { GoalRow } from '@/db/db'
import { pickRandom } from '@/dumb/pickRandom'
import { logger } from '@/dumb/log'
import type { ExerciseStyle } from '@/entities/exercise/exercise'
import { wantedGestalts } from './goals/goalLifecycle'
import { isDue, type QueueState } from './queueState'
import { P_CHASE } from './tuning'

const log = logger('queue')

// `style` says in which flow the gestalt is practiced.
export type GestaltPick = { id: string; branch: string; style: ExerciseStyle }

// Gestalts chased for a challenge are prepared guess-once style.
function styleFor(goal: GoalRow): ExerciseStyle {
  return goal.kind === 'challenge' ? 'guess-once' : 'flashcard'
}

function chase(state: QueueState, lastShownId: string | null): GestaltPick | null {
  const goals = [...state.goals].sort(() => Math.random() - 0.5)
  for (const goal of goals) {
    const id = pickRandom(wantedGestalts(goal, state).filter((wanted) => wanted !== lastShownId))
    if (id) return { id, branch: `chase ${goal.id}`, style: styleFor(goal) }
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
    (wantsChase ? chase(state, lastShownId) : null) ??
    (due ? { id: due, branch: 'due', style: 'flashcard' as const } : chase(state, lastShownId))
  log('goals %o, %d due → %s (%s)', state.goals.map((goal) => goal.id), dueIds.length, pick?.id, pick?.branch ?? 'empty')
  return pick
}

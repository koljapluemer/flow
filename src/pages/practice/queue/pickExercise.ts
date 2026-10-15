import type { ExerciseCardRow, GestaltRow } from '@/db/db'
import { pickRandom } from '@/dumb/pickRandom'
import { logger } from '@/dumb/log'
import type { Exercise, ExerciseType } from '@/entities/exercise/exercise'
import { exerciseTypesFor } from './exerciseRegistry'
import type { QueueState } from './queueState'

const log = logger('exercise')

export type ExercisePick = { type: ExerciseType; exercise: Exercise }

function isFresh(card: ExerciseCardRow | undefined, now: Date): boolean {
  return !card || card.due <= now
}

// Picks the best fitting exercise of the gestalt, preferring unseen or due ones.
export function pickExercise(gestalt: GestaltRow, state: QueueState): ExercisePick | null {
  const gestaltCard = state.gestaltCards.get(gestalt.id)
  const scored = exerciseTypesFor(gestalt.kind, state.online).flatMap((type) =>
    type.variants(gestalt).map((exercise) => ({
      type,
      exercise,
      fit: type.fit(exercise, gestaltCard),
      fresh: isFresh(state.exerciseCards.get(exercise.id), state.now)
    }))
  )
  log('%s: %o', gestalt.id, scored.map((entry) => `${entry.exercise.id} fit=${entry.fit}${entry.fresh ? ' fresh' : ''}`))

  const fitting = scored.filter((entry) => entry.fit > 0)
  const preferred = fitting.some((entry) => entry.fresh) ? fitting.filter((entry) => entry.fresh) : fitting
  const bestFit = Math.max(...preferred.map((entry) => entry.fit))
  const pick = pickRandom(preferred.filter((entry) => entry.fit === bestFit))
  log('chose %s', pick?.exercise.id)
  return pick ? { type: pick.type, exercise: pick.exercise } : null
}

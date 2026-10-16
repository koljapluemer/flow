import type { ExerciseCardRow, GestaltRow } from '@/db/db'
import { pickRandom } from '@/dumb/pickRandom'
import { logger } from '@/dumb/log'
import type { Exercise, ExerciseStyle, ExerciseType } from '@/entities/exercise/exercise'
import { exerciseTypesInStyle } from './exerciseRegistry'
import { progressOf, type QueueState } from './queueState'

const log = logger('exercise')

export type ExercisePick = { type: ExerciseType; exercise: Exercise }

function isFresh(card: ExerciseCardRow | undefined, now: Date): boolean {
  return !card || card.due <= now
}

// Picks the best fitting exercise of the gestalt in the style, preferring unseen or due ones.
export function pickExercise(gestalt: GestaltRow, state: QueueState, style: ExerciseStyle): ExercisePick | null {
  const progress = progressOf(state, gestalt.id)
  const scored = exerciseTypesInStyle(gestalt.kind, state.online, style).flatMap((type) =>
    type.variants(gestalt).map((exercise) => ({
      type,
      exercise,
      fit: type.fit(exercise, progress, state.context),
      fresh: isFresh(state.exerciseCards.get(exercise.id), state.now)
    }))
  )
  log('%s (%s): %o', gestalt.id, style, scored.map((entry) => `${entry.exercise.id} fit=${entry.fit}${entry.fresh ? ' fresh' : ''}`))

  const fitting = scored.filter((entry) => entry.fit > 0)
  const preferred = fitting.some((entry) => entry.fresh) ? fitting.filter((entry) => entry.fresh) : fitting
  const bestFit = Math.max(...preferred.map((entry) => entry.fit))
  const pick = pickRandom(preferred.filter((entry) => entry.fit === bestFit))
  log('chose %s', pick?.exercise.id)
  return pick ? { type: pick.type, exercise: pick.exercise } : null
}

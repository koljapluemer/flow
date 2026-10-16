import { Rating, type Grade } from 'ts-fsrs'
import { logger } from '@/dumb/log'
import { reviewExerciseCard, type Exercise, type ExerciseResult } from '@/entities/exercise/exercise'
import { answerExplanation } from '@/entities/explanation/explanation'
import { reviewGestaltCards } from '@/entities/gestalt-card/gestaltCard'
import { maybeSpawnRepairGoals } from './goals/goalLifecycle'
import type { QueueState } from './queueState'

const log = logger('rate')

// Reviews the exercise and all gestalts it belongs to with the same grade.
async function rateExercise(exercise: Exercise, rating: Grade, state: QueueState): Promise<void> {
  const now = new Date()
  await reviewExerciseCard(exercise.id, rating, now)
  const cards = await reviewGestaltCards(exercise.gestaltIds, rating, now)
  log('%s: %s, due %o', exercise.id, Rating[rating], cards.map((card) => `${card.id} ${card.due.toISOString()}`))
  if (rating === Rating.Again || rating === Rating.Hard) await maybeSpawnRepairGoals(state, exercise.gestaltIds, now)
}

// Grades go to FSRS; answers to explanatory videos are stored as they are.
export async function recordResult(exercise: Exercise, result: ExerciseResult, state: QueueState): Promise<void> {
  if (typeof result === 'number') return rateExercise(exercise, result, state)
  await answerExplanation(exercise.contentId, result)
  log('%s: %s', exercise.id, result)
}

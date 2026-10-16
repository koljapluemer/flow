import type { GestaltCardRow, GoalRow } from '@/db/db'
import { lastRatedCorrect } from '@/entities/gestalt-card/gestaltCard'
import { relatedOf, type QueueState } from '../queueState'
import { CHALLENGE_MIN_PRACTICED } from '../tuning'
import { reviewedSince } from './repairGoal'

// Challenge goal: prepare each vocab of a guess-once sentence until it was last
// remembered and is not due, practicing at least a few of them, then show the
// sentence once.

function isReady(card: GestaltCardRow | undefined, now: Date): boolean {
  return card !== undefined && card.due > now && lastRatedCorrect(card)
}

function dueTime(state: QueueState, id: string): number {
  return state.gestaltCards.get(id)?.due.getTime() ?? 0
}

// Ready vocab not practiced during the goal, earliest due first, as many as are missing to the minimum.
function extraPractice(goal: GoalRow, state: QueueState, related: string[], notReady: string[]): string[] {
  const unpracticed = related.filter((id) => !reviewedSince(state.gestaltCards.get(id), goal.createdAt))
  const practiced = related.length - unpracticed.length
  const upcoming = unpracticed.filter((id) => notReady.includes(id)).length
  const missing = Math.min(CHALLENGE_MIN_PRACTICED, related.length) - practiced - upcoming
  if (missing <= 0) return []
  return unpracticed
    .filter((id) => !notReady.includes(id))
    .sort((a, b) => dueTime(state, a) - dueTime(state, b))
    .slice(0, missing)
}

export function challengeWanted(goal: GoalRow, state: QueueState): string[] {
  const related = relatedOf(state, goal.target)
  const notReady = related.filter((id) => !isReady(state.gestaltCards.get(id), state.now))
  return [...notReady, ...extraPractice(goal, state, related, notReady)]
}

export function challengeProgress(goal: GoalRow, state: QueueState): { ready: number; total: number } {
  const related = relatedOf(state, goal.target)
  const ready = related.filter((id) => isReady(state.gestaltCards.get(id), state.now)).length
  return { ready, total: related.length }
}

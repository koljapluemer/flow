import type { GestaltCardRow, GoalRow } from '@/db/db'
import { relatedOf, type QueueState } from '../queueState'

// Repair goal: after a composite gestalt was failed, practice each of its
// related gestalts once.

function reviewedSince(card: GestaltCardRow | undefined, since: Date): boolean {
  return card?.last_review !== undefined && card.last_review >= since
}

export function repairWanted(goal: GoalRow, state: QueueState): string[] {
  return relatedOf(state, goal.target).filter((id) => !reviewedSince(state.gestaltCards.get(id), goal.createdAt))
}

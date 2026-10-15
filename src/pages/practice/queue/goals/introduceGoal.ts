import type { GestaltCardRow, GestaltRow, GoalRow, SnippetRow } from '@/db/db'
import { pickRandom } from '@/dumb/pickRandom'
import { gestaltId } from '@/entities/gestalt/gestalt'
import { relatedOf, type QueueState } from '../queueState'
import { INTRODUCE_THRESHOLD } from '../tuning'

// Introduce goal: practice the target's related gestalts until enough of them
// are introduced and not due, then introduce the target.

function isReady(card: GestaltCardRow | undefined, now: Date): boolean {
  return card !== undefined && card.due > now
}

export function introduceWanted(goal: GoalRow, state: QueueState): string[] {
  return relatedOf(state, goal.target).filter((id) => !isReady(state.gestaltCards.get(id), state.now))
}

export function introduceProgress(goal: GoalRow, state: QueueState): { ready: number; total: number } {
  const total = relatedOf(state, goal.target).length
  return { ready: total - introduceWanted(goal, state).length, total }
}

export function isIntroduceDone(goal: GoalRow, state: QueueState): boolean {
  const { ready, total } = introduceProgress(goal, state)
  return total === 0 || ready / total >= INTRODUCE_THRESHOLD
}

// Snippets of a video are introduced in order: only the first unseen one is a candidate.
function firstUnseenSnippets(state: QueueState): Set<string> {
  const firstByVideo = new Map<string, SnippetRow>()
  for (const gestalt of state.context.gestalts.values()) {
    const snippet = state.context.snippets.get(gestalt.contentId)
    if (gestalt.kind !== 'snippet' || !snippet || state.gestaltCards.has(gestalt.id)) continue
    const first = firstByVideo.get(snippet.videoId)
    if (!first || snippet.index < first.index) firstByVideo.set(snippet.videoId, snippet)
  }
  return new Set([...firstByVideo.values()].map((snippet) => gestaltId('snippet', snippet.id)))
}

// Composite gestalts that are not introduced and not yet targeted.
function introduceCandidates(state: QueueState): GestaltRow[] {
  const targeted = new Set(state.goals.map((goal) => goal.target))
  const firstSnippets = firstUnseenSnippets(state)
  return [...state.context.gestalts.values()]
    .filter((gestalt) => gestalt.kind !== 'vocab' && !state.gestaltCards.has(gestalt.id) && !targeted.has(gestalt.id))
    .filter((gestalt) => gestalt.kind !== 'snippet' || firstSnippets.has(gestalt.id))
}

// Picks a random kind first, so rare kinds (few snippets, many sentences) get their turn.
export function pickIntroduceTarget(state: QueueState): string | undefined {
  const candidates = introduceCandidates(state)
  const kind = pickRandom([...new Set(candidates.map((gestalt) => gestalt.kind))])
  return pickRandom(candidates.filter((gestalt) => gestalt.kind === kind))?.id
}

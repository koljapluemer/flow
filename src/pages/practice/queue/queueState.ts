import type { ExerciseCardRow, GestaltCardRow, GoalRow } from '@/db/db'
import { getExerciseCards, type ExerciseContext } from '@/entities/exercise/exercise'
import { getGestaltsInTopics } from '@/entities/gestalt/gestalt'
import { getGestaltCards } from '@/entities/gestalt-card/gestaltCard'
import { getGoals } from '@/entities/goal/goal'
import { getSentences } from '@/entities/sentence/sentence'
import { getSnippets } from '@/entities/snippet/snippet'
import { getVocab } from '@/entities/vocab/vocab'
import { isKindAvailable } from './exerciseRegistry'

// Everything one queue step looks at. `context.gestalts` holds only gestalts
// of the selected topics that can currently be practiced.
export type QueueState = {
  now: Date
  online: boolean
  context: ExerciseContext
  gestaltCards: Map<string, GestaltCardRow>
  exerciseCards: Map<string, ExerciseCardRow>
  goals: GoalRow[]
}

export async function loadQueueState(topicIds: string[], online: boolean): Promise<QueueState> {
  const [gestalts, vocab, sentences, snippets, gestaltCards, exerciseCards, goals] = await Promise.all([
    getGestaltsInTopics(topicIds),
    getVocab(),
    getSentences(),
    getSnippets(),
    getGestaltCards(),
    getExerciseCards(),
    getGoals()
  ])
  const available = new Map([...gestalts].filter(([, gestalt]) => isKindAvailable(gestalt.kind, online)))
  return {
    now: new Date(),
    online,
    context: { vocab, sentences, snippets, gestalts: available },
    gestaltCards,
    exerciseCards,
    goals
  }
}

export function isDue(card: GestaltCardRow | undefined, now: Date): boolean {
  return card !== undefined && card.due <= now
}

// Related gestalts that are currently available.
export function relatedOf(state: QueueState, gestaltId: string): string[] {
  const related = state.context.gestalts.get(gestaltId)?.relatedIds ?? []
  return related.filter((id) => state.context.gestalts.has(id))
}

import type { ExerciseCardRow, ExplanationProgressRow, GestaltCardRow, GoalRow } from '@/db/db'
import { getExerciseCards, type ExerciseContext } from '@/entities/exercise/exercise'
import { getExplanationProgress } from '@/entities/explanation/explanation'
import { getGestaltsInTopics } from '@/entities/gestalt/gestalt'
import { getGestaltCards } from '@/entities/gestalt-card/gestaltCard'
import { getGoals } from '@/entities/goal/goal'
import { getSentences } from '@/entities/sentence/sentence'
import { getSnippets } from '@/entities/snippet/snippet'
import { getVideos } from '@/entities/video/video'
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
  explanationProgress: Map<string, ExplanationProgressRow>
  goals: GoalRow[]
}

export async function loadQueueState(topicIds: string[], online: boolean): Promise<QueueState> {
  const [gestalts, vocab, sentences, videos, snippets, gestaltCards, exerciseCards, explanationProgress, goals] =
    await Promise.all([
      getGestaltsInTopics(topicIds),
      getVocab(),
      getSentences(),
      getVideos(),
      getSnippets(),
      getGestaltCards(),
      getExerciseCards(),
      getExplanationProgress(),
      getGoals()
    ])
  const available = new Map([...gestalts].filter(([, gestalt]) => isKindAvailable(gestalt.kind, online)))
  return {
    now: new Date(),
    online,
    context: { vocab, sentences, videos, snippets, gestalts: available },
    gestaltCards,
    exerciseCards,
    explanationProgress,
    goals
  }
}

// Explanations are scheduled by their answers, all other gestalts by FSRS cards.
function explanationProgressOf(state: QueueState, gestaltId: string): ExplanationProgressRow | undefined {
  const gestalt = state.context.gestalts.get(gestaltId)
  return gestalt?.kind === 'explanation' ? state.explanationProgress.get(gestalt.contentId) : undefined
}

export function isIntroduced(state: QueueState, gestaltId: string): boolean {
  return state.gestaltCards.has(gestaltId) || explanationProgressOf(state, gestaltId) !== undefined
}

export function isDue(state: QueueState, gestaltId: string): boolean {
  const progress = explanationProgressOf(state, gestaltId)
  if (progress) return progress.answer === 'later' && progress.due <= state.now
  const card = state.gestaltCards.get(gestaltId)
  return card !== undefined && card.due <= state.now
}

// Related gestalts that are currently available.
export function relatedOf(state: QueueState, gestaltId: string): string[] {
  const related = state.context.gestalts.get(gestaltId)?.relatedIds ?? []
  return related.filter((id) => state.context.gestalts.has(id))
}
